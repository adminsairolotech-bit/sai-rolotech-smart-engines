import { Router, type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// Scoring weights
const SOURCE_WEIGHTS: Record<string, number> = {
  "whatsapp": 18, "direct / walk-in": 15, "indiamart": 10,
  "justdial": 8, "tradeindia": 6, "referral": 14,
};

const LOCATION_WEIGHTS: Record<string, number> = {
  "delhi": 12, "new delhi": 12, "noida": 12, "gurgaon": 12,
  "gurugram": 12, "faridabad": 12, "ghaziabad": 12,
  "haryana": 12, "punjab": 12, "chandigarh": 12,
  "up": 8, "uttar pradesh": 8, "lucknow": 8,
  "maharashtra": 8, "mumbai": 8, "pune": 8,
  "rajasthan": 6, "jaipur": 6,
  "gujarat": 5, "mp": 4, "bhopal": 4,
};

const STAGE_WEIGHTS: Record<string, number> = {
  "won": 30, "negotiation": 22, "proposal": 15,
  "contacted": 10, "new_lead": 5, "lost": 0,
};

interface RawLead {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
  budget: string | null;
  pipeline_stage: string | null;
  lead_score: number | null;
  created_at: string;
  last_activity_at: string | null;
  whatsapp_no: string | null;
}

interface ScoredLead extends RawLead {
  ai_score: number;
  score_breakdown: {
    source: number;
    location: number;
    stage: number;
    budget: number;
    engagement: number;
    recency: number;
    company: number;
  };
  ai_recommendation: string;
}

function scoreLead(lead: RawLead, activityCount: number): ScoredLead {
  const breakdown = { source: 0, location: 0, stage: 0, budget: 0, engagement: 0, recency: 0, company: 0 };
  let total = 0;

  // Source (max 18)
  const src = (lead.source || "").toLowerCase();
  breakdown.source = SOURCE_WEIGHTS[src] ?? 5;
  total += breakdown.source;

  // Location (max 12)
  const city = (lead.city || "").toLowerCase();
  const state = (lead.state || "").toLowerCase();
  const loc = `${city} ${state}`;
  breakdown.location = Math.max(
    LOCATION_WEIGHTS[city] ?? 0,
    LOCATION_WEIGHTS[state] ?? 0,
    Object.entries(LOCATION_WEIGHTS).find(([k]) => loc.includes(k))?.[1] ?? 4
  );
  total += breakdown.location;

  // Stage (max 30)
  const stage = (lead.pipeline_stage || "").toLowerCase();
  breakdown.stage = STAGE_WEIGHTS[stage] ?? 5;
  total += breakdown.stage;

  // Budget (max 20)
  const budgetStr = lead.budget || "";
  const budgetNum = parseFloat(budgetStr.replace(/[^\d.]/g, "")) || 0;
  if (budgetStr.includes("L") || budgetStr.includes("lakh")) {
    breakdown.budget = budgetNum >= 20 ? 20 : budgetNum >= 10 ? 15 : budgetNum >= 5 ? 10 : 5;
  } else if (budgetStr.includes("Cr") || budgetStr.includes("crore")) {
    breakdown.budget = 20;
  } else if (budgetNum > 0) {
    breakdown.budget = budgetNum >= 2000000 ? 20 : budgetNum >= 1000000 ? 15 : budgetNum >= 500000 ? 10 : 5;
  }
  total += breakdown.budget;

  // Engagement (max 25 = 5 points per activity, 5 max)
  breakdown.engagement = Math.min(25, activityCount * 5);
  total += breakdown.engagement;

  // Recency decay (max 10) — days since last activity
  const lastActivity = lead.last_activity_at ? new Date(lead.last_activity_at).getTime() : 0;
  const daysSince = lastActivity > 0 ? (Date.now() - lastActivity) / 86400000 : 999;
  breakdown.recency = daysSince <= 1 ? 10 : daysSince <= 3 ? 8 : daysSince <= 7 ? 5 : daysSince <= 14 ? 3 : 1;
  total += breakdown.recency;

  // Company name presence (max 5)
  breakdown.company = lead.company_name ? 5 : 0;
  total += breakdown.company;

  // Clamp to 0-100
  const ai_score = Math.min(100, Math.max(0, total));

  // AI Recommendation
  let recommendation = "";
  if (ai_score >= 80) recommendation = "🔥 Priority — Contact immediately, book a demo";
  else if (ai_score >= 60) recommendation = "📞 Warm lead — Follow up within 24 hours";
  else if (ai_score >= 40) recommendation = "📧 Medium priority — Send specs and pricing email";
  else if (ai_score >= 20) recommendation = "⏳ Low priority — Add to nurture sequence";
  else recommendation = "📦 Cold — Long-term nurture, share catalog";

  return { ...lead, ai_score, score_breakdown: breakdown, ai_recommendation: recommendation };
}

/**
 * POST /api/ai-score-leads
 * Scores all leads using AI signal analysis.
 * Updates lead_score in leads table and stores breakdown in lead_scores.
 */
router.post("/score-leads", async (req: Request, res: Response) => {
  try {
    const SUPABASE_URL = process.env["SUPABASE_URL"];
    const SUPABASE_SERVICE_KEY = process.env["SUPABASE_SERVICE_KEY"];

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.json({
        success: true,
        source: "mock",
        scored: mockScoreAllLeads(),
      });
    }

    const headers = {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
    };

    // Fetch all leads
    const leadsRes = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*`, { headers });
    if (!leadsRes.ok) throw new Error("Failed to fetch leads");
    const leads = await leadsRes.json() as RawLead[];

    // Fetch activity counts per lead
    const activitiesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/lead_activities?select=lead_id`, { headers }
    );
    const activities: Array<{ lead_id: number }> = activitiesRes.ok
      ? await activitiesRes.json() as Array<{ lead_id: number }>
      : [];
    const activityMap: Record<number, number> = {};
    activities.forEach(a => {
      activityMap[a.lead_id] = (activityMap[a.lead_id] || 0) + 1;
    });

    // Score each lead
    const scored = leads.map(l => scoreLead(l, activityMap[l.id] || 0));

    // Update leads table with scores (batch)
    await Promise.allSettled(
      scored.map(l =>
        fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${l.id}`, {
          method: "PATCH",
          headers: { ...headers, "Prefer": "return=minimal" },
          body: JSON.stringify({ lead_score: l.ai_score }),
        })
      )
    );

    // Store in lead_scores table
    await Promise.allSettled(
      scored.map(l =>
        fetch(`${SUPABASE_URL}/rest/v1/lead_scores`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json", "Prefer": "return=minimal" },
          body: JSON.stringify({
            lead_id: l.id,
            score: l.ai_score,
            breakdown: l.score_breakdown,
            recommendation: l.ai_recommendation,
          }),
        }).catch(() => {})
      )
    );

    console.log(`[ai-score] Scored ${scored.length} leads`);
    return res.json({ success: true, source: "supabase", scored: scored.length });
  } catch (err) {
    console.error("[ai-score] Error:", err);
    return res.status(500).json({ success: false, error: "Scoring failed" });
  }
});

/**
 * GET /api/ai-score-leads/:id
 * Returns AI score for a single lead with breakdown.
 */
router.get("/score-leads/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id ?? "");
    const SUPABASE_URL = process.env["SUPABASE_URL"];
    const SUPABASE_SERVICE_KEY = process.env["SUPABASE_SERVICE_KEY"];

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.json({
        success: true,
        source: "mock",
        scored: mockScoreAllLeads().find(l => l.id === parseInt(id, 10)),
      });
    }

    const headers = {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
    };

    // Fetch lead
    const leadRes = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}&select=*`, { headers });
    const leads = await leadRes.json() as RawLead[];
    if (leads.length === 0) return res.status(404).json({ success: false, error: "Lead not found" });

    // Fetch activities
    const activitiesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/lead_activities?lead_id=eq.${id}`, { headers }
    );
    const activities: Array<{ lead_id: number }> = activitiesRes.ok
      ? await activitiesRes.json() as Array<{ lead_id: number }>
      : [];

    const scored = scoreLead(leads[0], activities.length);
    return res.json({ success: true, ...scored, backendSource: "supabase" });
  } catch (err) {
    console.error("[ai-score] Error:", err);
    return res.status(500).json({ success: false, error: "Scoring failed" });
  }
});

function mockScoreAllLeads() {
  const mockLeads: RawLead[] = [
    { id: 1, name: "Satpal Singh", phone: "+919876543210", email: "satpal@industries.com", company_name: "Satpal Industries", city: "Delhi NCR", state: "Delhi", source: "IndiaMART", budget: "₹8L", pipeline_stage: "proposal", lead_score: 72, created_at: new Date(Date.now() - 5 * 86400000).toISOString(), last_activity_at: new Date(Date.now() - 1 * 86400000).toISOString(), whatsapp_no: "+919876543210" },
    { id: 2, name: "Ramesh Yadav", phone: "+919876543211", email: "ramesh@traders.com", company_name: "Ramesh Traders", city: "Gurgaon", state: "Haryana", source: "WhatsApp", budget: "₹15L", pipeline_stage: "contacted", lead_score: 65, created_at: new Date(Date.now() - 10 * 86400000).toISOString(), last_activity_at: new Date(Date.now() - 2 * 86400000).toISOString(), whatsapp_no: "+919876543211" },
    { id: 3, name: "Ankit Gupta", phone: "+919876543212", email: "ankit@supply.com", company_name: "Ankit Supply Co", city: "Ludhiana", state: "Punjab", source: "JustDial", budget: "₹12L", pipeline_stage: "negotiation", lead_score: 78, created_at: new Date(Date.now() - 8 * 86400000).toISOString(), last_activity_at: new Date().toISOString(), whatsapp_no: "+919876543212" },
    { id: 4, name: "Vijay Sharma", phone: "+919876543213", email: "vijay@sharma.com", company_name: null, city: "Lucknow", state: "UP", source: "IndiaMART", budget: "₹5L", pipeline_stage: "new_lead", lead_score: 38, created_at: new Date(Date.now() - 3 * 86400000).toISOString(), last_activity_at: null, whatsapp_no: "+919876543213" },
    { id: 5, name: "Suresh Kumar", phone: "+919876543214", email: "suresh@factory.com", company_name: "Suresh Factory", city: "Mumbai", state: "Maharashtra", source: "TradeIndia", budget: "₹25L", pipeline_stage: "won", lead_score: 88, created_at: new Date(Date.now() - 20 * 86400000).toISOString(), last_activity_at: new Date(Date.now() - 1 * 86400000).toISOString(), whatsapp_no: "+919876543214" },
  ];
  return mockLeads.map(l => scoreLead(l, Math.floor(Math.random() * 8)));
}

export default router;
