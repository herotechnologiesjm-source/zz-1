import React, { useState, useMemo, useEffect } from 'react';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { WindowsMenuBar } from './components/WindowsMenuBar';
import { WindowsCommandBar } from './components/WindowsCommandBar';
import { WindowsSidebar } from './components/WindowsSidebar';
import { WindowsStatusBar } from './components/WindowsStatusBar';
import { WindowsContextMenu } from './components/WindowsContextMenu';
import { WindowsPropertiesDialog } from './components/WindowsPropertiesDialog';
import { WindowsConfirmDialog } from './components/WindowsConfirmDialog';
import { ProcessTable } from './components/ProcessTable';
import { InstallationAuditView } from './components/InstallationAuditView';
import { HookGuideView } from './components/HookGuideView';
import { AuditLogView } from './components/AuditLogDrawer';
import { PowerShellAgentModal } from './components/PowerShellAgentModal';
import { CustomHookModal } from './components/CustomHookModal';
import { DotNetSuiteView } from './components/DotNetSuiteView';
import { RawDataExplorerView } from './components/RawDataExplorerView';
import { ExploitMonitorView } from './components/ExploitMonitorView';
import { INITIAL_PROCESSES } from './data/initialHooks';
import {
  HookedProcess,
  FilterCategory,
  StatusFilter,
  DateFilter,
  AuditLogEntry,
  DefensePolicyConfig,
  ExploitVector,
  ExploitAttempt,
  AppNavTab
} from './types/inspector';
import { generateBatchScript } from './utils/powershellScript';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('winhook_theme') as 'dark' | 'light') || 'dark';
  });

  const [processes, setProcesses] = useState<HookedProcess[]>(() => {
    const saved = localStorage.getItem('winhook_processes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_PROCESSES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    return [
      {
        id: 'log-0',
        timestamp: new Date().toLocaleTimeString(),
        action: 'import',
        processName: 'System Subsystem & Win32 API Engine',
        pid: 4,
        details: 'Initial Windows hook inspection complete. 9 intercepted processes identified.'
      }
    ];
  });

  const [activeTab, setActiveTab] = useState<AppNavTab>('grid');
  const [defensePolicy, setDefensePolicy] = useState<DefensePolicyConfig>(() => {
    return {
      action: 'auto_suspend',
      enabledVectors: {
        raw_input_abuse: true,
        dll_injection_inline: true,
        screen_scraping_framebuffer: true,
        direct_memory_inspection: true
      },
      playAlertSound: true,
      logToEventViewer: true
    };
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'name' | 'pid' | 'installedDate' | 'hooks' | 'memory'>('installedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals & Dialogs
  const [propertiesProcess, setPropertiesProcess] = useState<HookedProcess | null>(null);
  const [confirmKillProcess, setConfirmKillProcess] = useState<HookedProcess | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isCustomHookModalOpen, setIsCustomHookModalOpen] = useState(false);

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    process: HookedProcess;
  } | null>(null);

  // Save theme to localStorage and body class
  useEffect(() => {
    localStorage.setItem('winhook_theme', theme);
    document.body.className = theme === 'dark' ? 'theme-dark bg-[#121212] text-[#cccccc]' : 'theme-light bg-[#e8e8e8] text-[#1a1a1a]';
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateProcessesState = (newProcesses: HookedProcess[]) => {
    setProcesses(newProcesses);
    try {
      localStorage.setItem('winhook_processes', JSON.stringify(newProcesses));
    } catch (e) {
      // ignore quota
    }
  };

  const addAuditEntry = (action: AuditLogEntry['action'], processName: string, pid: number, details: string) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      action,
      processName,
      pid,
      details
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Currently focused process (for CommandBar and shortcut actions)
  const currentSelectedProcess = useMemo(() => {
    if (selectedIds.length === 0) return null;
    return processes.find((p) => p.id === selectedIds[0]) || null;
  }, [selectedIds, processes]);

  // Process Actions: Suspend (Freeze), Resume, Terminate, Restore
  const handleFreezeProcess = (proc: HookedProcess) => {
    const updated = processes.map((p) => {
      if (p.id === proc.id) {
        return {
          ...p,
          status: 'frozen' as const,
          cpuPercent: 0,
          suspendedAt: new Date().toLocaleTimeString()
        };
      }
      return p;
    });

    updateProcessesState(updated);
    addAuditEntry('freeze', proc.name, proc.pid, `Process suspended via NtSuspendProcess. ${proc.threadsCount} threads halted.`);
    setStatusMessage(`Suspended ${proc.name} (PID: ${proc.pid}): All threads halted.`);

    if (propertiesProcess?.id === proc.id) {
      setPropertiesProcess((prev) => prev ? { ...prev, status: 'frozen', cpuPercent: 0 } : null);
    }
  };

  const handleResumeProcess = (proc: HookedProcess) => {
    const updated = processes.map((p) => {
      if (p.id === proc.id) {
        return {
          ...p,
          status: 'active' as const,
          cpuPercent: 0.5,
          suspendedAt: undefined
        };
      }
      return p;
    });

    updateProcessesState(updated);
    addAuditEntry('resume', proc.name, proc.pid, `Process resumed via NtResumeProcess. Execution restored.`);
    setStatusMessage(`Resumed ${proc.name} (PID: ${proc.pid}): Thread execution restored.`);

    if (propertiesProcess?.id === proc.id) {
      setPropertiesProcess((prev) => prev ? { ...prev, status: 'active', cpuPercent: 0.5 } : null);
    }
  };

  const handlePromptTerminate = (proc: HookedProcess) => {
    setConfirmKillProcess(proc);
  };

  const handleConfirmTerminate = () => {
    if (!confirmKillProcess) return;
    const proc = confirmKillProcess;

    const updated = processes.map((p) => {
      if (p.id === proc.id) {
        return {
          ...p,
          status: 'terminated' as const,
          memoryMb: 0,
          cpuPercent: 0,
          terminatedAt: new Date().toLocaleTimeString()
        };
      }
      return p;
    });

    updateProcessesState(updated);
    addAuditEntry('terminate', proc.name, proc.pid, `Ended process via taskkill /F. Hooks detached.`);
    setStatusMessage(`Ended task ${proc.name} (PID: ${proc.pid}): Memory unmapped and hooks released.`);
    setConfirmKillProcess(null);

    if (propertiesProcess?.id === proc.id) {
      setPropertiesProcess((prev) => prev ? { ...prev, status: 'terminated', memoryMb: 0, cpuPercent: 0 } : null);
    }
  };

  const handleRestoreProcess = (proc: HookedProcess) => {
    const initial = INITIAL_PROCESSES.find((p) => p.id === proc.id);
    const updated = processes.map((p) => {
      if (p.id === proc.id) {
        return initial || {
          ...p,
          status: 'active' as const,
          memoryMb: 35.0,
          cpuPercent: 0.4
        };
      }
      return p;
    });

    updateProcessesState(updated);
    addAuditEntry('reset', proc.name, proc.pid, `Restored simulated process state.`);
    setStatusMessage(`Restored simulated state for ${proc.name}.`);

    if (propertiesProcess?.id === proc.id) {
      setPropertiesProcess((prev) => prev ? { ...prev, status: 'active', memoryMb: 35.0, cpuPercent: 0.4 } : null);
    }
  };

  const handleSimulateExploit = (vector: ExploitVector, targetProcId?: string) => {
    let target = processes.find((p) => p.id === targetProcId) ||
                 processes.find((p) => p.threatCategory === 'suspicious_unverified') ||
                 processes[0];

    if (!target) return;

    let vectorTitle = '';
    let targetApi = '';
    let targetEntity = '';
    let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'CRITICAL';
    let description = '';
    let rawCallParameters: Record<string, string | number> = {};

    switch (vector) {
      case 'raw_input_abuse':
        vectorTitle = 'Windows Raw Input API Abuse (Background Sink)';
        targetApi = 'user32.dll!RegisterRawInputDevices';
        targetEntity = 'Keyboard HID (UsagePage 0x01, Usage 0x06)';
        severity = 'CRITICAL';
        description = 'Process called RegisterRawInputDevices with RIDEV_INPUTSINK (0x00000100) to snoop background keystrokes without window focus.';
        rawCallParameters = {
          usUsagePage: '0x0001 (Generic Desktop)',
          usUsage: '0x0006 (Keyboard)',
          dwFlags: '0x00000100 (RIDEV_INPUTSINK)',
          hwndTarget: `0x${((target.pid * 17) & 0xFFFF).toString(16).toUpperCase().padStart(8, '0')}`
        };
        break;

      case 'dll_injection_inline':
        vectorTitle = 'DLL Injection & JMP Prologue Overwrite';
        targetApi = 'kernel32.dll!CreateRemoteThread';
        targetEntity = 'explorer.exe -> ntdll!NtProtectVirtualMemory';
        severity = 'CRITICAL';
        description = 'Allocated RWX memory inside target address space, wrote 5-byte JMP detour (0xE9 trampoline) and spawned remote execution thread.';
        rawCallParameters = {
          hProcess: '0x000003AC (explorer.exe)',
          lpBaseAddress: '0x00410000',
          dwSize: '4096 bytes',
          flProtect: '0x40 (PAGE_EXECUTE_READWRITE)',
          flAllocationType: '0x3000 (MEM_COMMIT | MEM_RESERVE)',
          Opcode: '0xE9 (JMP Relative Trampoline)'
        };
        break;

      case 'screen_scraping_framebuffer':
        vectorTitle = 'Screen Scraping & Framebuffer Polling Loop';
        targetApi = 'gdi32.dll!BitBlt';
        targetEntity = 'GetDC(NULL) [Primary Desktop Surface]';
        severity = 'HIGH';
        description = 'Continuous 60 FPS polling of desktop framebuffer into memory bitmap DC, intercepting visual screen buffer without elevation.';
        rawCallParameters = {
          hdcDest: '0x2A010892 (Compatible MemDC)',
          hdcSrc: '0x01010014 (GetDC(NULL) Desktop)',
          cx: '2560',
          cy: '1440',
          rop: '0x00CC0020 (SRCCOPY)'
        };
        break;

      case 'direct_memory_inspection':
        vectorTitle = 'Direct Virtual Memory Inspection';
        targetApi = 'kernel32.dll!ReadProcessMemory';
        targetEntity = 'Target: chrome.exe (PID: 4892) -> Heap 0x00400000';
        severity = 'CRITICAL';
        description = 'Opened process with PROCESS_VM_READ (0x0010) rights and scanned private virtual memory regions searching for credentials.';
        rawCallParameters = {
          hProcess: '0x00000418 (chrome.exe)',
          lpBaseAddress: '0x00400000',
          nSize: '65536 bytes',
          dwDesiredAccess: '0x0030 (PROCESS_VM_READ | PROCESS_VM_OPERATION)'
        };
        break;
    }

    const newAttempt: ExploitAttempt = {
      id: `expl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      vector,
      vectorTitle,
      processId: target.id,
      processName: target.name,
      pid: target.pid,
      targetApi,
      targetEntity,
      severity,
      description,
      rawCallParameters,
      status: 'detected'
    };

    let newStatus = target.status;
    let autoActionDetails = '';
    const isShieldEnabled = defensePolicy.enabledVectors[vector];

    if (isShieldEnabled && target.status !== 'terminated') {
      if (defensePolicy.action === 'auto_suspend') {
        newStatus = 'frozen';
        newAttempt.status = 'suspended';
        autoActionDetails = 'AUTO-SUSPENDED all threads via NtSuspendProcess.';
        addAuditEntry(
          'auto_defense',
          target.name,
          target.pid,
          `[Sentinel Auto-Defense] Suspended process via NtSuspendProcess on ${vectorTitle}.`
        );
      } else if (defensePolicy.action === 'auto_kill') {
        newStatus = 'terminated';
        newAttempt.status = 'killed';
        autoActionDetails = 'AUTO-TERMINATED via TerminateProcess.';
        addAuditEntry(
          'auto_defense',
          target.name,
          target.pid,
          `[Sentinel Auto-Defense] Terminated process via taskkill /F on ${vectorTitle}.`
        );
      } else {
        addAuditEntry(
          'exploit_detected',
          target.name,
          target.pid,
          `[Exploit Intercepted] ${vectorTitle} by ${target.name} (PID: ${target.pid}). Alert logged.`
        );
      }
    }

    const updated = processes.map((p) => {
      if (p.id === target.id) {
        const existingVectors = p.detectedExploitVectors || [];
        const updatedVectors = existingVectors.includes(vector) ? existingVectors : [...existingVectors, vector];
        const existingAttempts = p.exploitAttempts || [];
        return {
          ...p,
          status: newStatus,
          cpuPercent: newStatus === 'frozen' || newStatus === 'terminated' ? 0 : p.cpuPercent,
          memoryMb: newStatus === 'terminated' ? 0 : p.memoryMb,
          detectedExploitVectors: updatedVectors,
          exploitAttempts: [newAttempt, ...existingAttempts],
          threatScore: Math.min(100, (p.threatScore || 30) + 20)
        };
      }
      return p;
    });

    updateProcessesState(updated);

    setStatusMessage(
      `[Exploit Sentinel] Intercepted ${vectorTitle} on ${target.name} (PID: ${target.pid}). ${autoActionDetails}`
    );
  };

  const handleClearExploitHistory = () => {
    const updated = processes.map((p) => ({
      ...p,
      exploitAttempts: [],
      threatScore: p.threatCategory === 'suspicious_unverified' ? 80 : 10
    }));
    updateProcessesState(updated);
    addAuditEntry('reset', 'Exploit Sentinel Engine', 0, 'Exploit incident telemetry cleared.');
    setStatusMessage('Exploit telemetry history cleared.');
  };

  // Context Menu trigger
  const handleContextMenu = (e: React.MouseEvent, proc: HookedProcess) => {
    e.preventDefault();
    if (!selectedIds.includes(proc.id)) {
      setSelectedIds([proc.id]);
    }
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      process: proc
    });
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setStatusMessage(`Copied ${label} to clipboard: "${text}"`);
  };

  // Bulk Operations
  const handleExportCsv = () => {
    const headers = [
      'PID',
      'Name',
      'Status',
      'Publisher',
      'Digital Signature',
      'Installed Date',
      'Days Ago',
      'Install Location',
      'Registry Key',
      'Hook Count',
      'Hooked Windows APIs',
      'Memory MB'
    ];

    const rows = processes.map((p) => [
      p.pid,
      `"${p.name}"`,
      p.status,
      `"${p.publisher}"`,
      p.isSigned ? 'Signed' : 'Unsigned',
      p.installation.installedDate,
      p.installation.daysAgo,
      `"${p.installation.installLocation.replace(/"/g, '""')}"`,
      `"${p.installation.registryKey || ''}"`,
      p.hooks.length,
      `"${p.hooks.map((h) => `${h.targetModule}!${h.targetApi}`).join('; ')}"`,
      p.memoryMb
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `winhook_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Exported security audit data to CSV.');
  };

  const handleDownloadBatchScript = () => {
    const activeProcs = processes.filter((p) => p.status !== 'terminated').map((p) => ({ pid: p.pid, name: p.name }));
    const script = generateBatchScript(activeProcs, 'terminate');
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'terminate_hooked_processes.bat';
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Downloaded terminate_hooked_processes.bat script.');
  };

  const handleResetBaseline = () => {
    localStorage.removeItem('winhook_processes');
    setProcesses(INITIAL_PROCESSES);
    setSelectedIds([]);
    addAuditEntry('reset', 'System Baseline', 0, 'Reset telemetry to default factory baseline.');
    setStatusMessage('Reset process list to Windows default baseline.');
  };

  const handleAddCustomProcess = (newProc: HookedProcess) => {
    const updated = [newProc, ...processes];
    updateProcessesState(updated);
    addAuditEntry('add_hook', newProc.name, newProc.pid, `Added custom hooked program (${newProc.hooks[0]?.targetApi})`);
    setStatusMessage(`Registered program ${newProc.name} (PID: ${newProc.pid}) with active hook.`);
  };

  const handleImportScanData = (imported: HookedProcess[]) => {
    updateProcessesState(imported);
    addAuditEntry('import', 'PowerShell Host Scanner', 0, `Imported ${imported.length} processes from Windows audit scan.`);
    setStatusMessage(`Loaded ${imported.length} hooked processes from Windows scan JSON.`);
  };

  // Keyboard navigation & Shortcuts (Del -> End task, F4 -> Suspend, F5 -> Resume)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'Delete' && currentSelectedProcess && currentSelectedProcess.status !== 'terminated') {
        e.preventDefault();
        handlePromptTerminate(currentSelectedProcess);
      } else if (e.key === 'F4' && currentSelectedProcess && currentSelectedProcess.status === 'active') {
        e.preventDefault();
        handleFreezeProcess(currentSelectedProcess);
      } else if (e.key === 'F5' && currentSelectedProcess && currentSelectedProcess.status === 'frozen') {
        e.preventDefault();
        handleResumeProcess(currentSelectedProcess);
      } else if (e.altKey && e.key === 'Enter' && currentSelectedProcess) {
        e.preventDefault();
        setPropertiesProcess(currentSelectedProcess);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSelectedProcess]);

  // Selection toggle
  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e && (e.ctrlKey || e.metaKey)) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredProcesses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProcesses.map((p) => p.id));
    }
  };

  const handleSortChange = (field: 'name' | 'pid' | 'installedDate' | 'hooks' | 'memory') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & Search Logic
  const filteredProcesses = useMemo(() => {
    return processes
      .filter((proc) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = proc.name.toLowerCase().includes(q);
          const matchPid = proc.pid.toString().includes(q);
          const matchPath = proc.executablePath.toLowerCase().includes(q);
          const matchPub = proc.publisher.toLowerCase().includes(q);
          const matchHooks = proc.hooks.some(
            (h) =>
              h.targetApi.toLowerCase().includes(q) ||
              h.targetModule.toLowerCase().includes(q) ||
              h.hookingModule.toLowerCase().includes(q)
          );
          if (!matchName && !matchPid && !matchPath && !matchPub && !matchHooks) {
            return false;
          }
        }

        if (categoryFilter === 'input') {
          const isInput = proc.threatCategory === 'input_monitor' ||
            proc.hooks.some((h) => h.targetApi.includes('KEYBOARD') || h.targetApi.includes('MOUSE') || h.targetApi.includes('GetAsyncKeyState'));
          if (!isInput) return false;
        } else if (categoryFilter === 'graphics') {
          const isGraphics = proc.threatCategory === 'overlay_graphics' ||
            proc.hooks.some((h) => h.targetModule.includes('d3d') || h.targetModule.includes('dxgi') || h.targetModule.includes('vulkan'));
          if (!isGraphics) return false;
        } else if (categoryFilter === 'network') {
          const isNet = proc.hooks.some((h) => h.targetModule.includes('ws2') || h.hookType.includes('WFP'));
          if (!isNet) return false;
        } else if (categoryFilter === 'suspicious') {
          if (proc.threatCategory !== 'suspicious_unverified' && proc.isSigned) return false;
        } else if (categoryFilter === 'exploits') {
          if (!proc.detectedExploitVectors || proc.detectedExploitVectors.length === 0) return false;
        }

        if (statusFilter !== 'all' && proc.status !== statusFilter) {
          return false;
        }

        if (dateFilter === 'last7' && proc.installation.daysAgo > 7) return false;
        if (dateFilter === 'last30' && proc.installation.daysAgo > 30) return false;
        if (dateFilter === 'last90' && proc.installation.daysAgo > 90) return false;
        if (dateFilter === 'older' && proc.installation.daysAgo <= 90) return false;

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortField === 'pid') {
          comparison = a.pid - b.pid;
        } else if (sortField === 'installedDate') {
          comparison = new Date(a.installation.installedDate).getTime() - new Date(b.installation.installedDate).getTime();
        } else if (sortField === 'hooks') {
          comparison = a.hooks.length - b.hooks.length;
        } else if (sortField === 'memory') {
          comparison = a.memoryMb - b.memoryMb;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [processes, searchQuery, categoryFilter, statusFilter, dateFilter, sortField, sortOrder]);

  const activeHooksCount = processes.reduce((acc, p) => acc + (p.status !== 'terminated' ? p.hooks.length : 0), 0);
  const frozenCount = processes.filter((p) => p.status === 'frozen').length;
  const terminatedCount = processes.filter((p) => p.status === 'terminated').length;
  const totalMemory = processes.reduce((acc, p) => acc + (p.status !== 'terminated' ? p.memoryMb : 0), 0);
  const totalExploitsCount = processes.reduce((acc, p) => acc + (p.exploitAttempts?.length || 0), 0);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-0 md:p-3 transition-colors ${
        theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-[#e5e5e5]'
      }`}
    >
      {/* Windows Native Application Window Frame */}
      <div
        className={`w-full flex-1 flex flex-col rounded-none md:rounded-lg border shadow-2xl overflow-hidden transition-all ${
          isMaximized ? 'fixed inset-0 z-40 rounded-none' : 'max-w-[1520px] min-h-[92vh]'
        } ${
          theme === 'dark'
            ? 'bg-[#181818] text-[#cccccc] border-[#333333] shadow-black/80'
            : 'bg-[#ffffff] text-[#1c1c1c] border-[#cccccc] shadow-neutral-500/30'
        }`}
      >
        {/* Windows Native Title Bar with Caption Controls */}
        <WindowsTitleBar
          isMaximized={isMaximized}
          onToggleMaximize={() => setIsMaximized((prev) => !prev)}
          onMinimize={() => setStatusMessage('Application minimized to taskbar.')}
          onClose={() => setStatusMessage('To close the auditor, close this browser tab.')}
          theme={theme}
        />

        {/* Windows Menu Bar (File, Action, View, Options, Help) */}
        <WindowsMenuBar
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenAddModal={() => setIsCustomHookModalOpen(true)}
          onOpenImportModal={() => setIsAgentModalOpen(true)}
          onExportCsv={handleExportCsv}
          onDownloadBatchScript={handleDownloadBatchScript}
          onResetBaseline={handleResetBaseline}
          selectedCount={selectedIds.length}
          onEndTask={() => {
            if (currentSelectedProcess) handlePromptTerminate(currentSelectedProcess);
          }}
          onSuspend={() => {
            if (currentSelectedProcess) handleFreezeProcess(currentSelectedProcess);
          }}
          onResume={() => {
            if (currentSelectedProcess) handleResumeProcess(currentSelectedProcess);
          }}
          onOpenProperties={() => {
            if (currentSelectedProcess) setPropertiesProcess(currentSelectedProcess);
          }}
          onRefresh={() => setStatusMessage('Refreshed Windows process list and API hook handles.')}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          onOpenGuide={() => setActiveTab('guide')}
          onOpenDotNet={() => setActiveTab('dotnet')}
          onOpenRawData={() => setActiveTab('rawdata')}
          onOpenExploits={() => setActiveTab('exploits')}
        />

        {/* Windows 11 Fluent Command Bar (Ribbon Actions) */}
        <WindowsCommandBar
          theme={theme}
          onToggleTheme={toggleTheme}
          selectedProcess={currentSelectedProcess}
          onEndTask={() => {
            if (currentSelectedProcess) handlePromptTerminate(currentSelectedProcess);
          }}
          onSuspend={() => {
            if (currentSelectedProcess) handleFreezeProcess(currentSelectedProcess);
          }}
          onResume={() => {
            if (currentSelectedProcess) handleResumeProcess(currentSelectedProcess);
          }}
          onOpenProperties={() => {
            if (currentSelectedProcess) setPropertiesProcess(currentSelectedProcess);
          }}
          onOpenAddModal={() => setIsCustomHookModalOpen(true)}
          onRefresh={() => setStatusMessage('Refreshed telemetry.')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAgent={() => setIsAgentModalOpen(true)}
        />

        {/* Central Workspace: Windows 11 Task Manager Sidebar + Main Details View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Windows 11 Left Navigation Sidebar */}
          <WindowsSidebar
            theme={theme}
            activeTab={activeTab}
            onSelectTab={(tab) => {
              if (tab === 'agent') {
                setIsAgentModalOpen(true);
              } else {
                setActiveTab(tab);
              }
            }}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            auditCount={auditLogs.length}
            exploitCount={totalExploitsCount}
          />

          {/* Main Content Viewport */}
          <main
            className={`flex-1 p-3.5 overflow-y-auto ${
              theme === 'dark' ? 'bg-[#181818]' : 'bg-[#ffffff]'
            }`}
          >
            {/* Processes & Hooks ListView */}
            {activeTab === 'grid' && (
              <div className="space-y-3">
                {/* Windows 11 Fluent Metric Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 text-xs">
                  <div className={`p-2.5 rounded border ${theme === 'dark' ? 'bg-[#202020] border-[#2c2c2c]' : 'bg-[#f6f6f6] border-[#e0e0e0]'}`}>
                    <div className="text-[11px] opacity-70">Processes</div>
                    <div className="text-lg font-semibold font-mono tabular-nums mt-0.5">{processes.length}</div>
                  </div>
                  <div className={`p-2.5 rounded border ${theme === 'dark' ? 'bg-[#202020] border-[#2c2c2c]' : 'bg-[#f6f6f6] border-[#e0e0e0]'}`}>
                    <div className="text-[11px] opacity-70">Hooked APIs</div>
                    <div className="text-lg font-semibold font-mono tabular-nums text-[#0078d4] mt-0.5">{activeHooksCount}</div>
                  </div>
                  <div
                    onClick={() => setActiveTab('exploits')}
                    className={`p-2.5 rounded border cursor-pointer transition-colors ${
                      theme === 'dark'
                        ? 'bg-[#202020] border-[#2c2c2c] hover:border-rose-600/60'
                        : 'bg-[#f6f6f6] border-[#e0e0e0] hover:border-rose-600/60'
                    }`}
                    title="View Exploit Sentinel"
                  >
                    <div className="text-[11px] opacity-70 flex items-center justify-between">
                      <span>Exploits Intercepted</span>
                      <span className="text-[9px] text-rose-500 font-bold uppercase">Shield</span>
                    </div>
                    <div className="text-lg font-semibold font-mono tabular-nums text-rose-500 mt-0.5">
                      {totalExploitsCount}
                    </div>
                  </div>
                  <div className={`p-2.5 rounded border ${theme === 'dark' ? 'bg-[#202020] border-[#2c2c2c]' : 'bg-[#f6f6f6] border-[#e0e0e0]'}`}>
                    <div className="text-[11px] opacity-70">Suspended (Frozen)</div>
                    <div className="text-lg font-semibold font-mono tabular-nums text-sky-500 mt-0.5">{frozenCount}</div>
                  </div>
                  <div className={`p-2.5 rounded border ${theme === 'dark' ? 'bg-[#202020] border-[#2c2c2c]' : 'bg-[#f6f6f6] border-[#e0e0e0]'}`}>
                    <div className="text-[11px] opacity-70">Ended (Killed)</div>
                    <div className="text-lg font-semibold font-mono tabular-nums text-rose-500 mt-0.5">{terminatedCount}</div>
                  </div>
                  <div className={`p-2.5 rounded border ${theme === 'dark' ? 'bg-[#202020] border-[#2c2c2c]' : 'bg-[#f6f6f6] border-[#e0e0e0]'}`}>
                    <div className="text-[11px] opacity-70">Installed &lt; 30d</div>
                    <div className="text-lg font-semibold font-mono tabular-nums text-amber-500 mt-0.5">
                      {processes.filter((p) => p.installation.daysAgo <= 30).length}
                    </div>
                  </div>
                  <div className={`p-2.5 rounded border ${theme === 'dark' ? 'bg-[#202020] border-[#2c2c2c]' : 'bg-[#f6f6f6] border-[#e0e0e0]'}`}>
                    <div className="text-[11px] opacity-70">Total Memory</div>
                    <div className="text-lg font-semibold font-mono tabular-nums mt-0.5">{totalMemory.toFixed(0)} MB</div>
                  </div>
                </div>

                {/* Windows Native Listview Table */}
                <ProcessTable
                  theme={theme}
                  processes={filteredProcesses}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                  onFreezeProcess={handleFreezeProcess}
                  onResumeProcess={handleResumeProcess}
                  onTerminateProcess={handlePromptTerminate}
                  onRestoreProcess={handleRestoreProcess}
                  onInspectProcess={(proc) => setPropertiesProcess(proc)}
                  onContextMenu={handleContextMenu}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSortChange={handleSortChange}
                />
              </div>
            )}

            {/* Exploit & Threat Sentinel View */}
            {activeTab === 'exploits' && (
              <ExploitMonitorView
                theme={theme}
                processes={processes}
                defensePolicy={defensePolicy}
                onUpdateDefensePolicy={setDefensePolicy}
                onFreezeProcess={handleFreezeProcess}
                onResumeProcess={handleResumeProcess}
                onTerminateProcess={handlePromptTerminate}
                onInspectProcess={(proc) => setPropertiesProcess(proc)}
                onSimulateExploit={handleSimulateExploit}
                onClearExploitHistory={handleClearExploitHistory}
              />
            )}

            {/* Install Registry Audit */}
            {activeTab === 'installation' && (
              <InstallationAuditView
                theme={theme}
                processes={processes}
                onInspectProcess={(proc) => setPropertiesProcess(proc)}
                onFreezeProcess={handleFreezeProcess}
                onResumeProcess={handleResumeProcess}
                onTerminateProcess={handlePromptTerminate}
              />
            )}

            {/* Hook Mechanisms Manual */}
            {activeTab === 'guide' && <HookGuideView theme={theme} />}

            {/* .NET (C#) Desktop Suite */}
            {activeTab === 'dotnet' && <DotNetSuiteView theme={theme} />}

            {/* Raw Data & Telemetry Explorer */}
            {activeTab === 'rawdata' && <RawDataExplorerView theme={theme} processes={processes} />}

            {/* Event Viewer Logs */}
            {activeTab === 'audit' && (
              <AuditLogView
                theme={theme}
                entries={auditLogs}
                onClearLogs={() => setAuditLogs([])}
              />
            )}
          </main>
        </div>

        {/* Windows Multi-Pane Status Bar */}
        <WindowsStatusBar
          theme={theme}
          statusMessage={statusMessage}
          processCount={processes.length}
          hookCount={activeHooksCount}
          frozenCount={frozenCount}
          terminatedCount={terminatedCount}
          totalMemoryMb={totalMemory}
        />
      </div>

      {/* Windows Right-Click Context Menu */}
      {contextMenu && (
        <WindowsContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          process={contextMenu.process}
          theme={theme}
          onClose={() => setContextMenu(null)}
          onEndTask={(p) => handlePromptTerminate(p)}
          onSuspend={(p) => handleFreezeProcess(p)}
          onResume={(p) => handleResumeProcess(p)}
          onOpenProperties={(p) => setPropertiesProcess(p)}
          onCopyText={handleCopyText}
        />
      )}

      {/* Windows Native Tabbed Property Sheet Dialog */}
      <WindowsPropertiesDialog
        process={propertiesProcess}
        theme={theme}
        onClose={() => setPropertiesProcess(null)}
        onEndTask={(p) => handlePromptTerminate(p)}
        onSuspend={(p) => handleFreezeProcess(p)}
        onResume={(p) => handleResumeProcess(p)}
      />

      {/* Windows Native End Task Confirmation Dialog */}
      <WindowsConfirmDialog
        process={confirmKillProcess}
        theme={theme}
        onConfirm={handleConfirmTerminate}
        onCancel={() => setConfirmKillProcess(null)}
      />

      {/* PowerShell Live Host Scanner & JSON Importer */}
      <PowerShellAgentModal
        isOpen={isAgentModalOpen}
        theme={theme}
        onClose={() => setIsAgentModalOpen(false)}
        onImportScanData={handleImportScanData}
      />

      {/* Run New Task / Hook Simulator Dialog */}
      <CustomHookModal
        isOpen={isCustomHookModalOpen}
        theme={theme}
        onClose={() => setIsCustomHookModalOpen(false)}
        onAddProcess={handleAddCustomProcess}
      />
    </div>
  );
}
