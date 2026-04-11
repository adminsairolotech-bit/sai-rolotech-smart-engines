import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard } from "@/components/shared";
import {
  KanbanSquare, Users, DollarSign, Target, Loader2, RefreshCw,
  Phone, Mail, MapPin, Building2, MessageSquare, Plus,
  X, Trash2, Clock, ExternalLink, History, ChevronRight, FileText,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { leads as leadsService, leadActivities, leadTasks } from "@/lib/dataService";
import { toast } from "@/hooks/use-toast";
import type { Lead, LeadActivity, LeadTask } from "@/lib/supabase";

interface LeadCard {
  id: number;
  name: string;
  company: string;
  machine: string;
  value: string;
  valueNumber: number;
  daysInStage: number;
  phone: string;
  source: string;
}

type Stage = "new_lead" | "contacted" | "quotation_sent" | "negotiating" | "won" | "lost";

const stageConfig: Record<Stage, { label: string; color: string; bgColor: string }> = {
  new_lead: { label: "New Lead", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  contacted: { label: "Contacted", color: "text-cyan-700", bgColor: "bg-cyan-50 border-cyan-200" },
  quotation_sent: { label: "Quotation Sent", color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200" },
  negotiating: { label: "Negotiation", color: "text-violet-600", bgColor: "bg-violet-50 border-violet-200" },
  won: { label: "Won", color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200" },
  lost: { label: "Lost", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
};

const stages: Stage[] = ["new_lead", "contacted", "quotation_sent", "negotiating", "won", "lost"];

const emptyPipeline: Record<Stage, LeadCard[]> = {
  new_lead: [], contacted: [], quotation_sent: [], negotiating: [], won: [], lost: [],
};

const activityTypeConfig: Record<string, { icon: typeof MessageSquare; color: string; bg: string }> = {
  call: { icon: Phone, color: "text-blue-600", bg: "bg-blue-50" },
  whatsapp: { icon: MessageSquare, color: "text-green-600", bg: "bg-green-50" },
  email: { icon: Mail, color: "text-purple-600", bg: "bg-purple-50" },
  meeting: { icon: Building2, color: "text-violet-600", bg: "bg-violet-50" },
  note: { icon: History, color: "text-slate-600", bg: "bg-slate-50" },
  default: { icon: Clock, color: "text-gray-600", bg: "bg-gray-50" },
};

const emptyForm = { type: "note", title: "", description: "" };

/* ─── Lead Detail Modal ─────────────────────────────────── */
function LeadDetailModal({
  leadId, onClose, onRefresh,
}: {
  leadId: number;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [tasks, setTasks] = useState<LeadTask[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "activities" | "tasks">("info");
  const [loading, setLoading] = useState(true);
  const [savingActivity, setSavingActivity] = useState(false);
  const [actForm, setActForm] = useState({ ...emptyForm });

  useEffect(() => {
    async function load() {
      try {
        const [leadData, actData, taskData] = await Promise.all([
          leadsService.getById(leadId),
          leadActivities.getAll(leadId),
          leadTasks.getAll({ lead_id: leadId }),
        ]);
        setLead(leadData);
        setActivities(actData);
        setTasks(taskData);
      } catch {
        toast({ title: "Error loading lead", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [leadId]);

  async function addActivity() {
    if (!actForm.title.trim()) {
      toast({ title: "Activity title required", variant: "destructive" }); return;
    }
    setSavingActivity(true);
    try {
      const created = await leadActivities.create({
        lead_id: leadId,
        type: actForm.type,
        title: actForm.title,
        description: actForm.description || null,
        created_by: "Admin",
      });
      setActivities(prev => [created, ...prev]);
      await leadsService.update(leadId, { last_activity_at: new Date().toISOString() });
      setActForm({ ...emptyForm });
      toast({ title: "Activity added!" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSavingActivity(false);
    }
  }

  async function deleteActivity(id: number) {
    if (!confirm("Delete this activity?")) return;
    try {
      const { leadActivities: la } = await import("@/lib/dataService");
      await la.delete(id);
      setActivities(prev => prev.filter(a => a.id !== id));
      toast({ title: "Activity deleted" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }

  function openWhatsApp() {
    if (!lead) return;
    const msg = encodeURIComponent(
      `Namaste ${lead.name}!\n\nSAI RoloTech se bol rahe hai. Aapke inquiry ke baare mein baat karni thi.\n\nMachine: ${lead.machine_interest}\n\nKoi question ho toh bataiye — +91-9899925274`
    );
    window.open(`https://wa.me/${lead.phone?.replace(/\D/g, "")}?text=${msg}`, "_blank");
  }

  if (!lead && !loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Lead Detail</p>
              <h2 className="text-base font-bold">{loading ? "..." : lead?.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              {lead?.phone && (
                <button onClick={openWhatsApp}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            {([
              { id: "info", l: "📋 Info" },
              { id: "activities", l: "📝 Activities", count: activities.length },
              { id: "tasks", l: "✅ Tasks", count: tasks.length },
            ] as const).map(t => (
              <button key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all flex items-center gap-1
                  ${activeTab === t.id ? "bg-white text-gray-800" : "bg-white/20 text-white"}`}>
                {t.l}
                {"count" in t && t.count !== undefined && t.count > 0 && (
                  <span className="bg-white/30 text-[10px] px-1.5 py-0.5 rounded-full">{t.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 120px)" }}>
          <div className="p-4">

            {/* Info Tab */}
            {activeTab === "info" && lead && (
              <div className="space-y-3">
                {[
                  { icon: Phone, label: "Phone", value: lead.phone || "—" },
                  { icon: Mail, label: "City", value: lead.city || "—" },
                  { icon: Building2, label: "Source", value: lead.source || "—" },
                  { icon: MapPin, label: "Machine Interest", value: lead.machine_interest || "—" },
                  { icon: DollarSign, label: "Budget", value: lead.budget || "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
                {lead.notes && (
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-[10px] text-amber-600 font-medium mb-1">Notes</p>
                    <p className="text-sm text-amber-800">{lead.notes}</p>
                  </div>
                )}
                {lead.call_notes && (
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-[10px] text-blue-600 font-medium mb-1">Call Notes</p>
                    <p className="text-sm text-blue-800">{lead.call_notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === "activities" && (
              <div className="space-y-4">
                {/* Add activity form */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-foreground">➕ New Activity</p>
                  <div className="flex gap-2">
                    {["call", "whatsapp", "email", "meeting", "note"].map(t => (
                      <button key={t}
                        onClick={() => setActForm(p => ({ ...p, type: t }))}
                        className={`text-[10px] px-2 py-1 rounded-full font-medium transition-all ${
                          actForm.type === t
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <input
                    value={actForm.title}
                    onChange={e => setActForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Activity title (e.g. Call kiya, price discuss kiya...)"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                  <textarea
                    value={actForm.description}
                    onChange={e => setActForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Details (optional)"
                    rows={2}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={addActivity}
                    disabled={savingActivity}
                    className="w-full py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {savingActivity ? "Adding..." : "Add Activity"}
                  </button>
                </div>

                {/* Activity list */}
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Koi activity nahi — upar se add karein</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activities.map(act => {
                      const cfg = activityTypeConfig[act.type] || activityTypeConfig["default"];
                      const ActIcon = cfg.icon;
                      return (
                        <div key={act.id} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                            <ActIcon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-semibold text-foreground">{act.title}</p>
                              <Badge variant="outline" className="text-[9px]">{act.type}</Badge>
                            </div>
                            {act.description && (
                              <p className="text-[11px] text-muted-foreground">{act.description}</p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(act.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              {act.created_by && ` · ${act.created_by}`}
                            </p>
                          </div>
                          <button onClick={() => deleteActivity(act.id)}
                            className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === "tasks" && (
              <div className="space-y-3">
                {/* Inline add task form */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-blue-800 mb-2">➕ Create Task for this Lead</p>
                  <div className="space-y-2">
                    <input
                      id="modal-task-title"
                      placeholder="e.g. Follow-up call tomorrow 3pm"
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="date"
                        id="modal-task-due"
                        className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <select id="modal-task-priority"
                        className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs focus:outline-none">
                        <option value="high">High</option>
                        <option value="medium" selected>Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <button
                      id="modal-create-task"
                      onClick={async () => {
                        const titleEl = document.getElementById("modal-task-title") as HTMLInputElement;
                        const dueEl = document.getElementById("modal-task-due") as HTMLInputElement;
                        const priorityEl = document.getElementById("modal-task-priority") as HTMLSelectElement;
                        if (!titleEl?.value.trim()) { toast({ title: "Task title required", variant: "destructive" }); return; }
                        const btn = document.getElementById("modal-create-task") as HTMLButtonElement;
                        btn.disabled = true; btn.textContent = "Creating…";
                        try {
                          const { leadTasks: lt } = await import("@/lib/dataService");
                          const created = await lt.create({
                            lead_id: leadId,
                            title: titleEl.value.trim(),
                            due_date: dueEl.value || null,
                            priority: priorityEl.value,
                            status: "pending",
                            assigned_to: "Sales Team",
                          });
                          setTasks(prev => [created, ...prev]);
                          titleEl.value = ""; dueEl.value = "";
                          toast({ title: "Task created!" });
                        } catch { toast({ title: "Error creating task", variant: "destructive" }); }
                        finally { btn.disabled = false; btn.textContent = "Create Task"; }
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50">
                      Create Task
                    </button>
                  </div>
                </div>

                {tasks.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Target className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No tasks yet — create one above</p>
                  </div>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className="bg-white border border-gray-100 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{task.title}</p>
                        <Badge className={`text-[10px] ${
                          task.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                          task.status === "in_progress" ? "bg-amber-50 text-amber-700" :
                          "bg-gray-50 text-gray-600"
                        }`}>
                          {task.status}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                      )}
                      {task.due_date && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          Due: {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  ))
                )}
                <Button
                  size="sm"
                  className="w-full gap-1"
                  onClick={() => { onClose(); window.location.href = "/sales-tasks"; }}>
                  <Plus className="w-3 h-3" /> Go to Tasks Page
                </Button>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          {lead && (
            <div className="p-4 border-t border-border/50 bg-gray-50/50">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Actions</p>
              <div className="flex gap-2 flex-wrap">
                {lead.phone && (
                  <>
                    <a href={`tel:${lead.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors">
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                    <button onClick={openWhatsApp}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    // Store lead data for quotation maker
                    localStorage.setItem("sai_pending_quote_item", JSON.stringify({
                      leadId: lead.id, name: lead.name, phone: lead.phone,
                      email: lead.email, company: (lead as any).company_name || "",
                      machineInterest: lead.machine_interest,
                    }));
                    onClose();
                    toast({ title: "Lead selected — opening Quotation Maker" });
                    window.location.href = "/quotation-maker";
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors">
                  <FileText className="w-3.5 h-3.5" /> Create Quote
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Pipeline ─────────────────────────────────────── */
export default function SalesPipelineLivePage() {
  const [leads, setLeads] = useState(emptyPipeline);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingLeadId, setSavingLeadId] = useState<number | null>(null);
  const [draggedLead, setDraggedLead] = useState<{ lead: LeadCard; fromStage: Stage } | null>(null);
  const [dropTarget, setDropTarget] = useState<Stage | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const loadLeads = useCallback(async (showToast = false) => {
    try {
      showToast ? setRefreshing(true) : setLoading(true);
      const allLeads = await leadsService.getAll();
      const grouped: Record<Stage, LeadCard[]> = {
        new_lead: [], contacted: [], quotation_sent: [], negotiating: [], won: [], lost: [],
      };

      allLeads.forEach((leadRecord) => {
        const stage = (leadRecord.pipeline_stage || "new_lead") as Stage;
        const daysInStage = leadRecord.created_at
          ? Math.max(1, Math.floor((Date.now() - new Date(leadRecord.created_at).getTime()) / 86400000))
          : 1;
        const valueNumber = parseFloat(String(leadRecord.budget || "0").replace(/[^\d.]/g, "")) || 0;
        const lead: LeadCard = {
          id: leadRecord.id,
          name: leadRecord.name,
          company: leadRecord.city || "",
          machine: leadRecord.machine_interest || "General",
          value: leadRecord.budget || "₹0",
          valueNumber,
          daysInStage,
          phone: leadRecord.phone || "",
          source: leadRecord.source || "",
        };
        if (grouped[stage]) grouped[stage].push(lead);
        else grouped.new_lead.push(lead);
      });

      setLeads(grouped);
      if (showToast) toast({ title: "Pipeline refreshed", description: `${allLeads.length} live leads loaded` });
    } catch {
      setLeads(emptyPipeline);
      if (showToast) toast({ title: "Pipeline refresh failed", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const handleDragStart = useCallback((lead: LeadCard, fromStage: Stage) => {
    setDraggedLead({ lead, fromStage });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stage: Stage) => {
    e.preventDefault();
    setDropTarget(stage);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, toStage: Stage) => {
    e.preventDefault();
    setDropTarget(null);
    if (!draggedLead || draggedLead.fromStage === toStage) { setDraggedLead(null); return; }

    const leadToMove = draggedLead.lead;
    const fromStage = draggedLead.fromStage;

    setLeads(prev => {
      const updated = { ...prev };
      updated[fromStage] = prev[fromStage].filter(lead => lead.id !== leadToMove.id);
      updated[toStage] = [...prev[toStage], { ...leadToMove, daysInStage: 0 }];
      return updated;
    });

    setSavingLeadId(leadToMove.id);
    try {
      await leadsService.update(leadToMove.id, { pipeline_stage: toStage, status: toStage });
      toast({ title: "Pipeline updated", description: `${leadToMove.name} → ${stageConfig[toStage].label}` });
    } catch {
      setLeads(prev => {
        const updated = { ...prev };
        updated[toStage] = prev[toStage].filter(lead => lead.id !== leadToMove.id);
        updated[fromStage] = [...prev[fromStage], { ...leadToMove }];
        return updated;
      });
      toast({ title: "Stage update failed", variant: "destructive" });
    } finally {
      setSavingLeadId(null);
      setDraggedLead(null);
    }
  }, [draggedLead]);

  const flattened = useMemo(() => Object.values(leads).flat(), [leads]);
  const totalLeads = flattened.length;
  const totalValue = flattened.reduce((sum, lead) => sum + lead.valueNumber, 0);
  const wonLeads = leads.won.length;
  const conversion = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0.0";

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    const result: Record<Stage, LeadCard[]> = { new_lead: [], contacted: [], quotation_sent: [], negotiating: [], won: [], lost: [] };
    (Object.keys(leads) as Stage[]).forEach(stage => {
      result[stage] = leads[stage].filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.machine.toLowerCase().includes(q)
      );
    });
    return result;
  }, [leads, search]);

  const searchCount = search ? Object.values(filteredLeads).flat().length : null;

  return (
    <>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
        <PageHeader
          title="Sales Pipeline"
          subtitle="Live Kanban board — drag to move, click to open lead detail"
          actions={(
            <button onClick={() => loadLeads(true)} disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          )}
        />

        <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Leads" value={totalLeads} icon={Users} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
          <StatsCard label="Pipeline Value" value={`₹${(totalValue / 10000000).toFixed(2)}Cr`} icon={DollarSign} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
          <StatsCard label="Won Leads" value={wonLeads} icon={Target} iconBg="bg-purple-500/10" iconColor="text-purple-500" />
          <StatsCard label="Conversion" value={`${conversion}%`} icon={KanbanSquare} iconBg="bg-amber-500/10" iconColor="text-amber-500" />
        </motion.div>

        {/* Search bar */}
        <motion.div variants={staggerItem} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads by name, phone, company, machine…"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          {searchCount !== null && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none pr-6">
              {searchCount} found
            </span>
          )}
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading live pipeline...
          </div>
        ) : (
          <motion.div variants={staggerItem} className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const config = stageConfig[stage];
              const stageLeads = filteredLeads[stage];
              const isDropping = dropTarget === stage;

              return (
                <div key={stage} className="min-w-[280px] flex-shrink-0"
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage)}>
                  <div className={`rounded-xl border ${config.bgColor} p-3 mb-3`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-semibold ${config.color}`}>{config.label}</h3>
                      <Badge variant="outline" className="text-xs">{stageLeads.length}</Badge>
                    </div>
                  </div>
                  <div className={`space-y-3 min-h-[100px] rounded-xl p-2 transition-colors ${
                    isDropping ? "bg-primary/5 border-2 border-dashed border-primary/30" : "border-2 border-transparent"
                  }`}>
                    {stageLeads.map((lead) => (
                      <div key={lead.id}>
                        <div
                          draggable
                          onDragStart={() => handleDragStart(lead, stage)}
                          onClick={() => setSelectedLeadId(lead.id)}
                          className={`glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all
                            ${draggedLead?.lead.id === lead.id ? "opacity-40 scale-95" : ""}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">{lead.value}</Badge>
                              {lead.source && (
                                <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[9px]">{lead.source}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2 bg-slate-50 rounded-lg px-2.5 py-1.5">
                            {lead.phone ? (
                              <>
                                <Phone className="w-3 h-3 text-blue-500 shrink-0" />
                                <span className="text-xs text-foreground font-mono flex-1 truncate">{lead.phone}</span>
                                <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
                                  className="p-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors shrink-0">
                                  <Phone className="w-3 h-3" />
                                </a>
                              </>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">No phone</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 truncate">{lead.machine}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">{lead.daysInStage}d</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-primary flex items-center gap-0.5">Details <ChevronRight className="w-2.5 h-2.5" /></span>
                              {savingLeadId === lead.id && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="text-center py-6 text-xs text-muted-foreground border-2 border-dashed border-gray-200 rounded-xl">
                        Drop leads here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedLeadId && (
          <LeadDetailModal
            leadId={selectedLeadId}
            onClose={() => { setSelectedLeadId(null); loadLeads(); }}
            onRefresh={loadLeads}
          />
        )}
      </AnimatePresence>
    </>
  );
}
