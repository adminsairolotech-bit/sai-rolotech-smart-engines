import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, SectionCard } from "@/components/shared";
import {
  Upload, FileText, CheckCircle2, AlertCircle, Download, Mail,
  RefreshCw, Unplug, ExternalLink, Loader2, Check, MailSearch,
  DownloadCloud, Filter, FileSpreadsheet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { leads as leadsService } from "@/lib/dataService";

const apiFetch = async <T = any>(url: string, opts: any = {}): Promise<T> => {
  const authUser = localStorage.getItem('sai_crm_auth_user');
  const token = authUser ? JSON.parse(authUser)?.token || 'sairolotech_admin_2025' : 'sairolotech_admin_2025';
  const res = await fetch(`/api${url}`, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: opts.body,
    signal: opts.timeout ? AbortSignal.timeout(opts.timeout) : undefined,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  if (data && data.success === false) throw new Error(data.error || 'Request failed');
  return data;
};
import { useToast } from "@/hooks/use-toast";

type TabKey = "csv" | "gmail" | "export";

interface GmailStatus {
  connected: boolean;
  email?: string;
  connectedAt?: string;
  lastSyncedAt?: string;
}

interface ParsedLead {
  id: string;
  source: "IndiaMart" | "JustDial" | "TradeIndia";
  name: string;
  phone: string;
  email: string;
  company: string;
  product: string;
  city: string;
  receivedAt: string;
  rawSubject: string;
  imported: boolean;
}

interface GmailHistoryEntry {
  id: string;
  syncedAt: string;
  source: "gmail";
  totalFetched: number;
  newLeads: number;
  imported: number;
  skipped: number;
}

const statusColors: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700",
  partial: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-600",
};

const sourceColors: Record<string, string> = {
  IndiaMart: "bg-blue-50 text-blue-600 border-blue-200",
  JustDial: "bg-amber-50 text-amber-700 border-amber-200",
  TradeIndia: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const csvTemplate = "Client Name,Email,Phone,Company,City,Machine Interest,Budget,Source\n";

interface CsvLead {
  name: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  machine_interest: string;
  budget: string;
  source: string;
  rowNum: number;
  error?: string;
  selected: boolean;
}

function CsvTab() {
  const [dragOver, setDragOver] = useState(false);
  const [parsedLeads, setParsedLeads] = useState<CsvLead[]>([]);
  const [rawFileName, setRawFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: number } | null>(null);
  const [selectedAll, setSelectedAll] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDownloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lead_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  function parseCSV(text: string): CsvLead[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""));
    const nameIdx = header.findIndex(h => h.includes("name") || h.includes("client"));
    const emailIdx = header.findIndex(h => h.includes("email"));
    const phoneIdx = header.findIndex(h => h.includes("phone") || h.includes("mobile") || h.includes("tel"));
    const companyIdx = header.findIndex(h => h.includes("company") || h.includes("firm"));
    const cityIdx = header.findIndex(h => h.includes("city") || h.includes("location") || h.includes("place"));
    const machineIdx = header.findIndex(h => h.includes("machine") || h.includes("product") || h.includes("interest"));
    const budgetIdx = header.findIndex(h => h.includes("budget") || h.includes("price") || h.includes("amount"));
    const sourceIdx = header.findIndex(h => h.includes("source"));

    const leads: CsvLead[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(",").map(v => v.trim().replace(/"/g, ""));

      const name = values[nameIdx] || "";
      const phone = values[phoneIdx]?.replace(/\D/g, "") || "";

      if (!name && !phone) continue; // skip empty rows

      const errors: string[] = [];
      if (!name) errors.push("Name missing");
      if (!phone || phone.length < 8) errors.push("Phone invalid");

      leads.push({
        name,
        email: values[emailIdx] || "",
        phone,
        company: values[companyIdx] || "",
        city: values[cityIdx] || "",
        machine_interest: values[machineIdx] || "",
        budget: values[budgetIdx] || "",
        source: values[sourceIdx] || "CSV Import",
        rowNum: i,
        error: errors.length > 0 ? errors.join(", ") : undefined,
        selected: true,
      });
    }
    return leads;
  }

  async function handleFile(file: File) {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      toast({ title: "Invalid file", description: "Sirf CSV files support hain", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB allowed hai", variant: "destructive" });
      return;
    }

    setRawFileName(file.name);
    try {
      const text = await file.text();
      const leads = parseCSV(text);
      if (leads.length === 0) {
        toast({ title: "No leads found", description: "CSV mein valid rows nahi mili. Template download karein.", variant: "destructive" });
        return;
      }
      setParsedLeads(leads);
      setImportResult(null);
      toast({ title: `${leads.length} leads parsed`, description: `${leads.filter(l => !l.error).length} valid, ${leads.filter(l => l.error).length} with errors` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Parse error";
      toast({ title: "CSV parse error", description: msg, variant: "destructive" });
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  }

  function toggleLead(idx: number) {
    setParsedLeads(prev => prev.map((l, i) => i === idx ? { ...l, selected: !l.selected } : l));
  }

  function toggleAll() {
    const allSelected = parsedLeads.every(l => l.selected);
    setParsedLeads(prev => prev.map(l => ({ ...l, selected: !allSelected })));
    setSelectedAll(!allSelected);
  }

  async function handleImport() {
    const selected = parsedLeads.filter(l => l.selected && !l.error);
    if (selected.length === 0) {
      toast({ title: "Koi valid lead nahi", description: "Select karein ya CSV check karein", variant: "destructive" });
      return;
    }

    setImporting(true);
    let imported = 0;
    let errors = 0;

    try {
      for (const lead of selected) {
        try {
          await leadsService.create({
            name: lead.name,
            phone: lead.phone,
            email: lead.email || null,
            city: lead.city || null,
            source: lead.source || "CSV Import",
            machine_interest: lead.machine_interest || null,
            budget: lead.budget || null,
            pipeline_stage: "new_lead",
            status: "New",
            quality: "medium",
          });
          imported++;
        } catch {
          errors++;
        }
      }
      setImportResult({ imported, errors });
      toast({ title: "Import complete!", description: `${imported} leads added to CRM${errors > 0 ? `, ${errors} errors` : ""}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed";
      toast({ title: "Import failed", description: msg, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  const selectedCount = parsedLeads.filter(l => l.selected && !l.error).length;
  const validCount = parsedLeads.filter(l => !l.error).length;
  const errorCount = parsedLeads.filter(l => l.error).length;

  return (
    <div className="space-y-6">
      <motion.div variants={staggerItem}
        className={`glass-card rounded-xl p-8 border-2 border-dashed transition-colors text-center ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}>
        <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileInputChange} />
        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Drop your CSV file here</h3>
        <p className="text-sm text-muted-foreground mb-4">or click to browse. Max 10MB. Template format: Client Name, Email, Phone, Company, City, Machine Interest, Budget, Source</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
            <FileText className="w-4 h-4" /> Browse Files
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownloadTemplate}>
            <Download className="w-4 h-4" /> Download Template
          </Button>
        </div>
        {rawFileName && (
          <p className="text-xs text-muted-foreground mt-3">📄 {rawFileName}</p>
        )}
      </motion.div>

      {parsedLeads.length > 0 && (
        <>
          {/* Stats */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">{validCount} Valid Leads</Badge>
            {errorCount > 0 && <Badge className="bg-red-50 text-red-600 border-red-200">{errorCount} Errors</Badge>}
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">{selectedCount} Selected</Badge>
            {importResult && (
              <Badge className="bg-green-50 text-green-700 border-green-200">
                ✓ {importResult.imported} imported{importResult.errors > 0 ? `, ${importResult.errors} errors` : ""}
              </Badge>
            )}
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2">
            <button onClick={toggleAll} className="flex items-center gap-2 text-xs text-primary hover:underline">
              {parsedLeads.every(l => l.selected) ? "Deselect All" : "Select All"}
            </button>
            <span className="text-xs text-muted-foreground">|</span>
            <button onClick={() => setParsedLeads(prev => prev.map(l => ({ ...l, selected: true })))}
              className="text-xs text-primary hover:underline">Select Valid Only</button>
            <span className="text-xs text-muted-foreground ml-auto">{parsedLeads.length} rows</span>
          </div>

          {/* Lead preview */}
          <SectionCard title={`Preview (${parsedLeads.length} rows)`}>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {parsedLeads.map((lead, idx) => (
                <div key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                    lead.selected && !lead.error
                      ? "border-blue-200 bg-blue-50/50"
                      : lead.error
                      ? "border-red-200 bg-red-50/30 opacity-60"
                      : "border-border hover:bg-muted/30"
                  }`}
                  onClick={() => !lead.error && toggleLead(idx)}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    lead.selected && !lead.error ? "bg-blue-600 border-blue-600" : "border-gray-300"
                  }`}>
                    {lead.selected && !lead.error && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{lead.name || "—"}</span>
                      {lead.phone && <span className="text-xs text-muted-foreground">📞 {lead.phone}</span>}
                      {lead.city && <span className="text-xs text-muted-foreground">📍 {lead.city}</span>}
                      {lead.source && <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {lead.email && <span>✉️ {lead.email}</span>}
                      {lead.machine_interest && <span>⚙️ {lead.machine_interest}</span>}
                      {lead.budget && <span>💰 {lead.budget}</span>}
                    </div>
                    {lead.error && (
                      <p className="text-[10px] text-red-500 mt-0.5">⚠️ {lead.error}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">Row {lead.rowNum}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Import button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleImport}
              disabled={importing || selectedCount === 0}
              className="gap-2"
              size="lg">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {importing ? `Importing ${selectedCount} leads...` : `Import ${selectedCount} Leads to CRM`}
            </Button>
            <Button variant="outline" onClick={() => { setParsedLeads([]); setImportResult(null); setRawFileName(""); }}
              className="gap-2">
              <RefreshCw className="w-4 h-4" /> Clear
            </Button>
          </div>
        </>
      )}

      <SectionCard title="CSV Format Guide">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Required columns: <strong>Client Name</strong> aur <strong>Phone</strong>. Baaki sab optional hain.</p>
          <div className="bg-muted/30 rounded-xl p-3">
            <p className="text-xs font-mono text-foreground mb-2">Header row:</p>
            <p className="text-[10px] font-mono text-muted-foreground">Client Name, Email, Phone, Company, City, Machine Interest, Budget, Source</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3">
            <p className="text-xs font-mono text-foreground mb-2">Example row:</p>
            <p className="text-[10px] font-mono text-muted-foreground">Rahul Kumar, rahul@example.com, 9876543210, ABC Industries, Delhi, Shutter Patti Machine, 500000, IndiaMART</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

interface GmailTabProps {
  onHistoryRefresh: () => void;
}

function GmailTab({ onHistoryRefresh }: GmailTabProps) {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [leads, setLeads] = useState<ParsedLead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentSyncedAt, setCurrentSyncedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiFetch<GmailStatus & { success: boolean }>("/admin/gmail/status", { showErrorToast: false });
      setStatus(data);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const data = await apiFetch<{ leads: ParsedLead[] }>("/admin/gmail/leads", { showErrorToast: false });
      setLeads(data.leads || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchLeads();

    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail") === "connected") {
      toast({ title: "Gmail Connected", description: `Connected as ${params.get("email") || "your account"}` });
      window.history.replaceState({}, "", window.location.pathname);
      fetchStatus();
    } else if (params.get("gmail") === "error") {
      toast({ title: "Connection Failed", description: params.get("message") || "Could not connect Gmail", variant: "destructive" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchStatus, fetchLeads, toast]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const data = await apiFetch<{ authUrl: string; message?: string }>("/admin/gmail/connect");
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast({ title: "Gmail Connected", description: data.message || "Gmail is connected via Replit integration" });
        await fetchStatus();
        await fetchLeads();
        setConnecting(false);
      }
    } catch {
      toast({ title: "Error", description: "Could not start Gmail connection", variant: "destructive" });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await apiFetch("/admin/gmail/disconnect", { method: "DELETE" });
      setStatus({ connected: false });
      setLeads([]);
      setSelectedIds(new Set());
      setCurrentSyncedAt("");
      toast({ title: "Disconnected", description: "Gmail account disconnected" });
      onHistoryRefresh();
    } catch {
      toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const data = await apiFetch<{ leads: ParsedLead[]; totalFetched: number; newLeads: number; syncedAt: string }>("/admin/gmail/sync", { method: "POST", timeout: 60000 });
      setLeads(data.leads || []);
      setCurrentSyncedAt(data.syncedAt || "");
      toast({ title: "Sync Complete", description: `Found ${data.newLeads} new leads from ${data.totalFetched} emails` });
      fetchStatus();
      onHistoryRefresh();
    } catch (err: any) {
      toast({ title: "Sync Failed", description: err?.message || "Could not sync emails", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return;
    setImporting(true);
    try {
      const data = await apiFetch<{ imported: number; skipped: number }>("/admin/gmail/import", {
        method: "POST",
        body: JSON.stringify({ leadIds: Array.from(selectedIds), syncedAt: currentSyncedAt }),
      });
      toast({ title: "Import Complete", description: `${data.imported} leads added to CRM, ${data.skipped} skipped (duplicates)` });
      setSelectedIds(new Set());
      fetchLeads();
      onHistoryRefresh();
    } catch {
      toast({ title: "Import Failed", description: "Could not import selected leads", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const importable = leads.filter((l) => !l.imported);
    if (selectedIds.size === importable.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(importable.map((l) => l.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <motion.div variants={staggerItem} className="glass-card rounded-xl p-8 text-center">
        <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Connect your Gmail</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          Connect your Gmail account to automatically pull leads from IndiaMart, JustDial, and TradeIndia inquiry emails.
        </p>
        <Button onClick={handleConnect} disabled={connecting} className="gap-2">
          {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          {connecting ? "Redirecting..." : "Connect Gmail Account"}
        </Button>
      </motion.div>
    );
  }

  const importableLeads = leads.filter((l) => !l.imported);
  const importedLeads = leads.filter((l) => l.imported);

  return (
    <div className="space-y-6">
      <motion.div variants={staggerItem} className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <Mail className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Connected as {status.email}</p>
              <p className="text-xs text-muted-foreground">
                {status.lastSyncedAt
                  ? `Last synced: ${new Date(status.lastSyncedAt).toLocaleString("en-IN")}`
                  : "Not synced yet"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-2 text-red-600 hover:text-red-500">
              <Unplug className="w-4 h-4" /> Disconnect
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center gap-3 flex-wrap">
        {(["IndiaMart", "JustDial", "TradeIndia"] as const).map((s) => (
          <Badge key={s} className={sourceColors[s]}>
            {s}: {leads.filter((l) => l.source === s).length}
          </Badge>
        ))}
        <Badge className="bg-muted/30 text-muted-foreground">Total: {leads.length}</Badge>
      </div>

      {importableLeads.length > 0 && (
        <SectionCard title={`Pending Import (${importableLeads.length})`}>
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border">
              <button
                onClick={toggleAll}
                className="w-5 h-5 rounded border border-border flex items-center justify-center hover:bg-muted/30 transition-colors"
              >
                {selectedIds.size === importableLeads.length && importableLeads.length > 0 && (
                  <Check className="w-3 h-3 text-primary" />
                )}
              </button>
              <span className="text-xs text-muted-foreground flex-1">Select All</span>
              {selectedIds.size > 0 && (
                <Button size="sm" onClick={handleImport} disabled={importing} className="gap-2">
                  {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  Import {selectedIds.size} Lead{selectedIds.size > 1 ? "s" : ""} to CRM
                </Button>
              )}
            </div>

            {importableLeads.map((lead) => (
              <motion.div
                key={lead.id}
                variants={staggerItem}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedIds.has(lead.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/10"
                }`}
                onClick={() => toggleSelect(lead.id)}
              >
                <button
                  className="w-5 h-5 rounded border border-border flex items-center justify-center shrink-0 mt-0.5"
                  onClick={(e) => { e.stopPropagation(); toggleSelect(lead.id); }}
                >
                  {selectedIds.has(lead.id) && <Check className="w-3 h-3 text-primary" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{lead.name || "—"}</span>
                    <Badge className={`text-[10px] ${sourceColors[lead.source]}`}>{lead.source}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {lead.phone && <span>Ph: {lead.phone}</span>}
                    {lead.email && <span>Em: {lead.email}</span>}
                    {lead.company && <span>Co: {lead.company}</span>}
                    {lead.city && <span>City: {lead.city}</span>}
                  </div>
                  {lead.product && (
                    <p className="text-xs text-muted-foreground mt-1">Product: {lead.product}</p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(lead.receivedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      )}

      {importedLeads.length > 0 && (
        <SectionCard title={`Already Imported (${importedLeads.length})`}>
          <div className="space-y-1">
            {importedLeads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 p-3 rounded-lg border border-border opacity-60">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-sm text-foreground">{lead.name || "—"}</span>
                <Badge className={`text-[10px] ${sourceColors[lead.source]}`}>{lead.source}</Badge>
                {lead.phone && <span className="text-xs text-muted-foreground ml-auto">{lead.phone}</span>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {leads.length === 0 && (
        <motion.div variants={staggerItem} className="glass-card rounded-xl p-8 text-center">
          <MailSearch className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No leads synced yet. Click "Sync Now" to fetch leads from your inbox.</p>
        </motion.div>
      )}
    </div>
  );
}

function ExportTab() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filterSource, setFilterSource] = useState("all");
  const [filterStage, setFilterStage]   = useState("all");
  const [filterDate, setFilterDate]     = useState("all");
  const [filterLocation, setFilterLocation] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    leadsService.getAll({ filters: {} }).then(data => {
      setLeads(Array.isArray(data) ? data : []);
    }).catch(() => setLeads([])).finally(() => setLoading(false));
  }, []);

  const filtered = leads.filter(l => {
    if (filterSource !== "all" && l.source !== filterSource) return false;
    if (filterStage !== "all" && l.pipeline_stage !== filterStage) return false;
    if (filterLocation && !(l.city || "").toLowerCase().includes(filterLocation.toLowerCase())) return false;
    if (filterDate !== "all") {
      const created = l.created_at ? new Date(l.created_at).getTime() : 0;
      const now = Date.now();
      if (filterDate === "week" && now - created > 7 * 86400000) return false;
      if (filterDate === "month" && now - created > 30 * 86400000) return false;
    }
    return true;
  });

  function buildCsv(rows: any[]) {
    const headers = ["Name", "Company", "Phone", "Email", "City", "Source", "Machine Interest", "Budget", "Pipeline Stage", "Lead Score", "Created Date", "Last Activity", "WhatsApp", "Notes"];
    const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];
    rows.forEach(l => {
      lines.push([
        escape(l.name), escape(l.company_name), escape(l.phone),
        escape(l.email), escape(l.city), escape(l.source),
        escape(l.machine_interest), escape(l.budget),
        escape(l.pipeline_stage), escape(l.lead_score),
        escape(l.created_at ? new Date(l.created_at).toLocaleDateString("en-IN") : ""),
        escape(l.last_activity_at ? new Date(l.last_activity_at).toLocaleDateString("en-IN") : ""),
        escape(l.whatsapp_no), escape(l.notes),
      ].join(","));
    });
    return lines.join("\n");
  }

  function downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleExport() {
    setExporting(true);
    const csv = buildCsv(filtered);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `sairolotech-leads-${dateStr}.csv`);
    setTimeout(() => {
      setExporting(false);
      toast({ title: `Exported ${filtered.length} leads to CSV` });
    }, 500);
  }

  function handleTemplateExport() {
    const sample = [
      { name: "Ramesh Kumar", company_name: "ABC Industries", phone: "+919876543210", email: "ramesh@example.com", city: "Delhi", source: "IndiaMART", machine_interest: "Shutter Patti Machine", budget: "₹5L", pipeline_stage: "new_lead", lead_score: "75" },
      { name: "Suresh Singh", company_name: "XYZ Traders", phone: "+919876543211", email: "suresh@example.com", city: "Gurgaon", source: "JustDial", machine_interest: "False Ceiling Machine", budget: "₹8L", pipeline_stage: "contacted", lead_score: "60" },
    ];
    const csv = buildCsv(sample);
    downloadCsv(csv, "lead-export-template.csv");
    toast({ title: "Template downloaded — edit and re-import anytime" });
  }

  const stageColors: Record<string, string> = {
    new_lead: "bg-blue-50 text-blue-600", contacted: "bg-amber-50 text-amber-700",
    proposal: "bg-purple-50 text-purple-700", negotiation: "bg-orange-50 text-orange-700",
    won: "bg-emerald-50 text-emerald-700", lost: "bg-red-50 text-red-600",
  };

  const sourceColors: Record<string, string> = {
    IndiaMART: "bg-blue-50 text-blue-600", JustDial: "bg-amber-50 text-amber-700",
    TradeIndia: "bg-emerald-50 text-emerald-700", WhatsApp: "bg-green-50 text-green-700",
    "Direct / Walk-in": "bg-purple-50 text-purple-700", Unknown: "bg-slate-50 text-slate-500",
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">Total Leads</p>
          <p className="text-2xl font-bold text-foreground">{leads.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">Filtered for Export</p>
          <p className="text-2xl font-bold text-primary">{filtered.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">Won Deals</p>
          <p className="text-2xl font-bold text-emerald-600">{leads.filter(l => l.pipeline_stage === "won").length}</p>
        </div>
      </div>

      <SectionCard title="Export Filters">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Source */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Source</label>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
              className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-background text-foreground">
              <option value="all">All Sources</option>
              <option value="IndiaMART">IndiaMART</option>
              <option value="JustDial">JustDial</option>
              <option value="TradeIndia">TradeIndia</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Direct / Walk-in">Direct / Walk-in</option>
            </select>
          </div>
          {/* Pipeline Stage */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Pipeline Stage</label>
            <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
              className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-background text-foreground">
              <option value="all">All Stages</option>
              <option value="new_lead">New Lead</option>
              <option value="contacted">Contacted</option>
              <option value="proposal">Proposal Sent</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          {/* Date range */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Created Date</label>
            <select value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-background text-foreground">
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Location (City)</label>
            <input value={filterLocation} onChange={e => setFilterLocation(e.target.value)}
              placeholder="e.g. Delhi, Haryana…"
              className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <button onClick={handleExport}
            disabled={filtered.length === 0 || exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {exporting ? "Preparing…" : `Export ${filtered.length} Leads (CSV)`}
          </button>
          <button onClick={handleTemplateExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:bg-muted/50 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Download Template
          </button>
        </div>
      </SectionCard>

      {/* Preview */}
      <SectionCard title={`Preview (${filtered.length} leads)`}>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No leads match your filters</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting the filters above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Name</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Phone</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">City</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Source</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Machine</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Stage</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Score</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.slice(0, 20).map((l) => (
                  <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-foreground">
                      <div>
                        <p>{l.name}</p>
                        {l.company_name && <p className="text-muted-foreground font-normal">{l.company_name}</p>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-foreground">{l.phone || "—"}</td>
                    <td className="px-3 py-2.5 text-foreground">{l.city || "—"}</td>
                    <td className="px-3 py-2.5">
                      <Badge className={`${sourceColors[l.source || "Unknown"] || "bg-slate-50 text-slate-500"} text-[10px]`}>
                        {l.source || "Unknown"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-foreground">{l.machine_interest || "—"}</td>
                    <td className="px-3 py-2.5">
                      <Badge className={`${stageColors[l.pipeline_stage || ""] || "bg-slate-50 text-slate-500"} text-[10px]`}>
                        {l.pipeline_stage?.replace(/_/g, " ") || "—"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      {l.lead_score != null ? (
                        <span className={`font-semibold ${l.lead_score >= 80 ? "text-emerald-600" : l.lead_score >= 60 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {l.lead_score}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-foreground">{l.budget || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 20 && (
              <p className="text-xs text-muted-foreground text-center py-3">
                Showing 20 of {filtered.length} leads — export to download all
              </p>
            )}
          </div>
        )}
      </SectionCard>
    </motion.div>
  );
}

export default function LeadImportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("gmail");
  const [gmailHistory, setGmailHistory] = useState<GmailHistoryEntry[]>([]);

  const fetchGmailHistory = useCallback(async () => {
    try {
      const data = await apiFetch<{ history: GmailHistoryEntry[] }>("/admin/gmail/history", { showErrorToast: false });
      setGmailHistory(data.history || []);
    } catch {
      setGmailHistory([]);
    }
  }, []);

  useEffect(() => { fetchGmailHistory(); }, [fetchGmailHistory]);

  const getHistoryStatus = (entry: GmailHistoryEntry): "completed" | "partial" | "failed" => {
    if (entry.newLeads === 0) return entry.totalFetched === 0 ? "completed" : "partial";
    if (entry.imported === 0 && entry.newLeads > 0) return "partial";
    return entry.skipped > 0 ? "partial" : "completed";
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader title="Lead Imports" subtitle="Import leads from Gmail portals or CSV files" />

      <motion.div variants={staggerItem} className="flex gap-1 p-1 bg-muted/30 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("gmail")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "gmail" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="w-4 h-4" />
          Gmail Sources
        </button>
        <button
          onClick={() => setActiveTab("csv")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "csv" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4" />
          CSV Upload
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "export" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <DownloadCloud className="w-4 h-4" />
          Export Leads
        </button>
      </motion.div>

      {activeTab === "gmail"
        ? <GmailTab onHistoryRefresh={fetchGmailHistory} />
        : activeTab === "export"
        ? <ExportTab />
        : <CsvTab />
      }

      <SectionCard title="Import History">
        {gmailHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No Gmail syncs yet. Connect Gmail and click Sync Now to get started.</p>
        ) : (
          <div className="space-y-3">
            {gmailHistory.map((entry) => {
              const status = getHistoryStatus(entry);
              return (
                <motion.div key={entry.id} variants={staggerItem} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                  <Mail className="w-8 h-8 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Gmail Sync</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(entry.syncedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {" "}&middot; {entry.totalFetched} emails fetched
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />{entry.imported} imported
                      </p>
                      {entry.skipped > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{entry.skipped} skipped
                        </p>
                      )}
                    </div>
                    <Badge className={statusColors[status]}>{status}</Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </motion.div>
  );
}
