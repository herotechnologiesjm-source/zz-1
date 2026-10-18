import { HookedProcess } from '../types/inspector';

// Calculate days ago relative to current date (2026-10-17)
const computeDaysAgo = (dateStr: string) => {
  const current = new Date('2026-10-17T12:00:00Z').getTime();
  const target = new Date(dateStr).getTime();
  const diffDays = Math.max(0, Math.round((current - target) / (1000 * 60 * 60 * 24)));
  return diffDays;
};

export const enrichWithRawData = (proc: any): HookedProcess => {
  const rawInstallDate = proc.installation?.installedDate ? proc.installation.installedDate.replace(/-/g, '') : '20260101';
  const hive = proc.installation?.installSource?.includes('HKLM') ? 'HKEY_LOCAL_MACHINE' : 'HKEY_CURRENT_USER';
  const estimatedSizeKb = Math.round((proc.memoryMb || 32) * 1024 * 1.4);

  const rawRegistryValues = proc.installation?.rawRegistryValues || {
    DisplayName: { type: 'REG_SZ' as const, value: proc.name.replace('.exe', '') },
    DisplayVersion: { type: 'REG_SZ' as const, value: proc.installation?.version || '1.0.0' },
    Publisher: { type: 'REG_SZ' as const, value: proc.publisher },
    InstallDate: { type: 'REG_SZ' as const, value: rawInstallDate },
    InstallLocation: { type: 'REG_SZ' as const, value: proc.installation?.installLocation || 'C:\\Program Files' },
    UninstallString: { type: 'REG_SZ' as const, value: proc.installation?.uninstallString || '' },
    EstimatedSize: { type: 'REG_DWORD' as const, value: estimatedSizeKb, hex: `0x${estimatedSizeKb.toString(16).toUpperCase().padStart(8, '0')}` },
    WindowsInstaller: { type: 'REG_DWORD' as const, value: proc.installation?.installerType?.includes('MSI') ? 1 : 0, hex: proc.installation?.installerType?.includes('MSI') ? '0x00000001' : '0x00000000' },
    NoModify: { type: 'REG_DWORD' as const, value: 1, hex: '0x00000001' },
    NoRepair: { type: 'REG_DWORD' as const, value: 1, hex: '0x00000001' }
  };

  const rawTelemetry = proc.rawTelemetry || {
    peMagic: 'PE32+ (x64)',
    imageBase: `0x00007FF7${((proc.pid || 1000) * 12345).toString(16).toUpperCase().padStart(8, '0')}`,
    entryPoint: `0x00007FF7${(((proc.pid || 1000) * 12345) + 0x1240).toString(16).toUpperCase().padStart(8, '0')}`,
    workingSetBytes: Math.round((proc.memoryMb || 32) * 1024 * 1024),
    privateBytes: Math.round((proc.memoryMb || 32) * 0.82 * 1024 * 1024),
    threadIds: Array.from({ length: Math.min(proc.threadsCount || 4, 8) }, (_, i) => (proc.pid || 1000) + (i + 1) * 4),
    handleCount: Math.round((proc.memoryMb || 32) * 4.4 + 112),
    userSid: 'S-1-5-21-3623811015-3361044343-30300820-1001',
    integrityLevel: (proc.threatCategory === 'system_service' ? 'System (0x4000)' : proc.isSigned ? 'Medium (0x2000)' : 'Low (0x1000)') as any
  };

  const hooks = (proc.hooks || []).map((h: any) => ({
    ...h,
    memoryProtection: h.memoryProtection || (h.hookType?.includes('Inline') ? 'PAGE_EXECUTE_READWRITE (0x40)' : 'PAGE_EXECUTE_READ (0x20)'),
    rawHexDump: h.rawHexDump || `${h.hookedAddress || '0x7FFF1000'}: ${h.disassembly?.hookedBytecode?.replace(/ /g, ' ') || 'E9 00 00 00 00'} 48 8B C4 48 89 58 08`
  }));

  const detectedExploitVectors = proc.detectedExploitVectors || [];
  const exploitAttempts = proc.exploitAttempts || [];
  const threatScore = proc.threatScore !== undefined
    ? proc.threatScore
    : (proc.threatCategory === 'suspicious_unverified' ? 95 : (detectedExploitVectors.length * 20));

  return {
    ...proc,
    installation: {
      ...proc.installation,
      registryHive: hive,
      rawInstallDate,
      rawRegistryValues,
      estimatedSizeKb
    },
    hooks,
    rawTelemetry,
    detectedExploitVectors,
    exploitAttempts,
    threatScore
  };
};

const BASE_PROCESSES: HookedProcess[] = [
  {
    id: 'proc-1',
    name: 'DiscordHookHelper64.exe',
    pid: 14208,
    parentPid: 7820,
    executablePath: 'C:\\Users\\User\\AppData\\Local\\Discord\\app-1.0.9032\\modules\\discord_overlay2\\DiscordHookHelper64.exe',
    publisher: 'Discord Inc.',
    isSigned: true,
    status: 'active',
    threatCategory: 'overlay_graphics',
    threadsCount: 14,
    memoryMb: 86.4,
    cpuPercent: 0.8,
    commandLine: '"C:\\Users\\User\\AppData\\Local\\Discord\\app-1.0.9032\\modules\\discord_overlay2\\DiscordHookHelper64.exe" --host-pid=7820',
    installation: {
      installedDate: '2026-08-14',
      installedDateFormatted: 'Aug 14, 2026',
      daysAgo: computeDaysAgo('2026-08-14'),
      installSource: 'Registry (HKCU)',
      registryKey: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Discord',
      installLocation: 'C:\\Users\\User\\AppData\\Local\\Discord',
      version: '1.0.9032',
      installerType: 'InnoSetup',
      uninstallString: '"C:\\Users\\User\\AppData\\Local\\Discord\\Update.exe" --uninstall'
    },
    hooks: [
      {
        id: 'hook-1a',
        targetModule: 'd3d11.dll',
        targetApi: 'IDXGISwapChain::Present',
        hookType: 'Inline / JMP Trampoline',
        originalAddress: '0x7FFF541A2040',
        hookedAddress: '0x7FFF1892B100',
        hookingModule: 'DiscordHook64.dll',
        description: 'Intercepts DirectX swap chain render loop to draw in-game notification & voice chat overlay',
        disassembly: {
          originalBytecode: '48 89 5C 24 10 48 89 6C 24 18',
          hookedBytecode: 'E9 BB 90 78 C4 90 90 90 90 90',
          instruction: 'jmp DiscordHook64.dll+0x2B100'
        }
      },
      {
        id: 'hook-1b',
        targetModule: 'dxgi.dll',
        targetApi: 'CreateDXGIFactory',
        hookType: 'IAT Patching',
        originalAddress: '0x7FFF53E17120',
        hookedAddress: '0x7FFF18929340',
        hookingModule: 'DiscordHook64.dll',
        description: 'Hooks factory initialization to inject overlay proxy into newly spawned DirectX game surfaces',
        disassembly: {
          originalBytecode: '48 83 EC 28 E8 57 12 00 00',
          hookedBytecode: 'FF 25 12 22 00 00',
          instruction: 'jmp qword ptr [DiscordHook64.dll+0x9340]'
        }
      }
    ]
  },
  {
    id: 'proc-2',
    name: 'AutoHotkey64.exe',
    pid: 10488,
    parentPid: 4216,
    executablePath: 'C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey64.exe',
    publisher: 'Lexikos / AutoHotkey Foundation',
    isSigned: true,
    status: 'active',
    threatCategory: 'input_monitor',
    threadsCount: 6,
    memoryMb: 19.2,
    cpuPercent: 0.1,
    commandLine: '"C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey64.exe" "C:\\Users\\User\\Documents\\Scripts\\productivity_hotkeys.ahk"',
    installation: {
      installedDate: '2025-11-20',
      installedDateFormatted: 'Nov 20, 2025',
      daysAgo: computeDaysAgo('2025-11-20'),
      installSource: 'Registry (HKLM)',
      registryKey: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\AutoHotkey',
      installLocation: 'C:\\Program Files\\AutoHotkey',
      version: '2.0.18',
      installerType: 'NSIS',
      uninstallString: '"C:\\Program Files\\AutoHotkey\\UX\\reset-assoc.exe" /uninstall'
    },
    hooks: [
      {
        id: 'hook-2a',
        targetModule: 'user32.dll',
        targetApi: 'SetWindowsHookExW (WH_KEYBOARD_LL)',
        hookType: 'SetWindowsHookEx (Global)',
        originalAddress: '0x7FFF558019C0',
        hookedAddress: '0x7FFF558019C0',
        hookingModule: 'user32.dll [Hook Proc in AutoHotkey64.exe+0x41E90]',
        description: 'Installs global low-level keyboard hook procedure to intercept raw keypresses across all windows',
        disassembly: {
          originalBytecode: '48 89 5C 24 08 48 89 74 24 10',
          hookedBytecode: '48 89 5C 24 08 48 89 74 24 10',
          instruction: 'CallNextHookEx callback chain active (Hook ID: 0x001A0442)'
        }
      },
      {
        id: 'hook-2b',
        targetModule: 'user32.dll',
        targetApi: 'SetWindowsHookExW (WH_MOUSE_LL)',
        hookType: 'SetWindowsHookEx (Global)',
        originalAddress: '0x7FFF55802210',
        hookedAddress: '0x7FFF55802210',
        hookingModule: 'user32.dll [Hook Proc in AutoHotkey64.exe+0x43120]',
        description: 'Low-level mouse hook for custom wheel clicks and edge gesture triggers',
        disassembly: {
          originalBytecode: '40 53 48 83 EC 20 48 8B D9',
          hookedBytecode: '40 53 48 83 EC 20 48 8B D9',
          instruction: 'CallNextHookEx mouse callback chain active (Hook ID: 0x001A0443)'
        }
      }
    ]
  },
  {
    id: 'proc-3',
    name: 'obs64.exe',
    pid: 8940,
    parentPid: 4216,
    executablePath: 'C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe',
    publisher: 'OBS Project',
    isSigned: true,
    status: 'active',
    threatCategory: 'overlay_graphics',
    threadsCount: 42,
    memoryMb: 342.1,
    cpuPercent: 3.4,
    commandLine: '"C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe"',
    installation: {
      installedDate: '2026-03-05',
      installedDateFormatted: 'Mar 5, 2026',
      daysAgo: computeDaysAgo('2026-03-05'),
      installSource: 'Registry (HKLM)',
      registryKey: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\OBS Studio',
      installLocation: 'C:\\Program Files\\obs-studio',
      version: '30.2.1',
      installerType: 'NSIS',
      uninstallString: '"C:\\Program Files\\obs-studio\\uninstall.exe"'
    },
    hooks: [
      {
        id: 'hook-3a',
        targetModule: 'graphics-hook64.dll -> d3d9.dll',
        targetApi: 'IDirect3DDevice9::Present',
        hookType: 'MinHook Detour',
        originalAddress: '0x7FFF4E104520',
        hookedAddress: '0x7FFF32A01290',
        hookingModule: 'graphics-hook64.dll',
        description: 'Hooks DirectX 9 render loop to copy video buffers into OBS capture frame queue',
        disassembly: {
          originalBytecode: '48 89 5C 24 08 57 48 83 EC 20',
          hookedBytecode: 'E9 6B CD 8F E4 90 90 90 90 90',
          instruction: 'jmp graphics-hook64.dll+0x1290'
        }
      },
      {
        id: 'hook-3b',
        targetModule: 'user32.dll',
        targetApi: 'BitBlt',
        hookType: 'IAT Patching',
        originalAddress: '0x7FFF55809800',
        hookedAddress: '0x7FFF32A04810',
        hookingModule: 'win-capture.dll',
        description: 'Intercepts GDI window blitting for desktop / window capture sources',
        disassembly: {
          originalBytecode: '48 83 EC 38 48 89 5C 24 40',
          hookedBytecode: 'FF 25 C2 19 00 00',
          instruction: 'jmp qword ptr [win-capture.dll+0x4810]'
        }
      }
    ],
    detectedExploitVectors: ['screen_scraping_framebuffer', 'dll_injection_inline'],
    threatScore: 40,
    exploitAttempts: [
      {
        id: 'expl-3a',
        timestamp: '12:43:50 PM',
        vector: 'screen_scraping_framebuffer',
        vectorTitle: 'Framebuffer Polling & Desktop Surface Capture',
        processId: 'proc-3',
        processName: 'obs64.exe',
        pid: 8940,
        targetApi: 'gdi32.dll!BitBlt',
        targetEntity: 'Desktop Window DC (GetDC(NULL))',
        severity: 'MEDIUM',
        description: 'Periodic framebuffer blitting capturing desktop/window display contents for video streaming buffer.',
        rawCallParameters: {
          hdcDest: '0x1C010992',
          hdcSrc: '0x01010014',
          cx: '1920',
          cy: '1080',
          rop: '0x00CC0020 (SRCCOPY)'
        },
        status: 'detected'
      }
    ]
  },
  {
    id: 'proc-4',
    name: 'RTSS.exe',
    pid: 6112,
    parentPid: 4216,
    executablePath: 'C:\\Program Files (x86)\\RivaTuner Statistics Server\\RTSS.exe',
    publisher: 'Unwinder / Guru3D',
    isSigned: true,
    status: 'active',
    threatCategory: 'overlay_graphics',
    threadsCount: 18,
    memoryMb: 48.5,
    cpuPercent: 0.2,
    commandLine: '"C:\\Program Files (x86)\\RivaTuner Statistics Server\\RTSS.exe"',
    installation: {
      installedDate: '2026-01-18',
      installedDateFormatted: 'Jan 18, 2026',
      daysAgo: computeDaysAgo('2026-01-18'),
      installSource: 'Registry (HKLM)',
      registryKey: 'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\RivaTuner Statistics Server',
      installLocation: 'C:\\Program Files (x86)\\RivaTuner Statistics Server',
      version: '7.3.5',
      installerType: 'InnoSetup',
      uninstallString: '"C:\\Program Files (x86)\\RivaTuner Statistics Server\\unins000.exe"'
    },
    hooks: [
      {
        id: 'hook-4a',
        targetModule: 'd3d12.dll',
        targetApi: 'ExecuteCommandLists',
        hookType: 'Inline / JMP Trampoline',
        originalAddress: '0x7FFF52A88100',
        hookedAddress: '0x7FFF120042A0',
        hookingModule: 'RTSSHooks64.dll',
        description: 'DirectX 12 command queue hook for high-precision frametime & telemetry overlay calculation',
        disassembly: {
          originalBytecode: '40 55 56 57 41 54 41 55 41 56',
          hookedBytecode: 'E9 9B C1 57 BF 90 90 90 90 90',
          instruction: 'jmp RTSSHooks64.dll+0x42A0'
        }
      },
      {
        id: 'hook-4b',
        targetModule: 'vulkan-1.dll',
        targetApi: 'vkQueuePresentKHR',
        hookType: 'IAT Patching',
        originalAddress: '0x7FFF49021180',
        hookedAddress: '0x7FFF12009110',
        hookingModule: 'RTSSHooks64.dll',
        description: 'Vulkan KHR swapchain presentation hook for FPS monitoring',
        disassembly: {
          originalBytecode: '48 89 5C 24 08 48 89 74 24 10',
          hookedBytecode: 'FF 25 8A 7F 00 00',
          instruction: 'jmp qword ptr [RTSSHooks64.dll+0x9110]'
        }
      }
    ]
  },
  {
    id: 'proc-5',
    name: 'Ditto.exe',
    pid: 5120,
    parentPid: 4216,
    executablePath: 'C:\\Program Files\\Ditto\\Ditto.exe',
    publisher: 'Ditto Clipboard Extension Team',
    isSigned: true,
    status: 'active',
    threatCategory: 'benign_utility',
    threadsCount: 8,
    memoryMb: 32.7,
    cpuPercent: 0.05,
    commandLine: '"C:\\Program Files\\Ditto\\Ditto.exe" /startup',
    installation: {
      installedDate: '2024-06-11',
      installedDateFormatted: 'Jun 11, 2024',
      daysAgo: computeDaysAgo('2024-06-11'),
      installSource: 'Registry (HKLM)',
      registryKey: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Ditto',
      installLocation: 'C:\\Program Files\\Ditto',
      version: '3.24.246.0',
      installerType: 'MSI (Windows Installer)',
      uninstallString: 'MsiExec.exe /I{B6682736-2DE4-4C2E-A1C4-374668D88A22}'
    },
    hooks: [
      {
        id: 'hook-5a',
        targetModule: 'user32.dll',
        targetApi: 'AddClipboardFormatListener',
        hookType: 'SetWinEventHook',
        originalAddress: '0x7FFF558064A0',
        hookedAddress: '0x7FFF558064A0',
        hookingModule: 'Ditto.exe',
        description: 'Hooks OS-level clipboard update events (WM_CLIPBOARDUPDATE) to log history',
        disassembly: {
          originalBytecode: '48 83 EC 28 48 8B 0D 85 41 07',
          hookedBytecode: '48 83 EC 28 48 8B 0D 85 41 07',
          instruction: 'Native OS Event Registration (Window Handle: 0x000202F4)'
        }
      }
    ]
  },
  {
    id: 'proc-6',
    name: 'lghub_agent.exe',
    pid: 11840,
    parentPid: 3820,
    executablePath: 'C:\\Program Files\\LGHUB\\lghub_agent.exe',
    publisher: 'Logitech Inc.',
    isSigned: true,
    status: 'active',
    threatCategory: 'input_monitor',
    threadsCount: 22,
    memoryMb: 124.8,
    cpuPercent: 0.5,
    commandLine: '"C:\\Program Files\\LGHUB\\lghub_agent.exe" --background',
    installation: {
      installedDate: '2026-09-02',
      installedDateFormatted: 'Sep 2, 2026',
      daysAgo: computeDaysAgo('2026-09-02'),
      installSource: 'Registry (HKLM)',
      registryKey: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Logitech G HUB',
      installLocation: 'C:\\Program Files\\LGHUB',
      version: '2026.8.598212',
      installerType: 'InnoSetup',
      uninstallString: '"C:\\Program Files\\LGHUB\\lghub_uninstaller.exe"'
    },
    hooks: [
      {
        id: 'hook-6a',
        targetModule: 'user32.dll',
        targetApi: 'RegisterRawInputDevices',
        hookType: 'SetWindowsHookEx (Global)',
        originalAddress: '0x7FFF558051E0',
        hookedAddress: '0x7FFF558051E0',
        hookingModule: 'lghub_hook64.dll',
        description: 'Raw input HID filter capturing mouse DPI switches, G-keys and macro triggers',
        disassembly: {
          originalBytecode: '48 89 5C 24 08 57 48 83 EC 30',
          hookedBytecode: '48 89 5C 24 08 57 48 83 EC 30',
          instruction: 'HID Raw Input Filter Hooked to Device Node \\\\?\\HID#VID_046D'
        }
      }
    ],
    detectedExploitVectors: ['raw_input_abuse'],
    threatScore: 25,
    exploitAttempts: [
      {
        id: 'expl-6a',
        timestamp: '12:43:55 PM',
        vector: 'raw_input_abuse',
        vectorTitle: 'Windows Raw Input API Registration',
        processId: 'proc-6',
        processName: 'lghub_agent.exe',
        pid: 11840,
        targetApi: 'user32.dll!RegisterRawInputDevices',
        targetEntity: 'HID Multi-axis Controller (UsagePage 0x01, Usage 0x02)',
        severity: 'MEDIUM',
        description: 'Vendor utility registered high-resolution raw mouse & HID input stream for DPI switching.',
        rawCallParameters: {
          usUsagePage: '0x0001 (Generic Desktop)',
          usUsage: '0x0002 (Mouse)',
          dwFlags: '0x00000100 (RIDEV_INPUTSINK)',
          hwndTarget: '0x00040182'
        },
        status: 'detected'
      }
    ]
  },
  {
    id: 'proc-7',
    name: 'win_input_sync32.exe',
    pid: 17392,
    parentPid: 840,
    executablePath: 'C:\\Users\\User\\AppData\\Roaming\\Microsoft\\Windows\\Templates\\win_input_sync32.exe',
    publisher: 'Unverified / Unsigned (No Digital Certificate)',
    isSigned: false,
    status: 'active',
    threatCategory: 'suspicious_unverified',
    threadsCount: 3,
    memoryMb: 14.8,
    cpuPercent: 1.2,
    commandLine: '"C:\\Users\\User\\AppData\\Roaming\\Microsoft\\Windows\\Templates\\win_input_sync32.exe" -silent -srv',
    installation: {
      installedDate: '2026-10-14',
      installedDateFormatted: 'Oct 14, 2026',
      daysAgo: computeDaysAgo('2026-10-14'),
      installSource: 'AppData / Local',
      registryKey: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\WinSync',
      installLocation: 'C:\\Users\\User\\AppData\\Roaming\\Microsoft\\Windows\\Templates',
      version: '1.0.0.1 (Faked Header)',
      installerType: 'Direct Portable',
      uninstallString: 'None (Unregistered Persistence in HKCU\\...\\Run)'
    },
    hooks: [
      {
        id: 'hook-7a',
        targetModule: 'user32.dll',
        targetApi: 'GetAsyncKeyState',
        hookType: 'Inline / JMP Trampoline',
        originalAddress: '0x7FFF558039E0',
        hookedAddress: '0x00412890',
        hookingModule: 'hook_payload.dll (Injected)',
        description: 'ANOMALY: Intercepts keyboard state query API to harvest credentials and keystrokes silently',
        disassembly: {
          originalBytecode: '48 83 EC 28 8B D1 E8 3B 00 00',
          hookedBytecode: 'E9 AB EF FF 80 90 90 90 90 90',
          instruction: 'jmp hook_payload.dll+0x2890'
        }
      },
      {
        id: 'hook-7b',
        targetModule: 'ws2_32.dll',
        targetApi: 'send',
        hookType: 'Inline / JMP Trampoline',
        originalAddress: '0x7FFF54D11800',
        hookedAddress: '0x00414920',
        hookingModule: 'hook_payload.dll (Injected)',
        description: 'ANOMALY: Intercepts raw TCP socket outgoing packets to exfiltrate logged keyboard telemetry',
        disassembly: {
          originalBytecode: '48 89 5C 24 08 48 89 6C 24 10',
          hookedBytecode: 'E9 1B 31 F0 80 90 90 90 90 90',
          instruction: 'jmp hook_payload.dll+0x4920'
        }
      }
    ],
    detectedExploitVectors: [
      'raw_input_abuse',
      'dll_injection_inline',
      'screen_scraping_framebuffer',
      'direct_memory_inspection'
    ],
    threatScore: 99,
    exploitAttempts: [
      {
        id: 'expl-7a',
        timestamp: '12:44:02 PM',
        vector: 'raw_input_abuse',
        vectorTitle: 'Windows Raw Input API Abuse (Background Sink)',
        processId: 'proc-7',
        processName: 'win_input_sync32.exe',
        pid: 17392,
        targetApi: 'user32.dll!RegisterRawInputDevices',
        targetEntity: 'System-wide Keyboard HID (UsagePage 0x01, Usage 0x06)',
        severity: 'CRITICAL',
        description: 'Silent raw input hook with RIDEV_INPUTSINK (0x00000100) capturing all global keystrokes in background without focus.',
        rawCallParameters: {
          usUsagePage: '0x0001 (Generic Desktop)',
          usUsage: '0x0006 (Keyboard)',
          dwFlags: '0x00000100 (RIDEV_INPUTSINK)',
          hwndTarget: '0x000201FA (Hidden Worker Window)'
        },
        status: 'detected'
      },
      {
        id: 'expl-7b',
        timestamp: '12:44:15 PM',
        vector: 'dll_injection_inline',
        vectorTitle: 'DLL Injection & JMP Prologue Overwrite',
        processId: 'proc-7',
        processName: 'win_input_sync32.exe',
        pid: 17392,
        targetApi: 'kernel32.dll!CreateRemoteThread',
        targetEntity: 'Target: explorer.exe (PID: 4216) -> ntdll!NtProtectVirtualMemory',
        severity: 'CRITICAL',
        description: 'Allocated RWX memory (0x00410000) inside explorer.exe, wrote 5-byte JMP trampoline (0xE9 AB EF FF 80) and initiated remote execution thread.',
        rawCallParameters: {
          hProcess: '0x000003AC (explorer.exe)',
          lpBaseAddress: '0x00410000',
          dwSize: '4096 bytes',
          flProtect: '0x40 (PAGE_EXECUTE_READWRITE)',
          flAllocationType: '0x3000 (MEM_COMMIT | MEM_RESERVE)'
        },
        status: 'detected'
      },
      {
        id: 'expl-7c',
        timestamp: '12:44:28 PM',
        vector: 'direct_memory_inspection',
        vectorTitle: 'Direct Virtual Memory Inspection',
        processId: 'proc-7',
        processName: 'win_input_sync32.exe',
        pid: 17392,
        targetApi: 'kernel32.dll!ReadProcessMemory',
        targetEntity: 'Target: chrome.exe (PID: 4892) -> Heap 0x00400000',
        severity: 'HIGH',
        description: 'Opened process with PROCESS_VM_READ (0x0010) rights and iteratively read 64 KB memory segments looking for auth tokens and password hashes.',
        rawCallParameters: {
          hProcess: '0x00000418 (chrome.exe)',
          lpBaseAddress: '0x00400000',
          nSize: '65536 bytes',
          dwDesiredAccess: '0x0010 (PROCESS_VM_READ)'
        },
        status: 'detected'
      },
      {
        id: 'expl-7d',
        timestamp: '12:44:40 PM',
        vector: 'screen_scraping_framebuffer',
        vectorTitle: 'Screen Scraping & Framebuffer Polling Loop',
        processId: 'proc-7',
        processName: 'win_input_sync32.exe',
        pid: 17392,
        targetApi: 'gdi32.dll!BitBlt',
        targetEntity: 'GetDC(NULL) [Primary Desktop Surface]',
        severity: 'HIGH',
        description: 'Continuous 60 FPS polling of desktop framebuffer into memory bitmap DC, intercepting visual screen buffer without elevation.',
        rawCallParameters: {
          hdcDest: '0x2A010892 (Compatible MemDC)',
          hdcSrc: '0x01010014 (GetDC(NULL) Desktop)',
          cx: '2560',
          cy: '1440',
          rop: '0x00CC0020 (SRCCOPY)'
        },
        status: 'detected'
      }
    ]

  },
  {
    id: 'proc-8',
    name: 'NVIDIA Share.exe',
    pid: 9284,
    parentPid: 4216,
    executablePath: 'C:\\Program Files\\NVIDIA Corporation\\NVIDIA GeForce Experience\\NVIDIA Share.exe',
    publisher: 'NVIDIA Corporation',
    isSigned: true,
    status: 'active',
    threatCategory: 'overlay_graphics',
    threadsCount: 26,
    memoryMb: 168.3,
    cpuPercent: 0.6,
    commandLine: '"C:\\Program Files\\NVIDIA Corporation\\NVIDIA GeForce Experience\\NVIDIA Share.exe"',
    installation: {
      installedDate: '2026-04-10',
      installedDateFormatted: 'Apr 10, 2026',
      daysAgo: computeDaysAgo('2026-04-10'),
      installSource: 'Registry (HKLM)',
      registryKey: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{B2E5D525-CE5A-4A00-BFB5-70788647D68F}',
      installLocation: 'C:\\Program Files\\NVIDIA Corporation\\NVIDIA GeForce Experience',
      version: '3.28.0.412',
      installerType: 'MSI (Windows Installer)',
      uninstallString: 'MsiExec.exe /X{B2E5D525-CE5A-4A00-BFB5-70788647D68F}'
    },
    hooks: [
      {
        id: 'hook-8a',
        targetModule: 'd3d11.dll',
        targetApi: 'ID3D11DeviceContext::DrawIndexed',
        hookType: 'Inline / JMP Trampoline',
        originalAddress: '0x7FFF541B1080',
        hookedAddress: '0x7FFF2A110540',
        hookingModule: 'NvCamera64.dll',
        description: 'Ansel and ShadowPlay instant replay frame injection hook',
        disassembly: {
          originalBytecode: '48 89 5C 24 18 57 48 83 EC 20',
          hookedBytecode: 'E9 C0 F4 F5 D5 90 90 90 90 90',
          instruction: 'jmp NvCamera64.dll+0x10540'
        }
      }
    ]
  },
  {
    id: 'proc-9',
    name: 'RzSynapse.exe',
    pid: 7420,
    parentPid: 4216,
    executablePath: 'C:\\Program Files (x86)\\Razer\\Synapse3\\UserProcess\\RzSynapse.exe',
    publisher: 'Razer Inc.',
    isSigned: true,
    status: 'active',
    threatCategory: 'input_monitor',
    threadsCount: 16,
    memoryMb: 94.2,
    cpuPercent: 0.3,
    commandLine: '"C:\\Program Files (x86)\\Razer\\Synapse3\\UserProcess\\RzSynapse.exe"',
    installation: {
      installedDate: '2025-08-30',
      installedDateFormatted: 'Aug 30, 2025',
      daysAgo: computeDaysAgo('2025-08-30'),
      installSource: 'Registry (HKLM)',
      registryKey: 'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Razer Synapse 3',
      installLocation: 'C:\\Program Files (x86)\\Razer\\Synapse3',
      version: '3.9.0118.011516',
      installerType: 'InnoSetup',
      uninstallString: '"C:\\Program Files (x86)\\Razer\\Synapse3\\RazerInstaller.exe" /uninstall'
    },
    hooks: [
      {
        id: 'hook-9a',
        targetModule: 'user32.dll',
        targetApi: 'SetWindowsHookExW (WH_MOUSE_LL)',
        hookType: 'SetWindowsHookEx (Global)',
        originalAddress: '0x7FFF55802210',
        hookedAddress: '0x7FFF55802210',
        hookingModule: 'RzHook64.dll',
        description: 'Hooks mouse macro and hypershift triggers for gaming peripherals',
        disassembly: {
          originalBytecode: '40 53 48 83 EC 20 48 8B D9',
          hookedBytecode: '40 53 48 83 EC 20 48 8B D9',
          instruction: 'CallNextHookEx mouse callback chain active (Hook ID: 0x001B0998)'
        }
      }
    ]
  },
  {
    id: 'proc-10',
    name: 'PowerToys.KeyboardManagerEngine.exe',
    pid: 12496,
    parentPid: 4216,
    executablePath: 'C:\\Program Files\\PowerToys\\modules\\KeyboardManager\\PowerToys.KeyboardManagerEngine.exe',
    publisher: 'Microsoft Corporation',
    isSigned: true,
    status: 'active',
    threatCategory: 'input_monitor',
    threadsCount: 9,
    memoryMb: 44.6,
    cpuPercent: 0.1,
    commandLine: '"C:\\Program Files\\PowerToys\\modules\\KeyboardManager\\PowerToys.KeyboardManagerEngine.exe"',
    isDotNetProcess: true,
    dotNetRuntime: '.NET 8.0 (CoreCLR)',
    installation: {
      installedDate: '2026-07-22',
      installedDateFormatted: 'Jul 22, 2026',
      daysAgo: computeDaysAgo('2026-07-22'),
      installSource: 'Registry (HKLM)',
      registryKey: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{A188B67D-3D6B-4D12-92AE-777D439A3C41}',
      installLocation: 'C:\\Program Files\\PowerToys',
      version: '0.84.0',
      installerType: 'MSI (Windows Installer)',
      uninstallString: 'MsiExec.exe /X{A188B67D-3D6B-4D12-92AE-777D439A3C41}'
    },
    hooks: [
      {
        id: 'hook-10a',
        targetModule: 'user32.dll',
        targetApi: 'SetWindowsHookExW (WH_KEYBOARD_LL)',
        hookType: 'SetWindowsHookEx (Global)',
        originalAddress: '0x7FFF558019C0',
        hookedAddress: '0x7FFF558019C0',
        hookingModule: 'user32.dll [.NET P/Invoke Hook Callback]',
        description: '.NET CoreCLR Low-Level Keyboard Hook for system-wide shortcut remapping and hotkey filtering',
        disassembly: {
          originalBytecode: '48 89 5C 24 08 48 89 74 24 10',
          hookedBytecode: '48 89 5C 24 08 48 89 74 24 10',
          instruction: 'CallNextHookEx P/Invoke delegate (Hook ID: 0x001C0812)'
        }
      }
    ]
  },
  {
    id: 'proc-11',
    name: 'ShareX.exe',
    pid: 15304,
    parentPid: 4216,
    executablePath: 'C:\\Program Files\\ShareX\\ShareX.exe',
    publisher: 'ShareX Team',
    isSigned: true,
    status: 'active',
    threatCategory: 'overlay_graphics',
    threadsCount: 18,
    memoryMb: 78.2,
    cpuPercent: 0.2,
    commandLine: '"C:\\Program Files\\ShareX\\ShareX.exe" -autostart',
    isDotNetProcess: true,
    dotNetRuntime: '.NET 8.0 (WinForms / PInvoke)',
    installation: {
      installedDate: '2026-05-19',
      installedDateFormatted: 'May 19, 2026',
      daysAgo: computeDaysAgo('2026-05-19'),
      installSource: 'Registry (HKLM)',
      registryKey: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ShareX',
      installLocation: 'C:\\Program Files\\ShareX',
      version: '16.1.0',
      installerType: 'InnoSetup',
      uninstallString: '"C:\\Program Files\\ShareX\\unins000.exe"'
    },
    hooks: [
      {
        id: 'hook-11a',
        targetModule: 'user32.dll',
        targetApi: 'RegisterHotKey',
        hookType: 'SetWinEventHook',
        originalAddress: '0x7FFF558044B0',
        hookedAddress: '0x7FFF558044B0',
        hookingModule: 'ShareX.HelpersLib.dll',
        description: '.NET Global Hotkey and Clipboard listener for automated screen recording and OCR triggers',
        disassembly: {
          originalBytecode: '48 83 EC 28 8B D1 E8 1A 02 00',
          hookedBytecode: '48 83 EC 28 8B D1 E8 1A 02 00',
          instruction: 'Native OS Event Registration (HWND: 0x000301EA)'
        }
      }
    ]
  },
  {
    id: 'proc-12',
    name: 'MemoryProbe64.exe',
    pid: 19448,
    parentPid: 4216,
    executablePath: 'C:\\Users\\User\\Downloads\\DebugTools\\MemoryProbe64.exe',
    publisher: 'Unverified / Unknown (No Authenticode Signature)',
    isSigned: false,
    status: 'active',
    threatCategory: 'suspicious_unverified',
    threadsCount: 7,
    memoryMb: 52.8,
    cpuPercent: 1.8,
    commandLine: '"C:\\Users\\User\\Downloads\\DebugTools\\MemoryProbe64.exe" --scan-all',
    installation: {
      installedDate: '2026-10-15',
      installedDateFormatted: 'Oct 15, 2026',
      daysAgo: computeDaysAgo('2026-10-15'),
      installSource: 'AppData / Local',
      registryKey: 'HKCU\\Software\\Classes\\Applications\\MemoryProbe64.exe',
      installLocation: 'C:\\Users\\User\\Downloads\\DebugTools',
      version: '2.4.0.0 (Unregistered)',
      installerType: 'Direct Portable',
      uninstallString: 'Manual file deletion'
    },
    hooks: [
      {
        id: 'hook-12a',
        targetModule: 'kernel32.dll',
        targetApi: 'ReadProcessMemory',
        hookType: 'Inline / JMP Trampoline',
        originalAddress: '0x7FFF541011A0',
        hookedAddress: '0x00521090',
        hookingModule: 'dbg_engine64.dll',
        description: 'Iterative virtual address scanner scraping pointers, process heaps, and cryptographic keys',
        disassembly: {
          originalBytecode: '48 89 5C 24 08 48 89 74 24 10',
          hookedBytecode: 'E9 B0 09 42 00 90 90 90 90 90',
          instruction: 'jmp dbg_engine64.dll+0x1090'
        }
      }
    ],
    detectedExploitVectors: [
      'direct_memory_inspection',
      'dll_injection_inline'
    ],
    threatScore: 92,
    exploitAttempts: [
      {
        id: 'expl-12a',
        timestamp: '12:45:10 PM',
        vector: 'direct_memory_inspection',
        vectorTitle: 'Direct Virtual Memory Inspection',
        processId: 'proc-12',
        processName: 'MemoryProbe64.exe',
        pid: 19448,
        targetApi: 'kernel32.dll!OpenProcess',
        targetEntity: 'Target: lsass.exe (PID: 720) & msedge.exe (PID: 5120)',
        severity: 'CRITICAL',
        description: 'Attempted to open protected process with PROCESS_VM_READ | PROCESS_VM_OPERATION (0x0030) flags to dump memory regions.',
        rawCallParameters: {
          dwDesiredAccess: '0x0030 (PROCESS_VM_READ | PROCESS_VM_OPERATION)',
          bInheritHandle: '0',
          dwProcessId: '720 (lsass.exe)'
        },
        status: 'detected'
      },
      {
        id: 'expl-12b',
        timestamp: '12:45:22 PM',
        vector: 'dll_injection_inline',
        vectorTitle: 'DLL Injection & Remote Thread Spawn',
        processId: 'proc-12',
        processName: 'MemoryProbe64.exe',
        pid: 19448,
        targetApi: 'kernel32.dll!VirtualAllocEx',
        targetEntity: 'Allocated 64KB RWX at 0x002A0000 in target process',
        severity: 'CRITICAL',
        description: 'Allocated executable memory with PAGE_EXECUTE_READWRITE inside target address space preparing remote shellcode stub.',
        rawCallParameters: {
          hProcess: '0x000004FC',
          lpAddress: '0x002A0000',
          dwSize: '65536',
          flAllocationType: '0x1000 (MEM_COMMIT)',
          flProtect: '0x40 (PAGE_EXECUTE_READWRITE)'
        },
        status: 'detected'
      }
    ]
  }
];

export const INITIAL_PROCESSES: HookedProcess[] = BASE_PROCESSES.map(enrichWithRawData);
