import { motion } from "framer-motion";
import { Eye, LayoutDashboard, ArrowRight, Shield, Sparkles } from "lucide-react";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { useLocation } from "wouter";

export function ModeSelector() {
  const { setMode } = useAdminMode();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" />
            Admin Access
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-base">
            Choose how you'd like to explore your platform today
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.button
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setMode("visitor"); setLocation("/"); }}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 text-left transition-all hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/20">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Visitor Preview
              </h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Explore your platform as a supplier or machine user would see it.
                Read-only mode — perfect for demos and onboarding.
              </p>
              <div className="flex items-center gap-2 text-blue-500 text-sm font-semibold">
                Enter Preview
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setMode("editor"); setLocation("/"); }}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 text-left transition-all hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-5 shadow-lg shadow-orange-500/20">
                <LayoutDashboard className="w-7 h-7 text-white" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-foreground">
                  CRM Editor
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase">
                  <Sparkles className="w-3 h-3" />
                  Buddy AI
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Full CRM access with your AI Business Partner.
                Manage leads, quotations, and analytics.
              </p>
              <div className="flex items-center gap-2 text-orange-500 text-sm font-semibold">
                Open CRM
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
