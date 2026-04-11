import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard, SectionCard } from "@/components/shared";
import {
  Megaphone, MessageSquare, Mail, Copy, Bot, Clock, Zap, RefreshCw,
  CheckCircle2, Calendar, MapPin, Flame, TrendingUp, Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { AIDisclaimer } from "@/components/shared";

/* ── Static content library ──────────────────────────────── */
const channelIcons = { whatsapp: MessageSquare, email: Mail, sms: MessageSquare };
const channelColors: Record<string, string> = {
  whatsapp: "bg-emerald-50 text-emerald-700 border-emerald-200",
  email: "bg-blue-50 text-blue-600 border-blue-200",
  sms: "bg-violet-50 text-violet-600 border-violet-200",
};
const statusColors: Record<string, string> = {
  draft: "bg-slate-50 text-slate-600 border-slate-200",
  sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  scheduled: "bg-amber-50 text-amber-700 border-amber-200",
};

const mockContent = [
  { id: 1, title: "Shutter Patti Machine — Special Offer", channel: "whatsapp", content: "Namaste! SAI RoloTech mein is month Shutter Patti machine pe special pricing chal rahi hai — Basic ₹45K, Advance ₹65K. Free demo + factory visit arrange kar sakte hain! 🔥", createdAt: "2026-03-20", machine: "Shutter Patti", status: "sent" },
  { id: 2, title: "False Ceiling Machine Launch", channel: "email", content: "Dear Customer, Hamne nayi Gypsum False Ceiling machine launch ki hai — Semi-Auto ₹3-4.5L, Full-Auto ₹5-6.5L range mein. High-quality output + MSME subsidy available. Demo schedule karein aaj!", createdAt: "2026-03-18", machine: "False Ceiling", status: "scheduled" },
  { id: 3, title: "Factory Visit Invitation", channel: "whatsapp", content: "Aap Delhi/NCR mein hain toh is hafte free factory visit karte hain? Live machine demo + product quality check — sab free! WhatsApp pe reply karein. 🏭", createdAt: "2026-03-16", status: "sent" },
  { id: 4, title: "Monthly Newsletter", channel: "email", content: "March 2026 highlights: 3 new machines launched, 15 successful installations, MSME loan assistance added. Special pricing for existing customers this quarter!", createdAt: "2026-03-14", status: "draft" },
  { id: 5, title: "Service Reminder", channel: "sms", content: "Hi! Aapki Roll Forming Machine ka scheduled maintenance due hai. Book karo: +91-9899925274. SAI RoloTech, New Delhi.", createdAt: "2026-03-12", status: "sent" },
];

/* ── Smart Timing result type ─────────────────────────────── */
interface TimingResult {
  waitDays: number;
  bestTime: string;
  urgency: string;
  reason: string;
  action: string;
}

const URGENCY_COLORS: Record<string, string> = {
  Immediate:   "bg-red-100 text-red-700 border-red-300",
  Today:       "bg-orange-100 text-orange-700 border-orange-200",
  "This Week": "bg-amber-100 text-amber-700 border-amber-200",
  "Next Week": "bg-blue-100 text-blue-700 border-blue-200",
  Monthly:     "bg-slate-100 text-slate-600 border-slate-200",
};

/* ── AI Content Generator type ────────────────────────────── */
interface ContentResult {
  whatsapp: string;
  email: string;
  tip: string;
}

export default function MarketingContentPage() {
  /* Smart Timing state */
  const [tScore, setTScore]   = useState("HOT");
  const [tZone, setTZone]     = useState("HIGH");
  const [tSource, setTSource] = useState("indiamart");
  const [tDays, setTDays]     = useState("3");
  const [tReplies, setTReplies] = useState("0");
  const [tLoading, setTLoading] = useState(false);
  const [tResult, setTResult]   = useState<TimingResult | null>(null);

  /* Content Generator state */
  const [cgTopic, setCgTopic]     = useState("Shutter Patti Machine");
  const [cgGoal, setCgGoal]       = useState("meeting");
  const [cgLoading, setCgLoading] = useState(false);
  const [cgResult, setCgResult]   = useState<ContentResult | null>(null);

  /* Smart Timing API call */
  async function getSmartTiming() {
    setTLoading(true); setTResult(null);
    try {
      const res = await fetch("/api/smart-timing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: tScore, locationZone: tZone, source: tSource, daysSinceCreation: Number(tDays), repliesCount: Number(tReplies) }),
      });
      const data = await res.json();
      if (data.success) setTResult(data);
      else toast({ title: "AI Error", description: data.error, variant: "destructive" });
    } catch { toast({ title: "Network error", variant: "destructive" }); }
    setTLoading(false);
  }

  /* Content Generator API call via buddy-chat */
  async function generateContent() {
    setCgLoading(true); setCgResult(null);
    try {
      const prompt = `Generate marketing content for SAI RoloTech (Roll Forming Machine manufacturer, New Delhi):

Topic: ${cgTopic}
Goal: ${cgGoal} (meeting/sale/demo/app download)

Return a JSON object:
{
  "whatsapp": "<short WhatsApp message in Hinglish, max 3 lines, include emoji>",
  "email": "<email body in formal Hinglish, 3-4 lines>",
  "tip": "<one pro tip for this campaign>"
}`;

      const res = await fetch("/api/buddy-chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, history: [] }),
      });
      const data = await res.json();
      if (data.success) {
        const json = data.reply?.match(/\{[\s\S]*\}/)?.[0];
        if (json) {
          try { setCgResult(JSON.parse(json)); }
          catch { setCgResult({ whatsapp: data.reply, email: "", tip: "" }); }
        } else {
          setCgResult({ whatsapp: data.reply, email: "", tip: "" });
        }
      } else {
        toast({ title: "AI Error", description: data.error, variant: "destructive" });
      }
    } catch { toast({ title: "Network error", variant: "destructive" }); }
    setCgLoading(false);
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader title="Marketing Content" subtitle="AI Content Generator + Smart Timing Advisor" />
      <motion.div variants={staggerItem} className="max-w-lg"><AIDisclaimer /></motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard label="Total Content"  value={mockContent.length}                                          icon={Megaphone}      iconBg="bg-violet-50"  iconColor="text-purple-500" />
        <StatsCard label="WhatsApp"       value={mockContent.filter(c => c.channel === "whatsapp").length}    icon={MessageSquare}  iconBg="bg-emerald-50" iconColor="text-emerald-700" />
        <StatsCard label="Email"          value={mockContent.filter(c => c.channel === "email").length}       icon={Mail}           iconBg="bg-blue-50"    iconColor="text-blue-500" />
        <StatsCard label="AI Features"    value={3}                                                           icon={Bot}            iconBg="bg-amber-50"   iconColor="text-amber-500" />
      </motion.div>

      {/* ── AI: Smart Timing Advisor ─────────────────────────── */}
      <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5 border-l-4 border-orange-500">
        <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" /> Smart Timing Advisor — AI
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Lead ka profile dalke pata karo — ab contact karna chahiye ya wait karna chahiye? AI decide karega
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Lead Score</label>
            <select value={tScore} onChange={e => setTScore(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20">
              <option value="VERY_HOT">🔥🔥 VERY HOT</option>
              <option value="HOT">🔥 HOT</option>
              <option value="WARM">🌡️ WARM</option>
              <option value="COLD">❄️ COLD</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Location Zone</label>
            <select value={tZone} onChange={e => setTZone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20">
              <option value="HIGH">HIGH (Delhi/NCR)</option>
              <option value="MEDIUM">MEDIUM (North)</option>
              <option value="LOW">LOW (South/Far)</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Source</label>
            <select value={tSource} onChange={e => setTSource(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20">
              <option value="indiamart">IndiaMART</option>
              <option value="justdial">Justdial</option>
              <option value="direct">Direct</option>
              <option value="pabbly">Pabbly/Ads</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Days Since Contact</label>
            <input type="number" value={tDays} onChange={e => setTDays(e.target.value)} min="0" max="365"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Replies Given</label>
            <input type="number" value={tReplies} onChange={e => setTReplies(e.target.value)} min="0" max="50"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
          </div>
        </div>

        <button onClick={getSmartTiming} disabled={tLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all">
          {tLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Clock className="w-4 h-4" /> Best Time Batao</>}
        </button>

        {tResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-border rounded-xl p-3 text-center">
              <Calendar className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground">{tResult.waitDays}d</p>
              <p className="text-[10px] text-muted-foreground">Wait karo</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-3 text-center">
              <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-sm font-bold text-foreground">{tResult.bestTime}</p>
              <p className="text-[10px] text-muted-foreground">Best Time</p>
            </div>
            <div className="col-span-2 bg-white border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Flame className="w-4 h-4 text-red-500" />
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${URGENCY_COLORS[tResult.urgency] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                  {tResult.urgency}
                </span>
              </div>
              <p className="text-xs text-foreground font-medium">{tResult.action}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{tResult.reason}</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ── AI: Content Generator ─────────────────────────────── */}
      <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5 border-l-4 border-purple-500">
        <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" /> AI Content Generator
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Topic aur goal batao — AI WhatsApp + Email content ek click mein bana dega
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Topic / Machine</label>
            <input value={cgTopic} onChange={e => setCgTopic(e.target.value)}
              placeholder="e.g. Shutter Patti Machine, False Ceiling..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Campaign Goal</label>
            <select value={cgGoal} onChange={e => setCgGoal(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20">
              <option value="meeting">Meeting Fix Karo</option>
              <option value="quotation">Quotation Request</option>
              <option value="demo">Demo Schedule</option>
              <option value="sale">Direct Sale Push</option>
              <option value="app_download">App Download</option>
            </select>
          </div>
        </div>

        <button onClick={generateContent} disabled={cgLoading || !cgTopic.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all">
          {cgLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> : <><Bot className="w-4 h-4" /> Content Generate Karo</>}
        </button>

        {cgResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
            {cgResult.whatsapp && (
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Message
                  </p>
                  <button onClick={() => { navigator.clipboard.writeText(cgResult.whatsapp); toast({ title: "WhatsApp message copied!" }); }}
                    className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{cgResult.whatsapp}</p>
              </div>
            )}
            {cgResult.email && (
              <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email Content
                  </p>
                  <button onClick={() => { navigator.clipboard.writeText(cgResult.email); toast({ title: "Email content copied!" }); }}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{cgResult.email}</p>
              </div>
            )}
            {cgResult.tip && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <TrendingUp className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800"><span className="font-bold">Pro Tip:</span> {cgResult.tip}</p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ── Content Library ──────────────────────────────────── */}
      <SectionCard title="Content Library" headerAction={<Megaphone className="w-4 h-4 text-muted-foreground" />}>
        <div className="space-y-3">
          {mockContent.map(piece => {
            const ChannelIcon = channelIcons[piece.channel as keyof typeof channelIcons] || MessageSquare;
            return (
              <motion.div key={piece.id} variants={staggerItem} className="glass-card rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${channelColors[piece.channel]}`}>
                      <ChannelIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{piece.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={channelColors[piece.channel]}>{piece.channel}</Badge>
                        <Badge className={statusColors[piece.status]}>{piece.status}</Badge>
                        {piece.machine && <span className="text-xs text-muted-foreground">{piece.machine}</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(piece.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border mb-2">
                  <p className="text-xs text-foreground/80 leading-relaxed">{piece.content}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(piece.content); toast({ title: "Content copied!" }); }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted border border-border">
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </motion.div>
            );
          })}
        </div>
      </SectionCard>
    </motion.div>
  );
}
