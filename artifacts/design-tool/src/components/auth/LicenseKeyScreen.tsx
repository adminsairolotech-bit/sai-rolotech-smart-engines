import React, { useState, useEffect, lazy, Suspense } from "react";
import { Shield, Mail, Lock, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { loginWithEmail, verifyLicense, clearLicense } from "../../lib/licenseKey";

interface Props {
  onUnlocked: () => void;
}

type Screen = "checking" | "login" | "error";

export function LicenseKeyScreen({ onUnlocked }: Props) {
  const [screen, setScreen]   = useState<Screen>("checking");
  const [email, setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]      = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]    = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(true);

  // Startup check
  useEffect(() => {
    (async () => {
      const result = await verifyLicense();
      if (result.active) {
        onUnlocked();
      } else {
        setScreen("login");
      }
    })();
  }, [onUnlocked]);

  const handleLogin = async () => {
    if (!email.trim()) {
      setError("Email daalo"); return;
    }
    if (!password.trim()) {
      setError("Password daalo"); return;
    }
    if (isNewUser && !name.trim()) {
      setError("Naam bhi daalo"); return;
    }

    setLoading(true);
    setError(null);
    const result = await loginWithEmail(email, password, name);
    setLoading(false);

    if (result.ok) {
      setSuccess("Login successful!");
      setTimeout(() => onUnlocked(), 800);
    } else {
      setError(result.error || "Login failed");
    }
  };

  // ── Checking screen ─────────────────────────────────────────────────────
  if (screen === "checking") {
    return (
      <div className="fixed inset-0 bg-[#07080f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Login screen ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-[#07080f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10">
            <Shield className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-white">SAI Rolotech Smart Engines</h1>
          <p className="text-xs text-zinc-500 mt-1">Email aur Password se login karo</p>
        </div>

        {/* Form */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">

          {/* Name (only for new users) */}
          {isNewUser && (
            <div>
              <label className="text-[11px] text-zinc-400 font-semibold block mb-1.5">
                Aapka Naam
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ramesh Kumar"
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50 transition-all"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-[11px] text-zinc-400 font-semibold block mb-1.5">
              Email <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
                placeholder="aapka@email.com"
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50 transition-all"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[11px] text-zinc-400 font-semibold block mb-1.5">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null); }}
                placeholder="Password"
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50 transition-all"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 bg-green-500/8 border border-green-500/20 rounded-lg px-3 py-2.5">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-xs text-green-400 font-medium">{success}</p>
            </div>
          )}

          {/* Login button */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading || !!success}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-black text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Logging in...</>
            ) : (
              <span>{isNewUser ? "Sign Up & Login" : "Login"}</span>
            )}
          </button>

          {/* Toggle new/existing user */}
          <button
            type="button"
            onClick={() => { setIsNewUser(!isNewUser); setError(null); setPassword(""); }}
            className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-2"
          >
            {isNewUser ? "Already have account? Login" : "New user? Sign up"}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-zinc-700 mt-4">
          SAI Rolotech Smart Engines v2.0
        </p>
      </div>
    </div>
  );
}
