import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supplierMachines as supplierService } from "@/lib/dataService";
import { supabase } from "@/lib/supabase";
import {
  Building2, Search, Plus, MapPin, Phone, Mail, Pencil, X, Star,
  BarChart3, Grid3X3, List, Filter, ChevronDown, ChevronRight,
  Globe, IndianRupee, TrendingUp, Users, Package, Eye,
  MessageSquare, Send, Award, Loader2, Shield, Cpu, ArrowUpDown, Zap
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

interface Supplier {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  useOwnApiKey: boolean;
  isActive: boolean;
  userId: number | null;
  createdAt: string;
}

interface SupplierFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  address: string;
}

const emptyForm: SupplierFormData = { name: "", company: "", email: "", phone: "", city: "", state: "", address: "" };

const CHART_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4", "#ef4444", "#ec4899"];

const STATES_OF_INDIA = [
  "Maharashtra", "Gujarat", "Tamil Nadu", "Karnataka", "Delhi", "Telangana",
  "Rajasthan", "Uttar Pradesh", "Madhya Pradesh", "Punjab", "Haryana", "West Bengal"
];

export default function SupplierManagementPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("All");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"suppliers" | "analytics" | "add">("suppliers");
  const [formMode, setFormMode] = useState<"closed" | "add" | "edit">("closed");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(emptyForm);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "city" | "date">("name");

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const data = await supplierService.getAll();
        const mapped = data.map(s => ({
          id: s.id,
          name: s.supplier_name,
          company: s.machine_name || s.category || null,
          email: (s.contact_info as any)?.email || null,
          phone: (s.contact_info as any)?.phone || null,
          address: (s.contact_info as any)?.address || null,
          city: (s.contact_info as any)?.city || null,
          state: (s.contact_info as any)?.state || null,
          country: "India",
          useOwnApiKey: false,
          isActive: true,
          userId: null,
          createdAt: s.created_at,
        }));
        setSuppliers(mapped);
      } catch {
        setSuppliers([]);
      }
      setLoading(false);
    }
    loadSuppliers();
  }, []);

  const states = ["All", ...new Set(suppliers.map((s) => s.state).filter(Boolean))];

  const filtered = suppliers.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.company || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(search.toLowerCase());
    const matchState = filterState === "All" || s.state === filterState;
    const matchStatus = filterStatus === "all" || (filterStatus === "active" ? s.isActive : !s.isActive);
    return matchSearch && matchState && matchStatus;
  }).sort((a, b) => {
    if (sortBy === "city") return (a.city || "").localeCompare(b.city || "");
    if (sortBy === "date") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    return a.name.localeCompare(b.name);
  });

  const activeSuppliers = suppliers.filter((s) => s.isActive).length;
  const withApiKey = suppliers.filter((s) => s.useOwnApiKey).length;
  const uniqueStates = new Set(suppliers.map((s) => s.state).filter(Boolean)).size;
  const uniqueCities = new Set(suppliers.map((s) => s.city).filter(Boolean)).size;

  const stateData = [...new Set(suppliers.map((s) => s.state).filter(Boolean))].map((st) => ({
    name: st,
    count: suppliers.filter((s) => s.state === st).length,
  })).sort((a, b) => b.count - a.count);

  const cityData = [...new Set(suppliers.map((s) => s.city).filter(Boolean))].map((c) => ({
    name: c,
    count: suppliers.filter((s) => s.city === c).length,
  })).sort((a, b) => b.count - a.count).slice(0, 8);

  const radarData = [
    { metric: "Active Rate", value: suppliers.length > 0 ? (activeSuppliers / suppliers.length) * 100 : 0 },
    { metric: "API Coverage", value: suppliers.length > 0 ? (withApiKey / suppliers.length) * 100 : 0 },
    { metric: "Geo Spread", value: Math.min(uniqueStates * 15, 100) },
    { metric: "City Coverage", value: Math.min(uniqueCities * 12, 100) },
    { metric: "Network Size", value: Math.min(suppliers.length * 10, 100) },
    { metric: "Reliability", value: 85 },
  ];

  const openAddForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setFormMode("add");
    setActiveTab("add");
  };

  const openEditForm = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      company: supplier.company || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      city: supplier.city || "",
      state: supplier.state || "",
      address: supplier.address || "",
    });
    setEditingId(supplier.id);
    setFormMode("edit");
    setActiveTab("add");
  };

  const closeForm = () => {
    setFormMode("closed");
    setEditingId(null);
    setFormData(emptyForm);
    setActiveTab("suppliers");
  };

  const handleSave = () => {
    if (!formData.name || !formData.company) return;
    if (formMode === "add") {
      const newSupplier: Supplier = {
        id: Math.max(0, ...suppliers.map((s) => s.id)) + 1,
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: "India",
        useOwnApiKey: false,
        isActive: true,
        userId: null,
        createdAt: new Date().toISOString(),
      };
      setSuppliers((prev) => [...prev, newSupplier]);
    } else if (formMode === "edit" && editingId !== null) {
      setSuppliers((prev) => prev.map((s) => s.id === editingId ? {
        ...s, name: formData.name, company: formData.company, email: formData.email,
        phone: formData.phone, city: formData.city, state: formData.state, address: formData.address,
      } : s));
    }
    closeForm();
  };

  const updateField = (field: keyof SupplierFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader title="Supplier Management" subtitle="Pro-level supplier network management with analytics" />

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatsCard label="Total Suppliers" value={suppliers.length} icon={Building2} iconBg="bg-purple-500/10" iconColor="text-purple-500" />
        <StatsCard label="Active" value={activeSuppliers} icon={Shield} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatsCard label="With API Key" value={withApiKey} icon={Zap} iconBg="bg-amber-500/10" iconColor="text-amber-500" />
        <StatsCard label="States" value={uniqueStates} icon={MapPin} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
        <StatsCard label="Cities" value={uniqueCities} icon={Globe} iconBg="bg-cyan-500/10" iconColor="text-cyan-500" />
        <StatsCard label="Inactive" value={suppliers.length - activeSuppliers} icon={Users} iconBg="bg-red-500/10" iconColor="text-red-500" />
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-wrap gap-2">
        {[
          { key: "suppliers", label: "Supplier List", icon: Grid3X3 },
          { key: "analytics", label: "Analytics", icon: BarChart3 },
          { key: "add", label: formMode === "edit" ? "Edit Supplier" : "Add Supplier", icon: Plus },
        ].map((tab) => (
          <button key={tab.key} onClick={() => { if (tab.key === "add") openAddForm(); else setActiveTab(tab.key as any); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key ? "bg-primary text-primary-foreground shadow-lg" : "bg-card hover:bg-muted text-muted-foreground border border-border"
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </motion.div>

      {activeTab === "suppliers" && (
        <motion.div variants={staggerItem} className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search suppliers, companies, cities..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border text-sm hover:bg-muted transition-colors">
              <Filter className="w-4 h-4" /> Filters
            </button>
            <div className="flex items-center bg-card border border-border rounded-xl overflow-hidden">
              <button onClick={() => setViewMode("grid")}
                className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("list")}
                className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="glass-card rounded-xl p-4 flex flex-wrap gap-3">
              <select value={filterState} onChange={(e) => setFilterState(e.target.value)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                {states.map((s) => <option key={s} value={s as string}>{s as string}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                <option value="name">Sort by Name</option>
                <option value="city">Sort by City</option>
                <option value="date">Sort by Date</option>
              </select>
            </div>
          )}

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s) => (
                <div key={s.id} className="glass-card rounded-xl overflow-hidden hover:border-primary/30 transition-all group">
                  <div className={`h-2 ${s.isActive ? "bg-gradient-to-r from-purple-500 to-blue-500" : "bg-gray-500"}`} />
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                          {s.name.charAt(0)}{(s.name.split(" ")[1] || "").charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{s.name}</h3>
                          <p className="text-xs text-muted-foreground">{s.company || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge className={s.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-500/10 text-gray-400"}>
                          {s.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {s.useOwnApiKey && <Badge className="bg-amber-500/10 text-amber-500">API</Badge>}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {s.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-blue-400" />{s.email}</p>}
                      {s.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-green-400" />{s.phone}</p>}
                      {(s.city || s.state) && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-red-400" />{s.city}{s.state ? `, ${s.state}` : ""}</p>}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      {s.phone && (
                        <a href={`tel:${s.phone}`} className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {s.phone && (
                        <a href={`https://wa.me/${s.phone?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {s.email && (
                        <a href={`mailto:${s.email}`} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors">
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <div className="flex-1" />
                      <button onClick={() => openEditForm(s)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setSelectedSupplier(selectedSupplier?.id === s.id ? null : s)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {selectedSupplier?.id === s.id && (
                      <div className="p-3 bg-card/50 rounded-lg text-xs space-y-1 border border-border">
                        <p><span className="text-muted-foreground">Address:</span> <span className="text-foreground">{s.address || "—"}</span></p>
                        <p><span className="text-muted-foreground">Country:</span> <span className="text-foreground">{s.country || "India"}</span></p>
                        <p><span className="text-muted-foreground">Own API Key:</span> <span className="text-foreground">{s.useOwnApiKey ? "Yes" : "No"}</span></p>
                        <p><span className="text-muted-foreground">Added:</span> <span className="text-foreground">{new Date(s.createdAt).toLocaleDateString("en-IN")}</span></p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <div key={s.id} className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {s.name.charAt(0)}{(s.name.split(" ")[1] || "").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.company || "—"}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                    {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>}
                    {s.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.city}</span>}
                  </div>
                  <Badge className={s.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-500/10 text-gray-400"}>
                    {s.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <div className="flex gap-1 flex-shrink-0">
                    {s.phone && (
                      <a href={`https://wa.me/${s.phone?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button onClick={() => openEditForm(s)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="glass-card rounded-xl p-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No Suppliers Found</h3>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting filters or add a new supplier</p>
              <Button onClick={openAddForm} className="gap-2"><Plus className="w-4 h-4" /> Add Supplier</Button>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "analytics" && (
        <motion.div variants={staggerItem} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-5">
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" /> Suppliers by State
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card rounded-xl p-5">
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-500" /> City Distribution
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={cityData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="count"
                    label={({ name, value }) => `${name}: ${value}`}>
                    {cityData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card rounded-xl p-5 lg:col-span-2">
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Supplier Network Health
              </h4>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Radar name="Score" dataKey="value" stroke="#8b5cf6" fill="rgba(139,92,246,0.2)" strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="glass-card rounded-xl p-4 text-center">
              <TrendingUp className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">{suppliers.length > 0 ? ((activeSuppliers / suppliers.length) * 100).toFixed(0) : 0}%</p>
              <p className="text-xs text-muted-foreground">Active Rate</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <Zap className="w-7 h-7 text-amber-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">{suppliers.length > 0 ? ((withApiKey / suppliers.length) * 100).toFixed(0) : 0}%</p>
              <p className="text-xs text-muted-foreground">API Integration</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <MapPin className="w-7 h-7 text-blue-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">{uniqueStates}</p>
              <p className="text-xs text-muted-foreground">State Coverage</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <Star className="w-7 h-7 text-purple-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">A+</p>
              <p className="text-xs text-muted-foreground">Network Grade</p>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "add" && (
        <motion.div variants={staggerItem} className="glass-card rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {formMode === "edit" ? <Pencil className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {formMode === "edit" ? "Edit Supplier" : "Add New Supplier"}
            </h3>
            <button onClick={closeForm} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name *</label>
              <input type="text" placeholder="Full name" value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Company *</label>
              <input type="text" placeholder="Company name" value={formData.company}
                onChange={(e) => updateField("company", e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <input type="email" placeholder="email@company.in" value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone</label>
              <input type="tel" placeholder="+91 XXXXX XXXXX" value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">City</label>
              <input type="text" placeholder="City" value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">State</label>
              <select value={formData.state} onChange={(e) => updateField("state", e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground">
                <option value="">Select State</option>
                {STATES_OF_INDIA.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Address</label>
            <input type="text" placeholder="Full address" value={formData.address}
              onChange={(e) => updateField("address", e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={!formData.name || !formData.company} className="gap-2">
              <Send className="w-4 h-4" /> {formMode === "edit" ? "Update Supplier" : "Save Supplier"}
            </Button>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
