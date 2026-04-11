import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, Loader2, Settings2,
  ChevronRight, RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AIDisclaimer } from "@/components/shared";

interface Message {
  role: "user" | "master";
  text: string;
  ts: number;
}

const QUICK_PROBLEMS = [
  { emoji: "⬅️", label: "Strip Left Ja Rahi Hai", desc: "Edge camber / alignment", query: "Meri roll forming machine mein strip left side mein ja rahi hai. Kya karna chahiye?" },
  { emoji: "➡️", label: "Strip Right Ja Rahi Hai", desc: "Edge deviation", query: "Strip right side mein continuously ja rahi hai. Solution batao." },
  { emoji: "⬆️", label: "Strip Upar Ja Rahi Hai", desc: "Bow up / spring back", query: "Strip machine se nikalte waqt upar ki taraf bow ho rahi hai. Kaise theek karein?" },
  { emoji: "⬇️", label: "Strip Neeche Ja Rahi Hai", desc: "Bow down", query: "Profile neeche ki taraf bend ho rahi hai, flat nahi aa rahi. Kya karna chahiye?" },
  { emoji: "🌀", label: "Profile Mein Twist", desc: "Profile twisting", query: "Profile mein twist aa raha hai, seedhi nahi nikal rahi. Reason aur solution batao." },
  { emoji: "📐", label: "End Mein Flare", desc: "Bell mouth / flaring", query: "Profile ke end pe flare aa raha hai ya bell mouth shape ban rahi hai. Kaise theek karein?" },
  { emoji: "🌊", label: "Wave / Buckle", desc: "Tarangein profile mein", query: "Profile mein wave ya buckle aa raha hai, smooth nahi hai. Solution chahiye." },
  { emoji: "📏", label: "Cut Length Galat", desc: "Dimension error", query: "Machine ka cut length galat aa raha hai, required dimension se alag hai. Kya check karein?" },
  { emoji: "🔩", label: "Punching Galat Jagah", desc: "Punch misalignment", query: "Punching galat position pe ho rahi hai drawing se match nahi kar rahi. Kaise fix karein?" },
  { emoji: "😵", label: "Surface Marks", desc: "Scratches on profile", query: "Profile pe marks ya scratches aa rahe hain. Kya problem hai aur kaise theek karein?" },
  { emoji: "⚡", label: "Motor Trip / Overload", desc: "Motor overcurrent", query: "Machine ka motor baar baar trip ho raha hai ya overload dikhata hai. Kya karna chahiye?" },
  { emoji: "📡", label: "Straightener Problem", desc: "Material seedha nahi", query: "Straightener se material seedha nahi nikal raha, coil set bahut hai. Solution batao." },
];

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isUser ? "bg-blue-600" : "bg-gradient-to-br from-orange-500 to-amber-600"}`}>
        {isUser
          ? <span className="text-white text-[10px] font-bold">YOU</span>
          : <Settings2 className="w-4 h-4 text-white" aria-hidden="true" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isUser
        ? "bg-blue-600 text-white"
        : "bg-white border border-slate-200 text-slate-800"
      }`}>
        <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
        <p className={`text-xs mt-1.5 ${isUser ? "text-blue-200" : "text-slate-400"}`}>
          {new Date(msg.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  );
}

export default function MachineGuidePage() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "master",
      text: `🔧 Namaste! Main hoon MASTER — SAI RoloTech ka Roll Forming Machine Expert AI.\n\n20+ saal ka experience hai mujhe roll forming machines mein. Aap koi bhi machine problem batayein, main step-by-step guide karunga.\n\nAap ya toh neeche se apni problem select karein, ya seedha type karein! ⚙️`,
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setShowQuick(false);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role === "user" ? "user" : "model", text: m.text }));
      const res = await fetch("/api/machine-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: "master", text: data.reply, ts: Date.now() }]);
      } else {
        throw new Error(data.error || "AI error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setMessages(prev => [...prev, { role: "master", text: "⚠️ Sorry, abhi connection issue hai. Thodi der baad dobara try karein.", ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([{ role: "master", text: `🔧 Namaste! Main hoon MASTER — SAI RoloTech ka Roll Forming Machine Expert AI.\n\n20+ saal ka experience hai mujhe roll forming machines mein. Aap koi bhi machine problem batayein, main step-by-step guide karunga.\n\nAap ya toh neeche se apni problem select karein, ya seedha type karein! ⚙️`, ts: Date.now() }]);
    setInput("");
    setShowQuick(true);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-orange-100 bg-white/90 backdrop-blur-sm z-10 flex-shrink-0 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation("/home")}
            aria-label="Go back"
            className="p-2 rounded-lg hover:bg-orange-50 text-slate-500 hover:text-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-200">
              <Settings2 className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-slate-800 font-bold text-sm">MASTER — AI Machine Expert</h1>
            <p className="text-emerald-600 text-xs font-medium">Online · Roll Forming Troubleshooter</p>
          </div>
          <button
            onClick={handleReset}
            aria-label="Start new conversation"
            title="Naya conversation"
            className="p-2 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-2">
        <AIDisclaimer compact />
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto" role="log" aria-live="polite" aria-label="Conversation">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

          {showQuick && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <p className="text-slate-400 text-xs text-center font-medium">— Apni problem select karein —</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_PROBLEMS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => sendMessage(p.query)}
                    aria-label={p.label}
                    className="flex items-center gap-3 p-3 bg-white border border-orange-100 hover:border-orange-300 hover:bg-orange-50 rounded-xl text-left transition-all group shadow-sm focus-visible:ring-2 focus-visible:ring-orange-400"
                  >
                    <span className="text-2xl flex-shrink-0" aria-hidden="true">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 text-sm font-medium">{p.label}</p>
                      <p className="text-slate-400 text-xs truncate">{p.desc}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-500 flex-shrink-0 transition-colors" aria-hidden="true" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowQuick(false)}
                className="w-full text-center text-slate-400 hover:text-slate-600 text-xs py-2 transition-colors"
              >
                Ya neeche type karein apni problem ↓
              </button>
            </motion.div>
          )}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3" aria-label="MASTER is thinking">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                <Settings2 className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <div className="bg-white border border-orange-100 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-orange-500 animate-spin" aria-hidden="true" />
                  <span className="text-slate-500 text-sm">MASTER analyze kar raha hai...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick Pills */}
      {!showQuick && messages.length > 1 && (
        <div className="border-t border-orange-100 flex-shrink-0 bg-orange-50/60">
          <div className="max-w-3xl mx-auto px-3 py-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_PROBLEMS.slice(0, 6).map(p => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.query)}
                  aria-label={p.label}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-orange-50 border border-orange-200 hover:border-orange-400 rounded-full text-xs text-slate-700 transition-all whitespace-nowrap shadow-sm"
                >
                  <span aria-hidden="true">{p.emoji}</span> {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="border-t border-slate-200 bg-white/95 backdrop-blur-sm flex-shrink-0 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex gap-2 items-end">
            <label htmlFor="machine-chat-input" className="sr-only">Machine problem batayein</label>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
              <input
                id="machine-chat-input"
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Machine problem batayein... (Jaise: Strip left ja rahi hai)"
                className="w-full bg-transparent text-slate-800 text-sm placeholder-slate-400 focus:outline-none"
                disabled={loading}
                aria-label="Message input"
              />
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="w-11 h-11 flex items-center justify-center bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all flex-shrink-0 shadow-md shadow-orange-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
          <p className="text-slate-400 text-xs text-center mt-2">
            MASTER · SAI RoloTech Roll Forming AI · 20+ Years Experience
          </p>
        </div>
      </div>
    </div>
  );
}
