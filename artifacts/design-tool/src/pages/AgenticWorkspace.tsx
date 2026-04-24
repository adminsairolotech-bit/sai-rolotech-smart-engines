import React, { useState, useEffect } from "react";
import { 
  Terminal, Cpu, Sparkles, Activity, ShieldCheck, 
  Box, Layers, FileCode2, Zap, Play, Search 
} from "lucide-react";

export function AgenticWorkspace() {
  const [thoughts, setThoughts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [accuracy, setAccuracy] = useState(98);

  // Simulate Emergent-style live streaming
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('live_data.json')
        .then(res => res.json())
        .then(data => {
          setThoughts(prev => [{timestamp: data.timestamp, text: data.thought}, ...prev].slice(0, 15));
          setLogs(prev => [{timestamp: data.timestamp, action: data.action}, ...prev].slice(0, 10));
          setAccuracy(data.accuracy);
          
          if(data.machine_telemetry) {
            const speedEl = document.getElementById('tel-speed');
            const loadEl = document.getElementById('tel-load');
            if(speedEl) speedEl.innerText = `${data.machine_telemetry.line_speed} m/min`;
            if(loadEl) loadEl.innerText = `${data.machine_telemetry.motor_current}A`;
          }
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-[#05070a] text-[#e2e8f0] font-sans overflow-hidden">
      
      {/* 1. Left Sidebar: The Brain (Thought Stream) */}
      <aside className="w-[320px] border-r border-[#1e293b] bg-[#0a0f14] flex flex-col">
        <div className="p-4 border-b border-[#1e293b] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest">Thought Stream</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {thoughts.map((t, i) => (
            <div key={i} className="space-y-1 animate-in fade-in slide-in-from-left-2 duration-500">
              <div className="text-[10px] text-cyan-500 font-mono">[{t.timestamp}]</div>
              <div className="text-sm text-zinc-300 leading-relaxed">{t.text}</div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-[#1e293b] bg-amber-500/5">
          <div className="text-[10px] text-amber-500 font-bold mb-1">SYSTEM HEALTH</div>
          <div className="flex items-center justify-between">
            <span className="text-xs">Precision Score</span>
            <span className="text-xs font-bold text-emerald-500">{accuracy}%</span>
          </div>
        </div>
      </aside>

      {/* 2. Center: The Studio (Technical Viewport) */}
      <main className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 pointer-events-none opacity-20"
             style={{ backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>
        
        <header className="h-14 border-b border-[#1e293b] flex items-center justify-between px-6 bg-[#0a0f14]/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold tracking-tight">SAI_ROLOTECH_C80_MASTER</h1>
            <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-500 font-bold">LIVE AUDIT ACTIVE</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors"><Search className="w-4 h-4" /></button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors">
              <Play className="w-3 h-3 fill-current" /> EXECUTE RUN
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center relative">
           {/* Placeholder for 3D Viewport */}
           <div className="text-center space-y-4">
              <Box className="w-24 h-24 text-zinc-800 mx-auto animate-pulse" />
              <div className="text-xs text-zinc-500 font-mono tracking-widest uppercase">Initializing 3D Simulation Engine...</div>
           </div>
        </div>

        {/* Bottom Console (Execution Logs) */}
        <footer className="h-48 border-t border-[#1e293b] bg-[#05070a] flex flex-col">
          <div className="px-4 py-2 border-b border-[#1e293b] flex items-center gap-2 bg-[#0a0f14]">
            <Terminal className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase text-zinc-500">Live Shell Output</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1">
            {logs.map((l, i) => (
              <div key={i} className="text-emerald-500 opacity-80">
                <span className="text-zinc-600 mr-2">$</span>
                {l.action}
              </div>
            ))}
          </div>
        </footer>
      </main>

      {/* 3. Right Sidebar: The Auditor (Specialist Squad) */}
      <aside className="w-[280px] border-l border-[#1e293b] bg-[#0a0f14] p-4 flex flex-col gap-6">
        <div>
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Machine Telemetry</h3>
          <div className="p-4 rounded-lg border border-[#1e293b] bg-[#05070a] space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500">Line Speed</span>
              <span id="tel-speed" className="text-xs font-mono text-cyan-400">12.2 m/min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500">Motor Load</span>
              <span id="tel-load" className="text-xs font-mono text-amber-400">5.8A</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500">PLC Status</span>
              <span className="text-[9px] font-bold text-emerald-500 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">SYNC OK</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Specialist Squad</h3>
          <div className="space-y-3">
            {[
              { name: "Agent-DIMENSION", status: "VERIFIED", icon: <Layers className="w-4 h-4" /> },
              { name: "Agent-FLOWER", status: "VERIFYING...", icon: <Activity className="w-4 h-4" /> },
              { name: "Agent-PHYSICS", status: "PENDING", icon: <ShieldCheck className="w-4 h-4" /> },
              { name: "Agent-GCODE", status: "LOCKED", icon: <FileCode2 className="w-4 h-4" /> }
            ].map((a, i) => (
              <div key={i} className="p-3 rounded-lg border border-[#1e293b] bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-cyan-500">{a.icon}</div>
                  <div className="text-xs font-medium">{a.name}</div>
                </div>
                <div className={`text-[9px] font-bold ${a.status === 'VERIFIED' ? 'text-emerald-500' : 'text-amber-500'}`}>{a.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto">
           <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span className="text-[11px] font-bold">Neural Sync Ready</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Connect your PLC/HMI to stream live machine data directly into Hermes Auditor.
              </p>
           </div>
        </div>
      </aside>

    </div>
  );
}
