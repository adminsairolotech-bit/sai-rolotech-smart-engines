import { useLocation } from "wouter";
import { ArrowLeft, FileText, ShoppingCart, AlertTriangle, Scale, RefreshCw, Phone, Bot, MessageSquare, Server } from "lucide-react";

const Section = ({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" aria-hidden="true" />
      </div>
      <h2 className="text-slate-800 font-semibold text-base">{title}</h2>
    </div>
    <div className="text-slate-600 text-sm leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => window.history.back()} aria-label="Go back"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-slate-800 font-semibold text-sm">Terms &amp; Conditions</h1>
            <p className="text-slate-400 text-xs">SAI RoloTech · Last updated: March 2025</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">

        {/* Intro */}
        <div className="bg-emerald-600 rounded-2xl p-5 text-white">
          <h2 className="text-lg font-bold mb-2">SAI RoloTech CRM — Upyog ki Sharten</h2>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Ye Terms &amp; Conditions SAI RoloTech ki CRM app aur services ke upyog ko govern karti hain.
            App use karke aap in terms se agree karte hain. Kripya dhyan se padhein.
          </p>
        </div>

        <Section icon={FileText} title="1. Seva ka Vivran (Service Description)" color="bg-emerald-600">
          <p>SAI RoloTech CRM ek <strong>business tool</strong> hai jisme shamil hain:</p>
          <ul className="list-none space-y-1 mt-2">
            <li>✔️ AI-powered machine quotation generator</li>
            <li>✔️ Maintenance guide aur quality check tools</li>
            <li>✔️ Customer relationship management features</li>
            <li>✔️ Project reports aur analytics</li>
          </ul>
          <p className="mt-2 text-slate-500 text-xs">
            Ye app sirf <strong>SAI RoloTech ke authorized users</strong> ke liye hai.
          </p>
        </Section>

        <Section icon={ShoppingCart} title="2. Quotation aur Purchase" color="bg-blue-600">
          <p><strong>AI Quotation ke baare mein:</strong></p>
          <ul className="list-none space-y-1 mt-2">
            <li>⚡ AI-generated quotes <strong>approximate guidance</strong> ke liye hain</li>
            <li>⚡ Final pricing hamare sales team dwara confirm ki jaayegi</li>
            <li>⚡ Prices bina notice ke change ho sakti hain</li>
            <li>⚡ GST aur delivery charges alag se applicable hain</li>
          </ul>
          <p className="mt-3"><strong>Order Process:</strong></p>
          <ul className="list-none space-y-1">
            <li>✔️ Quote approval ke baad 30% advance payment required</li>
            <li>✔️ Delivery before dispatch remaining payment</li>
            <li>✔️ All sales subject to our standard terms</li>
          </ul>
        </Section>

        <Section icon={AlertTriangle} title="3. Disclaimer (Simit Zimmedari)" color="bg-amber-500">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-amber-800 font-medium mb-2">⚠️ Zaroori Parhein:</p>
            <ul className="list-none space-y-1 text-amber-700">
              <li>• AI recommendations <strong>"as is"</strong> provide ki jaati hain</li>
              <li>• Hum accuracy ki guarantee nahi dete</li>
              <li>• Technical decisions ke liye professional advice lein</li>
              <li>• App ka use aapke apne risk par hai</li>
            </ul>
          </div>
          <p className="text-slate-500 text-xs mt-2">
            SAI RoloTech kisi bhi indirect, incidental, ya consequential damages ke liye liable nahi hai.
          </p>
        </Section>

        <Section icon={Bot} title="4. AI Features — Liability Disclaimer" color="bg-violet-600">
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
            <p className="text-violet-800 font-medium mb-2">AI Tools ke baare mein:</p>
            <ul className="list-none space-y-1 text-violet-700">
              <li>&#x2022; AI-generated responses (quotations, troubleshooting, photo diagnosis) sirf <strong>guidance purpose</strong> ke liye hain</li>
              <li>&#x2022; AI galat ya incomplete information de sakta hai — verify zaroor karein</li>
              <li>&#x2022; SAI RoloTech AI-generated content ki accuracy ki <strong>guarantee nahi deta</strong></li>
              <li>&#x2022; AI responses se koi bhi financial ya technical decision lene se pehle professional advice lein</li>
              <li>&#x2022; AI outputs ka use aapke apne risk par hai</li>
            </ul>
          </div>
        </Section>

        <Section icon={MessageSquare} title="5. WhatsApp Communication Consent" color="bg-emerald-600">
          <ul className="list-none space-y-1">
            <li>&#x2714;&#xFE0F; App use karke aap WhatsApp updates receive karne ke liye consent dete hain</li>
            <li>&#x2714;&#xFE0F; Messages sirf business-related updates ke liye bheje jaate hain (spam nahi)</li>
            <li>&#x2714;&#xFE0F; Aap kabhi bhi "STOP" reply karke opt-out kar sakte hain</li>
            <li>&#x2714;&#xFE0F; DND requests turant process hoti hain</li>
            <li>&#x2714;&#xFE0F; Per-user rate limits active hain (maximum 1 message per 4 hours)</li>
          </ul>
        </Section>

        <Section icon={Server} title="6. Service Availability" color="bg-slate-600">
          <ul className="list-none space-y-1">
            <li>&#x2022; App aur services <strong>"as available"</strong> basis par provide ki jaati hain</li>
            <li>&#x2022; Scheduled ya unscheduled maintenance ke liye temporary downtime ho sakta hai</li>
            <li>&#x2022; AI services third-party APIs (Google Gemini) par depend karti hain — unki availability guaranteed nahi hai</li>
            <li>&#x2022; Critical business operations ke liye manual backup processes rakhein</li>
          </ul>
        </Section>

        <Section icon={Scale} title="7. Intellectual Property" color="bg-purple-600">
          <ul className="list-none space-y-1">
            <li>✔️ App ka content, design, aur code SAI RoloTech ka property hai</li>
            <li>✔️ Bina permission copy ya redistribute nahi kar sakte</li>
            <li>✔️ AI-generated quotes sirf aapke business use ke liye hain</li>
            <li>❌ App ko reverse engineer, decompile, ya modify nahi kar sakte</li>
          </ul>
        </Section>

        <Section icon={RefreshCw} title="8. Cancellation &amp; Refund Policy" color="bg-rose-500">
          <p><strong>Order Cancellation:</strong></p>
          <ul className="list-none space-y-1 mt-2">
            <li>✔️ Order date se 48 ghante ke andar: Full refund</li>
            <li>⚠️ 48 ghante baad, production shuru hone se pehle: 70% refund</li>
            <li>❌ Production shuru hone ke baad: Cancellation possible nahi</li>
          </ul>
          <p className="mt-3"><strong>App Subscription:</strong> Abhi yeh free hai. Future subscription ke liye alag terms batai jaayengi.</p>
        </Section>

        <Section icon={Scale} title="9. Governing Law" color="bg-slate-600">
          <ul className="list-none space-y-1">
            <li>✔️ Ye terms Indian law ke under governed hain</li>
            <li>✔️ Koi bhi dispute Delhi courts mein resolve hoga</li>
            <li>✔️ Consumer disputes ke liye consumer forum se contact kar sakte hain</li>
          </ul>
        </Section>

        <Section icon={Phone} title="10. Contact aur Grievance" color="bg-teal-600">
          <p>Terms se related sawaal ya complaint ke liye:</p>
          <div className="bg-teal-50 rounded-xl p-3 mt-2 space-y-1">
            <p>📧 <strong>Email:</strong> sairolotech@gmail.com</p>
            <p>📞 <strong>Phone:</strong> +91-9899925274</p>
            <p>⏰ <strong>Response time:</strong> 2 business days ke andar</p>
            <p>📍 <strong>Address:</strong> Plot No 575/1 G.F, Mundka Industrial Area, New Delhi 110041</p>
          </div>
        </Section>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
          <p className="text-slate-500 text-xs leading-relaxed">
            In terms ko accept karke aap confirm karte hain ki aapne inhe padha aur samjha hai.
            <br />
            <strong className="text-slate-700">Effective Date: March 29, 2026</strong>
          </p>
        </div>

      </main>

      <footer className="text-center py-6 text-slate-400 text-xs">
        © 2026 SAI RoloTech · New Delhi · India
      </footer>
    </div>
  );
}
