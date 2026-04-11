import { ArrowLeft, Shield, Eye, Database, Bell, Lock, Trash2, Mail, Camera, MapPin, Fingerprint, HardDrive, Wifi } from "lucide-react";

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

const PermissionRow = ({ icon, name, why }: { icon: string; name: string; why: string }) => (
  <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
    <span className="text-xl flex-shrink-0">{icon}</span>
    <div>
      <p className="text-slate-800 font-medium text-sm">{name}</p>
      <p className="text-slate-500 text-xs mt-0.5">{why}</p>
    </div>
  </div>
);

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => window.history.back()} aria-label="Go back"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-slate-800 font-semibold text-sm">Privacy Policy</h1>
            <p className="text-slate-400 text-xs">sairolotech.com · Last updated: March 2026</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">

        <div className="bg-blue-600 rounded-2xl p-5 text-white">
          <h2 className="text-lg font-bold mb-2">Aapki Privacy Hamari Zimmedari Hai</h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            SAI RoloTech ("hum", "hamare") aapki personal information ki suraksha ko bahut gambheerta se leta hai.
            Ye Privacy Policy explain karti hai ki hum kaunsa data collect karte hain, kyun, aur kaise use karte hain.
            This policy applies to the SAI RoloTech CRM mobile application and web platform.
          </p>
        </div>

        <Section icon={Shield} title="App Permissions — Kyun Zaruri Hain" color="bg-violet-600">
          <p className="text-slate-700 font-medium mb-3">
            Hamari app sirf wahi permissions maangti hai jo features ke liye actually zaruri hain:
          </p>
          <div className="space-y-2">
            <PermissionRow
              icon="📷"
              name="Camera"
              why="Machine ki photo kheench kar AI Photo Solution se problem diagnose karne ke liye. Sirf aapki permission ke baad use hota hai."
            />
            <PermissionRow
              icon="🖼️"
              name="Storage / Media Access"
              why="Machine photos upload karne ke liye gallery se image select karna. Koi bhi file automatically access nahi ki jaati."
            />
            <PermissionRow
              icon="📍"
              name="Location (Fine + Coarse)"
              why="Field engineer ka nearest service center dhundhne ke liye aur service visits ke location-based reports ke liye. Background mein use nahi hoti."
            />
            <PermissionRow
              icon="🔔"
              name="Notifications"
              why="Quotation status updates, maintenance reminders, aur important CRM alerts ke liye. Kabhi bhi band kar sakte hain."
            />
            <PermissionRow
              icon="🔐"
              name="Biometric / Fingerprint"
              why="Secure login ke liye (password ke badle fingerprint use kar sakte hain). Biometric data device pe rehta hai, hamare server pe nahi jaata."
            />
            <PermissionRow
              icon="🌐"
              name="Internet + Network State"
              why="Server se data sync karne ke liye — ye app ka basic function hai."
            />
            <PermissionRow
              icon="⏰"
              name="Wake Lock + Boot Receiver"
              why="Background sync aur scheduled reminders ke liye taaki aap important updates miss na karein."
            />
          </div>
          <p className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-700 mt-3">
            ✅ Koi bhi permission ka data hamare server pe store nahi hota siwaaye explicitly submitted information ke.
          </p>
        </Section>

        <Section icon={Database} title="Kaunsa Data Collect Karte Hain" color="bg-blue-600">
          <p><strong>Account Data:</strong> Name, email address, phone number (jab aap register karte hain)</p>
          <p><strong>Usage Data:</strong> App features jo aapne use kiye (quotation, maintenance guide, quality check)</p>
          <p><strong>Device Data:</strong> Device type, OS version, app version (crash reporting ke liye)</p>
          <p><strong>Photos:</strong> Machine photos jo aap AI diagnosis ke liye upload karte hain — processed aur delete ho jaate hain</p>
          <p><strong>Communication Data:</strong> Hamare saath aapka contact (email, WhatsApp — sirf aapki permission se)</p>
          <p className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-700">
            ✅ Hum aapka financial data, bank details, ya sensitive personal information <strong>kabhi collect nahi karte</strong>.
          </p>
        </Section>

        <Section icon={Database} title="AI Data Processing" color="bg-purple-600">
          <p><strong>AI Features:</strong> Hamari app Google Gemini AI use karti hai aapke queries ke jawab dene ke liye.</p>
          <ul className="space-y-1 list-none mt-2">
            <li>✔️ AI inputs (aapke questions) temporarily process hote hain — permanently store nahi hote</li>
            <li>✔️ AI responses validated aur filtered hote hain safety ke liye</li>
            <li>✔️ Machine photos jo AI diagnosis ke liye bhejte hain — processing ke baad delete ho jaate hain</li>
            <li>✔️ AI se generated quotations aapke account mein save hoti hain</li>
          </ul>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700 mt-3">
            ⚠️ AI-generated responses sirf guidance ke liye hain. Important business decisions ke liye professional advice zaroor lein.
          </div>
        </Section>

        <Section icon={Bell} title="WhatsApp Communication" color="bg-emerald-600">
          <p><strong>WhatsApp Messages:</strong> Hum WhatsApp Business API use karte hain aapko updates bhejne ke liye.</p>
          <ul className="space-y-1 list-none mt-2">
            <li>✔️ Messages sirf aapki consent ke baad bheje jaate hain</li>
            <li>✔️ Follow-up messages controlled schedule par hain (spam nahi)</li>
            <li>✔️ Per-user cooldown active hai — ek number par 4 ghante mein ek message</li>
            <li>✔️ Daily message limit set hai abuse prevention ke liye</li>
            <li>✔️ DND (Do Not Disturb) request hamesha respect ki jaati hai</li>
          </ul>
          <p className="mt-2"><strong>Opt-out:</strong> Kabhi bhi "STOP" reply karein ya app settings se WhatsApp notifications band karein.</p>
        </Section>

        <Section icon={Eye} title="Data Ka Use Kaise Karte Hain" color="bg-indigo-600">
          <ul className="space-y-1 list-none">
            <li>✔️ Aapko relevant machine quotes aur recommendations bhejne ke liye</li>
            <li>✔️ AI-based machine diagnosis aur solutions provide karne ke liye</li>
            <li>✔️ App features improve karne ke liye (anonymized usage stats)</li>
            <li>✔️ Technical support provide karne ke liye</li>
            <li>✔️ Important updates aur security alerts bhejne ke liye</li>
            <li>✔️ Field engineer location-based service routing ke liye</li>
          </ul>
          <p className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 mt-3">
            ❌ Hum aapka data <strong>kabhi third parties ko nahi bechte</strong> ya share nahi karte (court order ke alawa).
          </p>
        </Section>

        <Section icon={Bell} title="Notifications aur Marketing" color="bg-amber-500">
          <p>Hum aapko notifications tab hi bhejte hain jab:</p>
          <ul className="space-y-1 list-none mt-2">
            <li>✔️ Aapne notification permission di ho</li>
            <li>✔️ Content genuinely useful ho (machine updates, quote status)</li>
            <li>✔️ Maximum 1-2 notifications per day</li>
          </ul>
          <p className="mt-2"><strong>Opt-out:</strong> Kabhi bhi app settings se notifications band karein. Hum turant band kar denge.</p>
        </Section>

        <Section icon={Lock} title="Data Security" color="bg-green-600">
          <p>Aapka data protect karne ke liye hum ye use karte hain:</p>
          <ul className="space-y-1 list-none mt-2">
            <li>✔️ SHA-256 password hashing (passwords kabhi plain text mein save nahi)</li>
            <li>✔️ HTTPS/TLS encryption (saare data transfer encrypted hain)</li>
            <li>✔️ Rate limiting (brute force attacks se protection)</li>
            <li>✔️ Session tokens (secure aur time-limited)</li>
            <li>✔️ Biometric data device pe hi rehta hai — server pe nahi jaata</li>
          </ul>
        </Section>

        <Section icon={Trash2} title="Aapke Rights" color="bg-rose-500">
          <p>Aapko ye rights hain:</p>
          <ul className="space-y-1 list-none mt-2">
            <li>✔️ <strong>Access:</strong> Apna data dekhne ka haq</li>
            <li>✔️ <strong>Correction:</strong> Galat information fix karwana</li>
            <li>✔️ <strong>Deletion:</strong> Apna account aur data delete karwana</li>
            <li>✔️ <strong>Portability:</strong> Apna data export karna</li>
            <li>✔️ <strong>Opt-out:</strong> Marketing communications se bahar nikalna</li>
            <li>✔️ <strong>Permission Revoke:</strong> Kabhi bhi Android Settings se koi bhi permission hatao</li>
          </ul>
          <p className="mt-2">Request ke liye email karein: <strong>sairolotech@gmail.com</strong></p>
        </Section>

        <Section icon={Mail} title="Contact Us" color="bg-slate-600">
          <p>Privacy se related koi bhi sawaal ke liye:</p>
          <div className="bg-slate-50 rounded-xl p-3 mt-2 space-y-1">
            <p>📧 <strong>Email:</strong> sairolotech@gmail.com</p>
            <p>📞 <strong>Phone:</strong> +91-9899925274</p>
            <p>📍 <strong>Address:</strong> Plot No 575/1 G.F, Mundka Industrial Area, New Delhi 110041</p>
          </div>
        </Section>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
          <p className="text-slate-500 text-xs leading-relaxed">
            Is app ka use karke aap is Privacy Policy se agree karte hain.
            Policy mein changes hone par aapko notify kiya jaayega.
            <br />
            <strong className="text-slate-700">Effective Date: March 1, 2026</strong>
          </p>
        </div>

      </main>

      <footer className="text-center py-6 text-slate-400 text-xs">
        © 2026 SAI RoloTech · sairolotech.com · New Delhi · India
      </footer>
    </div>
  );
}
