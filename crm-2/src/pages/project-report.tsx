import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, FileText, Loader2, Printer,
  User, Building2, Factory, IndianRupee, BarChart3,
  CheckCircle2, RefreshCw, ChevronRight, Sparkles, Download, Save, RotateCcw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const AUTOSAVE_KEY = "sai_project_report_draft";

interface FormData {
  // Step 1 - Applicant
  applicantName: string;
  fatherName: string;
  dob: string;
  gender: string;
  qualification: string;
  experience: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  aadhaar: string;
  pan: string;
  category: string;
  // Step 2 - Business
  businessName: string;
  businessType: string;
  proposedLocation: string;
  loanScheme: string;
  industryType: string;
  productDescription: string;
  targetMarket: string;
  // Step 3 - Machine / Technical
  machineName: string;
  machineCapacity: string;
  machinePrice: string;
  machineSupplier: string;
  landArea: string;
  buildingCost: string;
  otherEquipment: string;
  rawMaterial: string;
  powerRequirement: string;
  manpowerTotal: string;
  manpowerSkilled: string;
  workingDaysPerYear: string;
  // Step 4 - Financial
  totalProjectCost: string;
  ownContribution: string;
  loanAmount: string;
  bankName: string;
  expectedRevenueMontly: string;
  rawMaterialCostMonthly: string;
  labourCostMonthly: string;
  overheadMonthly: string;
  loanTenure: string;
  interestRate: string;
}

const EMPTY: FormData = {
  applicantName: "", fatherName: "", dob: "", gender: "", qualification: "",
  experience: "", address: "", city: "", state: "Maharashtra", pincode: "",
  phone: "", email: "", aadhaar: "", pan: "", category: "General",
  businessName: "", businessType: "Proprietorship", proposedLocation: "",
  loanScheme: "PMEGP", industryType: "Manufacturing", productDescription: "",
  targetMarket: "", machineName: "Roll Forming Machine", machineCapacity: "",
  machinePrice: "", machineSupplier: "SAI RoloTech, Pune", landArea: "",
  buildingCost: "", otherEquipment: "", rawMaterial: "", powerRequirement: "",
  manpowerTotal: "", manpowerSkilled: "", workingDaysPerYear: "300",
  totalProjectCost: "", ownContribution: "", loanAmount: "", bankName: "",
  expectedRevenueMontly: "", rawMaterialCostMonthly: "", labourCostMonthly: "",
  overheadMonthly: "", loanTenure: "7", interestRate: "11.5",
};

const STEPS = [
  { id: 1, label: "Aavedan Karta", sublabel: "Applicant Details", icon: User, color: "from-violet-600 to-blue-600" },
  { id: 2, label: "Business", sublabel: "Project & Business", icon: Building2, color: "from-blue-600 to-cyan-600" },
  { id: 3, label: "Machine", sublabel: "Technical Details", icon: Factory, color: "from-green-600 to-emerald-600" },
  { id: 4, label: "Vittiya", sublabel: "Financial Details", icon: IndianRupee, color: "from-yellow-600 to-orange-600" },
];

function inp(extra = "") {
  return `w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[16px] ${extra}`;
}
function sel(extra = "") {
  return `w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[16px] ${extra}`;
}
function Lbl({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return <label className="block text-xs font-medium text-slate-600 mb-1.5">{children}{req && <span className="text-red-500 ml-0.5">*</span>}</label>;
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}
function Row3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{children}</div>;
}
function Section({ title }: { title: string }) {
  return <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-200 mt-1">{title}</p>;
}

function ReportView({ report, onNew }: { report: string; onNew: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-400" />
        <div className="flex-1">
          <p className="text-green-400 font-semibold">Project Report Ready!</p>
          <p className="text-slate-400 text-xs">Bank submission ke liye professional format mein taiyar hai</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 rounded-lg text-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Naya
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm">
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>
        </div>
      </div>
      <div id="project-report-print" className="bg-white text-gray-900 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
          {report}
        </div>
      </div>
    </motion.div>
  );
}

export default function ProjectReportPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"form" | "loading" | "done">("form");
  const [report, setReport] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Load initial form data (restore draft if exists)
  const [f, setF] = useState<FormData>(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...EMPTY, ...parsed.data };
      }
    } catch { /* ignore */ }
    return { ...EMPTY, applicantName: user?.name || "", phone: "", email: user?.email || "" };
  });

  // Check for draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data?.applicantName) {
          setHasDraft(true);
          setLastSaved(parsed.savedAt || null);
          toast({
            title: "📝 Draft Restore hua!",
            description: `Aapka pichla draft restore ho gaya hai. ${parsed.savedAt ? `Last saved: ${new Date(parsed.savedAt).toLocaleTimeString('en-IN')}` : ''}`,
          });
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Autosave on every change (debounced 1.5s)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const draft = { data: f, savedAt: new Date().toISOString(), step };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
        setLastSaved(new Date().toLocaleTimeString('en-IN'));
      } catch { /* ignore */ }
    }, 1500);
    return () => clearTimeout(timer);
  }, [f, step]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(AUTOSAVE_KEY);
    setHasDraft(false);
    setLastSaved(null);
    setF({ ...EMPTY, applicantName: user?.name || "", phone: "", email: user?.email || "" });
    setStep(1);
    toast({ title: "Draft Clear hua", description: "Naya form start karo." });
  }, [user]);

  const upd = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  const nextStep = () => {
    if (step === 1 && (!f.applicantName || !f.phone || !f.city)) {
      toast({ title: "Required fields bharen", description: "Naam, Phone aur City zaroori hai.", variant: "destructive" }); return;
    }
    if (step === 2 && (!f.businessName || !f.productDescription)) {
      toast({ title: "Business details bharen", description: "Business naam aur product description zaroori hai.", variant: "destructive" }); return;
    }
    if (step === 3 && (!f.machinePrice || !f.rawMaterial)) {
      toast({ title: "Machine details bharen", description: "Machine price aur raw material zaroori hai.", variant: "destructive" }); return;
    }
    setStep(s => s + 1);
  };

  const generate = async () => {
    if (!f.totalProjectCost || !f.loanAmount) {
      toast({ title: "Financial details bharen", description: "Total project cost aur loan amount zaroori hai.", variant: "destructive" }); return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/generate-project-report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: f }),
      });
      const data = await res.json();
      if (data.success && data.report) { setReport(data.report); setStatus("done"); }
      else throw new Error(data.error || "Generation failed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast({ title: "Report Generate Nahi Hua", description: msg, variant: "destructive" });
      setStatus("form");
    }
  };

  const handleNew = () => {
    localStorage.removeItem(AUTOSAVE_KEY);
    setStatus("form"); setStep(1); setReport(""); setHasDraft(false); setLastSaved(null);
    setF({ ...EMPTY, applicantName: user?.name || "", phone: "", email: user?.email || "" });
  };

  if (status === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <style>{`@media print { body * { visibility: hidden; } #project-report-print, #project-report-print * { visibility: visible; } #project-report-print { position: fixed; left: 0; top: 0; width: 100%; background: white; } }`}</style>
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => setLocation("/home")} aria-label="Go back" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
            <FileText className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <span className="text-slate-800 font-semibold text-sm">Project Report Generator</span>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <ReportView report={report} onNew={handleNew} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-blue-300/10 blur-3xl" />
      </div>

      <header className="relative border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setLocation("/home")} aria-label="Go back" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h1 className="text-slate-800 font-semibold text-sm">AI Project Report Generator</h1>
            <p className="text-slate-400 text-xs">PMEGP / MSME / Bank Loan · Roll Forming Machine</p>
          </div>
          {/* Autosave indicator */}
          {lastSaved && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1" aria-live="polite">
              <Save className="w-3 h-3" aria-hidden="true" />
              Saved {lastSaved}
            </div>
          )}
          {hasDraft && (
            <button onClick={clearDraft} title="Clear draft and start fresh" aria-label="Clear draft" className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1 transition-colors">
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-4 py-8 space-y-6">
        {status === "loading" ? (
          <div className="flex flex-col items-center justify-center py-28 gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/40">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-slate-800 text-xl font-bold">AI Project Report Bana Raha Hai...</h3>
              <p className="text-slate-500 mt-1">Bank-ready professional report taiyar ho rahi hai</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-400 text-center">
              {["Applicant aur business details process ho rahi hain...", "Financial projections calculate ho rahi hain...", "Market analysis likhaa ja raha hai...", "Bank-ready format mein taiyar ho raha hai..."].map((msg, i) => (
                <motion.p key={msg} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.7 }}>{msg}</motion.p>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                <span className="text-emerald-700 text-sm font-medium">PMEGP / MSME Loan Project Report</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Bank Loan Project Report Banayein</h2>
              <p className="text-slate-500 text-sm mt-1">4 steps mein details bharen — AI poori professional report banayega</p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Form steps">
              {STEPS.map((s) => {
                const Icon = s.icon;
                const done = step > s.id;
                const active = step === s.id;
                return (
                  <button key={s.id} onClick={() => step > s.id && setStep(s.id)}
                    role="tab" aria-selected={active} aria-label={`Step ${s.id}: ${s.sublabel}`}
                    className={`flex-1 min-w-[80px] flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${active ? "border-blue-400 bg-blue-50 shadow-sm" : done ? "border-emerald-400 bg-emerald-50 cursor-pointer" : "border-slate-200 bg-slate-50 opacity-50"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? `bg-gradient-to-br ${s.color}` : done ? "bg-emerald-100" : "bg-slate-200"}`}>
                      {done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-500"}`} />}
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-semibold ${active ? "text-blue-600" : done ? "text-emerald-600" : "text-slate-400"}`}>{s.label}</p>
                      <p className="text-slate-400 text-xs hidden sm:block">{s.sublabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-slate-800 font-semibold flex items-center gap-2"><User className="w-4 h-4 text-blue-600" /> Aavedan Karta Ki Jankari</h3>
                  <Section title="Personal Details" />
                  <Row>
                    <div><Lbl req>Poora Naam</Lbl><input value={f.applicantName} onChange={upd("applicantName")} placeholder="Ramesh Kumar Sharma" className={inp()} /></div>
                    <div><Lbl>Pita / Pati Ka Naam</Lbl><input value={f.fatherName} onChange={upd("fatherName")} placeholder="Suresh Kumar Sharma" className={inp()} /></div>
                  </Row>
                  <Row>
                    <div><Lbl>Janm Tithi</Lbl><input type="date" value={f.dob} onChange={upd("dob")} className={inp()} /></div>
                    <div><Lbl>Ling (Gender)</Lbl>
                      <select value={f.gender} onChange={upd("gender")} className={sel()}>
                        <option value="">Select</option>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                  </Row>
                  <Row>
                    <div><Lbl>Shiksha (Qualification)</Lbl>
                      <select value={f.qualification} onChange={upd("qualification")} className={sel()}>
                        <option value="">Select</option>
                        <option>10th Pass</option><option>12th Pass</option><option>ITI</option>
                        <option>Diploma</option><option>Graduate</option><option>Post Graduate</option>
                      </select>
                    </div>
                    <div><Lbl>Anubhav (Experience)</Lbl><input value={f.experience} onChange={upd("experience")} placeholder="3 saal roll forming industry mein" className={inp()} /></div>
                  </Row>
                  <Row>
                    <div><Lbl>Varg (Category)</Lbl>
                      <select value={f.category} onChange={upd("category")} className={sel()}>
                        <option>General</option><option>OBC</option><option>SC</option><option>ST</option>
                        <option>Minority</option><option>Ex-Serviceman</option><option>Physically Handicapped</option>
                      </select>
                    </div>
                    <div><Lbl req>Mobile Number</Lbl><input value={f.phone} onChange={upd("phone")} placeholder="+91 98765 43210" type="tel" className={inp()} /></div>
                  </Row>
                  <Row>
                    <div><Lbl>Email</Lbl><input value={f.email} onChange={upd("email")} placeholder="aapka@email.com" type="email" className={inp()} /></div>
                    <div><Lbl>Aadhaar Number</Lbl><input value={f.aadhaar} onChange={upd("aadhaar")} placeholder="XXXX XXXX XXXX" className={inp()} /></div>
                  </Row>
                  <div><Lbl>PAN Number</Lbl><input value={f.pan} onChange={upd("pan")} placeholder="ABCDE1234F" className={inp("max-w-xs")} /></div>
                  <Section title="Pata (Address)" />
                  <div><Lbl req>Ghar Ka Pata</Lbl><textarea value={f.address} onChange={upd("address")} placeholder="Makaan no., Gali, Mohalla..." rows={2} className={inp("resize-none")} /></div>
                  <Row3>
                    <div><Lbl req>Shahar / Tehsil</Lbl><input value={f.city} onChange={upd("city")} placeholder="Pune" className={inp()} /></div>
                    <div><Lbl>Rajya</Lbl><input value={f.state} onChange={upd("state")} placeholder="Maharashtra" className={inp()} /></div>
                    <div><Lbl>PIN Code</Lbl><input value={f.pincode} onChange={upd("pincode")} placeholder="411001" className={inp()} /></div>
                  </Row3>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-slate-800 font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /> Business / Project Jankari</h3>
                  <Section title="Yojana (Scheme)" />
                  <Row>
                    <div><Lbl>Loan Yojana</Lbl>
                      <select value={f.loanScheme} onChange={upd("loanScheme")} className={sel()}>
                        <option value="PMEGP">PMEGP (PM Employment Generation Programme)</option>
                        <option value="MUDRA">MUDRA Yojana (Shishu / Kishore / Tarun)</option>
                        <option value="MSME">MSME Term Loan</option>
                        <option value="CGTMSE">CGTMSE (Collateral Free)</option>
                        <option value="Stand-Up India">Stand-Up India</option>
                        <option value="Startup India">Startup India</option>
                        <option value="State Scheme">State Government Scheme</option>
                        <option value="Bank Term Loan">Direct Bank Term Loan</option>
                      </select>
                    </div>
                    <div><Lbl>Business Structure</Lbl>
                      <select value={f.businessType} onChange={upd("businessType")} className={sel()}>
                        <option>Proprietorship</option><option>Partnership Firm</option>
                        <option>LLP</option><option>Private Limited Company</option><option>OPC</option>
                      </select>
                    </div>
                  </Row>
                  <Section title="Business Details" />
                  <Row>
                    <div><Lbl req>Pratishthan Ka Naam (Business Name)</Lbl><input value={f.businessName} onChange={upd("businessName")} placeholder="Sharma Roll Forming Industries" className={inp()} /></div>
                    <div><Lbl>Udyog Prakar (Industry Type)</Lbl>
                      <select value={f.industryType} onChange={upd("industryType")} className={sel()}>
                        <option>Manufacturing</option><option>Service</option><option>Trading</option>
                      </select>
                    </div>
                  </Row>
                  <div><Lbl>Prastaavit Sthan (Proposed Location)</Lbl><input value={f.proposedLocation} onChange={upd("proposedLocation")} placeholder="MIDC, Pune / Village Xyz, Tehsil..." className={inp()} /></div>
                  <div><Lbl req>Utpaadon Ka Vivaran (Products & Description)</Lbl>
                    <textarea value={f.productDescription} onChange={upd("productDescription")}
                      placeholder="Jaise: Roofing sheets (colour coated), C-Purlin, Z-Purlin, Cable tray, Floor deck profiles, Door frame profiles etc. Roll forming machine se taye material ko specific shape mein dhaal kar banaya jayega..."
                      rows={3} className={inp("resize-none")} />
                  </div>
                  <div><Lbl>Lakshya Bazaar (Target Market)</Lbl>
                    <textarea value={f.targetMarket} onChange={upd("targetMarket")}
                      placeholder="Jaise: Construction companies, Builders, Contractors in Pune & Maharashtra region. Govt infrastructure projects..."
                      rows={2} className={inp("resize-none")} />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-slate-800 font-semibold flex items-center gap-2"><Factory className="w-4 h-4 text-emerald-600" /> Takniki Vivaran (Technical Details)</h3>
                  <Section title="Machine Details" />
                  <Row>
                    <div><Lbl>Machine Ka Naam</Lbl><input value={f.machineName} onChange={upd("machineName")} placeholder="Roll Forming Machine" className={inp()} /></div>
                    <div><Lbl>Machine Aapoortikarta (Supplier)</Lbl><input value={f.machineSupplier} onChange={upd("machineSupplier")} placeholder="SAI RoloTech, Pune" className={inp()} /></div>
                  </Row>
                  <Row>
                    <div><Lbl req>Machine Keemat (₹)</Lbl><input value={f.machinePrice} onChange={upd("machinePrice")} placeholder="25,00,000" className={inp()} /></div>
                    <div><Lbl>Kshamata (Capacity)</Lbl><input value={f.machineCapacity} onChange={upd("machineCapacity")} placeholder="20 meter/minute, 500 kg/hour" className={inp()} /></div>
                  </Row>
                  <Section title="Infrastructure" />
                  <Row>
                    <div><Lbl>Bhumi Kshetrafal (Land Area sqft)</Lbl><input value={f.landArea} onChange={upd("landArea")} placeholder="2000 sqft" className={inp()} /></div>
                    <div><Lbl>Building / Shed Cost (₹)</Lbl><input value={f.buildingCost} onChange={upd("buildingCost")} placeholder="3,00,000" className={inp()} /></div>
                  </Row>
                  <div><Lbl>Anya Upkaran (Other Equipment)</Lbl><input value={f.otherEquipment} onChange={upd("otherEquipment")} placeholder="EOT Crane, Coil Car, Hydraulic Decoiler, Packing machine etc." className={inp()} /></div>
                  <Section title="Operations" />
                  <Row>
                    <div><Lbl req>Kachcha Maal (Raw Material)</Lbl><input value={f.rawMaterial} onChange={upd("rawMaterial")} placeholder="GI/PPGI/MS coils, thickness 0.3-2mm" className={inp()} /></div>
                    <div><Lbl>Bijli Aavashyakta (Power kW)</Lbl><input value={f.powerRequirement} onChange={upd("powerRequirement")} placeholder="30 kW" className={inp()} /></div>
                  </Row>
                  <Row>
                    <div><Lbl>Kul Karmchari (Total Manpower)</Lbl><input value={f.manpowerTotal} onChange={upd("manpowerTotal")} placeholder="8" type="number" className={inp()} /></div>
                    <div><Lbl>Prashikshit Karmchari (Skilled)</Lbl><input value={f.manpowerSkilled} onChange={upd("manpowerSkilled")} placeholder="3" type="number" className={inp()} /></div>
                  </Row>
                  <div><Lbl>Karya Divas Prativarsh (Working Days/Year)</Lbl><input value={f.workingDaysPerYear} onChange={upd("workingDaysPerYear")} placeholder="300" type="number" className={inp("max-w-xs")} /></div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-slate-800 font-semibold flex items-center gap-2"><IndianRupee className="w-4 h-4 text-amber-500" /> Vittiya Vivaran (Financial Details)</h3>
                  <Section title="Project Cost & Funding" />
                  <Row>
                    <div><Lbl req>Kul Pariyojana Lagat (Total Project Cost ₹)</Lbl><input value={f.totalProjectCost} onChange={upd("totalProjectCost")} placeholder="30,00,000" className={inp()} /></div>
                    <div><Lbl req>Swayam Yadaan (Own Contribution ₹)</Lbl><input value={f.ownContribution} onChange={upd("ownContribution")} placeholder="9,00,000" className={inp()} /></div>
                  </Row>
                  <Row>
                    <div><Lbl req>Rinashaayata (Loan Amount ₹)</Lbl><input value={f.loanAmount} onChange={upd("loanAmount")} placeholder="21,00,000" className={inp()} /></div>
                    <div><Lbl>Bank Ka Naam</Lbl><input value={f.bankName} onChange={upd("bankName")} placeholder="SBI / Canara Bank / Bank of Maharashtra..." className={inp()} /></div>
                  </Row>
                  <Row>
                    <div><Lbl>Rinashaayata Avadhi (Loan Tenure Years)</Lbl><input value={f.loanTenure} onChange={upd("loanTenure")} placeholder="7" type="number" className={inp()} /></div>
                    <div><Lbl>Byaj Dar (Interest Rate %)</Lbl><input value={f.interestRate} onChange={upd("interestRate")} placeholder="11.5" type="number" step="0.5" className={inp()} /></div>
                  </Row>
                  <Section title="Monthly Financial Projections" />
                  <Row>
                    <div><Lbl req>Expected Monthly Revenue (₹)</Lbl><input value={f.expectedRevenueMontly} onChange={upd("expectedRevenueMontly")} placeholder="5,00,000" className={inp()} /></div>
                    <div><Lbl req>Raw Material Cost Monthly (₹)</Lbl><input value={f.rawMaterialCostMonthly} onChange={upd("rawMaterialCostMonthly")} placeholder="2,50,000" className={inp()} /></div>
                  </Row>
                  <Row>
                    <div><Lbl>Labour Cost Monthly (₹)</Lbl><input value={f.labourCostMonthly} onChange={upd("labourCostMonthly")} placeholder="60,000" className={inp()} /></div>
                    <div><Lbl>Overhead / Other Expenses Monthly (₹)</Lbl><input value={f.overheadMonthly} onChange={upd("overheadMonthly")} placeholder="40,000" className={inp()} /></div>
                  </Row>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <p className="text-blue-300 text-xs">💡 <strong>PMEGP Subsidy:</strong> General category mein 15-25% margin money subsidy milti hai. Urban area mein 15%, Rural mein 25%. SC/ST/OBC/Women/Ex-serviceman mein 25-35%. Yeh AI calculate karke report mein include karega.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <button
                onClick={() => step > 1 ? setStep(s => s - 1) : setLocation("/home")}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label={step === 1 ? "Go home" : "Go back"}
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                {step === 1 ? "Home" : "Wapas"}
              </button>
              <div className="flex items-center gap-1" aria-label="Progress indicator" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4}>
                {STEPS.map(s => (
                  <div key={s.id} className={`h-2 rounded-full transition-all ${step === s.id ? "w-6 bg-blue-500" : step > s.id ? "w-2 bg-emerald-500" : "w-2 bg-slate-300"}`} />
                ))}
              </div>
              {step < 4 ? (
                <button onClick={nextStep} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-blue-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                  Aage <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : (
                <button onClick={generate} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-200 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
                  <FileText className="w-4 h-4" aria-hidden="true" /> Report Generate Karein
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
