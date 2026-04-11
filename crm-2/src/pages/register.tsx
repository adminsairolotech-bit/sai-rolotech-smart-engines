import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, UserPlus, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();

  const [name, setName]                   = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPw, setConfirmPw]         = useState("");
  const [showPw, setShowPw]               = useState(false);
  const [loading, setLoading]             = useState(false);

  const pwChecks = [
    { label: "8+ characters",     ok: password.length >= 8 },
    { label: "Capital letter",    ok: /[A-Z]/.test(password) },
    { label: "Number (0-9)",      ok: /[0-9]/.test(password) },
    { label: "Symbol (!@#...)",   ok: /[^a-zA-Z0-9]/.test(password) },
  ];
  const pwScore  = pwChecks.filter(c => c.ok).length;
  const pwStrength = password.length === 0 ? 0 : pwScore <= 1 ? 1 : pwScore === 2 ? 2 : pwScore === 3 ? 3 : 4;
  const pwMatch = confirmPw && password === confirmPw;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast({ title: "Sabhi fields bharen", description: "Naam, email aur password zaroori hai.", variant: "destructive" }); return;
    }
    if (password.length < 6) {
      toast({ title: "Password chhota hai", description: "Password kam se kam 6 characters ka hona chahiye.", variant: "destructive" }); return;
    }
    if (password !== confirmPw) {
      toast({ title: "Password match nahi hua", description: "Dono password ek jaise hone chahiye.", variant: "destructive" }); return;
    }
    setLoading(true);
    const result = await register(name.trim(), email.trim(), password);
    setLoading(false);
    if (result.success) {
      toast({ title: "Account ban gaya! 🎉", description: `Welcome, ${name.trim()}! Ab apna role chunein.` });
      setLocation("/role-select");
    } else {
      toast({ title: "Registration Failed", description: result.error, variant: "destructive" });
    }
  };

  const strengthColors = ["", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];
  const strengthLabels = ["", "Kamzor", "Theek", "Acha", "Mazboot"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-300/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 mb-4 shadow-lg shadow-emerald-500/25">
            <span className="text-white text-2xl font-bold">SR</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">SAI RoloTech</h1>
          <p className="text-slate-500 mt-1 text-sm">Naya account banayein — bilkul free</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/60">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-500" aria-hidden="true" />
            Register karein
          </h2>

          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 mb-1.5">Aapka Naam</label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jaise: Rahul Kumar"
                autoComplete="name"
                aria-label="Full name"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-[16px]"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aapka@email.com"
                autoComplete="email"
                aria-label="Email address"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-[16px]"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  aria-label="Password"
                  aria-describedby="pw-strength"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-[16px]"
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
              {/* Password strength bar + checklist */}
              {password && (
                <div id="pw-strength" className="mt-2 space-y-2" aria-live="polite">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= pwStrength ? strengthColors[pwStrength] : "bg-slate-200"}`} />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-slate-500 shrink-0">{strengthLabels[pwStrength]}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {pwChecks.map(check => (
                      <div key={check.label} className="flex items-center gap-1.5">
                        {check.ok
                          ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          : <XCircle className="w-3 h-3 text-slate-300 shrink-0" />
                        }
                        <span className={`text-[11px] ${check.ok ? "text-emerald-700" : "text-slate-400"}`}>{check.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-slate-700 mb-1.5">Password Confirm karein</label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Wahi password dobara likhein"
                  autoComplete="new-password"
                  aria-label="Confirm password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-[16px]"
                />
                {pwMatch && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" aria-label="Passwords match" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-label="Create account"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 mt-2 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" /><span>Account ban raha hai...</span></>
              ) : (
                <><UserPlus className="w-5 h-5" aria-hidden="true" /><span>Account Banayein</span></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={() => setLocation("/login")}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-xl py-3.5 transition-all duration-200 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" aria-hidden="true" />
              Already account hai? Login karein
            </button>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          © 2025 SAI RoloTech · Industrial Automation Solutions · Pune
        </p>
      </motion.div>
    </div>
  );
}
