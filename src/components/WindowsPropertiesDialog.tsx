import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Code,
  Terminal,
  Copy,
  Check,
  Pause,
  Play,
  Square
} from 'lucide-react';
import { HookedProcess } from '../types/inspector';
import { getFreezeCommand, getResumeCommand, getTerminateCommand } from '../utils/powershellScript';
import { generateDotNetSnippet } from '../utils/dotNetSourceCode';

interface WindowsPropertiesDialogProps {
  process: HookedProcess | null;
  theme: 'dark' | 'light';
  onClose: () => void;
  onEndTask: (proc: HookedProcess) => void;
  onSuspend: (proc: HookedProcess) => void;
  onResume: (proc: HookedProcess) => void;
}

export const WindowsPropertiesDialog: React.FC<WindowsPropertiesDialogProps> = ({
  process,
  theme,
  onClose,
  onEndTask,
  onSuspend,
  onResume
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'hooks' | 'exploits' | 'install' | 'cli' | 'dotnet' | 'rawdata'>('general');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!process) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isFrozen = process.status === 'frozen';
  const isTerminated = process.status === 'terminated';
  const isSuspicious = process.threatCategory === 'suspicious_unverified';

  const freezeCmds = getFreezeCommand(process.pid, process.name);
  const termCmds = getTerminateCommand(process.pid, process.name);
  const dotNetCode = generateDotNetSnippet(process.pid, process.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 select-none animate-in fade-in duration-100">
      <div
        className={`w-full max-w-[660px] rounded-lg border shadow-2xl overflow-hidden flex flex-col ${
          theme === 'dark'
            ? 'bg-[#202020] text-[#e0e0e0] border-[#383838]'
            : 'bg-[#f9f9f9] text-[#1c1c1c] border-[#cecece]'
        }`}
      >
        {/* Windows Dialog Title Bar */}
        <div
          className={`h-8 px-3 flex items-center justify-between border-b text-xs ${
            theme === 'dark' ? 'bg-[#181818] border-[#333333]' : 'bg-[#f0f0f0] border-[#e0e0e0]'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <Shield className="w-3.5 h-3.5 text-[#0078d4]" />
            <span className="font-semibold truncate">{process.name} Properties</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-6 flex items-center justify-center hover:bg-[#e81123] hover:text-white transition-colors rounded-xs"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Windows Native Tab Headers */}
        <div
          className={`flex items-center px-3 pt-2 gap-1 border-b text-xs ${
            theme === 'dark' ? 'bg-[#202020] border-[#383838]' : 'bg-[#f9f9f9] border-[#e0e0e0]'
          }`}
        >
          {[
            { id: 'general', label: 'General' },
            { id: 'hooks', label: `Hooked APIs (${process.hooks.length})` },
            { id: 'exploits', label: `Exploits (${process.exploitAttempts?.length || 0})` },
            { id: 'install', label: 'Installation & Registry' },
            { id: 'cli', label: 'Windows CLI' },
            { id: 'dotnet', label: '.NET (C#)' },
            { id: 'rawdata', label: 'Raw Data' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-t-md text-xs font-normal border-t border-x -mb-px transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? theme === 'dark'
                    ? 'bg-[#2b2b2b] text-white border-[#454545] font-semibold'
                    : 'bg-[#ffffff] text-black border-[#cccccc] font-semibold'
                  : theme === 'dark'
                  ? 'border-transparent text-[#999999] hover:text-[#cccccc]'
                  : 'border-transparent text-[#666666] hover:text-[#222222]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Box */}
        <div
          className={`p-4 min-h-[360px] max-h-[500px] overflow-y-auto text-xs ${
            theme === 'dark' ? 'bg-[#2b2b2b]' : 'bg-[#ffffff]'
          }`}
        >
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4 font-sans">
              {/* Process Top Header */}
              <div className="flex items-start gap-3 pb-3 border-b border-neutral-700/30">
                <div
                  className={`w-10 h-10 rounded flex items-center justify-center shrink-0 border ${
                    isSuspicious
                      ? 'bg-rose-950/40 border-rose-800 text-rose-400'
                      : 'bg-[#0078d4]/10 border-[#0078d4]/30 text-[#0078d4]'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1 truncate">
                  <div className="text-sm font-semibold truncate">{process.name}</div>
                  <div className="text-[11px] opacity-70 truncate">{process.publisher}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        process.status === 'active'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                          : process.status === 'frozen'
                          ? 'bg-sky-950/60 text-sky-400 border border-sky-800'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {process.status.toUpperCase()}
                    </span>
                    <span className="font-mono text-[11px] opacity-80">PID: {process.pid}</span>
                    <span className="opacity-50">·</span>
                    <span className="font-mono text-[11px] opacity-80">Parent PID: {process.parentPid}</span>
                  </div>
                </div>
              </div>

              {/* General Properties Table */}
              <div className="grid grid-cols-[130px_1fr] gap-y-2 gap-x-2 text-xs">
                <span className="opacity-60">Type of file:</span>
                <span>Application (.exe)</span>

                <span className="opacity-60">Description:</span>
                <span>{process.hooks[0]?.description || 'Windows Background Process'}</span>

                <span className="opacity-60">Location:</span>
                <span className="font-mono break-all select-all">{process.executablePath}</span>

                <span className="opacity-60">Installed Date:</span>
                <span className="font-semibold text-[#0078d4]">
                  {process.installation.installedDateFormatted} ({process.installation.daysAgo} days ago)
                </span>

                <span className="opacity-60">Install Source:</span>
                <span>{process.installation.installSource}</span>

                <span className="opacity-60">Digital Signature:</span>
                <span className="flex items-center gap-1.5">
                  {process.isSigned ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Valid signature ({process.publisher})</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-rose-500 font-semibold">Unsigned / Unverified Binary</span>
                    </>
                  )}
                </span>

                <span className="opacity-60">Working Set (RAM):</span>
                <span className="font-mono">{process.memoryMb.toFixed(1)} MB</span>

                <span className="opacity-60">Active Threads:</span>
                <span className="font-mono">{process.threadsCount} threads</span>

                <span className="opacity-60">Command Line:</span>
                <span className="font-mono text-[11px] break-all select-all bg-neutral-800/10 dark:bg-neutral-900/50 p-1 rounded">
                  {process.commandLine}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: HOOKED APIS */}
          {activeTab === 'hooks' && (
            <div className="space-y-3 font-sans">
              <div className="text-[11px] opacity-70">
                The following Windows operating system APIs are actively intercepted by this process:
              </div>

              {process.hooks.map((hook) => (
                <div
                  key={hook.id}
                  className={`p-3 rounded border space-y-2 text-xs ${
                    theme === 'dark' ? 'bg-[#222222] border-[#383838]' : 'bg-[#f5f5f5] border-[#e0e0e0]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-[#0078d4]">
                      {hook.targetModule}!{hook.targetApi}
                    </span>
                    <span className="text-[11px] opacity-70 font-mono">{hook.hookType}</span>
                  </div>

                  <p className="text-[11px] opacity-80 leading-relaxed">{hook.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-black/10 dark:bg-black/30 p-2 rounded">
                    <div>
                      <span className="opacity-60">Original VA: </span>
                      <span>{hook.originalAddress}</span>
                    </div>
                    <div>
                      <span className="opacity-60">Hooked VA: </span>
                      <span className="text-rose-400 font-semibold">{hook.hookedAddress}</span>
                    </div>
                    <div className="col-span-2 truncate">
                      <span className="opacity-60">Hooking Module: </span>
                      <span className="text-cyan-400">{hook.hookingModule}</span>
                    </div>
                  </div>

                  {/* Disassembly Trampoline */}
                  <div className="text-[11px] font-mono bg-black/20 dark:bg-black/40 p-2 rounded space-y-1">
                    <div className="flex gap-2">
                      <span className="opacity-50 w-16">Prologue:</span>
                      <span className="opacity-80">{hook.disassembly.originalBytecode}</span>
                    </div>
                    <div className="flex gap-2 text-rose-400 font-semibold">
                      <span className="opacity-70 w-16">Patched:</span>
                      <span>{hook.disassembly.hookedBytecode} ({hook.disassembly.instruction})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: INSTALLATION REGISTRY */}
          {activeTab === 'install' && (
            <div className="space-y-3 font-sans">
              <div className="text-[11px] opacity-70">
                Windows Registry Software Uninstall & Installation metadata:
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div>
                  <div className="opacity-60 text-[11px] font-sans">Installation Date (Registry Recorded):</div>
                  <div className="font-semibold text-sm mt-0.5 text-[#0078d4]">
                    {process.installation.installedDateFormatted} ({process.installation.daysAgo} days ago)
                  </div>
                </div>

                <div>
                  <div className="opacity-60 text-[11px] font-sans">Windows Registry Key:</div>
                  <div className="p-1.5 rounded bg-black/10 dark:bg-black/30 break-all select-all text-[11px]">
                    {process.installation.registryKey || 'No standard HKLM/HKCU registry entry (Portable / Temporary)'}
                  </div>
                </div>

                <div>
                  <div className="opacity-60 text-[11px] font-sans">Install Directory:</div>
                  <div className="p-1.5 rounded bg-black/10 dark:bg-black/30 break-all select-all text-[11px]">
                    {process.installation.installLocation}
                  </div>
                </div>

                <div>
                  <div className="opacity-60 text-[11px] font-sans">Uninstaller Command:</div>
                  <div className="p-1.5 rounded bg-black/10 dark:bg-black/30 break-all select-all text-[11px]">
                    {process.installation.uninstallString || 'No uninstaller recorded'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <span className="opacity-60 font-sans">Version: </span>
                    <span>{process.installation.version}</span>
                  </div>
                  <div>
                    <span className="opacity-60 font-sans">Installer: </span>
                    <span>{process.installation.installerType}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WINDOWS CLI */}
          {activeTab === 'cli' && (
            <div className="space-y-4 font-sans">
              <div className="text-[11px] opacity-70">
                Execute these commands in Windows PowerShell or CMD (as Administrator) on the target host:
              </div>

              <div className="space-y-3">
                {/* PowerShell Kill */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">Force Terminate (PowerShell):</span>
                    <button
                      onClick={() => handleCopy(termCmds.ps, 'term-ps')}
                      className="flex items-center gap-1 text-[#0078d4] hover:underline"
                    >
                      {copiedKey === 'term-ps' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'term-ps' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2 bg-black/15 dark:bg-black/40 rounded font-mono text-[11px] text-rose-400 select-all overflow-x-auto">
                    {termCmds.ps}
                  </pre>
                </div>

                {/* CMD Kill */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">Force Terminate (Command Prompt / taskkill):</span>
                    <button
                      onClick={() => handleCopy(termCmds.cmd, 'term-cmd')}
                      className="flex items-center gap-1 text-[#0078d4] hover:underline"
                    >
                      {copiedKey === 'term-cmd' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'term-cmd' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2 bg-black/15 dark:bg-black/40 rounded font-mono text-[11px] text-rose-400 select-all overflow-x-auto">
                    {termCmds.cmd}
                  </pre>
                </div>

                {/* Freeze */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">Suspend Process (PsSuspend):</span>
                    <button
                      onClick={() => handleCopy(freezeCmds.sysinternals, 'freeze-cmd')}
                      className="flex items-center gap-1 text-[#0078d4] hover:underline"
                    >
                      {copiedKey === 'freeze-cmd' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'freeze-cmd' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2 bg-black/15 dark:bg-black/40 rounded font-mono text-[11px] text-sky-400 select-all overflow-x-auto">
                    {freezeCmds.sysinternals}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: .NET (C#) P/INVOKE SNIPPET */}
          {activeTab === 'dotnet' && (
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-[11px] opacity-70">
                  Targeted .NET 8 / C# P/Invoke control code for PID {process.pid}:
                </span>
                <button
                  onClick={() => handleCopy(dotNetCode, 'dotnet-code')}
                  className="flex items-center gap-1 text-[#0078d4] hover:underline"
                >
                  {copiedKey === 'dotnet-code' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'dotnet-code' ? 'Copied C#' : 'Copy C# Code'}</span>
                </button>
              </div>

              <pre className="p-2.5 bg-black/20 dark:bg-black/50 rounded font-mono text-[11px] text-[#60cdff] dark:text-[#60cdff] select-all overflow-x-auto max-h-[340px] leading-relaxed">
                <code>{dotNetCode}</code>
              </pre>

              <div className="text-[10px] opacity-60">
                P/Invoke targets: <code className="font-mono text-[#0078d4]">ntdll!NtSuspendProcess</code> and <code className="font-mono text-[#0078d4]">System.Diagnostics.Process.Kill()</code>.
              </div>
            </div>
          )}

          {/* TAB 6: RAW DATA */}
          {activeTab === 'rawdata' && (
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-[11px] opacity-70">
                  Raw Registry Key-Value Pairs (RegEdit Format):
                </span>
                <button
                  onClick={() => handleCopy(JSON.stringify(process, null, 2), 'raw-json')}
                  className="flex items-center gap-1 text-[#0078d4] hover:underline cursor-pointer"
                >
                  {copiedKey === 'raw-json' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'raw-json' ? 'Copied JSON' : 'Copy Raw JSON'}</span>
                </button>
              </div>

              {/* Raw Registry Values Table */}
              <div className="border rounded overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse font-mono">
                  <thead>
                    <tr className={`h-6 border-b text-[10px] font-sans font-medium ${
                      theme === 'dark' ? 'bg-[#202020] border-[#2c2c2c] text-[#aaaaaa]' : 'bg-[#f4f4f4] border-[#e0e0e0] text-[#555555]'
                    }`}>
                      <th className="py-1 px-2 border-r border-inherit w-36">Value Name</th>
                      <th className="py-1 px-2 border-r border-inherit w-24">Type</th>
                      <th className="py-1 px-2">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {process.installation.rawRegistryValues &&
                      Object.entries(process.installation.rawRegistryValues).map(([k, v]) => (
                        <tr key={k} className={theme === 'dark' ? 'hover:bg-[#252525]' : 'hover:bg-[#f9f9f9]'}>
                          <td className="py-1 px-2 border-r border-inherit text-[#0078d4] font-semibold">{k}</td>
                          <td className="py-1 px-2 border-r border-inherit opacity-70">{v.type}</td>
                          <td className="py-1 px-2 break-all select-all">{v.hex ? `${v.hex} (${v.value})` : String(v.value)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Raw JSON viewer */}
              <div className="space-y-1">
                <div className="text-[10px] opacity-60 font-mono">Complete Object Graph JSON:</div>
                <pre className="p-2 bg-black/20 dark:bg-black/50 rounded font-mono text-[10px] text-slate-300 overflow-x-auto max-h-[140px] select-all">
                  <code>{JSON.stringify(process, null, 2)}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB: EXPLOITS & THREAT VECTORS */}
          {activeTab === 'exploits' && (
            <div className="space-y-4 font-sans">
              <div
                className={`p-3 rounded border flex items-start gap-2.5 ${
                  (process.exploitAttempts && process.exploitAttempts.length > 0)
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                    : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                }`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-xs">
                    {(process.exploitAttempts && process.exploitAttempts.length > 0)
                      ? `${process.exploitAttempts.length} Exploit Attempt(s) Intercepted`
                      : 'No Active Exploit Attacks Detected'}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    Monitored vectors: Windows Raw Input API, DLL Injection & Inline Hooking, Framebuffer Screen Scraping, Direct Memory Inspection.
                  </div>
                </div>
              </div>

              {/* Detected Exploit Vectors */}
              <div>
                <div className="text-[11px] font-semibold opacity-75 mb-1.5">Detected Threat Vectors:</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {process.detectedExploitVectors && process.detectedExploitVectors.length > 0 ? (
                    process.detectedExploitVectors.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase"
                      >
                        {v.replace(/_/g, ' ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] opacity-60">None reported</span>
                  )}
                </div>
              </div>

              {/* Exploit Attempts List */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold opacity-75">Intercepted Win32 Calls:</div>
                {process.exploitAttempts && process.exploitAttempts.length > 0 ? (
                  process.exploitAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className={`p-2.5 rounded border text-xs space-y-1.5 ${
                        theme === 'dark' ? 'bg-[#202020] border-[#333333]' : 'bg-[#f7f7f7] border-[#e0e0e0]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#0078d4] font-mono">{attempt.targetApi}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {attempt.severity}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-80">{attempt.description}</p>
                      <div className="text-[10px] opacity-60 font-mono">
                        Target: {attempt.targetEntity}
                      </div>

                      {/* Raw Call Params Table */}
                      <div
                        className={`p-2 rounded font-mono text-[10px] border ${
                          theme === 'dark' ? 'bg-[#141414] border-[#292929]' : 'bg-[#f0f0f0] border-[#d8d8d8]'
                        }`}
                      >
                        {Object.entries(attempt.rawCallParameters).map(([k, val]) => (
                          <div key={k} className="flex gap-2">
                            <span className="text-[#0078d4] font-semibold">{k}:</span>
                            <span className="opacity-90">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs opacity-60">
                    No intercepted exploit calls logged for this process.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Windows Dialog Bottom Control Buttons: [ End Task ] [ Suspend/Resume ] [ OK ] [ Cancel ] */}
        <div
          className={`h-12 px-4 flex items-center justify-between border-t text-xs ${
            theme === 'dark' ? 'bg-[#1f1f1f] border-[#383838]' : 'bg-[#f0f0f0] border-[#e0e0e0]'
          }`}
        >
          {/* Quick process intervention in dialog */}
          <div className="flex items-center gap-1.5">
            {!isTerminated && (
              <button
                onClick={() => onEndTask(process)}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium cursor-pointer"
              >
                End Process
              </button>
            )}
            {!isTerminated && (
              isFrozen ? (
                <button
                  onClick={() => onResume(process)}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
                >
                  Resume
                </button>
              ) : (
                <button
                  onClick={() => onSuspend(process)}
                  className="px-2.5 py-1 rounded bg-[#0078d4] hover:bg-[#0063b1] text-white font-medium cursor-pointer"
                >
                  Suspend
                </button>
              )
            )}
          </div>

          {/* Standard Windows Dialog Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`min-w-[75px] px-3 py-1 rounded border font-medium cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#333333] hover:bg-[#3d3d3d] border-[#454545] text-white'
                  : 'bg-[#e1e1e1] hover:bg-[#d5d5d5] border-[#adadad] text-black'
              }`}
            >
              OK
            </button>
            <button
              onClick={onClose}
              className={`min-w-[75px] px-3 py-1 rounded border font-medium cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#2b2b2b] hover:bg-[#333333] border-[#383838] text-[#cccccc]'
                  : 'bg-[#f5f5f5] hover:bg-[#e8e8e8] border-[#cccccc] text-[#333333]'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
