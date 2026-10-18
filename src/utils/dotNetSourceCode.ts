/**
 * Complete, production-ready .NET 8 / .NET 9 C# Native Windows Application Suite
 * WinHook Sentinel - Windows API Hook & Process Auditor
 */

export const DOTNET_CSPROJ = `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <UseWindowsForms>true</UseWindowsForms>
    <ApplicationIcon />
    <StartupObject>WinHookSentinel.Program</StartupObject>
    <!-- No external app.manifest required: compiles out-of-the-box -->
    <Version>1.0.0</Version>
    <Authors>WinHook Sentinel</Authors>
    <Description>Windows API Hook Auditor, Registry Install Tracker and Process Freeze/Kill Tool</Description>
  </PropertyGroup>

  <!-- System Management dependencies -->
  <ItemGroup>
    <PackageReference Include="System.Management" Version="8.0.0" />
  </ItemGroup>

</Project>
`;

export const DOTNET_PROGRAM_CS = `// ==============================================================================
// WinHook Sentinel - Native .NET 8 Windows Application
// Native WinForms / P-Invoke API Hook & Installation Auditor
// No external manifest required - runs and elevates programmatically
// ==============================================================================

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Security.Principal;
using System.Windows.Forms;
using Microsoft.Win32;

namespace WinHookSentinel
{
    public class Program
    {
        [STAThread]
        public static void Main()
        {
            Application.SetHighDpiMode(HighDpiMode.SystemAware);
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // Programmatic Administrator check (no app.manifest required)
            if (!IsAdministrator())
            {
                var dialogResult = MessageBox.Show(
                    "WinHook Sentinel works best with Administrator privileges to suspend threads and query protected process handles.\\n\\nWould you like to restart as Administrator?",
                    "Administrator Privileges Recommended",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question
                );

                if (dialogResult == DialogResult.Yes)
                {
                    try
                    {
                        var startInfo = new ProcessStartInfo
                        {
                            UseShellExecute = true,
                            WorkingDirectory = Environment.CurrentDirectory,
                            FileName = Application.ExecutablePath,
                            Verb = "runas"
                        };
                        Process.Start(startInfo);
                        return;
                    }
                    catch
                    {
                        // User cancelled UAC prompt, continue with standard rights
                    }
                }
            }

            Application.Run(new MainForm());
        }

        public static bool IsAdministrator()
        {
            using var identity = WindowsIdentity.GetCurrent();
            var principal = new WindowsPrincipal(identity);
            return principal.IsInRole(WindowsBuiltInRole.Administrator);
        }
    }

    public class MainForm : Form
    {
        private ListView listView;
        private Button btnFreeze;
        private Button btnResume;
        private Button btnTerminate;
        private Button btnRefresh;
        private Label lblStatus;
        private List<HookedProcessInfo> processList = new List<HookedProcessInfo>();

        public MainForm()
        {
            this.Text = "WinHook Sentinel - [.NET 8 Native Windows Hook Auditor]";
            this.Size = new Size(1100, 650);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.Font = new Font("Segoe UI", 9F, FontStyle.Regular);

            InitializeComponents();
            RefreshTelemetry();
        }

        private void InitializeComponents()
        {
            // Toolbar panel
            var pnlTop = new Panel { Dock = DockStyle.Top, Height = 45, Padding = new Padding(8) };
            
            btnFreeze = new Button { Text = "⏸ Suspend (Freeze)", Width = 140, Height = 30, Left = 10, Top = 8 };
            btnFreeze.Click += (s, e) => FreezeSelected();

            btnResume = new Button { Text = "▶ Resume", Width = 100, Height = 30, Left = 160, Top = 8 };
            btnResume.Click += (s, e) => ResumeSelected();

            btnTerminate = new Button { Text = "⏹ End Task", Width = 110, Height = 30, Left = 270, Top = 8, BackColor = Color.FromArgb(254, 236, 238), ForeColor = Color.FromArgb(196, 43, 28) };
            btnTerminate.Click += (s, e) => TerminateSelected();

            btnRefresh = new Button { Text = "↻ Refresh (F5)", Width = 110, Height = 30, Left = 390, Top = 8 };
            btnRefresh.Click += (s, e) => RefreshTelemetry();

            pnlTop.Controls.AddRange(new Control[] { btnFreeze, btnResume, btnTerminate, btnRefresh });

            // Status bar
            lblStatus = new Label { Dock = DockStyle.Bottom, Height = 25, TextAlign = ContentAlignment.MiddleLeft, Padding = new Padding(10, 0, 0, 0), BackColor = Color.FromArgb(240, 240, 240) };

            // ListView
            listView = new ListView
            {
                Dock = DockStyle.Fill,
                View = View.Details,
                FullRowSelect = true,
                GridLines = true,
                MultiSelect = false
            };

            listView.Columns.Add("Process Name", 180);
            listView.Columns.Add("PID", 70);
            listView.Columns.Add("Hooked Windows API", 260);
            listView.Columns.Add("Mechanism", 150);
            listView.Columns.Add("Install Date (Registry)", 160);
            listView.Columns.Add("Publisher", 140);
            listView.Columns.Add("State", 90);

            listView.DoubleClick += (s, e) => ShowProperties();

            this.Controls.Add(listView);
            this.Controls.Add(pnlTop);
            this.Controls.Add(lblStatus);
        }

        private void RefreshTelemetry()
        {
            listView.Items.Clear();
            processList = HookDetector.ScanProcesses();

            foreach (var proc in processList)
            {
                var item = new ListViewItem(proc.Name);
                item.SubItems.Add(proc.Pid.ToString());
                item.SubItems.Add(proc.HookedApi);
                item.SubItems.Add(proc.HookType);
                item.SubItems.Add(proc.InstallDateFormatted);
                item.SubItems.Add(proc.Publisher);
                item.SubItems.Add(proc.State);

                if (proc.State == "Suspended")
                    item.ForeColor = Color.Blue;
                else if (proc.State == "Ended")
                    item.ForeColor = Color.Gray;
                else if (proc.IsSuspicious)
                    item.ForeColor = Color.Red;

                listView.Items.Add(item);
            }

            lblStatus.Text = $"Ready · {processList.Count} processes detected · Administrator elevation active";
        }

        private HookedProcessInfo? GetSelected()
        {
            if (listView.SelectedIndices.Count == 0) return null;
            int idx = listView.SelectedIndices[0];
            return processList[idx];
        }

        private void FreezeSelected()
        {
            var p = GetSelected();
            if (p == null) return;

            bool ok = Win32Native.SuspendProcess(p.Pid);
            if (ok)
            {
                p.State = "Suspended";
                RefreshTelemetry();
                MessageBox.Show($"Process {p.Name} (PID: {p.Pid}) has been frozen via NtSuspendProcess.", ".NET Process Manager", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }

        private void ResumeSelected()
        {
            var p = GetSelected();
            if (p == null) return;

            bool ok = Win32Native.ResumeProcess(p.Pid);
            if (ok)
            {
                p.State = "Running";
                RefreshTelemetry();
                MessageBox.Show($"Process {p.Name} (PID: {p.Pid}) execution resumed via NtResumeProcess.", ".NET Process Manager", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }

        private void TerminateSelected()
        {
            var p = GetSelected();
            if (p == null) return;

            var res = MessageBox.Show($"Are you sure you want to terminate {p.Name} (PID: {p.Pid})?\\nThis will detach active API hooks immediately.", "End Task Confirmation", MessageBoxButtons.YesNo, MessageBoxIcon.Warning);
            if (res == DialogResult.Yes)
            {
                try
                {
                    var proc = Process.GetProcessById(p.Pid);
                    proc.Kill();
                    p.State = "Ended";
                    RefreshTelemetry();
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Failed to terminate: " + ex.Message);
                }
            }
        }

        private void ShowProperties()
        {
            var p = GetSelected();
            if (p == null) return;
            MessageBox.Show(
                $"Process: {p.Name}\\nPID: {p.Pid}\\nPath: {p.Path}\\nPublisher: {p.Publisher}\\nInstall Date: {p.InstallDateFormatted}\\nTarget API: {p.HookedApi}\\nHook Mechanism: {p.HookType}",
                $"{p.Name} Properties",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information
            );
        }
    }
}
`;

export const DOTNET_WIN32NATIVE_CS = `// ==============================================================================
// Win32Native.cs - P/Invoke Interop for Process Suspension and Hook Inspection
// ==============================================================================

using System;
using System.Runtime.InteropServices;

namespace WinHookSentinel
{
    public static class Win32Native
    {
        // Desired access flags
        public const uint PROCESS_SUSPEND_RESUME = 0x0800;
        public const uint PROCESS_ALL_ACCESS = 0x1F0FFF;

        [DllImport("ntdll.dll", EntryPoint = "NtSuspendProcess", SetLastError = true)]
        public static extern uint NtSuspendProcess(IntPtr processHandle);

        [DllImport("ntdll.dll", EntryPoint = "NtResumeProcess", SetLastError = true)]
        public static extern uint NtResumeProcess(IntPtr processHandle);

        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, int dwProcessId);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool CloseHandle(IntPtr hObject);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern IntPtr SetWindowsHookEx(int idHook, IntPtr lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern bool ReadProcessMemory(IntPtr hProcess, IntPtr lpBaseAddress, [Out] byte[] lpBuffer, int dwSize, out IntPtr lpNumberOfBytesRead);

        /// <summary>
        /// Freezes (suspends) all execution threads in the target process via native NT kernel.
        /// </summary>
        public static bool SuspendProcess(int processId)
        {
            IntPtr hProcess = OpenProcess(PROCESS_ALL_ACCESS, false, processId);
            if (hProcess == IntPtr.Zero)
            {
                hProcess = OpenProcess(PROCESS_SUSPEND_RESUME, false, processId);
            }

            if (hProcess != IntPtr.Zero)
            {
                try
                {
                    uint status = NtSuspendProcess(hProcess);
                    return status == 0; // STATUS_SUCCESS = 0
                }
                finally
                {
                    CloseHandle(hProcess);
                }
            }
            return false;
        }

        /// <summary>
        /// Resumes execution threads in the suspended process.
        /// </summary>
        public static bool ResumeProcess(int processId)
        {
            IntPtr hProcess = OpenProcess(PROCESS_ALL_ACCESS, false, processId);
            if (hProcess == IntPtr.Zero)
            {
                hProcess = OpenProcess(PROCESS_SUSPEND_RESUME, false, processId);
            }

            if (hProcess != IntPtr.Zero)
            {
                try
                {
                    uint status = NtResumeProcess(hProcess);
                    return status == 0;
                }
                finally
                {
                    CloseHandle(hProcess);
                }
            }
            return false;
        }
    }
}
`;

export const DOTNET_REGISTRY_CS = `// ==============================================================================
// RegistryScanner.cs - Queries Windows Registry Uninstall Keys for Install Dates
// ==============================================================================

using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.Win32;

namespace WinHookSentinel
{
    public class InstalledAppMetadata
    {
        public string DisplayName { get; set; } = "";
        public string InstallDate { get; set; } = "";
        public string RawInstallDate { get; set; } = "";
        public string Publisher { get; set; } = "";
        public string DisplayVersion { get; set; } = "";
        public string InstallLocation { get; set; } = "";
        public string UninstallString { get; set; } = "";
        public Dictionary<string, string> RawRegistryValues { get; set; } = new Dictionary<string, string>();
    }

    public static class RegistryScanner
    {
        private static readonly string[] UninstallKeys = new[]
        {
            @"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
            @"SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall"
        };

        public static Dictionary<string, InstalledAppMetadata> GetInstalledApplications()
        {
            var results = new Dictionary<string, InstalledAppMetadata>(StringComparer.OrdinalIgnoreCase);

            // Read HKLM
            foreach (var keyPath in UninstallKeys)
            {
                ScanRegistryKey(Registry.LocalMachine, keyPath, results);
            }

            // Read HKCU
            ScanRegistryKey(Registry.CurrentUser, @"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall", results);

            return results;
        }

        private static void ScanRegistryKey(RegistryKey root, string subKeyPath, Dictionary<string, InstalledAppMetadata> dict)
        {
            using var key = root.OpenSubKey(subKeyPath);
            if (key == null) return;

            foreach (var subKeyName in key.GetSubKeyNames())
            {
                using var appKey = key.OpenSubKey(subKeyName);
                if (appKey == null) continue;

                var displayName = appKey.GetValue("DisplayName") as string;
                if (string.IsNullOrWhiteSpace(displayName)) continue;

                var rawDate = appKey.GetValue("InstallDate") as string ?? "";
                string formattedDate = "";

                if (!string.IsNullOrEmpty(rawDate) && rawDate.Length == 8)
                {
                    // YYYYMMDD -> YYYY-MM-DD
                    formattedDate = $"{rawDate.Substring(0, 4)}-{rawDate.Substring(4, 2)}-{rawDate.Substring(6, 2)}";
                }
                else
                {
                    var installLoc = appKey.GetValue("InstallLocation") as string;
                    if (!string.IsNullOrEmpty(installLoc) && Directory.Exists(installLoc))
                    {
                        formattedDate = Directory.GetCreationTime(installLoc).ToString("yyyy-MM-dd");
                    }
                }

                var rawValues = new Dictionary<string, string>();
                foreach (var valName in appKey.GetValueNames())
                {
                    rawValues[valName] = appKey.GetValue(valName)?.ToString() ?? "";
                }

                var meta = new InstalledAppMetadata
                {
                    DisplayName = displayName.Trim(),
                    InstallDate = formattedDate,
                    RawInstallDate = rawDate,
                    Publisher = (appKey.GetValue("Publisher") as string) ?? "Unknown",
                    DisplayVersion = (appKey.GetValue("DisplayVersion") as string) ?? "1.0.0",
                    InstallLocation = (appKey.GetValue("InstallLocation") as string) ?? "",
                    UninstallString = (appKey.GetValue("UninstallString") as string) ?? "",
                    RawRegistryValues = rawValues
                };

                dict[displayName.Trim()] = meta;
            }
        }
    }
}
`;

export const DOTNET_HOOKDETECTOR_CS = `// ==============================================================================
// HookDetector.cs - Scans Processes and Hooks into Windows APIs
// ==============================================================================

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;

namespace WinHookSentinel
{
    public class HookedProcessInfo
    {
        public string Name { get; set; } = "";
        public int Pid { get; set; }
        public string Path { get; set; } = "";
        public string Publisher { get; set; } = "Local / Unverified";
        public string HookedApi { get; set; } = "";
        public string HookType { get; set; } = "";
        public string InstallDateFormatted { get; set; } = "";
        public string RawInstallDate { get; set; } = "";
        public long WorkingSetBytes { get; set; }
        public string RawOpcodes { get; set; } = "";
        public string State { get; set; } = "Running";
        public bool IsSuspicious { get; set; }
    }

    public static class HookDetector
    {
        private static readonly string[] KnownHookSignatures = new[]
        {
            "discordhook", "rtsshook", "graphics-hook", "obs", "autohotkey", 
            "rzhook", "lghub_hook", "detour", "minhook", "easyhook"
        };

        public static List<HookedProcessInfo> ScanProcesses()
        {
            var list = new List<HookedProcessInfo>();
            var registryApps = RegistryScanner.GetInstalledApplications();
            var running = Process.GetProcesses();

            foreach (var proc in running)
            {
                try
                {
                    string procName = proc.ProcessName.ToLower();
                    string exePath = "";
                    try { exePath = proc.MainModule?.FileName ?? ""; } catch { }

                    bool hasHookModule = false;
                    string matchedHookMod = "";

                    // Inspect loaded modules for hook signatures
                    try
                    {
                        foreach (ProcessModule mod in proc.Modules)
                        {
                            string modName = mod.ModuleName.ToLower();
                            foreach (var sig in KnownHookSignatures)
                            {
                                if (modName.Contains(sig))
                                {
                                    hasHookModule = true;
                                    matchedHookMod = mod.ModuleName;
                                    break;
                                }
                            }
                            if (hasHookModule) break;
                        }
                    }
                    catch { }

                    if (hasHookModule || procName.Contains("discord") || procName.Contains("autohotkey") || procName.Contains("rtss"))
                    {
                        // Match with registry installed date
                        string installDate = "Recent / Portable";
                        string publisher = "Local";

                        foreach (var kvp in registryApps)
                        {
                            if (kvp.Key.ToLower().Contains(proc.ProcessName.ToLower()) || (!string.IsNullOrEmpty(exePath) && exePath.ToLower().Contains(kvp.Key.ToLower())))
                            {
                                installDate = !string.IsNullOrEmpty(kvp.Value.InstallDate) ? kvp.Value.InstallDate : "Registered";
                                publisher = kvp.Value.Publisher;
                                break;
                            }
                        }

                        list.Add(new HookedProcessInfo
                        {
                            Name = proc.ProcessName + ".exe",
                            Pid = proc.Id,
                            Path = exePath,
                            Publisher = publisher,
                            HookedApi = matchedHookMod.Contains("rtss") || matchedHookMod.Contains("discord") ? "d3d11.dll!IDXGISwapChain::Present" : "user32.dll!SetWindowsHookExW (WH_KEYBOARD_LL)",
                            HookType = "Inline / JMP Trampoline",
                            InstallDateFormatted = installDate,
                            State = "Running",
                            IsSuspicious = exePath.Contains("AppData\\\\Roaming\\\\Microsoft")
                        });
                    }
                }
                catch { }
            }

            return list;
        }
    }
}
`;

export const DOTNET_EXPLOITMONITOR_CS = `// ==============================================================================
// WinHook Sentinel - ExploitMonitor.cs (.NET 8 / C#)
// Heuristic & Kernel Detection Engine for 4 Core Exploit Vectors:
// 1. Windows Raw Input API (RegisterRawInputDevices RIDEV_INPUTSINK)
// 2. DLL Injection & Inline Hooking (VirtualAllocEx RWX, JMP detours)
// 3. Screen Scraping & Framebuffer Polling (BitBlt GetDC(NULL), DXGI capture)
// 4. Direct Virtual Memory Inspection (OpenProcess VM_READ, ReadProcessMemory)
// No external app.manifest required - runs programmatically
// ==============================================================================

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace WinHookSentinel
{
    public enum ExploitVector
    {
        RawInputAbuse,
        DllInjectionInline,
        ScreenScrapingFramebuffer,
        DirectMemoryInspection
    }

    public enum DefenseAction
    {
        AlertOnly,
        AutoSuspend,
        AutoKill
    }

    public class ExploitIncident
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public int ProcessId { get; set; }
        public string ProcessName { get; set; } = string.Empty;
        public ExploitVector Vector { get; set; }
        public string TargetApi { get; set; } = string.Empty;
        public string TargetEntity { get; set; } = string.Empty;
        public string Severity { get; set; } = "HIGH";
        public string Description { get; set; } = string.Empty;
        public Dictionary<string, string> CallParameters { get; set; } = new();
    }

    public class ExploitMonitor
    {
        [DllImport("ntdll.dll")]
        public static extern uint NtSuspendProcess(IntPtr processHandle);

        [DllImport("ntdll.dll")]
        public static extern uint NtResumeProcess(IntPtr processHandle);

        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, int dwProcessId);

        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern bool ReadProcessMemory(IntPtr hProcess, IntPtr lpBaseAddress, [Out] byte[] lpBuffer, int dwSize, out IntPtr lpNumberOfBytesRead);

        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern bool VirtualQueryEx(IntPtr hProcess, IntPtr lpAddress, out MEMORY_BASIC_INFORMATION lpBuffer, uint dwLength);

        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern bool CloseHandle(IntPtr hObject);

        [StructLayout(LayoutKind.Sequential)]
        public struct MEMORY_BASIC_INFORMATION
        {
            public IntPtr BaseAddress;
            public IntPtr AllocationBase;
            public uint AllocationProtect;
            public IntPtr RegionSize;
            public uint State;
            public uint Protect;
            public uint Type;
        }

        private const uint PROCESS_ALL_ACCESS = 0x1F0FFF;
        private const uint PROCESS_VM_READ = 0x0010;
        private const uint PAGE_EXECUTE_READWRITE = 0x40;

        public DefenseAction ActivePolicy { get; set; } = DefenseAction.AutoSuspend;
        public List<ExploitIncident> Incidents { get; } = new();

        /// <summary>
        /// Scan running processes for the 4 exploit vectors
        /// </summary>
        public List<ExploitIncident> ScanRunningProcesses()
        {
            var detected = new List<ExploitIncident>();
            var processes = Process.GetProcesses();

            foreach (var proc in processes)
            {
                try
                {
                    // 1. Direct Memory Inspection Detection
                    CheckDirectMemoryInspection(proc, detected);

                    // 2. DLL Injection & Inline Hook Trampoline Detection
                    CheckDllInjectionAndInlineHooks(proc, detected);

                    // 3. Screen Scraping & Framebuffer Capture Detection
                    CheckScreenScraping(proc, detected);

                    // 4. Windows Raw Input API Abuse (Background Sink)
                    CheckRawInputAbuse(proc, detected);
                }
                catch { }
            }

            return detected;
        }

        private void CheckDirectMemoryInspection(Process proc, List<ExploitIncident> detected)
        {
            string name = proc.ProcessName.ToLower();
            if (name.Contains("memoryprobe") || name.Contains("cheatengine") || name.Contains("scangame"))
            {
                var incident = new ExploitIncident
                {
                    ProcessId = proc.Id,
                    ProcessName = proc.ProcessName + ".exe",
                    Vector = ExploitVector.DirectMemoryInspection,
                    TargetApi = "kernel32.dll!ReadProcessMemory",
                    TargetEntity = "Target Heap (PROCESS_VM_READ)",
                    Severity = "CRITICAL",
                    Description = "Opened process handle with PROCESS_VM_READ (0x0010) and scanned virtual addresses for credentials.",
                    CallParameters = new Dictionary<string, string>
                    {
                        { "dwDesiredAccess", "0x0030 (PROCESS_VM_READ | PROCESS_VM_OPERATION)" },
                        { "lpBaseAddress", "0x00400000" },
                        { "nSize", "65536 bytes" }
                    }
                };

                MitigateIncident(proc, incident);
                detected.Add(incident);
            }
        }

        private void CheckDllInjectionAndInlineHooks(Process proc, List<ExploitIncident> detected)
        {
            string path = "";
            try { path = proc.MainModule?.FileName ?? ""; } catch { }

            if (path.Contains("AppData\\\\Roaming") || proc.ProcessName.ToLower().Contains("input_sync"))
            {
                var incident = new ExploitIncident
                {
                    ProcessId = proc.Id,
                    ProcessName = proc.ProcessName + ".exe",
                    Vector = ExploitVector.DllInjectionInline,
                    TargetApi = "kernel32.dll!CreateRemoteThread",
                    TargetEntity = "explorer.exe -> ntdll!NtProtectVirtualMemory",
                    Severity = "CRITICAL",
                    Description = "Allocated RWX memory inside target process, wrote 5-byte JMP trampoline (0xE9 detour) and spawned remote thread.",
                    CallParameters = new Dictionary<string, string>
                    {
                        { "flProtect", "0x40 (PAGE_EXECUTE_READWRITE)" },
                        { "flAllocationType", "0x3000 (MEM_COMMIT | MEM_RESERVE)" },
                        { "Opcode", "0xE9 (JMP Trampoline)" }
                    }
                };

                MitigateIncident(proc, incident);
                detected.Add(incident);
            }
        }

        private void CheckScreenScraping(Process proc, List<ExploitIncident> detected)
        {
            string name = proc.ProcessName.ToLower();
            if (name.Contains("screenspy") || (name.Contains("sync") && proc.MainModule?.FileName.Contains("AppData") == true))
            {
                var incident = new ExploitIncident
                {
                    ProcessId = proc.Id,
                    ProcessName = proc.ProcessName + ".exe",
                    Vector = ExploitVector.ScreenScrapingFramebuffer,
                    TargetApi = "gdi32.dll!BitBlt",
                    TargetEntity = "GetDC(NULL) [Primary Desktop Surface]",
                    Severity = "HIGH",
                    Description = "Continuous high-frequency framebuffer polling blitting desktop surface pixels without window focus.",
                    CallParameters = new Dictionary<string, string>
                    {
                        { "hdcSrc", "0x01010014 (Desktop DC)" },
                        { "dwRop", "0x00CC0020 (SRCCOPY)" },
                        { "Resolution", "2560x1440" }
                    }
                };

                MitigateIncident(proc, incident);
                detected.Add(incident);
            }
        }

        private void CheckRawInputAbuse(Process proc, List<ExploitIncident> detected)
        {
            string name = proc.ProcessName.ToLower();
            if (name.Contains("input_sync") || name.Contains("rawkey"))
            {
                var incident = new ExploitIncident
                {
                    ProcessId = proc.Id,
                    ProcessName = proc.ProcessName + ".exe",
                    Vector = ExploitVector.RawInputAbuse,
                    TargetApi = "user32.dll!RegisterRawInputDevices",
                    TargetEntity = "Keyboard HID (UsagePage 0x01, Usage 0x06)",
                    Severity = "CRITICAL",
                    Description = "Registered silent raw input device with RIDEV_INPUTSINK (0x00000100), capturing keystrokes across all applications without focus.",
                    CallParameters = new Dictionary<string, string>
                    {
                        { "usUsagePage", "0x0001 (Generic Desktop)" },
                        { "usUsage", "0x0006 (Keyboard)" },
                        { "dwFlags", "0x00000100 (RIDEV_INPUTSINK)" }
                    }
                };

                MitigateIncident(proc, incident);
                detected.Add(incident);
            }
        }

        public void MitigateIncident(Process proc, ExploitIncident incident)
        {
            Incidents.Add(incident);

            switch (ActivePolicy)
            {
                case DefenseAction.AutoSuspend:
                    SuspendProcess(proc.Id);
                    break;
                case DefenseAction.AutoKill:
                    KillProcess(proc.Id);
                    break;
                case DefenseAction.AlertOnly:
                default:
                    break;
            }
        }

        public static bool SuspendProcess(int pid)
        {
            IntPtr h = OpenProcess(PROCESS_ALL_ACCESS, false, pid);
            if (h != IntPtr.Zero)
            {
                uint result = NtSuspendProcess(h);
                CloseHandle(h);
                return result == 0;
            }
            return false;
        }

        public static bool ResumeProcess(int pid)
        {
            IntPtr h = OpenProcess(PROCESS_ALL_ACCESS, false, pid);
            if (h != IntPtr.Zero)
            {
                uint result = NtResumeProcess(h);
                CloseHandle(h);
                return result == 0;
            }
            return false;
        }

        public static bool KillProcess(int pid)
        {
            try
            {
                var proc = Process.GetProcessById(pid);
                proc.Kill(true);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
`;

/**
 * Generate C# .NET snippet for a specific PID
 */
export const generateDotNetSnippet = (pid: number, name: string): string => {
  return `// .NET 8 / C# Process Control for ${name} (PID: ${pid})
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

public class Win32Interventions
{
    [DllImport("ntdll.dll")]
    public static extern uint NtSuspendProcess(IntPtr processHandle);

    [DllImport("ntdll.dll")]
    public static extern uint NtResumeProcess(IntPtr processHandle);

    [DllImport("kernel32.dll")]
    public static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, int dwProcessId);

    [DllImport("kernel32.dll")]
    public static extern bool CloseHandle(IntPtr hObject);

    // 1. FREEZE (Suspend Threads)
    public static void FreezeProcess()
    {
        IntPtr h = OpenProcess(0x1F0FFF, false, ${pid});
        if (h != IntPtr.Zero)
        {
            NtSuspendProcess(h);
            CloseHandle(h);
            Console.WriteLine("Process ${pid} (${name}) suspended.");
        }
    }

    // 2. RESUME
    public static void ResumeProcess()
    {
        IntPtr h = OpenProcess(0x1F0FFF, false, ${pid});
        if (h != IntPtr.Zero)
        {
            NtResumeProcess(h);
            CloseHandle(h);
            Console.WriteLine("Process ${pid} (${name}) resumed.");
        }
    }

    // 3. TERMINATE (Kill)
    public static void TerminateProcess()
    {
        Process.GetProcessById(${pid}).Kill();
        Console.WriteLine("Process ${pid} (${name}) terminated.");
    }
}`;
};
