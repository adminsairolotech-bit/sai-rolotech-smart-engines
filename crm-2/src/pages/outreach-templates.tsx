import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, SectionCard } from "@/components/shared";
import {
  Send, Pencil, Copy, MessageSquare, Mail, Phone, Bot, Zap,
  CheckCircle2, AlertTriangle, RefreshCw, FlaskConical, Sparkles,
  ChevronDown, ChevronUp, Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

/* ── Types ──────────────────────────────────────────────── */
interface Template {
  id: number;
  name: string;
  channel: "whatsapp" | "email" | "phone_script";
  stage: string;
  subject?: string;
  body: string;
  variables: string[];
}

interface QualityResult {
  score: number;
  grade: string;
  issues: string[];
  improved: string;
  tips: string[];
}

interface ABResult {
  variantA: { label: string; message: string; tone: string; bestFor: string };
  variantB: { label: string; message: string; tone: string; bestFor: string };
}

/* ── Static templates ────────────────────────────────────── */
const mockTemplates: Template[] = [
  { id: 1, name: "Initial Outreach", channel: "whatsapp", stage: "New Lead",
    body: "Namaste {{name}}! SAI RoloTech ki taraf se aapka swagat hai 🙏\nAapne {{machine}} mein interest dikhaya — hum aapko best price + free demo arrange kar sakte hain!\nKya is week koi time milega? 😊",
    variables: ["name", "machine"] },
  { id: 2, name: "Follow-up After Demo", channel: "email", stage: "Post-Demo",
    subject: "SAI RoloTech — Demo ke baad aapke liye special offer",
    body: "Dear {{name}},\n\nThank you for attending our {{machine}} demo. Aapke saath discuss karna bahut accha laga!\n\nSpecifications + best pricing attach ki hai. Koi bhi sawaal ho toh directly reply karein.\n\nBest regards,\nSAI RoloTech Team, New Delhi",
    variables: ["name", "machine"] },
  { id: 3, name: "Quotation Follow-up", channel: "whatsapp", stage: "Quotation Sent",
    body: "Hi {{name}} ji! 😊 Aapne jo quotation ({{quotation_no}}) maanga tha {{machine}} ke liye — kya dekha?\nKoi modification chahiye? Ya koi sawaal hai? Bata dein — abhi baat karte hain! 📞",
    variables: ["name", "quotation_no", "machine"] },
  { id: 4, name: "Cold Call Script", channel: "phone_script", stage: "Cold Outreach",
    body: "Good morning/afternoon {{name}} ji, main SAI RoloTech se bol raha hoon, New Delhi.\n\nHum Roll Forming Machines banate hain — Shutter Patti, False Ceiling etc.\n\nKya 2 minute mein aapki requirement samajh sakta hoon? Aapki company {{company}} ke liye best solution dhundhte hain!",
    variables: ["name", "company"] },
  { id: 5, name: "Re-engagement", channel: "email", stage: "Cold Lead",
    subject: "SAI RoloTech — Nayi machines, special offer aapke liye",
    body: "Dear {{name}},\n\nKuch time ho gaya — aapko miss kiya! 😊\n\nHamne kuch new machines add ki hain aur is quarter mein special pricing chal rahi hai.\n\nEk baar baat karein? 15 minutes mein sab clear ho jaega.\n\nWarm regards,\nSAI RoloTech Team",
    variables: ["name"] },
];

const channelColors = {
  whatsapp: "bg-emerald-50 text-emerald-700 border-emerald-200",
  email: "bg-blue-50 text-blue-600 border-blue-200",
  phone_script: "bg-amber-50 text-amber-700 border-amber-200",
};
const channelIcons = { whatsapp: MessageSquare, email: Mail, phone_script: Phone };

const GRADE_COLOR: Record<string, string> = {
  Excellent: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Good:      "text-blue-600 bg-blue-50 border-blue-200",
  Average:   "text-amber-600 bg-amber-50 border-amber-200",
  Weak:      "text-orange-600 bg-orange-50 border-orange-200",
  Poor:      "text-red-600 bg-red-50 border-red-200",
};

/* ── Main Component ──────────────────────────────────────── */
export default function OutreachTemplatesPage() {
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [expandedId, setExpandedId]           = useState<number | null>(null);

  /* Quality Checker state */
  const [qMsg, setQMsg]           = useState("");
  const [qCtx, setQCtx]           = useState("");
  const [qLoading, setQLoading]   = useState(false);
  const [qResult, setQResult]     = useState<QualityResult | null>(null);

  /* A/B Variants state */
  const [abGoal, setAbGoal]             = useState("meeting");
  const [abName, setAbName]             = useState("Customer");
  const [abZone, setAbZone]             = useState("HIGH");
  const [abSource, setAbSource]         = useState("indiamart");
  const [abLoading, setAbLoading]       = useState(false);
  const [abResult, setAbResult]         = useState<ABResult | null>(null);
  const [abCopied, setAbCopied]         = useState<"A" | "B" | null>(null);

  const filtered = selectedChannel === "all"
    ? mockTemplates
    : mockTemplates.filter(t => t.channel === selectedChannel);

  /* ── Quality check API call ── */
  async function checkQuality() {
    if (!qMsg.trim()) { toast({ title: "Message likhein", variant: "destructive" }); return; }
    setQLoading(true); setQResult(null);
    try {
      const res = await fetch("/api/message-quality", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: qMsg, leadContext: qCtx }),
      });
      const data = await res.json();
      if (data.success) setQResult(data);
      else toast({ title: "Error", description: data.error, variant: "destructive" });
    } catch { toast({ title: "Network error", variant: "destructive" }); }
    setQLoading(false);
  }

  /* ── A/B Variants API call ── */
  async function generateAB() {
    setAbLoading(true); setAbResult(null);
    try {
      const res = await fetch("/api/ab-variants", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: abGoal, leadName: abName, locationZone: abZone, source: abSource }),
      });
      const data = await res.json();
      if (data.success) setAbResult(data);
      else toast({ title: "AI Error", description: data.error, variant: "destructive" });
    } catch { toast({ title: "Network error", variant: "destructive" }); }
    setAbLoading(false);
  }

  function copyText(text: string, label: "A" | "B") {
    navigator.clipboard.writeText(text);
    setAbCopied(label);
    toast({ title: `Variant ${label} copied!` });
    setTimeout(() => setAbCopied(null), 2000);
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader title="Outreach Templates" subtitle="Templates + AI Message Quality Checker + A/B Testing" />

      {/* ── AI: Message Quality Checker ──────────────────────── */}
      <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5 border-l-4 border-blue-500">
        <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-600" /> AI Message Quality Checker
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Apna WhatsApp message likho — AI batayega score, kya galat hai, aur improved version
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Aapka Message</label>
            <textarea
              value={qMsg}
              onChange={e => setQMsg(e.target.value)}
              rows={3}
              placeholder="Yahan apna follow-up message likho..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Lead Context (optional)</label>
            <input
              value={qCtx}
              onChange={e => setQCtx(e.target.value)}
              placeholder="e.g. HOT lead, Delhi, IndiaMART se aaya..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <button
            onClick={checkQuality}
            disabled={qLoading || !qMsg.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
          >
            {qLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Quality Check Karo</>}
          </button>
        </div>

        {/* Quality Result */}
        {qResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">Quality Score</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${GRADE_COLOR[qResult.grade] || "text-slate-600 bg-slate-50 border-slate-200"}`}>
                    {qResult.grade}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${qResult.score >= 80 ? "bg-emerald-500" : qResult.score >= 60 ? "bg-blue-500" : qResult.score >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${qResult.score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{qResult.score}/100</p>
              </div>
            </div>

            {qResult.issues.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Issues
                </p>
                {qResult.issues.map((issue, i) => <p key={i} className="text-xs text-red-600">• {issue}</p>)}
              </div>
            )}

            {qResult.improved && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Improved Version
                  </p>
                  <button onClick={() => { navigator.clipboard.writeText(qResult.improved); toast({ title: "Copied!" }); }}
                    className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed whitespace-pre-line">{qResult.improved}</p>
              </div>
            )}

            {qResult.tips?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {qResult.tips.map((tip, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">💡 {tip}</span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ── AI: A/B Variants Generator ────────────────────────── */}
      <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5 border-l-4 border-purple-500">
        <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-purple-600" /> A/B Message Variants — AI Generated
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          2 alag-alag message variants AI se generate karo — test karo kaunsa better perform karta hai
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Goal</label>
            <select value={abGoal} onChange={e => setAbGoal(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20">
              <option value="meeting">Meeting Fix</option>
              <option value="quotation">Quotation</option>
              <option value="demo">Demo</option>
              <option value="app_download">App Download</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Lead Zone</label>
            <select value={abZone} onChange={e => setAbZone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20">
              <option value="HIGH">🔥 HIGH — Delhi/NCR</option>
              <option value="MEDIUM">📋 MEDIUM — North India</option>
              <option value="LOW">💬 LOW — South/Far</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Source</label>
            <select value={abSource} onChange={e => setAbSource(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20">
              <option value="indiamart">IndiaMART</option>
              <option value="justdial">Justdial</option>
              <option value="direct">Direct</option>
              <option value="pabbly">Pabbly/Ads</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Lead Name</label>
            <input value={abName} onChange={e => setAbName(e.target.value)}
              placeholder="Customer"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" />
          </div>
        </div>

        <button
          onClick={generateAB}
          disabled={abLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
        >
          {abLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><FlaskConical className="w-4 h-4" /> 2 Variants Generate Karo</>}
        </button>

        {abResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["variantA", "variantB"] as const).map(key => {
              const v = abResult[key];
              const label = key === "variantA" ? "A" : "B" as "A" | "B";
              return (
                <div key={key} className={`border rounded-2xl p-4 ${key === "variantA" ? "border-blue-200 bg-blue-50/50" : "border-emerald-200 bg-emerald-50/50"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${key === "variantA" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}`}>
                      Variant {label} — {v.label}
                    </span>
                    <button onClick={() => copyText(v.message, label)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                      {abCopied === label ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-line bg-white/70 rounded-xl p-3 border border-white mb-2">{v.message}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-muted-foreground bg-white/60 px-2 py-0.5 rounded-full border">Tone: {v.tone}</span>
                    <span className="text-[10px] text-muted-foreground bg-white/60 px-2 py-0.5 rounded-full border">Best: {v.bestFor}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {/* ── Saved Templates ──────────────────────────────────── */}
      <SectionCard title="Saved Templates" headerAction={<Send className="w-4 h-4 text-muted-foreground" />}>
        <div className="flex gap-2 flex-wrap mb-4">
          {["all", "whatsapp", "email", "phone_script"].map(ch => (
            <button key={ch} onClick={() => setSelectedChannel(ch)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedChannel === ch ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {ch === "all" ? "All" : ch === "phone_script" ? "Phone Script" : ch.charAt(0).toUpperCase() + ch.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(template => {
            const ChannelIcon = channelIcons[template.channel];
            const isOpen = expandedId === template.id;
            return (
              <motion.div key={template.id} variants={staggerItem} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isOpen ? null : template.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${channelColors[template.channel]}`}>
                      <ChannelIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{template.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={channelColors[template.channel]}>{template.channel === "phone_script" ? "phone" : template.channel}</Badge>
                        <Badge variant="outline" className="text-[10px]">{template.stage}</Badge>
                      </div>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/50">
                    {template.subject && <p className="text-xs text-muted-foreground mt-3">Subject: <span className="font-medium text-foreground">{template.subject}</span></p>}
                    <div className="p-3 rounded-xl bg-muted/30 border border-border">
                      <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">{template.body}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Variables:</span>
                        {template.variables.map(v => (
                          <Badge key={v} variant="outline" className="text-xs font-mono">{`{{${v}}}`}</Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setQMsg(template.body); toast({ title: "Template Quality Checker mein bheja!" }); }}
                          className="text-xs flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                          <Zap className="w-3 h-3" /> Quality Check
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(template.body); toast({ title: "Copied!" }); }}
                          className="text-xs flex items-center gap-1 px-2.5 py-1.5 bg-muted text-foreground border border-border rounded-lg hover:bg-muted/80 transition-colors">
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </SectionCard>
    </motion.div>
  );
}
