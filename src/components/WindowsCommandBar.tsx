import React from 'react';
import {
  Square,
  Pause,
  Play,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  Search,
  X,
  Sun,
  Moon,
  Shield,
  ShieldAlert,
  Download,
  Terminal
} from 'lucide-react';
import { HookedProcess } from '../types/inspector';

interface WindowsCommandBarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  selectedProcess: HookedProcess | null;
  onEndTask: () => void;
  onSuspend: () => void;
  onResume: () => void;
  onOpenProperties: () => void;
  onOpenAddModal: () => void;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAgent: () => void;
  onOpenExploits?: () => void;
}

export const WindowsCommandBar: React.FC<WindowsCommandBarProps> = ({
  theme,
  onToggleTheme,
  selectedProcess,
  onEndTask,
  onSuspend,
  onResume,
  onOpenProperties,
  onOpenAddModal,
  onRefresh,
  searchQuery,
  onSearchChange,
  onOpenAgent
}) => {
  const isSelected = selectedProcess !== null;
  const isTerminated = selectedProcess?.status === 'terminated';
  const isFrozen = selectedProcess?.status === 'frozen';

  return (
    <div
      className={`px-3 py-2 flex flex-wrap items-center justify-between gap-2 border-b select-none text-xs ${
        theme === 'dark'
          ? 'bg-[#202020] text-[#e0e0e0] border-[#2c2c2c]'
          : 'bg-[#f9f9f9] text-[#202020] border-[#eaeaea]'
      }`}
    >
      {/* Primary Action Buttons (Windows 11 Fluent CommandBar style) */}
      <div className="flex items-center flex-wrap gap-1">
        {/* End Task Button */}
        <button
          disabled={!isSelected || isTerminated}
          onClick={onEndTask}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-normal transition-colors cursor-pointer ${
            !isSelected || isTerminated
              ? 'opacity-40 cursor-not-allowed'
              : theme === 'dark'
              ? 'bg-[#3b181a] text-[#ff7b80] hover:bg-[#521c20] border border-[#6b2226]'
              : 'bg-[#feecee] text-[#c42b1c] hover:bg-[#fdd8db] border border-[#f5b8bc]'
          }`}
          title="End process tree immediately (taskkill /F /PID)"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>End task</span>
        </button>

        {/* Suspend / Resume Button */}
        {!isFrozen ? (
          <button
            disabled={!isSelected || isTerminated}
            onClick={onSuspend}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-normal transition-colors cursor-pointer ${
              !isSelected || isTerminated
                ? 'opacity-40 cursor-not-allowed'
                : theme === 'dark'
                ? 'bg-[#1a2838] text-[#60cdff] hover:bg-[#23384f] border border-[#234567]'
                : 'bg-[#e5f3ff] text-[#0067b8] hover:bg-[#cce8ff] border border-[#99d1ff]'
            }`}
            title="Freeze process execution threads via NtSuspendProcess"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Suspend (Freeze)</span>
          </button>
        ) : (
          <button
            disabled={!isSelected}
            onClick={onResume}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-normal transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#163321] text-[#6ccb5f] hover:bg-[#1d452d] border border-[#235836]'
                : 'bg-[#eaf6ec] text-[#0f7b0f] hover:bg-[#d6eed9] border border-[#9fd8a7]'
            }`}
            title="Resume process execution threads via NtResumeProcess"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume process</span>
          </button>
        )}

        {/* Properties Button */}
        <button
          disabled={!isSelected}
          onClick={onOpenProperties}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-normal transition-colors cursor-pointer ${
            !isSelected
              ? 'opacity-40 cursor-not-allowed'
              : theme === 'dark'
              ? 'hover:bg-[#2d2d2d] text-[#e0e0e0] border border-[#383838]'
              : 'hover:bg-[#ebebeb] text-[#202020] border border-[#d6d6d6]'
          }`}
          title="Open Windows properties dialog"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Properties</span>
        </button>

        <div className={`h-4 w-px mx-1 ${theme === 'dark' ? 'bg-[#3c3c3c]' : 'bg-[#e0e0e0]'}`} />

        {/* Run New Task */}
        <button
          onClick={onOpenAddModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-normal transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'hover:bg-[#2d2d2d] text-[#cccccc]'
              : 'hover:bg-[#ebebeb] text-[#404040]'
          }`}
          title="Simulate / Register custom hooked process"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Run new task</span>
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'hover:bg-[#2d2d2d] text-[#cccccc]'
              : 'hover:bg-[#ebebeb] text-[#404040]'
          }`}
          title="Refresh telemetry"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* PowerShell Agent Importer Button */}
        <button
          onClick={onOpenAgent}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-normal transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'hover:bg-[#2d2d2d] text-[#60cdff]'
              : 'hover:bg-[#ebebeb] text-[#0067b8]'
          }`}
          title="Download live PowerShell hook scanner for Windows host"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>PowerShell Agent</span>
        </button>

        {/* Exploit Sentinel Button */}
        {onOpenExploits && (
          <button
            onClick={onOpenExploits}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-normal transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'hover:bg-[#2d2d2d] text-rose-400'
                : 'hover:bg-[#ebebeb] text-rose-600'
            }`}
            title="Open Exploit & Threat Sentinel"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Exploit Sentinel</span>
          </button>
        )}
      </div>

      {/* Right side: Search Box and Theme Switcher */}
      <div className="flex items-center gap-2">
        {/* Windows Search Box */}
        <div
          className={`relative flex items-center h-7 rounded-md border text-xs overflow-hidden ${
            theme === 'dark'
              ? 'bg-[#1b1b1b] border-[#383838] focus-within:border-[#0078d4]'
              : 'bg-[#ffffff] border-[#cecece] focus-within:border-[#0078d4]'
          }`}
        >
          <Search className="w-3.5 h-3.5 ml-2 mr-1 opacity-50 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Type a name, PID, or API..."
            className="w-48 md:w-64 h-full bg-transparent px-1 py-1 focus:outline-none font-sans text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="mr-1.5 p-0.5 opacity-60 hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'hover:bg-[#2d2d2d] text-[#cccccc]'
              : 'hover:bg-[#ebebeb] text-[#404040]'
          }`}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
