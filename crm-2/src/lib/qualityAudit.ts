const PRICE_REGEX = /(?:₹|rs\.?|inr)\s*\d/i;
const GUARANTEE_REGEX = /\b(guarantee|guaranteed|100%|cheapest|lowest price|best price)\b/i;
const FREEBIE_REGEX = /\bfree\s+(delivery|installation|service|warranty|visit)\b/i;
const DELIVERY_REGEX = /\b(?:same day|next day|within\s+\d+\s+days?|today|tomorrow)\b/i;
const COMPETITOR_REGEX = /\bcompetitor\b/i;

export interface ReplyAudit {
  ok: boolean;
  score: number;
  issues: string[];
}

export function auditBuddyReply(reply: string): ReplyAudit {
  const issues: string[] = [];
  const text = reply.trim();

  if (!text) {
    return { ok: false, score: 0, issues: ["Empty reply"] };
  }

  if (text.length > 320) {
    issues.push("Reply too long for CRM chat");
  }
  if (PRICE_REGEX.test(text)) {
    issues.push("Exact price mentioned");
  }
  if (GUARANTEE_REGEX.test(text)) {
    issues.push("Guarantee or price-superlative language found");
  }
  if (FREEBIE_REGEX.test(text)) {
    issues.push("Freebie promise found");
  }
  if (DELIVERY_REGEX.test(text)) {
    issues.push("Exact delivery commitment found");
  }
  if (COMPETITOR_REGEX.test(text)) {
    issues.push("Competitor mention found");
  }

  return {
    ok: issues.length === 0,
    score: Math.max(0, 100 - issues.length * 20),
    issues,
  };
}

export function auditStageCoverage(stages: string[]) {
  const allowed = new Set(["new_lead", "contacted", "quotation_sent", "negotiating", "won", "lost"]);
  const invalid = stages.filter((stage) => !allowed.has(stage));
  return {
    ok: invalid.length === 0,
    invalid,
  };
}
