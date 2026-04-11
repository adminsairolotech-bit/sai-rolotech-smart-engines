import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Bot, Wrench, FileText, Bell, Shield, CheckCircle2 } from "lucide-react";

const SLIDES = [
  {
    id: 0,
    icon: (
      <svg viewBox="0 0 120 120" className="w-36 h-36 mx-auto" aria-hidden="true">
        <circle cx="60" cy="60" r="55" fill="#EFF6FF" />
        <rect x="25" y="35" width="70" height="50" rx="8" fill="#DBEAFE" />
        <rect x="32" y="42" width="56" height="36" rx="4" fill="white" />
        <rect x="38" y="50" width="24" height="4" rx="2" fill="#3B82F6" />
        <rect x="38" y="58" width="40" height="3" rx="1.5" fill="#CBD5E1" />
        <rect x="38" y="64" width="32" height="3" rx="1.5" fill="#CBD5E1" />
        <circle cx="75" cy="72" r="10" fill="#3B82F6" />
        <text x="75" y="76" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">SR</text>
        <rect x="38" y="90" width="44" height="6" rx="3" fill="#93C5FD" />
      </svg>
    ),
    gradient: "from-blue-600 to-indigo-600",
    bg: "from-blue-50 via-white to-indigo-50",
    badge: "🙏 Swagat Hai",
    title: "SAI RoloTech CRM",
    subtitle: "India ka trusted Roll Forming Machine partner",
    desc: "Ek jagah par sab kuch — machine quotes, maintenance guide, quality check, aur bahut kuch. Bilkul free!",
    consent: false,
  },
  {
    id: 1,
    icon: (
      <svg viewBox="0 0 120 120" className="w-36 h-36 mx-auto" aria-hidden="true">
        <circle cx="60" cy="60" r="55" fill="#F0FDF4" />
        <rect x="20" y="30" width="80" height="65" rx="8" fill="#DCFCE7" />
        <rect x="27" y="38" width="66" height="50" rx="4" fill="white" />
        <rect x="33" y="45" width="50" height="3" rx="1.5" fill="#16A34A" />
        <rect x="33" y="52" width="35" height="2.5" rx="1.5" fill="#CBD5E1" />
        <rect x="33" y="57" width="42" height="2.5" rx="1.5" fill="#CBD5E1" />
        <line x1="33" y1="66" x2="77" y2="66" stroke="#E2E8F0" strokeWidth="1" />
        <rect x="33" y="70" width="20" height="2.5" rx="1.5" fill="#CBD5E1" />
        <rect x="57" y="70" width="20" height="2.5" rx="1.5" fill="#CBD5E1" />
        <rect x="33" y="75" width="20" height="2.5" rx="1.5" fill="#CBD5E1" />
        <rect x="57" y="75" width="20" height="2.5" rx="1.5" fill="#CBD5E1" />
        <rect x="33" y="80" width="20" height="2.5" rx="1.5" fill="#CBD5E1" />
        <rect x="57" y="80" width="20" height="6" rx="2" fill="#16A34A" />
        <circle cx="87" cy="35" r="12" fill="#16A34A" />
        <text x="87" y="39" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">₹</text>
      </svg>
    ),
    gradient: "from-emerald-600 to-green-600",
    bg: "from-emerald-50 via-white to-green-50",
    badge: "⚡ Instant",
    title: "AI Quotation — 30 Seconds Mein",
    subtitle: "Official SAI RoloTech format mein professional quote",
    desc: "Machine ka naam likhein — AI turant letterhead, GST breakdown, bank details ke saath complete quotation generate karega. Print ya PDF bhi kar sakte hain!",
    consent: false,
  },
  {
    id: 2,
    icon: (
      <svg viewBox="0 0 120 120" className="w-36 h-36 mx-auto" aria-hidden="true">
        <circle cx="60" cy="60" r="55" fill="#FFF7ED" />
        <rect x="22" y="38" width="76" height="48" rx="8" fill="#FED7AA" />
        <rect x="30" y="46" width="60" height="32" rx="4" fill="white" />
        <circle cx="48" cy="58" r="8" fill="#FB923C" />
        <rect x="62" y="54" width="22" height="3" rx="1.5" fill="#CBD5E1" />
        <rect x="62" y="60" width="16" height="3" rx="1.5" fill="#E2E8F0" />
        <rect x="30" y="66" width="60" height="1" stroke="#F1F5F9" fill="#F1F5F9" />
        <circle cx="48" cy="74" r="8" fill="#F97316" />
        <rect x="62" y="70" width="22" height="3" rx="1.5" fill="#CBD5E1" />
        <rect x="62" y="76" width="16" height="3" rx="1.5" fill="#E2E8F0" />
        <path d="M 44 56 L 48 60 L 54 53" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    ),
    gradient: "from-orange-500 to-amber-500",
    bg: "from-orange-50 via-white to-amber-50",
    badge: "🔧 Helpful",
    title: "Machine Help & Maintenance",
    subtitle: "Expert guidance aapki pocket mein",
    desc: "Roll forming machine ki koi bhi problem — maintenance schedule, troubleshooting, quality check — sab kuch step-by-step guide mil jaata hai bina kisi call ke.",
    consent: false,
  },
  {
    id: 3,
    icon: (
      <svg viewBox="0 0 120 120" className="w-36 h-36 mx-auto" aria-hidden="true">
        <circle cx="60" cy="60" r="55" fill="#F5F3FF" />
        <path d="M 60 28 C 44 28 32 40 32 56 L 32 72 L 24 80 L 96 80 L 88 72 L 88 56 C 88 40 76 28 60 28 Z" fill="#DDD6FE" />
        <rect x="50" y="80" width="20" height="6" rx="3" fill="#7C3AED" />
        <circle cx="60" cy="28" r="5" fill="#7C3AED" />
        <path d="M 60 28 C 44 28 32 40 32 56 L 32 72 L 24 80 L 96 80 L 88 72 L 88 56 C 88 40 76 28 60 28 Z" fill="#C4B5FD" opacity="0.5" />
        <circle cx="60" cy="55" r="12" fill="white" />
        <path d="M 55 55 L 59 59 L 67 49" stroke="#7C3AED" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    gradient: "from-violet-600 to-purple-600",
    bg: "from-violet-50 via-white to-purple-50",
    badge: "🔐 Your Privacy",
    title: "Aapka Data, Aapka Control",
    subtitle: "Transparent aur secure — koi hidden tracking nahi",
    desc: "Hum sirf zaroori data collect karte hain (naam, phone). Aapki bina permission ke koi message nahi. Notifications kabhi bhi band kar sakte hain.",
    consent: true,
  },
];

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  function goTo(idx: number) {
    setDir(idx > current ? 1 : -1);
    setCurrent(idx);
  }

  function next() {
    if (isLast) {
      if (!agreed) { setTouched(true); return; }
      localStorage.setItem("sai_crm_onboarded", "true");
      setLocation("/login");
    } else {
      goTo(current + 1);
    }
  }

  function skip() {
    localStorage.setItem("sai_crm_onboarded", "true");
    setLocation("/login");
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${slide.bg} flex flex-col transition-all duration-500 relative overflow-hidden`}>

      {/* Skip button (not on last slide) */}
      {!isLast && (
        <div className="absolute top-4 right-4 z-10">
          <button onClick={skip} className="text-slate-400 text-sm px-3 py-1.5 rounded-lg hover:bg-white/60 hover:text-slate-600 transition-colors">
            Skip
          </button>
        </div>
      )}

      {/* Background blob */}
      <div className={`absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br ${slide.gradient} opacity-10 blur-3xl pointer-events-none`} />
      <div className={`absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-br ${slide.gradient} opacity-10 blur-3xl pointer-events-none`} />

      {/* Slides area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-4 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={current}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col items-center text-center w-full max-w-xs"
          >
            {/* Illustration */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="mb-6"
            >
              {slide.icon}
            </motion.div>

            {/* Badge */}
            <span className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${slide.gradient} text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 shadow-sm`}>
              {slide.badge}
            </span>

            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-800 mb-2 leading-snug">
              {slide.title}
            </h1>
            <p className={`text-sm font-semibold bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent mb-3`}>
              {slide.subtitle}
            </p>
            <p className="text-slate-500 text-sm leading-relaxed">
              {slide.desc}
            </p>

            {/* Consent checkbox on last slide */}
            {slide.consent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-5 w-full"
              >
                <div className={`bg-white border-2 ${touched && !agreed ? "border-red-300 bg-red-50" : "border-slate-200"} rounded-2xl p-4 shadow-sm`}>
                  <label className="flex items-start gap-3 cursor-pointer" htmlFor="consent">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        id="consent"
                        checked={agreed}
                        onChange={e => { setAgreed(e.target.checked); setTouched(false); }}
                        className="sr-only"
                      />
                      <div
                        onClick={() => { setAgreed(a => !a); setTouched(false); }}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer
                          ${agreed ? "bg-violet-600 border-violet-600" : "border-slate-300 bg-white"}`}
                      >
                        {agreed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <span className="text-slate-600 text-xs leading-relaxed">
                      Main agree karta/karti hoon ki SAI RoloTech mera naam aur phone app features improve karne ke liye use kare.{" "}
                      <a href="/privacy-policy" className="text-violet-600 underline font-medium">Privacy Policy</a>{" "}
                      aur{" "}
                      <a href="/terms" className="text-violet-600 underline font-medium">Terms</a>{" "}
                      padhh li hain.
                    </span>
                  </label>
                  {touched && !agreed && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Aage badhne ke liye agree karna zaroori hai
                    </p>
                  )}
                </div>

                {/* Data transparency note */}
                <div className="mt-3 flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5">
                  <Bell className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                  <p className="text-violet-700 text-xs leading-relaxed">
                    We use your data to improve your experience and provide relevant assistance. Notifications kabhi bhi band kar sakte hain.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="px-6 pb-10 pt-2">

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mb-6" role="tablist" aria-label="Onboarding slides">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`Slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? `w-6 h-2.5 bg-gradient-to-r ${slide.gradient} shadow-sm`
                  : "w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        {/* Next / Get Started button */}
        <button
          onClick={next}
          className={`w-full py-4 rounded-2xl font-semibold text-white text-base shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95
            bg-gradient-to-r ${slide.gradient} hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500`}
        >
          {isLast ? (
            <>
              <Shield className="w-5 h-5" />
              Shuru Karein — Get Started
            </>
          ) : (
            <>
              Aage Chalein
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Policy links at bottom */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <a href="/privacy-policy" className="text-slate-400 text-xs hover:text-slate-600 hover:underline transition-colors">Privacy Policy</a>
          <span className="text-slate-300">·</span>
          <a href="/terms" className="text-slate-400 text-xs hover:text-slate-600 hover:underline transition-colors">Terms</a>
          <span className="text-slate-300">·</span>
          <a href="/support" className="text-slate-400 text-xs hover:text-slate-600 hover:underline transition-colors">Support</a>
        </div>
      </div>
    </div>
  );
}
