/**
 * Admin Health Widget — Real-time app status for admin's phone
 * Auto-refreshes every 30s, color-coded, one-tap share
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Server, MessageSquare, Brain, Bell, Database,
  Clock, Share2, Trash2, Shield, Zap, Layers,
} from "lucide-react";

interface HealthCheck {
  id: string;
  label: string;
  status: "ok" | "warn" | "error";
  detail: string;
}

interface ErrorLog {
  id: string;
  source: string;
  message: string;
  timestamp: string;
}

interface HealthData {
  overall: "ok" | "error";
  checks: HealthCheck[];
  recentErrors: ErrorLog[];
  memory: { used: number; total: number };
  uptime: number;
  timestamp: string;
  version: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  server:      Server,
  whatsapp:    MessageSquare,
  ai:          Brain,
  fcm:         Bell,
  openrouter:  Layers,
  admintoken:  Shield,
  db:          Database,
  queue:       Zap,
  errors:      AlertTriangle,
};

function StatusDot({ status }: { status: "ok" | "warn" | "error" }) {
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 mt-0.5
      ${status === "ok" ? "bg-emerald-500" : status === "warn" ? "bg-amber-400" : "bg-red-500"}`} />
  );
}

function StatusIcon({ status }: { status: "ok" | "warn" | "error" }) {
  if (status === "ok")   return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
  if (status === "warn") return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
  return <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
}

function formatUptime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem("sai_admin_token") || "";
      const res = await fetch("/api/admin/health", {
        headers: { "x-admin-token": token },
      });
      if (res.status === 401) throw new Error("Admin token missing — Login karein aur dobara try karein");
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      setData(json);
      setLastFetch(new Date());
      setCountdown(30);
    } catch (e: any) {
      setError(e.message || "Health check fail hua");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 30)), 1000);
    return () => clearInterval(t);
  }, [lastFetch]);

  const handleShare = () => {
    if (!data) return;
    const lines = [
      `SAI RoloTech CRM v${data.version} — Health Report`,
      `Time: ${new Date(data.timestamp).toLocaleString("en-IN")}`,
      `Overall: ${data.overall === "ok" ? "✅ All Systems OK" : "❌ Issues Detected"}`,
      "",
      ...data.checks.map(c =>
        `${c.status === "ok" ? "✅" : c.status === "warn" ? "⚠️" : "❌"} ${c.label}: ${c.detail}`
      ),
      "",
      `Memory: ${data.memory.used}MB / ${data.memory.total}MB`,
      `Uptime: ${formatUptime(data.uptime)}`,
      data.recentErrors.length > 0 ? `\nRecent Errors:\n${data.recentErrors.map(e => `• [${e.source}] ${e.message}`).join("\n")}` : "",
    ].join("\n");

    if (navigator.share) {
      navigator.share({ title: "CRM Health Report", text: lines }).catch(() => {});
    } else {
      navigator.clipboard.writeText(lines).then(() => alert("Report copied to clipboard!")).catch(() => {});
    }
  };

  const handleClearErrors = async () => {
    if (!window.confirm("Saare error logs clear kar dein?")) return;
    setClearing(true);
    try {
      const token = sessionStorage.getItem("sai_admin_token") || "";
      await fetch("/api/admin/logs", { method: "DELETE", headers: { "x-admin-token": token } });
      setCleared(true);
      setTimeout(() => { setCleared(false); fetchHealth(); }, 1500);
    } catch (_) {}
    setClearing(false);
  };

  const overallOk = data?.overall === "ok";

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className={`sticky top-0 z-20 px-4 pt-4 pb-3
        ${overallOk ? "bg-emerald-50 border-b border-emerald-200" : "bg-red-50 border-b border-red-200"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <Server className="w-4 h-4" />
              App Health Status
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lastFetch ? `Updated: ${lastFetch.toLocaleTimeString("en-IN")} · Refresh in ${countdown}s` : "Loading..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-white border border-border text-muted-foreground"
              title="Share report"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="p-2 rounded-xl bg-white border border-border text-primary"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Overall badge */}
        {data && (
          <div className={`mt-2 px-3 py-1.5 rounded-xl text-xs font-bold text-center
            ${overallOk ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
            {overallOk ? "✅ All Systems Operational" : "❌ Issues Detected — Attention Needed"}
          </div>
        )}
      </div>

      <div className="px-4 mt-4 space-y-3">

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-700">Health check fail hua</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
            <button onClick={fetchHealth} className="mt-3 px-4 py-1.5 bg-red-500 text-white text-xs rounded-lg">
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !data && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* Stats row */}
        {data && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Uptime", value: formatUptime(data.uptime), color: "text-emerald-600" },
              { label: "Memory", value: `${data.memory.used}MB`, color: "text-blue-600" },
              { label: "Errors", value: `${data.recentErrors.length > 0 ? data.recentErrors.length : 0} recent`, color: data.recentErrors.length > 0 ? "text-red-500" : "text-emerald-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card rounded-xl p-3 text-center">
                <p className={`text-sm font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Service checks */}
        {data && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
              <p className="text-sm font-semibold text-foreground">Service Status</p>
            </div>
            <div className="divide-y divide-border/30">
              {data.checks.map((check, i) => {
                const Icon = ICON_MAP[check.id] || Server;
                return (
                  <motion.div
                    key={check.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-start gap-3 px-4 py-3
                      ${check.status === "error" ? "bg-red-50/60" : check.status === "warn" ? "bg-amber-50/40" : ""}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5
                      ${check.status === "ok" ? "text-emerald-500" : check.status === "warn" ? "text-amber-500" : "text-red-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-foreground">{check.label}</p>
                        <StatusDot status={check.status} />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{check.detail}</p>
                    </div>
                    <StatusIcon status={check.status} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Errors */}
        {data && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Recent Errors
                {data.recentErrors.length > 0 && (
                  <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {data.recentErrors.length}
                  </span>
                )}
              </p>
              {data.recentErrors.length > 0 && (
                <button
                  onClick={handleClearErrors}
                  disabled={clearing}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground px-2 py-1 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  {cleared ? "✅ Cleared!" : <><Trash2 className="w-3 h-3" /> Clear</>}
                </button>
              )}
            </div>

            {data.recentErrors.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Koi errors nahi — sab theek hai!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {data.recentErrors.map((err) => (
                  <div key={err.id} className="px-4 py-3 bg-red-50/40">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-mono font-bold">
                        {err.source}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(err.timestamp).toLocaleTimeString("en-IN")}
                      </span>
                    </div>
                    <p className="text-[11px] text-red-700 leading-snug">{err.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {data && (
          <p className="text-center text-[10px] text-muted-foreground pt-1">
            SAI RoloTech CRM v{data.version} · Auto-refresh: 30s
          </p>
        )}

      </div>
    </div>
  );
}
