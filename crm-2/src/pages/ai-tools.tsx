/**
 * SAI RoloTech CRM — AI Tools Hub
 * Saare AI tools ek jagah — real capabilities, scores, live status
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader } from "@/components/shared";
import {
  Bot, FileText, Wrench, MessageSquare, Megaphone, Clock, PackagePlus,
  Users, Star, Zap, CheckCircle2, XCircle, ArrowRight, Sparkles,
  Brain, Activity, RefreshCw, TrendingUp, Shield, AlertTriangle,
  ChevronRight, BarChart3, Gauge, Scale,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

/* ── Types ──────────────────────────────────────────────────── */
interface ToolCard {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;        // tailwind bg gradient
  badge: string;        // pill label
  badgeColor: string;
  href: string;
  engine: "gemini-2.5-flash" | "openrouter+gemini" | "gemini";
  scoreType?: string;   // what score/output it produces
  scoreExample?: string;
  features: string[];
  forWho: string;
}

const TOOLS: ToolCard[] = [
  {
    id: "ai-quote",
    name: "AI Quotation Generator",
    subtitle: "Professional quotation 30 seconds mein",
    icon: FileText,
    color: "from-blue-500 to-indigo-600",
    badge: "Quotation",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    href: "/ai-quote",
    engine: "gemini-2.5-flash",
    scoreType: "Complete Quotation",
    scoreExample: "Quotation No, Specs, GST Breakdown, Grand Total, Payment Terms",
    features: [
      "Customer details + machine specs auto-fill",
      "HSN code + GST 18% automatic",
      "Delivery days + payment structure",
      "Bank details + proprietor signature",
      "Print-ready PDF format",
    ],
    forWho: "Admin / Sales Team",
  },
  {
    id: "quote-analyzer",
    name: "Competitor Quote Analyzer",
    subtitle: "Competitor ki quote score karo 0–100",
    icon: BarChart3,
    color: "from-violet-500 to-purple-600",
    badge: "Score: 0–100",
    badgeColor: "bg-violet-100 text-violet-700 border-violet-200",
    href: "/quote-analyzer",
    engine: "gemini-2.5-flash",
    scoreType: "Overall Score (0–100)",
    scoreExample: "Score: 72/100 · Verdict: Good · Price: Fair · Red Flags: 2",
    features: [
      "Overall score 0–100 (Excellent/Good/Average/Poor)",
      "Price verdict: Overpriced / Fair / Competitive / Cheap",
      "Pros aur Cons detail mein",
      "Red flags (missing warranty, 100% advance, etc.)",
      "SAI RoloTech advantage highlight",
    ],
    forWho: "Admin / Sales Team",
  },
  {
    id: "machine-guide",
    name: "MASTER Machine Troubleshooter",
    subtitle: "20+ saal ka experience — machine problems solve karo",
    icon: Wrench,
    color: "from-orange-500 to-amber-600",
    badge: "Chat AI",
    badgeColor: "bg-orange-100 text-orange-700 border-orange-200",
    href: "/machine-guide",
    engine: "gemini-2.5-flash",
    scoreType: "Step-by-step Solution",
    scoreExample: "Problem: Strip left ja rahi hai → 4 solutions + root cause",
    features: [
      "12 quick problem shortcuts (strip deviation, bow, twist, etc.)",
      "Root cause + step-by-step solutions",
      "Hindi/Hinglish mein clear explanation",
      "PLC errors, motor trip, surface marks sab handle karta hai",
      "24/7 available — koi bhi time problem batao",
    ],
    forWho: "Machine Operators / Technicians",
  },
  {
    id: "ai-sales-reply",
    name: "AI Sales Reply Generator",
    subtitle: "Lead messages ka auto Hinglish reply",
    icon: MessageSquare,
    color: "from-emerald-500 to-teal-600",
    badge: "Auto Reply",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    href: "/buddy",
    engine: "openrouter+gemini",
    scoreType: "Hinglish Sales Response",
    scoreExample: "Quick reply under 50 words, price/delivery/demo queries auto-handle",
    features: [
      "OpenRouter (Mistral 7B) primary → Gemini fallback",
      "Price/delivery/quality/demo — instant quick replies",
      "Lead name aur context ke saath personalized reply",
      "Response cache — same query pe no double API call",
      "Fallback message agar AI down ho",
    ],
    forWho: "Admin / Sales Team (via Lead Detail)",
  },
  {
    id: "message-quality",
    name: "WhatsApp Message Quality Checker",
    subtitle: "Message bhejne se pehle score check karo",
    icon: Shield,
    color: "from-green-500 to-emerald-600",
    badge: "Score: 0–10",
    badgeColor: "bg-green-100 text-green-700 border-green-200",
    href: "/wa-beta",
    engine: "gemini",
    scoreType: "Quality Score (0–10)",
    scoreExample: "Score: 8.2/10 · Clarity: Good · CTA: Strong · Urgency: Medium",
    features: [
      "Clarity, urgency, CTA, personalization score (each 0-10)",
      "Overall quality score 0–10",
      "Improvement suggestions in Hinglish",
      "WhatsApp best practices check",
      "Before-send validation",
    ],
    forWho: "Admin / Marketing",
  },
  {
    id: "marketing-content",
    name: "AI Marketing Content Generator",
    subtitle: "WhatsApp / Email / SMS content AI se banao",
    icon: Megaphone,
    color: "from-pink-500 to-rose-600",
    badge: "Content AI",
    badgeColor: "bg-pink-100 text-pink-700 border-pink-200",
    href: "/marketing-content",
    engine: "gemini",
    scoreType: "Marketing Content",
    scoreExample: "WhatsApp: 'Namaste! SAI RoloTech...' (machine-specific, 150 words max)",
    features: [
      "Machine-specific content (Shutter Patti, False Ceiling, Pipe Mill)",
      "WhatsApp, Email, SMS — teen channels",
      "Smart timing — kab contact karein (AI decides)",
      "Hinglish + English mixed content",
      "Copy karo, schedule karo",
    ],
    forWho: "Admin / Marketing",
  },
  {
    id: "smart-timing",
    name: "Smart Contact Timing AI",
    subtitle: "Sahi waqt pe contact karo — AI decide karta hai",
    icon: Clock,
    color: "from-cyan-500 to-blue-500",
    badge: "Timing",
    badgeColor: "bg-cyan-100 text-cyan-700 border-cyan-200",
    href: "/marketing-content",
    engine: "gemini",
    scoreType: "Best Contact Window",
    scoreExample: "Wait: 2 days · Best Time: Tuesday 10–11 AM · Urgency: High",
    features: [
      "Lead stage ke hisaab se wait days calculate karta hai",
      "Best day + time slot suggest karta hai",
      "Urgency level: Immediate / Today / This Week / Monthly",
      "Action script — exactly kya bolna hai",
      "Lead history context use karta hai",
    ],
    forWho: "Admin / Sales Team",
  },
  {
    id: "product-ai",
    name: "AI Product Manager",
    subtitle: "Bolke products add/delete/update karo",
    icon: PackagePlus,
    color: "from-violet-600 to-indigo-700",
    badge: "Voice Command",
    badgeColor: "bg-violet-100 text-violet-700 border-violet-200",
    href: "/product-manager",
    engine: "gemini-2.5-flash",
    scoreType: "Action + Confirmation",
    scoreExample: '"Shutter Patti ka price 4 lac karo" → ✅ Update ho gaya',
    features: [
      "Natural language commands (Hindi / Hinglish / English)",
      "Product create, update, delete support",
      "Price (lac/lakh auto-convert), category change",
      "Product list instantly refresh",
      "Chat history + color-coded responses",
    ],
    forWho: "Admin",
  },
  {
    id: "buddy-ai",
    name: "Buddy AI Sales Coach",
    subtitle: "Sales strategy, pricing, negotiation — AI guidance",
    icon: Brain,
    color: "from-amber-500 to-orange-600",
    badge: "Sales Coach",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    href: "/buddy",
    engine: "gemini",
    scoreType: "Strategy Advice",
    scoreExample: "Negotiation tips, pricing strategy, objection handling in Hinglish",
    features: [
      "Sales strategy advice",
      "Pricing aur negotiation tips",
      "Objection handling scripts",
      "Lead priority guidance",
      "SAI RoloTech ke context mein tailored advice",
    ],
    forWho: "Admin / Sales Team",
  },
  {
    id: "ai-quality-checker",
    name: "AI Quality Checker",
    subtitle: "Machine grade compare karo — Basic/Medium/Advance specs",
    icon: Scale,
    color: "from-orange-500 to-amber-600",
    badge: "Quality Grade",
    badgeColor: "bg-orange-100 text-orange-700 border-orange-200",
    href: "/ai-quality-checker",
    engine: "gemini",
    scoreType: "Grade Comparison",
    scoreExample: "Basic: 60/100, Medium: 78/100, Advance: 95/100 — full spec comparison",
    features: [
      "3 grades ka side-by-side comparison",
      "Rolls, shaft, bearing, gearbox, control — sab specs",
      "Competitor quote paste karein, AI grade estimate dega",
      "Pros/Cons har grade ke liye",
      "Warranty aur suitable use case guide",
    ],
    forWho: "Machine Buyers / Sales Team",
  },
  {
    id: "ratings",
    name: "Rate Us — Products & Services",
    subtitle: "SAI RoloTech ko rating dein — products, services, AI",
    icon: Star,
    color: "from-amber-500 to-yellow-500",
    badge: "Rating",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    href: "/ratings",
    engine: "none",
    scoreType: "Star Rating (1–5)",
    scoreExample: "Machine Quality: ★★★★☆, AI Tools: ★★★★★, Overall: ★★★★★",
    features: [
      "Machine quality rating (build, materials, durability)",
      "Service rating (response, support, installation)",
      "AI features rating (quotation, troubleshooting, speed)",
      "App overall rating with mood selector",
      "WhatsApp pe feedback bhejo directly",
    ],
    forWho: "All Users",
  },
];

const ENGINE_LABELS: Record<string, { label: string; color: string }> = {
  "gemini-2.5-flash": { label: "Gemini 2.5 Flash", color: "bg-blue-100 text-blue-700" },
  "gemini":           { label: "Gemini",             color: "bg-indigo-100 text-indigo-700" },
  "openrouter+gemini":{ label: "Mistral 7B + Gemini", color: "bg-purple-100 text-purple-700" },
};

/* ── Score Ring for Quick Demo ──────────────────────────── */
function MiniScoreRing({ score, max = 100, color = "text-violet-600" }: { score: number; max?: number; color?: string }) {
  const pct = (score / max) * 100;
  const r = 22, cx = 28, cy = 28;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  return (
    <svg width="56" height="56" className="rotate-[-90deg]">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="5"
        className={color} strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        className="fill-foreground text-[9px] font-bold rotate-90"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}>
        {score}/{max}
      </text>
    </svg>
  );
}

/* ── Live AI Status checker ─────────────────────────────── */
function useAiStatus() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  useEffect(() => {
    fetch("/api/admin/health").then(r => r.json()).then(d => {
      setStatus(d.env?.geminiKey ? "online" : "offline");
    }).catch(() => setStatus("offline"));
  }, []);
  return status;
}

/* ══════════════════════════════════════════════════════════ */
export default function AIToolsPage() {
  const [, navigate] = useLocation();
  const aiStatus = useAiStatus();
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalTools = TOOLS.length;
  const geminiTools = TOOLS.filter(t => t.engine !== "openrouter+gemini").length;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader
        title="AI Tools Hub"
        subtitle="SAI RoloTech CRM ke saare AI tools — real capabilities aur live status"
      />

      {/* ── AI Engine Status Banner ─────────────────────── */}
      <motion.div variants={staggerItem}>
        <div className={`rounded-2xl border p-4 flex items-center gap-4 ${
          aiStatus === "online"   ? "bg-emerald-50 border-emerald-200" :
          aiStatus === "offline"  ? "bg-red-50 border-red-200" :
                                    "bg-amber-50 border-amber-200"
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            aiStatus === "online" ? "bg-emerald-500" : aiStatus === "offline" ? "bg-red-500" : "bg-amber-500"
          }`}>
            {aiStatus === "online" ? <CheckCircle2 className="w-5 h-5 text-white" /> :
             aiStatus === "offline" ? <XCircle className="w-5 h-5 text-white" /> :
             <RefreshCw className="w-5 h-5 text-white animate-spin" />}
          </div>
          <div className="flex-1">
            <p className={`font-bold text-sm ${
              aiStatus === "online" ? "text-emerald-800" : aiStatus === "offline" ? "text-red-800" : "text-amber-800"
            }`}>
              Gemini AI Engine — {aiStatus === "online" ? "🟢 Live & Active" : aiStatus === "offline" ? "🔴 Key Missing" : "⏳ Checking..."}
            </p>
            <p className={`text-xs mt-0.5 ${
              aiStatus === "online" ? "text-emerald-600" : aiStatus === "offline" ? "text-red-600" : "text-amber-600"
            }`}>
              {aiStatus === "online"
                ? `${totalTools} AI tools active · Model: Gemini 2.5 Flash · Real responses enabled`
                : aiStatus === "offline"
                ? "AI_INTEGRATIONS_GEMINI_API_KEY set karo — AI Control mein ja ke enable karo"
                : "Checking Gemini connection..."}
            </p>
          </div>
          <button onClick={() => navigate("/ai-control")}
            className="text-xs font-semibold underline text-muted-foreground hover:text-foreground shrink-0">
            AI Control →
          </button>
        </div>
      </motion.div>

      {/* ── Stats Row ───────────────────────────────────── */}
      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-3">
        {[
          { label: "Total AI Tools",    value: totalTools,    icon: Bot,      color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Gemini Powered",    value: geminiTools,   icon: Sparkles, color: "text-blue-600",   bg: "bg-blue-50"   },
          { label: "User Facing Tools", value: 7,             icon: Users,    color: "text-emerald-600",bg: "bg-emerald-50"},
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-border rounded-2xl p-3 text-center`}>
            <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Score Highlight — 2 key tools ───────────────── */}
      <motion.div variants={staggerItem}>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Real Score Output — Key Tools</p>
        <div className="grid grid-cols-2 gap-3">
          {/* AI Quotation */}
          <div className="glass-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">AI Quotation</p>
                <p className="text-[10px] text-muted-foreground">Output format</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {["Quotation No (auto)", "Machine Specs list", "Price + HSN code", "GST 18% (CGST+SGST)", "Grand Total in words", "Bank details + sign"].map(f => (
                <div key={f} className="flex items-center gap-1.5 text-[10px] text-foreground">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/ai-quote")}
              className="mt-3 w-full text-[11px] font-bold py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-1">
              Try Now <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Quote Analyzer Score */}
          <div className="glass-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Quote Analyzer</p>
                <p className="text-[10px] text-muted-foreground">Real AI score</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <MiniScoreRing score={72} max={100} color="text-violet-600" />
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-foreground">Score: 0–100</span>
                </div>
                {["Excellent", "Good", "Average", "Below Avg", "Poor"].map(v => (
                  <span key={v} className="inline-block text-[9px] bg-muted text-muted-foreground rounded px-1 mr-0.5">{v}</span>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              {["Price verdict (Fair/Overpriced)", "Pros + Cons list", "Red Flags detect karta hai", "SAI advantage highlight"].map(f => (
                <div key={f} className="flex items-center gap-1.5 text-[10px] text-foreground">
                  <CheckCircle2 className="w-3 h-3 text-violet-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/quote-analyzer")}
              className="mt-3 w-full text-[11px] font-bold py-1.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-all flex items-center justify-center gap-1">
              Try Now <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── All Tools Grid ──────────────────────────────── */}
      <motion.div variants={staggerItem}>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Saare {totalTools} AI Tools</p>
        <div className="space-y-3">
          {TOOLS.map((tool) => {
            const isOpen = expanded === tool.id;
            const eng = ENGINE_LABELS[tool.engine];
            return (
              <motion.div key={tool.id} layout className="glass-card border border-border rounded-2xl overflow-hidden">
                {/* Card Header */}
                <button
                  className="w-full text-left p-4 flex items-center gap-3"
                  onClick={() => setExpanded(isOpen ? null : tool.id)}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0 shadow`}>
                    <tool.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground">{tool.name}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${tool.badgeColor}`}>
                        {tool.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{tool.subtitle}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border overflow-hidden"
                    >
                      <div className="p-4 space-y-3">
                        {/* Engine + Score type */}
                        <div className="flex flex-wrap gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${eng.color}`}>
                            🤖 {eng.label}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-muted text-muted-foreground">
                            👤 {tool.forWho}
                          </span>
                        </div>

                        {/* Score/Output example */}
                        {tool.scoreExample && (
                          <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-3 border border-border">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Real Output / Score</p>
                            <p className="text-xs font-medium text-foreground">{tool.scoreExample}</p>
                          </div>
                        )}

                        {/* Features */}
                        <div className="grid grid-cols-1 gap-1">
                          {tool.features.map(f => (
                            <div key={f} className="flex items-start gap-2 text-xs text-foreground">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                              {f}
                            </div>
                          ))}
                        </div>

                        {/* Open button */}
                        <button
                          onClick={() => navigate(tool.href)}
                          className={`w-full py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${tool.color} hover:opacity-90 transition-all flex items-center justify-center gap-2`}
                        >
                          <tool.icon className="w-4 h-4" />
                          {tool.name} Open Karo
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Bottom Summary ──────────────────────────────── */}
      <motion.div variants={staggerItem}
        className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-5 text-center">
        <Sparkles className="w-8 h-8 text-violet-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-violet-900">SAI RoloTech CRM — AI Powered</p>
        <p className="text-xs text-violet-600 mt-1">
          {totalTools} AI tools · Gemini 2.5 Flash · Hinglish support · Real-time responses
        </p>
        <p className="text-[10px] text-violet-500 mt-2">
          Quotation → Troubleshooting → Sales → Marketing → Product Management — sab AI se
        </p>
      </motion.div>
    </motion.div>
  );
}
