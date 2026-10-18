import React from 'react';
import { Minus, Square, Copy, X, Shield } from 'lucide-react';

interface WindowsTitleBarProps {
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onMinimize: () => void;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export const WindowsTitleBar: React.FC<WindowsTitleBarProps> = ({
  isMaximized,
  onToggleMaximize,
  onMinimize,
  onClose,
  theme
}) => {
  return (
    <div
      className={`h-9 flex items-center justify-between select-none border-b text-xs ${
        theme === 'dark'
          ? 'bg-[#1f1f1f] text-[#cccccc] border-[#333333]'
          : 'bg-[#f3f3f3] text-[#1c1c1c] border-[#e0e0e0]'
      }`}
    >
      {/* Title & App Icon */}
      <div className="flex items-center gap-2 px-3 flex-1 h-full cursor-default overflow-hidden">
        <div className="flex items-center justify-center w-4 h-4 text-[#0078d4]">
          <Shield className="w-3.5 h-3.5 fill-[#0078d4]/20" />
        </div>
        <span className="font-semibold text-xs tracking-tight truncate">
          WinHook Sentinel - [Administrator: Windows API Hook & Process Auditor]
        </span>
      </div>

      {/* Windows 11 Native Caption Buttons */}
      <div className="flex items-center h-full shrink-0">
        <button
          onClick={onMinimize}
          className={`w-11 h-full flex items-center justify-center transition-colors cursor-pointer ${
            theme === 'dark' ? 'hover:bg-[#333333] text-[#cccccc]' : 'hover:bg-[#e5e5e5] text-[#1c1c1c]'
          }`}
          title="Minimize"
          aria-label="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleMaximize}
          className={`w-11 h-full flex items-center justify-center transition-colors cursor-pointer ${
            theme === 'dark' ? 'hover:bg-[#333333] text-[#cccccc]' : 'hover:bg-[#e5e5e5] text-[#1c1c1c]'
          }`}
          title={isMaximized ? 'Restore Down' : 'Maximize'}
          aria-label={isMaximized ? 'Restore Down' : 'Maximize'}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>

        <button
          onClick={onClose}
          className="w-11 h-full flex items-center justify-center hover:bg-[#e81123] hover:text-white transition-colors cursor-pointer"
          title="Close"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
