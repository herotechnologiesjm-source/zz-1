import React from 'react';
import { Shield } from 'lucide-react';

interface WindowsStatusBarProps {
  theme: 'dark' | 'light';
  statusMessage: string;
  processCount: number;
  hookCount: number;
  frozenCount: number;
  terminatedCount: number;
  totalMemoryMb: number;
}

export const WindowsStatusBar: React.FC<WindowsStatusBarProps> = ({
  theme,
  statusMessage,
  processCount,
  hookCount,
  frozenCount,
  terminatedCount,
  totalMemoryMb
}) => {
  return (
    <footer
      className={`h-6 px-2 flex items-center justify-between border-t select-none text-[11px] font-sans ${
        theme === 'dark'
          ? 'bg-[#1f1f1f] text-[#9d9d9d] border-[#2c2c2c]'
          : 'bg-[#f0f0f0] text-[#555555] border-[#d8d8d8]'
      }`}
    >
      {/* Pane 1: Activity Status */}
      <div className="flex-1 truncate pr-4">
        <span>{statusMessage || 'Ready'}</span>
      </div>

      {/* Pane 2: Process & Hook Count */}
      <div
        className={`px-3 h-full flex items-center border-l ${
          theme === 'dark' ? 'border-[#2d2d2d]' : 'border-[#d8d8d8]'
        }`}
      >
        <span>
          Processes: <strong className="font-mono text-current">{processCount}</strong> ({frozenCount} suspended, {terminatedCount} ended)
        </span>
      </div>

      {/* Pane 3: Active Interceptions */}
      <div
        className={`px-3 h-full flex items-center border-l hidden sm:flex ${
          theme === 'dark' ? 'border-[#2d2d2d]' : 'border-[#d8d8d8]'
        }`}
      >
        <span>
          Active Hooks: <strong className="font-mono text-current">{hookCount}</strong>
        </span>
      </div>

      {/* Pane 4: System Memory */}
      <div
        className={`px-3 h-full flex items-center border-l hidden md:flex ${
          theme === 'dark' ? 'border-[#2d2d2d]' : 'border-[#d8d8d8]'
        }`}
      >
        <span>
          Memory: <strong className="font-mono text-current">{totalMemoryMb.toFixed(1)} MB</strong>
        </span>
      </div>

      {/* Pane 5: Windows UAC Elevation Status */}
      <div
        className={`px-3 h-full flex items-center gap-1.5 border-l ${
          theme === 'dark' ? 'border-[#2d2d2d] text-[#60cdff]' : 'border-[#d8d8d8] text-[#0067b8]'
        }`}
      >
        <Shield className="w-3 h-3 fill-current opacity-80" />
        <span className="font-medium">Administrator</span>
      </div>
    </footer>
  );
};
