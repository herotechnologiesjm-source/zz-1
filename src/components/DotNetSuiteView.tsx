import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  FolderArchive,
  Layers,
  FileCode,
  Shield,
  ExternalLink,
  Cpu
} from 'lucide-react';
import {
  DOTNET_CSPROJ,
  DOTNET_PROGRAM_CS,
  DOTNET_WIN32NATIVE_CS,
  DOTNET_REGISTRY_CS,
  DOTNET_HOOKDETECTOR_CS,
  DOTNET_EXPLOITMONITOR_CS
} from '../utils/dotNetSourceCode';

interface DotNetSuiteViewProps {
  theme: 'dark' | 'light';
}

export const DotNetSuiteView: React.FC<DotNetSuiteViewProps> = ({ theme }) => {
  const [activeFile, setActiveFile] = useState<'program' | 'exploit' | 'win32' | 'registry' | 'detector' | 'csproj'>('program');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileData = {
    program: {
      name: 'Program.cs',
      lang: 'csharp',
      content: DOTNET_PROGRAM_CS,
      desc: 'WinForms native UI application, ListView telemetry, and user interaction handlers'
    },
    exploit: {
      name: 'ExploitMonitor.cs',
      lang: 'csharp',
      content: DOTNET_EXPLOITMONITOR_CS,
      desc: 'Real-time detector for Windows Raw Input API, DLL Injection, Framebuffer Screen Scraping, and Direct Memory Inspection'
    },
    win32: {
      name: 'Win32Native.cs',
      lang: 'csharp',
      content: DOTNET_WIN32NATIVE_CS,
      desc: 'P/Invoke signatures for ntdll!NtSuspendProcess, kernel32!OpenProcess, and user32!SetWindowsHookEx'
    },
    registry: {
      name: 'RegistryScanner.cs',
      lang: 'csharp',
      content: DOTNET_REGISTRY_CS,
      desc: 'Queries HKLM and HKCU Uninstall registry keys for software InstallDate and publisher info'
    },
    detector: {
      name: 'HookDetector.cs',
      lang: 'csharp',
      content: DOTNET_HOOKDETECTOR_CS,
      desc: 'Scans running processes and loaded DLL modules against known hook signatures'
    },
    csproj: {
      name: 'WinHookSentinel.csproj',
      lang: 'xml',
      content: DOTNET_CSPROJ,
      desc: '.NET 8.0-windows project configuration (no external app.manifest required, builds out-of-the-box)'
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    Object.values(fileData).forEach((f) => {
      handleDownloadFile(f.name, f.content);
    });
  };

  const current = fileData[activeFile];

  return (
    <div className="space-y-4 font-sans text-xs select-none max-w-6xl mx-auto">
      {/* Top Banner */}
      <div
        className={`p-4 rounded border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          theme === 'dark' ? 'bg-[#202020] border-[#2d2d2d]' : 'bg-[#f5f5f5] border-[#e0e0e0]'
        }`}
      >
        <div className="space-y-1">
          <div className="font-semibold text-sm flex items-center gap-2 text-[#0078d4]">
            <Code2 className="w-4 h-4" />
            <span>.NET 8 / C# Native Windows Solution (WinForms & P/Invoke)</span>
          </div>
          <p className="opacity-80 text-xs max-w-2xl">
            Complete, compile-ready C# Windows Desktop application. Inspects real Windows API hooks, queries software installation dates from Windows Registry keys, and freezes/terminates processes using native Win32 P/Invoke.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0078d4] hover:bg-[#0063b1] text-white font-medium cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All .cs & .csproj</span>
          </button>
        </div>
      </div>

      {/* Build & Run CLI Quickstart */}
      <div
        className={`p-3.5 rounded border space-y-2 font-mono text-[11px] ${
          theme === 'dark' ? 'bg-[#1a1a1a] border-[#2c2c2c]' : 'bg-[#ffffff] border-[#e0e0e0]'
        }`}
      >
        <div className="flex items-center justify-between font-sans text-xs font-semibold text-[#0078d4]">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            <span>Build & Run with .NET CLI (Windows Terminal)</span>
          </span>
          <button
            onClick={() =>
              handleCopy(
                'dotnet new winforms -n WinHookSentinel\ncd WinHookSentinel\ndotnet build -c Release\ndotnet run',
                'cli'
              )
            }
            className="flex items-center gap-1 text-[11px] font-normal hover:underline"
          >
            {copiedKey === 'cli' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copiedKey === 'cli' ? 'Copied CLI Commands' : 'Copy Commands'}</span>
          </button>
        </div>
        <pre className="p-2.5 rounded bg-black/10 dark:bg-black/40 overflow-x-auto text-slate-300">
{`# 1. Create a new directory and build the .NET application
dotnet build -c Release

# 2. Run with Administrator privileges (required for NtSuspendProcess)
dotnet run -c Release

# 3. Or compile into a single-file portable Windows x64 executable:
dotnet publish -c Release -r win-x64 --self-contained -p:PublishSingleFile=true`}
        </pre>
      </div>

      {/* File Explorer & Code Viewer */}
      <div
        className={`rounded border overflow-hidden flex flex-col md:flex-row min-h-[460px] ${
          theme === 'dark' ? 'bg-[#181818] border-[#2c2c2c]' : 'bg-[#ffffff] border-[#e0e0e0]'
        }`}
      >
        {/* Left: Files List */}
        <div
          className={`w-full md:w-60 border-r p-2 space-y-1 shrink-0 ${
            theme === 'dark' ? 'bg-[#1e1e1e] border-[#2c2c2c]' : 'bg-[#f4f4f4] border-[#e0e0e0]'
          }`}
        >
          <div className="px-2 py-1 text-[11px] font-semibold opacity-60">C# PROJECT FILES</div>
          {[
            { id: 'program', name: 'Program.cs', tag: 'UI & Main' },
            { id: 'win32', name: 'Win32Native.cs', tag: 'P/Invoke' },
            { id: 'registry', name: 'RegistryScanner.cs', tag: 'Registry' },
            { id: 'detector', name: 'HookDetector.cs', tag: 'Hook Engine' },
            { id: 'csproj', name: 'WinHookSentinel.csproj', tag: '.NET Config' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveFile(item.id as any)}
              className={`w-full px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-colors cursor-pointer ${
                activeFile === item.id
                  ? theme === 'dark'
                    ? 'bg-[#0078d4] text-white font-medium'
                    : 'bg-[#0078d4] text-white font-medium'
                  : theme === 'dark'
                  ? 'hover:bg-[#2b2b2b] text-[#cccccc]'
                  : 'hover:bg-[#e8e8e8] text-[#222222]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span className="font-mono text-xs truncate">{item.name}</span>
              </div>
              <span className="text-[10px] opacity-70 ml-1">{item.tag}</span>
            </button>
          ))}
        </div>

        {/* Right: Code Viewer */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header of Code Pane */}
          <div
            className={`h-9 px-4 flex items-center justify-between border-b ${
              theme === 'dark' ? 'bg-[#202020] border-[#2c2c2c]' : 'bg-[#f8f8f8] border-[#e0e0e0]'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono font-semibold text-xs text-[#0078d4]">{current.name}</span>
              <span className="opacity-50">·</span>
              <span className="opacity-70 text-[11px] truncate">{current.desc}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopy(current.content, current.name)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#2b2b2b] hover:bg-[#333333] border-[#383838]'
                    : 'bg-[#ffffff] hover:bg-[#ebebeb] border-[#cccccc]'
                }`}
              >
                {copiedKey === current.name ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedKey === current.name ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => handleDownloadFile(current.name, current.content)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#2b2b2b] hover:bg-[#333333] border-[#383838]'
                    : 'bg-[#ffffff] hover:bg-[#ebebeb] border-[#cccccc]'
                }`}
              >
                <Download className="w-3 h-3" />
                <span>Save File</span>
              </button>
            </div>
          </div>

          {/* Code Text Box */}
          <div className="flex-1 p-3 overflow-auto bg-black/5 dark:bg-black/40">
            <pre className="font-mono text-xs leading-relaxed select-all">
              <code>{current.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
