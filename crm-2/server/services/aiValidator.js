/**
 * AI Response Validator — Production Safety Layer
 * AI → Validation → Confidence Gate → Safe Response
 * 
 * Prevents: fake promises, wrong prices, competitor mentions,
 * inappropriate content, over-commitments, hallucinations, harmful content
 */

export const SAFE_AI_FALLBACK =
  'Maaf kijiye, abhi main is sawal ka reliable jawab confirm nahi kar pa raha. Hamare expert team se baat karein — SAI RoloTech helpline pe call karein.';

const UNCERTAINTY_REGEX =
  /\b(maybe|i\s*think|not\s*sure|i\s*don'?t\s*know|possibly|i\s*am\s*not\s*certain|mujhe\s*pata\s*nahi|shayad)\b/i;

const HARMFUL_REGEX =
  /\b(kill\s*yourself|suicide|self[-\s]*harm|make\s*a\s*bomb|terrorist|sexual\s*assault|child\s*porn|genocide|hate\s*speech)\b/i;

const BLOCKED_PHRASES = [
  'guaranteed', 'guarantee', '100%', 'promise',
  'best price in india', 'cheapest', 'lowest price',
  'free delivery', 'free installation',
  'free visit',
  'next day delivery', 'same day delivery',
  'competitor', 'others are bad',
  'unlimited warranty', 'lifetime free',
  '45-60 din', '5 saal ka warranty',
];

const OVERPROMISE_PATTERNS = [
  /deliver(?:y|ed)?\s+(?:in|within)\s+(?:1|2|one|two)\s+days?/i,
  /(?:free|no)\s+(?:cost|charge|payment)/i,
  /free\s+visit/i,
  /(?:best|cheapest|lowest)\s+(?:price|rate|cost)\s+in\s+(?:india|market|world)/i,
  /(?:guarantee|guaranteed)\s+(?:delivery|quality|result|return)/i,
  /100%\s+(?:guarantee|satisfaction|refund|money\s*back)/i,
  /(?:unlimited|lifetime)\s+(?:warranty|support|service)\s+free/i,
  /we\s+(?:are|will)\s+(?:beat|match)\s+any\s+(?:price|quote|rate)/i,
  /\b(?:today|tomorrow|aaj|kal|parso)\b/i,
  /\b\d+\s*-\s*\d+\s*din\b/i,
  /\b\d+\s+saal\s+ka\s+warranty\b/i,
];

const PRICE_PATTERN = /(?:₹|rs\.?|inr|price\s*(?:is|=|:))\s*[\d,]+(?:\.\d+)?/i;

const SAFE_REPLACEMENTS = {
  'guaranteed delivery': 'estimated delivery',
  'guarantee': 'we strive to ensure',
  'best price': 'competitive pricing',
  'cheapest': 'cost-effective',
  'lowest price': 'competitive rate',
  'free delivery': 'delivery charges apply as per location',
  'free installation support': 'installation support available',
  'free installation': 'installation support available',
  'free visit': 'site visit can be arranged',
  'next day delivery': 'fast delivery options available',
  'same day delivery': 'quick dispatch possible',
  '100% satisfaction': 'customer satisfaction is our priority',
  'unlimited warranty': 'comprehensive warranty available',
  '45-60 din': 'estimated timeline depends on order scope',
  '5 saal ka warranty': 'warranty options available as per machine model',
};

const INAPPROPRIATE_WORDS = [
  'stupid', 'idiot', 'fool', 'hate', 'terrible',
  'damn', 'hell', 'crap', 'suck', 'worst',
  'bakwas', 'bekar', 'ghatiya', 'bewakoof',
];

export function validateAIResponse(response, context = {}) {
  if (!response || typeof response !== 'string') {
    return { valid: false, response: SAFE_AI_FALLBACK, issues: ['Empty response'], blocked: false, fallback: true };
  }

  const issues = [];
  let cleaned = response.trim();

  if (HARMFUL_REGEX.test(cleaned)) {
    console.error('[AI Validator] HARMFUL content blocked');
    return { valid: false, response: '', issues: ['Harmful content blocked'], blocked: true, fallback: false };
  }

  if (cleaned.length < 20 || UNCERTAINTY_REGEX.test(cleaned)) {
    return { valid: false, response: SAFE_AI_FALLBACK, issues: ['Low confidence response'], blocked: false, fallback: true };
  }

  if (cleaned.length > 3000) {
    cleaned = cleaned.slice(0, 3000);
    issues.push('Response truncated (too long)');
  }

  for (const word of INAPPROPRIATE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(cleaned)) {
      issues.push(`Inappropriate word removed: ${word}`);
      cleaned = cleaned.replace(regex, '***');
    }
  }

  for (const pattern of OVERPROMISE_PATTERNS) {
    if (pattern.test(cleaned)) {
      issues.push(`Overpromise detected: ${pattern.source}`);
      cleaned = cleaned.replace(pattern, '[details available on request]');
    }
  }

  for (const [bad, safe] of Object.entries(SAFE_REPLACEMENTS)) {
    const regex = new RegExp(bad, 'gi');
    if (regex.test(cleaned)) {
      issues.push(`Unsafe phrase replaced: "${bad}" → "${safe}"`);
      cleaned = cleaned.replace(regex, safe);
    }
  }

  if (PRICE_PATTERN.test(cleaned) && !context.allowPrice) {
    issues.push('Exact price removed — replaced with quote offer');
    cleaned = cleaned.replace(PRICE_PATTERN, '[price available on quote request]');
  }

  for (const phrase of BLOCKED_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    if (regex.test(cleaned)) {
      issues.push(`Blocked phrase found: "${phrase}"`);
      cleaned = cleaned.replace(regex, '');
    }
  }

  cleaned = cleaned
    .replace(/\s{3,}/g, '  ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const valid = issues.length === 0;

  if (issues.length > 0) {
    console.log(`[AI Validator] ${issues.length} issue(s) fixed:`, issues.join(', '));
  }

  return {
    valid,
    response: cleaned,
    issues,
    blocked: false,
    fallback: false,
    originalLength: response.length,
    cleanedLength: cleaned.length,
    issueCount: issues.length,
  };
}

export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>"'&]/g, (c) => ({
      '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'
    }[c] || c))
    .slice(0, 2000)
    .trim();
}

export function isSpamInput(input) {
  if (!input) return true;
  const lower = input.toLowerCase().trim();
  if (lower.length < 2) return true;
  if (lower.length > 1000) return true;
  if (/^(.)\1{10,}$/.test(lower)) return true;
  if ((lower.match(/https?:\/\//g) || []).length > 2) return true;
  return false;
}
