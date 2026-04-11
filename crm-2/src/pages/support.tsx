import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, HeadphonesIcon, Phone, Mail, MapPin, Clock, MessageCircle, ExternalLink, ChevronDown, ChevronUp, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "AI Quotation kaise generate karte hain?",
    a: "AI Quote page par jayein → Party details fill karein (naam, phone, address, GSTIN) → Machine ki requirement likhein → 'Generate Quotation' button dabayein. 30 seconds mein official format mein quote taiyar ho jaayega.",
  },
  {
    q: "Quotation print kaise karte hain?",
    a: "Quote generate hone ke baad 'Print / Download' button press karein. Browser ka print dialog khulega — PDF save kar sakte hain ya directly print kar sakte hain.",
  },
  {
    q: "Password bhool gaye toh kya karein?",
    a: "Login page par 'Password bhool gaye?' link par click karein. Apna registered email enter karein. Reset instructions aapke email par bheje jaayenge.",
  },
  {
    q: "Notifications band kaise karein?",
    a: "Phone Settings → SAI RoloTech App → Notifications → Off. Ya hamare WhatsApp par 'STOP' reply karein — hum turant band kar denge.",
  },
  {
    q: "Apna data delete karna chahte hain?",
    a: "Email karein sairolotech@gmail.com par subject 'Delete My Account' ke saath. 7 business days mein aapka saara data permanently delete kar diya jaayega.",
  },
  {
    q: "App kaam nahi kar raha?",
    a: "1) Internet connection check karein. 2) App band karke dobara kholein. 3) Phone restart karein. 4) Agar fir bhi problem ho toh +91-9899925274 par call karein.",
  },
  {
    q: "Machine ka quote kitne din mein milta hai?",
    a: "AI se instant quote milta hai. Agar aap official performa invoice chahte hain toh 1-2 business days mein hamare team se contact karenge.",
  },
  {
    q: "WhatsApp message nahi chahiye?",
    a: "Hamare WhatsApp number par 'STOP' ya 'Remove' type karke bhej dein. Aapko permanently unsubscribe kar diya jaayega.",
  },
];

function FAQ({ item }: { item: typeof faqs[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left bg-white hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-slate-700 font-medium text-sm pr-4">{item.q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-4 pt-1 bg-blue-50 border-t border-slate-200">
              <p className="text-slate-600 text-sm leading-relaxed">{item.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => window.history.back()} aria-label="Go back"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
            <HeadphonesIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-slate-800 font-semibold text-sm">Help &amp; Support</h1>
            <p className="text-slate-400 text-xs">SAI RoloTech · Hum madad karne ke liye hain</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Hero */}
        <div className="bg-violet-600 rounded-2xl p-5 text-white">
          <h2 className="text-lg font-bold mb-1">Koi bhi Sawaal? Hum Yahan Hain!</h2>
          <p className="text-violet-200 text-sm">Call, email, ya WhatsApp — sab channels par available hain</p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="tel:+919899925274"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-green-300 transition-all group flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0 group-hover:bg-green-500 transition-colors">
              <Phone className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-slate-800 font-semibold text-sm">Phone Call</p>
              <p className="text-green-600 font-medium text-sm">+91-9899925274</p>
              <p className="text-slate-400 text-xs mt-0.5">Mon–Sat, 9am–7pm</p>
            </div>
          </a>

          <a href="https://wa.me/919899925274?text=SAI%20RoloTech%20CRM%20app%20support%20chahiye" target="_blank" rel="noopener noreferrer"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-green-300 transition-all group flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0 group-hover:bg-green-500 transition-colors">
              <MessageCircle className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-slate-800 font-semibold text-sm">WhatsApp</p>
              <p className="text-green-600 font-medium text-sm">+91-9899925274</p>
              <p className="text-slate-400 text-xs mt-0.5">Quick response</p>
            </div>
          </a>

          <a href="mailto:sairolotech@gmail.com?subject=CRM App Support"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-500 transition-colors">
              <Mail className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-slate-800 font-semibold text-sm">Email</p>
              <p className="text-blue-600 font-medium text-sm">sairolotech@gmail.com</p>
              <p className="text-slate-400 text-xs mt-0.5">2 din mein reply</p>
            </div>
          </a>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-slate-800 font-semibold text-sm">Support Hours</p>
              <p className="text-slate-600 text-sm">Monday – Saturday</p>
              <p className="text-slate-400 text-xs mt-0.5">9:00 AM – 7:00 PM IST</p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-slate-800 font-semibold text-sm mb-0.5">Office Address</p>
            <p className="text-slate-600 text-sm">Plot No 575/1 G.F, Mundka Industrial Area,</p>
            <p className="text-slate-600 text-sm">New Delhi – 110041, India</p>
            <a href="https://maps.google.com/?q=Mundka+Industrial+Area+New+Delhi" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 text-xs mt-2 hover:underline">
              <ExternalLink className="w-3 h-3" /> Google Maps par dekhein
            </a>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-slate-800 font-semibold text-sm mb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-violet-600" /> Quick Help
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Data Delete karna hai", href: "mailto:sairolotech@gmail.com?subject=Delete%20My%20Account" },
              { label: "Notifications band karo", href: "https://wa.me/919899925274?text=STOP" },
              { label: "Quote mein gadbad", href: "mailto:sairolotech@gmail.com?subject=Quotation%20Issue" },
              { label: "Bug report karna hai", href: "mailto:sairolotech@gmail.com?subject=Bug%20Report" },
            ].map(item => (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                className="text-center bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl px-3 py-2.5 text-violet-700 text-xs font-medium transition-colors">
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h3 className="text-slate-800 font-semibold text-base mb-3">Aksar Pooche Jaane Wale Sawaal (FAQ)</h3>
          <div className="space-y-2">
            {faqs.map((item, i) => <FAQ key={i} item={item} />)}
          </div>
        </div>

        {/* Privacy + Terms links */}
        <div className="flex items-center justify-center gap-6 py-4 border-t border-slate-200">
          <a href="/privacy-policy" className="text-slate-500 text-sm hover:text-blue-600 hover:underline transition-colors">Privacy Policy</a>
          <span className="text-slate-300">|</span>
          <a href="/terms" className="text-slate-500 text-sm hover:text-blue-600 hover:underline transition-colors">Terms &amp; Conditions</a>
        </div>

      </main>

      <footer className="text-center py-6 text-slate-400 text-xs">
        © 2025 SAI RoloTech · New Delhi · India
      </footer>
    </div>
  );
}
