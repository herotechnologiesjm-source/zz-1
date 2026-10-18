import React, { useState } from 'react';
import {
  Database,
  Binary,
  Cpu,
  Copy,
  Check,
  Download,
  Search,
  Layers,
  FileCode,
  Shield,
  KeyRound
} from 'lucide-react';
import { HookedProcess } from '../types/inspector';

interface RawDataExplorerViewProps {
  theme: 'dark' | 'light';
  processes: HookedProcess[];
}

export const RawDataExplorerView: React.FC<RawDataExplorerViewProps> = ({ theme, processes }) => {
  const [selectedProcessId, setSelectedProcessId] = useState<string>(processes[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'registry' | 'telemetry' | 'hexdump' | 'exploits' | 'json'>('registry');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const selectedProc = processes.find((p) => p.id === selectedProcessId) || processes[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadJson = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!selectedProc) {
    return (
      <div className="p-12 text-center text-xs opacity-60">
        No process telemetry data available.
      </div>
    );
  }

  const rawReg = selectedProc.installation.rawRegistryValues || {};
  const rawTel = selectedProc.rawTelemetry;

  return (
    <div className="space-y-4 font-sans text-xs select-none max-w-6xl mx-auto">
      {/* Top Banner */}
      <div
        className={`p-3.5 rounded border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          theme === 'dark' ? 'bg-[#202020] border-[#2d2d2d]' : 'bg-[#f5f5f5] border-[#e0e0e0]'
        }`}
      >
        <div>
          <div className="font-semibold text-xs flex items-center gap-2 text-[#0078d4]">
            <Binary className="w-4 h-4" />
            <span>Windows Raw Telemetry, Registry Keys & Hex Byte Inspector</span>
          </div>
          <div className="text-[11px] opacity-70 mt-0.5">
            Exposes low-level raw registry key-value pairs (REG_SZ / REG_DWORD), memory hex bytes, PE headers, and security SIDs.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(JSON.stringify(processes, null, 2), 'copy-all')}
            className={`px-3 py-1 rounded border text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
              theme === 'dark'
                ? 'bg-[#2b2b2b] hover:bg-[#333333] border-[#383838]'
                : 'bg-[#ffffff] hover:bg-[#ebebeb] border-[#cccccc]'
            }`}
          >
            {copiedKey === 'copy-all' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copiedKey === 'copy-all' ? 'Copied All JSON' : 'Copy All Raw Data'}</span>
          </button>

          <button
            onClick={() => handleDownloadJson(processes, 'winhook_raw_telemetry_dump.json')}
            className="px-3 py-1 rounded bg-[#0078d4] hover:bg-[#0063b1] text-white text-xs font-medium cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Raw JSON</span>
          </button>
        </div>
      </div>

      {/* Main Raw Data Workstation: Left Process Selector + Right Raw Data Sheet */}
      <div
        className={`rounded border overflow-hidden flex flex-col md:flex-row min-h-[500px] ${
          theme === 'dark' ? 'bg-[#181818] border-[#2c2c2c]' : 'bg-[#ffffff] border-[#e0e0e0]'
        }`}
      >
        {/* Left: Process Selector */}
        <div
          className={`w-full md:w-64 border-r p-2 space-y-1.5 shrink-0 ${
            theme === 'dark' ? 'bg-[#1e1e1e] border-[#2c2c2c]' : 'bg-[#f4f4f4] border-[#e0e0e0]'
          }`}
        >
          <div className="px-2 py-1 text-[11px] font-semibold opacity-60">TARGET PROCESSES ({processes.length})</div>

          <div className="space-y-0.5 overflow-y-auto max-h-[460px]">
            {processes.map((p) => {
              const isSelected = p.id === selectedProc.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProcessId(p.id)}
                  className={`w-full px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-colors cursor-pointer ${
                    isSelected
                      ? theme === 'dark'
                        ? 'bg-[#0078d4] text-white font-medium'
                        : 'bg-[#0078d4] text-white font-medium'
                      : theme === 'dark'
                      ? 'hover:bg-[#2b2b2b] text-[#cccccc]'
                      : 'hover:bg-[#e8e8e8] text-[#222222]'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-semibold text-xs truncate leading-tight">{p.name}</div>
                    <div className="font-mono text-[10px] opacity-75">PID {p.pid} · {p.hooks.length} hooks</div>
                  </div>
                  <span className="font-mono text-[10px] opacity-70 ml-1">{p.memoryMb.toFixed(0)}MB</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Raw Data Tabs & Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Subtabs Header */}
          <div
            className={`h-9 px-3 flex items-center justify-between border-b gap-1 ${
              theme === 'dark' ? 'bg-[#202020] border-[#2c2c2c]' : 'bg-[#f8f8f8] border-[#e0e0e0]'
            }`}
          >
            <div className="flex items-center gap-1">
              {[
                { id: 'registry', label: 'Raw Windows Registry Values' },
                { id: 'telemetry', label: 'Process PE & Security Telemetry' },
                { id: 'hexdump', label: 'Hook Memory Hex Dump' },
                { id: 'exploits', label: `Exploit Call Structs (${selectedProc.exploitAttempts?.length || 0})` },
                { id: 'json', label: 'Raw JSON Payload' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                    activeSubTab === tab.id
                      ? theme === 'dark'
                        ? 'bg-[#2b2b2b] text-white font-medium'
                        : 'bg-[#ffffff] text-black border border-[#cccccc] font-medium shadow-xs'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(JSON.stringify(selectedProc, null, 2), 'copy-proc')}
                className="flex items-center gap-1 opacity-70 hover:opacity-100 text-[11px] cursor-pointer"
              >
                {copiedKey === 'copy-proc' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'copy-proc' ? 'Copied' : 'Copy Process'}</span>
              </button>
            </div>
          </div>

          {/* Subtab Body */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* SUBTAB 1: RAW REGISTRY */}
            {activeSubTab === 'registry' && (
              <div className="space-y-3">
                <div className="p-2 rounded bg-black/10 dark:bg-black/30 font-mono text-[11px] space-y-1">
                  <div>
                    <span className="opacity-60 font-sans">Registry Hive: </span>
                    <span className="text-[#0078d4] font-semibold">{selectedProc.installation.registryHive || 'HKEY_LOCAL_MACHINE'}</span>
                  </div>
                  <div className="break-all select-all">
                    <span className="opacity-60 font-sans">Full Subkey Path: </span>
                    <span>{selectedProc.installation.registryKey || 'Not registered in standard Uninstall keys'}</span>
                  </div>
                  <div>
                    <span className="opacity-60 font-sans">Raw InstallDate (REG_SZ): </span>
                    <span className="text-[#0078d4] font-semibold">{selectedProc.installation.rawInstallDate || 'N/A'}</span>
                    <span className="opacity-60 ml-2 font-sans">({selectedProc.installation.installedDateFormatted})</span>
                  </div>
                </div>

                {/* Windows RegEdit Style Table */}
                <div className="border rounded overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`h-6 border-b text-[11px] font-medium ${
                        theme === 'dark' ? 'bg-[#202020] border-[#2c2c2c] text-[#aaaaaa]' : 'bg-[#f4f4f4] border-[#e0e0e0] text-[#555555]'
                      }`}>
                        <th className="py-1 px-3 border-r border-inherit w-44">Name</th>
                        <th className="py-1 px-3 border-r border-inherit w-32">Type</th>
                        <th className="py-1 px-3">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-inherit font-mono text-xs">
                      {Object.entries(rawReg).map(([key, item]) => (
                        <tr key={key} className={theme === 'dark' ? 'hover:bg-[#222222]' : 'hover:bg-[#f9f9f9]'}>
                          <td className="py-1 px-3 border-r border-inherit font-semibold text-[#0078d4]">
                            {key}
                          </td>
                          <td className="py-1 px-3 border-r border-inherit text-[11px] opacity-70">
                            {item.type}
                          </td>
                          <td className="py-1 px-3 break-all select-all text-xs">
                            {item.hex ? `${item.hex} (${item.value})` : String(item.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUBTAB 2: RAW TELEMETRY */}
            {activeSubTab === 'telemetry' && rawTel && (
              <div className="space-y-3 font-mono text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`p-3 rounded border space-y-2 ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#2c2c2c]' : 'bg-[#f9f9f9] border-[#e0e0e0]'}`}>
                    <div className="font-semibold font-sans text-xs text-[#0078d4] border-b pb-1">
                      PE Binary Headers & Execution Context
                    </div>
                    <div>
                      <span className="opacity-60 font-sans">PE Header Format: </span>
                      <span>{rawTel.peMagic}</span>
                    </div>
                    <div>
                      <span className="opacity-60 font-sans">Virtual Image Base: </span>
                      <span className="text-cyan-400">{rawTel.imageBase}</span>
                    </div>
                    <div>
                      <span className="opacity-60 font-sans">AddressOfEntryPoint: </span>
                      <span className="text-cyan-400">{rawTel.entryPoint}</span>
                    </div>
                    <div>
                      <span className="opacity-60 font-sans">Handle Count: </span>
                      <span>{rawTel.handleCount} handles</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded border space-y-2 ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#2c2c2c]' : 'bg-[#f9f9f9] border-[#e0e0e0]'}`}>
                    <div className="font-semibold font-sans text-xs text-[#0078d4] border-b pb-1">
                      Security Token & Memory Allocation
                    </div>
                    <div className="truncate">
                      <span className="opacity-60 font-sans">Security Identifier (SID): </span>
                      <span className="select-all text-[11px]">{rawTel.userSid}</span>
                    </div>
                    <div>
                      <span className="opacity-60 font-sans">Token Integrity Level: </span>
                      <span className="font-semibold">{rawTel.integrityLevel}</span>
                    </div>
                    <div>
                      <span className="opacity-60 font-sans">WorkingSetSize: </span>
                      <span>{rawTel.workingSetBytes.toLocaleString()} bytes ({(rawTel.workingSetBytes / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                    <div>
                      <span className="opacity-60 font-sans">PrivateCommitUsage: </span>
                      <span>{rawTel.privateBytes.toLocaleString()} bytes</span>
                    </div>
                  </div>
                </div>

                {/* Raw Thread IDs */}
                <div className={`p-3 rounded border space-y-1.5 ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#2c2c2c]' : 'bg-[#f9f9f9] border-[#e0e0e0]'}`}>
                  <div className="font-semibold font-sans text-xs text-[#0078d4]">
                    Active Thread Identifiers (TIDs) [{rawTel.threadIds.length}]
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-xs">
                    {rawTel.threadIds.map((tid) => (
                      <span key={tid} className="p-1 px-2 rounded bg-black/20 dark:bg-black/50 border border-inherit">
                        TID: {tid}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 3: HEX DUMP */}
            {activeSubTab === 'hexdump' && (
              <div className="space-y-3 font-mono text-xs">
                <div className="text-[11px] opacity-70 font-sans">
                  Raw memory address hex bytecode and prologue patches for intercepted APIs:
                </div>

                {selectedProc.hooks.map((h, i) => (
                  <div
                    key={h.id}
                    className={`p-3 rounded border space-y-2 ${
                      theme === 'dark' ? 'bg-[#1e1e1e] border-[#2c2c2c]' : 'bg-[#f9f9f9] border-[#e0e0e0]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-sans">
                      <span className="font-semibold font-mono text-[#0078d4]">
                        {h.targetModule}!{h.targetApi}
                      </span>
                      <span className="text-[11px] opacity-70">
                        Protection: {h.memoryProtection || 'PAGE_EXECUTE_READWRITE (0x40)'}
                      </span>
                    </div>

                    <div className="space-y-1 bg-black/20 dark:bg-black/50 p-2.5 rounded select-all text-xs">
                      <div>
                        <span className="opacity-50">Target Virtual Address: </span>
                        <span className="text-rose-400 font-semibold">{h.hookedAddress}</span>
                        <span className="opacity-50 ml-3">Original VA: </span>
                        <span>{h.originalAddress}</span>
                      </div>
                      <div className="pt-1 border-t border-neutral-700/30">
                        <span className="opacity-50">Raw Hex Byte Dump: </span>
                        <span className="text-[#60cdff]">{h.rawHexDump}</span>
                      </div>
                      <div>
                        <span className="opacity-50">Opcode Patch: </span>
                        <span className="text-amber-400">{h.disassembly.hookedBytecode}</span>
                        <span className="opacity-70 ml-2">({h.disassembly.instruction})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUBTAB: RAW EXPLOIT CALL STRUCTS & PARAMETERS */}
            {activeSubTab === 'exploits' && (
              <div className="space-y-3 font-sans">
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-75">
                    Intercepted Exploit Calls & Low-Level Win32 Structs for {selectedProc.name} (PID: {selectedProc.pid}):
                  </span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedProc.exploitAttempts || [], null, 2), 'expl-tab')}
                    className="flex items-center gap-1 text-[#0078d4] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'expl-tab' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'expl-tab' ? 'Copied Exploits' : 'Copy Exploits JSON'}</span>
                  </button>
                </div>

                {(!selectedProc.exploitAttempts || selectedProc.exploitAttempts.length === 0) ? (
                  <div className="p-8 text-center text-xs opacity-60">
                    No intercepted exploit attempts recorded for this process.
                  </div>
                ) : (
                  selectedProc.exploitAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className={`p-3 rounded border space-y-2 text-xs ${
                        theme === 'dark' ? 'bg-[#181818] border-[#2c2c2c]' : 'bg-[#f8f8f8] border-[#e2e2e2]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-[#0078d4]">{attempt.targetApi}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {attempt.severity}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] opacity-60 tabular-nums">{attempt.timestamp}</span>
                      </div>

                      <div className="text-[11px] opacity-80">{attempt.description}</div>
                      <div className="text-[10px] opacity-60 font-mono">Target Entity: {attempt.targetEntity}</div>

                      {/* Struct table */}
                      <div className="border border-inherit rounded overflow-hidden mt-1 font-mono text-[11px]">
                        <table className="w-full text-left">
                          <thead>
                            <tr className={theme === 'dark' ? 'bg-[#202020] text-[#888888]' : 'bg-[#eaeaea] text-[#666666]'}>
                              <th className="py-0.5 px-2.5 w-48 border-r border-inherit">Win32 Struct Member</th>
                              <th className="py-0.5 px-2.5">Evaluated Value / Pointer</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-inherit">
                            {Object.entries(attempt.rawCallParameters).map(([k, val]) => (
                              <tr key={k} className={theme === 'dark' ? 'hover:bg-[#252525]' : 'hover:bg-[#f2f2f2]'}>
                                <td className="py-1 px-2.5 text-[#0078d4] font-semibold border-r border-inherit">{k}</td>
                                <td className="py-1 px-2.5 opacity-90 break-all select-all">{String(val)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SUBTAB 4: RAW JSON PAYLOAD */}
            {activeSubTab === 'json' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="opacity-70">Complete Raw JSON Payload for {selectedProc.name}:</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedProc, null, 2), 'json-tab')}
                    className="flex items-center gap-1 text-[#0078d4] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'json-tab' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'json-tab' ? 'Copied JSON' : 'Copy JSON'}</span>
                  </button>
                </div>

                <pre className="p-3 bg-black/15 dark:bg-black/50 rounded font-mono text-[11px] leading-relaxed select-all overflow-x-auto max-h-[380px]">
                  <code>{JSON.stringify(selectedProc, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
