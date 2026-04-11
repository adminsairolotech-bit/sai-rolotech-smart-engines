import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader } from "@/components/shared";
import {
  Target,
  MapPin,
  TrendingUp,
  TrendingDown,
  Zap,
  Users,
  Star,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  Flame,
  Globe,
  Loader2,
} from "lucide-react";

type SourceAnalytics = {
  source: string;
  total: number;
  hot: number;
  veryHot?: number;
  converted: number;
  revenue: number;
  meetings: number;
  hotRate: number;
  conversionRate: number;
};

type LocationAnalytics = Record<string, { total: number; hot: number; meetings: number }>;

type PriorityLead = {
  name: string;
  phone: string;
  score: string;
  locationPriority: string;
  city?: string;
  state?: string;
  source: string;
  meetingBooked?: boolean;
  features?: string[];
};

type AnalyticsPayload = {
  success: boolean;
  sources?: SourceAnalytics[];
  locations?: LocationAnalytics;
  priorityLeads?: PriorityLead[];
  stats?: {
    total: number;
    cold: number;
    warm: number;
    hot: number;
    veryHot: number;
    dnd: number;
    appInstalled: number;
    meetings: number;
  };
};

const DEMO_SOURCES: SourceAnalytics[] = [
  { source: "indiamart", total: 100, hot: 28, veryHot: 8, converted: 8, revenue: 520000, meetings: 12, hotRate: 28, conversionRate: 8 },
  { source: "app_direct", total: 60, hot: 25, veryHot: 12, converted: 12, revenue: 640000, meetings: 18, hotRate: 42, conversionRate: 20 },
  { source: "justdial", total: 80, hot: 10, veryHot: 2, converted: 2, revenue: 105000, meetings: 4, hotRate: 13, conversionRate: 3 },
];

const DEMO_LOCATIONS: LocationAnalytics = {
  HIGH: { total: 85, hot: 38, meetings: 22 },
  MEDIUM: { total: 120, hot: 30, meetings: 8 },
  LOW: { total: 75, hot: 10, meetings: 2 },
  UNKNOWN: { total: 35, hot: 5, meetings: 1 },
};

const DEMO_PRIORITY_LEADS: PriorityLead[] = [
  { name: "Rajesh Kumar", phone: "98998XXXXX", score: "VERY_HOT", locationPriority: "HIGH", city: "Delhi", state: "Delhi", source: "indiamart", meetingBooked: true, features: ["quotation"] },
  { name: "Amit Sharma", phone: "87654XXXXX", score: "VERY_HOT", locationPriority: "HIGH", city: "Gurugram", state: "Haryana", source: "app_direct", meetingBooked: false, features: ["quotation", "maintenance"] },
];

const DEMO_STATS = { total: 315, hot: 63, veryHot: 28, cold: 185, warm: 67, meetings: 33, dnd: 8, appInstalled: 142 };

const SOURCE_LABELS: Record<string, string> = {
  indiamart: "IndiaMART",
  justdial: "Justdial",
  app_direct: "App Direct",
  pabbly: "Pabbly/Ads",
  direct: "Direct",
  unknown: "Unknown",
};

const SOURCE_COLORS: Record<string, string> = {
  indiamart: "bg-blue-500",
  app_direct: "bg-emerald-500",
  justdial: "bg-amber-500",
  pabbly: "bg-violet-500",
  direct: "bg-cyan-500",
  unknown: "bg-slate-400",
};

const LOC_CONFIG = {
  HIGH: { label: "Near - Delhi/NCR/North", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-700", tip: "Immediate call + factory visit" },
  MEDIUM: { label: "Medium - North India", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", badge: "bg-blue-100 text-blue-700", tip: "Video call + detailed quote" },
  LOW: { label: "Far - South/Other", color: "text-slate-500", bg: "bg-slate-50 border-slate-200", badge: "bg-slate-100 text-slate-600", tip: "App self-service follow-up" },
  UNKNOWN: { label: "Unknown Location", color: "text-muted-foreground", bg: "bg-muted/30 border-muted", badge: "bg-muted text-muted-foreground", tip: "Ask for location first" },
};

function fmtINR(value: number) {
  return value >= 100000 ? `₹${(value / 100000).toFixed(1)}L` : `₹${(value / 1000).toFixed(0)}K`;
}

function getRecommendations(sources: SourceAnalytics[]) {
  const recs: { type: "up" | "down" | "info"; title: string; desc: string }[] = [];
  const sorted = [...sources].sort((a, b) => b.conversionRate - a.conversionRate);
  const best = sorted[0];
  const worst = sources.filter((source) => source.total > 20).sort((a, b) => a.conversionRate - b.conversionRate)[0];
  if (best?.conversionRate > 10) recs.push({ type: "up", title: `${SOURCE_LABELS[best.source] || best.source} - Budget Badhao`, desc: `${best.conversionRate}% conversion rate ke saath ye sabse profitable source hai.` });
  if (worst && worst.conversionRate < 5) recs.push({ type: "down", title: `${SOURCE_LABELS[worst.source] || worst.source} - Focus Kam Karo`, desc: `Sirf ${worst.conversionRate}% conversion. Yahan budget review karo.` });
  recs.push({ type: "info", title: "Nearby Leads First", desc: "Delhi/NCR leads ko jaldi contact karne se meeting odds better hote hain." });
  return recs;
}

export default function LeadIntelligenceLivePage() {
  const [sources, setSources] = useState<SourceAnalytics[]>(DEMO_SOURCES);
  const [locations, setLocations] = useState<LocationAnalytics>(DEMO_LOCATIONS);
  const [priorityLeads, setPriorityLeads] = useState<PriorityLead[]>(DEMO_PRIORITY_LEADS);
  const [stats, setStats] = useState(DEMO_STATS);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"source" | "location" | "leads" | "strategy">("source");

  const fetchAnalytics = async () => {
    const token = sessionStorage.getItem("sai_admin_token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    setLoading(true);
    try {
      const res = await fetch("/api/lead-analytics", { headers });
      if (res.ok) {
        const data = await res.json() as AnalyticsPayload;
        if (data.success) {
          if (data.sources?.length) setSources(data.sources);
          if (data.locations) setLocations(data.locations);
          if (data.priorityLeads?.length) setPriorityLeads(data.priorityLeads);
          if (data.stats) setStats(data.stats);
          setIsDemo(false);
        }
      }
    } catch {
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const recs = useMemo(() => getRecommendations(sources), [sources]);
  const maxTotal = Math.max(...sources.map((source) => source.total), 1);
  const locTotal = Object.values(locations).reduce((sum, location) => sum + location.total, 0) || 1;

  const tabs = [
    { id: "source" as const, label: "Source ROI", icon: BarChart3 },
    { id: "location" as const, label: "Location Map", icon: MapPin },
    { id: "leads" as const, label: "Priority Leads", icon: Flame },
    { id: "strategy" as const, label: "Strategy", icon: Target },
  ];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">
      <PageHeader
        title="Lead Intelligence"
        subtitle="Source ROI + location analytics + smart priority"
        actions={(
          <div className="flex items-center gap-2">
            {isDemo && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">Demo fallback</span>}
            <button onClick={fetchAnalytics} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          </div>
        )}
      />

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

      <motion.div variants={staggerItem} className="flex gap-1 bg-muted/40 p-1 rounded-xl overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 min-w-max flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </motion.div>

      {activeTab === "source" && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Source Performance
            </h3>
            <p className="text-xs text-muted-foreground mb-4">ROI aur conversion ko live data se compare karo.</p>
            <div className="space-y-4">
              {sources.map((source) => {
                const label = SOURCE_LABELS[source.source] || source.source;
                const dotColor = SOURCE_COLORS[source.source] || "bg-slate-400";
                const pct = Math.round((source.total / maxTotal) * 100);
                return (
                  <div key={source.source} className="border border-border/50 rounded-xl p-4 bg-background/60">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full ${dotColor} shrink-0`} />
                        <span className="font-semibold text-sm text-foreground">{label}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{fmtINR(source.revenue)}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center mb-3">
                      {[
                        { l: "Leads", v: source.total },
                        { l: "HOT", v: source.hot },
                        { l: "Sales", v: source.converted },
                        { l: "Conv%", v: `${source.conversionRate}%` },
                      ].map(({ l, v }) => (
                        <div key={l} className="bg-muted/40 rounded-lg py-1.5">
                          <p className="text-sm font-bold text-foreground">{v}</p>
                          <p className="text-[10px] text-muted-foreground">{l}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${dotColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeTab === "location" && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Location-wise Lead Distribution
            </h3>
            <div className="space-y-3 mt-4">
              {(["HIGH", "MEDIUM", "LOW", "UNKNOWN"] as const).map((key) => {
                const location = locations[key] || { total: 0, hot: 0, meetings: 0 };
                const config = LOC_CONFIG[key];
                const percent = Math.round((location.total / locTotal) * 100);
                const hotPct = location.total > 0 ? Math.round((location.hot / location.total) * 100) : 0;
                return (
                  <div key={key} className={`border rounded-xl p-4 ${config.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
                        <p className="text-[10px] text-muted-foreground">{config.tip}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.badge}`}>{location.total} leads</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div><p className="text-lg font-bold text-foreground">{location.total}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
                      <div><p className="text-lg font-bold text-orange-500">{location.hot}</p><p className="text-[10px] text-muted-foreground">HOT ({hotPct}%)</p></div>
                      <div><p className="text-lg font-bold text-emerald-600">{location.meetings}</p><p className="text-[10px] text-muted-foreground">Meetings</p></div>
                    </div>
                    <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeTab === "leads" && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" /> Priority Leads
            </h3>
            <div className="space-y-3 mt-4">
              {priorityLeads.map((lead, index) => (
                <div key={`${lead.phone}-${index}`} className="flex items-center gap-3 p-3 border border-border/50 rounded-xl bg-background/60">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${lead.score === "VERY_HOT" ? "bg-red-100" : "bg-orange-100"}`}>
                    {lead.score === "VERY_HOT" ? "HOT" : "UP"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">{lead.score}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{lead.city || lead.state || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <p className="text-[11px] text-muted-foreground">{lead.phone}</p>
                      <p className="text-[11px] text-muted-foreground">{SOURCE_LABELS[lead.source] || lead.source}</p>
                      {lead.meetingBooked && <span className="text-[10px] text-emerald-600 font-medium">Meeting booked</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeTab === "strategy" && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Smart Recommendations
            </h3>
            <div className="space-y-3">
              {recs.map((rec, index) => (
                <div key={index} className={`flex gap-3 p-3.5 rounded-xl border ${rec.type === "up" ? "bg-emerald-50 border-emerald-200" : rec.type === "down" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                  {rec.type === "up" && <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                  {rec.type === "down" && <TrendingDown className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                  {rec.type === "info" && <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-xs font-semibold text-foreground">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Operational Rules
            </h3>
            <div className="space-y-2.5">
              <div className="flex gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                <Star className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-700">High-priority nearby leads</p>
                  <p className="text-xs text-red-600 mt-0.5">HOT ya VERY_HOT nearby leads ko fastest response lane me rakho.</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-700">Meeting aftercare</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Meeting booked leads par cadence ko human review ke saath slow karo.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
