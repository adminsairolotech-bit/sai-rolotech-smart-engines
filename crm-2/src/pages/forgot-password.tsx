import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { KeyRound, ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { resetPassword } = useAuth();
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Email required", description: "Apna registered email enter karein.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const result = await resetPassword(email.trim());
    setLoading(false);
    if (result.success) {
      setSent(true);
    } else {
      toast({ title: "Email nahi mili", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-orange-300/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-4 shadow-lg shadow-amber-500/25">
            <KeyRound className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Password Reset</h1>
          <p className="text-slate-500 mt-1 text-sm">SAI RoloTech Portal</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/60">
          {!sent ? (
            <>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Password bhool gaye?</h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Apna registered email daalein. Hum aapko reset instructions bhejenge.
              </p>

              <form onSubmit={handleReset} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="aapka@email.com"
                      autoComplete="email"
                      aria-label="Registered email address"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pl-10 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-[16px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  aria-label="Send reset link"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-200 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                >
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" /><span>Bhej rahe hain...</span></>
                  ) : (
                    <><KeyRound className="w-5 h-5" aria-hidden="true" /><span>Reset Link Bhejein</span></>
                  )}
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9 text-emerald-500" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Instructions Bhej Diye! ✅</h2>
              <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                <span className="text-amber-600 font-semibold">{email}</span> par password reset instructions bhej diye gaye hain. Apna inbox check karein.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-xs text-left">
                <p className="font-semibold mb-1">💡 Demo Mode Note:</p>
                <p>Is demo mein actual email nahi jaata. Admin se naya password lein ya directly admin@sairolotech.com se login karein.</p>
              </div>
            </motion.div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={() => setLocation("/login")}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-xl py-3.5 transition-all duration-200 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" aria-hidden="true" />
              Login par wapas jayein
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
