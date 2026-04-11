/**
 * SAI RoloTech — Machine Catalog
 * Categories: Shutter Plant | False Ceiling
 * Shutter Patti Machine: Live with pricing wizard
 * Others: Coming Soon
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useLocation } from "wouter";
import {
  ChevronRight, Play, X, CheckCircle2, ArrowRight, IndianRupee,
  Plus, Minus, Zap, Settings, Star, Clock, Package, Layers,
  ShoppingCart, ExternalLink, Info, Image as ImageIcon, ChevronDown,
  MessageSquare, Phone, MapPin, Factory, Calendar, Star as StarIcon,
  TrendingUp, Award, Users,
} from "lucide-react";

/* ─── YouTube embed helper ───────────────────────────────── */
function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const id = getYouTubeId(url);
  if (!id) return null;
  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

/* ─── Shutter Plant Product Data ──────────────────────────── */
const SHUTTER_PRODUCTS = [
  {
    id: "shutter-patti",
    name: "Shutter Patti Machine",
    tagline: "Roll Forming for Shutter Strips · Strip widths: 4.5\", 5.0\", 6.0\"",
    status: "live" as const,
    gradient: "from-blue-600 to-indigo-700",
    icon: "🏭",
    profiles: ["Shutter Patti Strip"],
    sizes: ["SAI-4.5\" (115mm)", "SAI-5.0\" (127mm)", "SAI-6.0\" (152mm)"],
    specs: {
      "Sheet Thickness": "0.4 to 1.2 mm",
      "Machine Speed": "6 m/min",
      "Max Length": "No limit",
      "Motor": "5 to 7.5 HP",
    },
    videos: [
      { label: "Basic Machine", url: "https://youtube.com/shorts/LPEQldD5c6g" },
      { label: "Medium Machine", url: "https://youtube.com/shorts/1DbpzyxH6sw" },
      { label: "Advance Machine", url: "https://youtu.be/Q8kiahPsCe0" },
    ],
    description: "High-speed roll forming machine for shutter patti strips. Available in 3 width sizes with Standard and Custom Knurling profiles. Configure from 6 to 18 stations — Basic, Medium, and Advance variants.",
  },
  {
    id: "side-channel",
    name: "Side Channel Machine",
    tagline: "Precision Side Channel Roll Forming",
    status: "live" as const,
    gradient: "from-purple-500 to-violet-700",
    icon: "⚙️",
    profiles: ["Side Channel"],
    sizes: ["Multiple widths available"],
    specs: {
      "Sheet Thickness": "0.5 to 1.5 mm",
      "Machine Speed": "6–8 m/min",
      "Max Length": "No limit",
      "Motor": "5 to 10 HP",
    },
    videos: [],
    description: "Precision side channel forming machine for shutter fabrication. Configurable stations and quality grades for various production requirements.",
  },
  {
    id: "bottom-channel",
    name: "Bottom Channel Machine",
    tagline: "Bottom / Floor Channel Roll Forming",
    status: "live" as const,
    gradient: "from-emerald-500 to-teal-700",
    icon: "🔩",
    profiles: ["Bottom Channel", "Floor Channel"],
    sizes: ["Customizable widths"],
    specs: {
      "Sheet Thickness": "0.5 to 1.5 mm",
      "Machine Speed": "5–8 m/min",
      "Max Length": "No limit",
      "Motor": "5 to 10 HP",
    },
    videos: [],
    description: "Bottom channel and floor channel roll forming machine. Essential for shutter fabrication — available in multiple configurations.",
  },
  {
    id: "shutter-spring",
    name: "Shutter Spring Machine",
    tagline: "Shutter Spring Manufacturing",
    status: "soon" as const,
    gradient: "from-orange-500 to-red-600",
    icon: "🌀",
  },
];

/* ─── Shutter Wizard ──────────────────────────────────────── */
type ShutterAutoType = "semi" | "auto";

function ShutterWizard({ productId, onClose }: {
  productId: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [autoType, setAutoType] = useState<ShutterAutoType | null>(null);
  const [stations, setStations] = useState(8);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [, navigate] = useLocation();

  const SHUTTER_PER_STATION: Record<string, number> = { Basic: 45000, Medium: 55000, Advance: 65000 };
  const SHUTTER_AUTO_ADDON: Record<string, number> = { Basic: 175000, Medium: 200000, Advance: 225000 };

  const calcPrice = (): number => {
    if (!grade || !autoType) return 0;
    const base = SHUTTER_PER_STATION[grade] * stations;
    if (autoType === "semi") return base;
    return base + SHUTTER_AUTO_ADDON[grade];
  };

  const price = calcPrice();

  const product = SHUTTER_PRODUCTS.find(p => p.id === productId);
  const productName = product?.name || "Shutter Machine";

  const handleAddToQuote = () => {
    if (!grade || !autoType) return;
    const item = {
      description: `${productName} — ${stations} Stations · ${grade} Grade · ${autoType === "semi" ? "Semi-Auto" : "Fully Auto"}`,
      hsn: "8455",
      quantity: 1,
      unit: "NOS",
      unitPrice: price,
    };
    localStorage.setItem("sai_pending_quote_item", JSON.stringify(item));
    onClose();
    navigate("/quotation-maker");
  };

  const gradeDetails = {
    Basic: {
      icon: "🔵", color: "border-blue-400 bg-blue-50",
      perStation: "₹45,000", addon: "₹1,75,000",
      highlights: ["En8 Rolls", "35mm Shaft", "Lathe Machining", "Chain Drive", "1 Yr Roll Warranty"],
    },
    Medium: {
      icon: "🟣", color: "border-purple-400 bg-purple-50",
      perStation: "₹55,000", addon: "₹2,00,000",
      highlights: ["En31 Rolls", "45mm Shaft", "CNC Machining", "Worm Gear", "2 Yr Roll Warranty"],
    },
    Advance: {
      icon: "🟠", color: "border-orange-400 bg-orange-50",
      perStation: "₹65,000", addon: "₹2,25,000",
      highlights: ["D3 Rolls", "50mm Shaft", "CNC + Advanced", "FAG Bearings", "5 Yr Roll Warranty"],
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-80">🏭 Shutter Plant</p>
              <h2 className="text-base font-bold">{productName}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Step bar */}
          <div className="flex items-center gap-1.5 mt-3">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
          <div className="flex justify-between text-[10px] opacity-70 mt-1">
            <span>Type</span><span>Stations</span><span>Grade</span><span>Price</span>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 120px)" }}>
          <div className="p-5 space-y-4">

            {/* Step 1: Auto / Semi */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">Machine Type Select Karein</h3>
                {([
                  { value: "semi" as ShutterAutoType, label: "Semi-Automatic", sub: "Circular blade cut-off · Manual station change · Budget friendly", icon: "⚙️", color: "border-blue-400 bg-blue-50" },
                  { value: "auto" as ShutterAutoType, label: "Fully Automatic", sub: "Hydraulic die cut-off · Flying cut-off system · High speed production", icon: "🤖", color: "border-indigo-400 bg-indigo-50" },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setAutoType(opt.value); setStep(2); }}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${autoType === opt.value ? opt.color + " border-opacity-100" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </motion.div>
            )}

            {/* Step 2: Stations */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">Kitne Stations Chahiye?</h3>
                <p className="text-xs text-gray-500">6 se le kar 18 stations tak — zyada stations = zyada profile complexity</p>

                {/* Station counter */}
                <div className="bg-gray-50 rounded-2xl p-5 text-center">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Selected Stations</p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setStations(s => Math.max(6, s - 1))}
                      disabled={stations <= 6}
                      className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center disabled:opacity-30 hover:border-blue-400 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
                      <span className="text-3xl font-black text-white">{stations}</span>
                    </div>
                    <button
                      onClick={() => setStations(s => Math.min(18, s + 1))}
                      disabled={stations >= 18}
                      className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center disabled:opacity-30 hover:border-blue-400 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Min: 6 · Max: 18</p>
                </div>

                {/* Quick select */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {[6, 8, 10, 12, 14, 16, 18].map(n => (
                    <button
                      key={n}
                      onClick={() => setStations(n)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        stations === n
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {n} Stations
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(3)}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  Next: Grade Select <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => setStep(1)} className="w-full py-2 text-gray-500 text-sm">← Back</button>
              </motion.div>
            )}

            {/* Step 3: Grade */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">Quality Grade Select Karein</h3>
                {(["Basic", "Medium", "Advance"] as Grade[]).map(g => {
                  const gd = gradeDetails[g];
                  return (
                    <button
                      key={g}
                      onClick={() => { setGrade(g); setStep(4); }}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${grade === g ? gd.color + " border-opacity-100" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{gd.icon}</span>
                          <span className="text-sm font-bold text-gray-800">{g} Grade</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-500">₹{gd.perStation}/station</p>
                          <p className="text-[10px] text-blue-600">+ ₹{gd.addon} Auto</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {gd.highlights.map(h => (
                          <span key={h} className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">{h}</span>
                        ))}
                      </div>
                    </button>
                  );
                })}
                <button onClick={() => setStep(2)} className="w-full py-2 text-gray-500 text-sm">← Back</button>
              </motion.div>
            )}

            {/* Step 4: Price Summary */}
            {step === 4 && grade && autoType && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white text-center">
                  <p className="text-xs opacity-80 mb-1">Your Machine Price</p>
                  <p className="text-4xl font-black">{fmtINR(price)}</p>
                  <p className="text-xs opacity-70 mt-1">+ GST 18% extra</p>
                </div>

                {/* Config summary */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { l: "Type", v: autoType === "semi" ? "Semi-Auto" : "Fully Auto" },
                    { l: "Stations", v: `${stations} Stations` },
                    { l: "Grade", v: grade },
                    { l: "Machine", v: productName.replace(" Machine", "") },
                  ].map(({ l, v }) => (
                    <div key={l} className="bg-gray-50 rounded-xl p-2.5 text-center">
                      <p className="font-bold text-gray-800 text-[11px]">{v}</p>
                      <p className="text-gray-500 mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>

                {/* Price breakdown */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{stations} stations × ₹{(SHUTTER_PER_STATION[grade] / 1000).toFixed(0)}K</span>
                    <span className="font-semibold">{fmtINR(SHUTTER_PER_STATION[grade] * stations)}</span>
                  </div>
                  {autoType === "auto" && (
                    <div className="flex justify-between text-blue-700">
                      <span>Automatic Upgrade</span>
                      <span className="font-semibold">+ {fmtINR(SHUTTER_AUTO_ADDON[grade])}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800">
                    <span>Total (excl. GST)</span>
                    <span>{fmtINR(price)}</span>
                  </div>
                </div>

                {/* Grade highlights */}
                {gradeDetails[grade] && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{gradeDetails[grade].icon}</span>
                      <span className="text-sm font-bold text-gray-800">{grade} Grade — Includes</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {gradeDetails[grade].highlights.map(h => (
                        <span key={h} className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">{h}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Terms */}
                <div className="text-[10px] text-gray-500 bg-amber-50 rounded-xl p-3 space-y-0.5">
                  <p>• 50% advance, 30% progress, 20% on delivery</p>
                  <p>• Delivery: 20-60 days · Installation: 4% extra · GST 18% extra</p>
                  <p>• Trial material by owner · Transportation extra</p>
                </div>

                {/* Actions */}
                <div className="space-y-2.5">
                  <button onClick={handleAddToQuote}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg">
                    <ShoppingCart className="w-4 h-4" /> Quotation Mein Add Karein
                  </button>
                  <button onClick={() => setStep(1)}
                    className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-2xl text-sm font-medium">
                    Dobara Configure Karein
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Shutter Machine Detail ─────────────────────────────── */
function MachineDetail({ product, onClose, onConfigure }: {
  product: typeof SHUTTER_PRODUCTS[0];
  onClose: () => void;
  onConfigure?: () => void;
}) {
  const [activeVideo, setActiveVideo] = useState(0);
  const [tab, setTab] = useState<"configure" | "specs" | "photos" | "video">("configure");

  const hasVideos = product.videos && product.videos.length > 0;

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Namaste SAI RoloTech!\n\nMujhe ${product.name} ke baare mein jaankari chahiye.\n\nPlease quote bhejein.`
    );
    window.open(`https://wa.me/919899925274?text=${msg}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        <div className={`bg-gradient-to-r ${product.gradient} px-5 py-4 text-white`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-2xl">{product.icon}</span>
              <h2 className="text-base font-bold mt-1">{product.name}</h2>
              <p className="text-xs opacity-80 mt-0.5">{product.tagline}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            {[
              { id: "configure", l: "🎛️ Configure" },
              { id: "specs", l: "📋 Specs" },
              { id: "photos", l: "📷 Photos" },
              ...(hasVideos ? [{ id: "video", l: "▶ Video" }] : []),
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all
                  ${tab === t.id ? "bg-white text-gray-800" : "bg-white/20 text-white"}`}
              >{t.l}</button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 160px)" }}>
          <div className="p-4 space-y-3">

            {/* Configure Tab */}
            {tab === "configure" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Customize Your Machine</h3>
                  <p className="text-xs text-gray-500 mt-1">Step-by-step — Type, Stations, Grade</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { icon: "⚙️", l: "Type", sub: "Semi / Auto" },
                    { icon: "🔢", l: "Stations", sub: "6 to 18" },
                    { icon: "🏅", l: "Grade", sub: "Basic / Med / Adv" },
                  ].map(({ icon, l, sub }) => (
                    <div key={l} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-lg">{icon}</p>
                      <p className="font-bold text-gray-800 mt-1">{l}</p>
                      <p className="text-[10px] text-gray-400">{sub}</p>
                    </div>
                  ))}
                </div>
                {product.status === "live" ? (
                  <div className="space-y-2">
                    <button onClick={onConfigure}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg">
                      <Settings className="w-4 h-4" /> Start Configuration
                    </button>
                    <button onClick={handleWhatsApp}
                      className="w-full py-2.5 border-2 border-green-500 text-green-700 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
                      <ExternalLink className="w-4 h-4" /> WhatsApp pe Poochein
                    </button>
                  </div>
                ) : (
                  <div className="py-3 bg-gray-100 rounded-xl text-sm text-gray-500 text-center">
                    Jald Launch Hoga — Notify Karein
                  </div>
                )}
              </div>
            )}

            {/* Specs Tab */}
            {tab === "specs" && (
              <div className="space-y-3">
                {product.sizes && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Available Sizes</p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map(s => (
                        <span key={s} className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {product.specs && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Technical Specifications</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(product.specs).map(([k, v]) => (
                        <div key={k} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] text-gray-500">{k}</p>
                          <p className="text-xs font-semibold text-gray-800 mt-0.5">{String(v)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {product.description && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Description</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
                  </div>
                )}

                {/* Price hint */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-blue-800 mb-2">Starting Price Reference</p>
                  <div className="space-y-1.5">
                    {(["Basic", "Medium", "Advance"] as Grade[]).map(g => (
                      <div key={g} className="flex justify-between text-xs">
                        <span className="text-gray-700">{g} Grade</span>
                        <span className="font-bold text-gray-800">
                          ₹{(45000 * (g === "Basic" ? 1 : g === "Medium" ? 1.22 : 1.44)).toFixed(0)}K – ₹{(65000 * 18).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                    <p className="text-[10px] text-gray-400 mt-1">Semi-Auto 8 stations base · GST extra</p>
                  </div>
                </div>
              </div>
            )}

            {/* Video Tab */}
            {tab === "video" && hasVideos && product.videos && (
              <div>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {product.videos.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveVideo(i)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all
                        ${activeVideo === i ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
                    >
                      <Play className="w-3 h-3 inline mr-1" />{v.label}
                    </button>
                  ))}
                </div>
                <YouTubeEmbed url={product.videos[activeVideo].url} title={product.videos[activeVideo].label} />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── False Ceiling Pricing & Config Data ──────────────────── */
type FCConfigType = "single" | "two-in-one" | "three-in-one" | "four-in-one";
type FCAutoType = "semi" | "auto";

const FC_GRADE_MULTIPLIER: Record<string, Record<string, number>> = {
  "pop-channel": {
    "Semi-Auto|Basic": 300000, "Semi-Auto|Medium": 400000, "Semi-Auto|Advance": 450000,
    "Auto|Basic": 500000, "Auto|Medium": 600000, "Auto|Advance": 650000,
  },
  "gypsum-channel": {
    "Semi-Auto|Basic": 300000, "Semi-Auto|Medium": 400000, "Semi-Auto|Advance": 450000,
    "Auto|Basic": 500000, "Auto|Medium": 600000, "Auto|Advance": 650000,
  },
  "metal-partition": {
    "Semi-Auto|Basic": 350000, "Semi-Auto|Medium": 450000, "Semi-Auto|Advance": 500000,
    "Auto|Basic": 550000, "Auto|Medium": 650000, "Auto|Advance": 700000,
  },
};

const FC_COMBO_MULTIPLIER: Record<string, Record<string, number>> = {
  "pop-channel": {
    "2-in-1|Semi": 600000, "2-in-1|Auto": 1000000,
    "3-in-1|Semi": 900000, "3-in-1|Auto": 1500000,
    "4-in-1|Semi": 1200000, "4-in-1|Auto": 2000000,
  },
  "gypsum-channel": {
    "2-in-1|Semi": 600000, "2-in-1|Auto": 1000000,
    "3-in-1|Semi": 850000, "3-in-1|Auto": 1450000,
    "4-in-1|Semi": 1100000, "4-in-1|Auto": 1900000,
  },
  "metal-partition": {
    "2-in-1|Semi": 700000, "2-in-1|Auto": 1100000,
    "3-in-1|Semi": 950000, "3-in-1|Auto": 1600000,
    "4-in-1|Semi": 1200000, "4-in-1|Auto": 2000000,
  },
};

const FC_VIDEOS: Record<string, string> = {
  "pop-channel": "https://youtu.be/Jc7vmbXE510",
  "gypsum-channel": "https://youtu.be/r6Yl_6JUSq8",
  "metal-partition": "https://youtu.be/v3mTc7Li-1s",
};

/* ─── False Ceiling Product Data ─────────────────────────── */
const FALSE_CEILING_PRODUCTS = [
  {
    id: "pop-channel",
    name: "POP Channel Machine",
    tagline: "POP/Ceiling Section Forming · Gypsum Frame Profiles",
    status: "live" as const,
    gradient: "from-indigo-500 to-violet-600",
    icon: "🏗️",
    profiles: ["POP Channel", "T-Channel", "Wall Angle"],
    comboNote: "POP Channel me T-Channel aur Wall Angle bhi add kar sakte hain — Multi-in-One se bachat!",
  },
  {
    id: "gypsum-channel",
    name: "Gypsum Channel Machine",
    tagline: "Gypsum Board Frame Forming · Metal Stud & Track",
    status: "live" as const,
    gradient: "from-teal-500 to-cyan-600",
    icon: "📐",
    profiles: ["Gypsum Stud", "Gypsum Track", "Furring Channel"],
    comboNote: "Gypsum profiles multi-width mein bana sakte hain — Single ya Combo mein available!",
  },
  {
    id: "metal-partition",
    name: "Metal Partition Machine",
    tagline: "Heavy-Duty Partition Profiles · Steel Stud Framing",
    status: "live" as const,
    gradient: "from-slate-600 to-gray-700",
    icon: "🧱",
    profiles: ["Stud Track", "Runner Track", "Shadow Line"],
    comboNote: "Metal Partition standard aur custom widths mein ban sakta hai — industrial grade!",
  },
];

/* ─── False Ceiling Configure Wizard ─────────────────────── */
function FalseCeilingWizard({ product, onClose }: {
  product: typeof FALSE_CEILING_PRODUCTS[0];
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [autoType, setAutoType] = useState<FCAutoType | null>(null);
  const [config, setConfig] = useState<FCConfigType | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [, navigate] = useLocation();

  const profiles = product.profiles || [];

  const availableConfigs: { id: FCConfigType; label: string; emoji: string; profiles: string[] }[] = [];
  if (profiles.length >= 1) {
    availableConfigs.push({ id: "single", label: "Single Machine", emoji: "1️⃣", profiles: profiles.slice(0, 1) });
  }
  if (profiles.length >= 2) {
    availableConfigs.push({ id: "two-in-one", label: "2-in-1 Machine", emoji: "2️⃣", profiles: profiles.slice(0, 2) });
  }
  if (profiles.length >= 3) {
    availableConfigs.push({ id: "three-in-one", label: "3-in-1 Machine", emoji: "3️⃣", profiles: profiles.slice(0, 3) });
  }
  if (profiles.length >= 4) {
    availableConfigs.push({ id: "four-in-one", label: "4-in-1 Machine", emoji: "4️⃣", profiles: profiles.slice(0, 4) });
  }

  const calcPrice = (): number => {
    if (!autoType || !config || !grade) return 0;
    if (config === "single") {
      return FC_GRADE_MULTIPLIER[product.id]?.[`${autoType === "semi" ? "Semi-Auto" : "Auto"}|${grade}`] || 0;
    }
    const comboKey = `${config === "two-in-one" ? "2-in-1" : config === "three-in-one" ? "3-in-1" : "4-in-1"}|${autoType === "semi" ? "Semi" : "Auto"}`;
    return FC_COMBO_MULTIPLIER[product.id]?.[comboKey] || 0;
  };

  const price = calcPrice();

  const handleAddToQuote = () => {
    if (!grade || !autoType || !config) return;
    const configLabel = config === "single" ? "Single" : config === "two-in-one" ? "2-in-1" : config === "three-in-one" ? "3-in-1" : "4-in-1";
    const item = {
      description: `${product.name} — ${configLabel} Config · ${autoType === "semi" ? "Semi-Auto" : "Fully Auto"} · ${grade} Grade`,
      hsn: "8455",
      quantity: 1,
      unit: "NOS",
      unitPrice: price,
    };
    localStorage.setItem("sai_pending_quote_item", JSON.stringify(item));
    onClose();
    navigate("/quotation-maker");
  };

  const gradeDetails = {
    Basic:  { icon: "🔵", highlights: ["En8 Rolls", "35mm Shaft", "Lathe Machining", "Chain Drive", "1 Yr Warranty"] },
    Medium: { icon: "🟣", highlights: ["En31 Rolls", "45mm Shaft", "CNC Machining", "Worm Gear", "2 Yr Warranty"] },
    Advance: { icon: "🟠", highlights: ["D3 Rolls", "50mm Shaft", "CNC+Advanced", "FAG Bearings", "5 Yr Warranty"] },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "92vh" }}
      >
        <div className={`bg-gradient-to-r ${product.gradient} px-5 py-4 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-80">{product.icon} {product.name}</p>
              <h2 className="text-base font-bold">Configure Your Machine</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
          <div className="flex justify-between text-[10px] opacity-70 mt-1">
            <span>Type</span><span>Config</span><span>Grade</span><span>Price</span>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 120px)" }}>
          <div className="p-5 space-y-4">

            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">Machine Type Select Karein</h3>
                {([
                  { value: "semi" as FCAutoType, label: "Semi-Automatic", sub: "Manual cutting · Circular blade · Budget friendly", icon: "⚙️", color: "border-blue-400 bg-blue-50" },
                  { value: "auto" as FCAutoType, label: "Fully Automatic", sub: "Hydraulic die cut-off · Flying cut-off · High speed", icon: "🤖", color: "border-indigo-400 bg-indigo-50" },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setAutoType(opt.value); setStep(2); }}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${autoType === opt.value ? opt.color + " border-opacity-100" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">Configuration Select Karein</h3>
                <p className="text-xs text-gray-500">Kitne profiles ek machine mein chahiye?</p>
                {availableConfigs.map(cfg => (
                  <button
                    key={cfg.id}
                    onClick={() => { setConfig(cfg.id); setStep(3); }}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${config === cfg.id ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <span className="text-2xl">{cfg.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{cfg.label}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cfg.profiles.map(p => (
                          <span key={p} className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">{p}</span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">Quality Grade Select Karein</h3>
                {([
                  { value: "Basic" as Grade, icon: "🔵", color: "border-blue-400 bg-blue-50", priceNote: "En8 Rolls · 35mm Shaft · Lathe Machining" },
                  { value: "Medium" as Grade, icon: "🟣", color: "border-purple-400 bg-purple-50", priceNote: "En31 Rolls · 45mm Shaft · CNC Machining" },
                  { value: "Advance" as Grade, icon: "🟠", color: "border-orange-400 bg-orange-50", priceNote: "D3 Rolls · 50mm Shaft · FAG German Bearings" },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setGrade(opt.value); setStep(4); }}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${grade === opt.value ? opt.color + " border-opacity-100" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{opt.icon}</span>
                      <span className="text-sm font-bold text-gray-800">{opt.value} Grade</span>
                    </div>
                    <p className="text-xs text-gray-500">{opt.priceNote}</p>
                  </button>
                ))}
              </motion.div>
            )}

            {step === 4 && grade && autoType && config && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div className={`bg-gradient-to-br ${product.gradient} rounded-2xl p-5 text-white text-center`}>
                  <p className="text-xs opacity-80 mb-1">Your Machine Price</p>
                  <p className="text-4xl font-black">{fmtINR(price)}</p>
                  <p className="text-xs opacity-70 mt-1">+ GST 18% extra</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { l: "Type", v: autoType === "semi" ? "Semi-Auto" : "Fully Auto" },
                    { l: "Config", v: config === "single" ? "Single" : config === "two-in-one" ? "2-in-1" : config === "three-in-one" ? "3-in-1" : "4-in-1" },
                    { l: "Grade", v: grade },
                    { l: "Profiles", v: availableConfigs.find(c => c.id === config)?.profiles.join(" + ") || "" },
                  ].map(({ l, v }) => (
                    <div key={l} className="bg-gray-50 rounded-xl p-2.5 text-center">
                      <p className="font-bold text-gray-800 text-[11px]">{v}</p>
                      <p className="text-gray-500 mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>

                {gradeDetails[grade] && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{gradeDetails[grade].icon}</span>
                      <span className="text-sm font-bold text-gray-800">{grade} Grade — Includes</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {gradeDetails[grade].highlights.map(h => (
                        <span key={h} className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">{h}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-gray-500 space-y-0.5 bg-amber-50 rounded-xl p-3">
                  <p>• 50% advance, 30% progress, 20% on delivery</p>
                  <p>• Delivery: 20-60 days · Installation: 4% extra · GST 18% extra</p>
                  <p>• Trial material by owner · Transportation extra</p>
                </div>

                <div className="space-y-2.5">
                  <button onClick={handleAddToQuote}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg">
                    <ShoppingCart className="w-4 h-4" /> Quotation Mein Add Karein
                  </button>
                  <button onClick={() => setStep(1)}
                    className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-2xl text-sm font-medium">
                    Dobara Configure Karein
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── False Ceiling Detail Sheet ─────────────────────────── */
function FalseCeilingDetail({ product, onClose }: {
  product: typeof FALSE_CEILING_PRODUCTS[0];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"configure" | "price" | "video">("configure");
  const [showWizard, setShowWizard] = useState(false);

  const profiles = product.profiles || [];
  const videoUrl = FC_VIDEOS[product.id];

  if (showWizard) {
    return <FalseCeilingWizard product={product} onClose={() => { setShowWizard(false); onClose(); }} />;
  }

  const handleInquiry = () => {
    const msg = encodeURIComponent(
      `Namaste SAI RoloTech!\n\nMujhe ${product.name} ke baare mein jaankari chahiye.\n\nProfiles: ${profiles.join(", ")}\n\nPlease quote bhejein.`
    );
    window.open(`https://wa.me/919899925274?text=${msg}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "92vh" }}
      >
        <div className={`bg-gradient-to-r ${product.gradient} px-5 py-4 text-white`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-2xl">{product.icon}</span>
              <h2 className="text-base font-bold mt-1">{product.name}</h2>
              <p className="text-xs opacity-80">{product.tagline}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {profiles.map(p => (
              <span key={p} className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{p}</span>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            {[
              { id: "configure", l: "🎛️ Configure" },
              { id: "price", l: "💰 Pricing" },
              { id: "video", l: "▶ Video" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all
                  ${tab === t.id ? "bg-white text-gray-800" : "bg-white/20 text-white"}`}
              >{t.l}</button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 180px)" }}>
          <div className="p-4 space-y-3">

            {tab === "configure" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Customize Your Machine</h3>
                  <p className="text-xs text-gray-500 mt-1">Step-by-step — Type, Profiles (1 to 4), Grade</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { icon: "⚙️", l: "Type", sub: "Semi / Auto" },
                    { icon: "🔢", l: "Config", sub: "Single / 2-3-4-in-1" },
                    { icon: "🏅", l: "Grade", sub: "Basic / Med / Adv" },
                  ].map(({ icon, l, sub }) => (
                    <div key={l} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-lg">{icon}</p>
                      <p className="font-bold text-gray-800 mt-1">{l}</p>
                      <p className="text-[10px] text-gray-400">{sub}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <button onClick={() => setShowWizard(true)}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg">
                    <Settings className="w-4 h-4" /> Start Configuration
                  </button>
                  <button onClick={handleInquiry}
                    className="w-full py-2.5 border-2 border-green-500 text-green-700 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" /> WhatsApp pe Poochein
                  </button>
                </div>
              </div>
            )}

            {tab === "price" && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Single Machine Pricing</p>
                  {(["Basic", "Medium", "Advance"] as Grade[]).map(g => {
                    const gradeColor = g === "Basic" ? "bg-blue-50" : g === "Medium" ? "bg-purple-50" : "bg-orange-50";
                    return (
                      <div key={g} className="grid grid-cols-3 gap-2 text-xs">
                        <div className={`rounded-xl p-2.5 text-center font-bold text-gray-700 ${gradeColor}`}>{g}</div>
                        <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                          <p className="font-bold text-emerald-700">Semi</p>
                          <p className="text-[10px] text-emerald-600">{fmtINR(FC_GRADE_MULTIPLIER[product.id]?.[`Semi-Auto|${g}`] || 0)}</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                          <p className="font-bold text-blue-700">Auto</p>
                          <p className="text-[10px] text-blue-600">{fmtINR(FC_GRADE_MULTIPLIER[product.id]?.[`Auto|${g}`] || 0)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">⚡ Multi-in-One Combo Pricing</p>
                  {(["2-in-1", "3-in-1", "4-in-1"] as const).map(cfg => {
                    const semiKey = `${cfg}|Semi`;
                    const autoKey = `${cfg}|Auto`;
                    const semiPrice = FC_COMBO_MULTIPLIER[product.id]?.[semiKey];
                    const autoPrice = FC_COMBO_MULTIPLIER[product.id]?.[autoKey];
                    if (!semiPrice && !autoPrice) return null;
                    return (
                      <div key={cfg} className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-xl p-2.5 text-center font-bold text-gray-700 bg-indigo-50">{cfg}</div>
                        <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                          <p className="font-bold text-emerald-700">Semi</p>
                          <p className="text-[10px] text-emerald-600">{semiPrice ? fmtINR(semiPrice) : "—"}</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                          <p className="font-bold text-blue-700">Auto</p>
                          <p className="text-[10px] text-blue-600">{autoPrice ? fmtINR(autoPrice) : "—"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {product.comboNote && (
                  <div className="flex gap-2 bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                    <Zap className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-700 font-medium">{product.comboNote}</p>
                  </div>
                )}

                <div className="text-[10px] text-gray-500 bg-amber-50 rounded-xl p-3 space-y-0.5">
                  <p>• GST 18% extra · Installation 4% extra · Transport extra</p>
                  <p>• Warranty: 1–5 years on rolls (grade-wise) · Payment: 50-30-20</p>
                  <p>• Delivery: 20-60 days from confirmed order</p>
                </div>
              </>
            )}

            {tab === "video" && videoUrl && (
              <YouTubeEmbed url={videoUrl} title={product.name} />
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Product Card ────────────────────────────────────────── */
function ProductCard({ product, onView, onConfigure }: {
  product: { id: string; name: string; tagline: string; status: "live" | "soon"; gradient: string; icon: string; profiles?: string[] };
  onView: () => void;
  onConfigure?: () => void;
}) {
  const waMsg = encodeURIComponent(`Namaste! I'm interested in ${product.name}. Please share details and pricing.`);
  const waUrl = `https://wa.me/919899925274?text=${waMsg}`;

  return (
    <motion.div variants={staggerItem} className="relative group">
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${product.gradient} p-5 text-white shadow-lg`}>
        {/* Status badge */}
        <div className="absolute top-4 right-4">
          {product.status === "live" ? (
            <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" /> LIVE
            </span>
          ) : (
            <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" /> Coming Soon
            </span>
          )}
        </div>

        <div className="text-3xl mb-3">{product.icon}</div>
        <h3 className="text-base font-bold leading-tight">{product.name}</h3>
        <p className="text-xs opacity-80 mt-1">{product.tagline}</p>

        {/* Profiles */}
        {"profiles" in product && product.profiles && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.profiles.map(p => (
              <span key={p} className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{p}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {product.status === "live" ? (
            <>
              <button
                onClick={onView}
                className="flex-1 py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl transition-all backdrop-blur-sm"
              >
                Details Dekho
              </button>
              {onConfigure && (
                <button
                  onClick={onConfigure}
                  className="flex-1 py-2.5 bg-white text-blue-700 text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  Configure
                </button>
              )}
            </>
          ) : (
            <div className="w-full">
              <a
                href={`https://wa.me/919899925274?text=Namaste!%20Please%20notify%20me%20when%20${encodeURIComponent(product.name)}%20is%20available.`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                🔔 Notify Me — WhatsApp se batao
              </a>
            </div>
          )}
        </div>

        {/* Quick Contact — always visible */}
        {product.status === "live" && (
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-[10px] font-semibold rounded-lg transition-colors"
            >
              <MessageSquare className="w-3 h-3" /> WhatsApp
            </a>
            <a
              href="tel:+919899925274"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[10px] font-semibold rounded-lg transition-colors"
            >
              <Phone className="w-3 h-3" /> Call Now
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function MachineCatalogPage() {
  const [activeCategory, setActiveCategory] = useState<"shutter" | "ceiling">("shutter");
  const [selectedProduct, setSelectedProduct] = useState<typeof SHUTTER_PRODUCTS[0] | null>(null);
  const [selectedCeilingProduct, setSelectedCeilingProduct] = useState<typeof FALSE_CEILING_PRODUCTS[0] | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showCeilingDetail, setShowCeilingDetail] = useState(false);
  const [showCeilingWizard, setShowCeilingWizard] = useState(false);
  const [shutterWizardProductId, setShutterWizardProductId] = useState<string>("shutter-patti");

  const categories = [
    { id: "shutter" as const, label: "Shutter Plant", icon: "🏭", count: SHUTTER_PRODUCTS.length, live: SHUTTER_PRODUCTS.filter(p => p.status === "live").length },
    { id: "ceiling" as const, label: "False Ceiling", icon: "🏗️", count: FALSE_CEILING_PRODUCTS.length, live: FALSE_CEILING_PRODUCTS.filter(p => p.status === "live").length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 pb-10">

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-4 pt-6 pb-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-blue-200 text-xs font-medium mb-1">SAI RoloTech CRM</p>
          <h1 className="text-2xl font-black text-white">Machine Catalog</h1>
          <p className="text-blue-200 text-sm mt-1">Roll Forming Machines — Configure & Quote</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4">

        {/* Factory & Trust Strip */}
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a href="https://wa.me/919899925274?text=Namaste!%20I%20want%20to%20book%20a%20factory%20demo%20in%20Mundka"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-100">Book Factory Demo</p>
              <p className="text-sm font-semibold">Mundka, Delhi — Free Visit</p>
            </div>
          </a>
          <div className="flex items-center gap-3 bg-white border border-border rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Factory className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">Factory Address</p>
              <p className="text-xs font-semibold text-foreground">Mundka, Delhi — 110041</p>
              <a href="https://maps.google.com/?q=Mundka+Delhi+110041" target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" /> Google Maps pe dekho
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white border border-border rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <StarIcon className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">11+ Years Experience</p>
              <p className="text-xs font-semibold text-foreground">500+ Machines Installed</p>
              <p className="text-[10px] text-amber-600">JustDial Verified Seller</p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-3 mb-5">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-1 flex flex-col items-center py-3.5 rounded-2xl border-2 transition-all font-medium text-sm
                ${activeCategory === cat.id
                  ? "bg-white border-blue-500 shadow-lg shadow-blue-100"
                  : "bg-white/70 border-transparent hover:border-gray-200"}`}
            >
              <span className="text-xl mb-1">{cat.icon}</span>
              <span className={`text-xs font-bold ${activeCategory === cat.id ? "text-blue-700" : "text-gray-600"}`}>{cat.label}</span>
              <div className="flex items-center gap-1 mt-1">
                {cat.live > 0 && (
                  <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">{cat.live} Live</span>
                )}
                <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{cat.count} Total</span>
              </div>
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {activeCategory === "shutter" && SHUTTER_PRODUCTS.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onView={() => { setSelectedProduct(p); setShowDetail(true); setShowWizard(false); }}
                onConfigure={() => { setSelectedProduct(p); setShutterWizardProductId(p.id); setShowWizard(true); setShowDetail(false); }}
              />
            ))}
            {activeCategory === "ceiling" && FALSE_CEILING_PRODUCTS.map(p => (
              <ProductCard
                key={p.id}
                product={p as any}
                onView={() => { setSelectedCeilingProduct(p); setShowCeilingDetail(true); }}
                onConfigure={() => { setSelectedCeilingProduct(p); setShowCeilingWizard(true); }}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Info strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-4"
        >
          <div className="flex gap-3">
            <span className="text-xl shrink-0">💡</span>
            <div>
              <p className="text-xs font-bold text-amber-800">Custom Machines Available</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Koi bhi custom profile chahiye? Size, material, ya special configuration — hum banate hain.
                Contact: +91-9899925274
              </p>
            </div>
          </div>
        </motion.div>

        {/* PDF Price note */}
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-800 mb-1">📋 Terms & Conditions</p>
          <div className="text-[11px] text-blue-700 space-y-0.5">
            <p>• GST 18% extra on all machines</p>
            <p>• Delivery: 20-60 days · Installation: 4% extra</p>
            <p>• Warranty: 1-5 years on rolls (grade-wise)</p>
            <p>• Payment: 50% advance, 30% progress, 20% on delivery</p>
          </div>
        </div>

        {/* EMI / Financing */}
        <div className="mt-3 bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-green-800 mb-2">💰 EMI & Financing Available</p>
          <div className="text-[11px] text-green-700 space-y-1">
            <p>• EMI options available through bank ties — contact for details</p>
            <p>• Leasing options for companies — long-term financial flexibility</p>
            <p>• Partial payment plans available for startup businesses</p>
          </div>
        </div>

        {/* FAQ — Buying Guide */}
        <div className="mt-4">
          <p className="text-xs font-bold text-foreground mb-3">❓ Buying Guide — Commonly Asked</p>
          <div className="space-y-2">
            {[
              { q: "Semi-Auto vs Full-Auto — kya farak hai?", a: "Semi-Auto: Manual sheet feeding, foot pedal cutting — low cost, good for small shops. Full-Auto: Auto uncoiler + flying cut-off — high speed, less labor needed. Agar daily 500+ meter production hai toh Full-Auto lijiye." },
              { q: "Kitne stations chahiye?", a: "Profile ki complexity pe depend karta hai. Simple Patti (single bend): 6-8 stations. Multi-profile combo: 10-14 stations. Jyada stations = better forming quality, slower speed." },
              { q: "Basic / Medium / Advance Grade — kya lena chahiye?", a: "Basic: For small workshops, occasional use. Medium: Best value — En31 rolls, 2yr warranty, most popular. Advance: For high-volume manufacturers, D3 tool steel, 5yr warranty." },
              { q: "Trial material (test sheet) kaise arrange karein?", a: "Aapko apni production sheet (GI, MS, or Aluminum) Mundka factory leke aana hai. Hum free trial denge apne machine pe. Material thickness aur grade specify karein booking ke time." },
              { q: "Delivery kitne din me hoti hai?", a: "Standard: 20-40 days. Custom configuration: 40-60 days. Emergency orders ke liye contact karein — sometimes fast-track possible hai." },
            ].map((faq, i) => (
              <details key={i} className="bg-white border border-border rounded-xl overflow-hidden group">
                <summary className="flex items-center justify-between p-3 cursor-pointer text-xs font-semibold text-foreground hover:bg-gray-50 list-none">
                  <span className="flex items-center gap-2">
                    <span className="text-primary text-[10px] font-mono">Q{i + 1}</span>
                    {faq.q}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <div className="px-3 pb-3 text-[11px] text-muted-foreground leading-relaxed border-t border-border/50 pt-2">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Social Proof — Customer Reviews */}
        <div className="mt-5">
          <p className="text-xs font-bold text-foreground mb-3">⭐ Customer Reviews — JustDial (140+ Reviews)</p>
          <div className="space-y-3">
            {[
              { name: "Vikram Garg", city: "Ludhiana, Punjab", stars: 5, text: "Bahut accha machine diya. 1.5 saal se kaam kar rahe hain bina koi problem. Factory visit kar ke dekha tha — quality real me bhi achhi hai.", machine: "Shutter Patti Full-Auto" },
              { name: "Rajesh Kumar", city: "Gurgaon, Haryana", stars: 5, text: "Billing mein honest hain, installation bhi free guidance diya. Samjha ke baataya — first-time buyer ke liye best support.", machine: "False Ceiling Machine" },
              { name: "Anil Sharma", city: "Delhi NCR", stars: 4, text: "On-time delivery hui, machine smooth chal rahi hai. WhatsApp pe contact rakhne pe quick response mila.", machine: "Shutter Patti Semi-Auto" },
            ].map((review, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold text-foreground">{review.name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> {review.city}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <StarIcon key={si} className={`w-3 h-3 ${si < review.stars ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">"{review.text}"</p>
                <Badge className="mt-2 text-[9px] bg-slate-50 text-slate-600 border-slate-200">
                  Purchased: {review.machine}
                </Badge>
              </div>
            ))}
            <a href="https://www.justdial.com/jdmart/Delhi/Sai-Rolotech-Near-Mundka-Metro-Station-Mundka/011PXX11-XX11-230427145343-Z4K5_BZDET/catalogue/reviews"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-muted-foreground hover:text-primary hover:border-primary transition-colors">
              <TrendingUp className="w-3.5 h-3.5" /> Read all 140+ reviews on JustDial
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>

      {/* Modals */}
      <AnimatePresence>
        {showDetail && selectedProduct && (
          <MachineDetail
            product={selectedProduct}
            onClose={() => setShowDetail(false)}
            onConfigure={() => { setShowDetail(false); setShutterWizardProductId(selectedProduct?.id || "shutter-patti"); setShowWizard(true); }}
          />
        )}
        {showWizard && (
          <ShutterWizard productId={shutterWizardProductId} onClose={() => setShowWizard(false)} />
        )}
        {showCeilingWizard && selectedCeilingProduct && (
          <FalseCeilingWizard
            product={selectedCeilingProduct}
            onClose={() => setShowCeilingWizard(false)}
          />
        )}
        {showCeilingDetail && selectedCeilingProduct && (
          <FalseCeilingDetail
            product={selectedCeilingProduct}
            onClose={() => setShowCeilingDetail(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
