import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AIGreetingProps {
  onDismiss: () => void;
}

const TIME_TIPS = {
  morning: [
    "Fresh morning — check overnight IndiaMART leads! 📱",
    "Subah ke 9-10 baje leads fastest respond karte hain ☀️",
    "Today's first task: Pending demos ko schedule karo 📋",
  ],
  afternoon: [
    "Afternoon push: Unreplied WhatsApp messages check karo 💬",
    "Lead follow-ups ke liye best time — afternoon call karo 📞",
    "Quotation pending? Aaj bhejo, kal ka order aapka! 💰",
  ],
  evening: [
    "Evening: Tomorrow ke demos plan karo 📅",
    "Last 2 hours — pipeline review aur next day prep! 🗂️",
    "Uncontacted leads ko WhatsApp blast karo — evening mein free hote hain 📲",
  ],
  night: [
    "Late night hustle! Check tomorrow's schedule 📋",
    "Bhoot raat! Kuch productive tasks bhi kar lo 💪",
    "Almost done for today — last review karo? 📊",
  ],
};

function getTimeBasedTip() {
  const hour = new Date().getHours();
  let list: string[];
  if (hour >= 5 && hour < 12) list = TIME_TIPS.morning;
  else if (hour >= 12 && hour < 17) list = TIME_TIPS.afternoon;
  else if (hour >= 17 && hour < 21) list = TIME_TIPS.evening;
  else list = TIME_TIPS.night;
  return list[Math.floor(Math.random() * list.length)];
}

export function AIGreeting({ onDismiss }: AIGreetingProps) {
  const { user } = useAuth();
  const [tip, setTip] = useState(getTimeBasedTip);

  useEffect(() => {
    const t = setInterval(() => setTip(getTimeBasedTip()), 8000);
    return () => clearInterval(t);
  }, []);

  const userName = user?.name || "Boss";
  const hour = new Date().getHours();
  const greetingTime = hour >= 5 && hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : hour < 21 ? "Good Evening" : "Working Late";

  return (
    <motion.div
      initial={{ y: -80, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -80, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md pointer-events-none"
    >
      <div className="relative mx-4 mt-4">
        {/* Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-xl opacity-30 scale-110" />

        <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl backdrop-blur-xl"
          style={{ background: "rgba(15,15,35,0.9)" }}>
          {/* Animated top bar */}
          <div className="h-0.5 w-full overflow-hidden">
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="h-full w-1/2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            />
          </div>

          <div className="p-4 flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-slate-900"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-white">AI Buddy</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold">LIVE</span>
              </div>
              <motion.p
                key={tip}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-semibold text-white mb-0.5"
              >
                {greetingTime}, {userName.split(" ")[0]}!
              </motion.p>
              <motion.p
                key={`tip-${tip}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-indigo-300 leading-relaxed"
              >
                {tip}
              </motion.p>
            </div>

            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors group"
              aria-label="Dismiss greeting"
            >
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
