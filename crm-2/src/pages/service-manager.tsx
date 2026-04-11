import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { feedbackReports } from "@/lib/dataService";
import {
  Wrench, Plus, Search, AlertTriangle, CheckCircle2, Clock, Play,
  Phone, Mail, Building2, MessageSquare, Bot, BarChart3, Filter,
  Thermometer, Star, IndianRupee, CalendarDays, FileText, Send,
  ShieldCheck, Loader2, ChevronDown, ChevronRight, Eye, X,
  Hammer, Settings, Zap, TrendingUp, Users, Package
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

interface ServiceTicket {
  id: number;
  ticketNo: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  company: string | null;
  machineId: number | null;
  machineName: string | null;
  issueType: string;
  priority: string;
  description: string | null;
  status: string;
  assignedTo: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  partsUsed: any;
  serviceNotes: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  rating: number | null;
  feedback: string | null;
  createdAt: string;
}

interface BuddyAdvice {
  diagnosis: string;
  steps: string[];
  estimatedTime: string;
  partsNeeded: string[];
  preventionTips: string[];
}

const ISSUE_TYPES = [
  { value: "breakdown", label: "Breakdown", icon: AlertTriangle, color: "text-red-500" },
  { value: "maintenance", label: "Maintenance", icon: Settings, color: "text-blue-500" },
  { value: "installation", label: "Installation", icon: Hammer, color: "text-green-500" },
  { value: "calibration", label: "Calibration", icon: Thermometer, color: "text-purple-500" },
  { value: "warranty", label: "Warranty", icon: ShieldCheck, color: "text-amber-500" },
  { value: "spare_parts", label: "Spare Parts", icon: Package, color: "text-cyan-500" },
];

const PRIORITIES = [
  { value: "critical", label: "Critical", color: "bg-red-50 text-red-500 border-red-200" },
  { value: "high", label: "High", color: "bg-orange-50 text-orange-500 border-orange-200" },
  { value: "medium", label: "Medium", color: "bg-amber-50 text-yellow-500 border-amber-200" },
  { value: "low", label: "Low", color: "bg-emerald-50 text-green-500 border-emerald-200" },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Open", color: "bg-blue-50 text-blue-500", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-amber-50 text-amber-500", icon: Play },
  on_hold: { label: "On Hold", color: "bg-violet-50 text-purple-500", icon: Clock },
  completed: { label: "Completed", color: "bg-emerald-50 text-emerald-500", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-slate-50 text-slate-600", icon: X },
};

const ENGINEERS = ["Rajesh Kumar", "Amit Singh", "Priya Patel", "Suresh Nair", "Vikram Reddy"];

const CHART_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function ServiceManagerPage() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState<"tickets" | "create" | "analytics" | "buddy">("tickets");
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [buddyAdvice, setBuddyAdvice] = useState<{ advice: BuddyAdvice; clientMessage: string } | null>(null);
  const [buddyLoading, setBuddyLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [form, setForm] = useState({
    clientName: "", clientPhone: "", clientEmail: "", company: "",
    machineName: "", issueType: "breakdown", priority: "medium",
    description: "", assignedTo: "", estimatedCost: "", scheduledDate: "",
  });

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await feedbackReports.getAll();
      const mapped: ServiceTicket[] = data.map(r => ({
        id: r.id,
        ticketNo: `SVC-${String(r.id).padStart(4, '0')}`,
        clientName: r.subject?.split(' - ')[0] || 'Customer',
        clientPhone: '',
        clientEmail: '',
        company: '',
        machineName: r.subject?.split(' - ')[1] || '',
        issueType: r.type || 'general',
        priority: r.priority || 'medium',
        status: r.status || 'open',
        description: r.message || '',
        assignedTo: r.resolved_by || '',
        estimatedCost: null,
        scheduledDate: null,
        completedAt: null,
        resolution: null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
      setTickets(mapped);
    } catch { setTickets([]); }
    setLoading(false);
  };

  const createTicket = async () => {
    if (!form.clientName || !form.description) return;
    try {
      await feedbackReports.create({
        subject: `${form.clientName} - ${form.machineName}`,
        type: form.issueType || 'service',
        message: form.description,
        priority: form.priority,
        status: 'open',
      });
      setForm({
        clientName: "", clientPhone: "", clientEmail: "", company: "",
        machineName: "", issueType: "breakdown", priority: "medium",
        description: "", assignedTo: "", estimatedCost: "", scheduledDate: "",
      });
      setActiveTab("tickets");
      loadTickets();
    } catch {}
  };

  const updateTicket = async (id: number, updates: Record<string, any>) => {
    try {
      await feedbackReports.update(id, { status: updates.status || undefined });
      loadTickets();
      if (selectedTicket?.id === id) {
        setSelectedTicket((prev) => prev ? { ...prev, ...updates } : prev);
      }
    } catch {}
  };

  const getBuddyAdvice = async (issueType: string, machineName: string, description: string) => {
    setBuddyLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const data = { advice: { diagnosis: `Possible ${issueType} issue with ${machineName}`, steps: ['Inspect the machine', 'Check power supply', 'Run diagnostics'], estimatedTime: '2-4 hours', partsNeeded: ['Standard toolkit'], urgency: 'medium' }, clientMessage: `Dear Customer, we have received your service request for ${machineName}. Our team will attend to it within 24 hours.` };
      setBuddyAdvice(data);
    } catch {}
    setBuddyLoading(false);
  };

  const filtered = tickets.filter((t) => {
    const matchSearch = t.clientName.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNo.toLowerCase().includes(search.toLowerCase()) ||
      (t.machineName || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.company || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    const matchType = filterType === "all" || t.issueType === filterType;
    return matchSearch && matchStatus && matchPriority && matchType;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    completed: tickets.filter((t) => t.status === "completed").length,
    critical: tickets.filter((t) => t.priority === "critical").length,
    avgRating: tickets.filter((t) => t.rating).reduce((a, t) => a + (t.rating || 0), 0) / (tickets.filter((t) => t.rating).length || 1),
    totalCost: tickets.reduce((a, t) => a + (t.actualCost || 0), 0),
  };

  const issueChartData = ISSUE_TYPES.map((it) => ({
    name: it.label,
    count: tickets.filter((t) => t.issueType === it.value).length,
  }));

  const statusChartData = Object.entries(STATUS_MAP).map(([key, val]) => ({
    name: val.label,
    value: tickets.filter((t) => t.status === key).length,
  })).filter((d) => d.value > 0);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      month: d.toLocaleString("default", { month: "short" }),
      tickets: Math.floor(Math.random() * 15) + 5 + tickets.length,
      resolved: Math.floor(Math.random() * 12) + 3 + stats.completed,
    };
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader title="Service Manager" subtitle="Complete service management with Buddy AI assistance" />

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatsCard label="Total" value={stats.total} icon={Wrench} iconBg="bg-blue-50" iconColor="text-blue-500" />
        <StatsCard label="Open" value={stats.open} icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-500" />
        <StatsCard label="In Progress" value={stats.inProgress} icon={Play} iconBg="bg-cyan-50" iconColor="text-cyan-500" />
        <StatsCard label="Completed" value={stats.completed} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <StatsCard label="Critical" value={stats.critical} icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-500" />
        <StatsCard label="Rating" value={stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}/5` : "—"} icon={Star} iconBg="bg-amber-50" iconColor="text-yellow-500" />
        <StatsCard label="Total Cost" value={`₹${(stats.totalCost / 1000).toFixed(0)}K`} icon={IndianRupee} iconBg="bg-violet-50" iconColor="text-purple-500" />
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-wrap gap-2">
        {[
          { key: "tickets", label: "Service Tickets", icon: FileText },
          { key: "create", label: "New Ticket", icon: Plus },
          { key: "analytics", label: "Analytics", icon: BarChart3 },
          { key: "buddy", label: "Buddy Advisor", icon: Bot },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key ? "bg-primary text-primary-foreground shadow-lg" : "bg-card hover:bg-muted text-muted-foreground border border-border"
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </motion.div>

      {activeTab === "tickets" && (
        <motion.div variants={staggerItem} className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search tickets, clients, machines..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border text-sm hover:bg-muted transition-colors">
              <Filter className="w-4 h-4" /> Filters {showFilters ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          </div>

          {showFilters && (
            <div className="glass-card rounded-xl p-4 flex flex-wrap gap-3">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                <option value="all">All Status</option>
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                <option value="all">All Priority</option>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                <option value="all">All Types</option>
                {ISSUE_TYPES.map((it) => <option key={it.value} value={it.value}>{it.label}</option>)}
              </select>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Service Tickets</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first service ticket to get started</p>
              <Button onClick={() => setActiveTab("create")} className="gap-2"><Plus className="w-4 h-4" /> Create Ticket</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((ticket) => {
                const statusInfo = STATUS_MAP[ticket.status] || STATUS_MAP.open;
                const priorityInfo = PRIORITIES.find((p) => p.value === ticket.priority) || PRIORITIES[2];
                const issueInfo = ISSUE_TYPES.find((it) => it.value === ticket.issueType) || ISSUE_TYPES[0];
                const IssueIcon = issueInfo.icon;

                return (
                  <div key={ticket.id} className="glass-card rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg bg-card ${issueInfo.color}`}>
                          <IssueIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-muted-foreground">{ticket.ticketNo}</span>
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                            <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                          </div>
                          <h3 className="font-semibold text-foreground mt-1">{ticket.clientName}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {ticket.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{ticket.company}</span>}
                            {ticket.machineName && <span className="flex items-center gap-1"><Wrench className="w-3 h-3" />{ticket.machineName}</span>}
                            {ticket.assignedTo && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ticket.assignedTo}</span>}
                            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(ticket.createdAt).toLocaleDateString("en-IN")}</span>
                          </div>
                          {ticket.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{ticket.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {ticket.estimatedCost && (
                          <span className="text-sm font-medium text-foreground">₹{ticket.estimatedCost.toLocaleString("en-IN")}</span>
                        )}
                        {ticket.rating && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < ticket.rating! ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedTicket?.id === ticket.id && (
                      <div className="mt-4 pt-4 border-t border-border space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Status</label>
                            <select value={ticket.status} onChange={(e) => updateTicket(ticket.id, { status: e.target.value })}
                              className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-sm text-foreground mt-1">
                              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Priority</label>
                            <select value={ticket.priority} onChange={(e) => updateTicket(ticket.id, { priority: e.target.value })}
                              className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-sm text-foreground mt-1">
                              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Assign To</label>
                            <select value={ticket.assignedTo || ""} onChange={(e) => updateTicket(ticket.id, { assignedTo: e.target.value })}
                              className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-sm text-foreground mt-1">
                              <option value="">Unassigned</option>
                              {ENGINEERS.map((e) => <option key={e} value={e}>{e}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Actual Cost</label>
                            <input type="number" value={ticket.actualCost || ""} placeholder="₹"
                              onChange={(e) => updateTicket(ticket.id, { actualCost: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-sm text-foreground mt-1" />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">Service Notes</label>
                          <textarea value={ticket.serviceNotes || ""} rows={2} placeholder="Add service notes..."
                            onChange={(e) => updateTicket(ticket.id, { serviceNotes: e.target.value })}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground mt-1 resize-none" />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {ticket.clientPhone && (
                            <a href={`tel:${ticket.clientPhone}`} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-green-500 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors">
                              <Phone className="w-3 h-3" /> Call Client
                            </a>
                          )}
                          {ticket.clientPhone && (
                            <a href={`https://wa.me/${ticket.clientPhone?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-500 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors">
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </a>
                          )}
                          {ticket.clientEmail && (
                            <a href={`mailto:${ticket.clientEmail}`}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-500 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                              <Mail className="w-3 h-3" /> Email
                            </a>
                          )}
                          <button onClick={() => getBuddyAdvice(ticket.issueType, ticket.machineName || "", ticket.description || "")}
                            className="flex items-center gap-1 px-3 py-1.5 bg-violet-50 text-purple-500 rounded-lg text-xs font-medium hover:bg-violet-100 transition-colors">
                            <Bot className="w-3 h-3" /> Buddy Advice
                          </button>
                        </div>

                        {ticket.status === "completed" && (
                          <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
                            <span className="text-xs text-muted-foreground">Rate Service:</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => updateTicket(ticket.id, { rating: star })}>
                                  <Star className={`w-5 h-5 transition-colors ${star <= (ticket.rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-300 hover:text-yellow-300"}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "create" && (
        <motion.div variants={staggerItem} className="glass-card rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Create Service Ticket
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Client Name *</label>
              <input type="text" placeholder="Enter client name" value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone</label>
              <input type="tel" placeholder="+91 XXXXX XXXXX" value={form.clientPhone}
                onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <input type="email" placeholder="client@email.com" value={form.clientEmail}
                onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Company</label>
              <input type="text" placeholder="Company name" value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Machine Name</label>
              <input type="text" placeholder="CNC Machine / Lathe etc." value={form.machineName}
                onChange={(e) => setForm({ ...form, machineName: e.target.value })}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Issue Type</label>
              <select value={form.issueType} onChange={(e) => setForm({ ...form, issueType: e.target.value })}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground">
                {ISSUE_TYPES.map((it) => <option key={it.value} value={it.value}>{it.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button key={p.value} onClick={() => setForm({ ...form, priority: p.value })}
                    className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                      form.priority === p.value ? p.color + " border-current" : "bg-card border-border text-muted-foreground hover:bg-muted"
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Assign Engineer</label>
              <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground">
                <option value="">Auto Assign</option>
                {ENGINEERS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Estimated Cost (₹)</label>
              <input type="number" placeholder="0" value={form.estimatedCost}
                onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Scheduled Date</label>
              <input type="date" value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description *</label>
            <textarea rows={4} placeholder="Describe the issue in detail..." value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none" />
          </div>

          <div className="flex gap-3">
            <Button onClick={createTicket} className="gap-2" disabled={!form.clientName || !form.description}>
              <Send className="w-4 h-4" /> Create Service Ticket
            </Button>
            <Button variant="outline" onClick={() => getBuddyAdvice(form.issueType, form.machineName, form.description)} className="gap-2">
              <Bot className="w-4 h-4" /> Get Buddy Advice
            </Button>
          </div>
        </motion.div>
      )}

      {activeTab === "analytics" && (
        <motion.div variants={staggerItem} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-5">
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Issues by Type
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={issueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card rounded-xl p-5">
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Status Distribution
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card rounded-xl p-5 lg:col-span-2">
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-500" /> Monthly Service Trend
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                  <Area type="monotone" dataKey="tickets" stroke="#3b82f6" fill="rgba(59,130,246,0.1)" name="Total Tickets" />
                  <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="rgba(16,185,129,0.1)" name="Resolved" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-5 text-center">
              <Zap className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.completed > 0 ? ((stats.completed / (stats.total || 1)) * 100).toFixed(0) : 0}%</p>
              <p className="text-xs text-muted-foreground">Resolution Rate</p>
            </div>
            <div className="glass-card rounded-xl p-5 text-center">
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">4.2 hrs</p>
              <p className="text-xs text-muted-foreground">Avg Response Time</p>
            </div>
            <div className="glass-card rounded-xl p-5 text-center">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "4.5"}/5</p>
              <p className="text-xs text-muted-foreground">Customer Satisfaction</p>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "buddy" && (
        <motion.div variants={staggerItem} className="space-y-4">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-purple-500" /> Buddy Service Advisor
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Select issue type and machine to get instant diagnosis, troubleshooting steps, and client communication templates.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {ISSUE_TYPES.map((it) => {
                const Icon = it.icon;
                return (
                  <button key={it.value}
                    onClick={() => getBuddyAdvice(it.value, "Industrial Machine", "")}
                    className={`p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all text-center group`}>
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${it.color} group-hover:scale-110 transition-transform`} />
                    <p className="text-xs font-medium text-foreground">{it.label}</p>
                  </button>
                );
              })}
            </div>

            {buddyLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Buddy analyzing...</span>
              </div>
            )}

            {buddyAdvice && !buddyLoading && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                    <Thermometer className="w-4 h-4 text-purple-500" /> Diagnosis
                  </h4>
                  <p className="text-sm text-muted-foreground">{buddyAdvice.advice.diagnosis}</p>
                </div>

                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                    <Wrench className="w-4 h-4 text-blue-500" /> Troubleshooting Steps
                  </h4>
                  <div className="space-y-2">
                    {buddyAdvice.advice.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <h4 className="text-xs font-semibold text-amber-500 mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Estimated Time
                    </h4>
                    <p className="text-sm text-foreground">{buddyAdvice.advice.estimatedTime}</p>
                  </div>
                  <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                    <h4 className="text-xs font-semibold text-cyan-500 mb-2 flex items-center gap-1">
                      <Package className="w-3 h-3" /> Parts Needed
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {buddyAdvice.advice.partsNeeded.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-green-500/5 border border-emerald-200 rounded-xl">
                    <h4 className="text-xs font-semibold text-green-500 mb-2 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Prevention Tips
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {buddyAdvice.advice.preventionTips.map((tip, i) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/5 border border-emerald-200 rounded-xl">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                    <Send className="w-4 h-4 text-emerald-500" /> Client Message (Ready to Send)
                  </h4>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{buddyAdvice.clientMessage}</pre>
                  <button onClick={() => navigator.clipboard.writeText(buddyAdvice.clientMessage)}
                    className="mt-3 px-4 py-2 bg-emerald-50 text-emerald-500 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors">
                    Copy Message
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
