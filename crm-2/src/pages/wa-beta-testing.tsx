import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader } from "@/components/shared";
import {
  MessageSquare, UserPlus, Send, RefreshCw, Trash2, Phone,
  User, CheckCircle2, XCircle, AlertTriangle, Clock, Eye,
  ChevronDown, ChevronUp, Plus, Sparkles, Database, Info,
  MessageCircle, Bell, BarChart3, Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

/* ── Types ──────────────────────────────────────────── */
interface BetaTester { id: string; name: string; phone: string; state: string; addedAt: string; }
interface LeadSnapshot { phone: string; name: string; score: string; status: string; source: string; locationPriority: string; followupIndex: number; lastContact: string | null; dnd: boolean; appInstalled: boolean; meetingBooked: boolean; features: string[]; isBetaTest?: boolean; createdAt: string; updatedAt: string; }
interface MsgLogEntry { id: string; phone: string; leadName: string; messageType: string; label: string; dayIndex: number; mock: boolean; blocked: boolean; blockedReason: string | null; waMessageId: string | null; status: "real_sent" | "mock_sent" | "blocked" | "error"; timestamp: string; error?: string; }

const TESTERS_KEY = "sai_beta_testers";
const SCORE_COLORS: Record<string, string> = {
  VERY_HOT: "bg-red-100 text-red-700 border-red-200",
  HOT:      "bg-orange-100 text-orange-700 border-orange-200",
  WARM:     "bg-amber-100 text-amber-700 border-amber-200",
  COLD:     "bg-blue-100 text-blue-700 border-blue-200",
};
const STATUS_ICON: Record<string, { icon: typeof CheckCircle2; color: string; label: string; bg: string }> = {
  real_sent:  { icon: CheckCircle2,  color: "text-emerald-600", label: "Real Sent ✅",  bg: "bg-emerald-50 border-emerald-200" },
  mock_sent:  { icon: Bell,          color: "text-amber-600",   label: "Mock (Console)", bg: "bg-amber-50 border-amber-200" },
  blocked:    { icon: XCircle,       color: "text-red-600",     label: "Blocked",        bg: "bg-red-50 border-red-200" },
  error:      { icon: AlertTriangle, color: "text-red-700",     label: "Error",          bg: "bg-red-50 border-red-200" },
};

const MSG_TYPES = [
  { id: "welcome",     label: "Welcome",         icon: MessageCircle, desc: "Pehla welcome + app download link" },
  { id: "followup",    label: "Follow-up",        icon: Zap,           desc: "Day-wise follow-up (D0–D5)" },
  { id: "admin_alert", label: "Admin Alert",      icon: Bell,          desc: "Admin ko hot lead alert bhejo" },
  { id: "quotation",   label: "Quotation F/U",    icon: BarChart3,     desc: "Quotation ke baad follow-up" },
  { id: "custom",      label: "Custom Message",   icon: Sparkles,      desc: "Apna message likhao" },
];

/* ── Main Component ─────────────────────────────────── */
export default function WaBetaTestingPage() {
  /* Testers */
  const [testers, setTesters] = useState<BetaTester[]>(() => {
    try { return JSON.parse(localStorage.getItem(TESTERS_KEY) || "[]"); } catch { return []; }
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName]   = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addState, setAddState] = useState("Delhi");
  const [selectedTester, setSelectedTester] = useState<BetaTester | null>(null);

  /* Lead creation */
  const [leadCreated, setLeadCreated]   = useState(false);
  const [leadCreating, setLeadCreating] = useState(false);
  const [leadSnap, setLeadSnap]         = useState<LeadSnapshot | null>(null);
  const [snapLoading, setSnapLoading]   = useState(false);

  /* Message sending */
  const [msgType, setMsgType]   = useState("welcome");
  const [dayIndex, setDayIndex] = useState(0);
  const [customText, setCustomText] = useState("");
  const [sending, setSending]   = useState(false);

  /* Log */
  const [log, setLog]           = useState<MsgLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  /* Persist testers */
  useEffect(() => { localStorage.setItem(TESTERS_KEY, JSON.stringify(testers)); }, [testers]);

  /* Refresh log & lead when tester changes */
  useEffect(() => {
    if (selectedTester) { fetchLog(); setLeadCreated(false); setLeadSnap(null); }
  }, [selectedTester]);

  /* ── Helpers ── */
  function saveTester() {
    if (!addName.trim() || !addPhone.trim()) { toast({ title: "Name aur phone dono chahiye", variant: "destructive" }); return; }
    const t: BetaTester = { id: `t_${Date.now()}`, name: addName.trim(), phone: addPhone.trim(), state: addState, addedAt: new Date().toISOString() };
    setTesters(prev => [...prev, t]);
    setAddName(""); setAddPhone(""); setAddState("Delhi"); setShowAddForm(false);
    toast({ title: `${t.name} added as beta tester` });
  }
  function removeTester(id: string) {
    setTesters(prev => prev.filter(t => t.id !== id));
    if (selectedTester?.id === id) { setSelectedTester(null); setLeadSnap(null); setLeadCreated(false); }
  }

  const fetchLeadSnap = useCallback(async (phone: string) => {
    setSnapLoading(true);
    try {
      const res = await fetch(`/api/beta/get-lead?phone=${phone}`);
      const data = await res.json();
      if (data.success) setLeadSnap(data.lead);
      else setLeadSnap(null);
    } catch { setLeadSnap(null); }
    setSnapLoading(false);
  }, []);

  const fetchLog = useCallback(async () => {
    if (!selectedTester) return;
    setLogLoading(true);
    try {
      const res = await fetch(`/api/beta/message-log?phone=${selectedTester.phone}`);
      const data = await res.json();
      if (data.success) setLog(data.log);
    } catch { }
    setLogLoading(false);
  }, [selectedTester]);

  async function createLead() {
    if (!selectedTester) return;
    setLeadCreating(true);
    try {
      const res = await fetch("/api/beta/create-lead", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedTester.name, phone: selectedTester.phone, state: selectedTester.state, notes: "Beta test lead" }),
      });
      const data = await res.json();
      if (data.success) {
        setLeadCreated(true);
        toast({ title: data.existing ? `Lead already exists — ${selectedTester.name}` : `Lead created — ${selectedTester.name}` });
        await fetchLeadSnap(selectedTester.phone);
      } else {
        toast({ title: "Lead creation failed", description: data.error, variant: "destructive" });
      }
    } catch (e: unknown) {
      toast({ title: "Error", description: String(e instanceof Error ? e.message : e), variant: "destructive" });
    }
    setLeadCreating(false);
  }

  async function sendMessage() {
    if (!selectedTester) return;
    if (!leadCreated && !leadSnap) { toast({ title: "Pehle Lead Create karo", variant: "destructive" }); return; }
    if (msgType === "custom" && !customText.trim()) { toast({ title: "Custom message likhao", variant: "destructive" }); return; }
    setSending(true);
    try {
      const res = await fetch("/api/beta/send-wa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: selectedTester.phone, messageType: msgType, dayIndex, customText: customText.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        const entry = data.entry as MsgLogEntry;
        const statusMsg = entry.status === "real_sent" ? "✅ WhatsApp pe real message gaya!" : entry.status === "mock_sent" ? "🟡 Mock mode — console mein dekho" : "⚠️ Blocked";
        toast({ title: `${entry.label} sent to ${selectedTester.name}`, description: statusMsg });
        await fetchLog();
        await fetchLeadSnap(selectedTester.phone);
      } else {
        toast({ title: "Send failed", description: data.error, variant: "destructive" });
      }
    } catch (e: unknown) {
      toast({ title: "Error", description: String(e instanceof Error ? e.message : e), variant: "destructive" });
    }
    setSending(false);
  }

  async function clearLog() {
    await fetch("/api/beta/clear-log", { method: "DELETE" });
    setLog([]);
    toast({ title: "Message log cleared" });
  }

  const waConfigured = log.some(l => l.status === "real_sent") || false;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader
        title="WhatsApp Beta Testing"
        subtitle="Real API — Personal beta testers ke saath full flow test karo"
      />

      {/* ── Info Banner ─────────────────────────────────── */}
      <motion.div variants={staggerItem} className="glass-card rounded-2xl p-4 border border-blue-200 bg-blue-50/50">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 leading-relaxed space-y-1">
            <p className="font-semibold text-sm">Testing Flow — 3 Steps</p>
            <p><strong>Step 1:</strong> Beta Tester add karo (name + phone number) → ye tumhara dummy account hai</p>
            <p><strong>Step 2:</strong> Lead Create karo — uss number ko CRM mein test lead banana hai</p>
            <p><strong>Step 3:</strong> Message type choose karo aur bhejo → WhatsApp pe real message aayega, CRM data save hoga</p>
            <p className="text-blue-600"><strong>Tip:</strong> Apna personal number ya team members ke numbers use karo — real messages aayenge</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT: Beta Testers Panel ─────────────────── */}
        <motion.div variants={staggerItem} className="lg:col-span-1 space-y-4">
          <div className="glass-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Beta Testers
              </h2>
              <button
                onClick={() => setShowAddForm(v => !v)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <AnimatePresence>
              {showAddForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="border-b border-border bg-muted/30 overflow-hidden">
                  <div className="p-4 space-y-3">
                    <input value={addName} onChange={e => setAddName(e.target.value)} placeholder="Full Name *"
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <input value={addPhone} onChange={e => setAddPhone(e.target.value)} placeholder="+91-XXXXX-XXXXX *" type="tel"
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <select value={addState} onChange={e => setAddState(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                      {["Delhi","Haryana","Uttar Pradesh","Punjab","Rajasthan","Maharashtra","Gujarat","Karnataka","Tamil Nadu","Other"].map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={saveTester} className="flex-1 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700">Save</button>
                      <button onClick={() => setShowAddForm(false)} className="flex-1 py-2 bg-muted text-foreground text-sm font-semibold rounded-xl hover:bg-muted/80">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="divide-y divide-border">
              {testers.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Koi beta tester nahi hai.<br />
                  <span className="text-xs">+ Add karo apna ya team member ka number</span>
                </div>
              )}
              {testers.map(t => (
                <div key={t.id}
                  onClick={() => setSelectedTester(prev => prev?.id === t.id ? null : t)}
                  className={`p-3 cursor-pointer transition-all hover:bg-muted/40 ${selectedTester?.id === t.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${selectedTester?.id === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {t.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />{t.phone}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{t.state}</p>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeTester(t.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Status */}
          <div className={`glass-card rounded-2xl border p-4 ${process.env.NODE_ENV !== "production" ? "border-amber-200 bg-amber-50/50" : "border-emerald-200 bg-emerald-50/50"}`}>
            <p className="text-xs font-bold mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> WhatsApp Status
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">Mock (no token)</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Real messages bhejne ke liye</span>
                <span className="font-medium text-foreground">WHATSAPP_ACCESS_TOKEN chahiye</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mock mode mein</span>
                <span className="font-medium">Server console mein log hoga</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT: Test Flow + Lead Snapshot ─────────── */}
        <motion.div variants={staggerItem} className="lg:col-span-2 space-y-4">

          {!selectedTester ? (
            <div className="glass-card rounded-2xl border border-dashed border-border p-10 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm font-semibold text-muted-foreground">Beta Tester select karo</p>
              <p className="text-xs text-muted-foreground mt-1">Left panel mein tester ko click karo — phir test shuru karo</p>
            </div>
          ) : (
            <>
              {/* Step 1: Create Lead */}
              <div className="glass-card rounded-2xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50/50 to-transparent">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
                        Lead Create Karo
                        <Badge className="text-[10px]">{selectedTester.name} — {selectedTester.phone}</Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 ml-8">CRM mein iss number ka test lead banana hai</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {leadSnap && (
                        <button onClick={() => fetchLeadSnap(selectedTester.phone)} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted">
                          <RefreshCw className="w-3 h-3" /> Refresh
                        </button>
                      )}
                      <button onClick={createLead} disabled={leadCreating}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${leadCreated || leadSnap ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
                        {leadCreating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> : (leadCreated || leadSnap) ? <><CheckCircle2 className="w-4 h-4" /> Lead Ready</> : <><UserPlus className="w-4 h-4" /> Create Lead</>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lead Snapshot */}
                {snapLoading && (
                  <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Lead data load ho raha hai...
                  </div>
                )}
                {leadSnap && !snapLoading && (
                  <div className="p-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Live Lead Snapshot</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { label: "Name",       value: leadSnap.name },
                        { label: "Phone",      value: leadSnap.phone },
                        { label: "Score",      value: leadSnap.score,      badge: true },
                        { label: "Status",     value: leadSnap.status },
                        { label: "Location",   value: leadSnap.locationPriority },
                        { label: "Source",     value: leadSnap.source },
                        { label: "Followup #", value: String(leadSnap.followupIndex) },
                        { label: "App",        value: leadSnap.appInstalled ? "✅ Installed" : "❌ Not installed" },
                        { label: "DND",        value: leadSnap.dnd ? "🚫 Yes" : "No" },
                        { label: "Meeting",    value: leadSnap.meetingBooked ? "✅ Booked" : "No" },
                        { label: "Features",   value: leadSnap.features?.join(", ") || "none" },
                        { label: "Last Contact", value: leadSnap.lastContact ? new Date(leadSnap.lastContact).toLocaleTimeString("en-IN") : "Never" },
                      ].map(field => (
                        <div key={field.label} className="bg-muted/30 rounded-xl p-2.5">
                          <p className="text-[10px] text-muted-foreground font-medium">{field.label}</p>
                          {field.badge ? (
                            <Badge className={`text-[10px] mt-0.5 ${SCORE_COLORS[field.value] || "bg-slate-100 text-slate-600"}`}>{field.value}</Badge>
                          ) : (
                            <p className="text-xs font-semibold text-foreground truncate mt-0.5">{field.value || "—"}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Send Message */}
              <div className={`glass-card rounded-2xl border border-border overflow-hidden transition-opacity ${!leadCreated && !leadSnap ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="p-4 border-b border-border bg-gradient-to-r from-emerald-50/50 to-transparent">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                    WhatsApp Message Bhejo
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-8">Message type choose karo — real ya mock bhejega</p>
                </div>
                <div className="p-4 space-y-4">
                  {/* Message Type Selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MSG_TYPES.map(mt => (
                      <button key={mt.id} onClick={() => setMsgType(mt.id)}
                        className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${msgType === mt.id ? "bg-primary/5 border-primary text-primary" : "border-border hover:bg-muted/50 text-foreground"}`}>
                        <div className="flex items-center gap-1.5">
                          <mt.icon className={`w-3.5 h-3.5 ${msgType === mt.id ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="text-xs font-semibold">{mt.label}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground leading-tight">{mt.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Follow-up day picker */}
                  {msgType === "followup" && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">Day:</span>
                      <div className="flex gap-2">
                        {[0, 1, 2, 3, 4, 5].map(d => (
                          <button key={d} onClick={() => setDayIndex(d)}
                            className={`w-9 h-9 rounded-xl text-sm font-semibold border transition-all ${dayIndex === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                            D{d}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom text */}
                  {msgType === "custom" && (
                    <textarea
                      value={customText} onChange={e => setCustomText(e.target.value)}
                      placeholder="Apna custom WhatsApp message yahan likhao... (Hinglish ya English dono chalega)"
                      className="w-full px-3 py-3 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none"
                    />
                  )}

                  {/* Send Button */}
                  <button onClick={sendMessage} disabled={sending}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all">
                    {sending
                      ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
                      : <><Send className="w-4 h-4" /> {selectedTester.name} ko {MSG_TYPES.find(m => m.id === msgType)?.label} Bhejo</>
                    }
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Message Log ──────────────────────────────────── */}
      <motion.div variants={staggerItem} className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" /> Message Log
            {log.length > 0 && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{log.length}</Badge>}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={fetchLog} disabled={logLoading}
              className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50">
              <RefreshCw className={`w-3 h-3 ${logLoading ? "animate-spin" : ""}`} /> Refresh
            </button>
            {log.length > 0 && (
              <button onClick={clearLog}
                className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {log.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Koi message abhi tak nahi bheja<br />
            <span className="text-xs">Upar se message bhejo — sab yahan dikhega</span>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {log.map(entry => {
              const sc = STATUS_ICON[entry.status] || STATUS_ICON.mock_sent;
              const isOpen = expandedLog === entry.id;
              return (
                <div key={entry.id} className={`${sc.bg} transition-colors`}>
                  <div className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer"
                    onClick={() => setExpandedLog(isOpen ? null : entry.id)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <sc.icon className={`w-4 h-4 shrink-0 ${sc.color}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground flex items-center gap-2 flex-wrap">
                          {entry.label}
                          <span className="text-muted-foreground font-normal">→</span>
                          <span className="text-primary">{entry.leadName}</span>
                          <span className="text-xs text-muted-foreground font-normal">(+{entry.phone})</span>
                        </p>
                        <p className={`text-xs font-medium ${sc.color}`}>{sc.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/40">
                        <div className="px-4 py-3 space-y-1.5">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                            <span><span className="text-muted-foreground">Type:</span> <strong>{entry.messageType}</strong></span>
                            <span><span className="text-muted-foreground">Status:</span> <strong>{entry.status}</strong></span>
                            <span><span className="text-muted-foreground">Mock:</span> <strong>{entry.mock ? "Yes" : "No"}</strong></span>
                            <span><span className="text-muted-foreground">Blocked:</span> <strong>{entry.blocked ? `Yes (${entry.blockedReason})` : "No"}</strong></span>
                            {entry.waMessageId && <span className="col-span-2"><span className="text-muted-foreground">WA Message ID:</span> <strong className="font-mono">{entry.waMessageId}</strong></span>}
                            {entry.error && <span className="col-span-2 text-red-600"><span className="text-muted-foreground">Error:</span> <strong>{entry.error}</strong></span>}
                            <span><span className="text-muted-foreground">Sent at:</span> <strong>{new Date(entry.timestamp).toLocaleString("en-IN")}</strong></span>
                          </div>
                          {entry.status === "real_sent" && (
                            <div className="mt-2 p-2.5 bg-emerald-100 rounded-xl text-xs text-emerald-800">
                              ✅ Real WhatsApp message gaya! Check karo <strong>{entry.leadName}</strong> ka WhatsApp ({entry.phone}) — message mila?
                            </div>
                          )}
                          {entry.status === "mock_sent" && (
                            <div className="mt-2 p-2.5 bg-amber-100 rounded-xl text-xs text-amber-800">
                              🟡 Mock mode — server console mein log dekho. Real message ke liye <strong>WHATSAPP_ACCESS_TOKEN</strong> set karo.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
