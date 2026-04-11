import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader } from "@/components/shared";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { machines as machineService, leads as leadsService, quotations } from "@/lib/dataService";
import { BarChart3, PieChart as PieIcon, TrendingUp, Activity } from "lucide-react";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c084fc", "#e879f9", "#f472b6", "#fb7185", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4"];

export default function GraphsPage() {
  const [dashData, setDashData] = useState<any>(null);
  const [quotationStats, setQuotationStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [allMachines, allLeads, allQuotations] = await Promise.all([
          machineService.getAll().catch(() => []),
          leadsService.getAll().catch(() => []),
          quotations.getAll().catch(() => []),
        ]);
        const pipeline: Record<string, number> = {};
        allLeads.forEach(l => {
          const stage = l.pipeline_stage || 'new_lead';
          pipeline[stage] = (pipeline[stage] || 0) + 1;
        });
        setDashData({ pipeline, machines: allMachines, leads: allLeads, totalLeads: allLeads.length, totalMachines: allMachines.length });
        setQuotationStats({ total: allQuotations.length, pending: allQuotations.filter(q => q.status === 'pending').length, sent: allQuotations.filter(q => q.status === 'sent').length });
      } catch {}
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pipeline = dashData?.pipeline || {};
  const pipelineData = [
    { name: "New", value: pipeline.new_lead || 0, fill: "#6366f1" },
    { name: "Contacted", value: pipeline.contacted || 0, fill: "#8b5cf6" },
    { name: "Quotation", value: pipeline.quotation_sent || 0, fill: "#e879f9" },
    { name: "Negotiating", value: pipeline.negotiating || 0, fill: "#c084fc" },
    { name: "Won", value: pipeline.won || 0, fill: "#22c55e" },
    { name: "Lost", value: pipeline.lost || 0, fill: "#f87171" },
  ];

  const machines = dashData?.machines || [];
  const machinePriceData = machines
    .filter((m: any) => m.price)
    .map((m: any) => ({ name: m.name?.split(" ").slice(0, 2).join(" ") || "Machine", price: Math.round((m.price || 0) / 100000) }))
    .sort((a: any, b: any) => b.price - a.price);

  const machineCategories: Record<string, number> = {};
  machines.forEach((m: any) => {
    const cat = m.category || "Other";
    machineCategories[cat] = (machineCategories[cat] || 0) + 1;
  });
  const categoryPieData = Object.entries(machineCategories).map(([name, value]) => ({ name, value }));

  const leads = dashData?.leads || [];
  const sourceCount: Record<string, number> = {};
  leads.forEach((l: any) => {
    const src = l.source || "unknown";
    sourceCount[src] = (sourceCount[src] || 0) + 1;
  });
  const leadSourceData = Object.entries(sourceCount).map(([name, value]) => ({
    name: name.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value,
  }));

  const leadScoreData = leads.map((l: any) => ({
    name: (l.name || "Lead").split(" ")[0],
    score: l.lead_score || 0,
    budget: Math.round((Number(l.budget) || 0) / 100000),
  }));

  const monthlyRevData = [
    { month: "Oct", revenue: 42, leads: 8, conversions: 3 },
    { month: "Nov", revenue: 55, leads: 12, conversions: 5 },
    { month: "Dec", revenue: 38, leads: 6, conversions: 2 },
    { month: "Jan", revenue: 65, leads: 15, conversions: 7 },
    { month: "Feb", revenue: 78, leads: 18, conversions: 8 },
    { month: "Mar", revenue: 92, leads: 22, conversions: 10 },
  ];

  const weeklyActivityData = [
    { day: "Mon", chats: 12, followups: 5, quotations: 2 },
    { day: "Tue", chats: 18, followups: 8, quotations: 4 },
    { day: "Wed", chats: 15, followups: 6, quotations: 3 },
    { day: "Thu", chats: 22, followups: 10, quotations: 5 },
    { day: "Fri", chats: 25, followups: 12, quotations: 6 },
    { day: "Sat", chats: 8, followups: 3, quotations: 1 },
    { day: "Sun", chats: 5, followups: 2, quotations: 0 },
  ];

  const radarData = [
    { metric: "Lead Gen", value: 75, fullMark: 100 },
    { metric: "Follow-up", value: 88, fullMark: 100 },
    { metric: "Quotations", value: 70, fullMark: 100 },
    { metric: "Demos", value: 60, fullMark: 100 },
    { metric: "Conversion", value: 65, fullMark: 100 },
    { metric: "Retention", value: 82, fullMark: 100 },
  ];

  const aiUsageData = [
    { name: "Buddy Chat", value: 45 },
    { name: "Lead Analysis", value: 20 },
    { name: "Auto Follow-up", value: 18 },
    { name: "Quotation AI", value: 12 },
    { name: "Analytics", value: 5 },
  ];

  const budgetData = [
    { provider: "Gemini", cost: 0, limit: 500, usage: 0 },
    { provider: "Groq", cost: 0, limit: 500, usage: 0 },
    { provider: "HuggingFace", cost: 0, limit: 500, usage: 0 },
    { provider: "Firebase", cost: 0, limit: 300, usage: 0 },
    { provider: "ElevenLabs", cost: 420, limit: 420, usage: 100 },
  ];

  const GRID_COLOR = "#e5e7eb";
  const TICK_COLOR = "#6b7280";
  const tooltipStyle = {
    contentStyle: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
    labelStyle: { color: "#374151", fontWeight: 600 },
    itemStyle: { color: "#6b7280" },
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader title="Analytics & Graphs" subtitle="Visual insights for your business performance" />

      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Monthly Revenue Trend (₹ Lakhs)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyRevData}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="month" tick={{ fill: TICK_COLOR, fontSize: 12 }} axisLine={{ stroke: GRID_COLOR }} />
              <YAxis tick={{ fill: TICK_COLOR, fontSize: 12 }} axisLine={{ stroke: GRID_COLOR }} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGradient)" strokeWidth={2} name="Revenue (₹L)" />
              <Area type="monotone" dataKey="leads" stroke="#8b5cf6" fill="none" strokeWidth={2} strokeDasharray="5 5" name="Leads" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" /> Sales Pipeline
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="name" tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={{ stroke: GRID_COLOR }} />
              <YAxis tick={{ fill: TICK_COLOR, fontSize: 12 }} axisLine={{ stroke: GRID_COLOR }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Leads">
                {pipelineData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-pink-400" /> Machine Categories
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {categoryPieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-cyan-400" /> Lead Sources
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={leadSourceData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {leadSourceData.map((_, i) => (
                  <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-amber-400" /> AI Usage Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={aiUsageData} cx="50%" cy="50%" innerRadius={40} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {aiUsageData.map((_, i) => (
                  <Cell key={i} fill={COLORS[(i + 6) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" /> Machine Prices (₹ Lakhs)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={machinePriceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis type="number" tick={{ fill: TICK_COLOR, fontSize: 12 }} axisLine={{ stroke: GRID_COLOR }} />
              <YAxis dataKey="name" type="category" tick={{ fill: TICK_COLOR, fontSize: 11 }} width={100} axisLine={{ stroke: GRID_COLOR }} />
              <Tooltip {...tooltipStyle} formatter={(val: number) => [`₹${val}L`, "Price"]} />
              <Bar dataKey="price" radius={[0, 6, 6, 0]} name="Price (₹L)">
                {machinePriceData.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> Lead Score vs Budget
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={leadScoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="name" tick={{ fill: TICK_COLOR, fontSize: 12 }} axisLine={{ stroke: GRID_COLOR }} />
              <YAxis tick={{ fill: TICK_COLOR, fontSize: 12 }} axisLine={{ stroke: GRID_COLOR }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: TICK_COLOR }} />
              <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} name="Score" />
              <Bar dataKey="budget" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Budget (₹L)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" /> Weekly Activity
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weeklyActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="day" tick={{ fill: TICK_COLOR, fontSize: 12 }} axisLine={{ stroke: GRID_COLOR }} />
              <YAxis tick={{ fill: TICK_COLOR, fontSize: 12 }} axisLine={{ stroke: GRID_COLOR }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: TICK_COLOR }} />
              <Line type="monotone" dataKey="chats" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Buddy Chats" />
              <Line type="monotone" dataKey="followups" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Follow-ups" />
              <Line type="monotone" dataKey="quotations" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Quotations" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-400" /> Sales Performance Radar
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke={GRID_COLOR} />
              <PolarAngleAxis dataKey="metric" tick={{ fill: TICK_COLOR, fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: TICK_COLOR, fontSize: 10 }} />
              <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-green-400" /> AI Budget Usage (₹/month)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={budgetData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis type="number" tick={{ fill: TICK_COLOR, fontSize: 12 }} axisLine={{ stroke: GRID_COLOR }} domain={[0, 600]} />
            <YAxis dataKey="provider" type="category" tick={{ fill: TICK_COLOR, fontSize: 12 }} width={90} axisLine={{ stroke: GRID_COLOR }} />
            <Tooltip {...tooltipStyle} formatter={(val: number) => [`₹${val}`, "Cost"]} />
            <Legend wrapperStyle={{ fontSize: 12, color: TICK_COLOR }} />
            <Bar dataKey="cost" fill="#22c55e" radius={[0, 4, 4, 0]} name="Current Cost (₹)" />
            <Bar dataKey="limit" fill="#6366f130" radius={[0, 4, 4, 0]} name="Budget Limit (₹)" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 text-center text-xs text-muted-foreground">
          Total Budget: ₹2,000/month | Current Spend: ₹420/month (ElevenLabs) | All AI providers are FREE tier
        </div>
      </motion.div>
    </motion.div>
  );
}
