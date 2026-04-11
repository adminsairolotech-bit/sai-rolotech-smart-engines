import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, SectionCard } from "@/components/shared";
import {
  Brain, Bot, MessageSquare, Bell, Zap, RefreshCw, Shield, Activity,
  AlertTriangle, CheckCircle2, XCircle, Wifi, WifiOff, Trash2, FlaskConical,
  RotateCcw, Eye, EyeOff, ChevronDown, ChevronUp, Settings2, TrendingUp, Clock,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SysConfig {
  aiEnabled: boolean;
  aiModel: string;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
  followupEnabled: boolean;
  maintenanceMode: boolean;
  dailyMessageLimit: number;
  alertOnError: boolean;
}

interface SysStats {
  aiCalls: number;
  aiErrors: number;
  whatsappSent: number;
  whatsappFailed: number;
  pushSent: number;
  totalLeads: number;
  followupsSent: number;
  uptimeSeconds: number;
  errorCount: number;
}

interface ErrorLog {
  id: number;
  ts: string;
  source: string;
  message: string;
  details: string | null;
}

interface AdminData {
  stats: SysStats;
  config: SysConfig;
  env: Record<string, boolean>;
  uptime: number;
  timestamp: string;
}

const MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash ⚡ (Fastest · Recommended)" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro 🧠 (Most Capable)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Previous Gen)" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Legacy)" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Legacy)" },
  { value: "mistral-7b", label: "Mistral 7B via OpenRouter" },
];

// ─── Token Gate ───────────────────────────────────────────────────────────────
function TokenGate({ onVerified }: { onVerified: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function verify() {
    if (!token.trim()) { setError("Token required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      if (res.ok) {
        sessionStorage.setItem("sai_admin_token", token.trim());
        onVerified(token.trim());
      } else {
        const d = await res.json();
        setError(d.error || "Invalid token");
      }
    } catch {
      setError("Server se connect nahi ho paya");
    }
    setLoading(false);
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-sm mx-auto mt-16">
      <motion.div variants={staggerItem} className="glass-card rounded-2xl p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Control Panel Access</h2>
          <p className="text-xs text-muted-foreground mt-1">ADMIN_API_TOKEN enter karein</p>
        </div>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={token}
            onChange={e => { setToken(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && verify()}
            placeholder="Admin token..."
            className={`w-full px-4 py-3 pr-10 rounded-xl border text-sm bg-background
              ${error ? "border-red-400 focus:ring-red-300" : "border-border focus:ring-primary/30"}
              focus:outline-none focus:ring-2 transition`}
          />
          <button onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button onClick={verify} disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm
            hover:opacity-90 disabled:opacity-50 transition active:scale-95 flex items-center justify-center gap-2">
          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          {loading ? "Verify ho raha hai..." : "Access Karein"}
        </button>
        <p className="text-[10px] text-muted-foreground">ADMIN_API_TOKEN environment variable se match hona chahiye</p>
      </motion.div>
    </motion.div>
  );
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled = false, color = "bg-primary" }: {
  checked: boolean; onChange: () => void; disabled?: boolean; color?: string;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-40
        ${checked ? color : "bg-slate-200"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-0.5"}`} />
    </button>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className={`glass-card rounded-xl p-4 flex items-center gap-3 border-l-4 ${color}`}>
      <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Format uptime ─────────────────────────────────────────────────────────
function fmtUptime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ─── Main Panel ────────────────────────────────────────────────────────────
export default function AIControlCenterPage() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem("sai_admin_token"));
  const [data, setData] = useState<AdminData | null>(null);
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [config, setConfig] = useState<SysConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showReset, setShowReset] = useState(false);

  const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

  const flash = (type: "ok" | "err", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch("/api/admin/stats", { headers: authHeaders }),
        fetch("/api/admin/logs?limit=50", { headers: authHeaders }),
      ]);
      if (statsRes.status === 401) { sessionStorage.removeItem("sai_admin_token"); setToken(null); return; }
      if (statsRes.ok) {
        const d = await statsRes.json();
        setData(d);
        setConfig(d.config);
      }
      if (logsRes.ok) {
        const l = await logsRes.json();
        setLogs(l.logs || []);
      }
    } catch (e) {
      flash("err", "Stats load nahi hue");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function patchConfig(updates: Partial<SysConfig>) {
    if (!config) return;
    const next = { ...config, ...updates };
    setConfig(next); // optimistic
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) flash("ok", "Config saved ✓");
      else flash("err", "Save nahi hua");
    } catch { flash("err", "Network error"); }
    setSaving(false);
  }

  async function resetConfig() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config/reset", { method: "POST", headers: authHeaders });
      if (res.ok) {
        const d = await res.json();
        setConfig(d);
        flash("ok", "Config reset to defaults ✓");
        setShowReset(false);
      }
    } catch { flash("err", "Reset nahi hua"); }
    setSaving(false);
  }

  async function clearLogs() {
    try {
      await fetch("/api/admin/logs", { method: "DELETE", headers: authHeaders });
      setLogs([]);
      flash("ok", "Logs cleared ✓");
    } catch { flash("err", "Clear nahi hua"); }
  }

  async function testLog() {
    try {
      await fetch("/api/admin/logs/test", { method: "POST", headers: authHeaders });
      fetchAll();
      flash("ok", "Test log entry added ✓");
    } catch { flash("err", "Test nahi hua"); }
  }

  if (!token) return <TokenGate onVerified={t => setToken(t)} />;

  const s = data?.stats;
  const env = data?.env;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">

      {/* Header */}
      <PageHeader
        title="Control Panel"
        subtitle="System control, monitoring, aur fail-safe — ek jagah"
        action={
          <button onClick={fetchAll} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refresh..." : "Refresh"}
          </button>
        }
      />

      {/* Status toast */}
      {statusMsg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm
            ${statusMsg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {statusMsg.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {statusMsg.text}
        </motion.div>
      )}

      {/* ── Live Stats ─────────────────────────────────────────────────────── */}
      <motion.div variants={staggerItem}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> Live Stats
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Leads" value={s?.totalLeads ?? "—"} icon={TrendingUp} color="border-blue-400" />
          <StatCard label="AI Calls" value={s?.aiCalls ?? "—"} icon={Brain} color="border-purple-400" />
          <StatCard label="WA Sent (Total)" value={s?.whatsappSent ?? "—"} icon={MessageSquare} color="border-emerald-400" />
          <StatCard label="Errors in Log" value={s?.errorCount ?? "—"} icon={AlertTriangle} color="border-red-400" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <StatCard label="WA Today" value={`${s?.messagesToday ?? 0} / ${data?.config?.dailyMessageLimit ?? 100}`} icon={MessageSquare} color="border-teal-400" />
          <StatCard label="WA Failed" value={s?.whatsappFailed ?? "—"} icon={XCircle} color="border-amber-400" />
          <StatCard label="AI Errors" value={s?.aiErrors ?? "—"} icon={AlertTriangle} color="border-orange-400" />
          <StatCard label="Uptime" value={s ? fmtUptime(s.uptimeSeconds) : "—"} icon={Clock} color="border-slate-400" />
        </div>
      </motion.div>

      {/* ── Service Health ─────────────────────────────────────────────────── */}
      <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-primary" /> Service Health
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { key: "gemini", label: "Gemini AI", icon: Brain },
            { key: "openrouter", label: "OpenRouter", icon: Zap },
            { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
            { key: "fcm", label: "Push (FCM)", icon: Bell },
            { key: "adminToken", label: "Admin Token", icon: Shield },
          ].map(({ key, label, icon: Icon }) => {
            const ok = env?.[key];
            return (
              <div key={key} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center
                ${ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                <Icon className={`w-4 h-4 ${ok ? "text-emerald-600" : "text-red-500"}`} />
                <p className="text-[11px] font-medium text-foreground">{label}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                  ${ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                  {ok ? "✓ Ready" : "⚠ Not Set"}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Feature Toggles ────────────────────────────────────────────────── */}
      {config && (
        <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" /> Feature Controls
            </h3>
            {saving && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}
          </div>

          {/* Maintenance Mode — danger toggle */}
          <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors
            ${config.maintenanceMode ? "bg-red-50 border-red-300" : "border-border bg-background"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.maintenanceMode ? "bg-red-100" : "bg-muted"}`}>
                <AlertTriangle className={`w-4 h-4 ${config.maintenanceMode ? "text-red-600" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Maintenance Mode</p>
                <p className="text-[11px] text-muted-foreground">ON karne se saari services band ho jaati hain</p>
              </div>
            </div>
            <Toggle
              checked={config.maintenanceMode}
              onChange={() => patchConfig({ maintenanceMode: !config.maintenanceMode })}
              color="bg-red-500"
            />
          </div>

          {/* AI, WhatsApp, Push, Follow-up toggles */}
          {[
            { key: "aiEnabled" as const, label: "AI Responses", desc: "Gemini/OpenRouter auto-replies", icon: Brain, color: "bg-primary" },
            { key: "whatsappEnabled" as const, label: "WhatsApp Messaging", desc: "Lead notification messages", icon: MessageSquare, color: "bg-emerald-500" },
            { key: "pushEnabled" as const, label: "Push Notifications", desc: "FCM mobile notifications", icon: Bell, color: "bg-amber-500" },
            { key: "followupEnabled" as const, label: "Auto Follow-ups", desc: "4-month follow-up engine", icon: Zap, color: "bg-purple-500" },
            { key: "alertOnError" as const, label: "Error Alerts", desc: "Admin WhatsApp alert on error", icon: AlertTriangle, color: "bg-orange-500" },
          ].map(({ key, label, desc, icon: Icon, color }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config[key] ? `${color}/10` : "bg-muted"}`}>
                  <Icon className={`w-4 h-4 ${config[key] ? color.replace("bg-", "text-") : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </div>
              <Toggle
                checked={config[key] as boolean}
                onChange={() => patchConfig({ [key]: !config[key] })}
                disabled={config.maintenanceMode && key !== "maintenanceMode"}
                color={color}
              />
            </div>
          ))}
        </motion.div>
      )}

      {/* ── AI Config ─────────────────────────────────────────────────────── */}
      {config && (
        <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" /> AI Configuration
          </h3>

          {/* Model selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">AI Model</label>
            <select
              value={config.aiModel}
              onChange={e => patchConfig({ aiModel: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Daily limit */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Daily Message Limit — <span className="text-primary font-semibold">{config.dailyMessageLimit}</span> messages
            </label>
            <input
              type="range" min={10} max={500} step={10}
              value={config.dailyMessageLimit}
              onChange={e => setConfig(c => c ? { ...c, dailyMessageLimit: +e.target.value } : c)}
              onMouseUp={e => patchConfig({ dailyMessageLimit: +(e.target as HTMLInputElement).value })}
              onTouchEnd={e => patchConfig({ dailyMessageLimit: +(e.target as HTMLInputElement).value })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>10</span><span>250</span><span>500</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Error Logs ─────────────────────────────────────────────────────── */}
      <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setLogsOpen(o => !o)}
            className="text-sm font-semibold text-foreground flex items-center gap-2 hover:text-primary transition-colors">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Error Logs
            <span className="ml-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{logs.length}</span>
            {logsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <div className="flex gap-2">
            <button onClick={testLog}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition text-muted-foreground">
              <FlaskConical className="w-3 h-3" /> Test
            </button>
            <button onClick={clearLogs} disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-40">
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>

        {logsOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-700" />
                <p className="text-sm">Koi errors nahi — system healthy hai!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {logs.map(log => (
                  <div key={log.id} className="flex gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-foreground">{log.source}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(log.ts).toLocaleString("en-IN")}</span>
                      </div>
                      <p className="text-xs text-foreground">{log.message}</p>
                      {log.details && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{log.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
        {!logsOpen && logs.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">Click to expand and view {logs.length} log entries</p>
        )}
      </motion.div>

      {/* ── Danger Zone ────────────────────────────────────────────────────── */}
      <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5 border-red-200 border">
        <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Danger Zone
        </h3>
        {!showReset ? (
          <button onClick={() => setShowReset(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-300 text-red-600 text-sm hover:bg-red-50 transition">
            <RotateCcw className="w-4 h-4" /> Config Reset karo (Defaults)
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm text-red-700 font-medium">⚠️ Ye sabhi settings ko default par reset kar dega. Confirm karo?</p>
            <div className="flex gap-2">
              <button onClick={resetConfig} disabled={saving}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50">
                {saving ? "Resetting..." : "Haan, Reset Karo"}
              </button>
              <button onClick={() => setShowReset(false)}
                className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted transition">
                Cancel
              </button>
            </div>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground mt-3">
          Session se logout hone ke liye browser tab band karein. Token sessionStorage mein stored hai.
        </p>
      </motion.div>

    </motion.div>
  );
}
