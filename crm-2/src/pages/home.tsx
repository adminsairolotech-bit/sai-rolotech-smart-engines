import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Cpu, MapPin, FileText, MessageSquare, Phone, Mail, Star,
  Shield, ChevronRight, Wrench, Package2, BarChart3, Zap,
  Factory, Settings, LogOut, User, Bot, Sparkles, IndianRupee,
  Search, ThumbsUp, Upload, Settings2, ClipboardList, ScrollText, Rocket, Scale
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const featureCategories = [
  {
    title: "🏭 Hamare Products",
    accent: "blue",
    items: [
      { icon: Cpu, label: "Machine Catalog", desc: "PLC, HMI, SCADA, VFD, Servo Motors dekhein", href: "/machines" },
      { icon: Package2, label: "Supplier Network", desc: "Raw material suppliers ki list", href: "/suppliers" },
      { icon: Factory, label: "Roll Forming Machines", desc: "Industrial roll forming solutions", href: "/machines" },
    ],
  },
  {
    title: "📋 Services & Support",
    accent: "cyan",
    items: [
      { icon: Wrench, label: "Service Request", desc: "Machine repair ya maintenance book karein", href: "/service-manager" },
      { icon: FileText, label: "Quotation Maangein", desc: "Price quote ke liye request karein", href: "/quotation-maker" },
      { icon: Settings, label: "Demo Schedule", desc: "Machine demo book karein", href: "/demo-scheduler" },
    ],
  },
  {
    title: "🤖 AI Assistant",
    accent: "violet",
    items: [
      { icon: MessageSquare, label: "Buddy AI Chat", desc: "Hinglish mein koi bhi sawaal poochein", href: "/buddy" },
      { icon: Zap, label: "Smart Quotations", desc: "AI se instant price estimate", href: "/quotation-maker" },
      { icon: Star, label: "Lead Intelligence", desc: "Business opportunities track karein", href: "/lead-intelligence" },
    ],
  },
  {
    title: "📍 Location & Contact",
    accent: "amber",
    items: [
      { icon: MapPin, label: "Showroom Map", desc: "Hamare showrooms ka location dekhein", href: "/map-view" },
      { icon: Star, label: "Rate Us", desc: "Products aur services ko rating dein", href: "/ratings" },
      { icon: Phone, label: "Contact Us", desc: "+91-9899925274 · sairolotech@gmail.com", href: "/feedback" },
    ],
  },
];

const accentMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   iconBg: "bg-blue-600" },
  cyan:   { bg: "bg-cyan-50",   text: "text-cyan-700",   border: "border-cyan-200",   iconBg: "bg-cyan-600" },
  violet: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", iconBg: "bg-violet-600" },
  amber:  { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  iconBg: "bg-amber-500" },
};

const aiCards = [
  {
    href: "/ai-quote",
    gradient: "from-violet-600 to-blue-600",
    shadow: "shadow-violet-200",
    icon: Bot,
    badge: "✨ AI Powered",
    badgeColor: "bg-yellow-100 text-yellow-700",
    title: "AI Quotation Maker",
    desc: "Requirements batayein — professional quotation instantly taiyar",
    chip: "Instant Quote",
  },
  {
    href: "/quote-analyzer",
    gradient: "from-blue-600 to-cyan-600",
    shadow: "shadow-blue-200",
    icon: Search,
    badge: "🔍 Smart Analysis",
    badgeColor: "bg-cyan-100 text-cyan-700",
    title: "AI Quotation Analyzer",
    desc: "Kisi bhi company ki quote paste karein — AI batayega kya sahi, kya galat",
    chip: "Pro & Con Report",
  },
];

const toolCards = [
  {
    href: "/machine-guide",
    gradient: "from-orange-500 to-red-500",
    shadow: "shadow-orange-200",
    icon: Settings2,
    badge: "🔧 AI Master",
    title: "Machine Troubleshooter",
    desc: "Strip left/right/upar? Wave? Twist? — AI Master step-by-step fix batayega",
    chip: "Instant Fix",
  },
  {
    href: "/ai-quality-checker",
    gradient: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-200",
    icon: Scale,
    badge: "🏅 Quality Grade",
    title: "AI Quality Checker",
    desc: "Machine grades compare karo — Basic, Medium, Advance specs comparison",
    chip: "Compare Grades",
  },
  {
    href: "/custom-profile",
    gradient: "from-emerald-500 to-teal-500",
    shadow: "shadow-emerald-200",
    icon: Factory,
    badge: "📐 Roll Forming",
    title: "Custom Profile Inquiry",
    desc: "DXF/DWG/PDF upload · Thickness, Width, Punching select karein",
    chip: "Upload Profile",
  },
  {
    href: "/maintenance-guide",
    gradient: "from-amber-500 to-yellow-500",
    shadow: "shadow-amber-200",
    icon: ClipboardList,
    badge: "📋 Maintenance",
    title: "Maintenance Guide",
    desc: "Daily, Weekly, Monthly schedule · Checklist · Spare parts guide",
    chip: "Full Schedule",
  },
];

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setLocation("/login");
    toast({ title: "Logged out", description: "Aap successfully logout ho gaye hain." });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-violet-300/8 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">SR</span>
            </div>
            <div>
              <h1 className="text-slate-800 font-semibold text-sm leading-tight">SAI RoloTech</h1>
              <p className="text-slate-400 text-xs">Design Engine Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocation("/role-select")}
              aria-label="Profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-sm transition-colors"
            >
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline font-medium">{user?.name?.split(" ")[0] || "Profile"}</span>
            </button>
            <button
              onClick={handleLogout}
              aria-label="Logout"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-500 text-sm transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 py-8">

        {/* Welcome hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-4">
            <Star className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
            <span className="text-blue-600 text-sm font-medium">Welcome to SAI RoloTech Portal</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
            Namaste, {user?.name?.split(" ")[0] || "User"}! 🙏
          </h2>
          <p className="text-slate-500 text-base max-w-2xl mx-auto leading-relaxed">
            SAI RoloTech ke portal mein aapka swagat hai. Yahan se aap hamare sabhi products, services aur AI tools access kar sakte hain.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
            <button
              onClick={() => setLocation("/buddy")}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              Buddy AI se baat karein
            </button>
            <button
              onClick={() => setLocation("/machines")}
              className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-medium transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <Cpu className="w-4 h-4" aria-hidden="true" />
              Products dekhein
            </button>
          </div>
        </motion.div>

        {/* Design Engine Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="mb-5 relative overflow-hidden rounded-2xl border border-blue-200 shadow-xl shadow-blue-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-white/10 blur-2xl" />
          </div>
          <div className="relative px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-lg">
                  <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute" aria-hidden="true" />
                  <Settings2 className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-blue-100 text-xs font-bold uppercase tracking-widest">SAI RoloTech</span>
                  <span className="flex items-center gap-1 bg-white/20 border border-white/30 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    <Zap className="w-3 h-3" aria-hidden="true" /> Powered by AI
                  </span>
                </div>
                <h3 className="text-white text-lg sm:text-xl font-extrabold leading-tight tracking-tight">
                  Custom Design Engine — <span className="text-yellow-300">Koi Bhi Profile</span>, Asaani Se!
                </h3>
                <p className="text-blue-100 text-sm mt-1 leading-relaxed">
                  Advanced design engine se kisi bhi tarah ka profile — C, Z, U, T, Omega, Custom — minutes mein design karein.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-3 py-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                    <span className="text-white text-xs font-bold">92% Accuracy</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-3 py-1">
                    <BarChart3 className="w-3 h-3 text-blue-200" aria-hidden="true" />
                    <span className="text-white text-xs font-bold">500+ Profiles Tested</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-3 py-1">
                    <Star className="w-3 h-3 text-yellow-300" aria-hidden="true" />
                    <span className="text-white text-xs font-bold">Industry Proven</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 self-center">
                <button
                  onClick={() => setLocation("/custom-profile")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-700 rounded-xl text-sm font-bold transition-all shadow-lg whitespace-nowrap group focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
                >
                  Try Karein
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap gap-3 text-xs text-blue-200" aria-label="Supported profiles">
              {["C-Purlin", "Z-Purlin", "Roofing Sheet", "Cable Tray", "Floor Deck", "Door Frame", "Solar Frame", "Custom Profile"].map((p) => (
                <span key={p} className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-blue-300 inline-block" aria-hidden="true" />{p}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Project Report Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="mb-4">
          <button
            onClick={() => setLocation("/project-report")}
            className="relative w-full overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-2xl p-5 text-left transition-all duration-300 group shadow-xl shadow-emerald-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            aria-label="AI Project Report Generator"
          >
            <div className="absolute top-3 right-4 text-xl opacity-50 group-hover:opacity-100 transition-opacity" aria-hidden="true">🏦📋💰</div>
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <ScrollText className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <IndianRupee className="w-3 h-3 text-green-100" aria-hidden="true" />
                  <span className="text-green-100 text-xs font-bold uppercase tracking-wider">PMEGP · MSME · Bank Loan</span>
                  <span className="bg-white/20 border border-white/30 text-white text-xs px-1.5 py-0.5 rounded font-medium">AI Powered</span>
                </div>
                <h3 className="text-white text-base font-bold leading-tight">AI Project Report Generator</h3>
                <p className="text-green-100/80 text-xs mt-0.5">4 steps mein details bharen → Bank-ready professional project report milegi</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" aria-hidden="true" />
            </div>
          </button>
        </motion.div>

        {/* AI Cards (2-col) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {aiCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.href}
                onClick={() => setLocation(card.href)}
                className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} hover:opacity-90 rounded-2xl p-5 text-left transition-all duration-300 group shadow-xl ${card.shadow} focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2`}
                aria-label={card.title}
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block ${card.badgeColor}`}>{card.badge}</span>
                  <h3 className="text-white text-base font-bold leading-tight mt-1">{card.title}</h3>
                  <p className="text-white/80 text-xs mt-1">{card.desc}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 text-white text-xs font-medium">{card.chip}</span>
                    <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" aria-hidden="true" />
                  </div>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Tool Cards (2-col) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {toolCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.href}
                onClick={() => setLocation(card.href)}
                className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} hover:opacity-90 rounded-2xl p-5 text-left transition-all duration-300 group shadow-xl ${card.shadow} focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2`}
                aria-label={card.title}
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <span className="text-white/80 text-xs font-semibold mb-1 block">{card.badge}</span>
                  <h3 className="text-white text-base font-bold leading-tight">{card.title}</h3>
                  <p className="text-white/75 text-xs mt-1">{card.desc}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 text-white text-xs font-medium">{card.chip}</span>
                    <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" aria-hidden="true" />
                  </div>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Feature categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {featureCategories.map((category, catIndex) => {
            const ac = accentMap[category.accent];
            return (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIndex * 0.1 + 0.3 }}
                className={`bg-white border ${ac.border} rounded-2xl p-5 shadow-sm`}
              >
                <h3 className="text-slate-800 font-semibold text-base mb-4">{category.title}</h3>
                <div className="space-y-2">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => setLocation(item.href)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group text-left focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                      >
                        <div className={`w-9 h-9 rounded-lg ${ac.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <Icon className="w-[18px] h-[18px] text-white" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-700 text-sm font-medium">{item.label}</div>
                          <div className="text-slate-400 text-xs truncate">{item.desc}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Admin CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-600" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-slate-800 font-semibold text-sm">Admin / Staff hain?</h4>
              <p className="text-slate-500 text-xs">Full CRM access ke liye admin panel mein jayein</p>
            </div>
          </div>
          <button
            onClick={() => setLocation("/select-mode")}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-all whitespace-nowrap shadow-sm shadow-amber-200 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          >
            <Rocket className="w-4 h-4" aria-hidden="true" />
            CRM Admin Panel
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Products", value: "50+", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
            { label: "Cities", value: "25+", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "Clients", value: "500+", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-xl p-4 text-center`}>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-slate-500 text-sm mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Footer contact */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400 pb-6">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            +91-9899925274
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            sairolotech@gmail.com
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            Mundka, New Delhi
          </div>
        </div>
      </main>
    </div>
  );
}
