import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard } from "@/components/shared";
import {
  Zap, Clock, Mail, Phone, MessageSquare, Play, Pause,
  Users, CheckCircle2, TrendingUp, ChevronDown, ChevronUp,
  Send, X, Check, ExternalLink, Search, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { leads as leadsService, sequenceHistory } from "@/lib/dataService";
import type { Lead } from "@/lib/supabase";

interface SequenceStep {
  day: number;
  action: string;
  channel: "email" | "phone" | "whatsapp";
  template: string;
  sent?: number;
  opened?: number;
}

interface Sequence {
  id: number;
  name: string;
  description: string;
  steps: SequenceStep[];
  activeLeads: number;
  completionRate: number;
  running: boolean;
  totalSent: number;
  replies: number;
  machineInterest?: string;
}

const WHATSAPP_TEMPLATES: Record<string, (lead: { name: string; machine?: string; company?: string }) => string> = {
  welcome_catalog: ({ name, machine }) =>
    `Namaste ${name}!\n\nSAI RoloTech — Roll Forming Machine Experts se!\n\nAapke inquiry ke liye dhanyavaad. Hum aapko quality machines dete hain — Shutter Patti, False Ceiling, Custom profiles sab kuch.\n\n📞 Contact: +91-9899925274\n🌐 www.sairolotech.in`,
  first_call: ({ name }) =>
    `Namaste ${name}!\n\nSAI RoloTech se bol rahe hain. Aapke machine inquiry ke baare mein baat karni thi.\n\nKya aapke paas 5 minute hain? Quick call karenge, sab details denge.\n\n📞 +91-9899925274`,
  specs_email: ({ name, machine }) =>
    `Namaste ${name}!\n\nSpecifications bhej rahe hain for ${machine || "roll forming machine"}:\n\n✅ Basic: ₹45K/station (En8 rolls, 1yr warranty)\n✅ Medium: ₹55K/station (En31 rolls, 2yr warranty)\n✅ Advance: ₹65K/station (D3 rolls, 5yr warranty)\n\nAuto add-on available. Full specs ke liye call karein.`,
  pricing_wa: ({ name, machine }) =>
    `Namaste ${name}!\n\nAapke inquiry ke liye pricing:\n\n${machine || "Roll Forming Machine"}:\n₹4.5L se ₹11.7L depending on config\n\nEMI available | GST extra\nDelivery: 20-60 days\n\nBest deal ke liye contact karein: +91-9899925274`,
  final_offer: ({ name }) =>
    `Namaste ${name}!\n\nSpecial offer valid for limited time:\n\n🏭 Factory Direct Price\n📦 Free Installation Guidance\n🔧 1-5 Year Warranty\n💰 EMI Available\n\nBook now — slots filling fast!\n\n📞 +91-9899925274`,
  demo_thanks: ({ name }) =>
    `Namaste ${name}!\n\nAapka demo attend karne ke liye dhanyavaad! 🙏\n\nMachine specifications aur pricing details attached hain. Koi question ho toh freely poochein.\n\n📞 +91-9899925274`,
  specs_video: ({ name, machine }) =>
    `Namaste ${name}!\n\nMachine working video bhej rahe hain — ${machine || "Roll Forming Machine"}:\n\n🎥 Video link: youtube.com/@sairolotech\n\nShutter Patti, False Ceiling, Custom profiles sab dikha rahe hain. Demo available hai Mundka factory mein!`,
  pricing_call: ({ name }) =>
    `Namaste ${name}!\n\nAapke ${name} — pricing discussion ke liye call kar rahe hain.\n\nBest rates direct factory se. Payment options bhi flexible hain.\n\n📞 Call: +91-9899925274`,
  final_quote: ({ name }) =>
    `Namaste ${name}!\n\nFinal quotation attached hai. Terms:\n✅ 50% advance, 30% progress, 20% delivery\n✅ Delivery: 20-60 days\n✅ Installation: 4% extra\n✅ GST 18% extra\n\nValid for 15 days. Order karne ke liye contact karein!`,
  reengage_wa: ({ name }) =>
    `Namaste ${name}!\n\nLong time ho gaya — kya aapko abhi bhi machine chahiye?\n\nHum naye models leke aaye hain — better specs, competitive prices!\n\n📞 Quick call: +91-9899925274`,
  new_catalog: ({ name }) =>
    `Namaste ${name}!\n\nNaya catalog available hai:\n\n🏭 Shutter Patti Machines\n🏗️ False Ceiling Machines\n📐 Custom Roll Forming\n\nUpdated prices mein offer chal raha hai!`,
  discount_offer: ({ name }) =>
    `Namaste ${name}!\n\nSpecial festive offer for ${name}:\n\n🔥 Flat 5% off on orders this month\n🚚 Free delivery\n🔧 Extended warranty\n\nOffer valid till end of month only!`,
};

const MACHINE_SUGGESTIONS = [
  "Shutter Patti Machine (Semi-Auto)",
  "Shutter Patti Machine (Full-Auto)",
  "False Ceiling Machine (Semi-Auto)",
  "False Ceiling Machine (Full-Auto)",
  "Z Purlin Roll Forming Machine",
  "C Purlin Machine",
  "Custom Profile Machine",
];

const channelIcons = { email: Mail, phone: Phone, whatsapp: MessageSquare };
const channelColors: Record<string, string> = {
  email: "bg-blue-50 text-blue-600 border-blue-200",
  phone: "bg-emerald-50 text-emerald-700 border-emerald-200",
  whatsapp: "bg-green-50 text-green-700 border-green-200",
};

const initSequences: Sequence[] = [
  {
    id: 1, name: "New IndiaMART Lead Nurture", description: "IndiaMART se aaye naye leads ke liye automated follow-up sequence",
    activeLeads: 24, completionRate: 68, running: true, totalSent: 142, replies: 31,
    steps: [
      { day: 0, action: "Welcome WhatsApp + catalog link", channel: "whatsapp", template: "welcome_catalog", sent: 48, opened: 42 },
      { day: 1, action: "Follow-up call — machine interest check", channel: "phone", template: "first_call", sent: 41, opened: 38 },
      { day: 3, action: "Specifications email (Shutter Patti / False Ceiling)", channel: "email", template: "specs_email", sent: 35, opened: 28 },
      { day: 7, action: "WhatsApp check-in + pricing", channel: "whatsapp", template: "pricing_wa", sent: 18, opened: 15 },
      { day: 14, action: "Final offer email + deadline urgency", channel: "email", template: "final_offer", sent: 0, opened: 0 },
    ],
  },
  {
    id: 2, name: "Post-Demo Follow-up", description: "Factory visit ya demo ke baad rapid follow-up sequence",
    activeLeads: 8, completionRate: 82, running: true, totalSent: 47, replies: 14,
    steps: [
      { day: 0, action: "Thank you WhatsApp + demo summary", channel: "whatsapp", template: "demo_thanks", sent: 14, opened: 14 },
      { day: 2, action: "Technical specs + video WhatsApp", channel: "whatsapp", template: "specs_video", sent: 12, opened: 11 },
      { day: 5, action: "Pricing discussion call", channel: "phone", template: "pricing_call", sent: 11, opened: 10 },
      { day: 10, action: "Final quotation email", channel: "email", template: "final_quote", sent: 10, opened: 7 },
    ],
  },
  {
    id: 3, name: "Cold Lead Re-engagement", description: "30+ din se inactive leads ko wapas engage karne ki sequence",
    activeLeads: 15, completionRate: 24, running: false, totalSent: 38, replies: 5,
    steps: [
      { day: 0, action: "Re-engagement WhatsApp — new machine announcement", channel: "whatsapp", template: "reengage_wa", sent: 20, opened: 15 },
      { day: 3, action: "New catalog email", channel: "email", template: "new_catalog", sent: 12, opened: 8 },
      { day: 7, action: "Special discount WhatsApp offer", channel: "whatsapp", template: "discount_offer", sent: 6, opened: 4 },
    ],
  },
];

export default function SalesSequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>(initSequences);
  const [openId, setOpenId]       = useState<number | null>(1);
  const [allLeads, setAllLeads]    = useState<Lead[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendSeqId, setSendSeqId]         = useState<number | null>(null);
  const [sendTemplate, setSendTemplate]   = useState<string>("");
  const [sendLeadId, setSendLeadId]       = useState<number | null>(null);
  const [sendMachine, setSendMachine]      = useState("");
  const [leadSearch, setLeadSearch]       = useState("");
  const [sending, setSending]             = useState(false);

  useEffect(() => {
    leadsService.getAll({ filters: {} }).then(data => {
      if (data && data.length > 0) setAllLeads(data as Lead[]);
    }).catch(() => {});
  }, []);

  function toggleRun(id: number) {
    setSequences(prev => prev.map(s => {
      if (s.id !== id) return s;
      const next = { ...s, running: !s.running };
      toast({ title: `"${next.name}" ${next.running ? "started" : "paused"}` });
      return next;
    }));
  }

  function openSendModal(seqId: number) {
    setSendSeqId(seqId);
    setSendTemplate(Object.keys(WHATSAPP_TEMPLATES)[0]);
    setSendLeadId(null);
    setSendMachine("");
    setLeadSearch("");
    setShowSendModal(true);
  }

  function previewMessage() {
    const lead = allLeads.find(l => l.id === sendLeadId);
    if (!sendTemplate) return "";
    const templateFn = WHATSAPP_TEMPLATES[sendTemplate];
    if (!templateFn) return "";
    return templateFn({
      name: lead?.name || "Customer",
      machine: sendMachine || undefined,
      company: lead?.company_name || undefined,
    });
  }

  async function handleSend() {
    const lead = allLeads.find(l => l.id === sendLeadId);
    if (!lead || !sendTemplate) {
      toast({ title: "Please select a lead and template", variant: "destructive" });
      return;
    }
    const msg = previewMessage();
    const encoded = encodeURIComponent(msg);
    const phone = lead.phone?.replace(/\D/g, "") || "";
    const waUrl = phone.length >= 10
      ? `https://wa.me/91${phone}?text=${encoded}`
      : null;

    // Save to Supabase sequence history
    setSending(true);
    try {
      await sequenceHistory.create({
        sequence_id: sendSeqId,
        lead_id: lead.id,
        step_template: sendTemplate,
        message_sent: msg,
        channel: "whatsapp",
        status: "sent",
      }).catch(() => {});
    } catch { /* non-fatal */ }

    setSending(false);
    setShowSendModal(false);
    toast({ title: `WhatsApp message prepared for ${lead.name}` });

    if (waUrl) {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  }

  const filteredLeads = allLeads.filter(l =>
    !leadSearch ||
    l.name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
    l.phone?.includes(leadSearch) ||
    l.company_name?.toLowerCase().includes(leadSearch.toLowerCase())
  );

  const templateEntries = Object.entries(WHATSAPP_TEMPLATES);
  const currentSeq = sequences.find(s => s.id === sendSeqId);

  const totalActive = sequences.reduce((a, s) => a + s.activeLeads, 0);
  const totalSent   = sequences.reduce((a, s) => a + s.totalSent, 0);
  const totalReplies= sequences.reduce((a, s) => a + s.replies, 0);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader title="Sales Sequences" subtitle="Automated follow-up sequences for lead nurturing" />

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard label="Active Leads"   value={totalActive}                             icon={Users}        iconBg="bg-blue-50"    iconColor="text-blue-500" />
        <StatsCard label="Running"        value={sequences.filter(s => s.running).length} icon={Play}         iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <StatsCard label="Total Sent"     value={totalSent}                               icon={Zap}          iconBg="bg-amber-50"   iconColor="text-amber-500" />
        <StatsCard label="Replies"        value={totalReplies}                            icon={TrendingUp}   iconBg="bg-purple-50"  iconColor="text-purple-500" />
      </motion.div>

      <div className="space-y-4">
        {sequences.map(seq => (
          <motion.div key={seq.id} variants={staggerItem} className="glass-card rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-foreground">{seq.name}</h3>
                    <Badge className={seq.running ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}>
                      {seq.running ? "▶ Running" : "⏸ Paused"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{seq.description}</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{seq.activeLeads}</span> active leads</span>
                    <span className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{seq.totalSent}</span> msgs sent</span>
                    <span className="text-xs text-muted-foreground"><span className="font-semibold text-emerald-600">{seq.replies}</span> replies</span>
                    <span className="text-xs text-muted-foreground">{seq.completionRate}% completion</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${seq.completionRate}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openSendModal(seq.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                  <button onClick={() => toggleRun(seq.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${seq.running ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"}`}>
                    {seq.running ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Start</>}
                  </button>
                  <button onClick={() => setOpenId(openId === seq.id ? null : seq.id)}
                    className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
                    {openId === seq.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Steps */}
            {openId === seq.id && (
              <div className="p-4">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" aria-hidden="true" />
                  <div className="space-y-4">
                    {seq.steps.map((step, i) => {
                      const ChannelIcon = channelIcons[step.channel];
                      const isDone = (step.sent ?? 0) > 0;
                      return (
                        <div key={i} className="flex items-start gap-4 relative">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center z-10 shrink-0 ${isDone ? "bg-primary/10 border-primary/30" : "bg-slate-100 border-slate-300"}`}>
                            {isDone ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Clock className="w-4 h-4 text-slate-400" />}
                          </div>
                          <div className="flex-1 bg-muted/30 rounded-xl p-3 border border-border">
                            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                              <div className="flex items-center gap-2">
                                <Badge className={`text-[10px] ${channelColors[step.channel]}`}>
                                  <ChannelIcon className="w-2.5 h-2.5 mr-1" />
                                  {step.channel === "whatsapp" ? "WhatsApp" : step.channel.charAt(0).toUpperCase() + step.channel.slice(1)}
                                </Badge>
                                <span className="text-xs font-medium text-foreground">{step.action}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono">Day {step.day}</span>
                            </div>
                            {isDone && (
                              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                <span>Sent: <span className="text-foreground font-medium">{step.sent}</span></span>
                                <span>Opened: <span className="text-emerald-600 font-medium">{step.opened}</span></span>
                                {step.sent! > 0 && <span>Rate: <span className="text-blue-600 font-medium">{Math.round((step.opened!/step.sent!)*100)}%</span></span>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Send-to-Lead Modal */}
      <AnimatePresence>
        {showSendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowSendModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Send WhatsApp Message</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentSeq?.name || "Select sequence"}
                  </p>
                </div>
                <button onClick={() => setShowSendModal(false)}
                  className="p-2 rounded-xl hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Template selector */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Message Template
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {templateEntries.map(([key, fn]) => {
                      const preview = fn({ name: "Preview", machine: "Shutter Patti Machine", company: "Acme Corp" });
                      return (
                        <button key={key}
                          onClick={() => { setSendTemplate(key); }}
                          className={`text-left p-3 rounded-xl border text-xs transition-all ${sendTemplate === key
                            ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20"
                            : "bg-muted/30 border-border hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-green-50 text-green-700 border-green-200 text-[9px]">
                              <MessageSquare className="w-2.5 h-2.5 mr-0.5" /> WhatsApp
                            </Badge>
                            <span className="font-semibold text-foreground capitalize">
                              {key.replace(/_/g, " ")}
                            </span>
                            {sendTemplate === key && <Check className="w-3 h-3 text-primary ml-auto" />}
                          </div>
                          <p className="text-muted-foreground line-clamp-2">{preview.slice(0, 100)}…</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Machine suggestion */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Machine Interest
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MACHINE_SUGGESTIONS.map(m => (
                      <button key={m}
                        onClick={() => setSendMachine(sendMachine === m ? "" : m)}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium transition-all ${sendMachine === m
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-muted/30 border-border hover:border-primary/30 text-muted-foreground"
                        }`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lead selector */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Select Lead
                  </label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={leadSearch}
                      onChange={e => setLeadSearch(e.target.value)}
                      placeholder="Search by name, phone or company…"
                      className="pl-9 text-xs h-9"
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto border border-border rounded-xl divide-y divide-border/50">
                    {filteredLeads.length === 0 && (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        {allLeads.length === 0
                          ? "No leads found — import leads first"
                          : "No leads match your search"}
                      </div>
                    )}
                    {filteredLeads.slice(0, 20).map(l => (
                      <button key={l.id}
                        onClick={() => { setSendLeadId(l.id); setLeadSearch(""); }}
                        className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors ${sendLeadId === l.id ? "bg-primary/5" : ""}`}>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-primary">{l.name?.charAt(0)?.toUpperCase() || "?"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{l.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{l.phone} · {l.company_name || "—"}</p>
                        </div>
                        {sendLeadId === l.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message preview */}
                {sendTemplate && (
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">
                      Message Preview
                    </label>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3.5">
                      <p className="text-xs text-green-900 whitespace-pre-wrap leading-relaxed font-mono">
                        {previewMessage() || "Select a lead to preview message…"}
                      </p>
                    </div>
                    {sendLeadId && (
                      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" />
                        Will open WhatsApp with this message
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setShowSendModal(false)} className="text-xs h-8">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!sendLeadId || !sendTemplate || sending}
                  className="text-xs h-8 bg-green-600 hover:bg-green-700 gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  {sending ? "Sending…" : "Send WhatsApp"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
