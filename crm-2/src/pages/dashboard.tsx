import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard, SectionCard } from "@/components/shared";
import {
  Cpu, Building2, Users, TrendingUp, Bell, Loader2, Wifi, WifiOff,
  MapPin, Activity, FileText, CheckCircle2, Clock, AlertTriangle,
  Smartphone, UserCheck, BarChart3, Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats, leads as leadsService, quotations as quotationsService } from "@/lib/dataService";
import type { Lead } from "@/lib/supabase";

const stageColors: Record<string, string> = {
  new_lead: "bg-blue-500/10 text-blue-500",
  contacted: "bg-amber-500/10 text-amber-500",
  interested: "bg-purple-500/10 text-purple-500",
  demo_scheduled: "bg-pink-500/10 text-pink-500",
  quotation_sent: "bg-emerald-500/10 text-emerald-500",
  negotiating: "bg-orange-500/10 text-orange-500",
  won: "bg-green-500/10 text-green-500",
  lost: "bg-red-500/10 text-red-500",
  New: "bg-blue-500/10 text-blue-500",
};

const priorityConfig: Record<string, { color: string; dot: string; label: string }> = {
  HIGH:    { color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500", label: "Near" },
  MEDIUM:  { color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Medium" },
  LOW:     { color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", label: "Far" },
  UNKNOWN: { color: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400", label: "Unknown" },
};

const scoreConfig: Record<string, string> = {
  VERY_HOT: "bg-red-500 text-white",
  HOT: "bg-orange-500 text-white",
  WARM: "bg-amber-100 text-amber-700",
  COLD: "bg-blue-100 text-blue-600",
};

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalMachines: 0, totalLeads: 0, totalSuppliers: 0, newLeads: 0, wonLeads: 0, pipelineValue: 0, conversionRate: 0 });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [quoteStats, setQuoteStats] = useState({ total: 0, accepted: 0, pending: 0, wonValue: 0 });
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [dashStats, recent, leads] = await Promise.all([
          getDashboardStats(),
          leadsService.getRecent(10),
          leadsService.getAll(),
        ]);
        setStats(dashStats);
        setRecentLeads(recent);
        setAllLeads(leads);
        setDbConnected(true);

        const pipelineMap: Record<string, number> = {};
        leads.forEach(l => {
          const stage = l.pipeline_stage || l.status || 'new_lead';
          pipelineMap[stage] = (pipelineMap[stage] || 0) + 1;
        });
        setPipeline(pipelineMap);

        try {
          const allQuotes = await quotationsService.getAll();
          const accepted = allQuotes.filter((q: any) => q.status === 'accepted');
          const pending = allQuotes.filter((q: any) => q.status === 'sent' || q.status === 'draft');
          const wonVal = accepted.reduce((sum: number, q: any) => sum + (q.total || 0), 0);
          setQuoteStats({ total: allQuotes.length, accepted: accepted.length, pending: pending.length, wonValue: wonVal });
        } catch { /* quotation table may not exist */ }
      } catch (err) {
        console.error('Dashboard load error:', err);
        setDbConnected(false);
      }
      setLoading(false);
    }
    load();
  }, []);

  const priorityCounts = allLeads.reduce((acc, l) => {
    const p = (l as any).location_priority || (l as any).locationPriority || 'UNKNOWN';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStr = now.toISOString().split('T')[0];
  const totalUsers = allLeads.length;
  const activeUsers = allLeads.filter(l => {
    const lastActive = (l as any).last_active || (l as any).lastActive || l.updated_at;
    return lastActive && new Date(lastActive) >= sevenDaysAgo;
  }).length;
  const dailyActive = allLeads.filter(l => {
    const lastActive = (l as any).last_active || (l as any).lastActive || l.updated_at;
    return lastActive && lastActive.toString().startsWith(todayStr);
  }).length;
  const appUsers = allLeads.filter(l => (l as any).app_installed || (l as any).appInstalled).length;

  if (loading) {
    return (
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        <PageHeader title="Dashboard" subtitle="SAI RoloTech — Business Engine" />
        <div className="flex items-center gap-2 p-3 rounded-lg glass-card">
          <div className="w-4 h-4 rounded-full skeleton-shimmer" />
          <div className="w-48 h-4 skeleton-shimmer rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <StatsCard key={i} label="" value="" icon={Cpu} isLoading />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-xl border border-border p-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full skeleton-shimmer" />
                <div className="w-12 h-3 skeleton-shimmer rounded" />
              </div>
              <div className="w-10 h-6 skeleton-shimmer rounded mb-1" />
              <div className="w-8 h-2 skeleton-shimmer rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="glass-card rounded-xl p-5 space-y-3">
              <div className="w-28 h-5 skeleton-shimmer rounded" />
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(j => (
                  <div key={j} className="bg-muted/40 rounded-xl p-3 space-y-2">
                    <div className="w-5 h-5 mx-auto rounded skeleton-shimmer" />
                    <div className="w-10 h-5 mx-auto rounded skeleton-shimmer" />
                    <div className="w-14 h-2 mx-auto rounded skeleton-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader title="Dashboard" subtitle="SAI RoloTech — Business Engine" />

      <motion.div variants={staggerItem} className="flex items-center gap-2 p-3 rounded-lg glass-card">
        {dbConnected ? (
          <><Wifi className="w-4 h-4 text-emerald-600" /><span className="text-sm text-emerald-600">Supabase Connected — Live Data</span></>
        ) : (
          <><WifiOff className="w-4 h-4 text-amber-600" /><span className="text-sm text-amber-600">Database Offline — Check Supabase Connection</span></>
        )}
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="Total Machines" value={stats.totalMachines} icon={Cpu} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
        <StatsCard label="Active Leads" value={stats.totalLeads} icon={TrendingUp} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" change={stats.newLeads > 0 ? `${stats.newLeads} new` : undefined} trend="up" />
        <StatsCard label="Suppliers" value={stats.totalSuppliers} icon={Building2} iconBg="bg-purple-500/10" iconColor="text-purple-500" />
        <StatsCard label="Conversion" value={`${stats.conversionRate}%`} icon={Users} iconBg="bg-amber-500/10" iconColor="text-amber-500" />
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(priorityConfig).map(([key, cfg]) => (
          <div key={key} className={`rounded-xl border p-3 ${cfg.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{cfg.label}</span>
            </div>
            <p className="text-xl font-bold">{priorityCounts[key] || 0}</p>
            <p className="text-[10px] opacity-70">leads</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="User Analytics" headerAction={<Activity className="w-4 h-4 text-blue-600" />}>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-700">{totalUsers}</p>
              <p className="text-[10px] text-blue-500">Total Users</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <UserCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-emerald-700">{activeUsers}</p>
              <p className="text-[10px] text-emerald-500">Active (7d)</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <Zap className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-purple-700">{dailyActive}</p>
              <p className="text-[10px] text-purple-500">Today Active</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <Smartphone className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-amber-700">{appUsers}</p>
              <p className="text-[10px] text-amber-500">App Installed</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Quotation Tracker" headerAction={<FileText className="w-4 h-4 text-emerald-600" />}>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-slate-700">{quoteStats.total}</p>
              <p className="text-[10px] text-slate-500">Total Quotes</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">{quoteStats.accepted}</p>
              <p className="text-[10px] text-emerald-500">Accepted</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-amber-700">{quoteStats.pending}</p>
              <p className="text-[10px] text-amber-500">Pending</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-blue-700">₹{(quoteStats.wonValue / 100000).toFixed(1)}L</p>
              <p className="text-[10px] text-blue-500">Won Value</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Notification Routing" headerAction={<Bell className="w-4 h-4 text-purple-600" />}>
          <div className="space-y-3">
            {[
              { label: "App Users → Push", count: appUsers, color: "bg-blue-500", icon: Smartphone },
              { label: "Non-App → WhatsApp", count: totalUsers - appUsers, color: "bg-emerald-500", icon: Bell },
              { label: "Hot Leads → Both", count: allLeads.filter(l => (l as any).score === 'HOT' || (l as any).score === 'VERY_HOT').length, color: "bg-red-500", icon: Zap },
            ].map(({ label, count, color, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}/10`}>
                  <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">{label}</p>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div className={`${color} h-1.5 rounded-full`} style={{ width: `${totalUsers > 0 ? Math.min(100, (count / totalUsers) * 100) : 0}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Sales Pipeline">
          <div className="space-y-3">
            {Object.entries(pipeline).length > 0 ? Object.entries(pipeline).map(([stage, cnt]) => (
              <div key={stage} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <Badge className={stageColors[stage] || "bg-muted"}>{stage.replace(/_/g, " ")}</Badge>
                </div>
                <span className="text-lg font-semibold">{cnt}</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No pipeline data yet</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Recent Leads (Priority View)">
          <div className="space-y-3">
            {recentLeads.map((lead) => {
              const locPriority = (lead as any).location_priority || (lead as any).locationPriority || 'UNKNOWN';
              const pCfg = priorityConfig[locPriority] || priorityConfig.UNKNOWN;
              const leadScore = (lead as any).score || 'COLD';
              const sCfg = scoreConfig[leadScore] || scoreConfig.COLD;
              return (
                <motion.div key={lead.id} variants={staggerItem} className="flex items-start gap-3 p-3 rounded-lg data-row-hover border border-border">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`w-3 h-3 rounded-full ${pCfg.dot}`} title={locPriority} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground">{lead.name}</p>
                      <Badge className={`text-[9px] px-1.5 py-0 ${sCfg}`}>{leadScore}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{lead.city || 'Unknown'} — {lead.machine_interest || 'General'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Badge className={`text-[9px] border ${pCfg.color}`}>{pCfg.label}</Badge>
                      <Badge className={stageColors[lead.pipeline_stage] || stageColors[lead.status] || "bg-muted"} variant="outline">
                        {(lead.pipeline_stage || lead.status || '').replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {recentLeads.length === 0 && (
              <p className="text-sm text-muted-foreground">No leads yet</p>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Revenue Overview">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl metric-highlight text-center transition-all duration-200">
            <p className="text-xs text-muted-foreground mb-1">Pipeline Value</p>
            <p className="text-2xl font-bold text-primary">₹{(stats.pipelineValue / 100000).toFixed(1)}L</p>
          </div>
          <div className="p-4 rounded-xl metric-highlight text-center transition-all duration-200">
            <p className="text-xs text-muted-foreground mb-1">Conversion Rate</p>
            <p className="text-2xl font-bold text-emerald-500">{stats.conversionRate}%</p>
          </div>
          <div className="p-4 rounded-xl metric-highlight text-center transition-all duration-200">
            <p className="text-xs text-muted-foreground mb-1">Won Deals</p>
            <p className="text-2xl font-bold text-amber-500">{stats.wonLeads}</p>
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );
}
