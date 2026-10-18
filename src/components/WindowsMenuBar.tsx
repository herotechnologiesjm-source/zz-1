import React, { useState, useRef, useEffect } from 'react';
import {
  FileCode,
  Download,
  RotateCcw,
  Square,
  Pause,
  Play,
  SlidersHorizontal,
  RefreshCw,
  Sun,
  Moon,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { FilterCategory, StatusFilter, DateFilter } from '../types/inspector';

interface WindowsMenuBarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onExportCsv: () => void;
  onDownloadBatchScript: () => void;
  onResetBaseline: () => void;
  selectedCount: number;
  onEndTask: () => void;
  onSuspend: () => void;
  onResume: () => void;
  onOpenProperties: () => void;
  onRefresh: () => void;
  categoryFilter: FilterCategory;
  onCategoryFilterChange: (cat: FilterCategory) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (st: StatusFilter) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (df: DateFilter) => void;
  onOpenGuide: () => void;
  onOpenDotNet: () => void;
  onOpenRawData: () => void;
  onOpenExploits?: () => void;
}

export const WindowsMenuBar: React.FC<WindowsMenuBarProps> = ({
  theme,
  onToggleTheme,
  onOpenAddModal,
  onOpenImportModal,
  onExportCsv,
  onDownloadBatchScript,
  onResetBaseline,
  selectedCount,
  onEndTask,
  onSuspend,
  onResume,
  onOpenProperties,
  onRefresh,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  onOpenGuide,
  onOpenDotNet,
  onOpenRawData
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenu = () => setActiveMenu(null);

  const menuItems = ['File', 'Action', 'View', 'Options', 'Help'];

  return (
    <div
      ref={menuRef}
      className={`h-7 px-2 flex items-center select-none text-[12px] border-b relative z-40 ${
        theme === 'dark'
          ? 'bg-[#252526] text-[#cccccc] border-[#333333]'
          : 'bg-[#f7f7f7] text-[#222222] border-[#e0e0e0]'
      }`}
    >
      {menuItems.map((menu) => (
        <div key={menu} className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === menu ? null : menu)}
            onMouseEnter={() => {
              if (activeMenu !== null) setActiveMenu(menu);
            }}
            className={`px-2.5 py-1 rounded-xs transition-colors cursor-default ${
              activeMenu === menu
                ? theme === 'dark'
                  ? 'bg-[#37373d] text-white'
                  : 'bg-[#e5e5e5] text-black'
                : theme === 'dark'
                ? 'hover:bg-[#333333] hover:text-white'
                : 'hover:bg-[#e5e5e5]'
            }`}
          >
            {menu}
          </button>

          {/* Dropdown Menu */}
          {activeMenu === menu && (
            <div
              className={`absolute left-0 top-full mt-0.5 min-w-[240px] py-1 border shadow-xl rounded-xs z-50 text-[12px] ${
                theme === 'dark'
                  ? 'bg-[#1f1f1f] text-[#cccccc] border-[#454545] shadow-black/60'
                  : 'bg-[#ffffff] text-[#1c1c1c] border-[#cccccc] shadow-neutral-400/40'
              }`}
            >
              {menu === 'File' && (
                <>
                  <button
                    onClick={() => {
                      onOpenAddModal();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left ${
                      theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>Run New Process Simulation...</span>
                    <span className="text-[11px] opacity-60">Ctrl+N</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenImportModal();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left ${
                      theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>Import Windows Scan (.json)...</span>
                    <span className="text-[11px] opacity-60">Ctrl+O</span>
                  </button>
                  <div className={`my-1 border-t ${theme === 'dark' ? 'border-[#333333]' : 'border-[#e5e5e5]'}`} />
                  <button
                    onClick={() => {
                      onExportCsv();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left ${
                      theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>Export Audit Data to CSV...</span>
                    <span className="text-[11px] opacity-60">Ctrl+S</span>
                  </button>
                  <button
                    onClick={() => {
                      onDownloadBatchScript();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left ${
                      theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>Export Kill Batch Script (.bat)...</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenDotNet();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left font-medium text-[#0078d4] ${
                      theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>.NET (C#) Desktop Source Code...</span>
                    <span className="text-[11px] opacity-75">C#</span>
                  </button>
                  <div className={`my-1 border-t ${theme === 'dark' ? 'border-[#333333]' : 'border-[#e5e5e5]'}`} />
                  <button
                    onClick={() => {
                      onResetBaseline();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left ${
                      theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>Reset to Factory Baseline</span>
                  </button>
                </>
              )}

              {menu === 'Action' && (
                <>
                  <button
                    disabled={selectedCount === 0}
                    onClick={() => {
                      onEndTask();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left ${
                      selectedCount === 0
                        ? 'opacity-40 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'hover:bg-[#0078d4] hover:text-white'
                        : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>End Task</span>
                    <span className="text-[11px] opacity-60">Del</span>
                  </button>
                  <button
                    disabled={selectedCount === 0}
                    onClick={() => {
                      onSuspend();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left ${
                      selectedCount === 0
                        ? 'opacity-40 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'hover:bg-[#0078d4] hover:text-white'
                        : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>Suspend Process (Freeze)</span>
                    <span className="text-[11px] opacity-60">F4</span>
                  </button>
                  <button
                    disabled={selectedCount === 0}
                    onClick={() => {
                      onResume();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left ${
                      selectedCount === 0
                        ? 'opacity-40 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'hover:bg-[#0078d4] hover:text-white'
                        : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>Resume Process</span>
                    <span className="text-[11px] opacity-60">F5</span>
                  </button>
                  <div className={`my-1 border-t ${theme === 'dark' ? 'border-[#333333]' : 'border-[#e5e5e5]'}`} />
                  <button
                    disabled={selectedCount === 0}
                    onClick={() => {
                      onOpenProperties();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left ${
                      selectedCount === 0
                        ? 'opacity-40 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'hover:bg-[#0078d4] hover:text-white'
                        : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>Properties</span>
                    <span className="text-[11px] opacity-60">Alt+Enter</span>
                  </button>
                </>
              )}

              {menu === 'View' && (
                <>
                  <button
                    onClick={() => {
                      onRefresh();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left ${
                      theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>Refresh Now</span>
                    <span className="text-[11px] opacity-60">F5</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenRawData();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left font-medium text-[#0078d4] ${
                      theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>Raw Data Explorer...</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenExploits?.();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left font-medium text-rose-500 ${
                      theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>Exploit & Threat Sentinel...</span>
                  </button>
                  <div className={`my-1 border-t ${theme === 'dark' ? 'border-[#333333]' : 'border-[#e5e5e5]'}`} />
                  <div className="px-3 py-1 text-[11px] font-semibold opacity-60">Filter by Hook Category</div>
                  {(['all', 'input', 'graphics', 'network', 'suspicious'] as FilterCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        onCategoryFilterChange(cat);
                        closeMenu();
                      }}
                      className={`w-full px-5 py-1 text-left flex items-center gap-2 ${
                        theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
                      }`}
                    >
                      <span className="w-3 text-center">{categoryFilter === cat ? '✓' : ''}</span>
                      <span className="capitalize">{cat === 'all' ? 'All Categories' : cat}</span>
                    </button>
                  ))}
                  <div className={`my-1 border-t ${theme === 'dark' ? 'border-[#333333]' : 'border-[#e5e5e5]'}`} />
                  <div className="px-3 py-1 text-[11px] font-semibold opacity-60">Filter by Process State</div>
                  {(['all', 'active', 'frozen', 'terminated'] as StatusFilter[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        onStatusFilterChange(st);
                        closeMenu();
                      }}
                      className={`w-full px-5 py-1 text-left flex items-center gap-2 ${
                        theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
                      }`}
                    >
                      <span className="w-3 text-center">{statusFilter === st ? '✓' : ''}</span>
                      <span className="capitalize">{st === 'all' ? 'All States' : st}</span>
                    </button>
                  ))}
                </>
              )}

              {menu === 'Options' && (
                <>
                  <button
                    onClick={() => {
                      onToggleTheme();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left ${
                      theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>Appearance: {theme === 'dark' ? 'Windows Dark' : 'Windows Light'}</span>
                    <span>{theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}</span>
                  </button>
                  <div className={`my-1 border-t ${theme === 'dark' ? 'border-[#333333]' : 'border-[#e5e5e5]'}`} />
                  <div className="px-3 py-1.5 flex items-center justify-between opacity-70">
                    <span>Always on top</span>
                    <span>✓</span>
                  </div>
                  <div className="px-3 py-1.5 flex items-center justify-between opacity-70">
                    <span>Show process full paths</span>
                    <span>✓</span>
                  </div>
                </>
              )}

              {menu === 'Help' && (
                <>
                  <button
                    onClick={() => {
                      onOpenGuide();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left ${
                      theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>Windows Hook Mechanisms Guide</span>
                    <span className="text-[11px] opacity-60">F1</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenImportModal();
                      closeMenu();
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left ${
                      theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
                    }`}
                  >
                    <span>PowerShell Host Agent Guide...</span>
                  </button>
                  <div className={`my-1 border-t ${theme === 'dark' ? 'border-[#333333]' : 'border-[#e5e5e5]'}`} />
                  <div className="px-3 py-1.5 text-left opacity-70">
                    <div>WinHook Sentinel v2.4 (x64)</div>
                    <div className="text-[10px] opacity-60">Microsoft Windows Native Environment</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
