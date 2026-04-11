import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, UserPlus, KeyRound, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, user } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ title: "Fields required", description: "Email aur password dono bharen.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success) {
      // Read userType from auth context after login (via session)
      const sessionRaw = sessionStorage.getItem("sai_crm_session") || localStorage.getItem("sai_crm_session");
      const sessionUser = sessionRaw ? JSON.parse(sessionRaw).user : null;
      const userType = sessionUser?.userType;

      if (userType === "admin")                              setLocation("/select-mode");
      else if (userType === "new_user")                     setLocation("/role-select");
      else if (userType === "machine_user" || userType === "operator") setLocation("/home");
      else if (userType === "supplier")                     setLocation("/map-view");
      else                                                  setLocation("/home");

      toast({ title: "Welcome!", description: `Namaste, ${sessionUser?.name} 👋` });
    } else {
      toast({ title: "Login Failed", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-100/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, ease: "backOut" }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-4 shadow-lg shadow-blue-500/25"
          >
            <span className="text-white text-2xl font-bold tracking-tight">SR</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-800">SAI RoloTech</h1>
          <p className="text-slate-500 mt-1 text-sm">Industrial Automation CRM Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/60">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-blue-600" aria-hidden="true" />
            Login karein
          </h2>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aapka@email.com"
                autoComplete="email"
                aria-label="Email Address"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[16px]"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-label="Password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[16px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setLocation("/forgot-password")}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 font-medium"
              >
                <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                Password bhool gaye?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              aria-label="Login button"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" /><span>Logging in...</span></>
              ) : (
                <><LogIn className="w-5 h-5" aria-hidden="true" /><span>Login</span></>
              )}
            </button>
          </form>

          {/* Register */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-center text-slate-500 text-sm mb-4">Naya account chahiye?</p>
            <button
              onClick={() => setLocation("/register")}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-xl py-3.5 transition-all duration-200 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <UserPlus className="w-5 h-5 text-emerald-500" aria-hidden="true" />
              Naya Account Banayein
            </button>
          </div>

        </div>

        {/* PWA Feature strip */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Zap className="w-3 h-3 text-blue-400" aria-hidden="true" />
          <span>AI Powered · PWA Ready · 39 Features</span>
        </div>

        <div className="flex items-center justify-center gap-4 mt-3">
          <a href="/privacy-policy" className="text-slate-400 text-xs hover:text-blue-600 transition-colors hover:underline">Privacy Policy</a>
          <span className="text-slate-300 text-xs">·</span>
          <a href="/terms" className="text-slate-400 text-xs hover:text-blue-600 transition-colors hover:underline">Terms</a>
          <span className="text-slate-300 text-xs">·</span>
          <a href="/support" className="text-slate-400 text-xs hover:text-blue-600 transition-colors hover:underline">Support</a>
        </div>
        <p className="text-center text-slate-400 text-xs mt-2">
          © 2025 SAI RoloTech · New Delhi · India
        </p>
      </motion.div>
    </div>
  );
}
