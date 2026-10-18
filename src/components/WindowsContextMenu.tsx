import React, { useEffect, useRef } from 'react';
import {
  Square,
  Pause,
  Play,
  Copy,
  SlidersHorizontal,
  FolderOpen,
  Terminal,
  ShieldCheck,
  Code
} from 'lucide-react';
import { HookedProcess } from '../types/inspector';

interface WindowsContextMenuProps {
  x: number;
  y: number;
  process: HookedProcess;
  theme: 'dark' | 'light';
  onClose: () => void;
  onEndTask: (proc: HookedProcess) => void;
  onSuspend: (proc: HookedProcess) => void;
  onResume: (proc: HookedProcess) => void;
  onOpenProperties: (proc: HookedProcess) => void;
  onCopyText: (text: string, label: string) => void;
}

export const WindowsContextMenu: React.FC<WindowsContextMenuProps> = ({
  x,
  y,
  process,
  theme,
  onClose,
  onEndTask,
  onSuspend,
  onResume,
  onOpenProperties,
  onCopyText
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  const isTerminated = process.status === 'terminated';
  const isFrozen = process.status === 'frozen';

  // Adjust positioning to avoid screen clipping
  const adjustedX = Math.min(x, window.innerWidth - 260);
  const adjustedY = Math.min(y, window.innerHeight - 340);

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className={`fixed z-50 min-w-[240px] py-1.5 rounded-md border shadow-2xl select-none text-xs font-sans animate-in fade-in zoom-in-95 duration-75 ${
        theme === 'dark'
          ? 'bg-[#2b2b2b] text-[#e0e0e0] border-[#383838] shadow-black/80'
          : 'bg-[#ffffff] text-[#1a1a1a] border-[#cccccc] shadow-neutral-400/50'
      }`}
    >
      {/* End Task */}
      <button
        disabled={isTerminated}
        onClick={() => {
          onEndTask(process);
          onClose();
        }}
        className={`w-full px-3 py-1.5 flex items-center justify-between text-left cursor-default ${
          isTerminated
            ? 'opacity-40 cursor-not-allowed'
            : theme === 'dark'
            ? 'hover:bg-[#0078d4] hover:text-white'
            : 'hover:bg-[#0078d4] hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Square className="w-3.5 h-3.5 text-rose-500 fill-current" />
          <span>End task</span>
        </div>
        <span className="text-[11px] opacity-60">Del</span>
      </button>

      {/* Suspend / Resume */}
      {!isFrozen ? (
        <button
          disabled={isTerminated}
          onClick={() => {
            onSuspend(process);
            onClose();
          }}
          className={`w-full px-3 py-1.5 flex items-center justify-between text-left cursor-default ${
            isTerminated
              ? 'opacity-40 cursor-not-allowed'
              : theme === 'dark'
              ? 'hover:bg-[#0078d4] hover:text-white'
              : 'hover:bg-[#0078d4] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Pause className="w-3.5 h-3.5 text-sky-400" />
            <span>Suspend process (Freeze)</span>
          </div>
          <span className="text-[11px] opacity-60">F4</span>
        </button>
      ) : (
        <button
          onClick={() => {
            onResume(process);
            onClose();
          }}
          className={`w-full px-3 py-1.5 flex items-center justify-between text-left cursor-default ${
            theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
            <span>Resume process</span>
          </div>
          <span className="text-[11px] opacity-60">F5</span>
        </button>
      )}

      <div className={`my-1 border-t ${theme === 'dark' ? 'border-[#3d3d3d]' : 'border-[#e5e5e5]'}`} />

      {/* Copy Actions */}
      <button
        onClick={() => {
          onCopyText(process.pid.toString(), 'PID');
          onClose();
        }}
        className={`w-full px-3 py-1.5 flex items-center gap-2.5 text-left cursor-default ${
          theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
        }`}
      >
        <Copy className="w-3.5 h-3.5 opacity-70" />
        <span>Copy PID ({process.pid})</span>
      </button>

      <button
        onClick={() => {
          onCopyText(process.executablePath, 'File Path');
          onClose();
        }}
        className={`w-full px-3 py-1.5 flex items-center gap-2.5 text-left cursor-default ${
          theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
        }`}
      >
        <FolderOpen className="w-3.5 h-3.5 opacity-70" />
        <span>Copy executable path</span>
      </button>

      <button
        onClick={() => {
          const apis = process.hooks.map((h) => `${h.targetModule}!${h.targetApi}`).join(', ');
          onCopyText(apis, 'Hooked APIs');
          onClose();
        }}
        className={`w-full px-3 py-1.5 flex items-center gap-2.5 text-left cursor-default ${
          theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
        }`}
      >
        <Code className="w-3.5 h-3.5 opacity-70" />
        <span>Copy hooked target APIs</span>
      </button>

      <button
        onClick={() => {
          const cmd = `Stop-Process -Id ${process.pid} -Force`;
          onCopyText(cmd, 'PowerShell Kill Command');
          onClose();
        }}
        className={`w-full px-3 py-1.5 flex items-center gap-2.5 text-left cursor-default ${
          theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
        }`}
      >
        <Terminal className="w-3.5 h-3.5 opacity-70" />
        <span>Copy PowerShell kill command</span>
      </button>

      <div className={`my-1 border-t ${theme === 'dark' ? 'border-[#3d3d3d]' : 'border-[#e5e5e5]'}`} />

      {/* Properties */}
      <button
        onClick={() => {
          onOpenProperties(process);
          onClose();
        }}
        className={`w-full px-3 py-1.5 flex items-center justify-between text-left cursor-default ${
          theme === 'dark' ? 'hover:bg-[#0078d4] hover:text-white' : 'hover:bg-[#0078d4] hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 font-medium">
          <SlidersHorizontal className="w-3.5 h-3.5 opacity-70" />
          <span>Properties</span>
        </div>
        <span className="text-[11px] opacity-60">Alt+Enter</span>
      </button>
    </div>
  );
};
