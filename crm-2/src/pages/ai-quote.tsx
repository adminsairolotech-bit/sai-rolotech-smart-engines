import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, ArrowLeft, Send, Printer,
  CheckCircle2, User,
  Package, Loader2, RefreshCw, MapPin, Hash
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { AIDisclaimer } from "@/components/shared";

interface MachineSpec { param: string; value: string; }

interface QuotationItem {
  sno: number;
  description: string;
  hsn: string;
  qty: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

interface Quotation {
  quotationNo: string;
  date: string;
  validUntil: string;
  subject: string;
  client: { name: string; phone: string; email: string; company: string; address?: string; gstin?: string };
  machineSpecs: MachineSpec[];
  items: QuotationItem[];
  subtotal: number;
  cgstRate: number;
  sgstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
  amountInWords: string;
  deliveryDays: string;
  paymentStructure: string;
  notes: string;
}

const SAI = {
  name: "SAI ROLOTECH",
  address: "PLOT NO 575/1 G.F MUNDKA INDUSTRIAL AREA, NEW DELHI 110041",
  phones: "+91-9899925274, 9818205274, 9667146889, 9910828534",
  emails: "sairolotech@gmail.com / info@sairolotech.com",
  web: "www.Sairolotech.in / www.Sairolotech.com",
  gstin: "07AWDPV5272C1ZG",
  bank: {
    name: "INDIAN OVERSEAS BANK",
    acName: "M/S SAI ROLOTECH",
    acNo: "226133000000022",
    ifsc: "IOBA0002261",
    branch: "Najafgarh, New Delhi",
    branchAddr: "RZ-15, Ground Floor, Old Roshanpura, Najafgarh-Gurgaon Road",
  },
  proprietor: "VIPIN JANGRA",
};

const TC = [
  "TRIAL MATERIAL ARRANGEMENT BY OWNER.",
  "MACHINE DELIVERY TIME AS PER QUOTATION.",
  "THE RATES ARE VALID FOR 1 MONTH ONLY.",
  "TRANSPORTATION, UNLOADING AND PACKAGING CHARGE EXTRA.",
  "CANCELLATION: ORDER ONCE BOOKED/CONFIRMED CANNOT BE CANCELLED. ANY ADVANCE PAID WILL BE FORFEITED IN A SITUATION IF YOU FAIL TO TAKE DELIVERY OF THE MILLS AFTER ONE MONTH OF STIPULATED TIME DECIDED ONCE THEY ARE READY FOR DISPATCH / MUTUAL UNDERSTANDING.",
];

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(n);
}

function QuotationPreview({ q, onPrint, onNew }: { q: Quotation; onPrint: () => void; onNew: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden="true" />
            <span className="text-emerald-700 font-semibold">Quotation Ready!</span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Ref: {q.quotationNo} · Valid till {q.validUntil}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onNew} aria-label="Create new quotation"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm transition-colors shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Naya
          </button>
          <button onClick={onPrint} aria-label="Print or save quotation"
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors shadow-sm">
            <Printer className="w-3.5 h-3.5" aria-hidden="true" /> Print / Save
          </button>
        </div>
      </div>

      {/* ── QUOTATION DOCUMENT ── */}
      <div id="quotation-print" className="bg-white text-gray-900 border border-slate-300 rounded-xl overflow-hidden shadow-lg print:shadow-none print:border-0 font-sans">

        {/* ── COMPANY LETTERHEAD ── */}
        <div className="border-b-2 border-blue-700 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-black text-blue-800 tracking-wide">{SAI.name}</h1>
              <p className="text-gray-700 text-xs mt-1 font-medium">{SAI.address}</p>
              <p className="text-gray-600 text-xs mt-0.5">Ph: {SAI.phones}</p>
              <p className="text-gray-600 text-xs">Email: {SAI.emails}</p>
              <p className="text-gray-600 text-xs">Web: {SAI.web}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="bg-blue-700 text-white px-4 py-3 rounded-lg text-right">
                <p className="text-xs text-blue-200 font-medium">QUOTATION NO.</p>
                <p className="text-lg font-bold">{q.quotationNo}</p>
                <p className="text-xs text-blue-200 mt-1">Date: {q.date}</p>
                <p className="text-xs text-blue-200">GSTIN: {SAI.gstin}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* ── LETTER OPENER ── */}
          <div>
            <p className="text-sm font-semibold text-gray-800">Dear Sir,</p>
            <p className="text-sm text-gray-700 mt-1 leading-relaxed">
              Thank you for your interest in our products and company. As per our conversation, we are pleased to quote you for the above mentioned product suitable for your requirement.
            </p>
          </div>

          {/* ── SUBJECT ── */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-sm font-bold text-blue-900 text-center uppercase tracking-wide">
              SUBJECT: {q.subject}
            </p>
          </div>

          {/* ── PARTY DETAILS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="font-bold text-gray-700 text-xs uppercase mb-2 border-b pb-1">Party Details</p>
              <p className="font-bold text-gray-900 text-sm">{q.client.name}</p>
              {q.client.company && <p className="text-gray-600">{q.client.company}</p>}
              {q.client.address && <p className="text-gray-600">{q.client.address}</p>}
              <p className="text-gray-600 mt-1">Ph: {q.client.phone}</p>
              {q.client.email && <p className="text-gray-600">Email: {q.client.email}</p>}
              {q.client.gstin && <p className="text-gray-600">GSTIN: {q.client.gstin}</p>}
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="font-bold text-gray-700 text-xs uppercase mb-2 border-b pb-1">Consignor</p>
              <p className="font-bold text-gray-900 text-sm">{SAI.name}</p>
              <p className="text-gray-600">{SAI.address}</p>
              <p className="text-gray-600 mt-1">GSTIN: {SAI.gstin}</p>
              <p className="text-gray-600">Valid Until: {q.validUntil}</p>
            </div>
          </div>

          {/* ── MACHINE SPECIFICATION TABLE ── */}
          {q.machineSpecs && q.machineSpecs.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">Description of the Roll Forming Machine</p>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-blue-700 text-white">
                      <th className="text-left px-3 py-2 font-semibold w-2/5">Parameter</th>
                      <th className="text-left px-3 py-2 font-semibold">Specification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.machineSpecs.map((spec, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-3 py-1.5 font-semibold text-gray-700 border-r border-gray-200 align-top">{spec.param}</td>
                        <td className="px-3 py-1.5 text-gray-800">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PRICE TABLE ── */}
          <div>
            <p className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">Performa Invoice</p>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-blue-700 text-white">
                      <th className="px-2 py-2 text-center font-semibold">S.N.</th>
                      <th className="px-3 py-2 text-left font-semibold">Description of Goods</th>
                      <th className="px-2 py-2 text-center font-semibold">HSN/SAC</th>
                      <th className="px-2 py-2 text-center font-semibold">Qty</th>
                      <th className="px-2 py-2 text-center font-semibold">Unit</th>
                      <th className="px-3 py-2 text-right font-semibold">Price (₹)</th>
                      <th className="px-3 py-2 text-right font-semibold">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.items.map((item, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-2 py-2 text-center text-gray-600">{item.sno}</td>
                        <td className="px-3 py-2 text-gray-900 font-medium">{item.description}</td>
                        <td className="px-2 py-2 text-center text-gray-600">{item.hsn}</td>
                        <td className="px-2 py-2 text-center text-gray-800">{item.qty}</td>
                        <td className="px-2 py-2 text-center text-gray-600">{item.unit}</td>
                        <td className="px-3 py-2 text-right text-gray-800">{formatINR(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatINR(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-gray-300">
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="px-3 py-1.5 text-right text-gray-700 font-medium">Sub Total</td>
                      <td className="px-3 py-1.5 text-right font-semibold text-gray-900">{formatINR(q.subtotal)}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="px-3 py-1 text-right text-gray-600 text-xs">
                        Tax Rate: {(q.cgstRate || 9) + (q.sgstRate || 9)}% &nbsp;|&nbsp; Taxable Amt: ₹{formatINR(q.subtotal)}
                      </td>
                      <td className="px-3 py-1 text-right text-gray-600 text-xs">Add CGST @ {q.cgstRate || 9}%</td>
                      <td className="px-3 py-1 text-right text-gray-700">{formatINR(q.cgstAmount)}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="px-3 py-1 text-right text-gray-600 text-xs">Add SGST @ {q.sgstRate || 9}%</td>
                      <td className="px-3 py-1 text-right text-gray-700">{formatINR(q.sgstAmount)}</td>
                    </tr>
                    <tr className="bg-blue-700 text-white">
                      <td colSpan={5} className="px-3 py-2 text-right font-bold text-sm">Grand Total</td>
                      <td className="px-3 py-2 text-right text-xs text-blue-200">1.00 Units</td>
                      <td className="px-3 py-2 text-right font-black text-base">₹ {formatINR(q.grandTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <p className="text-xs text-amber-900 font-semibold">
                {q.amountInWords}
              </p>
            </div>
          </div>

          {/* ── BANK DETAILS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-lg p-3 bg-slate-50">
              <p className="font-bold text-gray-800 text-xs uppercase mb-2 border-b pb-1">Our Bank Details</p>
              <div className="space-y-0.5 text-xs text-gray-700">
                <p><span className="font-semibold">Bank Name:</span> {SAI.bank.name}</p>
                <p><span className="font-semibold">Account Name:</span> {SAI.bank.acName}</p>
                <p><span className="font-semibold">Account Number:</span> {SAI.bank.acNo}</p>
                <p><span className="font-semibold">IFSC Code:</span> {SAI.bank.ifsc}</p>
                <p><span className="font-semibold">Branch:</span> {SAI.bank.branch}</p>
                <p className="text-gray-500">{SAI.bank.branchAddr}</p>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 bg-slate-50">
              <p className="font-bold text-gray-800 text-xs uppercase mb-2 border-b pb-1">Payment Structure</p>
              <p className="text-xs text-gray-700 leading-relaxed">{q.paymentStructure || "20% ADVANCE WITH CONFIRMED ORDER, 20% PROGRESS ON WORK AND 60% BALANCE AT THE TIME OF MACHINE DELIVERY."}</p>
              <p className="font-bold text-gray-800 text-xs uppercase mt-2 mb-1">Delivery Time</p>
              <p className="text-xs text-gray-700">{q.deliveryDays || "60 DAYS"}</p>
              {q.notes && (
                <>
                  <p className="font-bold text-gray-800 text-xs uppercase mt-2 mb-1">Notes</p>
                  <p className="text-xs text-gray-600">{q.notes}</p>
                </>
              )}
            </div>
          </div>

          {/* ── TERMS & CONDITIONS ── */}
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="font-bold text-gray-800 text-xs uppercase mb-2 border-b pb-1">Terms & Conditions</p>
            <ol className="space-y-1">
              {TC.map((t, i) => (
                <li key={i} className="text-xs text-gray-700 flex gap-2">
                  <span className="font-bold text-gray-600 flex-shrink-0">{i + 1}.</span>
                  <span>{t}</span>
                </li>
              ))}
              <li className="text-xs text-gray-700 flex gap-2">
                <span className="font-bold text-gray-600 flex-shrink-0">6.</span>
                <span>PAYMENT STRUCTURE: {q.paymentStructure || "20% ADVANCE WITH CONFIRMED ORDER, 20% PROGRESS ON WORK AND 60% BALANCE AT THE TIME OF MACHINE DELIVERY."}</span>
              </li>
            </ol>
          </div>

          {/* ── CLOSING + SIGNATURE ── */}
          <div className="flex items-end justify-between pt-2">
            <div className="text-xs text-gray-700 space-y-1">
              <p>We hope our above said information will be in line of your requirement. In case you require any further information from our side please feel free to contact us.</p>
              <p className="mt-2">Thanking you and hope to get your valued order very soon.</p>
            </div>
          </div>
          <div className="flex items-start justify-between">
            <div className="text-xs text-gray-500 italic">
              <p>This is a computer-generated quotation.</p>
              <p>E. & O.E.</p>
            </div>
            <div className="text-right">
              <div className="h-10 w-40 border-b border-gray-400 mb-1" />
              <p className="text-xs font-bold text-gray-800">REGARDS</p>
              <p className="text-xs font-black text-blue-800">{SAI.name}</p>
              <p className="text-xs font-semibold text-gray-800 mt-1">{SAI.proprietor}</p>
              <p className="text-xs text-gray-600">(PROPRIETOR)</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const inputCls = "w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all";

export default function AIQuotePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [quotation, setQuotation] = useState<Quotation | null>(null);

  const [form, setForm] = useState({
    clientName: user?.name || "",
    clientPhone: "",
    clientEmail: user?.email || "",
    clientCompany: "",
    clientAddress: "",
    clientGstin: "",
    products: "",
    budget: "",
    requirements: "",
  });

  const upd = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleGenerate = async () => {
    if (!form.clientName.trim() || !form.clientPhone.trim() || !form.products.trim()) {
      toast({ title: "Zaroori fields bharen", description: "Naam, phone aur product details chahiye.", variant: "destructive" });
      return;
    }
    setStep("loading");

    try {
      const res = await fetch("/api/ai-quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success && data.quotation) {
        setQuotation(data.quotation);
        setStep("result");
      } else {
        throw new Error(data.error || "AI response error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Quotation Generate Nahi Hua", description: msg, variant: "destructive" });
      setStep("form");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #quotation-print, #quotation-print * { visibility: visible; }
          #quotation-print { position: absolute; left: 0; top: 0; width: 100%; background: white; color: black; border: none !important; box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>

      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setLocation("/home")} aria-label="Go back"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-700 flex items-center justify-center shadow-sm">
            <Bot className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-slate-800 font-semibold text-sm">AI Quotation Maker</h1>
            <p className="text-slate-400 text-xs">SAI ROLOTECH · New Delhi · Powered by Gemini AI</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-3">
                  <Bot className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                  <span className="text-blue-700 text-sm font-medium">Instant Professional Quotation</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Machine Quotation Generate Karein</h2>
                <p className="text-slate-500 text-sm mt-1">SAI RoloTech ka official format mein — same jaise real quotations</p>
                <div className="mt-3 max-w-md mx-auto">
                  <AIDisclaimer />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Party Details — always visible */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                  <h3 className="text-slate-800 font-semibold flex items-center gap-2 pb-2 border-b border-slate-100">
                    <User className="w-4 h-4 text-blue-600" aria-hidden="true" /> Party Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="q-name" className="block text-xs font-medium text-slate-600 mb-1.5">
                        Client / Firm Name <span className="text-red-500">*</span>
                      </label>
                      <input id="q-name" value={form.clientName} onChange={e => upd("clientName", e.target.value)}
                        placeholder="Rahul Kumar / ABC Enterprises" aria-required="true" className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor="q-phone" className="block text-xs font-medium text-slate-600 mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input id="q-phone" value={form.clientPhone} onChange={e => upd("clientPhone", e.target.value)}
                        placeholder="+91 98765 43210" type="tel" aria-required="true" className={inputCls} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="q-company" className="block text-xs font-medium text-slate-600 mb-1.5">Company / Firm</label>
                      <input id="q-company" value={form.clientCompany} onChange={e => upd("clientCompany", e.target.value)}
                        placeholder="ABC Industries Pvt Ltd" className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor="q-email" className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
                      <input id="q-email" value={form.clientEmail} onChange={e => upd("clientEmail", e.target.value)}
                        placeholder="aapka@email.com" type="email" className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="q-addr" className="block text-xs font-medium text-slate-600 mb-1.5">
                      <MapPin className="w-3 h-3 inline mr-1 text-slate-400" aria-hidden="true" />
                      Address
                    </label>
                    <textarea id="q-addr" value={form.clientAddress} onChange={e => upd("clientAddress", e.target.value)}
                      placeholder="H No. 1055, Block S, Mangol Puri, Delhi 110083"
                      rows={2} className={`${inputCls} resize-none`} />
                  </div>

                  <div>
                    <label htmlFor="q-gstin" className="block text-xs font-medium text-slate-600 mb-1.5">
                      <Hash className="w-3 h-3 inline mr-1 text-slate-400" aria-hidden="true" />
                      GSTIN / UIN
                    </label>
                    <input id="q-gstin" value={form.clientGstin} onChange={e => upd("clientGstin", e.target.value)}
                      placeholder="07BLFPK6652P1ZH" className={inputCls} />
                  </div>
                </div>

                {/* Machine Requirements */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <h3 className="text-slate-800 font-semibold flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Package className="w-4 h-4 text-indigo-600" aria-hidden="true" /> Machine Requirements
                  </h3>
                  <div>
                    <label htmlFor="q-products" className="block text-xs font-medium text-slate-600 mb-1.5">Kaunsi Machine chahiye? <span className="text-red-500">*</span></label>
                    <textarea id="q-products" value={form.products} onChange={e => upd("products", e.target.value)}
                      placeholder="Jaise: POP Channel Roll Forming Machine, 7 Station, Fully Automatic with PLC Panel&#10;Ya: C Channel Machine, 10 Station, 0.8-1.6mm material, Hydraulic cutting"
                      rows={4} aria-required="true" className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label htmlFor="q-budget" className="block text-xs font-medium text-slate-600 mb-1.5">Budget (approximate)</label>
                    <input id="q-budget" value={form.budget} onChange={e => upd("budget", e.target.value)}
                      placeholder="Jaise: ₹5,00,000 tak" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="q-req" className="block text-xs font-medium text-slate-600 mb-1.5">Special Requirements</label>
                    <textarea id="q-req" value={form.requirements} onChange={e => upd("requirements", e.target.value)}
                      placeholder="Jaise: De-coiler bhi chahiye, PLC+HMI, urgent delivery, installation support"
                      rows={3} className={`${inputCls} resize-none`} />
                  </div>
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div className="text-xs text-blue-800">
                  <p className="font-semibold mb-0.5">Real SAI RoloTech Format</p>
                  <p>Generated quotation mein same letterhead, machine specs table, GST breakdown (CGST 9% + SGST 9%), bank details, T&C, aur Vipin Jangra signature hogi — bilkul original documents jaisi.</p>
                </div>
              </div>

              <button onClick={handleGenerate} aria-label="Generate AI quotation"
                className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-2xl py-4 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 text-lg focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                <Bot className="w-5 h-5" aria-hidden="true" />
                AI se Quotation Generate Karein
                <Send className="w-4 h-4 ml-1" aria-hidden="true" />
              </button>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-700 flex items-center justify-center shadow-xl shadow-blue-200">
                  <Bot className="w-10 h-10 text-white" aria-hidden="true" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" aria-hidden="true" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-slate-800 text-xl font-bold">Quotation Bana Raha Hai...</h3>
                <p className="text-slate-500 mt-1">Machine specifications aur pricing calculate ho rahi hai</p>
              </div>
              <div className="flex flex-col gap-2 text-sm text-slate-400 text-center" aria-live="polite">
                {[
                  "Machine specifications set kar raha hai...",
                  "Pricing aur GST calculate kar raha hai...",
                  "Official SAI RoloTech format mein bana raha hai...",
                ].map((msg, i) => (
                  <motion.p key={msg} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.7 }}>{msg}</motion.p>
                ))}
              </div>
            </motion.div>
          )}

          {step === "result" && quotation && (
            <QuotationPreview
              q={quotation}
              onPrint={() => window.print()}
              onNew={() => { setQuotation(null); setStep("form"); setForm(f => ({ ...f, products: "", budget: "", requirements: "" })); }}
            />
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
