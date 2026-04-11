import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard, SectionCard } from "@/components/shared";
import {
  FileText,
  Search,
  IndianRupee,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  X,
  MessageSquare,
  Phone,
  AlertTriangle,
  Download,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { quotations as quotationService } from "@/lib/dataService";
import type { QuotationRequest } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

interface QuotationView {
  id: number;
  quotationNo: string;
  clientName: string;
  clientPhone: string;
  city: string;
  machine: string;
  amount: number;
  status: QuoteStatus;
  createdAt: string;
  validity: string;
}

const statusConfig: Record<QuoteStatus, { color: string; icon: typeof FileText; label: string }> = {
  draft: { color: "bg-slate-100 text-slate-600 border-slate-200", icon: Clock, label: "Draft" },
  sent: { color: "bg-blue-50 text-blue-600 border-blue-200", icon: Send, label: "Sent" },
  accepted: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Accepted" },
  rejected: { color: "bg-red-50 text-red-600 border-red-200", icon: XCircle, label: "Rejected" },
};

function parseAmount(value: string | null) {
  if (!value) return 0;
  return parseFloat(String(value).replace(/[^\d.]/g, "")) || 0;
}

function addDays(dateString: string, days: number) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function mapQuotation(row: QuotationRequest): QuotationView {
  const safeStatus = (["draft", "sent", "accepted", "rejected"].includes(row.status) ? row.status : "draft") as QuoteStatus;
  return {
    id: row.id,
    quotationNo: `QT-${String(row.id).padStart(5, "0")}`,
    clientName: row.customer_name || "Unknown Customer",
    clientPhone: row.customer_phone || "No phone",
    city: row.customer_city || "Unknown city",
    machine: row.machine_name || "General Machine",
    amount: parseAmount(row.quoted_price),
    status: safeStatus,
    createdAt: row.created_at,
    validity: addDays(row.created_at, 30),
  };
}

export default function QuotationLogsLivePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | QuoteStatus>("all");
  const [quotations, setQuotations] = useState<QuotationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuotationView | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadQuotations = async (showToast = false) => {
    try {
      showToast ? setRefreshing(true) : setLoading(true);
      const rows = await quotationService.getAll();
      const mapped = rows.map(mapQuotation);
      setQuotations(mapped);
      if (showToast) {
        toast({ title: "Quotation logs refreshed", description: `${mapped.length} live quotations loaded` });
      }
    } catch {
      setQuotations([]);
      if (showToast) {
        toast({ title: "Quotation load failed", description: "quotation_requests table check karein", variant: "destructive" });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const filtered = useMemo(() => {
    return quotations.filter((quotation) => {
      const matchesSearch =
        quotation.clientName.toLowerCase().includes(search.toLowerCase()) ||
        quotation.quotationNo.toLowerCase().includes(search.toLowerCase()) ||
        quotation.machine.toLowerCase().includes(search.toLowerCase()) ||
        quotation.city.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || quotation.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, search, statusFilter]);

  const totalValue = quotations.reduce((sum, quotation) => sum + quotation.amount, 0);
  const acceptedValue = quotations.filter((quotation) => quotation.status === "accepted").reduce((sum, quotation) => sum + quotation.amount, 0);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader
        title="Quotation Logs"
        subtitle="Live quotation records from CRM"
        actions={(
          <button
            onClick={() => loadQuotations(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        )}
      />

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard label="Total Quotes" value={quotations.length} icon={FileText} iconBg="bg-blue-50" iconColor="text-blue-500" />
        <StatsCard label="Accepted" value={quotations.filter((quotation) => quotation.status === "accepted").length} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <StatsCard label="Drafts" value={quotations.filter((quotation) => quotation.status === "draft").length} icon={Clock} iconBg="bg-slate-50" iconColor="text-slate-500" />
        <StatsCard label="Won Value" value={`₹${(acceptedValue / 100000).toFixed(1)}L`} icon={IndianRupee} iconBg="bg-amber-50" iconColor="text-amber-500" />
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by client, machine, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {(["all", "draft", "sent", "accepted", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${statusFilter === status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading live quotations...
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((quotation) => {
            const StatusIcon = statusConfig[quotation.status].icon;
            const daysLeft = Math.ceil((new Date(quotation.validity).getTime() - Date.now()) / 86400000);
            const isExpiringSoon = daysLeft <= 3 && daysLeft > 0 && quotation.status !== "accepted" && quotation.status !== "rejected";
            const isExpired = daysLeft <= 0 && quotation.status !== "accepted" && quotation.status !== "rejected";
            return (
              <motion.div key={quotation.id} variants={staggerItem} className="glass-card rounded-2xl p-4 border border-border hover:border-primary/30 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-foreground">{quotation.quotationNo}</span>
                        <Badge className={`text-xs ${statusConfig[quotation.status].color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[quotation.status].label}
                        </Badge>
                        {isExpired && <Badge className="text-xs bg-red-50 text-red-600 border-red-200"><AlertTriangle className="w-3 h-3 mr-0.5" /> Expired</Badge>}
                        {isExpiringSoon && <Badge className="text-xs bg-amber-50 text-amber-700 border-amber-200 animate-pulse"><AlertTriangle className="w-3 h-3 mr-0.5" /> {daysLeft}d left</Badge>}
                      </div>
                      <p className="text-sm font-medium text-foreground mt-0.5">{quotation.clientName}</p>
                      <p className="text-xs text-muted-foreground">{quotation.machine} · {quotation.city}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">₹{(quotation.amount / 100000).toFixed(1)}L</p>
                      <p className="text-xs text-muted-foreground">
                        Valid till {new Date(quotation.validity).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedQuote(quotation)}
                        className="p-2 rounded-xl border border-border hover:bg-muted transition-colors"
                        aria-label="View quotation"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No live quotations found</p>
            </div>
          )}
        </div>
      )}

      <SectionCard title="Quotation Summary">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["draft", "sent", "accepted", "rejected"] as QuoteStatus[]).map((status) => {
            const count = quotations.filter((quotation) => quotation.status === status).length;
            const value = quotations.filter((quotation) => quotation.status === status).reduce((sum, quotation) => sum + quotation.amount, 0);
            const Icon = statusConfig[status].icon;
            return (
              <div key={status} className={`rounded-xl p-4 border ${statusConfig[status].color}`}>
                <Icon className="w-5 h-5 mb-2 opacity-70" />
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs font-medium capitalize">{status}</p>
                <p className="text-xs mt-1 opacity-70">₹{(value / 100000).toFixed(1)}L</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Total quotation book value: ₹{(totalValue / 100000).toFixed(1)}L
        </div>
      </SectionCard>

      {/* Quotation Detail Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedQuote(null)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-80">Quotation Detail</p>
                  <h2 className="text-base font-bold">{selectedQuote.quotationNo}</h2>
                </div>
                <button onClick={() => setSelectedQuote(null)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Status badge + expiry warning */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${statusConfig[selectedQuote.status].color} border`}>
                  {statusConfig[selectedQuote.status].label}
                </Badge>
                {(() => {
                  const daysLeft = Math.ceil((new Date(selectedQuote.validity).getTime() - Date.now()) / 86400000);
                  if (daysLeft <= 0) return <Badge className="bg-red-50 text-red-600 border-red-200">⚠️ Expired</Badge>;
                  if (daysLeft <= 3) return <Badge className="bg-amber-50 text-amber-700 border-amber-200">⚠️ Expires in {daysLeft}d</Badge>;
                  return <Badge className="bg-green-50 text-green-700 border-green-200">{daysLeft} days valid</Badge>;
                })()}
              </div>

              {/* Client info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">{selectedQuote.clientName}</p>
                  <p className="text-sm font-bold text-primary">₹{(selectedQuote.amount / 100000).toFixed(2)}L</p>
                </div>
                {selectedQuote.city && <p className="text-xs text-muted-foreground">{selectedQuote.city}</p>}
                {selectedQuote.machine && <p className="text-xs text-muted-foreground">Machine: {selectedQuote.machine}</p>}
                <p className="text-xs text-muted-foreground">Created: {new Date(selectedQuote.createdAt).toLocaleDateString("en-IN")}</p>
                <p className="text-xs text-muted-foreground">Valid till: {new Date(selectedQuote.validity).toLocaleDateString("en-IN")}</p>
              </div>

              {/* Quick contact */}
              {selectedQuote.clientPhone && (
                <div className="flex gap-2">
                  <a href={`tel:${selectedQuote.clientPhone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                  <button
                    onClick={() => {
                      const msg = encodeURIComponent(`Namaste ${selectedQuote.clientName}! SAI RoloTech se bol rahe hain. Aapka quotation ${selectedQuote.quotationNo} ke baare mein baat karni thi.`);
                      window.open(`https://wa.me/${selectedQuote.clientPhone.replace(/\D/g, "")}?text=${msg}`, "_blank");
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                </div>
              )}

              {/* Status quick actions */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {(["draft", "sent", "accepted", "rejected"] as QuoteStatus[]).map(s => (
                    <button key={s}
                      onClick={async () => {
                        if (s === selectedQuote.status) return;
                        setUpdatingStatus(true);
                        try {
                          await quotationService.update(selectedQuote.id, { status: s });
                          setQuotations(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, status: s } : q));
                          setSelectedQuote(q => q ? { ...q, status: s } : null);
                          toast({ title: `Status updated to ${s}` });
                        } catch { toast({ title: "Update failed", variant: "destructive" }); }
                        finally { setUpdatingStatus(false); }
                      }}
                      disabled={updatingStatus}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedQuote.status === s
                        ? `${statusConfig[s].color} border-current`
                        : "bg-white border-border hover:border-primary/30 text-muted-foreground hover:text-foreground"
                      }`}>
                      {statusConfig[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open in Quotation Maker */}
              <a href="/quotation-maker"
                className="flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Open in Quotation Maker
              </a>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
