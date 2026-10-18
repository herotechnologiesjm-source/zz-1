import React from 'react';
import { ScrollText, Trash2, Pause, Play, Square, Plus, Upload, Shield } from 'lucide-react';
import { AuditLogEntry } from '../types/inspector';

interface AuditLogViewProps {
  theme: 'dark' | 'light';
  entries: AuditLogEntry[];
  onClearLogs: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ theme, entries, onClearLogs }) => {
  const getActionIcon = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'freeze':
        return <Pause className="w-3.5 h-3.5 text-sky-500" />;
      case 'resume':
        return <Play className="w-3.5 h-3.5 text-emerald-500 fill-current" />;
      case 'terminate':
        return <Square className="w-3.5 h-3.5 text-rose-500 fill-current" />;
      case 'import':
        return <Upload className="w-3.5 h-3.5 text-[#0078d4]" />;
      case 'add_hook':
        return <Plus className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-3 font-sans text-xs select-none">
      {/* Event Viewer Header */}
      <div
        className={`p-3 rounded border flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#202020] border-[#2d2d2d]' : 'bg-[#f5f5f5] border-[#e0e0e0]'
        }`}
      >
        <div>
          <div className="font-semibold text-xs flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-[#0078d4]" />
            <span>Event Viewer - Windows Process Interventions</span>
          </div>
          <div className="text-[11px] opacity-70 mt-0.5">
            Operational event log recording thread suspensions (NtSuspendProcess), terminations, and imports.
          </div>
        </div>

        {entries.length > 0 && (
          <button
            onClick={onClearLogs}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#2b2b2b] hover:bg-[#333333] border-[#383838] text-rose-400'
                : 'bg-[#ffffff] hover:bg-[#f3f3f3] border-[#cccccc] text-rose-600'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        )}
      </div>

      {/* Events Listview */}
      {entries.length === 0 ? (
        <div
          className={`p-16 text-center rounded border ${
            theme === 'dark' ? 'bg-[#181818] border-[#2d2d2d] text-[#777777]' : 'bg-[#ffffff] border-[#e0e0e0] text-[#888888]'
          }`}
        >
          No security events logged in this session. Suspend or terminate any process to see event entries.
        </div>
      ) : (
        <div
          className={`border rounded overflow-hidden divide-y ${
            theme === 'dark' ? 'bg-[#181818] border-[#2d2d2d] divide-[#262626]' : 'bg-[#ffffff] border-[#e0e0e0] divide-[#f0f0f0]'
          }`}
        >
          {entries.map((entry) => (
            <div key={entry.id} className="p-2.5 px-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded bg-black/10 dark:bg-black/30 shrink-0">
                  {getActionIcon(entry.action)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{entry.processName}</span>
                    <span className="font-mono text-[11px] opacity-70">PID {entry.pid}</span>
                    <span className="opacity-40">·</span>
                    <span className="opacity-80">{entry.details}</span>
                  </div>
                </div>
              </div>
              <span className="font-mono text-[11px] opacity-60 tabular-nums shrink-0">
                {entry.timestamp}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
