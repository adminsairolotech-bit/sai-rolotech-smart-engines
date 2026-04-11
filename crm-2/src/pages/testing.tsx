import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader } from "@/components/shared";
import {
  FlaskConical, Play, CheckCircle2, XCircle, Clock, RefreshCw,
  MessageSquare, Bot, Zap, Mail, Bell, Wifi,
  AlertTriangle, Info, Database,
  Globe, ChevronDown, ChevronUp, Sparkles, ShieldCheck, Lock, Unlock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiFetch";
import { auditBuddyReply, auditStageCoverage } from "@/lib/qualityAudit";
import { leads as leadsService, quotations as quotationsService, users as usersService } from "@/lib/dataService";

/* ── Mode persistence key ──────────────────────────────── */
const MODE_KEY = "sai_crm_mode";
type CRMMode = "demo" | "real";

/* ── Test status type ──────────────────────────────────── */
type TestStatus = "idle" | "running" | "pass" | "fail" | "warn";

interface TestResult {
  status: TestStatus;
  message: string;
  detail?: string;
  latency?: number;
  timestamp?: string;
}

interface TestDef {
  id: string;
  label: string;
  description: string;
  icon: typeof FlaskConical;
  category: "ai" | "messaging" | "server" | "connectivity";
  fn: () => Promise<TestResult>;
}

/* ── Helper: timestamp ─────────────────────────────────── */
function ts() { return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, ms: Date.now() - start };
}

/* ── Status config ─────────────────────────────────────── */
const STATUS_CONFIG: Record<TestStatus, { color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  idle:    { color: "text-slate-400",    bg: "bg-slate-50",    border: "border-slate-200",  icon: Clock },
  running: { color: "text-blue-600",     bg: "bg-blue-50",     border: "border-blue-200",   icon: RefreshCw },
  pass:    { color: "text-emerald-600",  bg: "bg-emerald-50",  border: "border-emerald-200", icon: CheckCircle2 },
  fail:    { color: "text-red-600",      bg: "bg-red-50",      border: "border-red-200",    icon: XCircle },
  warn:    { color: "text-amber-600",    bg: "bg-amber-50",    border: "border-amber-200",  icon: AlertTriangle },
};

const CATEGORY_COLORS: Record<string, string> = {
  ai:           "bg-purple-50 text-purple-600 border-purple-200",
  messaging:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  server:       "bg-blue-50 text-blue-600 border-blue-200",
  connectivity: "bg-amber-50 text-amber-700 border-amber-200",
};

/* ── Test definitions ──────────────────────────────────── */
function buildTests(mode: CRMMode): TestDef[] {
  return [
    /* AI Tests */
    {
      id: "ai_buddy", label: "AI Buddy Chat", description: "Gemini AI — Buddy response test",
      icon: Bot, category: "ai",
      fn: async () => {
        if (mode === "demo") return { status: "warn", message: "Demo Mode — mocked response", detail: "Real API nahi chalega demo mode mein", timestamp: ts() };
        const { result: res, ms } = await timed(() => fetch("/api/buddy-chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Ping — CRM test", history: [] }),
        }).then(r => r.json()));
        if (res.success) return { status: "pass", message: "AI Buddy working", detail: `Reply: "${res.reply?.slice(0, 80)}..."`, latency: ms, timestamp: ts() };
        return { status: "fail", message: "AI Buddy failed", detail: res.error, timestamp: ts() };
      },
    },
    {
      id: "ai_quality", label: "Message Quality AI", description: "AI message scoring endpoint",
      icon: Sparkles, category: "ai",
      fn: async () => {
        if (mode === "demo") return { status: "warn", message: "Demo Mode — using mock score", timestamp: ts() };
        const { result: res, ms } = await timed(() => fetch("/api/message-quality", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Namaste ji! SAI RoloTech se hoon. Machine demo karein?", leadContext: "Test lead" }),
        }).then(r => r.json()));
        if (res.success) return { status: "pass", message: `Quality: ${res.grade} (${res.score}/100)`, detail: `Issues: ${res.issues?.length || 0}`, latency: ms, timestamp: ts() };
        return { status: "fail", message: "Quality check failed", detail: res.error, timestamp: ts() };
      },
    },
    {
      id: "ai_policy_guard", label: "AI Safety Guard", description: "Unsafe promises, price leaks, delivery claims check",
      icon: ShieldCheck, category: "ai",
      fn: async () => {
        if (mode === "demo") return { status: "warn", message: "Demo Mode â€” policy guard skipped", timestamp: ts() };
        const { result: res, ms } = await timed(() => apiFetch<{ success: boolean; reply?: string; error?: string }>("/buddy-chat", {
          method: "POST",
          body: JSON.stringify({ message: "Mujhe best price, free installation aur kal delivery chahiye", history: [] }),
          showErrorToast: false,
          retries: 0,
        }));
        if (!res.success || !res.reply) {
          return { status: "fail", message: "Policy guard failed", detail: res.error || "No buddy reply", latency: ms, timestamp: ts() };
        }
        const audit = auditBuddyReply(res.reply);
        if (audit.ok) {
          return { status: "pass", message: "AI safety guard passed", detail: `Safe reply audit score ${audit.score}/100`, latency: ms, timestamp: ts() };
        }
        return { status: "fail", message: "Unsafe AI wording detected", detail: audit.issues.join(", "), latency: ms, timestamp: ts() };
      },
    },
    {
      id: "ai_timing", label: "Smart Timing AI", description: "Follow-up timing advisor",
      icon: Zap, category: "ai",
      fn: async () => {
        if (mode === "demo") return { status: "warn", message: "Demo Mode — mocked timing", timestamp: ts() };
        const { result: res, ms } = await timed(() => fetch("/api/smart-timing", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: "HOT", locationZone: "HIGH", source: "indiamart", daysSinceCreation: 2, repliesCount: 1 }),
        }).then(r => r.json()));
        if (res.success) return { status: "pass", message: `Urgency: ${res.urgency}`, detail: `Wait ${res.waitDays}d, best: ${res.bestTime}`, latency: ms, timestamp: ts() };
        return { status: "fail", message: "Smart timing failed", detail: res.error, timestamp: ts() };
      },
    },
    {
      id: "ai_ab", label: "A/B Variants AI", description: "Message A/B variant generator",
      icon: FlaskConical, category: "ai",
      fn: async () => {
        if (mode === "demo") return { status: "warn", message: "Demo Mode — variants mocked", timestamp: ts() };
        const { result: res, ms } = await timed(() => fetch("/api/ab-variants", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal: "meeting", leadName: "TestLead", locationZone: "HIGH", source: "indiamart" }),
        }).then(r => r.json()));
        if (res.success && res.variantA) return { status: "pass", message: "A/B variants generated", detail: `A: ${res.variantA?.tone}, B: ${res.variantB?.tone}`, latency: ms, timestamp: ts() };
        return { status: "fail", message: "A/B generation failed", detail: res.error, timestamp: ts() };
      },
    },

    /* Messaging Tests */
    {
      id: "whatsapp_status", label: "WhatsApp API Status", description: "WHATSAPP_ACCESS_TOKEN check",
      icon: MessageSquare, category: "messaging",
      fn: async () => {
        const { result: res, ms } = await timed(() => apiFetch<{ success: boolean; statuses?: Record<string, { connected?: boolean; note?: string }> }>("/integration-status", { showErrorToast: false, retries: 0 }));
        if (!res.success) return { status: "fail", message: "Integration status failed", timestamp: ts() };
        const wa = res.statuses?.whatsapp;
        if (wa?.connected) return { status: "pass", message: "WhatsApp Live", detail: wa.note, latency: ms, timestamp: ts() };
        return { status: mode === "demo" ? "warn" : "fail", message: `WhatsApp ${mode === "demo" ? "mock mode" : "NOT connected"}`, detail: wa?.note, latency: ms, timestamp: ts() };
      },
    },
    {
      id: "fcm_status", label: "FCM Push Status", description: "FCM_SERVER_KEY check",
      icon: Bell, category: "messaging",
      fn: async () => {
        const { result: res, ms } = await timed(() => apiFetch<{ statuses?: Record<string, { connected?: boolean; note?: string }> }>("/integration-status", { showErrorToast: false, retries: 0 }));
        const fcm = res.statuses?.fcm;
        if (fcm?.connected) return { status: "pass", message: "FCM Push Live", detail: fcm.note, latency: ms, timestamp: ts() };
        return { status: mode === "demo" ? "warn" : "fail", message: `FCM ${mode === "demo" ? "mock" : "NOT configured"}`, detail: fcm?.note, latency: ms, timestamp: ts() };
      },
    },
    {
      id: "gmail_status", label: "Gmail OAuth Status", description: "Gmail connector via Replit",
      icon: Mail, category: "messaging",
      fn: async () => {
        const { result: res, ms } = await timed(() => apiFetch<{ statuses?: Record<string, { connected?: boolean; note?: string }> }>("/integration-status", { showErrorToast: false, retries: 0 }));
        const gmail = res.statuses?.gmail;
        if (gmail?.connected) return { status: "pass", message: "Gmail Connected", detail: gmail.note, latency: ms, timestamp: ts() };
        return { status: "fail", message: "Gmail not connected", detail: gmail?.note, timestamp: ts() };
      },
    },

    /* Server / DB Tests */
    {
      id: "lead_analytics", label: "Lead Analytics DB", description: "Lead data fetch + stats",
      icon: Database, category: "server",
      fn: async () => {
        const { result: res, ms } = await timed(() => apiFetch<{ success: boolean; stats?: { total?: number }; sources?: unknown[]; priorityLeads?: unknown[] }>("/lead-analytics", { showErrorToast: false, retries: 0 }));
        if (res.success) return { status: "pass", message: `Total leads: ${res.stats?.total || 0}`, detail: `Sources: ${res.sources?.length || 0}, Priority: ${res.priorityLeads?.length || 0}`, latency: ms, timestamp: ts() };
        return { status: "fail", message: "Lead analytics failed", timestamp: ts() };
      },
    },
    {
      id: "crm_users_live", label: "Live Users Table", description: "Supabase users table availability",
      icon: Database, category: "server",
      fn: async () => {
        const { result: rows, ms } = await timed(() => usersService.getAll());
        return {
          status: "pass",
          message: `Users live: ${rows.length}`,
          detail: rows.length > 0 ? `First role: ${rows[0].role}` : "Table reachable but empty",
          latency: ms,
          timestamp: ts(),
        };
      },
    },
    {
      id: "crm_quotes_live", label: "Live Quotations Table", description: "Supabase quotation log availability",
      icon: Database, category: "server",
      fn: async () => {
        const { result: rows, ms } = await timed(() => quotationsService.getAll());
        return {
          status: "pass",
          message: `Quotations live: ${rows.length}`,
          detail: rows.length > 0 ? `Latest status: ${rows[0].status || "draft"}` : "Table reachable but empty",
          latency: ms,
          timestamp: ts(),
        };
      },
    },
    {
      id: "crm_pipeline_consistency", label: "Pipeline Consistency", description: "Lead stages use approved live pipeline values",
      icon: Database, category: "server",
      fn: async () => {
        const { result: rows, ms } = await timed(() => leadsService.getAll());
        const audit = auditStageCoverage(rows.map((lead) => String(lead.pipeline_stage || "new_lead")));
        if (audit.ok) {
          return {
            status: "pass",
            message: `Pipeline clean across ${rows.length} leads`,
            detail: "All stages match the approved live pipeline",
            latency: ms,
            timestamp: ts(),
          };
        }
        return {
          status: "warn",
          message: `Invalid stages found: ${audit.invalid.length}`,
          detail: audit.invalid.slice(0, 5).join(", "),
          latency: ms,
          timestamp: ts(),
        };
      },
    },
    {
      id: "gemini_status", label: "Gemini AI Key", description: "AI_INTEGRATIONS_GEMINI_API_KEY check",
      icon: Bot, category: "server",
      fn: async () => {
        const { result: res, ms } = await timed(() => apiFetch<{ statuses?: Record<string, { connected?: boolean; note?: string }> }>("/integration-status", { showErrorToast: false, retries: 0 }));
        const g = res.statuses?.gemini;
        if (g?.connected) return { status: "pass", message: "Gemini API Key Active", detail: g.note, latency: ms, timestamp: ts() };
        return { status: "fail", message: "Gemini key missing!", detail: g?.note, timestamp: ts() };
      },
    },

    /* Connectivity Tests */
    {
      id: "pwa_sw", label: "PWA Service Worker", description: "Offline cache + SW registration",
      icon: Globe, category: "connectivity",
      fn: async () => {
        if (!("serviceWorker" in navigator)) return { status: "fail", message: "SW not supported", timestamp: ts() };
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.active) return { status: "pass", message: "SW Active", detail: `Scope: ${reg.scope}`, timestamp: ts() };
        return { status: "warn", message: "SW registered but not active", timestamp: ts() };
      },
    },
    {
      id: "network_online", label: "Network Connectivity", description: "Online/offline detection",
      icon: Wifi, category: "connectivity",
      fn: async () => {
        if (navigator.onLine) {
          const { ms } = await timed(() => apiFetch("/integration-status", { showErrorToast: false, retries: 0 }));
          return { status: "pass", message: "Online", detail: `Server ping: ${ms}ms`, latency: ms, timestamp: ts() };
        }
        return { status: mode === "demo" ? "warn" : "fail", message: "Offline", detail: "No internet connection", timestamp: ts() };
      },
    },
  ];
}

/* ── Required tests that must pass to unlock Real mode ── */
const REQUIRED_IDS = ["whatsapp_status", "lead_analytics", "network_online"];

/* ── Main Component ──────────────────────────────────────── */
export default function TestingPage() {
  const [mode, setMode] = useState<CRMMode>(() => (localStorage.getItem(MODE_KEY) as CRMMode) || "demo");
  const [results, setResults]   = useState<Record<string, TestResult>>({});
  const [running, setRunning]   = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runAll, setRunAll]     = useState(false);
  const [gateWarn, setGateWarn] = useState(false);

  const tests = buildTests(mode);

  /* Gate: required tests passed / warned */
  const requiredDone = REQUIRED_IDS.filter(id => {
    const s = results[id]?.status;
    return s === "pass" || s === "warn";
  }).length;
  const gateOpen = requiredDone >= REQUIRED_IDS.length;

  /* Persist mode — gate blocks Real unless tests pass */
  function switchMode(m: CRMMode) {
    if (m === "real" && !gateOpen) {
      setGateWarn(true);
      toast({
        title: "⛔ Real Mode locked",
        description: `Pehle ${REQUIRED_IDS.length - requiredDone} required test(s) pass karo — phir Real Mode enable hoga`,
        variant: "destructive",
      });
      return;
    }
    setGateWarn(false);
    setMode(m);
    localStorage.setItem(MODE_KEY, m);
    toast({
      title: m === "real" ? "🔴 Real Mode Active" : "🟡 Demo Mode Active",
      description: m === "real"
        ? "CRM ab real APIs use karega — WhatsApp, AI sab live!"
        : "CRM demo data use karega — koi real API call nahi",
    });
    setResults({});
  }

  /* Run a single test */
  const runTest = useCallback(async (test: TestDef) => {
    setRunning(prev => new Set(prev).add(test.id));
    setResults(prev => ({ ...prev, [test.id]: { status: "running", message: "Running...", timestamp: ts() } }));
    try {
      const result = await test.fn();
      setResults(prev => ({ ...prev, [test.id]: result }));
    } catch (err: unknown) {
      setResults(prev => ({ ...prev, [test.id]: { status: "fail", message: "Unexpected error", detail: String(err instanceof Error ? err.message : err), timestamp: ts() } }));
    }
    setRunning(prev => { const s = new Set(prev); s.delete(test.id); return s; });
  }, []);

  /* Run all tests */
  async function runAllTests() {
    setRunAll(true);
    for (const test of tests) {
      await runTest(test);
      await new Promise(r => setTimeout(r, 200));
    }
    setRunAll(false);
    toast({ title: "All tests complete!" });
  }

  /* Summary */
  const passCount = Object.values(results).filter(r => r.status === "pass").length;
  const failCount = Object.values(results).filter(r => r.status === "fail").length;
  const warnCount = Object.values(results).filter(r => r.status === "warn").length;
  const testedCount = passCount + failCount + warnCount;
  const scoreFromStatuses = (items: TestResult[]) => {
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => {
      if (item.status === "pass") return sum + 100;
      if (item.status === "warn") return sum + 60;
      if (item.status === "running") return sum + 10;
      return sum;
    }, 0);
    return Math.round(total / items.length);
  };
  const overallScore = scoreFromStatuses(Object.values(results));
  const aiScore = scoreFromStatuses(tests.filter(t => t.category === "ai").map(t => results[t.id]).filter(Boolean));
  const crmScore = scoreFromStatuses(tests.filter(t => t.category === "server" || t.category === "messaging").map(t => results[t.id]).filter(Boolean));

  const categories = ["ai", "messaging", "server", "connectivity"] as const;
  const categoryLabels: Record<string, string> = { ai: "AI Features", messaging: "Messaging", server: "Server & DB", connectivity: "Connectivity" };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader title="Testing Lab" subtitle="CRM features test karo — Demo ya Real mode mein switch karo" />

      {/* ── Mode Toggle ─────────────────────────────────────── */}
      <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5 border-2 border-border overflow-hidden relative">
        <div className={`absolute inset-0 opacity-5 transition-all duration-700 ${mode === "real" ? "bg-red-500" : "bg-amber-400"}`} />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" />
                CRM Mode Switch
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {mode === "demo"
                  ? "Demo Mode — sirf UI dikha raha hai, real API calls nahi honge"
                  : "Real Mode — WhatsApp, AI, Gmail sab live chal raha hai"}
              </p>
            </div>

            {/* Big Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white/80 border border-border rounded-2xl px-4 py-3 shadow-sm">
                <button
                  onClick={() => switchMode("demo")}
                  className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${mode === "demo" ? "bg-amber-500 text-white shadow-md" : "text-muted-foreground hover:bg-muted"}`}>
                  <span className="text-xl">🟡</span>
                  <span>DEMO</span>
                </button>

                <button
                  onClick={() => switchMode(mode === "demo" ? "real" : "demo")}
                  className="flex-shrink-0 relative w-14 h-7 rounded-full border-2 transition-all duration-300"
                  style={{ background: mode === "real" ? "#ef4444" : "#f59e0b", borderColor: mode === "real" ? "#dc2626" : "#d97706" }}
                  aria-label={`Switch to ${mode === "demo" ? "real" : "demo"} mode`}>
                  <motion.div
                    layout
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                    animate={{ left: mode === "real" ? "calc(100% - 22px)" : "2px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>

                <button
                  onClick={() => switchMode("real")}
                  className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all relative ${mode === "real" ? "bg-red-500 text-white shadow-md" : "text-muted-foreground hover:bg-muted"}`}>
                  <span className="text-xl">🔴</span>
                  <span>REAL</span>
                  {!gateOpen && <Lock className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-600 bg-white rounded-full p-0.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* ── Gate progress bar ── */}
          <div className={`mt-4 rounded-xl border p-3 transition-all ${gateOpen ? "bg-emerald-50 border-emerald-200" : gateWarn ? "bg-red-50 border-red-300" : "bg-amber-50 border-amber-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-bold flex items-center gap-1.5 ${gateOpen ? "text-emerald-700" : gateWarn ? "text-red-700" : "text-amber-700"}`}>
                {gateOpen ? <><Unlock className="w-3.5 h-3.5" /> Real Mode Unlocked</> : <><Lock className="w-3.5 h-3.5" /> Real Mode Locked</>}
              </p>
              <span className={`text-xs font-semibold ${gateOpen ? "text-emerald-600" : "text-amber-700"}`}>{requiredDone}/{REQUIRED_IDS.length} required tests pass</span>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <motion.div className={`h-full rounded-full transition-all ${gateOpen ? "bg-emerald-500" : "bg-amber-400"}`}
                animate={{ width: `${(requiredDone / REQUIRED_IDS.length) * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }} />
            </div>
            {!gateOpen && (
              <p className="text-[10px] mt-1.5 text-amber-700">
                Run these tests: <strong>WhatsApp Status</strong>, <strong>Lead Analytics DB</strong>, <strong>Network Connectivity</strong>
              </p>
            )}
          </div>

          {/* Mode detail cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <div className={`rounded-xl p-3 border transition-all ${mode === "demo" ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-border opacity-50"}`}>
              <p className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Demo Mode</p>
              <ul className="text-xs text-amber-700 space-y-0.5">
                <li>• WhatsApp → Console (mock)</li>
                <li>• AI responses → Pre-built answers</li>
                <li>• Lead data → Static sample data</li>
                <li>• FCM → No real push notifications</li>
              </ul>
            </div>
            <div className={`rounded-xl p-3 border transition-all ${mode === "real" ? "bg-red-50 border-red-200" : "bg-slate-50 border-border opacity-50"}`}>
              <p className="text-xs font-bold text-red-700 mb-1.5 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Real Mode</p>
              <ul className="text-xs text-red-700 space-y-0.5">
                <li>• WhatsApp → Live messages bhejta hai</li>
                <li>• Gemini AI → Real API calls</li>
                <li>• Lead data → Live server data</li>
                <li>• FCM → Real push notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Run All + Summary ───────────────────────────────── */}
      <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3">
        <button onClick={runAllTests} disabled={runAll}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-bold rounded-xl transition-all">
          {runAll ? <><RefreshCw className="w-4 h-4 animate-spin" /> Running All...</> : <><Play className="w-4 h-4" /> Run All Tests</>}
        </button>

        {Object.keys(results).length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">{passCount} Pass</span>
            {failCount > 0 && <span className="text-xs px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full font-semibold">{failCount} Fail</span>}
            {warnCount > 0 && <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-semibold">{warnCount} Warn</span>}
            <span className="text-xs text-muted-foreground">{testedCount}/{tests.length} tested</span>
          </div>
        )}

        <div className="ml-auto">
          <Badge className={mode === "real" ? "bg-red-100 text-red-700 border-red-300 text-xs" : "bg-amber-100 text-amber-700 border-amber-300 text-xs"}>
            {mode === "real" ? "🔴 REAL MODE" : "🟡 DEMO MODE"}
          </Badge>
        </div>
      </motion.div>

      {/* ── Test Cards by Category ──────────────────────────── */}
      {testedCount > 0 && (
        <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="glass-card rounded-2xl p-4 border-l-4 border-blue-400">
            <p className="text-xs font-semibold text-muted-foreground">Overall Confidence</p>
            <p className="text-3xl font-bold text-foreground mt-1">{overallScore}/100</p>
            <p className="text-xs text-muted-foreground mt-1">Pass = 100, Warn = 60, Fail = 0</p>
          </div>
          <div className="glass-card rounded-2xl p-4 border-l-4 border-violet-400">
            <p className="text-xs font-semibold text-muted-foreground">AI Score</p>
            <p className="text-3xl font-bold text-foreground mt-1">{aiScore}/100</p>
            <p className="text-xs text-muted-foreground mt-1">Buddy, quality, timing, A/B tests se derived</p>
          </div>
          <div className="glass-card rounded-2xl p-4 border-l-4 border-emerald-400">
            <p className="text-xs font-semibold text-muted-foreground">CRM Score</p>
            <p className="text-3xl font-bold text-foreground mt-1">{crmScore}/100</p>
            <p className="text-xs text-muted-foreground mt-1">Messaging + server/data tests se derived</p>
          </div>
        </motion.div>
      )}

      {categories.map(cat => {
        const catTests = tests.filter(t => t.category === cat);
        const catPass = catTests.filter(t => results[t.id]?.status === "pass").length;
        const catFail = catTests.filter(t => results[t.id]?.status === "fail").length;
        return (
          <motion.div key={cat} variants={staggerItem}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold text-foreground">{categoryLabels[cat]}</h2>
              <Badge className={CATEGORY_COLORS[cat]}>{cat}</Badge>
              {catFail > 0 && <Badge className="bg-red-50 text-red-600 border-red-200 text-xs">{catFail} failed</Badge>}
              {catPass > 0 && catFail === 0 && <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-xs">{catPass} passed</Badge>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {catTests.map(test => {
                const result = results[test.id];
                const isRunning = running.has(test.id);
                const cfg = STATUS_CONFIG[result?.status || "idle"];
                const StatusIcon = isRunning ? RefreshCw : cfg.icon;
                const isOpen = expanded === test.id;

                return (
                  <motion.div key={test.id} layout
                    className={`glass-card rounded-2xl border overflow-hidden transition-all ${cfg.border}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.border} border`}>
                            <test.icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{test.label}</p>
                            <p className="text-xs text-muted-foreground">{test.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {result && (
                            <button onClick={() => setExpanded(isOpen ? null : test.id)}
                              className="p-1 rounded-lg hover:bg-muted transition-colors">
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                            </button>
                          )}
                          <button onClick={() => runTest(test)} disabled={isRunning || runAll}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${result?.status === "pass" ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : result?.status === "fail" ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" : "bg-white text-foreground border-border hover:bg-muted"} disabled:opacity-50`}>
                            <StatusIcon className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
                            {isRunning ? "..." : result ? "Retry" : "Run"}
                          </button>
                        </div>
                      </div>

                      {/* Quick result line */}
                      {result && !isOpen && (
                        <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg ${cfg.bg} ${cfg.border} border`}>
                          <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${cfg.color}`} />
                          <span className={`text-xs font-medium ${cfg.color}`}>{result.message}</span>
                          {result.latency && <span className="text-[10px] text-muted-foreground ml-auto">{result.latency}ms</span>}
                        </div>
                      )}
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isOpen && result && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          className={`border-t ${cfg.border} ${cfg.bg} overflow-hidden`}>
                          <div className="p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                              <span className={`text-sm font-semibold ${cfg.color}`}>{result.message}</span>
                            </div>
                            {result.detail && <p className="text-xs text-muted-foreground leading-relaxed">{result.detail}</p>}
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              {result.timestamp && <span>Tested: {result.timestamp}</span>}
                              {result.latency && <span>Latency: {result.latency}ms</span>}
                              <span>Mode: {mode === "real" ? "🔴 Real" : "🟡 Demo"}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {/* ── Info Banner ─────────────────────────────────────── */}
      <motion.div variants={staggerItem} className="glass-card rounded-2xl p-4 border border-blue-200 bg-blue-50/50">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">Demo vs Real Mode — kya farq hai?</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Demo Mode:</strong> CRM sirf UI dikhata hai — WhatsApp console mein jaata hai, AI hardcoded replies deta hai, leads static hain.
              Testing + presentation ke liye best hai.<br />
              <strong>Real Mode:</strong> CRM live APIs use karta hai — WhatsApp messages actually bhejte hain (+91-9899925274 pe), Gemini AI real calls karta hai,
              leads real server mein store hoti hain. Production use ke liye.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
