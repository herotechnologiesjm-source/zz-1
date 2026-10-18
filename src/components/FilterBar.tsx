import React from 'react';
import { Search, Pause, Square, Plus, Download, RotateCcw } from 'lucide-react';
import { FilterCategory, StatusFilter, DateFilter } from '../types/inspector';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categoryFilter: FilterCategory;
  onCategoryFilterChange: (cat: FilterCategory) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (date: DateFilter) => void;
  selectedCount: number;
  onBulkFreeze: () => void;
  onBulkTerminate: () => void;
  onOpenAddCustomHook: () => void;
  onExportCsv: () => void;
  onResetSampleData: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  selectedCount,
  onBulkFreeze,
  onBulkTerminate,
  onOpenAddCustomHook,
  onExportCsv,
  onResetSampleData
}) => {
  return (
    <div className="space-y-3 mb-4">
      {/* Top row: search + bulk actions + tool buttons */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by process, PID, hooked API (e.g. SetWindowsHookEx, Present, user32)..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-colors"
          />
        </div>

        {/* Action group */}
        <div className="flex items-center flex-wrap gap-2">
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-700 rounded-lg">
              <span className="text-xs text-slate-300 font-mono px-2">
                {selectedCount} selected
              </span>
              <button
                onClick={onBulkFreeze}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-sky-300 bg-sky-950/70 hover:bg-sky-900/80 border border-sky-800/60 rounded-md transition-colors cursor-pointer"
                title="Freeze / Suspend all selected processes"
              >
                <Pause className="w-3 h-3" />
                Freeze Selected
              </button>
              <button
                onClick={onBulkTerminate}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-rose-300 bg-rose-950/70 hover:bg-rose-900/80 border border-rose-800/60 rounded-md transition-colors cursor-pointer"
                title="Terminate / Kill all selected processes"
              >
                <Square className="w-3 h-3" />
                Terminate Selected
              </button>
            </div>
          )}

          <button
            onClick={onOpenAddCustomHook}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            Add Custom Process
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Export full security audit data as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export CSV
          </button>

          <button
            onClick={onResetSampleData}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset telemetry to initial system baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs / Segmented Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
        {/* Hook Category Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs">
          <button
            onClick={() => onCategoryFilterChange('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Hook Types
          </button>
          <button
            onClick={() => onCategoryFilterChange('input')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              categoryFilter === 'input'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Keyboard & Input Hooks
          </button>
          <button
            onClick={() => onCategoryFilterChange('graphics')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              categoryFilter === 'graphics'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DirectX & Overlays
          </button>
          <button
            onClick={() => onCategoryFilterChange('network')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              categoryFilter === 'network'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Network & Sockets
          </button>
          <button
            onClick={() => onCategoryFilterChange('suspicious')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              categoryFilter === 'suspicious'
                ? 'bg-rose-950/80 text-rose-300 shadow-xs border border-rose-800/40'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            Suspicious / Anomalies
          </button>
        </div>

        {/* Secondary Filters: Status & Install Date */}
        <div className="flex items-center gap-3">
          {/* Status selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-slate-300 font-mono text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">All States</option>
              <option value="active">Active only</option>
              <option value="frozen">Frozen (Suspended) only</option>
              <option value="terminated">Terminated only</option>
            </select>
          </div>

          {/* Installation Date selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500">Installed:</span>
            <select
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value as DateFilter)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-slate-300 font-mono text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Any Install Date</option>
              <option value="last7">Installed &lt; 7 Days</option>
              <option value="last30">Installed &lt; 30 Days</option>
              <option value="last90">Installed &lt; 90 Days</option>
              <option value="older">Installed &gt; 90 Days</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
