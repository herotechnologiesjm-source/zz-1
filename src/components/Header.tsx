import React from 'react';
import { Terminal, Shield, FileCode2, History } from 'lucide-react';

interface HeaderProps {
  activeTab: 'grid' | 'installation' | 'agent' | 'audit' | 'guide';
  onSelectTab: (tab: 'grid' | 'installation' | 'agent' | 'audit' | 'guide') => void;
  onOpenAgent: () => void;
  auditCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenAgent,
  auditCount
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
          <Shield className="w-4 h-4" />
        </div>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('grid');
          }}
          className="text-base font-semibold tracking-tight text-slate-100 hover:text-white whitespace-nowrap shrink-0 transition-colors"
        >
          WinHook Sentinel
        </a>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectTab('grid')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'grid' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Hooked Programs
        </button>
        <button
          onClick={() => onSelectTab('installation')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'installation' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Install Registry Audit
        </button>
        <button
          onClick={() => onSelectTab('guide')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'guide' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Hooking Mechanisms
        </button>
        <button
          onClick={() => onSelectTab('agent')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'agent' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          PowerShell Scanner
        </button>
        <button
          onClick={() => onSelectTab('audit')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'audit' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Activity Log ({auditCount})
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenAgent}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-cyan-950 cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5" />
          Import Windows Scan
        </button>
      </div>
    </header>
  );
};
