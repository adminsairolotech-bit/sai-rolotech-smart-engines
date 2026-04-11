import { AnimatePresence, motion } from "framer-motion";
import { Bot, X, Zap, MessageSquare, TrendingUp, CalendarCheck, Bell, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";

interface BuddyToggleButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function BuddyToggleButton({ onClick, isOpen }: BuddyToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Close Buddy" : "Open Buddy"}
      className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground"
    >
      {/* Animated pulse ring */}
      <span className="absolute inset-0 rounded-lg">
        <span className="absolute inset-0 rounded-lg bg-primary/20 animate-ping" />
      </span>
      <Bot className="w-3.5 h-3.5 text-primary relative z-10" />
      <span className="hidden sm:inline relative z-10">Buddy</span>
    </button>
  );
}

interface BuddyPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { icon: TrendingUp, label: "Lead Score", desc: "AI-priority leads", color: "from-blue-500 to-indigo-600", action: "/lead-intelligence" },
  { icon: CalendarCheck, label: "Book Demo", desc: "Schedule a demo", color: "from-emerald-500 to-teal-600", action: "/demo-scheduler" },
  { icon: MessageSquare, label: "Send WhatsApp", desc: "Bulk message", color: "from-green-500 to-emerald-600", action: "/sales-sequences" },
  { icon: Zap, label: "AI Analysis", desc: "Smart insights", color: "from-amber-500 to-orange-600", action: "/ai-control" },
];

const GREETINGS = {
  morning: ["Good Morning!", "Subah ki shubhkamnayein!", "Rise and shine — fresh leads await!"],
  afternoon: ["Namaste!", "Good Afternoon!", "Day's running strong!"],
  evening: ["Good Evening!", "Shaam ko productive raho!", "Evening sales push karo!"],
  night: ["Working late? 💪", "Night owl mode!", "Almost done for today?"],
};

function getGreeting() {
  const hour = new Date().getHours();
  let list: string[];
  if (hour >= 5 && hour < 12) list = GREETINGS.morning;
  else if (hour >= 12 && hour < 17) list = GREETINGS.afternoon;
  else if (hour >= 17 && hour < 21) list = GREETINGS.evening;
  else list = GREETINGS.night;
  return list[Math.floor(Math.random() * list.length)];
}

function RobotAvatar() {
  return (
    <div className="relative mx-auto mb-4">
      {/* Glow ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 blur-xl opacity-40 animate-pulse" />
      {/* Avatar circle */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center shadow-2xl"
      >
        {/* Face panel */}
        <div className="absolute inset-3 rounded-2xl bg-slate-900/60 backdrop-blur-sm border border-white/10 flex items-center justify-center overflow-hidden">
          {/* Eyes */}
          <div className="flex gap-4">
            <motion.div
              animate={{ scaleX: [1, 0.1, 1], opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 4, delay: Math.random() * 2 }}
              className="w-3 h-3 rounded-full bg-cyan-400"
            />
            <motion.div
              animate={{ scaleX: [1, 0.1, 1], opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 4, delay: Math.random() * 2 + 0.5 }}
              className="w-3 h-3 rounded-full bg-cyan-400"
            />
          </div>
          {/* Smile */}
          <div className="absolute bottom-2 w-6 h-0.5 bg-cyan-400 rounded-full" />
        </div>
        {/* Antenna */}
        <motion.div
          animate={{ scaleY: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gradient-to-t from-indigo-400 to-transparent"
        />
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400" />
        {/* Status dots */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {["bg-green-400", "bg-amber-400", "bg-green-400"].map((c, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
              className={`w-1 h-1 rounded-full ${c}`}
            />
          ))}
        </div>
      </motion.div>
      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30],
            x: [0, (i % 2 === 0 ? 1 : -1) * (10 + i * 5)],
            opacity: [0.6, 0],
            scale: [0.5, 1.5],
          }}
          transition={{ repeat: Infinity, duration: 2 + i * 0.4, delay: i * 0.3 }}
          className={`absolute w-1 h-1 rounded-full ${i % 3 === 0 ? "bg-cyan-400" : i % 3 === 1 ? "bg-purple-400" : "bg-pink-400"}`}
          style={{ left: `${20 + i * 12}%`, top: "50%" }}
        />
      ))}
    </div>
  );
}

export function BuddyPanel({ isOpen, onClose }: BuddyPanelProps) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [greeting, setGreeting] = useState(getGreeting);
  const [activeAction, setActiveAction] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setGreeting(getGreeting()), 5000);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const userName = user?.name || "Buddy";
  const firstName = userName.split(" ")[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 h-full w-80 z-50 flex flex-col overflow-hidden"
        >
          {/* Futuristic background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.2) 0%, transparent 50%)",
            }}
          />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />

          <div className="relative flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400"
                  />
                </div>
                <h2 className="font-semibold text-sm text-white">AI Buddy</h2>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold border border-green-500/30">ONLINE</span>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Greeting */}
            <div className="p-5 text-center">
              <RobotAvatar />
              <motion.p
                key={greeting}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-bold text-white mb-1"
              >
                {greeting}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-indigo-300"
              >
                {firstName}, aapke liye ready hoon! 👋
              </motion.p>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-xs text-red-300 font-medium"
                >
                  <Bell className="w-3 h-3" />
                  {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
                </motion.div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex-1 overflow-y-auto px-4">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">⚡ Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.label}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveAction(i)}
                      className="relative overflow-hidden rounded-xl p-3 text-left group"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-2 shadow-lg`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-[10px] font-bold text-white">{action.label}</p>
                      <p className="text-[9px] text-white/50">{action.desc}</p>
                    </motion.button>
                  );
                })}
              </div>

              {/* Tip Card */}
              <div className="mt-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-indigo-300 mb-1">💡 AI Tip</p>
                    <p className="text-[10px] text-indigo-200/80 leading-relaxed">
                      IndiaMART leads from Delhi NCR convert 40% better. Focus on those first for maximum ROI this week!
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: "This Week", value: "₹12.5L", sub: "Pipeline" },
                  { label: "Active Leads", value: String(unreadCount + 24), sub: "Hot" },
                  { label: "Demo Today", value: "2", sub: "Scheduled" },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/5 rounded-xl p-2.5 text-center border border-white/5">
                    <p className="text-[9px] text-indigo-400 mb-0.5">{stat.label}</p>
                    <p className="text-sm font-bold text-white">{stat.value}</p>
                    <p className="text-[8px] text-indigo-300/50">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10">
              <p className="text-[9px] text-indigo-400/50 text-center">
                Powered by Claude AI · SAI RoloTech CRM
              </p>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
