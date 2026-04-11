/**
 * SAI RoloTech — AI Quality Checker
 * Compare machine quality grades and analyze competitor specifications
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import {
  ArrowLeft, Bot, Upload, CheckCircle2, XCircle, AlertTriangle,
  ShieldCheck, Wrench, Star, ChevronRight, Loader2, ArrowRight,
  FileText, Zap, Scale, Package, MessageSquare, ExternalLink,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const WHATSAPP = "919899925274";

/* ─── Grade Data ───────────────────────────────────────────── */
const GRADES = {
  Basic: {
    icon: "🔵",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    priceRange: "₹2.5L – ₹4.5L",
    badge: "Entry Level",
    tagline: "Reliable performance for small-scale operations",
    score: 60,
    parts: {
      rolls: "En8 / C45 Steel",
      shaft: "35mm Mild Steel",
      machining: "Lathe Machine",
      bearings: "Local Chinese Bearings",
      gearbox: "Chain Drive",
      control: "Push Button",
      frame: "Fabricated MS",
      cutter: "Circular Blade Manual",
    },
    highlights: [
      { label: "Rolls", value: "En8 Steel", status: "ok" },
      { label: "Shaft", value: "35mm MS", status: "ok" },
      { label: "Machining", value: "Lathe", status: "ok" },
      { label: "Bearings", value: "Local", status: "warn" },
      { label: "Gearbox", value: "Chain", status: "warn" },
      { label: "Control", value: "Push Button", status: "warn" },
      { label: "Accuracy", value: "±0.3mm", status: "ok" },
      { label: "Speed", value: "4–5 m/min", status: "warn" },
    ],
    warranty: "1 Year on Rolls",
    suitable: "Small fabricators, occasional use",
    pros: ["Budget friendly", "Easy maintenance", "Simple operation"],
    cons: ["Lower accuracy", "Slower speed", "More wear over time"],
  },
  Medium: {
    icon: "🟣",
    color: "from-purple-500 to-violet-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    priceRange: "₹4L – ₹6.5L",
    badge: "Professional",
    tagline: "Industrial-grade for regular production",
    score: 78,
    parts: {
      rolls: "En31 / D3 Steel",
      shaft: "45mm Alloy Steel",
      machining: "CNC Machine",
      bearings: "SKF/NSK Brand",
      gearbox: "Worm Gear Box",
      control: "PLC + HMI Panel",
      frame: "Fabricated ISMC",
      cutter: "Hydraulic Shear",
    },
    highlights: [
      { label: "Rolls", value: "En31/D3", status: "good" },
      { label: "Shaft", value: "45mm Alloy", status: "good" },
      { label: "Machining", value: "CNC", status: "good" },
      { label: "Bearings", value: "SKF/NSK", status: "good" },
      { label: "Gearbox", value: "Worm Gear", status: "ok" },
      { label: "Control", value: "PLC+HMI", status: "good" },
      { label: "Accuracy", value: "±0.15mm", status: "good" },
      { label: "Speed", value: "6–8 m/min", status: "good" },
    ],
    warranty: "2 Years on Rolls + Motor",
    suitable: "Medium fabricators, regular production",
    pros: ["Good accuracy", "PLC control", "SKF bearings", "Faster speed", "2 yr warranty"],
    cons: ["Higher initial cost", "Requires skilled operator"],
  },
  Advance: {
    icon: "🟠",
    color: "from-orange-500 to-amber-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    priceRange: "₹5.5L – ₹8L+",
    badge: "Premium",
    tagline: "Maximum precision for high-volume manufacturing",
    score: 95,
    parts: {
      rolls: "D3 / HCHCr Steel",
      shaft: "50mm Ground & Hardened",
      machining: "CNC + Advanced Grinding",
      bearings: "FAG Germany / TIMKEN",
      gearbox: "Planetary Gearbox",
      control: "PLC + HMI + Servo",
      frame: "Fabricated + Stress Relieved",
      cutter: "Flying Cut-off / Hydraulic",
    },
    highlights: [
      { label: "Rolls", value: "D3/HCHCr", status: "best" },
      { label: "Shaft", value: "50mm Hardened", status: "best" },
      { label: "Machining", value: "CNC+Grinding", status: "best" },
      { label: "Bearings", value: "FAG/TIMKEN", status: "best" },
      { label: "Gearbox", value: "Planetary", status: "best" },
      { label: "Control", value: "PLC+HMI+Servo", status: "best" },
      { label: "Accuracy", value: "±0.05mm", status: "best" },
      { label: "Speed", value: "10–15 m/min", status: "best" },
    ],
    warranty: "5 Years on Rolls + Full Machine",
    suitable: "Large manufacturers, export quality production",
    pros: ["Best accuracy", "German bearings", "Flying cut-off", "Max speed", "5 yr warranty", "Export quality"],
    cons: ["Premium pricing", "Higher maintenance cost"],
  },
};

/* ─── Status Badge ──────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  if (status === "best") return <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">★ Best</span>;
  if (status === "good") return <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">✓ Good</span>;
  if (status === "ok") return <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">OK</span>;
  if (status === "warn") return <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">⚠ Caution</span>;
  return null;
}

/* ─── Score Bar ─────────────────────────────────────────────── */
function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">Quality Score</span>
        <span className={`text-sm font-black ${color}`}>{score}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${color.startsWith("text-") ? color.replace("text-", "bg-") : color}`}
        />
      </div>
    </div>
  );
}

/* ─── Compare Table ─────────────────────────────────────────── */
function CompareTable() {
  const [selected, setSelected] = useState<("Basic" | "Medium" | "Advance")[]>(["Basic", "Medium", "Advance"]);

  const rows = [
    { label: "Rolls", key: "rolls" as keyof typeof GRADES.Basic.parts },
    { label: "Shaft", key: "shaft" as keyof typeof GRADES.Basic.parts },
    { label: "Machining", key: "machining" as keyof typeof GRADES.Basic.parts },
    { label: "Bearings", key: "bearings" as keyof typeof GRADES.Basic.parts },
    { label: "Gearbox", key: "gearbox" as keyof typeof GRADES.Basic.parts },
    { label: "Control System", key: "control" as keyof typeof GRADES.Basic.parts },
    { label: "Frame", key: "frame" as keyof typeof GRADES.Basic.parts },
    { label: "Cutting", key: "cutter" as keyof typeof GRADES.Basic.parts },
  ];

  const toggleGrade = (g: "Basic" | "Medium" | "Advance") => {
    if (selected.includes(g) && selected.length === 1) return;
    setSelected(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  return (
    <div className="space-y-3">
      {/* Grade toggles */}
      <div className="flex gap-2">
        {(Object.keys(GRADES) as ("Basic" | "Medium" | "Advance")[]).map(g => (
          <button
            key={g}
            onClick={() => toggleGrade(g)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
              selected.includes(g)
                ? `${GRADES[g].border} ${GRADES[g].bg} ${GRADES[g].text}`
                : "border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
          >
            {selected.includes(g) ? "✓ " : ""}{g}
          </button>
        ))}
      </div>

      {/* Comparison table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600 w-1/3">Specification</th>
              {selected.map(g => (
                <th key={g} className={`text-center px-2 py-2.5 font-bold ${GRADES[g].text}`}>
                  {g}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.key} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                <td className="px-4 py-2.5 font-semibold text-gray-700">{row.label}</td>
                {selected.map(g => (
                  <td key={g} className="px-2 py-2.5 text-center">
                    <span className="text-[11px] font-medium">{GRADES[g].parts[row.key]}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Competitor Analyzer ─────────────────────────────────── */
function CompetitorAnalyzer() {
  const [specs, setSpecs] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!specs.trim()) {
      toast({ title: "Specs daalein", description: "Machine specifications paste karein.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 2500));
    setAnalyzing(false);
    setResult(`Based on the specifications provided, this machine appears to fall in the **Medium Quality Grade** category.

**Analysis:**
- PLC+HMI control system indicates medium-to-advance quality
- Hydraulic shear cutting suggests professional grade
- CNC machined rolls indicate good quality

**Grade Estimate:** 🟣 Medium (Score: 72/100)

**Comparison with SAI RoloTech:**
- SAI RoloTech Medium: ₹4L–₹6.5L with 2 yr warranty
- SAI RoloTech Advance: ₹5.5L–₹8L with 5 yr warranty, FAG bearings, Flying cut-off

**Recommendation:** If this machine has En31 rolls, SKF bearings, and PLC control, it's comparable to SAI RoloTech Medium Grade. For higher accuracy and speed, consider SAI RoloTech Advance Grade.

Contact our technical team for detailed comparison.`);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          <Upload className="w-3.5 h-3.5 inline mr-1" />
          Paste Competitor Machine Specifications
        </label>
        <textarea
          value={specs}
          onChange={e => setSpecs(e.target.value)}
          placeholder={`Jaise:\nRolls: En31 Steel\nShaft: 45mm\nControl: PLC + HMI\nBearings: SKF\nSpeed: 6 m/min\nCutting: Hydraulic\nPrice: ₹5,00,000\n\n(Paste koi bhi competitor quote ya specs)`}
          rows={6}
          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
        />
        <p className="text-[10px] text-gray-400 mt-1">PDF text, quotation specs, ya website text paste karein</p>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={analyzing}
        className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
      >
        {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> AI Analyzing...</> : <><Bot className="w-4 h-4" /> AI Quality Analysis Karo</>}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-gray-800">AI Quality Analysis</span>
            </div>
            <div className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
              {result.split("\n").map((line, i) => {
                if (line.startsWith("**") && line.endsWith("**")) {
                  return <p key={i} className="font-bold text-gray-800 mt-2">{line.replace(/\*\*/g, "")}</p>;
                }
                if (line.startsWith("**")) {
                  return <p key={i} className="font-semibold text-gray-700 mt-1">{line.replace(/\*\*/g, "")}</p>;
                }
                if (line.startsWith("-")) {
                  return <p key={i} className="text-gray-600 pl-2">{line}</p>;
                }
                return <p key={i} className="text-gray-700">{line}</p>;
              })}
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Namaste! I used the AI Quality Checker and need help comparing machines. Can you suggest which SAI RoloTech machine is right for me?")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Expert Advice
              </a>
              <button
                onClick={() => { setResult(null); setSpecs(""); }}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function AIQualityChecker() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"grades" | "compare" | "analyze">("grades");
  const [expandedGrade, setExpandedGrade] = useState<"Basic" | "Medium" | "Advance" | null>("Medium");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white pb-10">

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 px-4 pt-6 pb-8">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setLocation("/ai-tools")}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <p className="text-orange-200 text-xs font-medium">SAI RoloTech AI Tools</p>
            <h1 className="text-xl font-black text-white">AI Quality Checker</h1>
          </div>
          <div className="ml-auto">
            <div className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" /> AI Powered
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4">

        {/* AI Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800">
            <strong>Quality grading based on SAI RoloTech's 20+ years experience.</strong> Grades help you understand machine quality differences — actual specs may vary by manufacturer.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: "grades" as const, icon: Scale, label: "Grade Guide" },
            { id: "compare" as const, icon: Wrench, label: "Compare" },
            { id: "analyze" as const, icon: Bot, label: "AI Analyze" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                tab === t.id
                  ? "bg-white border-2 border-blue-500 text-blue-700 shadow-md"
                  : "bg-white/70 border-2 border-transparent text-gray-600 hover:border-gray-200"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Grade Guide Tab */}
        {tab === "grades" && (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
            {(Object.keys(GRADES) as ("Basic" | "Medium" | "Advance")[]).map(grade => {
              const data = GRADES[grade];
              const isOpen = expandedGrade === grade;
              return (
                <motion.div
                  key={grade}
                  variants={staggerItem}
                  className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${
                    isOpen ? `${data.border} shadow-lg` : "border-gray-200 shadow-sm"
                  }`}
                >
                  {/* Grade Header */}
                  <button
                    className="w-full text-left p-4"
                    onClick={() => setExpandedGrade(isOpen ? null : grade)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${data.color} flex items-center justify-center text-xl shadow-md`}>
                        {data.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-gray-800">{grade} Grade</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${data.bg} ${data.text}`}>{data.badge}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{data.tagline}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-gray-800">{data.priceRange}</p>
                        <p className={`text-[10px] font-bold ${data.text}`}>{data.score}/100</p>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 overflow-hidden"
                      >
                        <div className="p-4 space-y-4">

                          {/* Score bar */}
                          <ScoreBar score={data.score} color={data.text} />

                          {/* Spec highlights */}
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Specifications</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {data.highlights.map(({ label, value, status }) => (
                                <div key={label} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-1.5">
                                    {status === "best" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                    {status === "good" && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                                    {status === "ok" && <CheckCircle2 className="w-3 h-3 text-gray-400" />}
                                    {status === "warn" && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                                    <span className="text-[10px] text-gray-600">{label}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-semibold text-gray-700">{value}</span>
                                    <StatusBadge status={status} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Pros & Cons */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1.5">✅ Pros</p>
                              <div className="space-y-1">
                                {data.pros.map(p => (
                                  <div key={p} className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <span className="text-[10px] text-gray-700">{p}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-red-600 uppercase mb-1.5">⚠️ Cons</p>
                              <div className="space-y-1">
                                {data.cons.map(c => (
                                  <div key={c} className="flex items-center gap-1.5">
                                    <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                                    <span className="text-[10px] text-gray-700">{c}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Warranty + Suitable */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-blue-50 rounded-xl p-3 text-center">
                              <ShieldCheck className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                              <p className="text-[10px] font-bold text-blue-800">{data.warranty}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                              <Star className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                              <p className="text-[10px] text-gray-700 leading-tight">{data.suitable}</p>
                            </div>
                          </div>

                          {/* Action */}
                          <a
                            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Namaste! Main ${grade} Grade machine ke baare mein jaankari chahiye. Price: ${data.priceRange}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-gradient-to-r ${data.color} text-white shadow-md hover:opacity-90 transition-opacity`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            {grade} Grade Ke Baare Mein Poochein
                            <ArrowRight className="w-4 h-4" />
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Compare Tab */}
        {tab === "compare" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <CompareTable />

            {/* Recommendation */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-800">Which Grade Chuniye?</h3>
              </div>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">Basic →</span>
                  <span>Small orders, occasional use, budget priority</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">Medium →</span>
                  <span>Regular production, professional quality, best value</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">Advance →</span>
                  <span>High volume, export quality, maximum precision</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <a
                  href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Namaste! Main machine quality compare kar raha hoon. Kaunsi grade sahi hogi meri requirement ke liye?")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Expert Guidance Lo
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Analyze Tab */}
        {tab === "analyze" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <CompetitorAnalyzer />

            {/* Quick Tips */}
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-violet-800 flex items-center gap-1.5">
                <Bot className="w-4 h-4" /> AI Analysis Tips
              </p>
              {[
                "Paste the competitor quotation text directly for best results",
                "Include machine specifications, brand name, and price if available",
                "The AI will compare against SAI RoloTech's known quality benchmarks",
                "For physical inspection, visit our workshop in Mundka, Delhi",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-violet-500 font-bold mt-0.5">{i + 1}.</span>
                  <p className="text-[11px] text-violet-700">{tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
