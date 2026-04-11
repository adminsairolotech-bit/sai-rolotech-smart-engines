import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, SectionCard } from "@/components/shared";
import {
  Settings, Key, Bell, Zap, Globe, Shield, Save, Lock, Eye, EyeOff,
  LogIn, LogOut, UserCheck, AlertTriangle, Clock, CheckCircle2, Trash2,
  RefreshCw, ShieldCheck, Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { ActivityEntry } from "@/contexts/AuthContext";

/* ── Password strength ─────────────────────────────────────── */
function pwScore(pw: string): { score: number; label: string; color: string; checks: boolean[] } {
  const checks = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[0-9]/.test(pw),
    /[^a-zA-Z0-9]/.test(pw),
  ];
  const score = checks.filter(Boolean).length;
  const map = [
    { label: "", color: "bg-gray-200" },
    { label: "Kamzor", color: "bg-red-500" },
    { label: "Theek Hai", color: "bg-amber-500" },
    { label: "Acha", color: "bg-blue-500" },
    { label: "Mazboot", color: "bg-emerald-500" },
  ];
  return { score, ...map[score], checks };
}

const NOTIF_SETTINGS = [
  { name: "New Lead Alerts",   description: "Notify when a new lead registers",         enabled: true  },
  { name: "High-Intent Alerts",description: "Alert when AI detects high buyer intent",  enabled: true  },
  { name: "Demo Reminders",    description: "Send reminders before scheduled demos",    enabled: true  },
  { name: "Quotation Updates", description: "Notify when quotation status changes",     enabled: false },
  { name: "Weekly Summary",    description: "Send weekly performance summary email",    enabled: false },
];

const FEATURE_TOGGLES = [
  { id: "ai_quotation",    name: "AI Quotation Generation", description: "Auto-generate quotations from lead conversations",     enabled: true  },
  { id: "ai_buddy",        name: "Buddy AI Chat",           description: "AI-powered chat assistant for customers",              enabled: true  },
  { id: "lead_intelligence",name:"Lead Intelligence",       description: "AI analysis of buyer intent from conversations",       enabled: true  },
  { id: "push_notifications",name:"Push Notifications",     description: "Send push notifications to mobile users",              enabled: false },
  { id: "auto_followup",   name: "Auto Follow-up",          description: "Automated follow-up messages via WhatsApp/Email",      enabled: false },
];

const API_KEYS = [
  { name: "Gemini API Key",     env: "AI_INTEGRATIONS_GEMINI_API_KEY", masked: "AIza•••••••••••••••", status: "active"  },
  { name: "Firebase Project ID",env: "VITE_FIREBASE_PROJECT_ID",       masked: "sai-rolo•••••tech",   status: "active"  },
  { name: "Admin API Token",    env: "ADMIN_API_TOKEN",                 masked: "sai-•••••••••••••",   status: "active"  },
  { name: "ElevenLabs API Key", env: "ELEVENLABS_API_KEY",             masked: "Not configured",       status: "missing" },
];

/* ── Activity event icons ──────────────────────────────────── */
function ActivityIcon({ event }: { event: ActivityEntry["event"] }) {
  const map: Record<ActivityEntry["event"], { icon: typeof LogIn; color: string }> = {
    login:            { icon: LogIn,       color: "text-emerald-600 bg-emerald-50" },
    logout:           { icon: LogOut,      color: "text-slate-500 bg-slate-50" },
    register:         { icon: UserCheck,   color: "text-blue-600 bg-blue-50" },
    password_changed: { icon: Lock,        color: "text-purple-600 bg-purple-50" },
    login_failed:     { icon: AlertTriangle,color:"text-red-600 bg-red-50" },
    account_locked:   { icon: Shield,      color: "text-red-700 bg-red-100" },
    session_expired:  { icon: Clock,       color: "text-amber-600 bg-amber-50" },
  };
  const { icon: Icon, color } = map[event] || { icon: Activity, color: "text-gray-500 bg-gray-50" };
  return <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}><Icon className="w-3.5 h-3.5" /></span>;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60)     return "Abhi";
  if (diff < 3600)   return `${Math.floor(diff / 60)} min pehle`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} ghante pehle`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} din pehle`;
  return d.toLocaleDateString("hi-IN");
}

function eventLabel(event: ActivityEntry["event"]): string {
  const map: Record<ActivityEntry["event"], string> = {
    login:            "Login",
    logout:           "Logout",
    register:         "New Account",
    password_changed: "Password Badla",
    login_failed:     "Login Failed",
    account_locked:   "Account Lock",
    session_expired:  "Session Expired",
  };
  return map[event] || event;
}

export default function SettingsPage() {
  const { user, lastLoginAt, changePassword, getActivityLog, clearActivityLog, sessionExpiresAt } = useAuth();

  const [toggles, setToggles]   = useState(FEATURE_TOGGLES);
  const [notifs, setNotifs]     = useState(NOTIF_SETTINGS);
  const [actLog, setActLog]     = useState<ActivityEntry[]>(() => getActivityLog());

  /* Change password state */
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showCur, setShowCur]       = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const strength = pwScore(newPw);
  const pwReqs = [
    { label: "8+ characters", ok: newPw.length >= 8 },
    { label: "Ek capital letter", ok: /[A-Z]/.test(newPw) },
    { label: "Ek number", ok: /[0-9]/.test(newPw) },
    { label: "Ek symbol (!@#...)", ok: /[^a-zA-Z0-9]/.test(newPw) },
  ];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) {
      toast({ title: "Sabhi fields bharen", variant: "destructive" }); return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Naya password match nahi kiya", variant: "destructive" }); return;
    }
    if (newPw.length < 8) {
      toast({ title: "Password 8 characters se chhota hai", variant: "destructive" }); return;
    }
    setChangingPw(true);
    const result = await changePassword(currentPw, newPw);
    setChangingPw(false);
    if (result.success) {
      toast({ title: "Password badal gaya! ✅", description: "Dobara login karte waqt naya password use karein." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setActLog(getActivityLog());
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleDeleteAccountRequest = async () => {
    if (!user?.id && !user?.email) {
      toast({ title: "Account info missing", description: "Delete request bhejne ke liye login session chahiye.", variant: "destructive" });
      return;
    }
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/account-deletion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "",
          email: user?.email || "",
          name: user?.name || "",
          source: "web_settings",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Delete request submit nahi ho saki");
      }
      toast({
        title: "Deletion request recorded",
        description: "Aapki request system me save ho gayi hai. Support/admin team isko process karegi.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete request fail ho gayi";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setDeletingAccount(false);
    }
  };

  const sessionExpiry = sessionExpiresAt ? new Date(sessionExpiresAt).toLocaleDateString("hi-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader title="Settings" subtitle="System configuration, security & account management" />

      {/* ── Account Security ─────────────────────────────────── */}
      <SectionCard title="Account Security" headerAction={<ShieldCheck className="w-4 h-4 text-blue-600" />}>
        <div className="space-y-5">
          {/* Session info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Last Login", value: lastLoginAt ? fmtTime(lastLoginAt) : "—", icon: LogIn, color: "text-emerald-600" },
              { label: "Session Expires", value: sessionExpiry, icon: Clock, color: "text-blue-600" },
              { label: "Account", value: user?.userType || "—", icon: UserCheck, color: "text-purple-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Change Password */}
          <div className="border border-slate-200 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" /> Password Badlein
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              {/* Current password */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCur ? "text" : "password"}
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    placeholder="Purana password"
                    autoComplete="current-password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button type="button" onClick={() => setShowCur(!showCur)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Naya Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="8+ characters ka password"
                    autoComplete="new-password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength bar */}
                {newPw && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1.5">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : "bg-slate-200"}`} />
                      ))}
                      <span className="text-[10px] text-slate-500 ml-1">{strength.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {pwReqs.map(req => (
                        <div key={req.label} className="flex items-center gap-1">
                          <CheckCircle2 className={`w-3 h-3 ${req.ok ? "text-emerald-500" : "text-slate-300"}`} />
                          <span className={`text-[10px] ${req.ok ? "text-emerald-700" : "text-slate-400"}`}>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Naya password dobara likhein"
                    autoComplete="new-password"
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 transition-all
                      ${confirmPw && newPw === confirmPw ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20" : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"} text-slate-800`}
                  />
                  {confirmPw && newPw === confirmPw && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPw}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
              >
                {changingPw ? <><RefreshCw className="w-4 h-4 animate-spin" /> Badal raha hai...</> : <><Lock className="w-4 h-4" /> Password Badlein</>}
              </button>
            </form>
          </div>

          {/* Security tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
            <p className="font-bold text-blue-800 mb-1">🔒 Security Tips</p>
            <p>• Har 90 din mein password badlein</p>
            <p>• Shared computer pe hamesha logout karein</p>
            <p>• 30 min idle pe auto-logout active hai</p>
            <p>• Password kisi ko share mat karein</p>
          </div>
        </div>
      </SectionCard>

      {/* ── Activity Log ────────────────────────────────────────── */}
      <SectionCard
        title="Activity Log"
        headerAction={
          <button
            onClick={() => { clearActivityLog(); setActLog([]); toast({ title: "Log clear ho gaya" }); }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        }
      >
        {actLog.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Koi activity nahi mili</p>
            <p className="text-xs mt-1">Login ya koi action karo toh yahan dikhega</p>
          </div>
        ) : (
          <div className="space-y-2">
            {actLog.slice(0, 20).map((entry) => (
              <motion.div key={entry.id} variants={staggerItem} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <ActivityIcon event={entry.event} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{eventLabel(entry.event)}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">{fmtTime(entry.ts)}</span>
                  </div>
                  {entry.detail && <p className="text-xs text-slate-500 mt-0.5 truncate">{entry.detail}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── API Keys ─────────────────────────────────────────────── */}
      <SectionCard title="API Keys & Integrations" headerAction={<Key className="w-4 h-4 text-muted-foreground" />}>
        <div className="space-y-2">
          {API_KEYS.map((key) => (
            <motion.div key={key.name} variants={staggerItem} className="flex items-center justify-between p-3 rounded-xl border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{key.name}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{key.masked}</p>
              </div>
              <Badge className={key.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}>
                {key.status === "active" ? "Active" : "Missing"}
              </Badge>
            </motion.div>
          ))}
        </div>
      </SectionCard>

      {/* ── Notifications ─────────────────────────────────────────── */}
      <SectionCard title="Notification Settings" headerAction={<Bell className="w-4 h-4 text-muted-foreground" />}>
        <div className="space-y-2">
          {notifs.map((notif) => (
            <motion.div key={notif.name} variants={staggerItem} className="flex items-center justify-between p-3 rounded-xl border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{notif.name}</p>
                <p className="text-xs text-muted-foreground">{notif.description}</p>
              </div>
              <button
                onClick={() => setNotifs(prev => prev.map(n => n.name === notif.name ? { ...n, enabled: !n.enabled } : n))}
                className={`relative w-11 h-6 rounded-full transition-colors ${notif.enabled ? "bg-primary" : "bg-muted"}`}
                aria-label={`Toggle ${notif.name}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notif.enabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </motion.div>
          ))}
        </div>
      </SectionCard>

      {/* ── Feature Toggles ──────────────────────────────────────── */}
      <SectionCard title="Feature Toggles" headerAction={<Zap className="w-4 h-4 text-muted-foreground" />}>
        <div className="space-y-2">
          {toggles.map((toggle) => (
            <motion.div key={toggle.id} variants={staggerItem} className="flex items-center justify-between p-3 rounded-xl border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{toggle.name}</p>
                <p className="text-xs text-muted-foreground">{toggle.description}</p>
              </div>
              <button
                onClick={() => setToggles(prev => prev.map(t => t.id === toggle.id ? { ...t, enabled: !t.enabled } : t))}
                className={`relative w-11 h-6 rounded-full transition-colors ${toggle.enabled ? "bg-primary" : "bg-muted"}`}
                aria-label={`Toggle ${toggle.name}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${toggle.enabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </motion.div>
          ))}
        </div>
      </SectionCard>

      {/* ── General ─────────────────────────────────────────────── */}
      <SectionCard title="General" headerAction={<Globe className="w-4 h-4 text-muted-foreground" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Company Name", type: "text", value: "Sai Rolotech" },
            { label: "Support Email", type: "email", value: "support@sairolotech.com" },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
              <input type={f.type} defaultValue={f.value}
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          ))}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default Currency</label>
            <select defaultValue="INR" className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground">
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Max API Calls/Day</label>
            <input type="number" defaultValue={1000}
              className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
        </div>
        <div className="mt-4">
          <Button className="gap-2" onClick={() => toast({ title: "Settings saved ✅" })}>
            <Save className="w-4 h-4" /> Save Settings
          </Button>
        </div>
      </SectionCard>

      {/* ── Delete Account (Store Compliance) ─────────────────── */}
      <SectionCard title="Account Delete Karein" headerAction={<Trash2 className="w-4 h-4 text-red-500" />}>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-800 mb-1">Permanent Action</h4>
              <p className="text-xs text-red-600 leading-relaxed mb-3">
                Account delete karne se aapka saara data — leads, quotations, settings, activity history — permanently remove ho jayega. Ye action undo nahi hoga.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (window.confirm("Kya aap sure hain? Aapka deletion request admin queue me chala jayega.")) {
                    void handleDeleteAccountRequest();
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5" /> {deletingAccount ? "Request bhej rahe hain..." : "Account Delete Karein"}
              </Button>
              <p className="text-[10px] text-red-400 mt-2">
                Request ab direct system me log hoti hai. Admin/support team isko manually verify karke process karegi.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );
}
