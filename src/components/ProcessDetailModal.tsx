import React, { useState } from 'react';
import {
  X,
  Pause,
  Play,
  Square,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Code2,
  Calendar,
  Terminal,
  Cpu,
  Layers
} from 'lucide-react';
import { HookedProcess } from '../types/inspector';
import { getFreezeCommand, getResumeCommand, getTerminateCommand } from '../utils/powershellScript';

interface ProcessDetailModalProps {
  process: HookedProcess | null;
  onClose: () => void;
  onFreezeProcess: (process: HookedProcess) => void;
  onResumeProcess: (process: HookedProcess) => void;
  onTerminateProcess: (process: HookedProcess) => void;
  onRestoreProcess: (process: HookedProcess) => void;
}

export const ProcessDetailModal: React.FC<ProcessDetailModalProps> = ({
  process,
  onClose,
  onFreezeProcess,
  onResumeProcess,
  onTerminateProcess,
  onRestoreProcess
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeCliTab, setActiveCliTab] = useState<'powershell' | 'cmd' | 'sysinternals'>('powershell');

  if (!process) return null;

  const freezeCmds = getFreezeCommand(process.pid, process.name);
  const resumeCmds = getResumeCommand(process.pid, process.name);
  const termCmds = getTerminateCommand(process.pid, process.name);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isFrozen = process.status === 'frozen';
  const isTerminated = process.status === 'terminated';
  const isSuspicious = process.threatCategory === 'suspicious_unverified';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${isSuspicious ? 'bg-rose-950/40 border-rose-800 text-rose-400' : 'bg-slate-800 border-slate-700 text-cyan-400'}`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-100">{process.name}</h3>
                <span className="font-mono text-xs text-slate-400 tabular-nums">PID {process.pid}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                  process.status === 'active' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' :
                  process.status === 'frozen' ? 'bg-sky-950/60 text-sky-400 border border-sky-800/60' :
                  'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                }`}>
                  {process.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">{process.publisher}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Action Controls Banner */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="text-xs">
              <span className="font-medium text-slate-200">Process State: </span>
              <span className="text-slate-400">
                {isTerminated
                  ? 'Process terminated. Memory space freed and active hooks detached.'
                  : isFrozen
                  ? 'Process execution suspended. Threads halted via NtSuspendProcess.'
                  : 'Process active and currently intercepting target Windows API calls.'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!isTerminated && (
                isFrozen ? (
                  <button
                    onClick={() => onResumeProcess(process)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Resume Process
                  </button>
                ) : (
                  <button
                    onClick={() => onFreezeProcess(process)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-950 hover:bg-sky-900 border border-sky-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Freeze (Suspend)
                  </button>
                )
              )}

              {!isTerminated ? (
                <button
                  onClick={() => onTerminateProcess(process)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950 hover:bg-rose-900 border border-rose-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  Terminate (Kill)
                </button>
              ) : (
                <button
                  onClick={() => onRestoreProcess(process)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Restore Simulation
                </button>
              )}
            </div>
          </div>

          {/* Hooked Windows APIs & Disassembly */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              Hooked Windows APIs ({process.hooks.length})
            </h4>

            <div className="space-y-3">
              {process.hooks.map((hook, index) => (
                <div key={hook.id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-semibold text-cyan-300">
                        {hook.targetModule}!{hook.targetApi}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">({hook.hookType})</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Module: <span className="text-slate-200">{hook.hookingModule}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {hook.description}
                  </p>

                  {/* Virtual Memory Offsets */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/80 p-2.5 rounded border border-slate-800">
                    <div>
                      <span className="text-slate-500">Original Function VA: </span>
                      <span className="text-slate-300">{hook.originalAddress}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Redirected Detour VA: </span>
                      <span className="text-rose-400">{hook.hookedAddress}</span>
                    </div>
                  </div>

                  {/* Disassembly Trampoline Comparison */}
                  <div className="space-y-1 text-xs font-mono">
                    <div className="text-[11px] text-slate-500">Prologue Patch Disassembly:</div>
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 w-16">Original:</span>
                        <span className="text-slate-400">{hook.disassembly.originalBytecode}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-rose-400 w-16">Patched:</span>
                        <span className="text-rose-300 font-semibold">{hook.disassembly.hookedBytecode}</span>
                        <span className="text-cyan-400 ml-2">({hook.disassembly.instruction})</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Installation & Registry Telemetry */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Windows Installation & Registry Metadata
            </h4>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2.5 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-slate-500 text-[11px]">Install Date (Registry)</div>
                  <div className="text-slate-100 font-semibold mt-0.5">
                    {process.installation.installedDateFormatted} ({process.installation.daysAgo} days ago)
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Installer Framework</div>
                  <div className="text-slate-200 mt-0.5">
                    {process.installation.installerType} v{process.installation.version}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-2 space-y-2">
                <div>
                  <div className="text-slate-500 text-[11px]">Windows Registry Uninstall Key</div>
                  <div className="text-slate-300 break-all select-all mt-0.5 bg-slate-900/60 p-1.5 rounded">
                    {process.installation.registryKey || 'Not registered in standard Uninstall keys (AppData portable or hidden)'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Installation Directory</div>
                  <div className="text-slate-300 break-all select-all mt-0.5 bg-slate-900/60 p-1.5 rounded">
                    {process.installation.installLocation}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Uninstaller Command</div>
                  <div className="text-slate-300 break-all select-all mt-0.5 bg-slate-900/60 p-1.5 rounded">
                    {process.installation.uninstallString || 'No uninstall string found'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Windows Terminal Commands */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Windows Native Commands (For Host Machine)
              </h4>

              <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded text-xs">
                <button
                  onClick={() => setActiveCliTab('powershell')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${activeCliTab === 'powershell' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  PowerShell
                </button>
                <button
                  onClick={() => setActiveCliTab('cmd')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${activeCliTab === 'cmd' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  CMD / Batch
                </button>
                <button
                  onClick={() => setActiveCliTab('sysinternals')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${activeCliTab === 'sysinternals' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  PsSuspend
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-3 font-mono text-xs">
              {/* Terminate Command */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>To Force Terminate on Windows:</span>
                  <button
                    onClick={() => handleCopy(activeCliTab === 'powershell' ? termCmds.ps : termCmds.cmd, 'term')}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'term' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'term' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-2 bg-slate-900 rounded text-rose-300 overflow-x-auto text-[11px]">
                  {activeCliTab === 'powershell' ? termCmds.ps : termCmds.cmd}
                </pre>
              </div>

              {/* Freeze Command */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>To Freeze (Suspend) on Windows:</span>
                  <button
                    onClick={() => handleCopy(
                      activeCliTab === 'powershell' ? freezeCmds.ps :
                      activeCliTab === 'cmd' ? freezeCmds.cmd : freezeCmds.sysinternals,
                      'freeze'
                    )}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'freeze' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'freeze' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-2 bg-slate-900 rounded text-sky-300 overflow-x-auto text-[11px]">
                  {activeCliTab === 'powershell' ? freezeCmds.ps :
                   activeCliTab === 'cmd' ? freezeCmds.cmd : freezeCmds.sysinternals}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-500">
          <span>Target Platform: Windows 10/11 x64 · User & Kernel Subsystem</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
