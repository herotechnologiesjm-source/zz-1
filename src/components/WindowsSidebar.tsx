import {
  Menu,
  Activity,
  Calendar,
  Shield,
  ShieldAlert,
  Terminal,
  ScrollText,
  Sliders,
  Binary
} from 'lucide-react';
import { AppNavTab } from '../types/inspector';

interface WindowsSidebarProps {
  theme: 'dark' | 'light';
  activeTab: AppNavTab;
  onSelectTab: (tab: AppNavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  auditCount: number;
  exploitCount?: number;
}

export const WindowsSidebar: React.FC<WindowsSidebarProps> = ({
  theme,
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  auditCount,
  exploitCount = 0
}) => {
  const navItems = [
    {
      id: 'grid' as const,
      label: 'Processes & Hooks',
      icon: <Activity className="w-4 h-4 shrink-0" />
    },
    {
      id: 'exploits' as const,
      label: `Exploit Sentinel ${exploitCount > 0 ? `(${exploitCount})` : ''}`,
      icon: <ShieldAlert className={`w-4 h-4 shrink-0 ${exploitCount > 0 ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`} />
    },
    {
      id: 'installation' as const,
      label: 'Install Registry Audit',
      icon: <Calendar className="w-4 h-4 shrink-0" />
    },
    {
      id: 'rawdata' as const,
      label: 'Raw Data Explorer',
      icon: <Binary className="w-4 h-4 shrink-0" />
    },
    {
      id: 'dotnet' as const,
      label: '.NET (C#) Desktop Suite',
      icon: <Sliders className="w-4 h-4 shrink-0" />
    },
    {
      id: 'guide' as const,
      label: 'Hook Mechanisms',
      icon: <Shield className="w-4 h-4 shrink-0" />
    },
    {
      id: 'agent' as const,
      label: 'PowerShell Scanner',
      icon: <Terminal className="w-4 h-4 shrink-0" />
    },
    {
      id: 'audit' as const,
      label: `Event Viewer (${auditCount})`,
      icon: <ScrollText className="w-4 h-4 shrink-0" />
    }
  ];

  return (
    <aside
      className={`border-r select-none flex flex-col justify-between transition-all duration-150 shrink-0 ${
        isCollapsed ? 'w-12' : 'w-56'
      } ${
        theme === 'dark'
          ? 'bg-[#1e1e1e] border-[#2c2c2c] text-[#cccccc]'
          : 'bg-[#f3f3f3] border-[#e5e5e5] text-[#222222]'
      }`}
    >
      <div>
        {/* Hamburger Toggle */}
        <div className="p-2">
          <button
            onClick={onToggleCollapse}
            className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              theme === 'dark' ? 'hover:bg-[#2d2d2d] text-[#e0e0e0]' : 'hover:bg-[#e8e8e8] text-[#1c1c1c]'
            }`}
            title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-label="Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-1.5 space-y-0.5 mt-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-xs font-normal transition-colors relative cursor-pointer text-left ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-[#2d2d2d] text-white font-medium'
                      : 'bg-[#e5e5e5] text-black font-medium'
                    : theme === 'dark'
                    ? 'hover:bg-[#272727] text-[#cccccc]'
                    : 'hover:bg-[#ebebeb] text-[#444444]'
                }`}
                title={item.label}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#0078d4] rounded-r-full" />
                )}
                {item.icon}
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Info */}
      {!isCollapsed && (
        <div className={`p-3 text-[11px] border-t opacity-60 ${
          theme === 'dark' ? 'border-[#2d2d2d]' : 'border-[#e0e0e0]'
        }`}>
          <div>Windows 11 x64</div>
          <div>Sysinternals Architecture</div>
        </div>
      )}
    </aside>
  );
};
