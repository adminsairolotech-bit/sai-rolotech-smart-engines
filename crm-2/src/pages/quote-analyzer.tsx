import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, Loader2, CheckCircle, XCircle, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Star, Upload, FileText,
  ThumbsUp, ThumbsDown, IndianRupee, ShieldAlert, Lightbulb,
  ClipboardList, RefreshCw, ChevronRight, Sparkles, Eye
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AIDisclaimer } from "@/components/shared";

interface ProItem { point: string; detail: string; }
interface ConItem { point: string; detail: string; severity: "High" | "Medium" | "Low"; }
interface Analysis {
  companyName: string;
  quotationRef: string;
  totalAmount: string;
  overallScore: number;
  overallVerdict: "Excellent" | "Good" | "Average" | "Below Average" | "Poor";
  summary: string;
  pros: ProItem[];
  cons: ConItem[];
  priceAnalysis: { verdict: string; detail: string; savingOpportunity: string };
  missingItems: string[];
  redFlags: string[];
  recommendations: string[];
  sairolotech_advantage: string;
}

const SAMPLE_QUOTE = `Quotation from: XYZ Automation Solutions
Quotation No: XYZ-2025-0892
Date: 15/03/2025

Client: Ravi Industries, Pune

Items:
1. Siemens S7-1200 PLC - Qty: 2 - Rate: 65,000 - Amount: 1,30,000
2. Delta HMI 7 inch - Qty: 1 - Rate: 25,000 - Amount: 25,000
3. Delta VFD 5.5kW - Qty: 3 - Rate: 18,000 - Amount: 54,000
4. Panel Manufacturing (MS) - Qty: 1 - Rate: 35,000 - Amount: 35,000

Subtotal: 2,44,000
GST 18%: 43,920
Grand Total: 2,87,920

Payment: 100% advance
Delivery: 30 days
Warranty: 6 months`;

function ScoreRing({ score }: { score: number }) {
  const color = score >= 8 ? "#22c55e" : score >= 6 ? "#f59e0b" : score >= 4 ? "#f97316" : "#ef4444";
  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = circumference - (score / 10) * circumference;
  return (
    <div className="relative w-24 h-24 flex items-center justify-center" role="img" aria-label={`Score: ${score} out of 10`}>
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-slate-800">{score}</div>
        <div className="text-xs text-slate-500">/10</div>
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const map: Record<string, string> = {
    "Excellent": "bg-emerald-50 border-emerald-300 text-emerald-700",
    "Good": "bg-blue-50 border-blue-300 text-blue-700",
    "Average": "bg-amber-50 border-amber-300 text-amber-700",
    "Below Average": "bg-orange-50 border-orange-300 text-orange-700",
    "Poor": "bg-red-50 border-red-300 text-red-700",
  };
  return <span className={`px-3 py-1 rounded-full border text-sm font-semibold ${map[verdict] || map["Average"]}`}>{verdict}</span>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    "High": "bg-red-50 text-red-700 border border-red-200",
    "Medium": "bg-amber-50 text-amber-700 border border-amber-200",
    "Low": "bg-blue-50 text-blue-700 border border-blue-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[severity] || map["Low"]}`}>{severity}</span>;
}

function PriceVerdictIcon({ verdict }: { verdict: string }) {
  if (verdict === "Overpriced") return <TrendingUp className="w-5 h-5 text-red-500" aria-hidden="true" />;
  if (verdict === "Competitive") return <TrendingDown className="w-5 h-5 text-emerald-500" aria-hidden="true" />;
  if (verdict === "Fair") return <Minus className="w-5 h-5 text-amber-500" aria-hidden="true" />;
  return <AlertTriangle className="w-5 h-5 text-orange-500" aria-hidden="true" />;
}

export default function QuoteAnalyzerPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"input" | "loading" | "result">("input");
  const [quotationText, setQuotationText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setQuotationText(text);
      toast({ title: "File loaded!", description: `${file.name} ka content paste ho gaya.` });
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!quotationText.trim() || quotationText.trim().length < 30) {
      toast({ title: "Quotation paste karein", description: "Analyze karne ke liye quotation text chahiye.", variant: "destructive" });
      return;
    }
    setStep("loading");
    let catalogData = null;
    try {
      const stored = localStorage.getItem("sai_product_catalog");
      if (stored) catalogData = JSON.parse(stored);
      else {
        const res = await fetch("/product-catalog.json");
        if (res.ok) catalogData = await res.json();
      }
    } catch { /* ok */ }

    try {
      const res = await fetch("/api/analyze-quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotationText, catalogData }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        setStep("result");
      } else {
        throw new Error(data.error || "AI response error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Analysis Failed", description: msg, variant: "destructive" });
      setStep("input");
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setStep("input");
    setQuotationText("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation("/home")}
            aria-label="Go back"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-600 to-blue-700 flex items-center justify-center shadow-sm">
            <Search className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-slate-800 font-semibold text-sm">AI Quotation Analyzer</h1>
            <p className="text-slate-400 text-xs">Kisi bhi company ki quotation check karein · Powered by Gemini AI</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4 max-w-lg mx-auto"><AIDisclaimer /></div>
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-full px-4 py-1.5 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                  <span className="text-sky-700 text-sm font-medium">AI Quotation Analyzer</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Kisi Bhi Quotation Ko Analyze Karein</h2>
                <p className="text-slate-500 text-sm mt-1">Competitor ya kisi bhi company ki quotation paste karein — AI batayega kya sahi hai, kya galat hai</p>
              </div>

              {/* Feature Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: ThumbsUp, label: "Kya Acha Hai", desc: "Pros & strong points", cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                  { icon: ThumbsDown, label: "Kya Bura Hai", desc: "Cons & red flags", cls: "text-red-600 bg-red-50 border-red-200" },
                  { icon: IndianRupee, label: "Price Analysis", desc: "Overpriced ya fair?", cls: "text-amber-600 bg-amber-50 border-amber-200" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={`rounded-xl border p-3 flex items-center gap-3 ${item.cls}`}>
                      <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-800 font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" aria-hidden="true" />
                    Quotation Text Paste Karein
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setQuotationText(SAMPLE_QUOTE)}
                      aria-label="Load sample quotation"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                    >
                      <Eye className="w-3 h-3" aria-hidden="true" />
                      Sample Load
                    </button>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer">
                      <Upload className="w-3 h-3" aria-hidden="true" />
                      File Upload
                      <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" aria-label="Upload quotation file" />
                    </label>
                  </div>
                </div>

                <label htmlFor="quote-textarea" className="sr-only">Quotation text</label>
                <textarea
                  id="quote-textarea"
                  value={quotationText}
                  onChange={e => setQuotationText(e.target.value)}
                  placeholder={`Yahan kisi bhi company ki quotation paste karein...\n\nJaise:\nQuotation from: ABC Company\nItem: PLC Panel - ₹75,000\nItem: HMI 7" - ₹30,000\nGST 18%: ₹18,900\nTotal: ₹1,23,900\n\n...ya upar "Sample Load" button click karein demo dekhne ke liye`}
                  rows={14}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all resize-none font-mono"
                />

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{quotationText.length} characters</span>
                  {quotationText.length > 0 && (
                    <button
                      onClick={() => setQuotationText("")}
                      aria-label="Clear text"
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                aria-label="Analyze quotation with AI"
                className="w-full bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-semibold rounded-2xl py-4 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 text-lg focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <Search className="w-5 h-5" aria-hidden="true" />
                AI se Analyze Karein
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-200">
                  <Search className="w-10 h-10 text-white" aria-hidden="true" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" aria-hidden="true" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-slate-800 text-xl font-bold">AI Analyze Kar Raha Hai...</h3>
                <p className="text-slate-500 mt-1">Quotation ki har line check ho rahi hai</p>
              </div>
              <div className="flex flex-col gap-2 text-sm text-slate-400 text-center" aria-live="polite">
                {[
                  "Products aur pricing identify kar raha hai...",
                  "Market rates se compare kar raha hai...",
                  "Hidden issues dhundh raha hai...",
                  "Professional report bana raha hai...",
                ].map((msg, i) => (
                  <motion.p key={msg} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.5 }}>{msg}</motion.p>
                ))}
              </div>
            </motion.div>
          )}

          {step === "result" && analysis && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Result Header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                    <span className="text-emerald-600 font-semibold">Analysis Complete!</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-0.5">{analysis.companyName} · Ref: {analysis.quotationRef}</p>
                </div>
                <button
                  onClick={handleReset}
                  aria-label="Analyze new quotation"
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm transition-colors shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Naya
                </button>
              </div>

              {/* Overall Score Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <ScoreRing score={analysis.overallScore} />
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                      <VerdictBadge verdict={analysis.overallVerdict} />
                      {analysis.totalAmount !== "N/A" && (
                        <span className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {analysis.totalAmount}
                        </span>
                      )}
                    </div>
                    <h3 className="text-slate-800 text-lg font-bold">{analysis.companyName}</h3>
                    <p className="text-slate-500 text-sm mt-1">{analysis.summary}</p>
                  </div>
                </div>
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
                  <h4 className="text-emerald-700 font-semibold flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4" aria-hidden="true" /> Kya Acha Hai ({analysis.pros?.length || 0})
                  </h4>
                  {(analysis.pros || []).map((pro, i) => (
                    <div key={i} className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-slate-800 text-sm font-medium">{pro.point}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{pro.detail}</p>
                      </div>
                    </div>
                  ))}
                  {(!analysis.pros || analysis.pros.length === 0) && (
                    <p className="text-slate-400 text-sm">Koi visible pros nahi mile.</p>
                  )}
                </div>

                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
                  <h4 className="text-red-700 font-semibold flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4" aria-hidden="true" /> Kya Bura Hai ({analysis.cons?.length || 0})
                  </h4>
                  {(analysis.cons || []).map((con, i) => (
                    <div key={i} className="flex gap-2">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-slate-800 text-sm font-medium">{con.point}</p>
                          <SeverityBadge severity={con.severity} />
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">{con.detail}</p>
                      </div>
                    </div>
                  ))}
                  {(!analysis.cons || analysis.cons.length === 0) && (
                    <p className="text-slate-400 text-sm">Koi major cons nahi mile.</p>
                  )}
                </div>
              </div>

              {/* Price Analysis */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h4 className="text-slate-800 font-semibold flex items-center gap-2 mb-3">
                  <IndianRupee className="w-4 h-4 text-amber-500" aria-hidden="true" /> Price Analysis
                </h4>
                <div className="flex items-center gap-2 mb-2">
                  <PriceVerdictIcon verdict={analysis.priceAnalysis?.verdict} />
                  <span className={`font-bold text-sm ${
                    analysis.priceAnalysis?.verdict === "Overpriced" ? "text-red-600" :
                    analysis.priceAnalysis?.verdict === "Competitive" ? "text-emerald-600" :
                    analysis.priceAnalysis?.verdict === "Fair" ? "text-amber-600" : "text-orange-600"
                  }`}>{analysis.priceAnalysis?.verdict}</span>
                </div>
                <p className="text-slate-600 text-sm">{analysis.priceAnalysis?.detail}</p>
                {analysis.priceAnalysis?.savingOpportunity && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    <p className="text-emerald-700 text-sm">💡 {analysis.priceAnalysis.savingOpportunity}</p>
                  </div>
                )}
              </div>

              {/* Missing Items & Red Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.missingItems && analysis.missingItems.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                    <h4 className="text-orange-700 font-semibold flex items-center gap-2 mb-3">
                      <ClipboardList className="w-4 h-4" aria-hidden="true" /> Jo Missing Hai
                    </h4>
                    <div className="space-y-1.5">
                      {analysis.missingItems.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <p className="text-slate-700 text-sm">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.redFlags && analysis.redFlags.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                    <h4 className="text-red-700 font-semibold flex items-center gap-2 mb-3">
                      <ShieldAlert className="w-4 h-4" aria-hidden="true" /> Red Flags ⚠️
                    </h4>
                    <div className="space-y-1.5">
                      {analysis.redFlags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <p className="text-slate-700 text-sm">{flag}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                  <h4 className="text-indigo-700 font-semibold flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4" aria-hidden="true" /> AI Recommendations
                  </h4>
                  <div className="space-y-2">
                    {analysis.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-700 text-xs font-bold flex-shrink-0 flex items-center justify-center mt-0.5">{i + 1}</span>
                        <p className="text-slate-700 text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SAI RoloTech Advantage */}
              {analysis.sairolotech_advantage && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Star className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-slate-800 font-semibold mb-1">SAI RoloTech Advantage</h4>
                    <p className="text-slate-600 text-sm">{analysis.sairolotech_advantage}</p>
                    <button
                      onClick={() => setLocation("/ai-quote")}
                      className="mt-3 flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors focus-visible:underline"
                    >
                      SAI RoloTech se quotation mangwayein <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
