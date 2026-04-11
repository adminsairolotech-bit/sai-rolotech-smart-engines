import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Zap, Star, BarChart3, Shield, Settings2,
  ArrowRight, Play, CheckCircle, Cpu, Layers, Gauge, LogIn
} from "lucide-react";

const PROFILES = ["C-Purlin", "Z-Purlin", "Roofing Sheet", "Cable Tray", "Floor Deck", "Door Frame", "Solar Frame", "Omega", "U-Channel", "T-Section", "Hat Profile", "Custom Shape"];

const STATS = [
  { value: "92%", label: "Design Accuracy", sub: "AI-powered precision", color: "from-blue-500 to-indigo-600", icon: Gauge },
  { value: "500+", label: "Profiles Tested", sub: "Industry validated", color: "from-emerald-500 to-green-600", icon: CheckCircle },
  { value: "10x", label: "Faster Design", sub: "Than manual method", color: "from-orange-500 to-amber-600", icon: Zap },
  { value: "15+", label: "Years Experience", sub: "Roll forming expertise", color: "from-violet-500 to-purple-600", icon: Star },
];

const FEATURES = [
  { icon: Cpu, title: "AI-Powered Engine", desc: "Machine learning se koi bhi profile ka accurate estimate milta hai — bilkul seconds mein.", color: "bg-blue-50 border-blue-200", iconColor: "text-blue-600", badge: "AI" },
  { icon: Layers, title: "500+ Profile Library", desc: "C, Z, U, T, Omega, Roofing, Cable Tray, Floor Deck — sabhi standard profiles ek jagah.", color: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-600", badge: "Library" },
  { icon: Settings2, title: "Custom Profile Builder", desc: "Apna khud ka custom profile design karein — DXF/DWG upload ya dimensions type karein.", color: "bg-orange-50 border-orange-200", iconColor: "text-orange-600", badge: "Custom" },
  { icon: Shield, title: "Bank-Ready Reports", desc: "PMEGP/MSME loan ke liye project report automatically generate hoti hai.", color: "bg-violet-50 border-violet-200", iconColor: "text-violet-600", badge: "Reports" },
];

function ProfileTicker() {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % PROFILES.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 bg-white/80 border border-blue-100 rounded-full px-4 py-2 shadow-sm">
      <span className="text-gray-500 text-sm">Designing:</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="text-blue-700 font-bold text-sm min-w-[100px]"
        >
          {PROFILES[current]}
        </motion.span>
      </AnimatePresence>
      <span className="flex gap-0.5">
        {[...Array(3)].map((_, i) => (
          <motion.span key={i} className="w-1 h-1 rounded-full bg-blue-500"
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
        ))}
      </span>
    </div>
  );
}

function AnimatedGear({ size = 80, speed = 8, reverse = false, opacity = 0.12 }: { size?: number; speed?: number; reverse?: boolean; opacity?: number }) {
  return (
    <motion.div
      animate={{ rotate: reverse ? [0, -360] : [0, 360] }}
      transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      style={{ width: size, height: size, opacity }}
      className="text-blue-600"
    >
      <Settings2 className="w-full h-full" />
    </motion.div>
  );
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 overflow-x-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-400/10 to-indigo-400/10 blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-400/8 to-cyan-400/8 blur-3xl translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-20 left-8 opacity-[0.07]"><AnimatedGear size={160} speed={25} /></div>
        <div className="absolute top-40 right-12 opacity-[0.06]"><AnimatedGear size={100} speed={18} reverse /></div>
        <div className="absolute bottom-32 left-1/3 opacity-[0.05]"><AnimatedGear size={120} speed={20} /></div>
        <div className="absolute bottom-16 right-8 opacity-[0.07]"><AnimatedGear size={90} speed={15} reverse /></div>
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/25">
            <span className="text-white text-sm font-extrabold tracking-tight">SR</span>
          </div>
          <div>
            <span className="text-gray-900 font-bold text-sm tracking-tight">SAI RoloTech</span>
            <div className="text-blue-600 text-[10px] font-semibold uppercase tracking-widest leading-none">Design Engine</div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <button onClick={() => setLocation("/login")}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-700 rounded-xl text-sm font-medium transition-all shadow-sm">
            <LogIn className="w-4 h-4" /> Login
          </button>
          <button onClick={() => setLocation("/register")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/25">
            Shuru Karein <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20">

        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-200 text-blue-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" />
            India Ka #1 Roll Forming Design Engine
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            Koi Bhi Profile<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
              Design Karein Asaani Se
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-gray-500 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            SAI RoloTech ka advanced AI Design Engine — <strong className="text-gray-700">92% accuracy</strong> ke saath kisi bhi roll forming profile ka spec, cost aur report minutes mein taiyar kare. <strong className="text-gray-700">500+ profiles</strong> par tested.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="flex justify-center mb-8">
            <ProfileTicker />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => setLocation("/register")}
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-lg font-bold transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5">
              Abhi Try Karein — Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => setShowVideo(true)}
              className="flex items-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-2xl text-base font-semibold transition-all shadow-md hover:shadow-lg">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
                <Play className="w-4 h-4 text-white ml-0.5" />
              </div>
              Kaise Kaam Karta Hai
            </button>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-20">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.value} whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}
                className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-3 shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">{stat.value}</div>
                <div className="text-gray-700 text-sm font-semibold mt-0.5">{stat.label}</div>
                <div className="text-gray-400 text-xs mt-0.5">{stat.sub}</div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">Yeh Kya Kar Sakta Hai?</h2>
            <p className="text-gray-500 mt-2">Ek hi platform mein — design, cost, quotation, aur loan report</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} whileHover={{ y: -3 }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 + i * 0.08 }}
                  className={`${f.color} border rounded-2xl p-6 flex gap-4 items-start group hover:shadow-md transition-all`}>
                  <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${f.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-gray-900 font-bold">{f.title}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/70 ${f.iconColor}`}>{f.badge}</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900">Kaise Kaam Karta Hai?</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-0 items-stretch">
            {[
              { step: "1", title: "Account Banayein", desc: "Free registration, 2 minute mein ready", color: "from-blue-500 to-blue-600" },
              { step: "2", title: "Profile Select Karein", desc: "500+ profiles mein se choose karein ya custom upload karein", color: "from-indigo-500 to-indigo-600" },
              { step: "3", title: "AI Report Milegi", desc: "Machine spec, cost estimate, aur project report instantly", color: "from-violet-500 to-violet-600" },
            ].map((s, i) => (
              <div key={s.step} className="flex-1 flex flex-col sm:flex-row items-stretch">
                <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-3 shadow-md`}>
                    {s.step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-sm">{s.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden sm:flex items-center px-2">
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-8 sm:p-12 text-center shadow-2xl shadow-blue-500/30">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-12 -right-12 opacity-10"><AnimatedGear size={150} speed={20} /></div>
            <div className="absolute -bottom-12 -left-12 opacity-10"><AnimatedGear size={120} speed={15} reverse /></div>
          </div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-white/90 text-sm font-semibold mb-5">
              <Star className="w-3.5 h-3.5" /> India Ka Best Roll Forming Software
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Apna Business Aage Badhao
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
              SAI RoloTech Design Engine se apne customers ko <strong className="text-white">professional quotations</strong> aur <strong className="text-white">bank-ready reports</strong> dein — aaj se!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => setLocation("/register")}
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-0.5">
                Free Mein Shuru Karein
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => setLocation("/login")}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-2xl font-semibold text-lg transition-all">
                <LogIn className="w-5 h-5" /> Login Karein
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-gray-100 bg-white/50 backdrop-blur-sm py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">SR</span>
            </div>
            <span className="text-gray-600 text-sm">SAI RoloTech · Pune, Maharashtra</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>© 2025 SAI RoloTech</span>
            <span>·</span>
            <span>Industrial Automation Solutions</span>
            <span>·</span>
            <span>+91 98765 43210</span>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showVideo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowVideo(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                <Settings2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-gray-900 font-bold text-xl mb-2">Demo Video Coming Soon!</h3>
              <p className="text-gray-500 text-sm mb-6">Abhi seedha try karein — register karke Design Engine use karein.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowVideo(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors">Wapas</button>
                <button onClick={() => { setShowVideo(false); setLocation("/register"); }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all">
                  Register Karein
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
