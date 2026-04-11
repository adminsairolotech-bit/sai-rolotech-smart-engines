import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Upload, FileText, CheckCircle2, Factory,
  Layers, Settings2, Zap, User, Phone, Mail, Building2,
  ChevronRight, RefreshCw, Loader2, Download, Package,
  Ruler, Weight, Gauge, Scissors, Cpu, AlertCircle, Bot, Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ProfileForm {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientCompany: string;
  clientCity: string;
  materialType: string;
  minThickness: string;
  maxThickness: string;
  minStripWidth: string;
  maxStripWidth: string;
  profileHeight: string;
  machineType: "fully_automatic" | "semi_automatic" | "manual" | "";
  punchingOption: "with_punching" | "without_punching" | "optional_punching" | "";
  punchingDetails: string;
  outputSpeed: string;
  coilWeight: string;
  cutType: "run_length" | "rotary" | "both" | "";
  controlSystem: "plc" | "manual" | "hmi_plc" | "";
  quantity: string;
  specialRequirements: string;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

const MATERIALS = [
  { value: "MS", label: "MS (Mild Steel)" },
  { value: "SS", label: "SS (Stainless Steel)" },
  { value: "GI", label: "GI (Galvanized Iron)" },
  { value: "PPGI", label: "PPGI (Pre-painted GI)" },
  { value: "Aluminum", label: "Aluminum" },
  { value: "Copper", label: "Copper" },
  { value: "HR", label: "HR (Hot Rolled)" },
  { value: "CR", label: "CR (Cold Rolled)" },
];

const MACHINE_TYPES = [
  { value: "fully_automatic", label: "Fully Automatic", desc: "PLC controlled, no manual intervention", icon: "🤖" },
  { value: "semi_automatic", label: "Semi Automatic", desc: "PLC + manual steps combined", icon: "⚙️" },
  { value: "manual", label: "Manual", desc: "Operator controlled machine", icon: "👷" },
];

const PUNCHING_OPTIONS = [
  { value: "with_punching", label: "With Punching", desc: "In-line punching unit included", icon: "🔩" },
  { value: "without_punching", label: "Without Punching", desc: "No punching, plain profile", icon: "📏" },
  { value: "optional_punching", label: "Optional (Punching Ready)", desc: "Provision for punching, can add later", icon: "🔄" },
];

const CUT_TYPES = [
  { value: "run_length", label: "Run Length Cut", desc: "Cuts while machine runs (flying cut)" },
  { value: "rotary", label: "Rotary Cut", desc: "Rotary die cutting system" },
  { value: "both", label: "Both Options", desc: "Flexible cutting system" },
];

const CONTROL_SYSTEMS = [
  { value: "plc", label: "PLC Only", desc: "Siemens / Delta / Allen Bradley" },
  { value: "hmi_plc", label: "PLC + HMI", desc: "Full touchscreen with PLC" },
  { value: "manual", label: "Manual Controls", desc: "Push button panel" },
];

function FormSection({ title, icon: Icon, color, children }: { title: string; icon: React.ElementType; color: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
      <h3 className="text-slate-800 font-semibold flex items-center gap-2 pb-3 border-b border-slate-100">
        <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

function InputField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label} {required && <span className="text-red-500" aria-label="required">*</span>}
      </label>
      {children}
    </div>
  );
}

function inputClass(extra = "") {
  return `w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all ${extra}`;
}

function SelectCard({ options, value, onChange }: {
  options: { value: string; label: string; desc?: string; icon?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${value === opt.value
            ? "bg-blue-50 border-blue-400 text-slate-800 shadow-sm"
            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm"
          }`}
        >
          {opt.icon && <span className="text-xl" aria-hidden="true">{opt.icon}</span>}
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-800">{opt.label}</div>
            {opt.desc && <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>}
          </div>
          {value === opt.value && <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}

function SuccessScreen({ form, files, aiSpec, onNew }: {
  form: ProfileForm; files: UploadedFile[]; aiSpec: string; onNew: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const handlePrint = () => window.print();
  const refNo = `SAI-CP-${Date.now().toString().slice(-6)}`;

  return (
    <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-500" aria-hidden="true" />
        <div>
          <h3 className="text-emerald-600 font-bold text-lg">Inquiry Submitted!</h3>
          <p className="text-slate-500 text-sm">Ref: {refNo} · Hamari team 24 ghante mein contact karegi</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={handlePrint} aria-label="Print inquiry" className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> Print
          </button>
          <button onClick={onNew} aria-label="New inquiry" className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm transition-colors shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Naya
          </button>
        </div>
      </div>

      <div id="profile-print" className="space-y-4">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">SAI RoloTech</h2>
              <p className="text-blue-200 text-sm">Custom Roll Forming Machine Inquiry</p>
              <p className="text-blue-200 text-xs mt-1">+91 98765 43210 · inquirysairolotech@gmail.com · Pune</p>
            </div>
            <div className="text-right bg-white/15 rounded-xl px-4 py-2">
              <p className="text-xs text-blue-200">Ref No.</p>
              <p className="font-bold text-lg">{refNo}</p>
              <p className="text-xs text-blue-200">{new Date().toLocaleDateString("en-IN")}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h4 className="text-blue-700 font-semibold text-sm mb-3 flex items-center gap-2"><User className="w-4 h-4" aria-hidden="true" /> Client Details</h4>
            <dl className="space-y-1.5 text-sm">
              {[
                ["Naam", form.clientName], ["Phone", form.clientPhone],
                ["Email", form.clientEmail || "N/A"], ["Company", form.clientCompany || "Individual"],
                ["City", form.clientCity || "N/A"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="text-slate-400 w-20 flex-shrink-0">{k}:</dt>
                  <dd className="text-slate-800 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h4 className="text-indigo-700 font-semibold text-sm mb-3 flex items-center gap-2"><Layers className="w-4 h-4" aria-hidden="true" /> Material Specs</h4>
            <dl className="space-y-1.5 text-sm">
              {[
                ["Material", form.materialType], ["Min Thickness", `${form.minThickness} mm`],
                ["Max Thickness", `${form.maxThickness} mm`], ["Min Strip Width", `${form.minStripWidth} mm`],
                ["Max Strip Width", `${form.maxStripWidth} mm`], ["Profile Height", form.profileHeight ? `${form.profileHeight} mm` : "N/A"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="text-slate-400 w-28 flex-shrink-0">{k}:</dt>
                  <dd className="text-slate-800 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Machine Type", value: MACHINE_TYPES.find(m => m.value === form.machineType)?.label || "N/A", color: "text-emerald-700" },
            { label: "Punching", value: PUNCHING_OPTIONS.find(p => p.value === form.punchingOption)?.label || "N/A", color: "text-orange-700" },
            { label: "Control System", value: CONTROL_SYSTEMS.find(c => c.value === form.controlSystem)?.label || "N/A", color: "text-sky-700" },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center shadow-sm">
              <p className="text-slate-400 text-xs mb-1">{item.label}</p>
              <p className={`font-bold text-base ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h4 className="text-amber-700 font-semibold text-sm mb-3 flex items-center gap-2"><Settings2 className="w-4 h-4" aria-hidden="true" /> Production Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              ["Output Speed", form.outputSpeed ? `${form.outputSpeed} m/min` : "N/A"],
              ["Coil Weight", form.coilWeight ? `${form.coilWeight} kg` : "N/A"],
              ["Cut Type", CUT_TYPES.find(c => c.value === form.cutType)?.label || "N/A"],
              ["Quantity", form.quantity ? `${form.quantity} Machine(s)` : "1 Machine"],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                <p className="text-slate-400 text-xs">{k}</p>
                <p className="text-slate-800 font-semibold mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {files.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h4 className="text-emerald-700 font-semibold text-sm mb-3 flex items-center gap-2"><FileText className="w-4 h-4" aria-hidden="true" /> Uploaded Files</h4>
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-blue-500" aria-hidden="true" />
                  <div>
                    <p className="text-slate-800 text-sm font-medium">{f.name}</p>
                    <p className="text-slate-400 text-xs">{(f.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {form.specialRequirements && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
            <h4 className="text-purple-700 font-semibold text-sm mb-2">Special Requirements</h4>
            <p className="text-slate-700 text-sm">{form.specialRequirements}</p>
          </div>
        )}

        {aiSpec && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
            <h4 className="text-blue-800 font-semibold text-sm mb-3 flex items-center gap-2">
              <Bot className="w-4 h-4" aria-hidden="true" /> AI Machine Specification Estimate
            </h4>
            <div className="text-slate-700 text-sm whitespace-pre-line leading-relaxed">{aiSpec}</div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-amber-800 font-semibold">📞 Hamari Technical Team Jald Contact Karegi</p>
          <p className="text-slate-500 text-sm mt-1">+91 98765 43210 · inquirysairolotech@gmail.com · Pune, Maharashtra</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function CustomProfilePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [step, setStep] = useState<"form" | "loading" | "success">("form");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [aiSpec, setAiSpec] = useState("");

  const [form, setForm] = useState<ProfileForm>({
    clientName: user?.name || "",
    clientPhone: "",
    clientEmail: user?.email || "",
    clientCompany: "",
    clientCity: "",
    materialType: "MS",
    minThickness: "",
    maxThickness: "",
    minStripWidth: "",
    maxStripWidth: "",
    profileHeight: "",
    machineType: "",
    punchingOption: "",
    punchingDetails: "",
    outputSpeed: "",
    coilWeight: "",
    cutType: "",
    controlSystem: "",
    quantity: "1",
    specialRequirements: "",
  });

  const upd = (k: keyof ProfileForm, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    picked.forEach(file => {
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} 20MB se badi hai.`, variant: "destructive" }); return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        setFiles(prev => [...prev, { name: file.name, size: file.size, type: file.type, dataUrl: ev.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!form.clientName || !form.clientPhone || !form.minThickness || !form.maxThickness || !form.minStripWidth || !form.maxStripWidth) {
      toast({ title: "Required fields bharen", description: "Naam, Phone, Thickness aur Strip Width zaroori hai.", variant: "destructive" });
      return;
    }
    if (!form.machineType) { toast({ title: "Machine type select karein", variant: "destructive" }); return; }
    if (!form.punchingOption) { toast({ title: "Punching option select karein", variant: "destructive" }); return; }

    setStep("loading");

    const inquiry = { ...form, files: files.map(f => ({ name: f.name, size: f.size })), submittedAt: new Date().toISOString() };
    const saved = JSON.parse(localStorage.getItem("sai_profile_inquiries") || "[]");
    saved.push(inquiry);
    localStorage.setItem("sai_profile_inquiries", JSON.stringify(saved));

    try {
      const res = await fetch("/api/ai-machine-spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form }),
      });
      const data = await res.json();
      if (data.success) setAiSpec(data.spec);
    } catch { /* spec not critical */ }

    setStep("success");
    toast({ title: "Inquiry Submit Ho Gayi! ✅", description: "Hamari team jald aapse contact karegi." });
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <style>{`@media print { body * { visibility: hidden; } #profile-print, #profile-print * { visibility: visible; } #profile-print { position: absolute; left: 0; top: 0; width: 100%; background: white; color: black; } }`}</style>
        <header className="border-b border-emerald-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => setLocation("/home")} aria-label="Go back" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"><ArrowLeft className="w-4 h-4" aria-hidden="true" /></button>
            <Factory className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            <span className="text-slate-800 font-semibold text-sm">Custom Profile Inquiry</span>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <SuccessScreen form={form} files={files} aiSpec={aiSpec} onNew={() => { setStep("form"); setFiles([]); setAiSpec(""); }} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-blue-200/15 blur-3xl" />
      </div>

      <header className="relative border-b border-emerald-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setLocation("/home")} aria-label="Go back" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center shadow-sm">
            <Factory className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-slate-800 font-semibold text-sm">Custom Profile Inquiry</h1>
            <p className="text-slate-400 text-xs">Roll Forming Machine · Profile Drawing Upload · SAI RoloTech</p>
          </div>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-4 py-8">
        {step === "loading" ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-200">
                <Factory className="w-10 h-10 text-white" aria-hidden="true" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" aria-hidden="true" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-slate-800 text-xl font-bold">Inquiry Process Ho Rahi Hai...</h3>
              <p className="text-slate-500 mt-1">AI machine specifications generate kar raha hai</p>
            </div>
            {["Form data save kar raha hai...", "Machine specifications calculate kar raha hai...", "Technical estimate ready ho rahi hai..."].map((msg, i) => (
              <motion.p key={msg} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.6 }} className="text-sm text-slate-400">{msg}</motion.p>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 rounded-full px-4 py-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span className="text-emerald-700 text-sm font-medium">Custom Roll Forming Profile</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Apna Profile Batayein</h2>
              <p className="text-slate-500 text-sm mt-1">Drawing upload karein aur specifications fill karein — SAI RoloTech aapke liye perfect machine banayega</p>
            </div>

            <FormSection title="Profile / Drawing Upload" icon={Upload} color="bg-blue-600">
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 text-center transition-colors cursor-pointer relative bg-slate-50 hover:bg-blue-50">
                <input type="file" accept=".pdf,.dxf,.dwg,.png,.jpg,.jpeg,.step,.igs" multiple onChange={handleFiles} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" aria-label="Upload profile drawing files" />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" aria-hidden="true" />
                <p className="text-slate-700 font-medium text-sm">PDF, DXF, DWG, STEP, IGS upload karein</p>
                <p className="text-slate-400 text-xs mt-1">Ya image (PNG/JPG) drag &amp; drop · Max 20MB per file</p>
              </div>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {files.map((f, i) => {
                    const ext = f.name.split(".").pop()?.toUpperCase() || "FILE";
                    const extColor = { PDF: "bg-red-100 text-red-700", DXF: "bg-blue-100 text-blue-700", DWG: "bg-sky-100 text-sky-700" }[ext] || "bg-slate-100 text-slate-600";
                    return (
                      <div key={i} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${extColor}`}>{ext}</span>
                        <span className="text-slate-800 text-sm">{f.name}</span>
                        <span className="text-slate-400 text-xs">{(f.size / 1024).toFixed(0)}KB</span>
                        <button onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`} className="text-slate-400 hover:text-red-500 transition-colors text-lg leading-none ml-1">×</button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-slate-400 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" aria-hidden="true" /> Drawing nahi hai toh skip karein — description se bhi kaam chalega
              </p>
            </FormSection>

            <FormSection title="Client / Company Details" icon={User} color="bg-violet-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Aapka Naam" required>
                  <input value={form.clientName} onChange={e => upd("clientName", e.target.value)} placeholder="Rahul Kumar" className={inputClass()} />
                </InputField>
                <InputField label="Phone Number" required>
                  <input value={form.clientPhone} onChange={e => upd("clientPhone", e.target.value)} placeholder="+91 98765 43210" type="tel" className={inputClass()} />
                </InputField>
                <InputField label="Email">
                  <input value={form.clientEmail} onChange={e => upd("clientEmail", e.target.value)} placeholder="aapka@email.com" type="email" className={inputClass()} />
                </InputField>
                <InputField label="Company / Firm">
                  <input value={form.clientCompany} onChange={e => upd("clientCompany", e.target.value)} placeholder="ABC Industries Pvt Ltd" className={inputClass()} />
                </InputField>
                <InputField label="City / Location">
                  <input value={form.clientCity} onChange={e => upd("clientCity", e.target.value)} placeholder="Pune, Maharashtra" className={inputClass()} />
                </InputField>
                <InputField label="Quantity Required">
                  <input value={form.quantity} onChange={e => upd("quantity", e.target.value)} placeholder="1" type="number" min="1" className={inputClass()} />
                </InputField>
              </div>
            </FormSection>

            <FormSection title="Material & Profile Specifications" icon={Layers} color="bg-blue-600">
              <InputField label="Material Type" required>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MATERIALS.map(m => (
                    <button key={m.value} type="button" onClick={() => upd("materialType", m.value)}
                      aria-pressed={form.materialType === m.value}
                      className={`p-2.5 rounded-xl border text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${form.materialType === m.value
                        ? "bg-blue-50 border-blue-400 text-blue-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      {m.value}
                      <div className="text-xs font-normal mt-0.5 opacity-70">{m.label.replace(`${m.value} `, "")}</div>
                    </button>
                  ))}
                </div>
              </InputField>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <InputField label="Min Thickness (mm)" required>
                  <input value={form.minThickness} onChange={e => upd("minThickness", e.target.value)} placeholder="0.3" type="number" step="0.1" className={inputClass()} />
                </InputField>
                <InputField label="Max Thickness (mm)" required>
                  <input value={form.maxThickness} onChange={e => upd("maxThickness", e.target.value)} placeholder="3.0" type="number" step="0.1" className={inputClass()} />
                </InputField>
                <InputField label="Min Strip Width (mm)" required>
                  <input value={form.minStripWidth} onChange={e => upd("minStripWidth", e.target.value)} placeholder="50" type="number" className={inputClass()} />
                </InputField>
                <InputField label="Max Strip Width (mm)" required>
                  <input value={form.maxStripWidth} onChange={e => upd("maxStripWidth", e.target.value)} placeholder="500" type="number" className={inputClass()} />
                </InputField>
              </div>

              <InputField label="Profile Height / Depth (mm)">
                <input value={form.profileHeight} onChange={e => upd("profileHeight", e.target.value)} placeholder="Jaise: 50 mm (optional)" type="number" className={inputClass("max-w-xs")} />
              </InputField>
            </FormSection>

            <FormSection title="Machine Type" icon={Factory} color="bg-green-600">
              <SelectCard options={MACHINE_TYPES} value={form.machineType} onChange={v => upd("machineType", v)} />
            </FormSection>

            <FormSection title="Punching Options" icon={Scissors} color="bg-orange-600">
              <SelectCard options={PUNCHING_OPTIONS} value={form.punchingOption} onChange={v => upd("punchingOption", v)} />
              {(form.punchingOption === "with_punching" || form.punchingOption === "optional_punching") && (
                <InputField label="Punching Details (hole size, shape, pattern)">
                  <textarea value={form.punchingDetails} onChange={e => upd("punchingDetails", e.target.value)}
                    placeholder="Jaise: Round hole 10mm dia, spacing 50mm center to center, 2 holes per pitch"
                    rows={2} className={inputClass("resize-none")} />
                </InputField>
              )}
            </FormSection>

            <FormSection title="Production & Control Details" icon={Settings2} color="bg-cyan-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Output Speed (m/min)">
                  <input value={form.outputSpeed} onChange={e => upd("outputSpeed", e.target.value)} placeholder="Jaise: 20-30 m/min" className={inputClass()} />
                </InputField>
                <InputField label="Coil Weight Capacity (kg)">
                  <input value={form.coilWeight} onChange={e => upd("coilWeight", e.target.value)} placeholder="Jaise: 5000 kg" type="number" className={inputClass()} />
                </InputField>
              </div>

              <InputField label="Cut Type">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CUT_TYPES.map(c => (
                    <button key={c.value} type="button" onClick={() => upd("cutType", c.value)}
                      aria-pressed={form.cutType === c.value}
                      className={`p-3 rounded-xl border text-left text-sm transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${form.cutType === c.value
                        ? "bg-blue-50 border-blue-400 text-slate-800 shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-medium">{c.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </InputField>

              <InputField label="Control System">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CONTROL_SYSTEMS.map(c => (
                    <button key={c.value} type="button" onClick={() => upd("controlSystem", c.value)}
                      aria-pressed={form.controlSystem === c.value}
                      className={`p-3 rounded-xl border text-left text-sm transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${form.controlSystem === c.value
                        ? "bg-blue-50 border-blue-400 text-slate-800 shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-medium">{c.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </InputField>
            </FormSection>

            <FormSection title="Special Requirements" icon={Package} color="bg-purple-600">
              <InputField label="Koi bhi special ya additional requirements">
                <textarea value={form.specialRequirements} onChange={e => upd("specialRequirements", e.target.value)}
                  placeholder="Jaise: Machine ko outdoor lagana hai IP65 chahiye, 3-phase 440V power, CE certification chahiye, installation bhi chahiye, operator training chahiye..."
                  rows={4} className={inputClass("resize-none")} />
              </InputField>
            </FormSection>

            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-2xl py-4 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 text-lg"
            >
              <Factory className="w-5 h-5" />
              Custom Profile Inquiry Submit Karein
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
