import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard, SectionCard } from "@/components/shared";
import {
  CheckSquare, Clock, AlertCircle, CheckCircle2, Circle, Plus,
  X, Trash2, Edit3, Calendar, User, Tag, Bell, XCircle,
  LayoutGrid, List,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { leadTasks, leads } from "@/lib/dataService";
import { toast } from "@/hooks/use-toast";
import type { LeadTask, Lead } from "@/lib/supabase";

const statusConfig: Record<string, { icon: typeof Circle; color: string; bgColor: string; label: string }> = {
  pending: { icon: Circle, color: "text-blue-600", bgColor: "bg-blue-50", label: "Pending" },
  in_progress: { icon: Clock, color: "text-amber-700", bgColor: "bg-amber-50", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "text-emerald-700", bgColor: "bg-emerald-50", label: "Completed" },
  overdue: { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-50", label: "Overdue" },
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-50 text-slate-600 border-slate-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-600 border-red-200",
};

const emptyForm = {
  title: "",
  description: "",
  assigned_to: "",
  due_date: "",
  status: "pending",
  priority: "medium",
  lead_id: null as number | null,
};

export default function SalesTasksPage() {
  const [tasks, setTasks] = useState<LeadTask[]>([]);
  const [leadList, setLeadList] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, l] = await Promise.all([
        leadTasks.getAll(),
        leads.getAll(),
      ]);
      setTasks(t);
      setLeadList(l);
    } catch {
      toast({ title: "Error loading tasks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const enrichedTasks = tasks.map(t => {
    let effectiveStatus = t.status;
    if (t.status === "pending" || t.status === "in_progress") {
      if (t.due_date) {
        const due = new Date(t.due_date);
        const now = new Date();
        if (due < now) effectiveStatus = "overdue";
      }
    }
    return { ...t, effectiveStatus };
  });

  const filtered = filter === "all" ? enrichedTasks : enrichedTasks.filter(t => t.effectiveStatus === filter);
  const totalTasks = enrichedTasks.length;
  const pending = enrichedTasks.filter(t => t.effectiveStatus === "pending").length;
  const inProgress = enrichedTasks.filter(t => t.effectiveStatus === "in_progress").length;
  const overdue = enrichedTasks.filter(t => t.effectiveStatus === "overdue").length;

  function openEdit(task: LeadTask) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description || "",
      assigned_to: task.assigned_to || "",
      due_date: task.due_date || "",
      status: task.status,
      priority: task.priority,
      lead_id: task.lead_id,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function saveTask() {
    if (!form.title.trim()) {
      toast({ title: "Task title required", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await leadTasks.update(editingId, {
          title: form.title,
          description: form.description || null,
          assigned_to: form.assigned_to || null,
          due_date: form.due_date || null,
          status: form.status,
          priority: form.priority,
          lead_id: form.lead_id,
        });
        setTasks(prev => prev.map(t => t.id === editingId ? updated : t));
        toast({ title: "Task updated!" });
      } else {
        const created = await leadTasks.create({
          title: form.title,
          description: form.description || null,
          assigned_to: form.assigned_to || null,
          due_date: form.due_date || null,
          status: form.status,
          priority: form.priority,
          lead_id: form.lead_id,
        });
        setTasks(prev => [created, ...prev]);
        toast({ title: "Task created!" });
      }
      closeForm();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(task: LeadTask) {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      const updated = await leadTasks.update(task.id, {
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      });
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      toast({ title: newStatus === "completed" ? "Task completed! 🎉" : "Task reopened" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }

  async function deleteTask(id: number) {
    if (!confirm("Delete this task?")) return;
    try {
      await leadTasks.delete(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast({ title: "Task deleted" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }

  function getLeadName(leadId: number | null): string {
    if (!leadId) return "—";
    const lead = leadList.find(l => l.id === leadId);
    return lead ? lead.name : `Lead #${leadId}`;
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader title="Sales Tasks" subtitle="Create, manage aur track karo sales team tasks" />

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="Total Tasks" value={totalTasks} icon={CheckSquare} iconBg="bg-blue-50" iconColor="text-blue-500" />
        <StatsCard label="Pending" value={pending} icon={Circle} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatsCard label="In Progress" value={inProgress} icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-700" />
        <StatsCard label="Overdue" value={overdue} icon={AlertCircle} iconBg="bg-red-50" iconColor="text-red-600" />
      </motion.div>

      <motion.div variants={staggerItem} className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "in_progress", "completed", "overdue"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== "all" && ` (${enrichedTasks.filter(t => t.effectiveStatus === s).length})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-muted/50"}`}
              title="List view"><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("calendar")}
              className={`p-2 rounded-md transition-colors ${viewMode === "calendar" ? "bg-background shadow-sm" : "hover:bg-muted/50"}`}
              title="Calendar view"><Calendar className="w-4 h-4" /></button>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </motion.div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <motion.div variants={staggerItem} initial="hidden" animate="visible">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2">
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const days = [];
              // Past 3 days + today + next 11 days = 15 days
              for (let i = -3; i <= 11; i++) {
                const d = new Date(today);
                d.setDate(d.getDate() + i);
                days.push(d);
              }
              return days.map(day => {
                const dayStart = day.getTime();
                const dayEnd = day.getTime() + 86400000;
                const dayTasks = filteredTasks.filter((t: any) => {
                  if (!t.due_date) return false;
                  const d = new Date(t.due_date).getTime();
                  return d >= dayStart && d < dayEnd;
                });
                const isToday = day.toDateString() === today.toDateString();
                const isPast = dayStart < today.getTime();
                return (
                  <div key={day.toISOString()}
                    className={`rounded-xl border min-h-[120px] p-2 transition-colors ${
                      isToday ? "border-primary/40 bg-primary/5" :
                      isPast ? "border-border/50 bg-slate-50/30" : "border-border"
                    }`}>
                    <div className="flex items-center gap-1 mb-2">
                      <p className={`text-[10px] font-bold ${isToday ? "text-primary" : isPast ? "text-muted-foreground" : "text-foreground"}`}>
                        {day.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                      {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.map((t: any) => (
                        <div key={t.id}
                          className={`text-[9px] p-1.5 rounded-lg border leading-tight cursor-pointer hover:opacity-80 transition-opacity ${
                            t.effectiveStatus === "completed" ? "bg-emerald-50 border-emerald-200 text-emerald-700 line-through" :
                            t.effectiveStatus === "overdue" ? "bg-red-50 border-red-200 text-red-700" :
                            "bg-blue-50 border-blue-200 text-blue-700"
                          }`}
                          onClick={() => {
                            setEditingId(t.id);
                            setForm({
                              title: t.title, description: t.description || "",
                              assigned_to: t.assigned_to || "",
                              due_date: t.due_date || "",
                              status: t.status || "pending",
                              priority: t.priority || "medium",
                              lead_id: t.lead_id || null,
                            });
                            setShowForm(true);
                          }}>
                          <p className="font-semibold truncate">{t.title}</p>
                          <p className="text-[8px] opacity-60 truncate">{t.leadName || ""}</p>
                        </div>
                      ))}
                      {dayTasks.length === 0 && (
                        <p className="text-[9px] text-muted-foreground/30 text-center py-2">—</p>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </motion.div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              {editingId ? <><Edit3 className="w-4 h-4 text-blue-600" /> Edit Task</> : <><Plus className="w-4 h-4 text-primary" /> New Task</>}
            </h3>
            <button onClick={closeForm} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-foreground mb-1 block">Task Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Follow up with Rahul for Shutter Patti quote"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            {leadList.length > 0 && (
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Link to Lead</label>
                <select value={form.lead_id ?? ""}
                  onChange={e => setForm(p => ({ ...p, lead_id: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="">— No Lead —</option>
                  {leadList.map(l => <option key={l.id} value={l.id}>{l.name} ({l.city || "no city"})</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Assigned To</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={form.assigned_to || ""}
                  onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}
                  placeholder="Admin, Sales Team..."
                  className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Due Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="date" value={form.due_date || ""}
                  onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                  className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Priority</label>
              <select value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Status</label>
              <select value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-foreground mb-1 block">Description</label>
              <textarea value={form.description || ""}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Task details ya notes..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={saveTask} disabled={saving} className="gap-1">
              {saving ? "Saving..." : editingId ? <><Edit3 className="w-4 h-4" /> Update Task</> : <><Plus className="w-4 h-4" /> Create Task</>}
            </Button>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {viewMode === "list" && (
      <SectionCard noPadding>
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading tasks...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Koi task nahi hai</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-xs text-primary font-medium hover:underline">+ New Task banao</button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(task => {
              const config = statusConfig[task.effectiveStatus] || statusConfig["pending"];
              const StatusIcon = config.icon;
              const isCompleted = task.effectiveStatus === "completed";
              return (
                <motion.div key={task.id} variants={staggerItem}
                  className={`flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors ${isCompleted ? "opacity-60" : ""}`}>
                  <button onClick={() => toggleStatus(task)}
                    className={`mt-0.5 shrink-0 ${isCompleted ? "text-emerald-500" : "text-muted-foreground hover:text-blue-600"}`}>
                    <StatusIcon className={`w-5 h-5 ${isCompleted ? "" : config.color}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </p>
                      <Badge className={priorityColors[task.priority] || "bg-slate-50 text-slate-600"}>
                        {task.priority?.toUpperCase()}
                      </Badge>
                      {task.lead_id && (
                        <Badge variant="outline" className="text-[10px]">
                          <User className="w-2.5 h-2.5 mr-0.5" />{getLeadName(task.lead_id)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {task.assigned_to && <span className="flex items-center gap-1"><User className="w-3 h-3" />{task.assigned_to}</span>}
                      {task.due_date && (
                        <span className={`flex items-center gap-1 ${task.effectiveStatus === "overdue" ? "text-red-600 font-medium" : ""}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {task.effectiveStatus === "overdue" && " ⚠️ Overdue"}
                        </span>
                      )}
                      {task.description && <span className="line-clamp-1">{task.description}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(task)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-muted-foreground hover:text-blue-600 transition-colors"
                      title="Edit task">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                      title="Delete task">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </SectionCard>
      )}
    </motion.div>
  );
}
