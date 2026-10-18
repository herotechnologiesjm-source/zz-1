import React from 'react';
import { Shield, Lock, Layers, Zap, Terminal, AlertCircle } from 'lucide-react';

interface HookGuideViewProps {
  theme: 'dark' | 'light';
}

export const HookGuideView: React.FC<HookGuideViewProps> = ({ theme }) => {
  return (
    <div className="space-y-4 font-sans text-xs select-none max-w-5xl mx-auto">
      {/* Intro banner */}
      <div
        className={`p-4 rounded border space-y-1.5 ${
          theme === 'dark' ? 'bg-[#202020] border-[#2d2d2d]' : 'bg-[#f5f5f5] border-[#e0e0e0]'
        }`}
      >
        <div className="flex items-center gap-2 font-semibold text-sm text-[#0078d4]">
          <Shield className="w-4 h-4" />
          <span>Windows API Hooking Architecture & Defense Manual</span>
        </div>
        <p className="opacity-80 leading-relaxed text-xs">
          API Hooking is an interception technique where software instruments or redirects operating system API calls to execute custom routines before or after the genuine Windows routine runs. While commonly used for game overlays, accessibility readers, macro utilities, and security sensors, unauthorized or rogue hooks can capture keystrokes, siphon passwords, and inject arbitrary payloads.
        </p>
      </div>

      {/* 4 Hook Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          className={`p-3.5 rounded border space-y-2 ${
            theme === 'dark' ? 'bg-[#1e1e1e] border-[#2c2c2c]' : 'bg-[#ffffff] border-[#e0e0e0]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-xs text-[#0078d4]">
            <span className="w-2 h-2 rounded-full bg-[#0078d4]" />
            1. Global Message Hooks (SetWindowsHookEx)
          </div>
          <p className="opacity-80 leading-relaxed text-xs">
            Registered via <code className="font-mono text-[#0078d4]">user32.dll!SetWindowsHookExW</code> with hook types like <code className="font-mono opacity-90">WH_KEYBOARD_LL</code> or <code className="font-mono opacity-90">WH_MOUSE_LL</code>. The OS calls the hook callback whenever input messages are queued. Used by AutoHotkey, keyloggers, and macro software.
          </p>
          <div className="text-[11px] font-mono opacity-70 p-2 rounded bg-black/10 dark:bg-black/30">
            Neutralization: Freeze via NtSuspendProcess halts the message loop thread; End Task unregisters the hook chain handle.
          </div>
        </div>

        <div
          className={`p-3.5 rounded border space-y-2 ${
            theme === 'dark' ? 'bg-[#1e1e1e] border-[#2c2c2c]' : 'bg-[#ffffff] border-[#e0e0e0]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-xs text-[#0078d4]">
            <span className="w-2 h-2 rounded-full bg-[#0078d4]" />
            2. Inline / JMP Trampoline (MinHook / Detours)
          </div>
          <p className="opacity-80 leading-relaxed text-xs">
            Overwrites the initial 5 to 14 bytes (the function prologue) of a target function with an assembly <code className="font-mono text-[#0078d4]">JMP &lt;HookModule&gt;</code> instruction. Used by Discord Overlay, OBS Studio, and RivaTuner to intercept DirectX (<code className="font-mono opacity-90">IDXGISwapChain::Present</code>).
          </p>
          <div className="text-[11px] font-mono opacity-70 p-2 rounded bg-black/10 dark:bg-black/30">
            Neutralization: Terminating the helper host unmaps the detour DLL and restores standard swap chain presentation.
          </div>
        </div>

        <div
          className={`p-3.5 rounded border space-y-2 ${
            theme === 'dark' ? 'bg-[#1e1e1e] border-[#2c2c2c]' : 'bg-[#ffffff] border-[#e0e0e0]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-xs text-[#0078d4]">
            <span className="w-2 h-2 rounded-full bg-[#0078d4]" />
            3. Import Address Table (IAT) Patching
          </div>
          <p className="opacity-80 leading-relaxed text-xs">
            Modifies pointers inside a loaded module's Import Address Table so that calls to external DLLs (e.g., <code className="font-mono opacity-90">ws2_32.dll!send</code> or <code className="font-mono opacity-90">kernel32.dll!CreateProcess</code>) resolve to the hooking DLL instead of the genuine export.
          </p>
          <div className="text-[11px] font-mono opacity-70 p-2 rounded bg-black/10 dark:bg-black/30">
            Neutralization: End Task halts socket interception; uninstall cleans injected helper services.
          </div>
        </div>

        <div
          className={`p-3.5 rounded border space-y-2 ${
            theme === 'dark' ? 'bg-[#1e1e1e] border-[#2c2c2c]' : 'bg-[#ffffff] border-[#e0e0e0]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-xs text-[#0078d4]">
            <span className="w-2 h-2 rounded-full bg-[#0078d4]" />
            4. Windows Registry Installation Corroboration
          </div>
          <p className="opacity-80 leading-relaxed text-xs">
            Legitimate hooked programs register an uninstaller in <code className="font-mono opacity-90">HKLM:\...\Uninstall</code> or <code className="font-mono opacity-90">HKCU:\...\Uninstall</code> with an <code className="font-mono opacity-90">InstallDate</code>. Stealth hooks and malware reside in temporary AppData directories without uninstall records.
          </p>
          <div className="text-[11px] font-mono opacity-70 p-2 rounded bg-black/10 dark:bg-black/30">
            Neutralization: Compare running process module paths against registered uninstallers to identify rogue persistence.
          </div>
        </div>
      </div>

      {/* Freeze vs Terminate Explanation */}
      <div
        className={`p-4 rounded border space-y-3 ${
          theme === 'dark' ? 'bg-[#202020] border-[#2d2d2d]' : 'bg-[#f5f5f5] border-[#e0e0e0]'
        }`}
      >
        <div className="font-semibold text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#0078d4]" />
          <span>Windows Native Operations: Suspend (Freeze) vs. End Task</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className={`p-3 rounded border ${theme === 'dark' ? 'bg-[#181818] border-[#2d2d2d]' : 'bg-[#ffffff] border-[#e0e0e0]'}`}>
            <div className="font-semibold text-sky-500 mb-1">
              SUSPEND (NtSuspendProcess)
            </div>
            <p className="opacity-80 leading-relaxed">
              Suspends all execution threads belonging to the target process using Windows kernel routine <code className="font-mono text-sky-500">NtSuspendProcess</code>. The process consumes 0% CPU and cannot execute hook routines or process input messages.
            </p>
            <div className="mt-2 text-[11px] opacity-60">
              <strong>Advantage:</strong> Freezes rogue processes or errant overlays instantly without destroying memory state, allowing forensic dumps before termination.
            </div>
          </div>

          <div className={`p-3 rounded border ${theme === 'dark' ? 'bg-[#181818] border-[#2d2d2d]' : 'bg-[#ffffff] border-[#e0e0e0]'}`}>
            <div className="font-semibold text-rose-500 mb-1">
              END TASK (taskkill /F /PID)
            </div>
            <p className="opacity-80 leading-relaxed">
              Issues <code className="font-mono text-rose-500">TerminateProcess</code> via <code className="font-mono text-rose-500">taskkill.exe /F /PID</code>. Halts the process tree immediately and unmaps all loaded DLLs, purging active hook handles and freeing allocated RAM.
            </p>
            <div className="mt-2 text-[11px] opacity-60">
              <strong>Advantage:</strong> Permanent release of Windows API hooks and immediate neutralization of unauthorized background interceptors.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
