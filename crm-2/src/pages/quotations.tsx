import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard, SectionCard } from "@/components/shared";
import {
  FileText, Download, Search, IndianRupee, Bot, CheckCircle2,
  Clock, XCircle, Send, Eye, Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface Quotation {
  id: number;
  quotationNo: string;
  clientName: string;
  clientPhone: string;
  city: string;
  machine: string;
  amount: number;
  status: "draft" | "sent" | "accepted" | "rejected";
  generatedByAi: boolean;
  createdAt: string;
  validity: string;
}

const mockQuotations: Quotation[] = [
  { id: 1, quotationNo: "SAI-2026-0847", clientName: "Satpal Industries", clientPhone: "+91 98765 43210", city: "Rohtak", machine: "Shutter Patti Machine (Semi-Auto)", amount: 520000, status: "sent", generatedByAi: true, createdAt: "2026-03-20", validity: "2026-04-20" },
  { id: 2, quotationNo: "SAI-2026-0846", clientName: "Kumar Sheet Works", clientPhone: "+91 98712 34567", city: "Noida", machine: "False Ceiling Machine (Full-Auto)", amount: 650000, status: "accepted", generatedByAi: true, createdAt: "2026-03-18", validity: "2026-04-18" },
  { id: 3, quotationNo: "SAI-2026-0845", clientName: "Sharma Roofing Co", clientPhone: "+91 87654 12345", city: "Panipat", machine: "Z Purlin Roll Forming Machine", amount: 380000, status: "draft", generatedByAi: false, createdAt: "2026-03-17", validity: "2026-04-17" },
  { id: 4, quotationNo: "SAI-2026-0844", clientName: "Delhi Sheet Metal", clientPhone: "+91 76543 21098", city: "New Delhi", machine: "Aluminium Profile Machine", amount: 720000, status: "sent", generatedByAi: true, createdAt: "2026-03-16", validity: "2026-04-16" },
  { id: 5, quotationNo: "SAI-2026-0843", clientName: "Rajesh Rooftech", clientPhone: "+91 99887 65432", city: "Jaipur", machine: "Shutter Patti Machine (Basic)", amount: 450000, status: "accepted", generatedByAi: true, createdAt: "2026-03-15", validity: "2026-04-15" },
  { id: 6, quotationNo: "SAI-2026-0842", clientName: "Ludhiana Fabricators", clientPhone: "+91 98001 23456", city: "Ludhiana", machine: "C Purlin Machine", amount: 420000, status: "rejected", generatedByAi: false, createdAt: "2026-03-14", validity: "2026-04-14" },
  { id: 7, quotationNo: "SAI-2026-0841", clientName: "Meerut Steel Works", clientPhone: "+91 97654 32109", city: "Meerut", machine: "False Ceiling Machine (Semi-Auto)", amount: 490000, status: "sent", generatedByAi: true, createdAt: "2026-03-13", validity: "2026-04-13" },
  { id: 8, quotationNo: "SAI-2026-0840", clientName: "Haryana Profiles", clientPhone: "+91 95432 10987", city: "Faridabad", machine: "Shutter Patti Machine (Full-Auto)", amount: 580000, status: "draft", generatedByAi: false, createdAt: "2026-03-12", validity: "2026-04-12" },
];

const statusConfig: Record<string, { color: string; icon: typeof FileText; label: string }> = {
  draft:    { color: "bg-slate-100 text-slate-600 border-slate-200",    icon: Clock,         label: "Draft" },
  sent:     { color: "bg-blue-50 text-blue-600 border-blue-200",        icon: Send,          label: "Sent" },
  accepted: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Accepted" },
  rejected: { color: "bg-red-50 text-red-600 border-red-200",           icon: XCircle,       label: "Rejected" },
};

export default function QuotationLogsPage() {
  const [search, setSearch]   = useState("");
  const [statusF, setStatusF] = useState("all");

  const filtered = mockQuotations.filter(q => {
    const ok = q.clientName.toLowerCase().includes(search.toLowerCase()) ||
               q.quotationNo.toLowerCase().includes(search.toLowerCase()) ||
               q.machine.toLowerCase().includes(search.toLowerCase()) ||
               q.city.toLowerCase().includes(search.toLowerCase());
    const okS = statusF === "all" || q.status === statusF;
    return ok && okS;
  });

  const totalValue    = mockQuotations.reduce((a, q) => a + q.amount, 0);
  const acceptedValue = mockQuotations.filter(q => q.status === "accepted").reduce((a, q) => a + q.amount, 0);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader title="AI Quotation Logs" subtitle="Track all quotations generated for Roll Forming Machine enquiries" />

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard label="Total Quotes"  value={mockQuotations.length}                              icon={FileText}     iconBg="bg-blue-50"    iconColor="text-blue-500" />
        <StatsCard label="AI Generated" value={mockQuotations.filter(q => q.generatedByAi).length} icon={Bot}          iconBg="bg-violet-50"  iconColor="text-purple-500" />
        <StatsCard label="Accepted"     value={mockQuotations.filter(q => q.status === "accepted").length} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <StatsCard label="Won Value"    value={`₹${(acceptedValue/100000).toFixed(1)}L`}            icon={IndianRupee}  iconBg="bg-amber-50"   iconColor="text-amber-500" />
      </motion.div>

      {/* Search + Filter */}
      <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by client, machine, city..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {["all", "draft", "sent", "accepted", "rejected"].map(s => (
            <button key={s} onClick={() => setStatusF(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${statusF === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Quotation Cards */}
      <div className="space-y-3">
        {filtered.map(q => {
          const StatusIcon = statusConfig[q.status].icon;
          return (
            <motion.div key={q.id} variants={staggerItem}
              className="glass-card rounded-2xl p-4 border border-border hover:border-primary/30 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-foreground">{q.quotationNo}</span>
                      {q.generatedByAi && <span title="AI Generated" className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-full flex items-center gap-0.5"><Bot className="w-2.5 h-2.5" />AI</span>}
                      <Badge className={`text-xs ${statusConfig[q.status].color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[q.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground mt-0.5">{q.clientName}</p>
                    <p className="text-xs text-muted-foreground">{q.machine} · {q.city}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">₹{(q.amount/100000).toFixed(1)}L</p>
                    <p className="text-xs text-muted-foreground">Valid till {new Date(q.validity).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toast({ title: `Viewing ${q.quotationNo}` })}
                      className="p-2 rounded-xl border border-border hover:bg-muted transition-colors" aria-label="View quotation">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => toast({ title: "Downloading...", description: q.quotationNo })}
                      className="p-2 rounded-xl border border-border hover:bg-muted transition-colors" aria-label="Download PDF">
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {q.status === "draft" && (
                      <button onClick={() => toast({ title: "Sent to client!", description: `${q.clientName} — ${q.clientPhone}` })}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1">
                        <Send className="w-3.5 h-3.5" /> Send
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No quotations found</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <SectionCard title="Quotation Summary">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {["draft", "sent", "accepted", "rejected"].map(s => {
            const count = mockQuotations.filter(q => q.status === s).length;
            const val   = mockQuotations.filter(q => q.status === s).reduce((a, q) => a + q.amount, 0);
            const Ic = statusConfig[s].icon;
            return (
              <div key={s} className={`rounded-xl p-4 border ${statusConfig[s].color}`}>
                <Ic className="w-5 h-5 mb-2 opacity-70" />
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs font-medium capitalize">{s}</p>
                <p className="text-xs mt-1 opacity-70">₹{(val/100000).toFixed(1)}L</p>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </motion.div>
  );
}
