import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard, SectionCard } from "@/components/shared";
import {
  CalendarDays, Clock, CheckCircle2, Phone, User, MessageSquare,
  Send, MapPin, Zap, ArrowRight, Video, Building2, Trash2,
  ExternalLink, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { meetings, leads } from "@/lib/dataService";
import type { Meeting, Lead } from "@/lib/supabase";

const TIME_SLOTS = ["10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

const WA_FLOW_STEPS = [
  { day: "Day 1", msg: "Namaste sir, Sai Rolotech se bol rahe hai. Aapko machine ke options + price + demo ek hi app me mil jayega.", icon: MessageSquare, color: "bg-blue-50 text-blue-600" },
  { day: "Day 2", msg: "Sir kya aapko 5 min demo dikha dein video call par? Hamare paas 3 time slots available hain.", icon: Video, color: "bg-purple-50 text-purple-600" },
  { day: "Auto", msg: "Sir yeh rahi available slots:\n• 10:00 AM\n• 2:00 PM\n• 5:00 PM\nKoi bhi time batayein, hum confirm kar denge!", icon: CalendarDays, color: "bg-emerald-50 text-emerald-600" },
  { day: "Booked", msg: "Meeting confirmed! {date} ko {time} par. Video call link ya factory address bhej denge.", icon: CheckCircle2, color: "bg-green-50 text-green-700" },
];

const typeConfig: Record<string, { color: string; label: string; icon: typeof Video }> = {
  video: { color: "bg-emerald-50 text-emerald-600 border-emerald-200", label: "Video Call", icon: Video },
  factory: { color: "bg-blue-50 text-blue-600 border-blue-200", label: "Factory Visit", icon: Building2 },
  customer: { color: "bg-purple-50 text-purple-600 border-purple-200", label: "Customer Site", icon: MapPin },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-amber-100 text-amber-700", label: "Pending" },
  confirmed: { color: "bg-emerald-100 text-emerald-700", label: "Confirmed" },
  completed: { color: "bg-blue-100 text-blue-700", label: "Completed" },
  cancelled: { color: "bg-red-100 text-red-600", label: "Cancelled" },
};

function generateFutureDates(): { date: string; label: string }[] {
  const result: { date: string; label: string }[] = [];
  const today = new Date();
  let added = 0;
  let d = new Date(today);
  d.setDate(d.getDate() + 1); // start from tomorrow
  while (added < 7) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) { // skip weekends
      result.push({
        date: d.toISOString().split("T")[0],
        label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      });
      added++;
    }
    d.setDate(d.getDate() + 1);
  }
  return result;
}

const futureDates = generateFutureDates();

export default function MeetingBookingPage() {
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [leadList, setLeadList] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(futureDates[0]?.date || "");
  const [selectedTime, setSelectedTime] = useState<string>("10:00 AM");
  const [bookForm, setBookForm] = useState({ lead_name: "", phone: "", meeting_type: "video" as Meeting["meeting_type"], notes: "", lead_id: null as number | null });
  const [activeTab, setActiveTab] = useState<"upcoming" | "flow" | "book">("upcoming");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, l] = await Promise.all([
        meetings.getAll(),
        leads.getAll(),
      ]);
      setAllMeetings(m);
      setLeadList(l);
    } catch {
      toast({ title: "Data load error", description: "Supabase se data nahi aa raha", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const upcomingMeetings = allMeetings.filter(m => {
    const md = new Date(m.slot_date);
    return (m.status === "pending" || m.status === "confirmed") && md >= new Date(now.setHours(0, 0, 0, 0));
  });
  const confirmed = allMeetings.filter(m => m.status === "confirmed").length;
  const pending = allMeetings.filter(m => m.status === "pending").length;
  const completed = allMeetings.filter(m => m.status === "completed").length;
  const autoBooked = allMeetings.filter(m => m.whatsapp_sent).length;

  function handleLeadSelect(leadId: string) {
    const id = parseInt(leadId);
    if (id && !isNaN(id)) {
      const lead = leadList.find(l => l.id === id);
      if (lead) {
        setBookForm(p => ({
          ...p,
          lead_id: lead.id,
          lead_name: lead.name,
          phone: lead.phone || "",
        }));
      }
    }
  }

  async function handleBook() {
    if (!bookForm.lead_name || !bookForm.phone || !selectedDate || !selectedTime) {
      toast({ title: "Name, phone, date aur time select karein", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const newMeeting = await meetings.create({
        lead_id: bookForm.lead_id,
        lead_name: bookForm.lead_name,
        phone: bookForm.phone,
        slot_date: selectedDate,
        slot_time: selectedTime,
        meeting_type: bookForm.meeting_type,
        status: "confirmed",
        booked_by: "manual",
        notes: bookForm.notes,
        whatsapp_sent: false,
      });
      setAllMeetings(prev => [newMeeting, ...prev]);
      toast({ title: "Meeting booked!", description: `${bookForm.lead_name} — ${selectedDate} at ${selectedTime}` });
      setBookForm({ lead_name: "", phone: "", meeting_type: "video", notes: "", lead_id: null });
      setSelectedDate(futureDates[0]?.date || "");
      setSelectedTime("10:00 AM");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error saving meeting", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: number, status: Meeting["status"]) {
    try {
      await meetings.update(id, { status });
      setAllMeetings(prev => prev.map(m => m.id === id ? { ...m, status } : m));
      toast({ title: `Meeting ${status}!` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }

  async function deleteMeeting(id: number) {
    if (!confirm("Delete this meeting?")) return;
    try {
      await meetings.delete(id);
      setAllMeetings(prev => prev.filter(m => m.id !== id));
      toast({ title: "Meeting deleted" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }

  function openWhatsApp(meeting: Meeting) {
    const locLabel = meeting.meeting_type === "video" ? "WhatsApp Video Call" : meeting.meeting_type === "factory" ? "SAI RoloTech Factory, Mundka, New Delhi" : "Your site address";
    const msg = encodeURIComponent(
      `Namaste ${meeting.lead_name}!\n\nAapki meeting confirm ho gayi hai:\n\n📅 ${meeting.slot_date}\n⏰ ${meeting.slot_time}\n📍 ${locLabel}\n\nKoi sawal ho toh: +91-9899925274\n\n— SAI RoloTech`
    );
    window.open(`https://wa.me/${meeting.phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
    // Also update whatsapp_sent flag
    meetings.update(meeting.id, { whatsapp_sent: true }).then(() => {
      setAllMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, whatsapp_sent: true } : m));
    });
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader title="Meeting Auto-Booking" subtitle="WhatsApp se meeting fix — automatic scheduling system" />

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="Confirmed" value={confirmed} icon={CheckCircle2} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatsCard label="Pending" value={pending} icon={Clock} iconBg="bg-amber-500/10" iconColor="text-amber-500" />
        <StatsCard label="Completed" value={completed} icon={CalendarDays} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
        <StatsCard label="WA Sent" value={autoBooked} icon={Zap} iconBg="bg-purple-500/10" iconColor="text-purple-500" />
      </motion.div>

      <motion.div variants={staggerItem} className="flex gap-2 overflow-x-auto pb-2">
        {(["upcoming", "flow", "book"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab ? "bg-primary text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab === "upcoming" ? "Upcoming Meetings" : tab === "flow" ? "WhatsApp Auto Flow" : "Book New Slot"}
          </button>
        ))}
      </motion.div>

      {activeTab === "upcoming" && (
        <SectionCard title="All Meetings" headerAction={<CalendarDays className="w-4 h-4 text-blue-600" />}>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : allMeetings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Koi meeting nahi hai</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allMeetings.map(m => {
                const tc = typeConfig[m.meeting_type] || typeConfig["video"];
                const TypeIcon = tc.icon;
                return (
                  <motion.div key={m.id} variants={staggerItem} className="border border-border rounded-xl p-4 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tc.color}`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{m.lead_name}</p>
                          <p className="text-xs text-muted-foreground">{m.phone}</p>
                        </div>
                      </div>
                      <Badge className={statusConfig[m.status]?.color || "bg-gray-100 text-gray-600"}>
                        {statusConfig[m.status]?.label || m.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{m.slot_date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.slot_time}</span>
                      <Badge variant="outline" className="text-[10px]">{tc.label}</Badge>
                      {m.whatsapp_sent && <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">📱 WA Sent</Badge>}
                    </div>
                    {m.notes && <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded-lg px-3 py-1.5">{m.notes}</p>}
                    {m.status === "pending" || m.status === "confirmed" ? (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => updateStatus(m.id, "completed")}>
                          <CheckCircle2 className="w-3 h-3" /> Complete
                        </Button>
                        {m.phone && (
                          <Button size="sm" variant="outline" className="text-xs gap-1 text-green-700 border-green-200" onClick={() => openWhatsApp(m)}>
                            <ExternalLink className="w-3 h-3" /> WhatsApp
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="text-xs gap-1 text-red-600 border-red-200" onClick={() => updateStatus(m.id, "cancelled")}>
                          <XCircle className="w-3 h-3" /> Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="ghost" className="text-xs gap-1 text-red-600" onClick={() => deleteMeeting(m.id)}>
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === "flow" && (
        <SectionCard title="WhatsApp → Meeting Auto Flow" headerAction={<MessageSquare className="w-4 h-4 text-green-600" />}>
          <div className="space-y-1">
            {WA_FLOW_STEPS.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${step.color}`}>
                      <StepIcon className="w-4 h-4" />
                    </div>
                    {i < WA_FLOW_STEPS.length - 1 && <div className="w-0.5 h-8 bg-border" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <Badge variant="outline" className="text-[10px] mb-1.5">{step.day}</Badge>
                    <div className="bg-muted/50 rounded-xl p-3 border border-border">
                      <p className="text-xs text-foreground whitespace-pre-line">{step.msg}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Auto-Detection: Jab lead WhatsApp par "demo", "meeting", "milna" ya "dekhna" likhta hai → system automatically available slots bhej deta hai
            </p>
          </div>
        </SectionCard>
      )}

      {activeTab === "book" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Select Date & Time" headerAction={<Clock className="w-4 h-4 text-blue-600" />}>
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">📅 Date Select Karein</p>
              <div className="flex flex-wrap gap-2">
                {futureDates.map(fd => (
                  <button
                    key={fd.date}
                    onClick={() => setSelectedDate(fd.date)}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      selectedDate === fd.date
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-primary"
                        : "border-border hover:border-primary/50 text-foreground"
                    }`}
                  >
                    {fd.label}
                  </button>
                ))}
              </div>

              <p className="text-xs font-medium text-muted-foreground mt-3">⏰ Time Slot Select Karein</p>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      selectedTime === t
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-primary"
                        : "border-border hover:border-primary/50 text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {selectedDate && selectedTime && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-primary">
                    {futureDates.find(f => f.date === selectedDate)?.label} — {selectedTime}
                  </span>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Book Meeting" headerAction={<Send className="w-4 h-4 text-emerald-600" />}>
            <div className="space-y-4">
              {leadList.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">🎯 Lead se Link Karein (optional)</label>
                  <select onChange={e => handleLeadSelect(e.target.value)}
                    className="w-full px-3 py-2.5 bg-card border border-border rounded-xl text-sm">
                    <option value="">— Select Lead —</option>
                    {leadList.map(l => (
                      <option key={l.id} value={l.id}>{l.name} · {l.phone || "No phone"}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Lead Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={bookForm.lead_name}
                    onChange={e => setBookForm(p => ({ ...p, lead_name: e.target.value }))}
                    placeholder="Client ka naam"
                    className="w-full pl-10 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="tel" value={bookForm.phone}
                    onChange={e => setBookForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full pl-10 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Meeting Type</label>
                <select value={bookForm.meeting_type}
                  onChange={e => setBookForm(p => ({ ...p, meeting_type: e.target.value as Meeting["meeting_type"] }))}
                  className="w-full px-3 py-2.5 bg-card border border-border rounded-xl text-sm">
                  <option value="video">📹 Video Call</option>
                  <option value="factory">🏭 Factory Visit (Mundka)</option>
                  <option value="customer">🏢 Customer Site Visit</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <textarea value={bookForm.notes || ""}
                  onChange={e => setBookForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Machine interest, special requests..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-card border border-border rounded-xl text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <Button className="w-full gap-2" onClick={handleBook} disabled={saving || !selectedDate || !selectedTime}>
                {saving ? "Booking..." : <><CalendarDays className="w-4 h-4" /> Meeting Book Karein</>}
              </Button>
            </div>
          </SectionCard>
        </div>
      )}
    </motion.div>
  );
}
