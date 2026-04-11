import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Cpu, Package2, Wrench, Star, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth, type UserType } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const roles = [
  {
    id: "new_user" as UserType,
    icon: Star,
    emoji: "🌟",
    title: "New SAI RoloTech User",
    hindiTitle: "Naya SAI RoloTech User",
    description: "Hum SAI RoloTech ke baare mein jaanna chahte hain – machines, products aur services explore karein.",
    gradient: "from-violet-500 to-purple-600",
    selectedBg: "bg-violet-50 border-violet-400",
    iconBg: "bg-violet-100",
    iconText: "text-violet-600",
    destination: "/home",
  },
  {
    id: "machine_user" as UserType,
    icon: Cpu,
    emoji: "⚙️",
    title: "SAI RoloTech Machine User",
    hindiTitle: "Machine Operator / Employee",
    description: "Main SAI RoloTech mein kaam karta hoon ya humare machines use karta hoon.",
    gradient: "from-blue-500 to-cyan-600",
    selectedBg: "bg-blue-50 border-blue-400",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
    destination: "/",
  },
  {
    id: "supplier" as UserType,
    icon: Package2,
    emoji: "📦",
    title: "G.P Raw Material Supplier",
    hindiTitle: "Kaccha Maal Supplier",
    description: "Main SAI RoloTech ko raw material supply karta hoon – Gauge Plates, Steel, etc.",
    gradient: "from-emerald-500 to-teal-600",
    selectedBg: "bg-emerald-50 border-emerald-400",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    destination: "/map-view",
  },
  {
    id: "operator" as UserType,
    icon: Wrench,
    emoji: "🔧",
    title: "Roll Forming Machine Operator",
    hindiTitle: "Roll Forming Operator",
    description: "Main Roll Forming Machine operate karta hoon aur operations manage karta hoon.",
    gradient: "from-orange-500 to-amber-600",
    selectedBg: "bg-orange-50 border-orange-400",
    iconBg: "bg-orange-100",
    iconText: "text-orange-600",
    destination: "/home",
  },
];

export default function RoleSelectPage() {
  const [, setLocation] = useLocation();
  const { user, setUserType } = useAuth();
  const [selected, setSelected] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) {
      toast({ title: "Role chunein", description: "Aage badhne ke liye ek option select karein.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setUserType(selected);
    await new Promise((r) => setTimeout(r, 400));
    const role = roles.find((r) => r.id === selected);
    setLoading(false);
    toast({ title: "Profile set ho gaya! 🎉", description: `Welcome ${user?.name}! Aapka account ready hai.` });
    setLocation(role?.destination || "/home");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-200/20 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 rounded-full bg-emerald-200/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-4 shadow-lg shadow-blue-500/25">
            <span className="text-white text-2xl font-bold">SR</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">
            Namaste, {user?.name?.split(" ")[0] || "User"}! 👋
          </h1>
          <p className="text-slate-500 mt-2 text-base">
            Aap kaun hain? Apna role chunein taki hum aapko sahi experience de sakein.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6" role="radiogroup" aria-label="Select your role">
          {roles.map((role, index) => {
            const Icon = role.icon;
            const isSelected = selected === role.id;
            return (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => setSelected(role.id)}
                role="radio"
                aria-checked={isSelected}
                aria-label={role.title}
                className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isSelected
                    ? `${role.selectedBg} shadow-md`
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                  </div>
                )}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${role.iconBg} mb-3`}>
                  <span className="text-2xl" aria-hidden="true">{role.emoji}</span>
                </div>
                <h3 className="text-slate-800 font-semibold text-base mb-0.5">{role.title}</h3>
                <p className={`text-xs mb-2 font-medium ${role.iconText}`}>{role.hindiTitle}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{role.description}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={handleContinue}
          disabled={!selected || loading}
          aria-label="Continue with selected role"
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-4 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 text-lg focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {loading ? (
            <><div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" /><span>Setting up...</span></>
          ) : (
            <>Aage Badhein <ArrowRight className="w-5 h-5" aria-hidden="true" /></>
          )}
        </motion.button>

        <p className="text-center text-slate-400 text-xs mt-6">
          © 2025 SAI RoloTech · Industrial Automation Solutions
        </p>
      </motion.div>
    </div>
  );
}
