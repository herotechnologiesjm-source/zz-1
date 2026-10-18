import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Upload,
  FileCode,
  Terminal,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { POWERSHELL_AUDIT_SCRIPT } from '../utils/powershellScript';
import { HookedProcess } from '../types/inspector';

interface PowerShellAgentModalProps {
  isOpen: boolean;
  theme: 'dark' | 'light';
  onClose: () => void;
  onImportScanData: (processes: HookedProcess[]) => void;
}

export const PowerShellAgentModal: React.FC<PowerShellAgentModalProps> = ({
  isOpen,
  theme,
  onClose,
  onImportScanData
}) => {
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(POWERSHELL_AUDIT_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([POWERSHELL_AUDIT_SCRIPT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Audit-WindowsHooks.ps1';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processJsonContent(content);
    };
    reader.readAsText(file);
  };

  const processJsonContent = (rawJson: string) => {
    setErrorMsg(null);
    setSuccessCount(null);

    try {
      const parsed = JSON.parse(rawJson);
      let list: HookedProcess[] = [];

      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (parsed && Array.isArray(parsed.processes)) {
        list = parsed.processes;
      } else if (parsed && typeof parsed === 'object') {
        list = [parsed as HookedProcess];
      }

      if (list.length === 0) {
        setErrorMsg('JSON parsed successfully, but no process objects were found.');
        return;
      }

      const sanitized: HookedProcess[] = list.map((item: any, idx: number) => ({
        id: item.id || `proc-import-${Date.now()}-${idx}`,
        name: item.name || 'UnknownProcess.exe',
        pid: typeof item.pid === 'number' ? item.pid : 1000 + idx,
        parentPid: item.parentPid || 0,
        executablePath: item.executablePath || 'C:\\Windows\\System32\\svchost.exe',
        publisher: item.publisher || 'Local Unverified Module',
        isSigned: Boolean(item.isSigned),
        status: (item.status === 'frozen' || item.status === 'terminated' ? item.status : 'active') as any,
        threatCategory: item.threatCategory || 'benign_utility',
        installation: {
          installedDate: item.installation?.installedDate || '2026-01-01',
          installedDateFormatted: item.installation?.installedDateFormatted || 'Jan 1, 2026',
          daysAgo: item.installation?.daysAgo ?? 120,
          installSource: item.installation?.installSource || 'Registry (HKLM)',
          registryKey: item.installation?.registryKey || '',
          installLocation: item.installation?.installLocation || 'C:\\Program Files',
          version: item.installation?.version || '1.0.0',
          installerType: item.installation?.installerType || 'MSI (Windows Installer)',
          uninstallString: item.installation?.uninstallString || ''
        },
        hooks: Array.isArray(item.hooks) && item.hooks.length > 0 ? item.hooks.map((h: any, hIdx: number) => ({
          id: h.id || `hook-${idx}-${hIdx}`,
          targetModule: h.targetModule || 'user32.dll',
          targetApi: h.targetApi || 'SetWindowsHookExW',
          hookType: h.hookType || 'Inline / JMP Trampoline',
          originalAddress: h.originalAddress || '0x7FFF10000000',
          hookedAddress: h.hookedAddress || '0x7FFF20000000',
          hookingModule: h.hookingModule || 'HookModule.dll',
          description: h.description || 'Imported Windows hook entry',
          disassembly: h.disassembly || {
            originalBytecode: '48 89 5C 24 08',
            hookedBytecode: 'E9 12 34 56 78',
            instruction: 'jmp hook'
          }
        })) : [
          {
            id: `hook-${idx}-def`,
            targetModule: 'user32.dll',
            targetApi: 'SetWindowsHookExW (WH_KEYBOARD_LL)',
            hookType: 'SetWindowsHookEx (Global)' as const,
            originalAddress: '0x7FFF558019C0',
            hookedAddress: '0x7FFF558019C0',
            hookingModule: 'user32.dll',
            description: 'Detected active keyboard hook procedure',
            disassembly: {
              originalBytecode: '48 89 5C 24 08',
              hookedBytecode: '48 89 5C 24 08',
              instruction: 'Active hook chain'
            }
          }
        ],
        threadsCount: item.threadsCount || 4,
        memoryMb: item.memoryMb || 32,
        cpuPercent: item.cpuPercent || 0.1,
        commandLine: item.commandLine || item.executablePath || ''
      }));

      onImportScanData(sanitized);
      setSuccessCount(sanitized.length);
    } catch (err: any) {
      setErrorMsg(`Invalid JSON file format: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 select-none animate-in fade-in duration-100">
      <div
        className={`w-full max-w-3xl rounded-lg border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          theme === 'dark'
            ? 'bg-[#202020] text-[#e0e0e0] border-[#383838]'
            : 'bg-[#f9f9f9] text-[#1c1c1c] border-[#cecece]'
        }`}
      >
        {/* Title Bar */}
        <div
          className={`h-8 px-3 flex items-center justify-between border-b text-xs ${
            theme === 'dark' ? 'bg-[#181818] border-[#333333]' : 'bg-[#f0f0f0] border-[#e0e0e0]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#0078d4]" />
            <span className="font-semibold">Windows PowerShell Live Hook Scanner & Data Importer</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-6 flex items-center justify-center hover:bg-[#e81123] hover:text-white transition-colors rounded-xs"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className={`p-5 overflow-y-auto space-y-4 text-xs font-sans ${theme === 'dark' ? 'bg-[#252525]' : 'bg-[#ffffff]'}`}>
          {/* Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={`p-3 rounded border space-y-2 ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#333333]' : 'bg-[#f5f5f5] border-[#e0e0e0]'}`}>
              <div className="font-semibold text-xs text-[#0078d4]">1. Download & Run on Windows</div>
              <p className="opacity-80 leading-relaxed text-[11px]">
                Run <code className="font-mono text-[#0078d4]">Audit-WindowsHooks.ps1</code> in Windows PowerShell as Administrator. It inspects running modules, loaded hook DLLs, and HKLM/HKCU install dates.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleDownloadScript}
                  className="px-3 py-1 rounded bg-[#0078d4] hover:bg-[#0063b1] text-white font-medium cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .ps1</span>
                </button>
                <button
                  onClick={handleCopyScript}
                  className={`px-3 py-1 rounded border font-medium cursor-pointer flex items-center gap-1.5 ${
                    theme === 'dark' ? 'bg-[#2b2b2b] border-[#3d3d3d]' : 'bg-[#ffffff] border-[#cccccc]'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className={`p-3 rounded border space-y-2 ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#333333]' : 'bg-[#f5f5f5] border-[#e0e0e0]'}`}>
              <div className="font-semibold text-xs text-[#0078d4]">2. Import Results JSON</div>
              <p className="opacity-80 leading-relaxed text-[11px]">
                The script outputs <code className="font-mono text-[#0078d4]">winhook_audit_results.json</code>. Select the file below to load your host's real processes and hooks.
              </p>
              <label
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded border font-medium cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#2b2b2b] hover:bg-[#333333] border-[#3d3d3d]'
                    : 'bg-[#ffffff] hover:bg-[#f3f3f3] border-[#cccccc]'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-[#0078d4]" />
                <span>Browse JSON File...</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Feedback */}
          {successCount !== null && (
            <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Imported <strong>{successCount}</strong> hooked processes from Windows JSON scan!</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Paste JSON */}
          <div className="space-y-1.5">
            <label className="opacity-80 text-[11px] font-medium">Or paste scan JSON text directly:</label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste JSON here..."
              rows={3}
              className={`w-full p-2 rounded border font-mono text-xs focus:outline-none focus:border-[#0078d4] ${
                theme === 'dark' ? 'bg-[#181818] border-[#333333]' : 'bg-[#fbfbfb] border-[#cccccc]'
              }`}
            />
            {jsonInput.trim().length > 0 && (
              <button
                onClick={() => processJsonContent(jsonInput)}
                className="px-3 py-1 rounded bg-[#0078d4] hover:bg-[#0063b1] text-white font-medium cursor-pointer"
              >
                Parse & Import
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`h-11 px-4 flex items-center justify-end border-t text-xs ${
            theme === 'dark' ? 'bg-[#1f1f1f] border-[#383838]' : 'bg-[#f0f0f0] border-[#e0e0e0]'
          }`}
        >
          <button
            onClick={onClose}
            className={`min-w-[75px] px-3 py-1 rounded border font-medium cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#333333] hover:bg-[#3d3d3d] border-[#454545] text-white'
                : 'bg-[#e1e1e1] hover:bg-[#d5d5d5] border-[#adadad] text-black'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
