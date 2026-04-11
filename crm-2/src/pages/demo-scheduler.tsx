import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard } from "@/components/shared";
import {
  CalendarDays, Clock, CheckCircle2, XCircle, MapPin, Plus,
  Phone, User, Cog, Building2, StickyNote, Trash2, ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { demos, leads } from "@/lib/dataService";
import type { Demo, Lead } from "@/lib/supabase";

const locationConfig: Record<string, { color: string; label: string }> = {
  factory: { color: "bg-blue-50 text-blue-600 border-blue-200", label: "🏭 Factory" },
  customer: { color: "bg-purple-50 text-purple-600 border-purple-200", label: "🏢 Customer Site" },
  video: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "📹 Video Call" },
};

const statusConfig: Record<string, { color: string; icon: typeof CalendarDays; label: string }> = {
  scheduled: { color: "bg-blue-50 text-blue-600 border-blue-200", icon: CalendarDays, label: "Scheduled" },
  completed:  { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Completed" },
  cancelled: { color: "bg-red-50 text-red-600 border-red-200", icon: XCircle, label: "Cancelled" },
};

const MACHINES = [
  "Shutter Patti Machine (Basic)", "Shutter Patti Machine (Semi-Auto)", "Shutter Patti Machine (Full-Auto)",
  "False Ceiling Machine (Semi-Auto)", "False Ceiling Machine (Full-Auto)",
  "Z Purlin Roll Forming Machine", "C Purlin Machine", "Aluminium Profile Machine",
  "Side Channel Machine", "Bottom Channel Machine", "Custom Profile Machine",
];

const emptyForm = {
  company_name: "", contact_name: "", phone: "", machine_interest: MACHINES[0],
  demo_date: "", demo_time: "10:00 AM", demo_type: "factory" as Demo["demo_type"],
  location_detail: "", notes: "", lead_id: null as number | null,
};

export default function DemoSchedulerPage() {
  const [allDemos, setAllDemos] = useState<Demo[]>([]);
  const [leadList, setLeadList] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [d, l] = await Promise.all([
        demos.getAll(),
        leads.getAll(),
      ]);
      setAllDemos(d);
      setLeadList(l);
    } catch {
      toast({ title: "Data load error", description: "Supabase se data nahi aa raha", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const upcoming = allDemos.filter(d => d.status === "scheduled");
  const past = allDemos.filter(d => d.status !== "scheduled");

  const totalScheduled = allDemos.filter(d => d.status === "scheduled").length;
  const totalCompleted = allDemos.filter(d => d.status === "completed").length;
  const thisMonth = allDemos.filter(d => {
    const now = new Date();
    const md = new Date(d.demo_date);
    return md.getMonth() === now.getMonth() && md.getFullYear() === now.getFullYear();
  }).length;
  const conversion = totalCompleted > 0 && totalScheduled + totalCompleted > 0
    ? Math.round((totalCompleted / (totalScheduled + totalCompleted)) * 100) + "%"
    : "0%";

  function handleLeadSelect(leadId: string) {
    const id = parseInt(leadId);
    if (id && !isNaN(id)) {
      const lead = leadList.find(l => l.id === id);
      if (lead) {
        setForm(p => ({
          ...p,
          lead_id: lead.id,
          company_name: lead.name,
          contact_name: lead.name,
          phone: lead.phone || "",
          machine_interest: lead.machine_interest || MACHINES[0],
        }));
      }
    }
  }

  async function scheduleDemo() {
    if (!form.company_name || !form.contact_name || !form.demo_date) {
      toast({ title: "Company, contact aur date required", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const newDemo = await demos.create({
        company_name: form.company_name,
        contact_name: form.contact_name,
        phone: form.phone,
        machine_interest: form.machine_interest,
        demo_date: form.demo_date,
        demo_time: form.demo_time,
        demo_type: form.demo_type,
        location_detail: form.location_detail,
        notes: form.notes,
        lead_id: form.lead_id,
        status: "scheduled",
        completed_notes: null,
      });
      setAllDemos(prev => [newDemo, ...prev]);
      toast({ title: "Demo scheduled!", description: `${form.company_name} — ${form.demo_date} at ${form.demo_time}` });
      setShowForm(false);
      setForm({ ...emptyForm });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error saving demo", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function markComplete(id: number) {
    setCompleting(id);
    try {
      const notes = allDemos.find(d => d.id === id)?.notes || "Demo completed successfully";
      await demos.update(id, { status: "completed", completed_notes: notes });
      setAllDemos(prev => prev.map(d => d.id === id ? { ...d, status: "completed", completed_notes: notes } : d));
      toast({ title: "Demo completed! 🎉" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setCompleting(null);
    }
  }

  async function markCancelled(id: number) {
    try {
      await demos.update(id, { status: "cancelled" });
      setAllDemos(prev => prev.map(d => d.id === id ? { ...d, status: "cancelled" } : d));
      toast({ title: "Demo cancelled" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }

  async function deleteDemo(id: number) {
    if (!confirm("Delete this demo?")) return;
    try {
      await demos.delete(id);
      setAllDemos(prev => prev.filter(d => d.id !== id));
      toast({ title: "Demo deleted" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }

  function openWhatsApp(demo: Demo) {
    const msg = encodeURIComponent(
      `Namaste ${demo.contact_name}!\n\nYe reminder hai — aapka machine demo schedule hai:\n\n📅 Date: ${demo.demo_date}\n⏰ Time: ${demo.demo_time}\n🏭 Location: ${demo.location_detail || (demo.demo_type === "factory" ? "SAI RoloTech Factory, Mundka" : demo.demo_type === "video" ? "WhatsApp Video Call" : "Customer Site")}\n\nMachine: ${demo.machine_interest}\n\nKoi issue ho toh contact karein: +91-9899925274\n\n— SAI RoloTech`
    );
    window.open(`https://wa.me/${demo.phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  }

  const displayDemos = activeTab === "upcoming" ? upcoming : past;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader title="Demo Scheduler" subtitle="Machine demonstrations — factory visit ya video call schedule karo" />

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard label="Upcoming" value={totalScheduled} icon={CalendarDays} iconBg="bg-blue-50" iconColor="text-blue-500" />
        <StatsCard label="Completed" value={totalCompleted} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <StatsCard label="This Month" value={thisMonth} icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-500" />
        <StatsCard label="Conversion" value={conversion} icon={CheckCircle2} iconBg="bg-purple-50" iconColor="text-purple-500" />
      </motion.div>

      <motion.div variants={staggerItem}>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Schedule New Demo
        </button>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 border-l-4 border-primary">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" /> Naya Demo Schedule
          </h3>

          {leadList.length > 0 && (
            <div className="mb-4">
              <label className="text-xs font-medium text-foreground mb-1 block">🎯 Lead se Link Karein (optional)</label>
              <select onChange={e => handleLeadSelect(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <option value="">— Select Lead (auto-fill hoga) —</option>
                {leadList.map(l => (
                  <option key={l.id} value={l.id}>{l.name} · {l.phone || "No phone"} · {l.city || ""}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { label: "Company Name *", key: "company_name", placeholder: "e.g. Satpal Roofing Works" },
              { label: "Contact Name *", key: "contact_name", placeholder: "e.g. Satpal Singh" },
              { label: "Phone", key: "phone", placeholder: "+91-XXXXXXXXXX" },
              { label: "Location Detail", key: "location_detail", placeholder: "Factory address / city" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-foreground mb-1 block">{f.label}</label>
                <input value={(form as Record<string, string | null>)[f.key] || ""}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Machine *</label>
              <select value={form.machine_interest}
                onChange={e => setForm(p => ({ ...p, machine_interest: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                {MACHINES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Demo Type</label>
              <select value={form.demo_type}
                onChange={e => setForm(p => ({ ...p, demo_type: e.target.value as Demo["demo_type"] }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                <option value="factory">🏭 Factory Visit (Mundka)</option>
                <option value="customer">🏢 Customer Site</option>
                <option value="video">📹 Video Call</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Date *</label>
              <input type="date" value={form.demo_date}
                onChange={e => setForm(p => ({ ...p, demo_date: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Time</label>
              <select value={form.demo_time}
                onChange={e => setForm(p => ({ ...p, demo_time: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                {["9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-foreground mb-1 block">Notes (optional)</label>
              <input value={form.notes || ""}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Koi special requirement ya notes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={scheduleDemo} disabled={saving}
              className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Schedule Demo"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 bg-muted text-foreground text-sm rounded-xl hover:bg-muted/80 transition-colors">
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <motion.div variants={staggerItem} className="flex gap-2">
        {(["upcoming", "past"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {tab === "upcoming" ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
          </button>
        ))}
      </motion.div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading demos...</p>
          </div>
        ) : displayDemos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{activeTab === "upcoming" ? "Koi upcoming demo nahi" : "Koi past demo nahi"}</p>
          </div>
        ) : displayDemos.map(demo => {
          const StatusIcon = statusConfig[demo.status].icon;
          const d = new Date(demo.demo_date);
          const isOverdue = demo.status === "scheduled" && d < new Date(new Date().setHours(0, 0, 0, 0));
          return (
            <motion.div key={demo.id} variants={staggerItem}
              className={`glass-card rounded-2xl p-4 border transition-all ${isOverdue ? "border-amber-300 bg-amber-50/50" : demo.status === "scheduled" ? "border-border hover:border-primary/30" : "border-border/50 opacity-75"}`}>
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${isOverdue ? "bg-amber-100" : demo.status === "scheduled" ? "bg-primary/10" : "bg-muted"}`}>
                  <span className={`text-lg font-bold ${isOverdue ? "text-amber-600" : demo.status === "scheduled" ? "text-primary" : "text-muted-foreground"}`}>{d.getDate()}</span>
                  <span className={`text-xs ${isOverdue ? "text-amber-500" : demo.status === "scheduled" ? "text-primary" : "text-muted-foreground"}`}>{d.toLocaleDateString("en-IN", { month: "short" })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-foreground">{demo.company_name}</span>
                    {isOverdue && <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">⚠️ Overdue</Badge>}
                    <Badge className={`text-[10px] ${statusConfig[demo.status].color}`}>
                      <StatusIcon className="w-2.5 h-2.5 mr-1" />
                      {statusConfig[demo.status].label}
                    </Badge>
                    <Badge className={`text-[10px] ${locationConfig[demo.demo_type]?.color || "bg-gray-50 text-gray-600"}`}>{locationConfig[demo.demo_type]?.label || demo.demo_type}</Badge>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{demo.contact_name}</span>
                    {demo.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{demo.phone}</span>}
                    <span className="flex items-center gap-1"><Cog className="w-3 h-3" />{demo.machine_interest}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{demo.demo_time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{demo.location_detail || (demo.demo_type === "factory" ? "SAI RoloTech Factory, Mundka" : demo.demo_type === "video" ? "Video Call" : "Customer Site")}</span>
                  </div>
                  {(demo.notes || demo.completed_notes) && (
                    <div className="mt-2 flex items-start gap-1.5">
                      <StickyNote className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground italic">{demo.completed_notes || demo.notes}</p>
                    </div>
                  )}
                </div>
                {demo.status === "scheduled" && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => markComplete(demo.id)} disabled={completing === demo.id}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-medium rounded-xl transition-colors disabled:opacity-50">
                      {completing === demo.id ? "..." : "✓"} Done
                    </button>
                    {demo.phone && (
                      <button onClick={() => openWhatsApp(demo)}
                        className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs font-medium rounded-xl transition-colors flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> WhatsApp
                      </button>
                    )}
                    <button onClick={() => deleteDemo(demo.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-medium rounded-xl transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {demo.status !== "scheduled" && (
                  <button onClick={() => deleteDemo(demo.id)}
                    className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-medium rounded-xl transition-colors shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
