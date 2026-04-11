import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader } from "@/components/shared";
import { FileText, Plus, Trash2, Bot, Download, Eye, Printer, X, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { machines as machineService, leads as leadsService, quotations } from "@/lib/dataService";
import { toast } from "@/hooks/use-toast";

interface LineItem {
  description: string;
  hsn: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface Machine {
  id: number;
  name: string;
  price: number | null;
  category: string | null;
}

interface Lead {
  id: number;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  company: string | null;
  machineInterest: string | null;
  budget: number | null;
}

interface QuotationContent {
  quotationNo: string;
  clientName: string;
  items: { sno: number; description: string; hsn: string; quantity: number; unit: string; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  notes: string;
  validityDays: number;
  companyInfo: {
    name: string; address: string; phone: string; email: string; gstin: string;
    website: string; pan: string;
    bankName: string; bankAccount: string; bankIfsc: string; signatory: string;
  };
  createdAt: string;
}

export default function QuotationMakerPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  const [items, setItems] = useState<LineItem[]>([{ description: "", hsn: "", quantity: 1, unit: "Nos", unitPrice: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(18);
  const [notes, setNotes] = useState("Delivery: 4-6 weeks from order confirmation.\nPayment Terms: 50% advance, 50% before delivery.\nWarranty: 1 year standard warranty.");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<QuotationContent | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      machineService.getAll().catch(() => []),
      leadsService.getAll().catch(() => []),
    ]).then(([allMachines, allLeads]) => {
      setMachines(allMachines.map(m => ({ id: m.id, name: m.name, price: m.price ? parseFloat(String(m.price).replace(/[^\d.]/g, '')) || null : null, category: m.category })));
      setLeads(allLeads.map(l => ({ id: l.id, clientName: l.name, clientEmail: l.email || null, clientPhone: l.phone, company: (l as any).company_name || l.city || "", machineInterest: l.machine_interest, budget: l.budget ? parseFloat(String(l.budget).replace(/[^\d.]/g, '')) || null : null })));
    });

    const pending = localStorage.getItem("sai_pending_quote_item");
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        if (parsed && parsed.description) {
          setItems([{
            description: parsed.description || "",
            hsn: parsed.hsn || "8455",
            quantity: parsed.quantity || 1,
            unit: parsed.unit || "NOS",
            unitPrice: parsed.unitPrice || 0,
          }]);
        }
        localStorage.removeItem("sai_pending_quote_item");
      } catch {
      }
    }
  }, []);

  const handleLeadSelect = (leadId: number) => {
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setSelectedLead(leadId);
      setClientName(lead.clientName);
      setClientEmail(lead.clientEmail || "");
      setClientPhone(lead.clientPhone || "");
      setClientCompany(lead.company || "");
    }
  };

  const handleMachineSelect = (machineId: number) => {
    const machine = machines.find((m) => m.id === machineId);
    if (machine) {
      setSelectedMachine(machineId);
      const newItems = [...items];
      newItems[0] = {
        description: machine.name,
        hsn: "8456",
        quantity: 1,
        unit: "Nos",
        unitPrice: machine.price || 0,
      };
      setItems(newItems);
    }
  };

  const addItem = () => setItems([...items, { description: "", hsn: "", quantity: 1, unit: "Nos", unitPrice: 0 }]);

  const removeItem = (idx: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    setItems(updated);
  };

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const discountAmt = subtotal * (discount / 100);
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = afterDiscount * (tax / 100);
  const grandTotal = afterDiscount + taxAmt;

  const handleCreate = async () => {
    if (!clientName.trim()) {
      toast({ title: "Error", description: "Client name is required", variant: "destructive" });
      return;
    }
    if (items.every((i) => !i.description.trim())) {
      toast({ title: "Error", description: "Add at least one item", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const year = new Date().getFullYear();
      const nextYear = year + 1;
      const shortYear = String(year).slice(-2);
      const nextShortYear = String(nextYear).slice(-2);
      const randomNo = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
      const quotationNo = `SAI/${shortYear}-${nextShortYear}/${randomNo}`;
      const lead = leads.find((l) => l.id === selectedLead);
      await quotations.create({
        customer_name: clientName,
        customer_phone: lead?.clientPhone || '',
        machine_name: selectedMachine ? machines.find(m => m.id === selectedMachine)?.name || '' : '',
        quantity: items.reduce((a, i) => a + i.quantity, 0),
        status: 'draft',
        quoted_price: String(grandTotal),
        special_requirements: notes,
      });

      const content: QuotationContent = {
        quotationNo,
        clientName,
        items: items.map((it, i) => ({ sno: i + 1, ...it, lineTotal: it.quantity * it.unitPrice })),
        subtotal, discount, discountAmount: discountAmt, taxRate: tax, taxAmount: taxAmt, grandTotal, notes,
        validityDays: 30,
        companyInfo: {
          name: "SAI ROLOTECH",
          address: "Ground Floor Mdk052, Kh.No.575/1, Udyog Nagar, South Side Industrial Area, Mundka, New Delhi - 110041",
          phone: "+91-9899925274",
          email: "sales@sairolotech.in",
          gstin: "07BBFPS1234A1ZL",
          website: "www.sairolotech.in",
          pan: "BBFPS1234A",
          bankName: "Punjab National Bank",
          bankAccount: "1234567890123",
          bankIfsc: "PUNB0123456",
          signatory: "Vipin Kumar (Proprietor)",
        },
        createdAt: new Date().toISOString(),
      };
      setPreview(content);
      toast({ title: "Quotation Created!", description: `${quotationNo} — ₹${(grandTotal / 100000).toFixed(2)}L` });
    } catch {
      toast({ title: "Error", description: "Failed to create quotation", variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleAIGenerate = async () => {
    if (!clientName.trim()) {
      toast({ title: "Error", description: "Select a lead or enter client name", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const lead = leads.find((l) => l.id === selectedLead);
      const machine = selectedMachine ? machines.find(m => m.id === selectedMachine) : null;
      const quotationNo = `SAI/AI-${new Date().getFullYear()}/${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
      const unitPrice = machine?.price || lead?.budget || 100000;
      const aiItems = [{ description: machine?.name || lead?.machineInterest || 'Machine', hsn: '8456', quantity: 1, unit: 'NOS', unitPrice, lineTotal: unitPrice }];
      const aiSubtotal = unitPrice;
      const aiDiscount = 5;
      const aiDiscountAmt = aiSubtotal * aiDiscount / 100;
      const aiTax = 18;
      const aiTaxAmt = (aiSubtotal - aiDiscountAmt) * aiTax / 100;
      const aiGrand = aiSubtotal - aiDiscountAmt + aiTaxAmt;

      const content: QuotationContent = {
        quotationNo, clientName, items: aiItems.map((it, i) => ({ sno: i + 1, ...it })),
        subtotal: aiSubtotal, discount: aiDiscount, discountAmount: aiDiscountAmt,
        taxRate: aiTax, taxAmount: aiTaxAmt, grandTotal: aiGrand,
        notes: 'AI-generated quotation. Terms: 50% advance, delivery within 6-8 weeks.',
        validityDays: 30,
        companyInfo: {
          name: "SAI ROLOTECH",
          address: "Ground Floor Mdk052, Kh.No.575/1, Udyog Nagar, South Side Industrial Area, Mundka, New Delhi - 110041",
          phone: "+91-9899925274",
          email: "sales@sairolotech.in",
          gstin: "07BBFPS1234A1ZL",
          website: "www.sairolotech.in",
          pan: "BBFPS1234A",
          bankName: "Punjab National Bank",
          bankAccount: "1234567890123",
          bankIfsc: "PUNB0123456",
          signatory: "Vipin Kumar (Proprietor)",
        },
        createdAt: new Date().toISOString(),
      };
      setPreview(content);
      setItems(content.items.map((i) => ({
        description: i.description,
        hsn: i.hsn,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
      })));
      setNotes(content.notes);
    } catch {
      toast({ title: "Error", description: "AI generation failed", variant: "destructive" });
    }
    setGenerating(false);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Quotation - Sai Rolotech</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
        .company { font-size: 28px; font-weight: 700; color: #6366f1; }
        .company-sub { font-size: 12px; color: #666; margin-top: 4px; }
        .q-info { text-align: right; }
        .q-no { font-size: 18px; font-weight: 600; }
        .client-box { background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
        .client-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
        .client-name { font-size: 16px; font-weight: 600; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #6366f1; color: white; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
        td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
        tr:nth-child(even) { background: #fafafa; }
        .totals { width: 300px; margin-left: auto; }
        .totals td { padding: 6px 12px; }
        .totals .grand { font-size: 18px; font-weight: 700; color: #6366f1; border-top: 2px solid #6366f1; }
        .notes { background: #f0f0ff; padding: 16px; border-radius: 8px; margin-top: 24px; font-size: 12px; white-space: pre-line; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
        .stamp { margin-top: 40px; text-align: right; }
        .stamp-box { display: inline-block; border: 2px solid #6366f1; padding: 12px 24px; border-radius: 8px; }
        @media print { body { padding: 20px; } }
      </style></head><body>${printRef.current.innerHTML}
      <div class="footer">Thank you for choosing SAI ROLOTECH | sales@sairolotech.in | +91-9899925274 | www.sairolotech.in</div>
      </body></html>`);
    win.document.close();
    win.print();
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader title="Quotation Maker" subtitle="Create professional quotations for machinery sales" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={staggerItem} className="space-y-4">
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Client Details</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Select Lead (optional)</label>
                <select value={selectedLead || ""} onChange={(e) => e.target.value ? handleLeadSelect(Number(e.target.value)) : null}
                  className="w-full mt-1 bg-card border border-border rounded-lg px-3 py-2 text-sm">
                  <option value="">— Select from leads —</option>
                  {leads.map((l) => <option key={l.id} value={l.id}>{l.clientName} — {l.company || l.machineInterest}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Client Name *</label>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)}
                    className="w-full mt-1 bg-card border border-border rounded-lg px-3 py-2 text-sm" placeholder="Rajesh Kumar" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Company</label>
                  <input type="text" value={clientCompany} onChange={(e) => setClientCompany(e.target.value)}
                    className="w-full mt-1 bg-card border border-border rounded-lg px-3 py-2 text-sm" placeholder="ABC Industries" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full mt-1 bg-card border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <input type="text" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full mt-1 bg-card border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Select Machine (auto-fills price)</label>
                <select value={selectedMachine || ""} onChange={(e) => e.target.value ? handleMachineSelect(Number(e.target.value)) : null}
                  className="w-full mt-1 bg-card border border-border rounded-lg px-3 py-2 text-sm">
                  <option value="">— Select machine —</option>
                  {machines.map((m) => <option key={m.id} value={m.id}>{m.name} {m.price ? `— ₹${(m.price / 100000).toFixed(1)}L` : ""}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><IndianRupee className="w-4 h-4 text-primary" /> Line Items</h3>
              <button onClick={addItem} className="text-xs text-primary flex items-center gap-1 hover:underline"><Plus className="w-3 h-3" /> Add Item</button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Item #{idx + 1}</span>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                  <input type="text" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)}
                    className="w-full bg-card border border-border rounded px-3 py-1.5 text-sm" placeholder="Machine / Service name" />
                  <div className="grid grid-cols-4 gap-2">
                    <input type="text" value={item.hsn} onChange={(e) => updateItem(idx, "hsn", e.target.value)}
                      className="bg-card border border-border rounded px-2 py-1.5 text-xs" placeholder="HSN" />
                    <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                      className="bg-card border border-border rounded px-2 py-1.5 text-xs" min={1} />
                    <input type="text" value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)}
                      className="bg-card border border-border rounded px-2 py-1.5 text-xs" placeholder="Nos" />
                    <input type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                      className="bg-card border border-border rounded px-2 py-1.5 text-xs" placeholder="Price" />
                  </div>
                  <div className="text-right text-xs text-muted-foreground">Line Total: {fmt(item.quantity * item.unitPrice)}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Discount %</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full mt-1 bg-card border border-border rounded px-3 py-1.5 text-sm" min={0} max={100} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">GST %</label>
                  <input type="number" value={tax} onChange={(e) => setTax(Number(e.target.value))}
                    className="w-full mt-1 bg-card border border-border rounded px-3 py-1.5 text-sm" min={0} max={28} />
                </div>
              </div>
              <div className="text-right space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-red-600"><span>Discount ({discount}%)</span><span>-{fmt(discountAmt)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">GST ({tax}%)</span><span>{fmt(taxAmt)}</span></div>
                <div className="flex justify-between text-lg font-bold text-primary border-t border-border pt-2">
                  <span>Grand Total</span><span>{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <label className="text-xs text-muted-foreground">Notes & Terms</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
              className="w-full mt-1 bg-card border border-border rounded-lg px-3 py-2 text-sm resize-none" />
          </div>

          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={generating}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              <FileText className="w-4 h-4" /> {generating ? "Creating..." : "Create Quotation"}
            </button>
            <button onClick={handleAIGenerate} disabled={generating || !clientName.trim()}
              className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              <Bot className="w-4 h-4" /> {generating ? "Generating..." : "AI Auto-Generate"}
            </button>
          </div>
        </motion.div>

        <motion.div variants={staggerItem}>
          <div className="glass-card rounded-xl p-5 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> Live Preview</h3>
              {preview && (
                <div className="flex gap-2">
                  <button onClick={handlePrint} className="text-xs text-primary flex items-center gap-1 hover:underline"><Printer className="w-3 h-3" /> Print / PDF</button>
                </div>
              )}
            </div>

            {preview ? (
              <div ref={printRef} className="bg-white text-black rounded-lg p-6 text-xs" style={{ minHeight: 500 }}>
                <div className="header" style={{ display: "flex", justifyContent: "space-between", borderBottom: "3px solid #6366f1", paddingBottom: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#6366f1", letterSpacing: 1 }}>SAI ROLOTECH</div>
                    <div style={{ fontSize: 10, color: "#444", marginTop: 4, fontWeight: 500 }}>Roll Forming Machine Experts</div>
                    <div style={{ fontSize: 9, color: "#666", marginTop: 3 }}>Factory: {preview.companyInfo.address}</div>
                    <div style={{ fontSize: 9, color: "#666" }}>📞 {preview.companyInfo.phone} | ✉️ {preview.companyInfo.email}</div>
                    <div style={{ fontSize: 9, color: "#666" }}>🌐 {preview.companyInfo.website} | GSTIN: {preview.companyInfo.gstin}</div>
                    <div style={{ fontSize: 9, color: "#666" }}>PAN: {preview.companyInfo.pan} | IEC: Available on Request</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#6366f1" }}>{preview.quotationNo}</div>
                    <div style={{ fontSize: 9, color: "#666" }}>Date: {new Date(preview.createdAt).toLocaleDateString("en-IN")}</div>
                    <div style={{ fontSize: 9, color: "#666" }}>Valid: {preview.validityDays} days from date</div>
                    <div style={{ fontSize: 9, color: "#666", marginTop: 2 }}>Signatory:</div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: "#333" }}>{preview.companyInfo.signatory}</div>
                    <Badge className="mt-1 bg-primary/10 text-primary text-[9px]">QUOTATION</Badge>
                  </div>
                </div>

                <div style={{ background: "#f8f9fa", padding: 12, borderRadius: 6, marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Bill To</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{preview.clientName}</div>
                  {clientCompany && <div style={{ fontSize: 10, color: "#666" }}>{clientCompany}</div>}
                  {clientEmail && <div style={{ fontSize: 10, color: "#666" }}>{clientEmail}</div>}
                  {clientPhone && <div style={{ fontSize: 10, color: "#666" }}>{clientPhone}</div>}
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                  <thead>
                    <tr style={{ background: "#6366f1" }}>
                      <th style={{ color: "white", padding: "8px 10px", textAlign: "left", fontSize: 10 }}>#</th>
                      <th style={{ color: "white", padding: "8px 10px", textAlign: "left", fontSize: 10 }}>Description</th>
                      <th style={{ color: "white", padding: "8px 10px", textAlign: "left", fontSize: 10 }}>HSN</th>
                      <th style={{ color: "white", padding: "8px 10px", textAlign: "right", fontSize: 10 }}>Qty</th>
                      <th style={{ color: "white", padding: "8px 10px", textAlign: "right", fontSize: 10 }}>Rate</th>
                      <th style={{ color: "white", padding: "8px 10px", textAlign: "right", fontSize: 10 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.items.map((item) => (
                      <tr key={item.sno} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "8px 10px", fontSize: 10 }}>{item.sno}</td>
                        <td style={{ padding: "8px 10px", fontSize: 10, fontWeight: 500 }}>{item.description}</td>
                        <td style={{ padding: "8px 10px", fontSize: 10, color: "#666" }}>{item.hsn}</td>
                        <td style={{ padding: "8px 10px", fontSize: 10, textAlign: "right" }}>{item.quantity} {item.unit}</td>
                        <td style={{ padding: "8px 10px", fontSize: 10, textAlign: "right" }}>{fmt(item.unitPrice)}</td>
                        <td style={{ padding: "8px 10px", fontSize: 10, textAlign: "right", fontWeight: 600 }}>{fmt(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ width: 250, marginLeft: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 10 }}>
                    <span style={{ color: "#666" }}>Subtotal</span><span>{fmt(preview.subtotal)}</span>
                  </div>
                  {preview.discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 10, color: "#e53e3e" }}>
                      <span>Discount ({preview.discount}%)</span><span>-{fmt(preview.discountAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 10 }}>
                    <span style={{ color: "#666" }}>GST ({preview.taxRate}%)</span><span>{fmt(preview.taxAmount)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 16, fontWeight: 700, color: "#6366f1", borderTop: "2px solid #6366f1", marginTop: 4 }}>
                    <span>Grand Total</span><span>{fmt(preview.grandTotal)}</span>
                  </div>
                </div>

                {/* Bank Details */}
                <div style={{ background: "#f8f9fa", padding: 12, borderRadius: 6, marginTop: 16, fontSize: 9 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: "#333", fontSize: 10 }}>Bank Details / NEFT / RTGS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                    <div><span style={{ color: "#888" }}>Bank:</span> <span style={{ fontWeight: 500 }}>{preview.companyInfo.bankName}</span></div>
                    <div><span style={{ color: "#888" }}>A/C No:</span> <span style={{ fontWeight: 500 }}>{preview.companyInfo.bankAccount}</span></div>
                    <div><span style={{ color: "#888" }}>IFSC:</span> <span style={{ fontWeight: 500 }}>{preview.companyInfo.bankIfsc}</span></div>
                    <div><span style={{ color: "#888" }}>PAN:</span> <span style={{ fontWeight: 500 }}>{preview.companyInfo.pan}</span></div>
                  </div>
                  <p style={{ color: "#888", marginTop: 6, fontSize: 8 }}>* Please include quotation number in payment remarks. 50% advance required to confirm order.</p>
                </div>

                {preview.notes && (
                  <div style={{ background: "#f0f0ff", padding: 12, borderRadius: 6, marginTop: 16, fontSize: 9, whiteSpace: "pre-line", color: "#555" }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: "#333" }}>Terms & Conditions</div>
                    {preview.notes}
                  </div>
                )}

                <div style={{ marginTop: 40, textAlign: "right" }}>
                  <div style={{ display: "inline-block", border: "2px solid #6366f1", padding: "8px 20px", borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: "#666" }}>For SAI ROLOTECH</div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 24 }}>{preview.companyInfo.signatory}</div>
                    <div style={{ fontSize: 8, color: "#888" }}>Authorized Signatory</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 text-muted-foreground">
                <FileText className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">Fill in the details and click<br />"Create Quotation" or "AI Auto-Generate"<br />to see the preview here</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
