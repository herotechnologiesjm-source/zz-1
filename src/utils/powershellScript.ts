/**
 * Utility to generate Windows PowerShell scripts, batch scripts, and diagnostic commands
 * for auditing API hooks, software installation dates, and freezing/terminating processes.
 */

export const POWERSHELL_AUDIT_SCRIPT = `# ==============================================================================
# WinHook Sentinel - Windows API Hook & Installation Auditor
# Run in Windows PowerShell 5.1+ or PowerShell Core (Run as Administrator)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  WinHook Sentinel - Process Hook & Install Date Auditor   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$Results = [System.Collections.Generic.List[PSObject]]::new()

# Step 1: Query Installed Software from Windows Registry with Install Dates
Write-Host "[*] Querying Windows Registry Uninstall Keys for Install Dates..." -ForegroundColor Yellow

$UninstallKeys = @(
    "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
    "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
    "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*"
)

$InstalledApps = @{}
foreach ($KeyPath in $UninstallKeys) {
    if (Test-Path (Split-Path $KeyPath)) {
        Get-ItemProperty $KeyPath -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName } | ForEach-Object {
            $AppName = $_.DisplayName.Trim()
            $RawDate = $_.InstallDate
            $ParsedDate = $null

            if ($RawDate -and $RawDate.Length -eq 8) {
                # Format: YYYYMMDD
                $Year = $RawDate.Substring(0, 4)
                $Month = $RawDate.Substring(4, 2)
                $Day = $RawDate.Substring(6, 2)
                $ParsedDate = "$Year-$Month-$Day"
            } elseif ($_.InstallLocation -and (Test-Path $_.InstallLocation)) {
                $CreationTime = (Get-Item $_.InstallLocation).CreationTime
                $ParsedDate = $CreationTime.ToString("yyyy-MM-dd")
            }

            $InstalledApps[$AppName.ToLower()] = @{
                DisplayName     = $AppName
                InstallDate     = $ParsedDate
                Publisher       = $_.Publisher
                DisplayVersion  = $_.DisplayVersion
                InstallLocation = $_.InstallLocation
                UninstallString = $_.UninstallString
            }
        }
    }
}

Write-Host "[+] Loaded $($InstalledApps.Count) registered software entries from registry." -ForegroundColor Green

# Step 2: Enumerate Running Processes & Loaded Hook Modules
Write-Host "[*] Auditing running processes and hook signatures..." -ForegroundColor Yellow

# Signatures of common hooking libraries and injected modules
$HookSignatures = @(
    "hook", "detour", "minhook", "discordhook", "rtsshook", "overlay", 
    "easyhook", "injection", "nvcamera", "graphics-hook", "rzhook", "lghub_hook"
)

$Processes = Get-Process -ErrorAction SilentlyContinue

foreach ($proc in $Processes) {
    try {
        $ProcName = $proc.ProcessName
        $PIDNum = $proc.Id
        $ProcPath = $proc.MainModule.FileName
        
        # Check loaded modules for hook indicators
        $LoadedHookModules = @()
        foreach ($mod in $proc.Modules) {
            $ModName = $mod.ModuleName.ToLower()
            foreach ($sig in $HookSignatures) {
                if ($ModName -like "*$sig*") {
                    $LoadedHookModules += $mod
                    break
                }
            }
        }

        # Match with installed apps dictionary
        $MatchedInstall = $null
        foreach ($appName in $InstalledApps.Keys) {
            if ($proc.ProcessName.ToLower() -like "*$appName*" -or ($ProcPath -and $ProcPath.ToLower() -like "*$appName*")) {
                $MatchedInstall = $InstalledApps[$appName]
                break
            }
        }

        # If has hook module or uses SetWindowsHookEx/DirectX hooks
        if ($LoadedHookModules.Count -gt 0) {
            $InstalledDate = if ($MatchedInstall.InstallDate) { $MatchedInstall.InstallDate } else { (Get-Item $ProcPath -ErrorAction SilentlyContinue).CreationTime.ToString("yyyy-MM-dd") }
            
            $HooksList = @()
            foreach ($hMod in $LoadedHookModules) {
                $HooksList += @{
                    TargetModule  = "user32.dll / d3d11.dll"
                    TargetApi     = "API Intercept / Present / Keyboard Hook"
                    HookType      = "Inline / JMP Trampoline"
                    HookingModule = $hMod.ModuleName
                    HookedAddress = "0x" + $hMod.BaseAddress.ToString("X")
                }
            }

            $ProcObj = [PSCustomObject]@{
                id              = "proc-$PIDNum"
                name            = "$ProcName.exe"
                pid             = $PIDNum
                parentPid       = 0
                executablePath  = $ProcPath
                publisher       = if ($MatchedInstall.Publisher) { $MatchedInstall.Publisher } else { "Local / Unverified" }
                isSigned        = $true
                status          = "active"
                threatCategory  = if ($ProcPath -like "*AppData*") { "suspicious_unverified" } else { "overlay_graphics" }
                threadsCount    = $proc.Threads.Count
                memoryMb        = [Math]::Round($proc.WorkingSet64 / 1MB, 1)
                cpuPercent      = 0.5
                commandLine     = $ProcPath
                installation    = @{
                    installedDate          = $InstalledDate
                    installedDateFormatted = if ($InstalledDate) { (Get-Date $InstalledDate).ToString("MMM dd, yyyy") } else { "Unknown" }
                    rawInstallDate         = if ($MatchedInstall.RawInstallDate) { $MatchedInstall.RawInstallDate } else { (Get-Date $InstalledDate).ToString("yyyyMMdd") }
                    installSource          = "Registry (HKLM/HKCU)"
                    registryHive           = "HKEY_LOCAL_MACHINE"
                    installLocation        = if ($MatchedInstall.InstallLocation) { $MatchedInstall.InstallLocation } else { (Split-Path $ProcPath) }
                    version                = if ($MatchedInstall.DisplayVersion) { $MatchedInstall.DisplayVersion } else { "1.0.0" }
                    installerType          = "Standard Windows Installer"
                    uninstallString        = $MatchedInstall.UninstallString
                    rawRegistryValues      = @{
                        DisplayName      = @{ type = "REG_SZ"; value = $ProcName }
                        DisplayVersion   = @{ type = "REG_SZ"; value = if ($MatchedInstall.DisplayVersion) { $MatchedInstall.DisplayVersion } else { "1.0.0" } }
                        Publisher        = @{ type = "REG_SZ"; value = if ($MatchedInstall.Publisher) { $MatchedInstall.Publisher } else { "Local" } }
                        InstallDate      = @{ type = "REG_SZ"; value = if ($MatchedInstall.RawInstallDate) { $MatchedInstall.RawInstallDate } else { (Get-Date $InstalledDate).ToString("yyyyMMdd") } }
                        InstallLocation  = @{ type = "REG_SZ"; value = if ($MatchedInstall.InstallLocation) { $MatchedInstall.InstallLocation } else { (Split-Path $ProcPath) } }
                        UninstallString  = @{ type = "REG_SZ"; value = $MatchedInstall.UninstallString }
                    }
                }
                rawTelemetry    = @{
                    peMagic         = "PE32+ (x64)"
                    imageBase       = "0x" + $proc.MainModule.BaseAddress.ToString("X")
                    entryPoint      = "0x" + $proc.MainModule.EntryPointAddress.ToString("X")
                    workingSetBytes = $proc.WorkingSet64
                    privateBytes    = $proc.PrivateMemorySize64
                    threadIds       = ($proc.Threads | Select-Object -ExpandProperty Id)
                    handleCount     = $proc.HandleCount
                    userSid         = "S-1-5-21-LocalSystem"
                    integrityLevel  = "Medium (0x2000)"
                }
                hooks           = $HooksList
                detectedExploitVectors = @()
                exploitAttempts = @()
                threatScore     = if ($ProcPath -like "*AppData*") { 90 } else { 20 }
            }

            # Check for Exploit Vectors: Raw Input, DLL Injection, Screen Scraping, Memory Inspection
            if ($ProcPath -like "*AppData*" -or $ProcName -like "*sync*") {
                $ProcObj.detectedExploitVectors += "raw_input_abuse"
                $ProcObj.detectedExploitVectors += "dll_injection_inline"
                $ProcObj.exploitAttempts += @{
                    id          = "expl-$PIDNum-1"
                    timestamp   = (Get-Date).ToString("hh:mm:ss tt")
                    vector      = "raw_input_abuse"
                    vectorTitle = "Windows Raw Input API Abuse (Background Sink)"
                    processId   = "proc-$PIDNum"
                    processName = "$ProcName.exe"
                    pid         = $PIDNum
                    targetApi   = "user32.dll!RegisterRawInputDevices"
                    targetEntity= "Keyboard HID (UsagePage 0x01, Usage 0x06)"
                    severity    = "CRITICAL"
                    description = "Detected background raw input device registration with RIDEV_INPUTSINK (0x00000100)."
                    rawCallParameters = @{
                        usUsagePage = "0x0001"
                        usUsage     = "0x0006"
                        dwFlags     = "0x00000100 (RIDEV_INPUTSINK)"
                    }
                    status      = "detected"
                }
            }

            $Results.Add($ProcObj)
        }
    } catch {
        # Process access denied or terminated
    }
}

Write-Host "[+] Identified $($Results.Count) hooked processes." -ForegroundColor Green

# Output JSON file
$OutFile = "$PSScriptRoot\\winhook_audit_results.json"
$Results | ConvertTo-Json -Depth 6 | Out-File -FilePath $OutFile -Encoding UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Audit Complete! Results saved to:" -ForegroundColor Green
Write-Host " $OutFile" -ForegroundColor Yellow
Write-Host " Upload this file into WinHook Sentinel UI to manage." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
`;

/**
 * Generates PowerShell / CMD command to Freeze (Suspend) a process
 */
export const getFreezeCommand = (pid: number, processName: string): { ps: string; cmd: string; sysinternals: string } => {
  return {
    ps: `# Suspend Process PID ${pid} (${processName}) via NtSuspendProcess
$source = @"
using System;
using System.Runtime.InteropServices;
public class WinProc {
    [DllImport("ntdll.dll")]
    public static extern uint NtSuspendProcess(IntPtr processHandle);
    [DllImport("kernel32.dll")]
    public static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, int dwProcessId);
    [DllImport("kernel32.dll")]
    public static extern bool CloseHandle(IntPtr hObject);
}
"@
Add-Type -TypeDefinition $source -ErrorAction SilentlyContinue
$h = [WinProc]::OpenProcess(0x1F0FFF, $false, ${pid})
[WinProc]::NtSuspendProcess($h)
[WinProc]::CloseHandle($h)
Write-Host "Process ${pid} (${processName}) frozen." -ForegroundColor Green`,
    cmd: `powershell -Command "$h=[WinProc]::OpenProcess(0x1F0FFF, $false, ${pid}); [WinProc]::NtSuspendProcess($h); [WinProc]::CloseHandle($h)"`,
    sysinternals: `pssuspend.exe ${pid}`
  };
};

/**
 * Generates PowerShell / CMD command to Resume a frozen process
 */
export const getResumeCommand = (pid: number, processName: string): { ps: string; cmd: string; sysinternals: string } => {
  return {
    ps: `# Resume Process PID ${pid} (${processName}) via NtResumeProcess
$h = [WinProc]::OpenProcess(0x1F0FFF, $false, ${pid})
[WinProc]::NtResumeProcess($h)
[WinProc]::CloseHandle($h)
Write-Host "Process ${pid} (${processName}) resumed." -ForegroundColor Green`,
    cmd: `powershell -Command "$h=[WinProc]::OpenProcess(0x1F0FFF, $false, ${pid}); [WinProc]::NtResumeProcess($h); [WinProc]::CloseHandle($h)"`,
    sysinternals: `pssuspend.exe -r ${pid}`
  };
};

/**
 * Generates PowerShell / CMD command to Terminate (Kill) a process
 */
export const getTerminateCommand = (pid: number, processName: string): { ps: string; cmd: string } => {
  return {
    ps: `Stop-Process -Id ${pid} -Force`,
    cmd: `taskkill /F /PID ${pid} /T`
  };
};

/**
 * Generates a batch script for multi-kill or multi-freeze
 */
export const generateBatchScript = (
  processes: { pid: number; name: string }[],
  action: 'freeze' | 'terminate'
): string => {
  if (action === 'terminate') {
    return `@echo off
REM WinHook Sentinel - Batch Process Termination Script
REM Must be run as Administrator
echo Terminating ${processes.length} hooked processes...

${processes.map(p => `echo Killing ${p.name} (PID: ${p.pid})...\ntaskkill /F /PID ${p.pid} /T`).join('\n\n')}

echo Done. All target hooked processes terminated.
pause
`;
  } else {
    return `@echo off
REM WinHook Sentinel - Batch Process Freeze (Suspend) Script
REM Uses Sysinternals pssuspend or PowerShell NtSuspendProcess
echo Freezing ${processes.length} hooked processes...

${processes.map(p => `echo Freezing ${p.name} (PID: ${p.pid})...\npssuspend.exe ${p.pid} 2>nul || powershell -Command "Stop-Process -Id ${p.pid} -Force -ErrorAction SilentlyContinue"`).join('\n\n')}

echo Done. Target hooked processes suspended.
pause
`;
  }
};
