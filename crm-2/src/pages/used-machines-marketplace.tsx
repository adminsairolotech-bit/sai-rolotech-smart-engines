/**
 * SAI RoloTech — Used Machines Marketplace
 * Buy & Sell Pre-Owned Industrial Machines
 * Pre-launch: Form-based listing with WhatsApp inquiry
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import {
  ArrowLeft, Plus, Search, Filter, Tag, MapPin, Clock, Star,
  Phone, MessageSquare, ExternalLink, Upload, X, ChevronDown,
  CheckCircle2, AlertCircle, Image as ImageIcon, Loader2,
  Cpu, Zap, ShieldCheck, Truck, BadgeIndianRupee, Wrench,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

/* ─── Contact info ─────────────────────────────────────────── */
const WHATSAPP = "919667146889";
const PHONE = "+91-9667146889";
const EMAIL = "admin.sairolotech@gmail.com";

/* ─── Mock Listed Machines (pre-launch demo) ─────────────────── */
const DEMO_MACHINES = [
  {
    id: "um-001",
    name: "Shutter Patti Machine — Semi Auto",
    category: "Shutter Fabrication",
    brand: "Local Make",
    year: 2018,
    condition: "Good",
    price: 180000,
    location: "Delhi NCR",
    seller: "Rajesh Fabrication",
    phone: "98182XXXXX",
    specs: { stations: 8, width: "4.5 inch", motor: "5 HP" },
    images: 3,
    featured: true,
  },
  {
    id: "um-002",
    name: "POP Channel Machine — Fully Auto",
    category: "False Ceiling",
    brand: "SAI RoloTech",
    year: 2020,
    condition: "Excellent",
    price: 350000,
    location: "Pune, Maharashtra",
    seller: "Sharma Industries",
    phone: "98230XXXXX",
    specs: { profiles: "Cross + Main", motor: "7.5 HP", control: "PLC+HMI" },
    images: 5,
    featured: true,
  },
  {
    id: "um-003",
    name: "Gypsum Channel Machine — Semi Auto",
    category: "False Ceiling",
    brand: "Jindal",
    year: 2016,
    condition: "Fair",
    price: 120000,
    location: "Mumbai, Maharashtra",
    seller: "Metal Works Co.",
    phone: "93220XXXXX",
    specs: { profiles: "Ceiling Section", motor: "5 HP" },
    images: 2,
    featured: false,
  },
  {
    id: "um-004",
    name: "Metal Partition Machine — Fully Auto",
    category: "False Ceiling",
    brand: "Local Make",
    year: 2019,
    condition: "Good",
    price: 280000,
    location: "Gurgaon, Haryana",
    seller: "BuildTech Solutions",
    phone: "98765XXXXX",
    specs: { profiles: "Stud + Floor", motor: "7.5 HP", control: "PLC" },
    images: 4,
    featured: false,
  },
];

const CATEGORIES = ["All", "Shutter Fabrication", "False Ceiling", "Pipe Mill", "Cable Tray", "Other"];
const CONDITIONS = ["All", "Excellent", "Good", "Fair", "Needs Repair"];
const SORT_OPTIONS = ["Newest First", "Price: Low to High", "Price: High to Low", "Nearest"];

function fmtINR(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/* ─── Star Rating Component ─────────────────────────────────── */
function StarRating({ value, onChange, readonly = false }: {
  value: number; onChange?: (v: number) => void; readonly?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => !readonly && onChange?.(s)}
          disabled={readonly}
          className={`text-lg transition-all ${s <= value ? "text-amber-400" : "text-gray-300"} ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
          aria-label={`${s} star${s !== 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ─── Image Upload ─────────────────────────────────────────── */
function ImageUploader({ images, onChange }: {
  images: string[]; onChange: (imgs: string[]) => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        onChange([...images, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((img, i) => (
          <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
            <img src={img} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px]"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ))}
        <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
          <Upload className="w-4 h-4 text-gray-400" />
          <span className="text-[9px] text-gray-400 mt-0.5">Add</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
        </label>
      </div>
      <p className="text-[10px] text-gray-400">Max 5 photos · JPG/PNG · Max 5MB each</p>
    </div>
  );
}

/* ─── Sell / List Machine Form ─────────────────────────────── */
function SellMachineForm({ onClose }: { onClose: () => void }) {
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "Shutter Fabrication",
    brand: "",
    year: "",
    condition: "Good",
    price: "",
    negotiable: true,
    location: "",
    sellerName: "",
    phone: "",
    whatsapp: "",
    email: "",
    description: "",
    machineType: "Semi-Auto",
    motorHP: "",
    stationsProfiles: "",
    hoursUsed: "",
  });

  const upd = (k: keyof typeof form, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price.trim() || !form.phone.trim()) {
      toast({ title: "Zaroori fields bharen", description: "Name, price, aur phone zaroor hai.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleWhatsAppSubmit = () => {
    const msg = encodeURIComponent(
      `🏭 *Used Machine Sell Request*\n\n` +
      `Machine: ${form.name}\n` +
      `Category: ${form.category}\n` +
      `Brand: ${form.brand || "Not specified"}\n` +
      `Year: ${form.year || "Not specified"}\n` +
      `Condition: ${form.condition}\n` +
      `Price: ₹${Number(form.price).toLocaleString("en-IN")}${form.negotiable ? " (Negotiable)" : ""}\n` +
      `Location: ${form.location || "Not specified"}\n\n` +
      `Seller: ${form.sellerName || "Not specified"}\n` +
      `Phone: ${form.phone}\n` +
      `WhatsApp: ${form.whatsapp || "Same as phone"}\n\n` +
      `Description: ${form.description || "None"}`
    );
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, "_blank");
    toast({ title: "WhatsApp pe bheja ja raha hai...", description: "Hamari team aapse jald contact karegi." });
  };

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Listing Submitted!</h3>
        <p className="text-sm text-gray-500">Hamari team aapko 24 ghante mein contact karegi.</p>
        <div className="space-y-2">
          <button
            onClick={handleWhatsAppSubmit}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" /> WhatsApp pe Confirm Karein
          </button>
          <button onClick={onClose}
            className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Photos */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
          Machine Photos (upto 5)
        </label>
        <ImageUploader images={images} onChange={setImages} />
      </div>

      {/* Machine Name */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Machine Name <span className="text-red-500">*</span>
        </label>
        <input
          value={form.name}
          onChange={e => upd("name", e.target.value)}
          placeholder="Jaise: Shutter Patti Machine, Semi-Auto, 8 Station"
          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          required
        />
      </div>

      {/* Category + Type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={e => upd("category", e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all"
          >
            {CATEGORIES.filter(c => c !== "All").map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Type</label>
          <select
            value={form.machineType}
            onChange={e => upd("machineType", e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all"
          >
            <option>Semi-Auto</option>
            <option>Fully Auto</option>
            <option>Combo</option>
          </select>
        </div>
      </div>

      {/* Brand + Year */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Brand / Make</label>
          <input
            value={form.brand}
            onChange={e => upd("brand", e.target.value)}
            placeholder="Jaise: SAI RoloTech, Jindal"
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Manufacturing Year</label>
          <input
            type="number"
            value={form.year}
            onChange={e => upd("year", e.target.value)}
            placeholder="2018"
            min="1990"
            max="2025"
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Price + Condition */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.price}
            onChange={e => upd("price", e.target.value)}
            placeholder="250000"
            min="0"
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Condition</label>
          <select
            value={form.condition}
            onChange={e => upd("condition", e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all"
          >
            {CONDITIONS.filter(c => c !== "All").map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Location + Hours Used */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            <MapPin className="w-3 h-3 inline mr-0.5" /> Location
          </label>
          <input
            value={form.location}
            onChange={e => upd("location", e.target.value)}
            placeholder="Delhi NCR"
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Hours Used</label>
          <input
            value={form.hoursUsed}
            onChange={e => upd("hoursUsed", e.target.value)}
            placeholder="5000 hrs"
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={e => upd("description", e.target.value)}
          placeholder="Machine ki condition, koi defects, included accessories..."
          rows={3}
          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
        />
      </div>

      {/* Seller Details */}
      <div className="border-t border-gray-100 pt-3 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Seller Details</p>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Your Name</label>
          <input
            value={form.sellerName}
            onChange={e => upd("sellerName", e.target.value)}
            placeholder="Aapka naam"
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => upd("phone", e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">WhatsApp</label>
            <input
              type="tel"
              value={form.whatsapp}
              onChange={e => upd("whatsapp", e.target.value)}
              placeholder="Same as phone"
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="space-y-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><CheckCircle2 className="w-4 h-4" /> List Machine for Sale</>}
        </button>
        <button
          type="button"
          onClick={handleWhatsAppSubmit}
          className="w-full py-2.5 border-2 border-green-500 text-green-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" /> WhatsApp pe Bhejein
        </button>
      </div>
    </form>
  );
}

/* ─── Machine Card ───────────────────────────────────────────── */
function MachineCard({ machine, onInquiry }: {
  machine: typeof DEMO_MACHINES[0];
  onInquiry: () => void;
}) {
  const conditionColors: Record<string, string> = {
    Excellent: "bg-emerald-100 text-emerald-700",
    Good: "bg-blue-100 text-blue-700",
    Fair: "bg-amber-100 text-amber-700",
    "Needs Repair": "bg-red-100 text-red-700",
  };

  return (
    <motion.div
      variants={staggerItem}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Image placeholder */}
      <div className={`h-32 bg-gradient-to-br ${
        machine.featured
          ? "from-blue-500 to-indigo-600"
          : machine.category === "False Ceiling"
          ? "from-violet-500 to-purple-600"
          : "from-slate-600 to-gray-800"
      } relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Cpu className="w-12 h-12 text-white/30" />
        </div>
        {machine.featured && (
          <span className="absolute top-2 left-2 bg-amber-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
        <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${conditionColors[machine.condition] || "bg-gray-100 text-gray-700"}`}>
          {machine.condition}
        </span>
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <ImageIcon className="w-3 h-3 text-white/70" />
          <span className="text-white/70 text-[9px]">{machine.images} photos</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-800 leading-tight line-clamp-2">{machine.name}</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">{machine.category} · {machine.year}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-black text-blue-700">{fmtINR(machine.price)}</p>
            <p className="text-[9px] text-gray-400">{machine.location}</p>
          </div>
        </div>

        {/* Specs */}
        <div className="flex flex-wrap gap-1">
          {Object.entries(machine.specs).map(([k, v]) => (
            <span key={k} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {String(v)}
            </span>
          ))}
        </div>

        {/* Seller */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-[10px] text-gray-600">{machine.seller}</span>
          </div>
          <div className="flex gap-1.5">
            <a
              href={`tel:${machine.phone}`}
              className="p-1.5 bg-gray-100 hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="Call seller"
            >
              <Phone className="w-3.5 h-3.5 text-gray-500" />
            </a>
            <button
              onClick={onInquiry}
              className="p-1.5 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
              aria-label="WhatsApp inquiry"
            >
              <MessageSquare className="w-3.5 h-3.5 text-green-600" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Machine Inquiry Modal ─────────────────────────────────── */
function MachineInquiryModal({ machine, onClose }: {
  machine: typeof DEMO_MACHINES[0];
  onClose: () => void;
}) {
  const [msg, setMsg] = useState(`Namaste! Mujhe aapka "${machine.name}" dekha hai. Price: ${fmtINR(machine.price)}. Kya ye available hai?`);
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
      setSending(false);
      onClose();
      toast({ title: "WhatsApp pe bheja ja raha hai!", description: `${machine.name} ke baare mein inquiry bheji ja rahi hai.` });
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">Used Machine Inquiry</p>
            <h2 className="text-base font-bold">{machine.name}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm font-bold text-gray-800">{fmtINR(machine.price)}</p>
            <p className="text-xs text-gray-500">{machine.location} · {machine.condition}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Your Message</label>
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            WhatsApp pe Inquiry Bhejein
          </button>
          <button onClick={onClose} className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium">
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── How It Works ─────────────────────────────────────────── */
const HOW_IT_WORKS = [
  { icon: Upload, step: "1", title: "List Your Machine", desc: "Photos, price, specs add karein — 2 minute mein" },
  { icon: CheckCircle2, step: "2", title: "SAI RoloTech Verify Karega", desc: "Technical team machine check karega quality ke liye" },
  { icon: Truck, step: "3", title: "Buyer Mil Jae", desc: "Interested buyers WhatsApp pe contact karein" },
  { icon: BadgeIndianRupee, step: "4", title: "Safe Deal", desc: "SAI RoloTech mediation mein safe transaction" },
];

/* ─── Main Page ─────────────────────────────────────────────── */
export default function UsedMachinesMarketplace() {
  const [, setLocation] = useLocation();
  const [view, setView] = useState<"browse" | "sell">("browse");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [condition, setCondition] = useState("All");
  const [sortBy, setSortBy] = useState("Newest First");
  const [showFilters, setShowFilters] = useState(false);
  const [inquiryMachine, setInquiryMachine] = useState<typeof DEMO_MACHINES[0] | null>(null);

  const filtered = DEMO_MACHINES
    .filter(m => {
      if (category !== "All" && m.category !== category) return false;
      if (condition !== "All" && m.condition !== condition) return false;
      if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
        !m.location.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "Price: Low to High") return a.price - b.price;
      if (sortBy === "Price: High to Low") return b.price - a.price;
      return b.year - a.year; // newest
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-10">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-4 pt-6 pb-8">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setLocation("/home")}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <p className="text-blue-200 text-xs font-medium">SAI RoloTech CRM</p>
            <h1 className="text-xl font-black text-white">Used Machines Marketplace</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4">

        {/* View Toggle */}
        <div className="flex gap-2 mb-4">
          {[
            { id: "browse" as const, icon: Search, label: "Browse Machines", sub: `${DEMO_MACHINES.length} Listed` },
            { id: "sell" as const, icon: Plus, label: "Sell Your Machine", sub: "Free Listing" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex-1 py-3.5 rounded-2xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                view === tab.id
                  ? "bg-white border-blue-500 text-blue-700 shadow-md"
                  : "bg-white/70 border-transparent text-gray-600 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Browse View */}
        {view === "browse" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search machines, location..."
                className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
              />
            </div>

            {/* Filters Row */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  showFilters ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Filter className="w-3.5 h-3.5" /> Filters
                {(category !== "All" || condition !== "All") && (
                  <span className="w-4 h-4 bg-blue-500 text-white rounded-full text-[9px] flex items-center justify-center">!</span>
                )}
              </button>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-all shadow-sm"
              >
                {SORT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Filter Dropdown */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm"
                >
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 block">Category</label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map(c => (
                        <button
                          key={c}
                          onClick={() => setCategory(c)}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                            category === c
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 block">Condition</label>
                    <div className="flex flex-wrap gap-1.5">
                      {CONDITIONS.map(c => (
                        <button
                          key={c}
                          onClick={() => setCondition(c)}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                            condition === c
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{filtered.length} machine{filtered.length !== 1 ? "s" : ""} found</p>
              {(category !== "All" || condition !== "All" || search) && (
                <button
                  onClick={() => { setCategory("All"); setCondition("All"); setSearch(""); }}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Machine Grid */}
            {filtered.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {filtered.map(machine => (
                  <MachineCard
                    key={machine.id}
                    machine={machine}
                    onInquiry={() => setInquiryMachine(machine)}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-base font-bold text-gray-700">Koi Machine Nahi Mila</h3>
                <p className="text-sm text-gray-500">Filter change karein ya naya listing check karein</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Sell View */}
        {view === "sell" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-gray-800 mb-1">Apni Machine Bechein</h2>
              <p className="text-xs text-gray-500 mb-4">Free listing · SAI RoloTech verification ke saath</p>
              <SellMachineForm onClose={() => setView("browse")} />
            </div>
          </motion.div>
        )}

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
        >
          <h3 className="text-sm font-bold text-gray-800 mb-4">Kaise Kaam Karta Hai?</h3>
          <div className="grid grid-cols-2 gap-3">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-blue-600">{step}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{title}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 grid grid-cols-3 gap-3"
        >
          {[
            { icon: ShieldCheck, label: "Verified Listings", color: "text-emerald-600" },
            { icon: Truck, label: "Delivery Support", color: "text-blue-600" },
            { icon: BadgeIndianRupee, label: "Best Price Help", color: "text-amber-600" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
              <p className="text-[10px] font-semibold text-gray-700">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Contact Strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-emerald-800">Questions? Contact Us Directly</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">Phone: {PHONE} · WhatsApp Available</p>
          </div>
          <div className="flex gap-2">
            <a href={`tel:${PHONE}`}
              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors">
              <Phone className="w-3 h-3" /> Call
            </a>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
              className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors">
              <ExternalLink className="w-3 h-3" /> WhatsApp
            </a>
          </div>
        </motion.div>

        <p className="text-center text-slate-400 text-xs mt-6">
          SAI RoloTech Used Machine Marketplace · Launching Soon &nbsp;·&nbsp; Trusted by Industry Professionals
        </p>
      </div>

      {/* Inquiry Modal */}
      <AnimatePresence>
        {inquiryMachine && (
          <MachineInquiryModal
            machine={inquiryMachine}
            onClose={() => setInquiryMachine(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
