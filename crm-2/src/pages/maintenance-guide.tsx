import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckSquare, Square, Printer, RefreshCw,
  Clock, Calendar, CalendarDays, CalendarRange, Star,
  AlertTriangle, Info, ChevronDown, ChevronUp, Wrench,
  Droplets, Zap, Settings, Shield, Eye, Thermometer, Activity
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CheckItem {
  id: string;
  task: string;
  detail: string;
  category: "lubrication" | "mechanical" | "electrical" | "safety" | "cleaning" | "inspection";
  priority: "critical" | "high" | "normal";
}

interface MaintenanceSchedule {
  id: string;
  period: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  items: CheckItem[];
  tip: string;
}

const CATEGORY_ICONS: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  lubrication: { icon: Droplets, color: "text-blue-400", label: "Lubrication" },
  mechanical: { icon: Settings, color: "text-yellow-400", label: "Mechanical" },
  electrical: { icon: Zap, color: "text-purple-400", label: "Electrical" },
  safety: { icon: Shield, color: "text-red-400", label: "Safety" },
  cleaning: { icon: Eye, color: "text-cyan-400", label: "Cleaning" },
  inspection: { icon: Activity, color: "text-green-400", label: "Inspection" },
};

const SCHEDULES: MaintenanceSchedule[] = [
  {
    id: "daily",
    period: "Roz",
    label: "Daily — Machine Start Se Pehle",
    color: "text-blue-300",
    bgColor: "bg-blue-600",
    borderColor: "border-blue-500/40",
    icon: Clock,
    tip: "⏰ Machine start karne se 10-15 minute pehle yeh checks zaroor karein. Isse machine life badti hai aur accidents se bachav hota hai.",
    items: [
      { id: "d1", task: "Sabhi Bearings ko Grease Karein", detail: "Grease nipples pe grease gun se 2-3 pumps dein. Sabhi forming stations, pinch rolls, straightener, aur decoiler shafts check karein.", category: "lubrication", priority: "critical" },
      { id: "d2", task: "Roll Surface Clean Karein", detail: "Saaf kapde se sabhi forming rolls aur pinch rolls saaf karein. Dhool, zeeng ya metal chips nahi honi chahiye surface pe.", category: "cleaning", priority: "critical" },
      { id: "d3", task: "Safety Guards Check Karein", detail: "Sabhi safety covers aur guards sahi jagah lage hain ya nahi. Koi bhi guard hataa nahi hona chahiye machine chalne ke waqt.", category: "safety", priority: "critical" },
      { id: "d4", task: "Pneumatic Pressure Check", detail: "Air pressure gauge 5-6 bar pe hona chahiye. FRL unit (Filter-Regulator-Lubricator) mein oil level check karein.", category: "mechanical", priority: "high" },
      { id: "d5", task: "Emergency Stop Test Karein", detail: "Machine start karne se pehle E-stop button press karke test karein. Indicator light check karein.", category: "safety", priority: "critical" },
      { id: "d6", task: "Material & Entry Guide Check", detail: "Entry guide ka position drawing ke anusar theek hai ya nahi. Side guides tight hain ya loose.", category: "inspection", priority: "high" },
      { id: "d7", task: "Electrical Panel Indicator Check", detail: "Sabhi indicator lights, HMI screen display theek kaam kar raha hai. Koi error ya alarm toh nahi.", category: "electrical", priority: "high" },
      { id: "d8", task: "Gearbox Oil Level Dekhein", detail: "Oil sight glass se oil level check karein — low hone par turant barhayein. Leakage ke signs check karein.", category: "lubrication", priority: "high" },
      { id: "d9", task: "Hydraulic / Pneumatic Lines Check", detail: "Koi bhi hose pipe mein leakage, cut ya wear nahi hona chahiye. Fitting tight hain ya nahi.", category: "mechanical", priority: "normal" },
      { id: "d10", task: "Encoder Coupling Check", detail: "Encoder coupling tight hai. Encoder wire properly connected hai — koi bhi looseness cut length error karti hai.", category: "electrical", priority: "high" },
    ],
  },
  {
    id: "weekly",
    period: "Hafta",
    label: "Weekly — Har Hafte (7 Din Mein)",
    color: "text-green-300",
    bgColor: "bg-green-600",
    borderColor: "border-green-500/40",
    icon: CalendarDays,
    tip: "📅 Har Somwar machine start karne se pehle weekly check karein. Log book mein entry karna na bhoolein.",
    items: [
      { id: "w1", task: "Chain / Belt Tension Check", detail: "Drive chain ya belt sahi tension mein honi chahiye — na zyada tight, na zyada loose. Sag 3-5mm se zyada nahi hona chahiye.", category: "mechanical", priority: "critical" },
      { id: "w2", task: "Gearbox Temperature Check", detail: "Haath se gearbox touch karein — zyada garm nahi hona chahiye (60°C se zyada nahi). Leakage ke signs dekhein.", category: "inspection", priority: "high" },
      { id: "w3", task: "Bearing Temperature & Sound Check", detail: "Ek ek bearing pe haath rakhein — vibration ya heat feel karein. Unusual sound (kharkharat) aaye toh turant replace karein.", category: "inspection", priority: "critical" },
      { id: "w4", task: "Roll Alignment Visual Check", detail: "Machine chalate waqt dekhe — sabhi rolls sahi line mein hain. Koi bhi shaft wobble nahi karna chahiye.", category: "mechanical", priority: "high" },
      { id: "w5", task: "Electrical Panel Dust Cleaning", detail: "Compressed air se electrical panel ke andar ki dhool saaf karein. Loose terminals check karein. Panel door gasket check karein.", category: "electrical", priority: "high" },
      { id: "w6", task: "Punch Die Inspection", detail: "Punch aur die ka gap check karein. Blunt punch — burr zyada aati hai. Die mein chips ya wear check karein.", category: "inspection", priority: "high" },
      { id: "w7", task: "Side Guide Wear Check", detail: "Entry aur exit side guides pe wear dekhein. Galat guide se strip left/right ja sakti hai.", category: "inspection", priority: "normal" },
      { id: "w8", task: "Lubrication System Check", detail: "Auto-lube system (agar hai) ka reservoir level check karein. Manual points pe grease dein jahan roz nahi dete.", category: "lubrication", priority: "high" },
      { id: "w9", task: "Motor Cooling Fan Clean", detail: "Motor ke cooling fan pe dhool nahi honi chahiye. Blocked fan se motor overheat hota hai.", category: "electrical", priority: "normal" },
      { id: "w10", task: "Cut-off Blade Condition", detail: "Cutting blade ka edge check karein — blunt blade se burr aati hai aur dimension galat hoti hai.", category: "inspection", priority: "high" },
    ],
  },
  {
    id: "monthly",
    period: "Mahina",
    label: "Monthly — Har Mahine (30 Din Mein)",
    color: "text-yellow-300",
    bgColor: "bg-yellow-600",
    borderColor: "border-yellow-500/40",
    icon: Calendar,
    tip: "🗓️ Mahine ki pehli tarikh ko machine 2-3 ghante band karke monthly maintenance karein. Puri team ko inform karein.",
    items: [
      { id: "m1", task: "Full Lubrication — Sabhi Points", detail: "Machine ka poora lubrication chart dekh ke ek ek grease point pe grease dein. Koi bhi point miss nahi hona chahiye.", category: "lubrication", priority: "critical" },
      { id: "m2", task: "Gearbox Oil Level + Quality Check", detail: "Oil level check karein. Oil dark / thick ho gayi hai toh change karne ka time aa gaya hai. Oil mein pani ya metal particles nahi hone chahiye.", category: "lubrication", priority: "critical" },
      { id: "m3", task: "Full Roll Alignment Check", detail: "Dial gauge se sabhi forming station shaft ka alignment check karein. Misalignment strip defects ki sabse badi wajah hai.", category: "mechanical", priority: "critical" },
      { id: "m4", task: "Motor Current Readings Record Karein", detail: "Clamp meter se har motor ka running current record karein. Normal se zyada current load ya mechanical problem indicate karta hai.", category: "electrical", priority: "high" },
      { id: "m5", task: "PLC Program Backup Lein", detail: "PLC se latest program backup USB ya laptop mein copy karein. Koi bhi software issue mein yeh kaam aayega.", category: "electrical", priority: "critical" },
      { id: "m6", task: "Tooling Wear Measurement", detail: "Vernier se roll diameter measure karein. Original drawing se compare karein — 0.5mm se zyada wear pe regrinding karwayein.", category: "inspection", priority: "high" },
      { id: "m7", task: "Chain / Belt Replace Check", detail: "Chain links check karein — worn ya stretched links puri chain ko replace karne ki zaroorat dikhate hain.", category: "mechanical", priority: "high" },
      { id: "m8", task: "Hydraulic Oil Level + Filter", detail: "Hydraulic tank oil level check karein. Filter element inspect karein — dirty filter se pressure drop hota hai.", category: "lubrication", priority: "high" },
      { id: "m9", task: "All Fasteners Tighten Karein", detail: "Machine ke sabhi bolts, nuts, set screws ko check karein — vibration se loose ho jaate hain.", category: "mechanical", priority: "high" },
      { id: "m10", task: "Encoder Calibration Verify", detail: "Ek fix length (jaise 1000mm) ka piece cut karein aur actual measure se compare karein. 1mm se zyada error ho toh calibrate karein.", category: "electrical", priority: "high" },
      { id: "m11", task: "Straightener Roll Setting Check", detail: "Straightener ke rolls ki setting log book mein note karein. Material type ke hisaab se setting correct hai ya nahi.", category: "mechanical", priority: "normal" },
      { id: "m12", task: "Safety System Full Test", detail: "Sabhi limit switches, proximity sensors, E-stop buttons aur light curtain (agar hai) ka test karein.", category: "safety", priority: "critical" },
    ],
  },
  {
    id: "quarterly",
    period: "Timaahi",
    label: "Quarterly — Har 3 Mahine (90 Din Mein)",
    color: "text-orange-300",
    bgColor: "bg-orange-600",
    borderColor: "border-orange-500/40",
    icon: CalendarRange,
    tip: "🔧 3-mahine ki maintenance ke liye machine 1 poora din band karein. Specialist technician bulaein agar zaroorat ho.",
    items: [
      { id: "q1", task: "Gearbox Oil Change", detail: "Poora gearbox oil drain karein, flush karein, aur nayi recommended grade oil bharein. Oil type: Machine manual ke hisaab se (usually ISO VG 220 gear oil).", category: "lubrication", priority: "critical" },
      { id: "q2", task: "Full Electrical Inspection", detail: "Electrician se sabhi wiring connections, insulation, contactor contacts, overload relay settings check karwayen.", category: "electrical", priority: "critical" },
      { id: "q3", task: "Roll Regrinding Assessment", detail: "Sabhi forming rolls ka wear measure karein. Zyada wear pe regrinding karwana padega — otherwise profile dimensions galat aayengi.", category: "inspection", priority: "high" },
      { id: "q4", task: "Bearing Replacement Check", detail: "Noisy ya high-temperature bearings turant replace karein. Bearings ki recommended life 6000-8000 ghante hoti hai.", category: "mechanical", priority: "critical" },
      { id: "q5", task: "Complete Machine Level Check", detail: "Spirit level se machine ka leveling check karein. Machine unlevel hone se strip defects aate hain.", category: "mechanical", priority: "high" },
      { id: "q6", task: "Hydraulic System Full Check", detail: "Hydraulic pump, valves, cylinders, hoses — sabhi check karein. Oil seals leak kar rahi hain toh replace karein.", category: "mechanical", priority: "high" },
      { id: "q7", task: "PLC I/O Test", detail: "Sabhi PLC inputs aur outputs ka test karein — sensors, solenoids, switches — properly kaam kar rahe hain ya nahi.", category: "electrical", priority: "high" },
      { id: "q8", task: "Roll Tooling Cleaning & Inspection", detail: "Sabhi rolls machine se nikaal ke saaf karein. Scratches, dents, wear visible hai toh regrinding zaroor karein.", category: "inspection", priority: "high" },
      { id: "q9", task: "Pneumatic Cylinder & Valve Service", detail: "Pneumatic cylinders ki seals check karein. Directional control valves saaf karein. FRL unit replace karein.", category: "mechanical", priority: "normal" },
      { id: "q10", task: "Full Safety Audit", detail: "Safety guards, warning signs, emergency procedures update karein. Operators ko refresher training dein.", category: "safety", priority: "critical" },
    ],
  },
  {
    id: "yearly",
    period: "Saal",
    label: "Yearly — Har Saal (Annual Overhaul)",
    color: "text-red-300",
    bgColor: "bg-red-600",
    borderColor: "border-red-500/40",
    icon: Star,
    tip: "🏭 Annual maintenance ke liye 3-5 din production band rakhein. SAI RoloTech ke service team se AMC (Annual Maintenance Contract) mein yeh karwa sakte hain.",
    items: [
      { id: "y1", task: "Complete Machine Overhaul", detail: "Sabhi rolling elements, bearings, seals, gaskets replace karein. Machine ko completely disassemble karke check karein.", category: "mechanical", priority: "critical" },
      { id: "y2", task: "Full Tooling Change / Regrind", detail: "Sabhi forming rolls, guide rolls, pinch rolls — worn hain toh replace ya regrind karein. New tooling se production quality improve hoti hai.", category: "inspection", priority: "critical" },
      { id: "y3", task: "Gearbox Overhaul", detail: "Gearbox khol ke gears, shafts, bearings inspect karein. Worn gears replace karein. Professional se karwayen.", category: "mechanical", priority: "critical" },
      { id: "y4", task: "Motor Servicing", detail: "Motor winding insulation test (megger test) karein. Bearings replace karein. Carbon brushes check karein (agar DC motor hai).", category: "electrical", priority: "critical" },
      { id: "y5", task: "Complete Electrical Rewiring Check", detail: "Poori machine ki wiring check karein — damaged insulation, loose terminals, corrosion. Earthing system test karein.", category: "electrical", priority: "critical" },
      { id: "y6", task: "Machine Repainting", detail: "Rusted parts sand karein aur repaint karein. This prevents corrosion aur machine ko good condition mein rakhta hai.", category: "cleaning", priority: "normal" },
      { id: "y7", task: "Full Alignment & Calibration", detail: "Machine ko reference se completely re-align karein. Sabhi instruments aur measuring tools calibrate karein.", category: "mechanical", priority: "critical" },
      { id: "y8", task: "PLC & HMI Update", detail: "PLC firmware update karein. HMI software update karein. Complete backup lein pehle.", category: "electrical", priority: "high" },
      { id: "y9", task: "Safety System Overhaul", detail: "Sabhi safety devices replace karein agar 5 saal se zyada purane hain. Safety standards se compare karein.", category: "safety", priority: "critical" },
      { id: "y10", task: "Service Contract Review", detail: "SAI RoloTech AMC contract renew karein. Next year ka maintenance schedule plan karein. Spare parts list update karein.", category: "inspection", priority: "high" },
    ],
  },
];

const SPARE_PARTS = [
  { item: "Grease (NLGI 2)", qty: "2 kg", frequency: "Monthly" },
  { item: "Gearbox Oil (ISO VG 220)", qty: "As per gearbox", frequency: "3 Monthly" },
  { item: "Drive Chain / Belt", qty: "1 set", frequency: "As needed" },
  { item: "Bearings (all types)", qty: "1 set spare", frequency: "6 Monthly" },
  { item: "Encoder", qty: "1 spare", frequency: "As needed" },
  { item: "Proximity Sensors", qty: "2-3 spare", frequency: "As needed" },
  { item: "Hydraulic Oil", qty: "As per tank", frequency: "6 Monthly" },
  { item: "Pneumatic Seals Kit", qty: "1 set", frequency: "Yearly" },
  { item: "Cut-off Blades", qty: "2-3 spare", frequency: "Monthly" },
  { item: "Fuses (all ratings)", qty: "5 each", frequency: "As needed" },
];

export default function MaintenanceGuidePage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("daily");
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("sai_maintenance_checks") || "{}"); } catch { return {}; }
  });
  const [expandedTip, setExpandedTip] = useState<string | null>("daily");

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("sai_maintenance_checks", JSON.stringify(next));
      return next;
    });
  };

  const getProgress = (schedule: MaintenanceSchedule) => {
    const total = schedule.items.length;
    const done = schedule.items.filter(i => checked[i.id]).length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  const handlePrint = () => window.print();

  const handleReset = (scheduleId: string) => {
    const schedule = SCHEDULES.find(s => s.id === scheduleId);
    if (!schedule) return;
    setChecked(prev => {
      const next = { ...prev };
      schedule.items.forEach(i => { delete next[i.id]; });
      localStorage.setItem("sai_maintenance_checks", JSON.stringify(next));
      return next;
    });
    toast({ title: "Reset Ho Gaya", description: "Sabhi checks clear ho gayi." });
  };

  const activeSchedule = SCHEDULES.find(s => s.id === activeTab)!;
  const { total, done, pct } = getProgress(activeSchedule);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <style>{`
        @media print {
          header, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-section { color: black !important; background: white !important; }
        }
      `}</style>

      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-orange-200/15 blur-3xl" />
      </div>

      <header className="relative border-b border-amber-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setLocation("/home")} aria-label="Go back" className="p-2 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
            <Wrench className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h1 className="text-slate-800 font-semibold text-sm">Machine Maintenance Guide</h1>
            <p className="text-slate-400 text-xs">SAI RoloTech Roll Forming Machine · Dekh-Rekh Schedule</p>
          </div>
          <button onClick={handlePrint} aria-label="Print maintenance guide" className="no-print flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 border border-amber-200 text-slate-700 rounded-lg text-xs transition-colors shadow-sm">
            <Printer className="w-3.5 h-3.5" aria-hidden="true" /> Print
          </button>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-3">
            <Wrench className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            <span className="text-amber-700 text-sm font-medium">SAI RoloTech — Machine Dekh-Rekh Guide</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Roll Forming Machine Maintenance</h2>
          <p className="text-slate-500 text-sm mt-1">Sahi maintenance se machine ki life 2x hoti hai aur production quality behtarin rehti hai</p>
        </div>

        <div className="no-print grid grid-cols-5 gap-2">
          {SCHEDULES.map(s => {
            const { done, total, pct } = getProgress(s);
            const Icon = s.icon;
            const isActive = activeTab === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={`relative p-3 rounded-xl border transition-all text-center focus-visible:ring-2 focus-visible:ring-amber-400 ${isActive
                  ? `${s.borderColor} bg-white shadow-sm`
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${isActive ? s.color : "text-slate-400"}`} aria-hidden="true" />
                <p className={`text-xs font-semibold ${isActive ? s.color : "text-slate-500"}`}>{s.period}</p>
                <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${s.bgColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-slate-400 text-xs mt-0.5">{done}/{total}</p>
              </button>
            );
          })}
        </div>

        <div className={`border ${activeSchedule.borderColor} rounded-2xl overflow-hidden bg-white shadow-sm`}>
          <div className={`p-4 flex items-center justify-between`}>
            <div>
              <h3 className={`text-base font-bold ${activeSchedule.color}`}>{activeSchedule.label}</h3>
              <p className="text-slate-500 text-sm mt-0.5">{done} / {total} tasks complete · {pct}%</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div className={`h-full ${activeSchedule.bgColor} rounded-full`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
              </div>
              <button onClick={() => handleReset(activeTab)} aria-label="Reset checklist" className="no-print p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setExpandedTip(expandedTip === activeTab ? null : activeTab)}
            className={`w-full flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-left transition-colors hover:bg-amber-100`}
          >
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" aria-hidden="true" />
            <span className="text-amber-700 text-xs flex-1">{activeSchedule.tip}</span>
            {expandedTip === activeTab ? <ChevronUp className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />}
          </button>

          <div className="divide-y divide-slate-100">
            {activeSchedule.items.map((item, idx) => {
              const isChecked = !!checked[item.id];
              const catInfo = CATEGORY_ICONS[item.category];
              const CatIcon = catInfo.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`flex gap-3 p-4 transition-all cursor-pointer group ${isChecked ? "bg-emerald-50" : "hover:bg-slate-50"}`}
                  onClick={() => toggleCheck(item.id)}
                  role="checkbox"
                  aria-checked={isChecked}
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && toggleCheck(item.id)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isChecked
                      ? <CheckSquare className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                      : <Square className={`w-5 h-5 ${item.priority === "critical" ? "text-red-500" : item.priority === "high" ? "text-amber-500" : "text-slate-400"} group-hover:text-slate-600 transition-colors`} aria-hidden="true" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${isChecked ? "text-slate-400 line-through" : "text-slate-800"}`}>
                        {idx + 1}. {item.task}
                      </p>
                      {item.priority === "critical" && !isChecked && (
                        <span className="flex items-center gap-0.5 bg-red-50 border border-red-200 text-red-700 text-xs px-1.5 py-0.5 rounded font-medium">
                          <AlertTriangle className="w-2.5 h-2.5" aria-hidden="true" /> Critical
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${isChecked ? "text-slate-400" : "text-slate-500"}`}>{item.detail}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <CatIcon className={`w-3 h-3 ${catInfo.color}`} aria-hidden="true" />
                      <span className={`text-xs ${catInfo.color}`}>{catInfo.label}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {pct === 100 && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-green-500/15 border-t border-green-500/30 text-center">
              <p className="text-green-400 font-bold text-sm">✅ Sabhi {activeSchedule.period} checks complete ho gayi!</p>
              <p className="text-green-300/60 text-xs mt-0.5">Log book mein entry karna na bhoolein · Date: {new Date().toLocaleDateString("en-IN")}</p>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-500" aria-hidden="true" /> Zaroor Rakhein — Spare Parts
            </h4>
            <div className="space-y-2">
              {SPARE_PARTS.map((sp, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-slate-800 text-sm font-medium">{sp.item}</p>
                    <p className="text-slate-400 text-xs">{sp.qty}</p>
                  </div>
                  <span className="bg-slate-100 border border-slate-200 text-slate-600 text-xs px-2 py-1 rounded-lg">{sp.frequency}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <h4 className="text-red-700 font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Kabhi Mat Karein
              </h4>
              <div className="space-y-2">
                {[
                  "Machine chalte waqt guards hatana",
                  "Dry bearings pe machine chalana",
                  "Overloaded motor ignore karna",
                  "Safety lock ke bina maintenance",
                  "Galat grade oil/grease use karna",
                  "PLC battery replace karna bina backup",
                ].map((don, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-red-500 text-lg leading-none mt-0.5" aria-hidden="true">✗</span>
                    <p className="text-red-800 text-sm">{don}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
              <h4 className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" aria-hidden="true" /> SAI RoloTech AMC Service
              </h4>
              <p className="text-slate-600 text-sm">Hamare Annual Maintenance Contract (AMC) mein quarterly visits, emergency support, aur genuine spare parts included hain.</p>
              <button
                onClick={() => setLocation("/ai-quote")}
                className="mt-3 flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors focus-visible:underline"
              >
                AMC Quote Mangwayein →
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h4 className="text-slate-800 font-semibold mb-4 text-center">📋 Maintenance Summary Schedule</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-2.5 text-slate-600 font-semibold rounded-l">Frequency</th>
                  <th className="text-center p-2.5 text-slate-600 font-semibold">Tasks</th>
                  <th className="text-center p-2.5 text-slate-600 font-semibold">Time Needed</th>
                  <th className="text-left p-2.5 text-slate-600 font-semibold rounded-r">Key Focus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { freq: "Daily (Roz)", tasks: "10", time: "15-20 min", focus: "Lubrication, Safety, Cleaning", color: "text-blue-600" },
                  { freq: "Weekly (Hafta)", tasks: "10", time: "1-2 ghante", focus: "Chain/Belt, Bearings, Electrical", color: "text-emerald-600" },
                  { freq: "Monthly (Mahina)", tasks: "12", time: "3-4 ghante", focus: "Full Lubrication, Alignment, PLC Backup", color: "text-amber-600" },
                  { freq: "Quarterly (3 Mahine)", tasks: "10", time: "1 poora din", focus: "Oil Change, Bearings, Tooling", color: "text-orange-600" },
                  { freq: "Yearly (Annual)", tasks: "10", time: "3-5 din", focus: "Complete Overhaul, Motor, Gearbox", color: "text-red-600" },
                ].map((row) => (
                  <tr key={row.freq} className="hover:bg-slate-50 transition-colors">
                    <td className={`p-2.5 font-semibold ${row.color}`}>{row.freq}</td>
                    <td className="p-2.5 text-center text-slate-800 font-medium">{row.tasks}</td>
                    <td className="p-2.5 text-center text-slate-600">{row.time}</td>
                    <td className="p-2.5 text-slate-500 text-xs">{row.focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center py-3 text-slate-400 text-xs">
          SAI RoloTech · Machine Maintenance Guide · Pune, Maharashtra · +91 98765 43210
        </div>
      </main>
    </div>
  );
}
