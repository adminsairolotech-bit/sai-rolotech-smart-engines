import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard, SectionCard } from "@/components/shared";
import { MapPin, Users, Flame, TrendingUp, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const leadsByState = [
  { state: "Delhi NCR", cities: ["New Delhi", "Noida", "Ghaziabad", "Faridabad"], leads: 48, hot: 18, warm: 20, cold: 10, color: "#ef4444", pct: 100 },
  { state: "Haryana", cities: ["Rohtak", "Panipat", "Sonipat", "Bahadurgarh"], leads: 29, hot: 10, warm: 12, cold: 7, color: "#f97316", pct: 60 },
  { state: "Punjab", cities: ["Ludhiana", "Amritsar", "Batala", "Phagwara"], leads: 22, hot: 8, warm: 9, cold: 5, color: "#eab308", pct: 46 },
  { state: "Uttar Pradesh", cities: ["Meerut", "Agra", "Kanpur", "Lucknow"], leads: 31, hot: 9, warm: 14, cold: 8, color: "#22c55e", pct: 65 },
  { state: "Rajasthan", cities: ["Jaipur", "Jodhpur", "Alwar", "Bhilwara"], leads: 15, hot: 4, warm: 7, cold: 4, color: "#3b82f6", pct: 31 },
  { state: "Madhya Pradesh", cities: ["Indore", "Bhopal", "Gwalior"], leads: 12, hot: 3, warm: 5, cold: 4, color: "#8b5cf6", pct: 25 },
  { state: "Gujarat", cities: ["Ahmedabad", "Rajkot", "Surat"], leads: 8, hot: 2, warm: 3, cold: 3, color: "#06b6d4", pct: 17 },
  { state: "Maharashtra", cities: ["Mumbai", "Pune", "Nashik"], leads: 6, hot: 2, warm: 2, cold: 2, color: "#64748b", pct: 13 },
];

const recentLeadLocations = [
  { name: "Satpal Industries", city: "Rohtak", score: "HOT", machine: "Shutter Patti", daysAgo: 1 },
  { name: "Kumar Sheet Works", city: "Noida", score: "VERY_HOT", machine: "False Ceiling", daysAgo: 1 },
  { name: "Rajesh Roofing", city: "Panipat", score: "HOT", machine: "Aluminium Profile", daysAgo: 2 },
  { name: "Sharma Metal Works", city: "Meerut", score: "WARM", machine: "Z Purlin", daysAgo: 2 },
  { name: "Delhi Sheet Metal", city: "New Delhi", score: "HOT", machine: "Shutter Patti", daysAgo: 3 },
  { name: "Ludhiana Fabricators", city: "Ludhiana", score: "WARM", machine: "C Purlin", daysAgo: 3 },
  { name: "Jaipur Rooftech", city: "Jaipur", score: "COLD", machine: "False Ceiling", daysAgo: 4 },
  { name: "Ghaziabad Steel", city: "Ghaziabad", score: "WARM", machine: "Shutter Patti", daysAgo: 5 },
];

const SCORE_COLORS: Record<string, string> = {
  VERY_HOT: "bg-red-100 text-red-700 border-red-200",
  HOT:      "bg-orange-100 text-orange-700 border-orange-200",
  WARM:     "bg-amber-100 text-amber-700 border-amber-200",
  COLD:     "bg-blue-100 text-blue-700 border-blue-200",
};

const SCORE_EMOJIS: Record<string, string> = {
  VERY_HOT: "🔥🔥", HOT: "🔥", WARM: "🌡️", COLD: "❄️",
};

export default function MapViewPage() {
  const [filter, setFilter] = useState("all");

  const totalLeads = leadsByState.reduce((a, s) => a + s.leads, 0);
  const totalHot   = leadsByState.reduce((a, s) => a + s.hot, 0);

  const filteredLocations = filter === "all"
    ? recentLeadLocations
    : recentLeadLocations.filter(l => l.score === filter);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader title="Lead Map — India" subtitle="Geographic distribution of leads across India" />

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard label="Total Leads"  value={totalLeads}   icon={Users}      iconBg="bg-blue-50"    iconColor="text-blue-500" />
        <StatsCard label="Hot Leads"    value={totalHot}     icon={Flame}      iconBg="bg-red-50"     iconColor="text-red-500" />
        <StatsCard label="States"       value={leadsByState.length}   icon={MapPin}     iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <StatsCard label="Delhi NCR %"  value="28%"          icon={TrendingUp} iconBg="bg-amber-50"   iconColor="text-amber-500" />
      </motion.div>

      {/* OpenStreetMap iframe — North India focus */}
      <motion.div variants={staggerItem} className="glass-card rounded-2xl overflow-hidden border border-border">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Live Map — Delhi + North India Focus
          </p>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">OpenStreetMap</Badge>
        </div>
        <iframe
          title="SAI RoloTech Lead Coverage Map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=72.0,22.0,88.0,32.5&layer=mapnik&marker=28.6139,77.2090"
          className="w-full border-0"
          style={{ height: 340 }}
          loading="lazy"
          aria-label="North India map showing lead coverage"
        />
      </motion.div>

      {/* State Heatmap */}
      <SectionCard title="Lead Heatmap — State wise" headerAction={<MapPin className="w-4 h-4 text-muted-foreground" />}>
        <div className="space-y-3">
          {leadsByState.map(s => (
            <motion.div key={s.state} variants={staggerItem}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-sm font-medium text-foreground">{s.state}</span>
                  <span className="text-xs text-muted-foreground ml-2">{s.cities.slice(0, 3).join(", ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-medium">{s.hot}🔥</span>
                  <span className="text-sm font-bold text-foreground">{s.leads}</span>
                </div>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </SectionCard>

      {/* Recent leads by location */}
      <SectionCard title="Recent Leads by Location"
        headerAction={
          <div className="flex gap-1.5 flex-wrap">
            {["all", "VERY_HOT", "HOT", "WARM", "COLD"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {f === "all" ? "All" : SCORE_EMOJIS[f] + " " + f.replace("_", " ")}
              </button>
            ))}
          </div>
        }>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredLocations.map((lead, i) => (
            <motion.div key={i} variants={staggerItem}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 bg-white/50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                <p className="text-xs text-muted-foreground">{lead.city} · {lead.machine}</p>
              </div>
              <div className="text-right shrink-0">
                <Badge className={`text-[10px] mb-1 ${SCORE_COLORS[lead.score]}`}>{SCORE_EMOJIS[lead.score]} {lead.score.replace("_"," ")}</Badge>
                <p className="text-[10px] text-muted-foreground">{lead.daysAgo}d ago</p>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionCard>
    </motion.div>
  );
}
