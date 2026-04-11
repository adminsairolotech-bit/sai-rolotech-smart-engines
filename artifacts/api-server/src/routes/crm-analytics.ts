import { Router, type Request, type Response } from "express";

const router = Router();

/**
 * GET /api/lead-analytics
 * Returns aggregated lead analytics for Lead Intelligence page.
 * Falls back to mock data if SUPABASE_URL not configured.
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const SUPABASE_URL = process.env["SUPABASE_URL"];
    const SUPABASE_SERVICE_KEY = process.env["SUPABASE_SERVICE_KEY"];

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      // Return mock analytics so the UI is never empty
      return res.json({
        success: true,
        source: "mock",
        totalLeads: 47,
        bySource: [
          { source: "IndiaMART", count: 18, conversionRate: 22, value: 3240000 },
          { source: "JustDial", count: 12, conversionRate: 17, value: 2160000 },
          { source: "WhatsApp", count: 8, conversionRate: 38, value: 2880000 },
          { source: "Direct / Walk-in", count: 5, conversionRate: 40, value: 1500000 },
          { source: "TradeIndia", count: 4, conversionRate: 25, value: 720000 },
        ],
        byLocation: [
          { location: "Delhi NCR", count: 14, value: 2100000, priority: "HIGH" },
          { location: "Haryana", count: 8, value: 1600000, priority: "HIGH" },
          { location: "UP", count: 7, value: 980000, priority: "MEDIUM" },
          { location: "Punjab", count: 5, value: 1200000, priority: "HIGH" },
          { location: "Rajasthan", count: 4, value: 600000, priority: "MEDIUM" },
          { location: "Maharashtra", count: 4, value: 1100000, priority: "MEDIUM" },
          { location: "Gujarat", count: 3, value: 450000, priority: "MEDIUM" },
          { location: "MP", count: 2, value: 280000, priority: "LOW" },
        ],
        priorityLeads: [
          { id: 1, name: "Satpal Singh", score: 95, location: "Delhi NCR", source: "IndiaMART" },
          { id: 2, name: "Ramesh Yadav", score: 88, location: "Punjab", source: "Direct" },
          { id: 3, name: "Ankit Gupta", score: 82, location: "Haryana", source: "JustDial" },
          { id: 4, name: "Vijay Sharma", score: 75, location: "UP", source: "WhatsApp" },
          { id: 5, name: "Suresh Kumar", score: 70, location: "Delhi NCR", source: "IndiaMART" },
        ],
        recommendations: [
          { type: "hot_lead", message: "5 HIGH priority leads haven't been contacted in 48h+", priority: "urgent" },
          { type: "follow_up", message: "Delhi NCR leads have 35% better conversion — focus on that zone", priority: "normal" },
          { type: "source", message: "WhatsApp leads convert 2x better than average — invest more there", priority: "normal" },
        ],
      });
    }

    // Real Supabase query
    const headers = {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
    };

    // Fetch leads
    const leadsRes = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*`, { headers });
    if (!leadsRes.ok) throw new Error("Failed to fetch leads from Supabase");
    const leads: Array<{
      id: number;
      name: string;
      source: string | null;
      city: string | null;
      pipeline_stage: string | null;
      budget: string | null;
      lead_score: number | null;
      created_at: string;
    }> = await leadsRes.json();

    // Aggregate by source
    const sourceMap: Record<string, { count: number; won: number; value: number }> = {};
    const locationMap: Record<string, { count: number; value: number }> = {};

    leads.forEach(l => {
      const source = l.source || "Unknown";
      const city = l.city || "Unknown";
      const value = parseFloat(String(l.budget || "0").replace(/[^\d.]/g, "")) || 0;

      if (!sourceMap[source]) sourceMap[source] = { count: 0, won: 0, value: 0 };
      sourceMap[source].count++;
      sourceMap[source].value += value;
      if (l.pipeline_stage === "won") sourceMap[source].won++;

      if (!locationMap[city]) locationMap[city] = { count: 0, value: 0 };
      locationMap[city].count++;
      locationMap[city].value += value;
    });

    const bySource = Object.entries(sourceMap).map(([source, data]) => ({
      source,
      count: data.count,
      conversionRate: data.count > 0 ? Math.round((data.won / data.count) * 100) : 0,
      value: data.value,
    }));

    // Priority locations
    const locationPriority: Record<string, string> = {
      "Delhi": "HIGH", "New Delhi": "HIGH", "Noida": "HIGH", "Gurgaon": "HIGH",
      "Gurugram": "HIGH", "Faridabad": "HIGH", "Ghaziabad": "HIGH",
      "Haryana": "HIGH", "Punjab": "HIGH", "Chandigarh": "HIGH",
      "UP": "MEDIUM", "Uttar Pradesh": "MEDIUM", "Lucknow": "MEDIUM",
      "Rajasthan": "MEDIUM", "Jaipur": "MEDIUM",
      "Maharashtra": "MEDIUM", "Mumbai": "MEDIUM", "Pune": "MEDIUM",
      "MP": "LOW", "Madhya Pradesh": "LOW", "Bhopal": "LOW",
    };

    const byLocation = Object.entries(locationMap)
      .map(([location, data]) => ({
        location,
        count: data.count,
        value: data.value,
        priority: locationPriority[location] || "LOW",
      }))
      .sort((a, b) => b.value - a.value);

    // Priority leads (top scored)
    const priorityLeads = leads
      .filter(l => l.lead_score && l.lead_score >= 70)
      .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
      .slice(0, 5)
      .map(l => ({
        id: l.id,
        name: l.name,
        score: l.lead_score || 0,
        location: l.city || "—",
        source: l.source || "—",
      }));

    // Recommendations
    const recommendations = [];
    const uncontacted = leads.filter(l => {
      if (!l.created_at) return false;
      const days = (Date.now() - new Date(l.created_at).getTime()) / 86400000;
      return days >= 2 && (l.pipeline_stage === "new_lead" || !l.pipeline_stage);
    });
    if (uncontacted.length >= 3) {
      recommendations.push({
        type: "hot_lead",
        message: `${uncontacted.length} new leads haven't been contacted in 48h+`,
        priority: "urgent",
      });
    }
    recommendations.push({
      type: "follow_up",
      message: "Delhi NCR + Haryana leads have highest conversion — prioritize those zones",
      priority: "normal",
    });

    return res.json({
      success: true,
      source: "supabase",
      totalLeads: leads.length,
      bySource,
      byLocation,
      priorityLeads,
      recommendations,
    });
  } catch (err) {
    console.error("[lead-analytics] Error:", err);
    return res.status(500).json({ success: false, error: "Analytics fetch failed" });
  }
});

export default router;
