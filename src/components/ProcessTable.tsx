import React from 'react';
import {
  Pause,
  Play,
  Square,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Layers,
  FileCode
} from 'lucide-react';
import { HookedProcess } from '../types/inspector';

interface ProcessTableProps {
  theme: 'dark' | 'light';
  processes: HookedProcess[];
  selectedIds: string[];
  onToggleSelect: (id: string, e?: React.MouseEvent) => void;
  onToggleSelectAll: () => void;
  onFreezeProcess: (process: HookedProcess) => void;
  onResumeProcess: (process: HookedProcess) => void;
  onTerminateProcess: (process: HookedProcess) => void;
  onRestoreProcess: (process: HookedProcess) => void;
  onInspectProcess: (process: HookedProcess) => void;
  onContextMenu: (e: React.MouseEvent, process: HookedProcess) => void;
  sortField: 'name' | 'pid' | 'installedDate' | 'hooks' | 'memory';
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: 'name' | 'pid' | 'installedDate' | 'hooks' | 'memory') => void;
}

export const ProcessTable: React.FC<ProcessTableProps> = ({
  theme,
  processes,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onFreezeProcess,
  onResumeProcess,
  onTerminateProcess,
  onRestoreProcess,
  onInspectProcess,
  onContextMenu,
  sortField,
  sortOrder,
  onSortChange
}) => {
  const allSelected = processes.length > 0 && selectedIds.length === processes.length;

  const renderSortArrow = (field: 'name' | 'pid' | 'installedDate' | 'hooks' | 'memory') => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1 inline-block text-[#0078d4]">
        {sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />}
      </span>
    );
  };

  if (processes.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-20 px-4 text-center select-none ${
          theme === 'dark' ? 'text-[#888888]' : 'text-[#666666]'
        }`}
      >
        <Layers className="w-10 h-10 mb-2 opacity-40" />
        <h4 className="text-sm font-semibold text-current">No hooked processes found</h4>
        <p className="mt-1 text-xs opacity-75 max-w-sm">
          No running processes match your current filter or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`overflow-x-auto select-none border rounded-xs ${
        theme === 'dark'
          ? 'bg-[#181818] border-[#2d2d2d]'
          : 'bg-[#ffffff] border-[#e0e0e0]'
      }`}
    >
      <table className="w-full text-left text-xs border-collapse">
        {/* Windows Native Listview Header */}
        <thead>
          <tr
            className={`h-7 border-b text-[11px] font-medium ${
              theme === 'dark'
                ? 'bg-[#202020] text-[#aaaaaa] border-[#2d2d2d]'
                : 'bg-[#f4f4f4] text-[#555555] border-[#e0e0e0]'
            }`}
          >
            <th className="w-7 px-2 border-r border-inherit">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="rounded-xs cursor-pointer accent-[#0078d4]"
                aria-label="Select all"
              />
            </th>
            <th
              onClick={() => onSortChange('name')}
              className="py-1 px-3 cursor-pointer border-r border-inherit hover:bg-neutral-500/10 transition-colors"
            >
              Name {renderSortArrow('name')}
            </th>
            <th
              onClick={() => onSortChange('pid')}
              className="py-1 px-3 w-20 cursor-pointer border-r border-inherit hover:bg-neutral-500/10 transition-colors"
            >
              PID {renderSortArrow('pid')}
            </th>
            <th
              onClick={() => onSortChange('hooks')}
              className="py-1 px-3 cursor-pointer border-r border-inherit hover:bg-neutral-500/10 transition-colors min-w-[260px]"
            >
              Hooked Windows APIs {renderSortArrow('hooks')}
            </th>
            <th className="py-1 px-3 border-r border-inherit min-w-[130px]">
              Hooking Mechanism
            </th>
            <th
              onClick={() => onSortChange('installedDate')}
              className="py-1 px-3 cursor-pointer border-r border-inherit hover:bg-neutral-500/10 transition-colors min-w-[160px]"
            >
              Installed Date {renderSortArrow('installedDate')}
            </th>
            <th
              onClick={() => onSortChange('memory')}
              className="py-1 px-3 text-right cursor-pointer border-r border-inherit hover:bg-neutral-500/10 transition-colors w-28"
            >
              Memory / CPU {renderSortArrow('memory')}
            </th>
            <th className="py-1 px-3 text-center border-r border-inherit w-24">
              Status
            </th>
            <th className="py-1 px-3 text-right w-36">
              Quick Controls
            </th>
          </tr>
        </thead>

        {/* Windows Native Details Rows */}
        <tbody className="divide-y divide-inherit">
          {processes.map((proc) => {
            const isSelected = selectedIds.includes(proc.id);
            const isSuspicious = proc.threatCategory === 'suspicious_unverified';
            const isFrozen = proc.status === 'frozen';
            const isTerminated = proc.status === 'terminated';

            return (
              <tr
                key={proc.id}
                onClick={(e) => onToggleSelect(proc.id, e)}
                onDoubleClick={() => onInspectProcess(proc)}
                onContextMenu={(e) => onContextMenu(e, proc)}
                className={`h-9 transition-colors cursor-default text-xs ${
                  isSelected
                    ? theme === 'dark'
                      ? 'bg-[#0078d4]/25 text-white'
                      : 'bg-[#0078d4]/15 text-[#111111]'
                    : isTerminated
                    ? 'opacity-40 line-through'
                    : isFrozen
                    ? theme === 'dark'
                      ? 'bg-[#1e2a3a]/40'
                      : 'bg-[#e5f1fb]/50'
                    : isSuspicious
                    ? theme === 'dark'
                      ? 'bg-[#3b1c1e]/40'
                      : 'bg-[#fdeeed]/60'
                    : theme === 'dark'
                    ? 'hover:bg-[#252525]'
                    : 'hover:bg-[#f3f3f3]'
                }`}
              >
                {/* Checkbox */}
                <td className="px-2 border-r border-inherit" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(proc.id)}
                    className="rounded-xs cursor-pointer accent-[#0078d4]"
                    aria-label={`Select ${proc.name}`}
                  />
                </td>

                {/* Name & Publisher */}
                <td className="px-3 py-1.5 border-r border-inherit min-w-[200px]">
                  <div className="flex items-center gap-2">
                    {isSuspicious ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0078d4] shrink-0" />
                    )}
                    <div className="truncate">
                      <div className="font-semibold text-xs truncate leading-tight flex items-center gap-1.5">
                        <span>{proc.name}</span>
                        {proc.isDotNetProcess && (
                          <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-purple-950/70 text-purple-300 border border-purple-800/60 font-normal">
                            .NET
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] opacity-70 truncate font-sans">
                        {proc.publisher} {proc.dotNetRuntime ? `· ${proc.dotNetRuntime}` : ''}
                      </div>
                      {proc.detectedExploitVectors && proc.detectedExploitVectors.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {proc.detectedExploitVectors.map((v) => {
                            let label = '';
                            let colorClass = '';
                            if (v === 'raw_input_abuse') {
                              label = 'Raw Input';
                              colorClass = 'bg-purple-950/70 text-purple-300 border-purple-800/80';
                            } else if (v === 'dll_injection_inline') {
                              label = 'DLL Inject';
                              colorClass = 'bg-rose-950/70 text-rose-300 border-rose-800/80';
                            } else if (v === 'screen_scraping_framebuffer') {
                              label = 'Screen Scrape';
                              colorClass = 'bg-amber-950/70 text-amber-300 border-amber-800/80';
                            } else if (v === 'direct_memory_inspection') {
                              label = 'Mem Read';
                              colorClass = 'bg-blue-950/70 text-blue-300 border-blue-800/80';
                            }
                            return (
                              <span
                                key={v}
                                className={`font-mono text-[9px] px-1 py-0.2 rounded border font-semibold ${colorClass}`}
                                title={`Detected Exploit Vector: ${v}`}
                              >
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* PID */}
                <td className="px-3 py-1.5 border-r border-inherit font-mono tabular-nums text-xs">
                  {proc.pid}
                </td>

                {/* Hooked Windows APIs */}
                <td className="px-3 py-1.5 border-r border-inherit min-w-[260px]">
                  <div className="space-y-0.5">
                    {proc.hooks.map((hook) => (
                      <div key={hook.id} className="truncate">
                        <span className="font-mono text-[11px] font-semibold text-[#0078d4]">
                          {hook.targetModule}!{hook.targetApi}
                        </span>
                        <span className="text-[10px] opacity-70 ml-1.5 font-sans">
                          {hook.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>

                {/* Hooking Mechanism */}
                <td className="px-3 py-1.5 border-r border-inherit text-[11px]">
                  <div className="truncate">{proc.hooks[0]?.hookType}</div>
                  <div className="text-[10px] opacity-60 font-mono truncate">
                    via {proc.hooks[0]?.hookingModule}
                  </div>
                </td>

                {/* Installation Date (Windows Registry) */}
                <td className="px-3 py-1.5 border-r border-inherit text-xs min-w-[160px]">
                  <div className="font-medium text-xs">
                    {proc.installation.installedDateFormatted}
                  </div>
                  <div className="text-[10px] opacity-70">
                    <span className="font-mono tabular-nums">{proc.installation.daysAgo}d ago</span>
                    <span className="mx-1">·</span>
                    <span>{proc.installation.installSource}</span>
                  </div>
                </td>

                {/* Memory / CPU */}
                <td className="px-3 py-1.5 border-r border-inherit text-right font-mono text-xs tabular-nums">
                  <div>{isTerminated ? '0.0 MB' : `${proc.memoryMb.toFixed(1)} MB`}</div>
                  <div className="text-[10px] opacity-60">
                    {isTerminated ? '0.0%' : `${proc.cpuPercent.toFixed(1)}%`}
                  </div>
                </td>

                {/* Status Column (Task Manager Style) */}
                <td className="px-3 py-1.5 border-r border-inherit text-center text-[11px] font-medium">
                  {proc.status === 'active' && (
                    <span className="text-emerald-500">Running</span>
                  )}
                  {proc.status === 'frozen' && (
                    <span className="text-sky-500">Suspended</span>
                  )}
                  {proc.status === 'terminated' && (
                    <span className="text-rose-500">Ended</span>
                  )}
                </td>

                {/* Quick Controls */}
                <td className="px-2 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {/* Freeze / Resume */}
                    {!isTerminated && (
                      isFrozen ? (
                        <button
                          onClick={() => onResumeProcess(proc)}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                          title="Resume execution threads"
                        >
                          Resume
                        </button>
                      ) : (
                        <button
                          onClick={() => onFreezeProcess(proc)}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#0078d4] hover:bg-[#0063b1] text-white transition-colors cursor-pointer"
                          title="Suspend process execution (Freeze)"
                        >
                          Suspend
                        </button>
                      )
                    )}

                    {/* Terminate */}
                    {!isTerminated ? (
                      <button
                        onClick={() => onTerminateProcess(proc)}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                        title="End Task"
                      >
                        End
                      </button>
                    ) : (
                      <button
                        onClick={() => onRestoreProcess(proc)}
                        className="px-2 py-0.5 rounded text-[11px] opacity-75 hover:opacity-100 hover:bg-neutral-500/20 transition-colors cursor-pointer"
                        title="Restore simulated process"
                      >
                        Restore
                      </button>
                    )}

                    {/* Properties */}
                    <button
                      onClick={() => onInspectProcess(proc)}
                      className="p-1 rounded opacity-70 hover:opacity-100 hover:bg-neutral-500/20 transition-colors cursor-pointer"
                      title="Open Properties"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
