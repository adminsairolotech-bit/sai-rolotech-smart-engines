import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader } from "@/components/shared";
import {
  Target, MapPin, TrendingUp, TrendingDown, Zap, Users,
  Star, AlertTriangle, CheckCircle2, BarChart3, ArrowRight,
  RefreshCw, Flame, Globe,
} from "lucide-react";

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_SOURCES = [
  { source: "indiamart", total: 100, hot: 28, veryHot: 8, converted: 8, revenue: 520000, meetings: 12, hotRate: 28, conversionRate: 8 },
  { source: "app_direct", total: 60, hot: 25, veryHot: 12, converted: 12, revenue: 640000, meetings: 18, hotRate: 42, conversionRate: 20 },
  { source: "justdial", total: 80, hot: 10, veryHot: 2, converted: 2, revenue: 105000, meetings: 4, hotRate: 13, conversionRate: 3 },
  { source: "pabbly", total: 45, hot: 8, veryHot: 3, converted: 3, revenue: 210000, meetings: 5, hotRate: 18, conversionRate: 7 },
  { source: "direct", total: 30, hot: 12, veryHot: 5, converted: 5, revenue: 290000, meetings: 8, hotRate: 40, conversionRate: 17 },
];

const DEMO_LOCATIONS: Record<string, { total: number; hot: number; meetings: number }> = {
  HIGH:    { total: 85,  hot: 38, meetings: 22 },
  MEDIUM:  { total: 120, hot: 30, meetings: 8  },
  LOW:     { total: 75,  hot: 10, meetings: 2  },
  UNKNOWN: { total: 35,  hot: 5,  meetings: 1  },
};

const DEMO_PRIORITY_LEADS = [
  { name: "Rajesh Kumar", phone: "98998XXXXX", score: "VERY_HOT", locationPriority: "HIGH", city: "Delhi", state: "Delhi", source: "indiamart", meetingBooked: true, features: ["quotation"] },
  { name: "Amit Sharma", phone: "87654XXXXX", score: "VERY_HOT", locationPriority: "HIGH", city: "Gurugram", state: "Haryana", source: "app_direct", meetingBooked: false, features: ["quotation", "maintenance"] },
  { name: "Vikas Singh", phone: "76543XXXXX", score: "HOT", locationPriority: "HIGH", city: "Noida", state: "Uttar Pradesh", source: "indiamart", meetingBooked: false, features: ["quotation"] },
  { name: "Sanjay Gupta", phone: "98765XXXXX", score: "HOT", locationPriority: "MEDIUM", city: "Mumbai", state: "Maharashtra", source: "justdial", meetingBooked: false, features: ["quotation"] },
  { name: "Deepak Yadav", phone: "87890XXXXX", score: "HOT", locationPriority: "HIGH", city: "Faridabad", state: "Haryana", source: "pabbly", meetingBooked: false, features: ["maintenance"] },
];

const DEMO_STATS = { total: 315, hot: 63, veryHot: 28, cold: 185, warm: 67, meetings: 33, dnd: 8, appInstalled: 142 };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtINR = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;

const SOURCE_LABELS: Record<string, string> = {
  indiamart: "IndiaMART", justdial: "Justdial", app_direct: "App Direct",
  pabbly: "Pabbly/Ads", direct: "Direct", unknown: "Unknown",
};

const SOURCE_COLORS: Record<string, string> = {
  indiamart: "bg-blue-500", app_direct: "bg-emerald-500", justdial: "bg-amber-500",
  pabbly: "bg-violet-500", direct: "bg-cyan-500", unknown: "bg-slate-400",
};

const LOC_CONFIG = {
  HIGH:    { label: "Near — Delhi/NCR/North",  color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-700", icon: "🔥", tip: "Immediate call + factory visit" },
  MEDIUM:  { label: "Medium — North India",    color: "text-blue-600",    bg: "bg-blue-50 border-blue-200",       badge: "bg-blue-100 text-blue-700",       icon: "📋", tip: "Video call + detailed quote" },
  LOW:     { label: "Far — South/Other",        color: "text-slate-500",   bg: "bg-slate-50 border-slate-200",     badge: "bg-slate-100 text-slate-600",     icon: "💬", tip: "App self-service follow-up" },
  UNKNOWN: { label: "Unknown Location",          color: "text-muted-foreground", bg: "bg-muted/30 border-muted", badge: "bg-muted text-muted-foreground",   icon: "❓", tip: "Ask for location first" },
};

const SCORE_COLORS: Record<string, string> = {
  VERY_HOT: "bg-red-500 text-white", HOT: "bg-orange-500 text-white",
  WARM: "bg-amber-400 text-white",   COLD: "bg-slate-300 text-slate-700",
};

function MiniBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

function getRecommendations(sources: typeof DEMO_SOURCES) {
  const recs: { type: "up" | "down" | "info"; title: string; desc: string }[] = [];
  const sorted = [...sources].sort((a, b) => b.conversionRate - a.conversionRate);
  const best = sorted[0];
  const worst = sources.filter(s => s.total > 20).sort((a, b) => a.conversionRate - b.conversionRate)[0];
  if (best?.conversionRate > 10) recs.push({ type: "up", title: `${SOURCE_LABELS[best.source] || best.source} — Budget Badhao`, desc: `${best.conversionRate}% conversion rate — sabse profitable source. Investment increase karo.` });
  if (worst && worst.conversionRate < 5) recs.push({ type: "down", title: `${SOURCE_LABELS[worst.source] || worst.source} — Focus Kam Karo`, desc: `Sirf ${worst.conversionRate}% conversion. Time aur budget yahan waste ho raha hai.` });
  recs.push({ type: "info", title: "Nearby Leads — Immediate Action Karo", desc: "Delhi/NCR leads mein conversion rate 3x zyada hai. HOT + NEAR leads ko pehle call karo." });
  recs.push({ type: "info", title: "Response Time = Revenue", desc: "HOT lead 4 ghante mein contact na ho to 60% chance lose hone ka. System ne alert set kar diya hai." });
  return recs;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LeadIntelligencePage() {
  const [sources, setSources] = useState(DEMO_SOURCES);
  const [locations, setLocations] = useState(DEMO_LOCATIONS);
  const [priorityLeads, setPriorityLeads] = useState(DEMO_PRIORITY_LEADS);
  const [stats, setStats] = useState(DEMO_STATS);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"source" | "location" | "leads" | "strategy">("source");

  const fetchAnalytics = async () => {
    const token = sessionStorage.getItem("sai_admin_token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lead-analytics", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          if (d.sources?.length > 0) setSources(d.sources);
          if (d.locations) setLocations(d.locations);
          if (d.priorityLeads?.length > 0) setPriorityLeads(d.priorityLeads);
          if (d.stats) setStats(d.stats);
          setIsDemo(false);
        }
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const recs = getRecommendations(sources);
  const maxTotal = Math.max(...sources.map(s => s.total), 1);
  const locTotal = Object.values(locations).reduce((s, l) => s + l.total, 0) || 1;

  const TABS = [
    { id: "source" as const, label: "Source ROI", icon: BarChart3 },
    { id: "location" as const, label: "Location Map", icon: MapPin },
    { id: "leads" as const, label: "Priority Leads", icon: Flame },
    { id: "strategy" as const, label: "Strategy", icon: Target },
  ];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">

      <PageHeader
        title="Lead Intelligence"
        subtitle="Source ROI + Location Analytics + Smart Strategy"
        actions={
          <div className="flex items-center gap-2">
            {isDemo && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">Demo Data</span>}
            <button onClick={fetchAnalytics} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        }
      />

      {/* Summary */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Leads", value: stats.total, icon: Users, color: "border-blue-400" },
          { label: "HOT Leads", value: (stats.hot || 0) + (stats.veryHot || 0), icon: Flame, color: "border-red-400" },
          { label: "Meetings", value: stats.meetings, icon: CheckCircle2, color: "border-emerald-400" },
          { label: "App Installs", value: stats.appInstalled, icon: Zap, color: "border-purple-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`glass-card rounded-xl p-4 border-l-4 ${color} flex items-center gap-3`}>
            <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={staggerItem} className="flex gap-1 bg-muted/40 p-1 rounded-xl overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 min-w-max flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all
              ${activeTab === id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </motion.div>

      {/* ── SOURCE ROI ─────────────────────────────────────────────────── */}
      {activeTab === "source" && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Source Performance — ROI Comparison
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Kaun sa source sabse zyada profitable hai — data se decide karo</p>
            <div className="space-y-4">
              {sources.map((src) => {
                const label = SOURCE_LABELS[src.source] || src.source;
                const dotColor = SOURCE_COLORS[src.source] || "bg-slate-400";
                return (
                  <div key={src.source} className="border border-border/50 rounded-xl p-4 bg-background/60">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full ${dotColor} shrink-0`} />
                        <span className="font-semibold text-sm text-foreground">{label}</span>
                        {src.conversionRate >= 15 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">⭐ Best ROI</span>}
                        {src.conversionRate < 5 && src.total > 20 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">⚠ Low ROI</span>}
                      </div>
                      <span className="text-sm font-bold text-primary">{fmtINR(src.revenue)}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center mb-3">
                      {[
                        { l: "Leads", v: src.total },
                        { l: "HOT", v: src.hot },
                        { l: "Sales", v: src.converted },
                        { l: "Conv%", v: `${src.conversionRate}%` },
                      ].map(({ l, v }) => (
                        <div key={l} className="bg-muted/40 rounded-lg py-1.5">
                          <p className="text-sm font-bold text-foreground">{v}</p>
                          <p className="text-[10px] text-muted-foreground">{l}</p>
                        </div>
                      ))}
                    </div>
                    <MiniBar value={src.total} max={maxTotal} colorClass={dotColor} />
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-4 border-l-4 border-emerald-400">
              <p className="text-xs font-semibold text-emerald-600 mb-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Best Source — Invest More</p>
              <p className="text-sm font-bold text-foreground">{SOURCE_LABELS[sources.sort((a, b) => b.conversionRate - a.conversionRate)[0]?.source]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{[...sources].sort((a, b) => b.conversionRate - a.conversionRate)[0]?.conversionRate}% conversion — budget badhao</p>
            </div>
            <div className="glass-card rounded-xl p-4 border-l-4 border-red-400">
              <p className="text-xs font-semibold text-red-500 mb-1 flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Worst Source — Reduce Focus</p>
              <p className="text-sm font-bold text-foreground">{SOURCE_LABELS[sources.filter(s => s.total > 20).sort((a, b) => a.conversionRate - b.conversionRate)[0]?.source]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sources.filter(s => s.total > 20).sort((a, b) => a.conversionRate - b.conversionRate)[0]?.conversionRate}% conversion — time waste ho raha hai</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── LOCATION MAP ────────────────────────────────────────────────── */}
      {activeTab === "location" && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Location-wise Lead Distribution
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Kahan focus karna hai — distance se smart decision lo</p>
            <div className="space-y-3">
              {(["HIGH", "MEDIUM", "LOW", "UNKNOWN"] as const).map((key) => {
                const loc = locations[key] || { total: 0, hot: 0, meetings: 0 };
                const cfg = LOC_CONFIG[key];
                const pct = Math.round((loc.total / locTotal) * 100);
                const hotPct = loc.total > 0 ? Math.round((loc.hot / loc.total) * 100) : 0;
                return (
                  <div key={key} className={`border rounded-xl p-4 ${cfg.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cfg.icon}</span>
                        <div>
                          <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
                          <p className="text-[10px] text-muted-foreground">{cfg.tip}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>{loc.total} leads</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div><p className="text-lg font-bold text-foreground">{loc.total}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
                      <div><p className="text-lg font-bold text-orange-500">{loc.hot}</p><p className="text-[10px] text-muted-foreground">HOT ({hotPct}%)</p></div>
                      <div><p className="text-lg font-bold text-emerald-600">{loc.meetings}</p><p className="text-[10px] text-muted-foreground">Meetings</p></div>
                    </div>
                    <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${key === "HIGH" ? "bg-emerald-400" : key === "MEDIUM" ? "bg-blue-400" : "bg-slate-300"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="glass-card rounded-xl p-4">
            <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-amber-500" /> Smart Score Weightage Formula
            </h4>
            {[
              { label: "Location Priority (Delhi/NCR = HIGH)", weight: 40, color: "bg-emerald-500" },
              { label: "Behavior (quotation, meeting, app use)", weight: 40, color: "bg-blue-500" },
              { label: "Source Quality (IndiaMART > Justdial)", weight: 20, color: "bg-violet-500" },
            ].map(({ label, weight, color }) => (
              <div key={label} className="flex items-center gap-3 mb-2">
                <p className="text-xs text-foreground w-44 shrink-0">{label}</p>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${weight}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground w-8">{weight}%</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* ── PRIORITY LEADS ──────────────────────────────────────────────── */}
      {activeTab === "leads" && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" /> Priority Leads — Ab Call Karo
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Near + HOT = Maximum profit chance — ye pehle</p>
            <div className="space-y-3">
              {priorityLeads.map((lead, i) => {
                const locCfg = LOC_CONFIG[lead.locationPriority as keyof typeof LOC_CONFIG] || LOC_CONFIG.UNKNOWN;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 border border-border/50 rounded-xl bg-background/60 hover:border-primary/30 transition">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0
                      ${lead.score === "VERY_HOT" ? "bg-red-100" : "bg-orange-100"}`}>
                      {lead.score === "VERY_HOT" ? "🔥" : "⚡"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${SCORE_COLORS[lead.score as keyof typeof SCORE_COLORS]}`}>
                          {lead.score.replace("_", " ")}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${locCfg.badge}`}>
                          {locCfg.icon} {lead.city || lead.state || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <p className="text-[11px] text-muted-foreground">{lead.phone}</p>
                        <p className="text-[11px] text-muted-foreground">{SOURCE_LABELS[lead.source] || lead.source}</p>
                        {lead.meetingBooked && <span className="text-[10px] text-emerald-600 font-medium">✓ Meeting Done</span>}
                        {lead.features?.includes("quotation") && <span className="text-[10px] text-blue-600 font-medium">📋 Quotation Used</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {isDemo && <p className="text-[10px] text-muted-foreground text-center mt-3 pt-3 border-t border-border/40">Demo data — Control Panel se login karein real data ke liye</p>}
          </motion.div>
        </motion.div>
      )}

      {/* ── STRATEGY ────────────────────────────────────────────────────── */}
      {activeTab === "strategy" && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">

          <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Smart Recommendations — Data se Decision
            </h3>
            <div className="space-y-3">
              {recs.map((rec, i) => (
                <div key={i} className={`flex gap-3 p-3.5 rounded-xl border
                  ${rec.type === "up" ? "bg-emerald-50 border-emerald-200" : rec.type === "down" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                  {rec.type === "up" && <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                  {rec.type === "down" && <TrendingDown className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                  {rec.type === "info" && <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                  <div>
                    <p className={`text-xs font-semibold ${rec.type === "up" ? "text-emerald-700" : rec.type === "down" ? "text-red-600" : "text-blue-700"}`}>{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Location-Based Follow-up Playbook
            </h3>
            <div className="space-y-3">
              {[
                { zone: "🔥 HIGH — Delhi/NCR", action: "Immediate call → Factory visit offer → Meeting book karo", goal: "Meeting fix", freq: "Daily (8 msgs)", color: "border-red-200 bg-red-50/50" },
                { zone: "📋 MEDIUM — North India", action: "Video call → Detailed quote + delivery plan", goal: "Quote + Demo", freq: "2-3 din (6 msgs)", color: "border-blue-200 bg-blue-50/50" },
                { zone: "💬 LOW — South/Far", action: "App link + self-service follow-up only", goal: "Time save karo", freq: "Weekly (4 msgs)", color: "border-gray-200 bg-gray-50/50" },
              ].map(({ zone, action, goal, freq, color }) => (
                <div key={zone} className={`border rounded-xl p-4 ${color}`}>
                  <p className="text-sm font-semibold text-foreground mb-2">{zone}</p>
                  <div className="flex items-start gap-2 mb-2">
                    <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground">{action}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">🎯 {goal}</span>
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">⏱ {freq}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Smart Automation Rules */}
          <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Auto System Rules — Backend Active
            </h3>
            <div className="space-y-2.5">
              <div className="flex gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                <span className="text-base shrink-0">🚨</span>
                <div>
                  <p className="text-xs font-bold text-red-700">GOLDEN ALERT — HIGH + HOT</p>
                  <p className="text-xs text-red-600 mt-0.5">Jab Delhi/NCR lead HOT/VERY_HOT ho → Admin ko turant WhatsApp alert + call instruction bhejta hai</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-orange-50 border border-orange-200">
                <span className="text-base shrink-0">⏭️</span>
                <div>
                  <p className="text-xs font-bold text-orange-700">TIME WASTE FILTER — LOW + COLD</p>
                  <p className="text-xs text-orange-600 mt-0.5">South India ka COLD lead → automatically skip. Koi WhatsApp nahi bhejta, time aur paise bachte hain</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-base shrink-0">✅</span>
                <div>
                  <p className="text-xs font-bold text-emerald-700">AUTO-STOP — Reply ya Meeting ke baad</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Lead ne reply kiya ya meeting book ki → baaki saare follow-ups automatically stop</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5 border-2 border-amber-300 bg-amber-50/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">🏆 Gold Zone — Maximum Profit</p>
                <p className="text-xs text-muted-foreground">Yahan sabse zyada revenue aur fast conversion hai</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { l: "Location", v: "Delhi / NCR", c: "text-emerald-600" },
                { l: "Activity", v: "Quotation Used", c: "text-blue-600" },
                { l: "Source", v: "IndiaMART / App", c: "text-violet-600" },
              ].map(({ l, v, c }) => (
                <div key={l} className="bg-white rounded-xl p-2.5 border border-amber-200">
                  <p className={`text-xs font-bold ${c}`}>{v}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{l}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-700 mt-3 text-center font-medium">✨ NEAR + HOT + Fast Response = MAX PROFIT 💰</p>
          </motion.div>

        </motion.div>
      )}

    </motion.div>
  );
}
