export type HookType =
  | 'SetWindowsHookEx (Global)'
  | 'Inline / JMP Trampoline'
  | 'IAT Patching'
  | 'MinHook Detour'
  | 'SetWinEventHook'
  | 'WFP Network Filter';

export type ProcessStatus = 'active' | 'frozen' | 'terminated';

export type ThreatCategory =
  | 'benign_utility'
  | 'overlay_graphics'
  | 'input_monitor'
  | 'system_service'
  | 'suspicious_unverified';

export interface RawRegistryValue {
  type: 'REG_SZ' | 'REG_DWORD' | 'REG_EXPAND_SZ' | 'REG_BINARY';
  value: string | number;
  hex?: string;
}

export interface RawProcessTelemetry {
  peMagic: string;
  imageBase: string;
  entryPoint: string;
  workingSetBytes: number;
  privateBytes: number;
  threadIds: number[];
  handleCount: number;
  userSid: string;
  integrityLevel: 'Low (0x1000)' | 'Medium (0x2000)' | 'High (0x3000)' | 'System (0x4000)';
}

export interface ApiHook {
  id: string;
  targetModule: string;          // e.g. user32.dll, d3d11.dll, ws2_32.dll, ntdll.dll
  targetApi: string;             // e.g. SetWindowsHookExW (WH_KEYBOARD_LL), Present, send
  hookType: HookType;
  originalAddress: string;       // e.g. 0x7FFF98A21040
  hookedAddress: string;         // e.g. 0x7FFF21045980
  hookingModule: string;         // e.g. DiscordHook64.dll, AutoHotkey.dll
  description: string;
  memoryProtection?: string;     // e.g. PAGE_EXECUTE_READWRITE (0x40)
  rawHexDump?: string;           // Hex byte dump
  disassembly: {
    originalBytecode: string;
    hookedBytecode: string;
    instruction: string;
  };
}

export interface InstallationInfo {
  installedDate: string;         // ISO date YYYY-MM-DD
  installedDateFormatted: string; // e.g. "Mar 14, 2024"
  daysAgo: number;
  installSource: 'Registry (HKLM)' | 'Registry (HKCU)' | 'AppData / Local' | 'Windows System';
  registryKey?: string;
  registryHive?: 'HKEY_LOCAL_MACHINE' | 'HKEY_CURRENT_USER';
  rawInstallDate?: string;       // raw string like 20260814
  rawRegistryValues?: Record<string, RawRegistryValue>;
  estimatedSizeKb?: number;
  installLocation: string;
  version: string;
  installerType: 'MSI (Windows Installer)' | 'InnoSetup' | 'NSIS' | 'AppX / MSIX' | 'Direct Portable';
  uninstallString?: string;
}

export interface HookedProcess {
  id: string;
  name: string;
  pid: number;
  parentPid: number;
  executablePath: string;
  publisher: string;
  isSigned: boolean;
  status: ProcessStatus;
  threatCategory: ThreatCategory;
  installation: InstallationInfo;
  hooks: ApiHook[];
  threadsCount: number;
  memoryMb: number;
  cpuPercent: number;
  commandLine: string;
  isDotNetProcess?: boolean;
  dotNetRuntime?: string;
  rawTelemetry?: RawProcessTelemetry;
  detectedExploitVectors?: ExploitVector[];
  exploitAttempts?: ExploitAttempt[];
  threatScore?: number;
  suspendedAt?: string;
  terminatedAt?: string;
}

export type ExploitVector =
  | 'raw_input_abuse'
  | 'dll_injection_inline'
  | 'screen_scraping_framebuffer'
  | 'direct_memory_inspection';

export interface ExploitAttempt {
  id: string;
  timestamp: string;
  vector: ExploitVector;
  vectorTitle: string;
  processId: string;
  processName: string;
  pid: number;
  targetApi: string;
  targetEntity: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  rawCallParameters: Record<string, string | number>;
  status: 'detected' | 'suspended' | 'killed';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'freeze' | 'resume' | 'terminate' | 'import' | 'add_hook' | 'reset' | 'exploit_detected' | 'auto_defense';
  processName: string;
  pid: number;
  details: string;
  severity?: 'critical' | 'warning' | 'info';
}

export type AutoDefenseAction = 'alert_only' | 'auto_suspend' | 'auto_kill';

export interface DefensePolicyConfig {
  action: AutoDefenseAction;
  enabledVectors: Record<ExploitVector, boolean>;
  playAlertSound: boolean;
  logToEventViewer: boolean;
}

export type FilterCategory = 'all' | 'input' | 'graphics' | 'network' | 'inline' | 'suspicious' | 'exploits';
export type StatusFilter = 'all' | 'active' | 'frozen' | 'terminated';
export type DateFilter = 'all' | 'last7' | 'last30' | 'last90' | 'older';
export type AppNavTab = 'grid' | 'exploits' | 'installation' | 'rawdata' | 'dotnet' | 'guide' | 'agent' | 'audit';

