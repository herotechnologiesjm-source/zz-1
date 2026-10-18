import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { HookedProcess } from '../types/inspector';

interface WindowsConfirmDialogProps {
  process: HookedProcess | null;
  theme: 'dark' | 'light';
  onConfirm: () => void;
  onCancel: () => void;
}

export const WindowsConfirmDialog: React.FC<WindowsConfirmDialogProps> = ({
  process,
  theme,
  onConfirm,
  onCancel
}) => {
  if (!process) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 select-none animate-in fade-in duration-75">
      <div
        className={`w-full max-w-[460px] rounded-lg border shadow-2xl overflow-hidden flex flex-col ${
          theme === 'dark'
            ? 'bg-[#202020] text-[#e0e0e0] border-[#383838]'
            : 'bg-[#f9f9f9] text-[#1c1c1c] border-[#cecece]'
        }`}
      >
        {/* Title Bar */}
        <div
          className={`h-8 px-3 flex items-center justify-between border-b text-xs ${
            theme === 'dark' ? 'bg-[#181818] border-[#333333]' : 'bg-[#f0f0f0] border-[#e0e0e0]'
          }`}
        >
          <span className="font-semibold">Task Manager</span>
          <button
            onClick={onCancel}
            className="w-7 h-6 flex items-center justify-center hover:bg-[#e81123] hover:text-white transition-colors rounded-xs"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dialog Body */}
        <div className={`p-5 flex gap-4 ${theme === 'dark' ? 'bg-[#2b2b2b]' : 'bg-[#ffffff]'}`}>
          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-2 text-xs font-sans">
            <h4 className="text-sm font-semibold text-current">
              Do you want to end {process.name}?
            </h4>
            <p className="opacity-80 leading-relaxed">
              If an open program is associated with this process (PID: <strong className="font-mono">{process.pid}</strong>), it will terminate immediately. Active API hooks on <strong className="font-mono text-[#0078d4]">{process.hooks[0]?.targetApi || 'Windows APIs'}</strong> will be detached and released.
            </p>
            <p className="opacity-70 text-[11px]">
              Executable: <span className="font-mono">{process.executablePath}</span>
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div
          className={`h-12 px-4 flex items-center justify-end gap-2 border-t text-xs ${
            theme === 'dark' ? 'bg-[#1f1f1f] border-[#383838]' : 'bg-[#f0f0f0] border-[#e0e0e0]'
          }`}
        >
          <button
            onClick={onConfirm}
            className="min-w-[85px] px-3 py-1 rounded bg-[#c42b1c] hover:bg-[#a52317] text-white font-medium cursor-pointer"
          >
            End process
          </button>
          <button
            onClick={onCancel}
            className={`min-w-[75px] px-3 py-1 rounded border font-medium cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#2b2b2b] hover:bg-[#333333] border-[#383838] text-[#cccccc]'
                : 'bg-[#f5f5f5] hover:bg-[#e8e8e8] border-[#cccccc] text-[#333333]'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
