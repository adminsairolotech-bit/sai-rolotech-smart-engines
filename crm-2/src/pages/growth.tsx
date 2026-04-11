import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard, SectionCard } from "@/components/shared";
import { TrendingUp, IndianRupee, Users, Target, ArrowUpRight, ArrowDownRight, Zap, MapPin } from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";

const monthlyData = [
  { month: "Oct", leads: 38, conversions: 9, revenue: 14.5, demos: 5 },
  { month: "Nov", leads: 44, conversions: 12, revenue: 18.2, demos: 8 },
  { month: "Dec", leads: 41, conversions: 10, revenue: 16.8, demos: 6 },
  { month: "Jan", leads: 53, conversions: 15, revenue: 24.4, demos: 10 },
  { month: "Feb", leads: 49, conversions: 13, revenue: 21.7, demos: 9 },
  { month: "Mar", leads: 67, conversions: 22, revenue: 34.1, demos: 14 },
];

const sourceData = [
  { name: "IndiaMART", value: 42, color: "#6366f1" },
  { name: "Justdial",  value: 18, color: "#22c55e" },
  { name: "Direct",    value: 15, color: "#f59e0b" },
  { name: "Pabbly Ads",value: 12, color: "#ec4899" },
  { name: "Referral",  value: 13, color: "#06b6d4" },
];

const regionData = [
  { region: "Delhi NCR", leads: 48, revenue: 16.2, conversion: 37 },
  { region: "Haryana",   leads: 29, revenue: 9.4,  conversion: 34 },
  { region: "UP",        leads: 31, revenue: 8.1,  conversion: 29 },
  { region: "Punjab",    leads: 22, revenue: 6.8,  conversion: 36 },
  { region: "Rajasthan", leads: 15, revenue: 3.4,  conversion: 27 },
  { region: "Others",    leads: 26, revenue: 4.6,  conversion: 23 },
];

const performanceRadar = [
  { metric: "Lead Quality", value: 78 },
  { metric: "Response Time", value: 85 },
  { metric: "Demo Conversion", value: 72 },
  { metric: "Quote Acceptance", value: 66 },
  { metric: "Repeat Business", value: 45 },
  { metric: "App Adoption", value: 38 },
];

const conversionFunnel = [
  { stage: "Total Enquiries", count: 420, pct: 100 },
  { stage: "Leads Created",   count: 67,  pct: 16 },
  { stage: "Demos Scheduled", count: 24,  pct: 5.7 },
  { stage: "Quotation Sent",  count: 18,  pct: 4.3 },
  { stage: "Order Confirmed", count: 8,   pct: 1.9 },
];

const tipStyle = {
  contentStyle: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
  labelStyle:   { color: "#374151", fontWeight: 600 },
  itemStyle:    { color: "#6b7280" },
};

export default function GrowthAnalyticsPage() {
  const [period, setPeriod] = useState<"6m" | "1y">("6m");

  const thisM = monthlyData[monthlyData.length - 1];
  const prevM = monthlyData[monthlyData.length - 2];
  const revenueChg = (((thisM.revenue - prevM.revenue) / prevM.revenue) * 100).toFixed(1);
  const leadsChg   = (((thisM.leads - prevM.leads) / prevM.leads) * 100).toFixed(1);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader title="Growth Analytics" subtitle="Lead conversion, revenue pipeline aur monthly growth — SAI RoloTech" />

      {/* KPI Cards */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard label="Mar Revenue"    value={`₹${thisM.revenue}L`} icon={IndianRupee} iconBg="bg-emerald-50" iconColor="text-emerald-500"
          change={`+${revenueChg}%`} trend="up" />
        <StatsCard label="New Leads"      value={thisM.leads}           icon={Users}       iconBg="bg-blue-50"    iconColor="text-blue-500"
          change={`+${leadsChg}%`} trend="up" />
        <StatsCard label="Demo → Order"   value="33%"                   icon={Target}      iconBg="bg-purple-50"  iconColor="text-purple-500"
          change="+6%" trend="up" />
        <StatsCard label="MoM Growth"     value="+18%"                  icon={TrendingUp}  iconBg="bg-amber-50"   iconColor="text-amber-500"
          change="+3%" trend="up" />
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Lead Acquisition + Conversions"
          headerAction={
            <div className="flex gap-1">
              {(["6m","1y"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  {p === "6m" ? "6 Months" : "1 Year"}
                </button>
              ))}
            </div>
          }>
          <div className="h-56 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="leads" name="Leads" fill="#818cf8" radius={[5, 5, 0, 0]} />
                <Bar dataKey="conversions" name="Conversions" fill="#6366f1" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Revenue Pipeline (₹L)">
          <div className="h-56 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${v}L`} />
                <Tooltip {...tipStyle} formatter={(v: number | string | Array<number | string>) => [`₹${v}L`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#revGrad)" strokeWidth={2.5} dot={{ fill: "#22c55e", r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Lead Source Breakdown">
          <div className="flex items-center gap-4 mt-3">
            <div className="flex-1 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {sourceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...tipStyle} formatter={(v: number | string | Array<number | string>) => [`${v}%`, "Share"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {sourceData.map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-muted-foreground">{s.name}</span>
                  <span className="text-xs font-bold text-foreground ml-auto">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Performance Radar">
          <div className="h-52 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={performanceRadar}>
                <PolarGrid stroke="#f0f0f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: "#6366f1" }} />
                <Tooltip {...tipStyle} formatter={(v: number | string | Array<number | string>) => [`${v}/100`, ""]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Regional Performance */}
      <SectionCard title="Regional Performance" headerAction={<MapPin className="w-4 h-4 text-muted-foreground" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-xs font-semibold text-muted-foreground">Region</th>
                <th className="text-right py-2 text-xs font-semibold text-muted-foreground">Leads</th>
                <th className="text-right py-2 text-xs font-semibold text-muted-foreground">Revenue</th>
                <th className="text-right py-2 text-xs font-semibold text-muted-foreground">Conv. Rate</th>
                <th className="py-2 text-xs font-semibold text-muted-foreground">Trend</th>
              </tr>
            </thead>
            <tbody>
              {regionData.map(r => (
                <tr key={r.region} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 font-medium text-foreground">{r.region}</td>
                  <td className="py-2.5 text-right text-foreground">{r.leads}</td>
                  <td className="py-2.5 text-right text-emerald-600 font-medium">₹{r.revenue}L</td>
                  <td className="py-2.5 text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.conversion >= 33 ? "bg-emerald-50 text-emerald-700" : r.conversion >= 28 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                      {r.conversion}%
                    </span>
                  </td>
                  <td className="py-2.5 pl-3">
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Conversion Funnel */}
      <SectionCard title="Sales Funnel — Mar 2026">
        <div className="space-y-3 mt-2">
          {conversionFunnel.map((stage, i) => (
            <div key={stage.stage} className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-36 shrink-0">{stage.stage}</span>
              <div className="flex-1 relative">
                <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${Math.max(stage.pct, 4)}%` }} transition={{ delay: i * 0.1, duration: 0.6 }}
                    className="h-full rounded-full flex items-center justify-end pr-3"
                    style={{ background: i === 0 ? "#818cf8" : i === 1 ? "#6366f1" : i === 2 ? "#4f46e5" : i === 3 ? "#4338ca" : "#3730a3" }}>
                    {stage.pct > 10 && <span className="text-xs font-semibold text-white">{stage.count.toLocaleString()}</span>}
                  </motion.div>
                </div>
                {stage.pct <= 10 && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-foreground">{stage.count}</span>}
              </div>
              <span className="text-xs text-muted-foreground w-12 text-right">{stage.pct}%</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </motion.div>
  );
}
