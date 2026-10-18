import React, { useState } from 'react';
import { X, Shield } from 'lucide-react';
import { HookedProcess, HookType, ThreatCategory } from '../types/inspector';

interface CustomHookModalProps {
  isOpen: boolean;
  theme: 'dark' | 'light';
  onClose: () => void;
  onAddProcess: (proc: HookedProcess) => void;
}

export const CustomHookModal: React.FC<CustomHookModalProps> = ({
  isOpen,
  theme,
  onClose,
  onAddProcess
}) => {
  const [name, setName] = useState('MyCustomHook.exe');
  const [pid, setPid] = useState(18944);
  const [publisher, setPublisher] = useState('Custom Diagnostic Tool');
  const [targetModule, setTargetModule] = useState('user32.dll');
  const [targetApi, setTargetApi] = useState('SetWindowsHookExW (WH_KEYBOARD_LL)');
  const [hookType, setHookType] = useState<HookType>('SetWindowsHookEx (Global)');
  const [hookingModule, setHookingModule] = useState('custom_hook.dll');
  const [description, setDescription] = useState('Intercepts low-level keyboard input events');
  const [installedDate, setInstalledDate] = useState('2026-10-15');
  const [threatCategory, setThreatCategory] = useState<ThreatCategory>('input_monitor');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const installDays = Math.max(
      0,
      Math.round((new Date('2026-10-17T12:00:00Z').getTime() - new Date(installedDate).getTime()) / (1000 * 60 * 60 * 24))
    );

    const newProc: HookedProcess = {
      id: `proc-custom-${Date.now()}`,
      name: name.trim().endsWith('.exe') ? name.trim() : `${name.trim()}.exe`,
      pid: Number(pid) || Math.floor(Math.random() * 20000) + 1000,
      parentPid: 4216,
      executablePath: `C:\\Program Files\\${name.trim()}\\${name.trim()}`,
      publisher: publisher.trim() || 'Unverified Developer',
      isSigned: publisher.toLowerCase().includes('microsoft') || publisher.toLowerCase().includes('verified'),
      status: 'active',
      threatCategory,
      threadsCount: 8,
      memoryMb: 42.5,
      cpuPercent: 0.4,
      commandLine: `"C:\\Program Files\\${name.trim()}\\${name.trim()}"`,
      installation: {
        installedDate,
        installedDateFormatted: new Date(installedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        daysAgo: installDays,
        installSource: 'Registry (HKLM)',
        registryKey: `HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${name.trim()}`,
        installLocation: `C:\\Program Files\\${name.trim()}`,
        version: '1.0.0.0',
        installerType: 'InnoSetup',
        uninstallString: `"C:\\Program Files\\${name.trim()}\\unins000.exe"`
      },
      hooks: [
        {
          id: `hook-cust-${Date.now()}`,
          targetModule,
          targetApi,
          hookType,
          originalAddress: '0x7FFF558019C0',
          hookedAddress: '0x7FFF33201400',
          hookingModule,
          description,
          disassembly: {
            originalBytecode: '48 89 5C 24 08',
            hookedBytecode: 'E9 3B 21 00 00',
            instruction: `jmp ${hookingModule}+0x1400`
          }
        }
      ]
    };

    onAddProcess(newProc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 select-none animate-in fade-in duration-100">
      <div
        className={`w-full max-w-lg rounded-lg border shadow-2xl overflow-hidden flex flex-col ${
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
            <Shield className="w-3.5 h-3.5 text-[#0078d4]" />
            <span className="font-semibold">Run New Process Simulation (Add Hook)</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-6 flex items-center justify-center hover:bg-[#e81123] hover:text-white transition-colors rounded-xs"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={`p-5 space-y-3.5 text-xs font-sans ${theme === 'dark' ? 'bg-[#252525]' : 'bg-[#ffffff]'}`}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block opacity-80 mb-1">Executable Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`w-full px-2.5 py-1.5 rounded border font-mono text-xs focus:outline-none focus:border-[#0078d4] ${
                  theme === 'dark' ? 'bg-[#181818] border-[#383838]' : 'bg-[#ffffff] border-[#cccccc]'
                }`}
              />
            </div>
            <div>
              <label className="block opacity-80 mb-1">Process ID (PID)</label>
              <input
                type="number"
                value={pid}
                onChange={(e) => setPid(Number(e.target.value))}
                required
                className={`w-full px-2.5 py-1.5 rounded border font-mono text-xs focus:outline-none focus:border-[#0078d4] ${
                  theme === 'dark' ? 'bg-[#181818] border-[#383838]' : 'bg-[#ffffff] border-[#cccccc]'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block opacity-80 mb-1">Publisher</label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded border text-xs focus:outline-none focus:border-[#0078d4] ${
                  theme === 'dark' ? 'bg-[#181818] border-[#383838]' : 'bg-[#ffffff] border-[#cccccc]'
                }`}
              />
            </div>
            <div>
              <label className="block opacity-80 mb-1">Installation Date</label>
              <input
                type="date"
                value={installedDate}
                onChange={(e) => setInstalledDate(e.target.value)}
                required
                className={`w-full px-2.5 py-1.5 rounded border font-mono text-xs focus:outline-none focus:border-[#0078d4] ${
                  theme === 'dark' ? 'bg-[#181818] border-[#383838]' : 'bg-[#ffffff] border-[#cccccc]'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block opacity-80 mb-1">Target Windows DLL</label>
              <input
                type="text"
                value={targetModule}
                onChange={(e) => setTargetModule(e.target.value)}
                required
                className={`w-full px-2.5 py-1.5 rounded border font-mono text-xs focus:outline-none focus:border-[#0078d4] ${
                  theme === 'dark' ? 'bg-[#181818] border-[#383838]' : 'bg-[#ffffff] border-[#cccccc]'
                }`}
              />
            </div>
            <div>
              <label className="block opacity-80 mb-1">Target API Function</label>
              <input
                type="text"
                value={targetApi}
                onChange={(e) => setTargetApi(e.target.value)}
                required
                className={`w-full px-2.5 py-1.5 rounded border font-mono text-xs focus:outline-none focus:border-[#0078d4] ${
                  theme === 'dark' ? 'bg-[#181818] border-[#383838]' : 'bg-[#ffffff] border-[#cccccc]'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block opacity-80 mb-1">Hook Mechanism</label>
              <select
                value={hookType}
                onChange={(e) => setHookType(e.target.value as HookType)}
                className={`w-full px-2.5 py-1.5 rounded border text-xs focus:outline-none focus:border-[#0078d4] ${
                  theme === 'dark' ? 'bg-[#181818] border-[#383838]' : 'bg-[#ffffff] border-[#cccccc]'
                }`}
              >
                <option value="SetWindowsHookEx (Global)">SetWindowsHookEx (Global)</option>
                <option value="Inline / JMP Trampoline">Inline / JMP Trampoline</option>
                <option value="IAT Patching">IAT Patching</option>
                <option value="MinHook Detour">MinHook Detour</option>
                <option value="SetWinEventHook">SetWinEventHook</option>
                <option value="WFP Network Filter">WFP Network Filter</option>
              </select>
            </div>
            <div>
              <label className="block opacity-80 mb-1">Threat Classification</label>
              <select
                value={threatCategory}
                onChange={(e) => setThreatCategory(e.target.value as ThreatCategory)}
                className={`w-full px-2.5 py-1.5 rounded border text-xs focus:outline-none focus:border-[#0078d4] ${
                  theme === 'dark' ? 'bg-[#181818] border-[#383838]' : 'bg-[#ffffff] border-[#cccccc]'
                }`}
              >
                <option value="benign_utility">Benign Utility</option>
                <option value="overlay_graphics">DirectX Overlay</option>
                <option value="input_monitor">Input / Keyboard Monitor</option>
                <option value="system_service">System Service</option>
                <option value="suspicious_unverified">Suspicious / Anomaly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block opacity-80 mb-1">Description / Purpose</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded border text-xs focus:outline-none focus:border-[#0078d4] ${
                theme === 'dark' ? 'bg-[#181818] border-[#383838]' : 'bg-[#ffffff] border-[#cccccc]'
              }`}
            />
          </div>

          <div
            className={`pt-3 flex items-center justify-end gap-2 border-t ${
              theme === 'dark' ? 'border-[#383838]' : 'border-[#e0e0e0]'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`min-w-[75px] px-3 py-1 rounded border font-medium cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#2b2b2b] hover:bg-[#333333] border-[#383838] text-[#cccccc]'
                  : 'bg-[#f5f5f5] hover:bg-[#e8e8e8] border-[#cccccc] text-[#333333]'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-w-[75px] px-3 py-1 rounded bg-[#0078d4] hover:bg-[#0063b1] text-white font-medium cursor-pointer"
            >
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
