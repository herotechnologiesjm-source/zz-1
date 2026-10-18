import React from 'react';
import { HookedProcess } from '../types/inspector';

interface SummaryMetricsProps {
  processes: HookedProcess[];
}

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ processes }) => {
  const total = processes.length;
  const active = processes.filter((p) => p.status === 'active').length;
  const frozen = processes.filter((p) => p.status === 'frozen').length;
  const terminated = processes.filter((p) => p.status === 'terminated').length;
  const totalHooks = processes.reduce((acc, p) => acc + (p.status !== 'terminated' ? p.hooks.length : 0), 0);
  const installedRecent = processes.filter((p) => p.installation.daysAgo <= 30).length;
  const unverified = processes.filter((p) => !p.isSigned && p.status !== 'terminated').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
        <div className="text-xs text-slate-400 font-medium">Hooked Programs</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-slate-100 font-mono tabular-nums">{total}</span>
          <span className="text-xs text-slate-500 font-mono">detected</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">Across user & system space</div>
      </div>

      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
        <div className="text-xs text-slate-400 font-medium">Active Interceptions</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-cyan-400 font-mono tabular-nums">{totalHooks}</span>
          <span className="text-xs text-slate-500 font-mono">APIs</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">Keyboard, DirectX, GDI, Net</div>
      </div>

      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
        <div className="text-xs text-slate-400 font-medium">Frozen (Suspended)</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-sky-400 font-mono tabular-nums">{frozen}</span>
          <span className="text-xs text-slate-500 font-mono">paused</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">Threads halted via NtSuspend</div>
      </div>

      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
        <div className="text-xs text-slate-400 font-medium">Terminated (Killed)</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-rose-400 font-mono tabular-nums">{terminated}</span>
          <span className="text-xs text-slate-500 font-mono">stopped</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">Hooks released & memory freed</div>
      </div>

      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
        <div className="text-xs text-slate-400 font-medium">Installed &lt; 30 Days</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-amber-400 font-mono tabular-nums">{installedRecent}</span>
          <span className="text-xs text-slate-500 font-mono">recent</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">New software registry entries</div>
      </div>

      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
        <div className="text-xs text-slate-400 font-medium">Unverified / Unsigned</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className={`text-2xl font-semibold font-mono tabular-nums ${unverified > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {unverified}
          </span>
          <span className="text-xs text-slate-500 font-mono">binaries</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">Requires security attention</div>
      </div>
    </div>
  );
};
