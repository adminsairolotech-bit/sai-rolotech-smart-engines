/**
 * SAI RoloTech — Product Manager
 * Admin apne mobile se product add, photo click karo, visitor view dekho
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader } from "@/components/shared";
import {
  Plus, Camera, Trash2, Edit3, Eye, EyeOff, Save, X,
  Package, Star, Tag, IndianRupee, Clock, Info, Image as ImageIcon,
  Video, RefreshCw, CheckCircle2, AlertTriangle, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, Upload, Smartphone, Play, ShoppingCart,
  BadgeCheck, Layers, Zap, Bot, Send, Sparkles, MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

/* ── Types ────────────────────────────────────────────── */
interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  photos: string[];
  videoUrl: string;
  specs: string;
  leadTime: string;
  available: boolean;
  featured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ["Shutter Plant", "False Ceiling", "Pipe Mill", "Purlin Machine", "Stud Track", "Custom"];

function fmtINR(n: number) {
  if (!n) return "Price on request";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} Lac`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/* ── YouTube embed helper ─────────────────────────────── */
function getYTId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([^?&\s]+)/);
  return m ? m[1] : null;
}

/* ══════════════════════════════════════════════════════ */
/*  VISITOR VIEW — how customers see the products         */
/* ══════════════════════════════════════════════════════ */
function VisitorProductCard({ product }: { product: Product }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [showSpec, setShowSpec] = useState(false);
  const ytId = product.videoUrl ? getYTId(product.videoUrl) : null;

  return (
    <motion.div layout className="glass-card rounded-2xl border border-border overflow-hidden">
      {/* Photo / Video Carousel */}
      <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 aspect-video">
        {product.photos.length > 0 ? (
          <>
            <img
              src={product.photos[imgIdx]}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).src = ""; }}
            />
            {product.photos.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {product.photos.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? "bg-white scale-125" : "bg-white/50"}`} />
                ))}
              </div>
            )}
          </>
        ) : ytId ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
            title={product.name}
            allow="accelerometer; autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40">
            <Package className="w-12 h-12 mb-2" />
            <p className="text-sm">No photo yet</p>
          </div>
        )}
        {product.featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            <Star className="w-3 h-3" /> Featured
          </div>
        )}
        {!product.available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full">Not Available</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Category + Name */}
        <div>
          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 mb-1">{product.category}</Badge>
          <h3 className="text-base font-bold text-foreground leading-tight">{product.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">{product.description}</p>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground">Starting from</p>
            <p className="text-xl font-bold text-primary flex items-center gap-1">
              <IndianRupee className="w-4 h-4" />{fmtINR(product.price).replace("₹", "")}
            </p>
          </div>
          {product.leadTime && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Lead Time</p>
              <p className="text-xs font-semibold text-foreground flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3 text-amber-500" /> {product.leadTime}
              </p>
            </div>
          )}
        </div>

        {/* Specs toggle */}
        {product.specs && (
          <button onClick={() => setShowSpec(v => !v)}
            className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground border-t border-border pt-2 transition-colors">
            <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Technical Specs</span>
            {showSpec ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
        <AnimatePresence>
          {showSpec && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
                {product.specs}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <button className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
          <ShoppingCart className="w-4 h-4" /> Get Quote — {product.name.split(" ").slice(0, 2).join(" ")}
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  ADMIN PRODUCT CARD                                     */
/* ══════════════════════════════════════════════════════ */
function AdminProductCard({ product, onEdit, onDelete, onUploadPhoto, onDeletePhoto, uploading }:
  { product: Product; onEdit: (p: Product) => void; onDelete: (id: string) => void;
    onUploadPhoto: (id: string, files: FileList) => void; onDeletePhoto: (id: string, url: string) => void;
    uploading: string | null; }) {

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div layout className="glass-card rounded-2xl border border-border overflow-hidden">
      {/* Photos row */}
      <div className="p-3 bg-muted/20 border-b border-border">
        <div className="flex items-center gap-2 flex-wrap">
          {product.photos.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt="" className="w-16 h-16 object-cover rounded-xl border border-border" />
              <button
                onClick={() => onDeletePhoto(product.id, url)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Upload Button — triggers camera on mobile */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading === product.id}
            className="w-16 h-16 rounded-xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center gap-1 text-primary/60 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-50">
            {uploading === product.id
              ? <RefreshCw className="w-5 h-5 animate-spin" />
              : <><Camera className="w-5 h-5" /><span className="text-[9px] font-semibold">Photo</span></>}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files?.length) { onUploadPhoto(product.id, e.target.files); e.target.value = ""; } }}
          />
        </div>

        {product.photos.length === 0 && (
          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <Smartphone className="w-3 h-3" /> Mobile pe Camera button dabao — seedha photo lo!
          </p>
        )}
      </div>

      {/* Product info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{product.category}</Badge>
              {product.featured && <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200"><Star className="w-2.5 h-2.5 mr-0.5" />Featured</Badge>}
              {!product.available && <Badge className="text-[10px] bg-red-100 text-red-600 border-red-200">Not Available</Badge>}
            </div>
            <p className="font-bold text-foreground text-sm leading-tight">{product.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{product.description}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span className="font-bold text-primary">{fmtINR(product.price)}</span>
              {product.leadTime && <span className="text-muted-foreground flex items-center gap-0.5"><Clock className="w-3 h-3" />{product.leadTime}</span>}
              <span className="text-muted-foreground">{product.photos.length} photo{product.photos.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button onClick={() => onEdit(product)}
              className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={() => { if (confirm(`"${product.name}" delete karein?`)) onDelete(product.id); }}
              className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  PRODUCT FORM (Add / Edit)                             */
/* ══════════════════════════════════════════════════════ */
interface ProductFormProps { initial?: Partial<Product>; onSave: (data: Partial<Product>) => void; onCancel: () => void; saving: boolean; }
function ProductForm({ initial, onSave, onCancel, saving }: ProductFormProps) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    category: initial?.category || CATEGORIES[0],
    description: initial?.description || "",
    price: String(initial?.price || ""),
    unit: initial?.unit || "Set",
    specs: initial?.specs || "",
    leadTime: initial?.leadTime || "",
    videoUrl: initial?.videoUrl || "",
    available: initial?.available !== false,
    featured: initial?.featured || false,
    tags: initial?.tags?.join(", ") || "",
  });

  function set(key: string, val: string | boolean) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function handleSave() {
    if (!form.name.trim()) { toast({ title: "Product name required", variant: "destructive" }); return; }
    onSave({
      ...form,
      price: parseFloat(form.price) || 0,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    });
  }

  const fieldCls = "w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl border border-primary/20 overflow-hidden">
      <div className="p-4 border-b border-border bg-primary/5 flex items-center justify-between">
        <h3 className="font-bold text-foreground text-sm">{initial?.id ? "Edit Product" : "New Product Add Karo"}</h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Machine/Product Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Shutter Patti Roll Forming Machine" className={fieldCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Category *</label>
            <select value={form.category} onChange={e => set("category", e.target.value)} className={fieldCls}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Price (₹)</label>
            <input value={form.price} onChange={e => set("price", e.target.value)} placeholder="350000" type="number" className={fieldCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Unit</label>
            <input value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="Set / Piece / Meter" className={fieldCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Lead Time</label>
            <input value={form.leadTime} onChange={e => set("leadTime", e.target.value)} placeholder="15-20 working days" className={fieldCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Customer ko kya batana hai?" className={`${fieldCls} min-h-[80px] resize-none`} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Technical Specs</label>
            <textarea value={form.specs} onChange={e => set("specs", e.target.value)} placeholder="Speed: 8-12 patti/min | Width: 75-115mm | Motor: 3HP" className={`${fieldCls} min-h-[60px] resize-none`} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">YouTube Video URL (optional)</label>
            <input value={form.videoUrl} onChange={e => set("videoUrl", e.target.value)} placeholder="https://youtube.com/watch?v=..." className={fieldCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags (comma separated)</label>
            <input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="shutter, patti, automatic" className={fieldCls} />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-4 flex-wrap pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => set("available", !form.available)}
              className={`w-10 h-5 rounded-full relative transition-colors ${form.available ? "bg-emerald-500" : "bg-muted"}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.available ? "left-5" : "left-0.5"}`} />
            </div>
            <span className="text-xs font-medium text-foreground">Available</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => set("featured", !form.featured)}
              className={`w-10 h-5 rounded-full relative transition-colors ${form.featured ? "bg-amber-500" : "bg-muted"}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.featured ? "left-5" : "left-0.5"}`} />
            </div>
            <span className="text-xs font-medium text-foreground">Featured</span>
          </label>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all">
            {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Product</>}
          </button>
          <button onClick={onCancel} className="px-4 py-2.5 bg-muted text-foreground font-semibold rounded-xl text-sm hover:bg-muted/80">
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  MAIN PAGE                                             */
/* ══════════════════════════════════════════════════════ */
export default function ProductManagerPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [viewMode, setViewMode]   = useState<"admin" | "visitor">("admin");
  const [editing, setEditing]     = useState<Product | null>(null);
  const [adding, setAdding]       = useState(false);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("All");
  const [searchQ, setSearchQ]     = useState("");

  /* ── AI Command state ── */
  const [aiOpen, setAiOpen]       = useState(false);
  const [aiCmd, setAiCmd]         = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<Array<{
    role: "user" | "model";
    text: string;
    action?: string;
    success?: boolean;
  }>>([]);
  const aiInputRef  = useRef<HTMLInputElement>(null);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  /* ── Fetch products ── */
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* Auto-refresh every 10s when in visitor mode */
  useEffect(() => {
    if (viewMode !== "visitor") return;
    const t = setInterval(fetchProducts, 10000);
    return () => clearInterval(t);
  }, [viewMode, fetchProducts]);

  /* ── Filtered products ── */
  const allCats = ["All", ...new Set(products.map(p => p.category))];
  const filtered = products.filter(p => {
    const matchCat = filterCat === "All" || p.category === filterCat;
    const q = searchQ.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  /* ── CRUD handlers ── */
  async function handleAdd(data: Partial<Product>) {
    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setProducts(prev => [...prev, json.product]);
        setAdding(false);
        toast({ title: "Product add ho gaya!" });
      } else { toast({ title: "Add failed", description: json.error, variant: "destructive" }); }
    } catch (e: unknown) { toast({ title: "Error", description: String(e instanceof Error ? e.message : e), variant: "destructive" }); }
    setSaving(false);
  }

  async function handleEdit(data: Partial<Product>) {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${editing.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setProducts(prev => prev.map(p => p.id === editing.id ? json.product : p));
        setEditing(null);
        toast({ title: "Product update ho gaya!" });
      } else { toast({ title: "Update failed", description: json.error, variant: "destructive" }); }
    } catch (e: unknown) { toast({ title: "Error", description: String(e instanceof Error ? e.message : e), variant: "destructive" }); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { setProducts(prev => prev.filter(p => p.id !== id)); toast({ title: "Product delete ho gaya" }); }
    } catch { toast({ title: "Delete failed", variant: "destructive" }); }
  }

  async function handleUploadPhoto(productId: string, files: FileList) {
    setUploading(productId);
    try {
      const form = new FormData();
      Array.from(files).forEach(f => form.append("photos", f));
      const res = await fetch(`/api/products/${productId}/photos`, { method: "POST", body: form });
      const json = await res.json();
      if (json.success) {
        setProducts(prev => prev.map(p => p.id === productId ? json.product : p));
        toast({ title: `${json.urls.length} photo(s) upload ho gaya!` });
      } else { toast({ title: "Upload failed", description: json.error, variant: "destructive" }); }
    } catch (e: unknown) { toast({ title: "Upload error", description: String(e instanceof Error ? e.message : e), variant: "destructive" }); }
    setUploading(null);
  }

  async function handleDeletePhoto(productId: string, url: string) {
    try {
      const res = await fetch(`/api/products/${productId}/photos`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (json.success) {
        setProducts(prev => prev.map(p => p.id === productId ? json.product : p));
        toast({ title: "Photo delete ho gaya" });
      }
    } catch { toast({ title: "Delete failed", variant: "destructive" }); }
  }

  /* ── AI Command handler ── */
  async function handleAiCommand() {
    const cmd = aiCmd.trim();
    if (!cmd || aiLoading) return;

    const userMsg = { role: "user" as const, text: cmd };
    setAiHistory(h => [...h, userMsg]);
    setAiCmd("");
    setAiLoading(true);

    // Build history for Gemini (exclude current user msg — sent separately)
    const historyForApi = aiHistory.map(h => ({ role: h.role, text: h.text }));

    try {
      const res = await fetch("/api/products/ai-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd, history: historyForApi }),
      });
      const json = await res.json();

      if (json.success) {
        // Update local product list immediately
        if (json.products) setProducts(json.products);

        const actionEmoji: Record<string, string> = {
          created: "✅ Product create ho gaya!",
          updated: "✏️ Product update ho gaya!",
          deleted: "🗑️ Product delete ho gaya!",
          none:    "💬",
        };
        const prefix = actionEmoji[json.executionResult] || "";
        const modelMsg = {
          role: "model" as const,
          text: `${prefix} ${json.message}`,
          action: json.executionResult,
          success: true,
        };
        setAiHistory(h => [...h, modelMsg]);

        if (json.executionResult !== "none") {
          toast({ title: `AI: ${json.message}` });
        }
      } else {
        setAiHistory(h => [...h, {
          role: "model" as const,
          text: `❌ ${json.error || "Kuch gadbad ho gayi"}`,
          action: "error",
          success: false,
        }]);
        toast({ title: json.error || "AI command failed", variant: "destructive" });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error";
      setAiHistory(h => [...h, { role: "model" as const, text: `❌ ${msg}`, action: "error", success: false }]);
    }

    setAiLoading(false);
    setTimeout(() => {
      aiScrollRef.current?.scrollTo({ top: aiScrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5 pb-10">
      <PageHeader
        title="Product Manager"
        subtitle="Products add karo, photos upload karo, visitor view dekho"
      />

      {/* ── View Mode Toggle ─────────────────────────────── */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-3 bg-white/80 border border-border rounded-2xl p-1.5 w-fit shadow-sm">
          <button
            onClick={() => setViewMode("admin")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${viewMode === "admin" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Edit3 className="w-4 h-4" /> Admin View
          </button>
          <button
            onClick={() => { setViewMode("visitor"); fetchProducts(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${viewMode === "visitor" ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Eye className="w-4 h-4" /> Visitor View
            {viewMode === "visitor" && <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />}
          </button>
        </div>

        {viewMode === "visitor" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-700">
            <Eye className="w-3.5 h-3.5 shrink-0" />
            Ye exact wahi view hai jo aapka customer dekhta hai — live preview auto-refreshes every 10 seconds
          </motion.div>
        )}
      </motion.div>

      {/* ── VISITOR VIEW ─────────────────────────────────── */}
      {viewMode === "visitor" && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          {/* Visitor header — just like customer sees it */}
          <div className="glass-card rounded-2xl border border-border p-5 text-center">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest">SAI RoloTech</p>
            <h2 className="text-xl font-bold text-foreground">Roll Forming Machines</h2>
            <p className="text-sm text-muted-foreground mt-1">Delhi/NCR ki trusted manufacturer — Plot No 575/1, Mundka Industrial Area</p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-emerald-500" /> ISI Certified</span>
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-500" /> Same-day Quote</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-500" /> 10+ Years</span>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {allCats.map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${filterCat === cat ? "bg-primary text-primary-foreground border-primary" : "bg-white border-border text-muted-foreground hover:text-foreground"}`}>
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-10 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading products...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Is category mein koi product nahi</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(p => <VisitorProductCard key={p.id} product={p} />)}
            </div>
          )}
        </motion.div>
      )}

      {/* ── ADMIN VIEW ───────────────────────────────────── */}
      {viewMode === "admin" && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          {/* Stats bar */}
          <motion.div variants={staggerItem} className="grid grid-cols-3 gap-3">
            {[
              { label: "Total",   value: products.length,                             color: "text-primary" },
              { label: "Available", value: products.filter(p => p.available).length,  color: "text-emerald-600" },
              { label: "Featured",  value: products.filter(p => p.featured).length,   color: "text-amber-600" },
            ].map(s => (
              <div key={s.label} className="glass-card rounded-2xl border border-border p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* ── AI Command Panel ──────────────────────────── */}
          <motion.div variants={staggerItem}>
            <button
              onClick={() => { setAiOpen(o => !o); setTimeout(() => aiInputRef.current?.focus(), 150); }}
              className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl px-4 py-3 hover:from-violet-100 hover:to-indigo-100 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-violet-900">AI Product Assistant</p>
                  <p className="text-[10px] text-violet-600">Bolke product add/delete/update karo • Gemini Powered</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {aiHistory.length > 0 && (
                  <span className="text-[10px] font-semibold bg-violet-200 text-violet-800 rounded-full px-2 py-0.5">
                    {aiHistory.filter(h => h.role === "user").length} commands
                  </span>
                )}
                <Sparkles className={`w-4 h-4 text-violet-500 transition-transform ${aiOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            <AnimatePresence>
              {aiOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 bg-white border border-violet-200 rounded-2xl shadow-lg overflow-hidden">
                    {/* Chat header */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600">
                      <Bot className="w-4 h-4 text-white" />
                      <span className="text-xs font-bold text-white">AI Product Manager</span>
                      <div className="ml-auto flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>

                    {/* Quick suggestion chips */}
                    {aiHistory.length === 0 && (
                      <div className="p-3 border-b border-violet-100">
                        <p className="text-[10px] text-violet-500 font-semibold mb-2 uppercase tracking-wider">Quick Commands</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "Saare products dikhao",
                            "Shutter Patti ka price 4 lac karo",
                            "Naya product add karo: Purlin Machine ₹2 lac",
                            "False Ceiling machine ki category change karo",
                            "Sabse expensive product delete karo",
                          ].map(s => (
                            <button key={s} onClick={() => { setAiCmd(s); aiInputRef.current?.focus(); }}
                              className="text-[10px] bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-full px-2.5 py-1 transition-colors">
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chat history */}
                    {aiHistory.length > 0 && (
                      <div ref={aiScrollRef} className="max-h-52 overflow-y-auto p-3 space-y-2.5">
                        {aiHistory.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                              msg.role === "user"
                                ? "bg-violet-600 text-white rounded-br-sm"
                                : msg.action === "error"
                                  ? "bg-red-50 text-red-800 border border-red-200 rounded-bl-sm"
                                  : msg.action === "created"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-bl-sm"
                                    : msg.action === "updated"
                                      ? "bg-blue-50 text-blue-800 border border-blue-200 rounded-bl-sm"
                                      : msg.action === "deleted"
                                        ? "bg-red-50 text-red-800 border border-red-200 rounded-bl-sm"
                                        : "bg-gray-50 text-gray-700 border border-gray-200 rounded-bl-sm"
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                        {aiLoading && (
                          <div className="flex justify-start">
                            <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Input bar */}
                    <div className="flex items-center gap-2 p-3 border-t border-violet-100 bg-violet-50/50">
                      <MessageSquare className="w-4 h-4 text-violet-400 shrink-0" />
                      <input
                        ref={aiInputRef}
                        value={aiCmd}
                        onChange={e => setAiCmd(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAiCommand()}
                        placeholder='Bolye... "Shutter machine ka price 3.5 lac karo"'
                        disabled={aiLoading}
                        className="flex-1 text-xs bg-white border border-violet-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50 placeholder:text-violet-300"
                      />
                      <button
                        onClick={handleAiCommand}
                        disabled={!aiCmd.trim() || aiLoading}
                        className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 flex items-center justify-center transition-all shrink-0"
                      >
                        {aiLoading
                          ? <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                          : <Send className="w-3.5 h-3.5 text-white" />
                        }
                      </button>
                    </div>

                    {/* Clear history */}
                    {aiHistory.length > 0 && (
                      <div className="px-3 pb-2 flex justify-end">
                        <button onClick={() => setAiHistory([])}
                          className="text-[10px] text-violet-400 hover:text-violet-600 transition-colors">
                          Clear history
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Search + Filter + Add */}
          <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-2">
            <input
              value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              {allCats.map(c => <option key={c}>{c}</option>)}
            </select>
            <button
              onClick={() => { setAdding(true); setEditing(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:bg-primary/90 transition-all shrink-0">
              <Plus className="w-4 h-4" /> Add Product
            </button>
            <button onClick={fetchProducts}
              className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </motion.div>

          {/* Mobile camera tip */}
          <motion.div variants={staggerItem} className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-blue-700">
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Mobile pe product card mein <strong>Camera</strong> button dabao → live photo lo → automatically upload ho jaata hai!</span>
          </motion.div>

          {/* Add form */}
          <AnimatePresence>
            {adding && !editing && (
              <motion.div variants={staggerItem} key="add-form">
                <ProductForm
                  onSave={handleAdd}
                  onCancel={() => setAdding(false)}
                  saving={saving}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product list */}
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card rounded-2xl border border-dashed border-border p-10 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm font-semibold text-muted-foreground">Koi product nahi mila</p>
              <button onClick={() => setAdding(true)} className="mt-3 text-sm text-primary font-semibold hover:underline">
                + Pehla product add karo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filtered.map(product => (
                  <motion.div key={product.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                    {editing?.id === product.id ? (
                      <ProductForm
                        initial={editing}
                        onSave={handleEdit}
                        onCancel={() => setEditing(null)}
                        saving={saving}
                      />
                    ) : (
                      <AdminProductCard
                        product={product}
                        onEdit={setEditing}
                        onDelete={handleDelete}
                        onUploadPhoto={handleUploadPhoto}
                        onDeletePhoto={handleDeletePhoto}
                        uploading={uploading}
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
