/**
 * AI Manager — Gemini (personal key) → Predefined fallback
 * No lead ever gets lost due to AI failure
 */
import { GoogleGenAI } from '@google/genai';
import { isEnabled, increment, logError, getConfig } from './configService.js';
import { validateAIResponse, sanitizeInput, isSpamInput } from './aiValidator.js';

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

const responseCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

const conversationHistory = new Map();
const HISTORY_TTL = 24 * 60 * 60 * 1000;
const MAX_HISTORY = 10;

function getHistory(leadPhone) {
  if (!leadPhone) return [];
  const entry = conversationHistory.get(leadPhone);
  if (!entry || Date.now() - entry.lastUpdated > HISTORY_TTL) {
    conversationHistory.delete(leadPhone);
    return [];
  }
  return entry.messages;
}

function addToHistory(leadPhone, role, text) {
  if (!leadPhone) return;
  let entry = conversationHistory.get(leadPhone);
  if (!entry || Date.now() - entry.lastUpdated > HISTORY_TTL) {
    entry = { messages: [], lastUpdated: Date.now() };
  }
  entry.messages.push({ role, text: text.slice(0, 200) });
  if (entry.messages.length > MAX_HISTORY) {
    entry.messages = entry.messages.slice(-MAX_HISTORY);
  }
  entry.lastUpdated = Date.now();
  conversationHistory.set(leadPhone, entry);
  if (conversationHistory.size > 500) {
    const oldest = [...conversationHistory.entries()].sort((a, b) => a[1].lastUpdated - b[1].lastUpdated);
    for (let i = 0; i < 100; i++) conversationHistory.delete(oldest[i][0]);
  }
}

const SMART_SALES_STRATEGIES = {
  VERY_HOT: {
    tone: 'confident and closing',
    approach: 'Push for meeting/demo, mention urgency, offer special terms',
    suffix: '\n\nSALES STRATEGY: This is a VERY HOT lead about to buy. Be confident, push for immediate meeting/demo booking. Create urgency. Mention "special terms for quick decision".'
  },
  HOT: {
    tone: 'enthusiastic and solution-focused',
    approach: 'Share specific solutions, offer demo, build trust',
    suffix: '\n\nSALES STRATEGY: This is a HOT lead actively interested. Be enthusiastic, provide specific machine recommendations, and strongly push for a demo visit.'
  },
  WARM: {
    tone: 'helpful and educational',
    approach: 'Share knowledge, answer questions thoroughly, nurture interest',
    suffix: '\n\nSALES STRATEGY: This is a WARM lead exploring options. Be educational, share helpful machine info, ask about their specific requirements to qualify them further.'
  },
  COLD: {
    tone: 'friendly and welcoming',
    approach: 'Welcome warmly, understand needs, be patient',
    suffix: '\n\nSALES STRATEGY: This is a new/COLD lead. Be very warm and welcoming. Ask open questions about their business and needs. Do NOT push sales yet. Build rapport first.'
  },
};

const SYSTEM_PROMPT = `You are a helpful sales assistant for SAI RoloTech, an industrial roll forming machine manufacturer in New Delhi.

STRICT RULES (NEVER BREAK):
- Reply in Hinglish (mix of Hindi and English) — friendly, helpful tone
- Keep replies SHORT — under 50 words
- NEVER mention exact prices, rates or amounts
- NEVER promise delivery dates (say "estimated" only)
- NEVER guarantee anything — say "we strive to" instead
- NEVER mention competitor names or compare
- NEVER make false claims about being "best" or "cheapest"
- If asked about pricing: "Aapki requirement ke hisaab se quote bhejte hain"
- If asked about delivery: "Estimated delivery aapke order pe depend karti hai"
- Ask questions first, don't push sales
- Always be polite and professional
- If unsure, say "Main team se check karke batata hoon"`;

const FALLBACK_MESSAGES = [
  "Namaste! SAI RoloTech mein aapka swagat hai. Aap kaunsi machine ke baare mein jaanna chahte hain? 🙏",
  "Hum yahan hain aapki madad ke liye! Apni requirement batayein, hum best solution dhundhenge.",
  "Thank you for reaching out! Aapko kya chahiye — machine specs, pricing, ya demo?",
];

const QUICK_REPLIES = {
  price: {
    COLD: "Namaste! Pricing aapki requirement pe depend karti hai. Pehle batayein aapko kaunsi machine chahiye? 📋",
    WARM: "Pricing aapki exact requirement pe depend karti hai. Dimensions aur capacity batao, ek detailed quote bhejte hain. 📋",
    HOT: "Aapke liye special pricing ready kar rahe hain! Ek quick call pe sab clear ho jayega. Kab baat karein? 📋",
    VERY_HOT: "Aapke liye best deal ready hai! Abhi call karein ya meeting fix karein — special terms mil sakte hain. 📋🔥",
  },
  delivery: {
    COLD: "Delivery estimated 45-60 din mein hoti hai. Kaunsi machine dekhna chahte hain? 🚚",
    WARM: "Delivery usually 45-60 din mein hoti hai. Urgent chahiye toh bata dein, arrange karte hain. 🚚",
    HOT: "Aapke order ke liye priority delivery arrange kar sakte hain! Details finalize karein? 🚚",
    VERY_HOT: "Fast-track delivery available hai aapke liye! Abhi order confirm karein toh jaldi ship hoga. 🚚🔥",
  },
  quality: {
    default: "Hamare material ISI certified hai. 5 saal ka warranty aur free installation support milta hai. ✅",
  },
  demo: {
    COLD: "Demo ke liye free visit arrange kar sakte hain! Aapka location bata dein. 📍",
    WARM: "Demo ke liye free visit arrange kar sakte hain! Aapka location bata dein. 📍",
    HOT: "Bilkul! Aapke liye demo kal ya parso arrange karte hain. Kab aayenge? 📍",
    VERY_HOT: "Demo ready hai! Aaj ya kal — bas time confirm karein, sab set kar dete hain. 📍🔥",
  },
  meeting: {
    COLD: "Meeting ke liye kal ya parso available hain. Kon sa time suitable rahega? 📅",
    WARM: "Meeting ke liye kal ya parso available hain. Kon sa time suitable rahega? 📅",
    HOT: "Zaroor! Meeting fix karte hain — kal ya parso? Main personally milna chahunga. 📅",
    VERY_HOT: "Bilkul! Aaj ya kal milte hain — aapke liye special session rakhte hain. Time batayein! 📅🔥",
  },
};

function getSafeQuickReply(reply, context = {}) {
  const validation = validateAIResponse(reply, context);
  if (validation.blocked || validation.issueCount > 0 || validation.fallback) {
    return FALLBACK_MESSAGES[0];
  }
  return validation.response || FALLBACK_MESSAGES[0];
}

function detectQuickReply(message, leadScore = 'COLD', context = {}) {
  const lower = message.toLowerCase();
  let category = null;
  if (lower.includes('price') || lower.includes('rate') || lower.includes('kitna')) category = 'price';
  else if (lower.includes('delivery') || lower.includes('deliver') || lower.includes('kab')) category = 'delivery';
  else if (lower.includes('quality') || lower.includes('warranty')) category = 'quality';
  else if (lower.includes('demo') || lower.includes('visit')) category = 'demo';
  else if (lower.includes('meeting') || lower.includes('milna') || lower.includes('call')) category = 'meeting';
  if (!category) return null;
  const replies = QUICK_REPLIES[category];
  return getSafeQuickReply(replies[leadScore] || replies.default || replies.COLD || replies.WARM, context);
}

async function tryGemini(prompt, model = 'gemini-2.5-flash') {
  if (!GEMINI_KEY) throw new Error('No Gemini key');
  const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
  const modelMap = {
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini-1.5-flash': 'gemini-1.5-flash',
    'gemini-1.5-pro': 'gemini-1.5-pro',
  };
  const resolvedModel = modelMap[model] || 'gemini-2.5-flash';
  const response = await ai.models.generateContent({
    model: resolvedModel,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT, maxOutputTokens: 150, temperature: 0.7 },
  });
  return response.text || '';
}

export async function generateReply(userMessage, context = {}) {
  if (!isEnabled('aiEnabled')) {
    return 'Hamari team jaldi aapse contact karegi. Dhanyawad! 🙏';
  }

  const safeMessage = sanitizeInput(userMessage);
  if (isSpamInput(safeMessage)) {
    console.log('🛡️ Spam input blocked');
    return 'Kripya apna sawaal clearly likhein, hum madad karenge! 🙏';
  }

  const leadScore = context.leadScore || 'COLD';

  const quick = detectQuickReply(safeMessage, leadScore, context);
  if (quick) {
    addToHistory(context.leadPhone, 'user', safeMessage);
    addToHistory(context.leadPhone, 'assistant', quick);
    return quick;
  }

  const cacheKey = `${context.leadPhone || 'anon'}_${safeMessage}_${leadScore}`;
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    addToHistory(context.leadPhone, 'user', safeMessage);
    addToHistory(context.leadPhone, 'assistant', cached.reply);
    return cached.reply;
  }

  const history = getHistory(context.leadPhone);
  const strategy = SMART_SALES_STRATEGIES[leadScore] || SMART_SALES_STRATEGIES.COLD;

  let promptParts = [];

  if (context.memoryContext) {
    promptParts.push('=== LEAD MEMORY PROFILE ===');
    promptParts.push(context.memoryContext);
    promptParts.push('=== END MEMORY ===\n');
  } else {
    if (context.leadName) promptParts.push(`Customer Name: ${context.leadName}`);
    if (context.leadCity) promptParts.push(`Location: ${context.leadCity}`);
    if (context.leadProduct) promptParts.push(`Interested In: ${context.leadProduct}`);
    promptParts.push(`Lead Temperature: ${leadScore}`);

    if (history.length > 0) {
      promptParts.push('\nPrevious conversation:');
      history.forEach(h => promptParts.push(`${h.role === 'user' ? 'Customer' : 'You'}: ${h.text}`));
    }
  }

  promptParts.push(`\nNew message from customer: ${safeMessage}`);
  promptParts.push(strategy.suffix);

  const prompt = promptParts.join('\n');
  const cfg = getConfig();

  let reply = '';
  increment('aiCalls');

  addToHistory(context.leadPhone, 'user', safeMessage);

  try {
    reply = await tryGemini(prompt, cfg.aiModel);
    console.log(`🤖 AI via Gemini (${cfg.aiModel || 'gemini-2.5-flash'}) | Score: ${leadScore} | History: ${history.length} msgs`);
  } catch (e) {
    console.warn('Gemini failed:', e.message, '— using fallback');
    logError('Gemini', e.message, `Model: ${cfg.aiModel}`);
    increment('aiErrors');
    reply = FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
  }

  if (reply) {
    const validation = validateAIResponse(reply, context);
    if (validation.issueCount > 0) {
      increment('aiFiltered');
      logError('AIValidator', `${validation.issueCount} issues fixed`, validation.issues.join('; '));
    }
    reply = validation.response || FALLBACK_MESSAGES[0];
  }

  if (reply) {
    responseCache.set(cacheKey, { reply, time: Date.now() });
    addToHistory(context.leadPhone, 'assistant', reply);
  }

  return reply;
}

export function clearCache() {
  responseCache.clear();
}
