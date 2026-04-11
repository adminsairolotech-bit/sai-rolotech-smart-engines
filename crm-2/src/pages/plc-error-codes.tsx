import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, Zap, RefreshCw, Send, Loader2,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AIDisclaimer } from "@/components/shared";

const DRIVERS = [
  {
    id: "vichi",
    name: "Vichi VFD",
    color: "from-red-500 to-rose-700",
    bgLight: "bg-red-50",
    border: "border-red-200",
    textColor: "text-red-700",
    icon: "🔴",
    popular: true,
    commonCodes: [
      { code: "E.OC", name: "Over Current", severity: "high", desc: "Output current exceeds limit" },
      { code: "E.OV", name: "Over Voltage", severity: "high", desc: "DC bus voltage too high" },
      { code: "E.LU", name: "Under Voltage", severity: "medium", desc: "DC bus voltage too low" },
      { code: "E.OH", name: "Over Heat", severity: "high", desc: "Heatsink temperature exceeds limit" },
      { code: "E.OL", name: "Motor Overload", severity: "medium", desc: "Motor overloaded" },
      { code: "E.GF", name: "Ground Fault", severity: "high", desc: "Output ground fault detected" },
      { code: "E.EF", name: "External Fault", severity: "medium", desc: "External fault signal active" },
      { code: "E.PF", name: "Input Phase Loss", severity: "high", desc: "Input phase missing" },
    ],
  },
  {
    id: "delta",
    name: "Delta VFD",
    color: "from-blue-500 to-blue-700",
    bgLight: "bg-blue-50",
    border: "border-blue-200",
    textColor: "text-blue-700",
    icon: "🔵",
    popular: true,
    commonCodes: [
      { code: "oc", name: "Over Current", severity: "high", desc: "Output current too large" },
      { code: "ov", name: "DC Over Voltage", severity: "high", desc: "DC bus voltage exceeds limit" },
      { code: "uv", name: "DC Under Voltage", severity: "medium", desc: "Voltage too low" },
      { code: "oH1", name: "IGBT Over Heat", severity: "high", desc: "IGBT temperature too high" },
      { code: "oH2", name: "Heat Sink Over Heat", severity: "medium", desc: "Heatsink too hot" },
      { code: "oL", name: "Overload", severity: "medium", desc: "VFD overload" },
      { code: "EF", name: "External Fault", severity: "medium", desc: "External fault input active" },
      { code: "Lv", name: "Low Voltage", severity: "low", desc: "Input voltage too low" },
      { code: "CF", name: "CF3/CF4 Communication", severity: "medium", desc: "Communication fault" },
      { code: "AUE", name: "Auto-Tuning Fault", severity: "low", desc: "Motor auto-tune failed" },
    ],
  },
  {
    id: "fanuc",
    name: "Fanuc",
    color: "from-yellow-500 to-amber-700",
    bgLight: "bg-yellow-50",
    border: "border-yellow-200",
    textColor: "text-yellow-700",
    icon: "🟡",
    popular: true,
    commonCodes: [
      { code: "ALM 400", name: "Overload 1", severity: "high", desc: "Servo motor overload" },
      { code: "ALM 401", name: "Overload 2", severity: "high", desc: "Servo driver overload" },
      { code: "ALM 410", name: "Over Voltage", severity: "high", desc: "DC bus overvoltage" },
      { code: "ALM 411", name: "Under Voltage", severity: "medium", desc: "DC bus undervoltage" },
      { code: "ALM 413", name: "Over Current", severity: "high", desc: "Driver overcurrent" },
      { code: "ALM 414", name: "Ground Fault", severity: "high", desc: "Ground fault detected" },
      { code: "ALM 416", name: "Disconnected Motor", severity: "medium", desc: "Motor cable disconnected" },
      { code: "ALM 421", name: "Encoder Error", severity: "high", desc: "Encoder signal fault" },
      { code: "ALM 422", name: "Position Deviation", severity: "medium", desc: "Position error too large" },
    ],
  },
  {
    id: "fuji",
    name: "Fuji Electric (FRENIC)",
    color: "from-green-500 to-emerald-700",
    bgLight: "bg-green-50",
    border: "border-green-200",
    textColor: "text-green-700",
    icon: "🟢",
    popular: true,
    commonCodes: [
      { code: "OC1", name: "Over Current (Accel)", severity: "high", desc: "Overcurrent during acceleration" },
      { code: "OC2", name: "Over Current (Decel)", severity: "high", desc: "Overcurrent during deceleration" },
      { code: "OC3", name: "Over Current (Constant)", severity: "high", desc: "Overcurrent at constant speed" },
      { code: "OV1", name: "Over Voltage (Accel)", severity: "high", desc: "Overvoltage during acceleration" },
      { code: "OV2", name: "Over Voltage (Decel)", severity: "high", desc: "Overvoltage during deceleration" },
      { code: "LU", name: "Under Voltage", severity: "medium", desc: "DC bus voltage low" },
      { code: "OH1", name: "Heat Sink Overheat", severity: "high", desc: "Heatsink temperature too high" },
      { code: "OL1", name: "Motor Overload", severity: "medium", desc: "Motor thermal overload" },
      { code: "Er1", name: "Memory Error", severity: "low", desc: "EEPROM data error" },
      { code: "dbH", name: "Brake Resistor Overheat", severity: "medium", desc: "Braking resistor overheat" },
    ],
  },
];

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: "High",   color: "text-red-700",    bg: "bg-red-100" },
  medium: { label: "Medium", color: "text-amber-700",  bg: "bg-amber-100" },
  low:    { label: "Low",    color: "text-green-700",  bg: "bg-green-100" },
};

interface ChatMsg {
  role: "user" | "ai";
  text: string;
  ts: number;
}

export default function PLCErrorCodesPage() {
  const [, setLocation] = useLocation();
  const [searchCode, setSearchCode] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [expandedDriver, setExpandedDriver] = useState<string | null>("vichi");

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "ai", text: "Namaste! Main PLC/VFD Error Expert hoon. Error code aur driver ka naam batayein, main seedha solution dunga. 🔧", ts: Date.now() }
  ]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendToAI = async (text: string, driver?: string) => {
    if (!text.trim() || aiLoading) return;
    const userMsg: ChatMsg = { role: "user", text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAiLoading(true);
    setChatOpen(true);

    try {
      const res = await fetch("/api/plc-error-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorCode: text,
          driver: driver || selectedDriver || "",
          description: "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: "ai", text: data.reply, ts: Date.now() }]);
      } else {
        throw new Error(data.error || "AI error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setMessages(prev => [...prev, { role: "ai", text: "⚠️ Abhi connection issue hai. Thodi der baad dobara try karein.", ts: Date.now() }]);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredDrivers = DRIVERS.map(d => ({
    ...d,
    commonCodes: searchCode.trim()
      ? d.commonCodes.filter(c =>
          c.code.toLowerCase().includes(searchCode.toLowerCase()) ||
          c.name.toLowerCase().includes(searchCode.toLowerCase())
        )
      : d.commonCodes,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 pb-10">
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setLocation("/home")} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-slate-800 font-bold text-sm">PLC / VFD Error Codes</h1>
            <p className="text-indigo-600 text-xs font-medium">Vichi • Delta • Fanuc • Fuji — AI Powered</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchCode}
            onChange={e => setSearchCode(e.target.value)}
            placeholder="Error code search karein... (e.g. E.OC, OC1, ALM 400)"
            className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
          />
          {searchCode && (
            <button onClick={() => setSearchCode("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-indigo-800 mb-2">⚡ AI Se Seedha Poochho</p>
          <div className="flex gap-2">
            <select
              value={selectedDriver}
              onChange={e => setSelectedDriver(e.target.value)}
              className="text-xs border border-indigo-300 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none"
            >
              <option value="">Driver Select</option>
              {DRIVERS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <div className="flex-1 relative">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendToAI(input)}
                placeholder="Error code type karein..."
                className="w-full px-4 py-2 text-sm border border-indigo-300 rounded-xl bg-white focus:outline-none pr-10"
              />
              <button
                onClick={() => sendToAI(input)}
                disabled={!input.trim() || aiLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center disabled:opacity-40"
              >
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {chatOpen && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-700">AI Expert Response</p>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-slate-600">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 pt-2">
              <AIDisclaimer compact />
            </div>
            <div className="max-h-64 overflow-y-auto p-4 space-y-3">
              {messages.slice(1).map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`max-w-[85%] text-xs leading-relaxed px-3 py-2.5 rounded-xl ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex gap-2">
                  <div className="bg-slate-100 px-3 py-2.5 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">Error Code Database</p>

        {filteredDrivers.map(driver => {
          const isExpanded = expandedDriver === driver.id;
          const hasResults = driver.commonCodes.length > 0;

          return (
            <div key={driver.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setExpandedDriver(isExpanded ? null : driver.id)}
                className="w-full"
              >
                <div className={`bg-gradient-to-r ${driver.color} px-4 py-3.5 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{driver.icon}</span>
                    <div className="text-left">
                      <p className="text-white font-bold text-sm">{driver.name}</p>
                      <p className="text-white/80 text-xs">{driver.commonCodes.length} common error codes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {driver.popular && (
                      <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">Most Used</span>
                    )}
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-white" /> : <ChevronRight className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 space-y-2">
                      {!hasResults ? (
                        <p className="text-sm text-slate-500 text-center py-4">No matching codes found</p>
                      ) : (
                        driver.commonCodes.map(code => {
                          const sev = SEVERITY_CONFIG[code.severity];
                          return (
                            <button
                              key={code.code}
                              onClick={() => sendToAI(`${code.code} - ${code.name}`, driver.name)}
                              className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left transition-colors group"
                            >
                              <div className={`shrink-0 px-2.5 py-1 rounded-lg font-mono text-xs font-bold ${driver.bgLight} ${driver.textColor} border ${driver.border}`}>
                                {code.code}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{code.name}</p>
                                <p className="text-xs text-slate-500 truncate">{code.desc}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sev.bg} ${sev.color}`}>
                                  {sev.label}
                                </span>
                                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                              </div>
                            </button>
                          );
                        })
                      )}

                      <button
                        onClick={() => sendToAI(`${driver.name} ke common errors aur unka solution batao`, driver.name)}
                        className="w-full py-2.5 border-2 border-dashed border-slate-200 text-slate-500 text-xs font-medium rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {driver.name} ke saare errors AI se poochho
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800 mb-1">Safety Note</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                VFD/Drive pe kaam karte waqt power completely off karein aur DC bus discharge hone ka wait karein (2-5 min). High voltage ka khayal rakhen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

