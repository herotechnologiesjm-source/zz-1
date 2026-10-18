import React, { useState } from 'react';
import { Calendar, ShieldAlert, CheckCircle, Pause, Play, Square, ExternalLink } from 'lucide-react';
import { HookedProcess } from '../types/inspector';

interface InstallationAuditViewProps {
  theme: 'dark' | 'light';
  processes: HookedProcess[];
  onInspectProcess: (process: HookedProcess) => void;
  onFreezeProcess: (process: HookedProcess) => void;
  onResumeProcess: (process: HookedProcess) => void;
  onTerminateProcess: (process: HookedProcess) => void;
}

export const InstallationAuditView: React.FC<InstallationAuditViewProps> = ({
  theme,
  processes,
  onInspectProcess,
  onFreezeProcess,
  onResumeProcess,
  onTerminateProcess
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'all' | '30d' | '90d' | '1y'>('all');

  const sortedByDate = [...processes].sort((a, b) => {
    return new Date(b.installation.installedDate).getTime() - new Date(a.installation.installedDate).getTime();
  });

  const filtered = sortedByDate.filter((p) => {
    if (filterPeriod === '30d') return p.installation.daysAgo <= 30;
    if (filterPeriod === '90d') return p.installation.daysAgo <= 90;
    if (filterPeriod === '1y') return p.installation.daysAgo <= 365;
    return true;
  });

  return (
    <div className="space-y-3 font-sans text-xs select-none">
      {/* Top Banner / Filter Bar */}
      <div
        className={`p-3 rounded border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          theme === 'dark' ? 'bg-[#202020] border-[#2d2d2d]' : 'bg-[#f5f5f5] border-[#e0e0e0]'
        }`}
      >
        <div>
          <div className="font-semibold text-xs flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0078d4]" />
            <span>Windows Software Installation Registry & Hook Audit</span>
          </div>
          <div className="text-[11px] opacity-70 mt-0.5">
            Cross-referenced against HKLM & HKCU Uninstall keys to verify software install age and uninstaller paths.
          </div>
        </div>

        {/* Filter buttons */}
        <div
          className={`flex items-center gap-1 p-0.5 rounded border ${
            theme === 'dark' ? 'bg-[#181818] border-[#383838]' : 'bg-[#ffffff] border-[#cccccc]'
          }`}
        >
          {(['all', '30d', '90d', '1y'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period)}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                filterPeriod === period
                  ? theme === 'dark'
                    ? 'bg-[#0078d4] text-white font-medium'
                    : 'bg-[#0078d4] text-white font-medium'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              {period === 'all' ? 'All Installed' : period === '30d' ? 'Last 30 Days' : period === '90d' ? 'Last 90 Days' : 'Last 1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Installed Hooked Programs */}
      <div className="space-y-2">
        {filtered.map((proc) => {
          const isSuspicious = proc.threatCategory === 'suspicious_unverified';
          const isFrozen = proc.status === 'frozen';
          const isTerminated = proc.status === 'terminated';

          return (
            <div
              key={proc.id}
              className={`p-3 rounded border transition-colors ${
                isTerminated
                  ? 'opacity-40'
                  : isFrozen
                  ? theme === 'dark'
                    ? 'bg-[#1e2a3a]/30 border-[#234567]'
                    : 'bg-[#e5f1fb]/40 border-[#b3d7f7]'
                  : isSuspicious
                  ? theme === 'dark'
                    ? 'bg-[#3b1c1e]/30 border-[#6b2226]'
                    : 'bg-[#fdeeed]/50 border-[#f5b8bc]'
                  : theme === 'dark'
                  ? 'bg-[#1f1f1f] border-[#2c2c2c] hover:border-[#3d3d3d]'
                  : 'bg-[#ffffff] border-[#e2e2e2] hover:border-[#cccccc]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-semibold text-xs">{proc.name}</span>
                    <span className="font-mono text-[11px] opacity-70">PID {proc.pid}</span>
                    <span className="opacity-40">·</span>
                    <span className="font-semibold text-[#0078d4]">
                      Installed: {proc.installation.installedDateFormatted} ({proc.installation.daysAgo} days ago)
                    </span>
                    <span className="opacity-40">·</span>
                    <span className="opacity-80 font-sans">{proc.installation.installSource}</span>

                    {proc.isSigned ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-500 ml-auto md:ml-0">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Signed by {proc.publisher}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-rose-500 font-medium ml-auto md:ml-0">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Unsigned / Portable Persistence
                      </span>
                    )}
                  </div>

                  {/* Hooked APIs tags */}
                  <div className="flex items-center flex-wrap gap-1.5 text-[11px]">
                    <span className="opacity-70">Hooked APIs:</span>
                    {proc.hooks.map((h) => (
                      <span
                        key={h.id}
                        className={`font-mono px-1.5 py-0.5 rounded text-[11px] ${
                          theme === 'dark' ? 'bg-[#2a2a2a] text-[#60cdff]' : 'bg-[#e5f1fb] text-[#0067b8]'
                        }`}
                      >
                        {h.targetModule}!{h.targetApi}
                      </span>
                    ))}
                  </div>

                  {/* Windows Registry Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pt-1.5 border-t border-inherit text-[11px] font-mono opacity-80">
                    <div className="truncate">
                      <span className="opacity-60 font-sans">Install Path: </span>
                      <span>{proc.installation.installLocation}</span>
                    </div>
                    <div className="truncate">
                      <span className="opacity-60 font-sans">Registry: </span>
                      <span>{proc.installation.registryKey || 'Not registered in Windows Uninstall Key'}</span>
                    </div>
                    <div className="truncate">
                      <span className="opacity-60 font-sans">Installer: </span>
                      <span>{proc.installation.installerType} v{proc.installation.version}</span>
                    </div>
                    <div className="truncate">
                      <span className="opacity-60 font-sans">Uninstaller: </span>
                      <span>{proc.installation.uninstallString || 'None'}</span>
                    </div>
                  </div>
                </div>

                {/* Process Actions */}
                <div className="flex items-center md:flex-col md:items-end justify-between gap-2 shrink-0">
                  <span className="font-mono text-[11px] font-medium">
                    {proc.status === 'active' && <span className="text-emerald-500">Running</span>}
                    {proc.status === 'frozen' && <span className="text-sky-500">Suspended</span>}
                    {proc.status === 'terminated' && <span className="text-rose-500">Ended</span>}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {!isTerminated && (
                      isFrozen ? (
                        <button
                          onClick={() => onResumeProcess(proc)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                        >
                          Resume
                        </button>
                      ) : (
                        <button
                          onClick={() => onFreezeProcess(proc)}
                          className="px-2.5 py-1 rounded bg-[#0078d4] hover:bg-[#0063b1] text-white transition-colors cursor-pointer"
                        >
                          Suspend
                        </button>
                      )
                    )}

                    {!isTerminated && (
                      <button
                        onClick={() => onTerminateProcess(proc)}
                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                      >
                        End Task
                      </button>
                    )}

                    <button
                      onClick={() => onInspectProcess(proc)}
                      className={`px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-[#2b2b2b] hover:bg-[#333333] border-[#383838]'
                          : 'bg-[#f5f5f5] hover:bg-[#ebebeb] border-[#cccccc]'
                      }`}
                    >
                      Properties
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
