import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { GoogleGenAI } from '@google/genai';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/* ── CRM Backend Services ── */
import { registerHandler, getQueueStats } from './services/queueService.js';
import { getLead, getAllLeads, getStats, getSourceAnalytics, getLocationAnalytics, getPriorityLeads } from './models/leadModel.js';
import { sendWelcomeMessage, sendFollowup, sendAdminAlert, sendQuotationFollowup, sendCustom } from './services/whatsappService.js';
import { sendPushNotification } from './services/fcmService.js';
import { generateReply } from './services/aiManager.js';
import { resumeFollowups } from './services/followupService.js';
import { executeSmartFollowup, markFollowupSent, markFollowupFailed, getSmartFollowupStats, resumeSmartFollowups, getLeadProfile, getConversationHistory, buildContextPrompt } from './services/memoryService.js';
import { executeTaskFollowup, markTaskFailed, generateLeadNotes, generateDailyPlan, generateFollowUpMessage, createManualTask, completeTask, skipTask, getTodayTasks, getUpcomingTasks, getLeadTasks, getLeadNotes, getAllNotes, getTaskStats, bulkGenerateNotes, resumeTasks, startDailyTaskCron } from './services/notesTaskService.js';
import { startDailyReporter } from './services/reportService.js';
import { logAI, logWhatsApp, logSecurity, logSystem, getLogs, getLogStats, clearLogs } from './services/activityLogger.js';
import { validateAIResponse, sanitizeInput, SAFE_AI_FALLBACK } from './services/aiValidator.js';
import leadsRouter from './routes/leads.js';
import productsRouter from './routes/products.js';
import authRouter from './routes/auth.js';
import { isSupabaseConfigured } from './supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const accountDeletionFile = path.join(dataDir, 'account-deletion-requests.json');
const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

function loadAccountDeletionRequests() {
  try {
    if (!fs.existsSync(accountDeletionFile)) return [];
    return JSON.parse(fs.readFileSync(accountDeletionFile, 'utf8'));
  } catch {
    return [];
  }
}

function saveAccountDeletionRequests(requests) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(accountDeletionFile, JSON.stringify(requests, null, 2));
}

/* ── Security Middleware ──────────────────── */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "https://graph.facebook.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const ALLOWED_ORIGINS = [
  `https://${process.env.REPLIT_DEV_DOMAIN || ''}`,
  `https://${process.env.REPL_SLUG || ''}.${process.env.REPL_OWNER || ''}.repl.co`,
  process.env.PRODUCTION_URL,
  'https://sairolotech.com',
  'https://www.sairolotech.com',
  'http://127.0.0.1:5000',
  'http://localhost:5000',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('CORS blocked'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type', 'x-admin-token'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);
app.use('/api/auth', authRouter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, error: 'AI rate limit exceeded, wait a moment' },
});
app.use('/api/buddy-chat', aiLimiter);
app.use('/api/ai-quotation', aiLimiter);
app.use('/api/ai-photo-solution', aiLimiter);
app.use('/api/ai-machine-spec', aiLimiter);

/* ── Rate limit helper (per-key, in-memory) ── */
const hitMap = new Map();
function rateLimitKey(key, maxPerMinute = 10) {
  const now = Date.now();
  const hits = hitMap.get(key) || [];
  const recent = hits.filter(t => now - t < 60000);
  recent.push(now);
  hitMap.set(key, recent);
  return recent.length > maxPerMinute;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, hits] of hitMap) {
    const valid = hits.filter(t => now - t < 120000);
    if (valid.length === 0) hitMap.delete(key);
    else hitMap.set(key, valid);
  }
}, 60000);

/* ── Codex Fix: Input length validator ──── */
const MAX_MSG_LEN = 2000;
const MAX_STR_LEN = 500;

function validateInputLengths(payload, parentKey = '') {
  if (payload == null) return null;
  if (typeof payload === 'string') {
    const key = parentKey.toLowerCase();
    const maxLen = (key === 'message' || key.endsWith('message') || key === 'imagebase64') ? MAX_MSG_LEN : MAX_STR_LEN;
    if (key === 'imagebase64') return null;
    if (payload.length > maxLen) return `${parentKey || 'field'} exceeds maximum length of ${maxLen}`;
    return null;
  }
  if (Array.isArray(payload)) {
    for (let i = 0; i < Math.min(payload.length, 50); i++) {
      const err = validateInputLengths(payload[i], `${parentKey}[${i}]`);
      if (err) return err;
    }
    return null;
  }
  if (typeof payload === 'object') {
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'imageBase64' || key === 'catalogData') continue;
      const err = validateInputLengths(value, key);
      if (err) return err;
    }
  }
  return null;
}

/* ── Codex Fix: Admin auth for inline routes ── */
function inlineAdminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.headers['authorization']?.replace('Bearer ', '');
  const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;
  if (!ADMIN_TOKEN) return res.status(503).json({ success: false, error: 'Auth not configured' });
  if (token !== ADMIN_TOKEN) return res.status(401).json({ success: false, error: 'Unauthorized' });
  next();
}

function checkOptionalAdminAccess(req, res) {
  const token = req.headers['x-admin-token'] || req.headers['authorization']?.replace('Bearer ', '');
  const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;
  if (!ADMIN_TOKEN) {
    return { allowed: true, authConfigured: false, usingFallbackAccess: true };
  }
  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return { allowed: false, authConfigured: true, usingFallbackAccess: false };
  }
  return { allowed: true, authConfigured: true, usingFallbackAccess: false };
}

function getIntegrationStatuses() {
  const hasWhatsapp = !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_ID);
  const hasFcm = !!process.env.FCM_SERVER_KEY;
  const hasGemini = !!GEMINI_KEY;
  const hasOpenRouter = !!(process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY);
  const hasGmailConnector = !!(
    process.env.REPLIT_CONNECTORS_HOSTNAME &&
    (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL)
  );
  const hasAdminToken = !!process.env.ADMIN_API_TOKEN;

  return {
    whatsapp: {
      connected: hasWhatsapp,
      note: hasWhatsapp ? 'WhatsApp token and phone ID configured' : 'WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_ID missing',
    },
    fcm: {
      connected: hasFcm,
      note: hasFcm ? 'FCM key configured' : 'FCM_SERVER_KEY missing',
    },
    gmail: {
      connected: hasGmailConnector,
      note: hasGmailConnector ? 'Replit Gmail connector configured' : 'Gmail connector env missing',
    },
    gemini: {
      connected: hasGemini,
      note: hasGemini ? 'Gemini API key configured' : 'GEMINI_API_KEY missing',
    },
    openrouter: {
      connected: hasOpenRouter,
      note: hasOpenRouter ? 'OpenRouter API key configured' : 'OPENROUTER_API_KEY missing',
    },
    adminToken: {
      connected: hasAdminToken,
      note: hasAdminToken ? 'Admin token configured' : 'ADMIN_API_TOKEN missing',
    },
    db: {
      connected: isSupabaseConfigured,
      note: isSupabaseConfigured ? 'Supabase server client configured' : 'SUPABASE_URL or SUPABASE_ANON_KEY missing',
    },
  };
}

/* ── Codex Fix: Safe JSON parser ── */
function safeJsonParse(text) {
  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return { data: JSON.parse(clean), error: null };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

/* ── Gemini helper (with retry + fallback) ── */
const GEMINI_FALLBACK = 'Abhi AI service available nahi hai. Hamare expert team se baat karein — SAI RoloTech helpline pe call karein.';

function getAI() {
  if (!GEMINI_KEY) throw new Error('Gemini API key not configured');
  return new GoogleGenAI({ apiKey: GEMINI_KEY });
}

async function gemini(contents, systemInstruction, opts = {}) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: opts.model || 'gemini-2.5-flash',
        contents,
        config: { systemInstruction, maxOutputTokens: opts.maxTokens || 1024, temperature: opts.temp ?? 0.7 }
      });
      const text = response.text || '';
      if (text.trim()) {
        logAI({ input: JSON.stringify(contents).slice(0, 200), output: text.slice(0, 300), model: opts.model || 'gemini-2.5-flash', source: 'gemini' });
        return text;
      }
    } catch (err) {
      console.error(`[Gemini] attempt ${attempt} failed:`, err.message);
      logSecurity({ type: 'ai_failure', detail: `Gemini attempt ${attempt}: ${err.message}`, severity: 'high' });
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
    }
  }
  console.error('[Gemini] All attempts failed, returning fallback');
  logAI({ input: 'FALLBACK', output: GEMINI_FALLBACK, model: 'fallback', source: 'fallback' });
  return GEMINI_FALLBACK;
}

/* ── Body reader for streaming ──────────── */
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

/* ── AI: Buddy Chat ─────────────────────── */
app.post('/api/buddy-chat', async (req, res) => {
  try {
    const lenErr = validateInputLengths(req.body);
    if (lenErr) return res.status(400).json({ success: false, error: lenErr });
    const ip = req.ip;
    if (rateLimitKey(`buddy-${ip}`, 20)) return res.status(429).json({ success: false, error: 'Too many requests' });
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, error: 'Message required' });

    const systemPrompt = `You are "Buddy" — SAI RoloTech CRM ka AI Assistant. You help with:
- Sales & Lead Management (products: PLC Panels, HMI, SCADA, VFD, Servo Motors)
- Service & Troubleshooting (machine repairs, PLC errors, maintenance)
- Industrial Automation (PLC programming - Siemens, Allen Bradley, Mitsubishi, Omron, Delta)
- PMEGP / MSME Loan Schemes
- Machine Testing (15 test parameters for industrial panels)
- CRM Navigation help

Rules: Reply in Hinglish (Hindi + English mix). Concise but helpful. Use bullet points. Be friendly & professional.`;

    const contents = history.slice(-10).map(h => ({
      role: h.from === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const rawReply = await gemini(contents, systemPrompt, { maxTokens: 1024, temp: 0.7 });
    const validated = validateAIResponse(rawReply);
    if (validated.blocked) {
      logSecurity({ type: 'ai_blocked', endpoint: '/api/buddy-chat', detail: 'harmful content', severity: 'critical' });
      return res.json({ success: false, error: 'Request blocked for safety reasons.' });
    }
    res.json({ success: true, reply: validated.response || SAFE_AI_FALLBACK });
  } catch (err) {
    console.error('[buddy-chat]', err);
    res.status(500).json({ success: false, error: 'AI service temporarily unavailable' });
  }
});

/* ── AI: Quotation Generator ────────────── */
app.post('/api/ai-quotation', async (req, res) => {
  try {
    const lenErr = validateInputLengths(req.body);
    if (lenErr) return res.status(400).json({ success: false, error: lenErr });
    const ip = req.ip;
    if (rateLimitKey(`quote-${ip}`, 5)) return res.status(429).json({ success: false, error: 'Too many requests' });
    const { clientName, clientPhone, clientEmail, clientCompany, clientAddress, clientGstin, products, budget, requirements, catalogData = {} } = req.body;

    const today = new Date();
    const dd = String(today.getDate()).padStart(2,'0');
    const mm = String(today.getMonth()+1).padStart(2,'0');
    const yyyy = today.getFullYear();
    const dateStr = `${dd}-${mm}-${yyyy}`;

    const systemPrompt = `You are a professional quotation generator for SAI ROLOTECH, New Delhi.
Company: SAI ROLOTECH, PLOT NO 575/1 G.F MUNDKA INDUSTRIAL AREA, NEW DELHI 110041
GSTIN: 07AWDPV5272C1ZG
Today's date: ${dateStr}

Generate a professional roll forming machine quotation in JSON format. The machineSpecs array must list all technical specifications of the machine(s) requested. The items array contains pricing rows.

Return ONLY this exact JSON structure (no markdown, no extra text):
{
  "quotationNo": "SAI-Q-NNNN",
  "date": "${dateStr}",
  "validUntil": "valid date 30 days from today in DD-MM-YYYY format",
  "subject": "QUOTATION FOR [MACHINE NAME IN CAPS]",
  "client": {
    "name": "${clientName}",
    "phone": "${clientPhone}",
    "email": "${clientEmail || ''}",
    "company": "${clientCompany || ''}",
    "address": "${clientAddress || ''}",
    "gstin": "${clientGstin || ''}"
  },
  "machineSpecs": [
    {"param": "No. of Forming Station", "value": ""},
    {"param": "Rolls Material", "value": "Die-Steel D3 Grade, Temper & Hardened 58-60 HRC on Rolls"},
    {"param": "Shaft Material", "value": "EN-8, DIA 55MM"},
    {"param": "Bearing", "value": "SKF MAKE"},
    {"param": "Frame", "value": "All Steel Body, Plate type, Fabricated By Channel & Angle"},
    {"param": "Plate Thickness", "value": "25mm, Blocks & Plate Machined on VMC (JAPANESE) For More Accuracy"},
    {"param": "Gear Box", "value": "Four inch Reduction gear box"},
    {"param": "Power Transmission", "value": "42 MM WORM GEAR"},
    {"param": "Gears", "value": "Double Side Gear, All Steel Gears For Extra Life, Driving Gears All on Bearings"},
    {"param": "Motor", "value": "Crompton/BBL/ABB, 5 HP, Operated by VFD L&T Make For Different Speed And Motor Safety"},
    {"param": "Power Pack", "value": "Hydraulic, 2HP"},
    {"param": "Cutting Station", "value": "Hydraulic Cutting Station Through Die, Die & Punch D2 material, Tempered & Hardened"},
    {"param": "De-Coiler", "value": "Capacity 300 Kg Standing type"},
    {"param": "Electric Panel", "value": "PLC Operated panel"},
    {"param": "Electrical", "value": "Touch Screen For Size & Quantity Input Screen Size 7 inch (VEICHI), PLC Programmable Device"},
    {"param": "Channel Length", "value": "Length Measurement Through Encoder For Precise Length"},
    {"param": "Machine", "value": "Heavy Duty, Maintenance Free"},
    {"param": "Toolings", "value": "All tooling on CNC & VMC machining to close the tolerance & for High Accuracy"},
    {"param": "Material Thickness", "value": "0.3 TO 0.65 MM"}
  ],
  "items": [
    {"sno": 1, "description": "ROLL FORMING MACHINE FOR [PROFILE NAME]", "hsn": "8455", "qty": 1, "unit": "Units", "unitPrice": 0, "amount": 0}
  ],
  "subtotal": 0,
  "cgstRate": 9,
  "sgstRate": 9,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "grandTotal": 0,
  "amountInWords": "Rupees [amount in words] Only",
  "deliveryDays": "60 DAYS",
  "paymentStructure": "20% ADVANCE WITH CONFIRMED ORDER, 20% PROGRESS ON WORK AND 60% BALANCE AT THE TIME OF MACHINE DELIVERY",
  "notes": ""
}

IMPORTANT RULES:
- Fill machineSpecs values accurately based on the machine requested
- Set realistic prices for Indian roll forming machines (typically ₹1,50,000 to ₹8,00,000)
- Calculate cgstAmount = subtotal * 0.09, sgstAmount = subtotal * 0.09, grandTotal = subtotal + cgstAmount + sgstAmount
- amountInWords must be the full grand total in Indian numbering words
- quotationNo format: SAI-Q-${Math.floor(Math.random()*900)+100}
- Return ONLY valid JSON, nothing else`;

    const userMsg = `Machine/Product Required: ${products}
Budget: ${budget || 'Not specified'}
Special Requirements: ${requirements || 'None'}
Client: ${clientName}, ${clientPhone}${clientCompany ? ', ' + clientCompany : ''}`;

    const text = await gemini(
      [{ role: 'user', parts: [{ text: userMsg }] }],
      systemPrompt, { maxTokens: 3000, temp: 0.2 }
    );
    const { data: quotation, error: parseErr } = safeJsonParse(text);
    if (parseErr || !quotation) return res.status(500).json({ success: false, error: 'Failed to generate quotation, please try again' });
    res.json({ success: true, quotation });
  } catch (err) {
    console.error('[ai-quotation]', err);
    res.status(500).json({ success: false, error: 'Quotation generation failed, please try again' });
  }
});

/* ── AI: Machine Guide (Troubleshooter) ──── */
app.post('/api/machine-guide', async (req, res) => {
  try {
    const lenErr = validateInputLengths(req.body);
    if (lenErr) return res.status(400).json({ success: false, error: lenErr });
    const ip = req.ip;
    if (rateLimitKey(`machine-${ip}`, 20)) return res.status(429).json({ success: false, error: 'Too many requests' });
    const { message, history = [] } = req.body;

    const systemPrompt = `You are "MASTER" — SAI RoloTech ka Roll Forming Machine Expert AI. 20+ saal ka experience. Expertise: Roll Forming Machines, Coil Slitting, Decoiler, Forming Stations, Punching, Cut-off, PLC/HMI/Encoder/Servo, Material handling.

Common problems knowledge: strip going left/right, bow up/down, twist, flare, wave/buckle, dimension issues, surface marks, cutting length wrong, punching misalignment, vibration, motor overload, material slip, straightener issues.

REPLY RULES: Hinglish mein jawab do. Step-by-step numbered list. Practical & actionable. Safety warnings include karein. Emojis use karein (🔧 ⚙️ ✅ ⚠️ 📏). End mein "Kya aur help chahiye?" zaror poochho.`;

    const contents = history.slice(-12).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const rawReply = await gemini(contents, systemPrompt, { maxTokens: 1500, temp: 0.5 });
    const validated = validateAIResponse(rawReply);
    if (validated.blocked) {
      logSecurity({ type: 'ai_blocked', endpoint: '/api/machine-guide', detail: 'harmful content', severity: 'critical' });
      return res.json({ success: false, error: 'Request blocked for safety reasons.' });
    }
    res.json({ success: true, reply: validated.response || SAFE_AI_FALLBACK });
  } catch (err) {
    console.error('[machine-guide]', err);
    res.status(500).json({ success: false, error: 'AI service temporarily unavailable' });
  }
});

/* ── AI: Photo → Solution (Vision) ──────── */
app.post('/api/ai-photo-solution', async (req, res) => {
  try {
    const lenErr = validateInputLengths(req.body);
    if (lenErr) return res.status(400).json({ success: false, error: lenErr });
    const ip = req.ip;
    if (rateLimitKey(`photo-${ip}`, 10)) return res.status(429).json({ success: false, error: 'Too many requests. 1 minute baad try karein.' });
    const { imageBase64, mimeType = 'image/jpeg', description = '' } = req.body;
    if (!imageBase64) return res.status(400).json({ success: false, error: 'Image data required' });

    const systemPrompt = `Aap SAI RoloTech ke Senior Industrial Engineer hain. Aap roll forming machines, VFDs (Variable Frequency Drives), PLC systems, aur industrial automation equipment ke expert hain.

User ne ek photo upload ki hai apni machine/product ki. Aap:
1. Photo mein dikhne wali problem ya equipment identify karein
2. Sambhavit issue/fault diagnose karein
3. Step-by-step solution batayein
4. Safety precautions batayein
5. Preventive maintenance tips dein

REPLY RULES: Hinglish mein jawab do. Numbered steps use karein. Emojis use karein (🔧 ⚙️ ⚠️ ✅ 📸). Practical aur actionable advice dein. Agar aur detail chahiye toh poochho.`;

    const userText = description
      ? `Photo dekh kar problem diagnose karo. User ka description: "${description}"`
      : `Photo dekh kar machine/equipment ki problem identify karo aur solution batao.`;

    const contents = [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: imageBase64 } },
        { text: userText }
      ]
    }];

    const rawReply = await gemini(contents, systemPrompt, { maxTokens: 1500, temp: 0.4 });
    const validated = validateAIResponse(rawReply);
    if (validated.blocked) {
      logSecurity({ type: 'ai_blocked', endpoint: '/api/ai-photo-solution', detail: 'harmful content', severity: 'critical' });
      return res.json({ success: false, error: 'Request blocked for safety reasons.' });
    }
    res.json({ success: true, reply: validated.response || SAFE_AI_FALLBACK });
  } catch (err) {
    console.error('[ai-photo-solution]', err);
    res.status(500).json({ success: false, error: 'AI service temporarily unavailable' });
  }
});

/* ── AI: PLC Error Code Lookup ──────── */
app.post('/api/plc-error-lookup', async (req, res) => {
  try {
    const lenErr = validateInputLengths(req.body);
    if (lenErr) return res.status(400).json({ success: false, error: lenErr });
    const ip = req.ip;
    if (rateLimitKey(`plc-${ip}`, 20)) return res.status(429).json({ success: false, error: 'Too many requests.' });
    const { errorCode, driver, description = '' } = req.body;
    if (!errorCode) return res.status(400).json({ success: false, error: 'Error code required' });

    const systemPrompt = `Aap SAI RoloTech ke VFD/PLC/Servo Drive Expert hain. Aapko VFD (Variable Frequency Drive) error codes bahut achhe se pata hain. Especially:
- Vichi VFD (most common: F series, E series codes)
- Delta VFD (VFD-EL, VFD-M, VFD-CP, VFD-ED series)
- Fanuc (Servo Amplifier, CNC error codes)
- Fuji Electric VFD (FRENIC series)

Error code explain karo:
1. Error ka naam / full form
2. Possible causes (sabse common pehle)
3. Step-by-step troubleshooting
4. Reset karne ka tarika
5. Preventive measures

REPLY RULES: Hinglish mein jawab do. Numbered steps. Emojis (⚡ 🔧 ⚠️ ✅ 📊). Practical solution dein.`;

    const userText = `${driver ? `Driver: ${driver}. ` : ''}Error Code: ${errorCode}.${description ? ` Additional info: ${description}` : ''} Is error ka matlab aur solution batao.`;

    const contents = [{ role: 'user', parts: [{ text: userText }] }];
    const rawReply = await gemini(contents, systemPrompt, { maxTokens: 1200, temp: 0.4 });
    const validated = validateAIResponse(rawReply);
    if (validated.blocked) {
      logSecurity({ type: 'ai_blocked', endpoint: '/api/plc-error-lookup', detail: 'harmful content', severity: 'critical' });
      return res.json({ success: false, error: 'Request blocked for safety reasons.' });
    }
    res.json({ success: true, reply: validated.response || SAFE_AI_FALLBACK });
  } catch (err) {
    console.error('[plc-error-lookup]', err);
    res.status(500).json({ success: false, error: 'AI service temporarily unavailable' });
  }
});

/* ── AI: Project Report Generator ──────── */
app.post('/api/generate-project-report', async (req, res) => {
  try {
    const lenErr = validateInputLengths(req.body);
    if (lenErr) return res.status(400).json({ success: false, error: lenErr });
    const ip = req.ip;
    if (rateLimitKey(`report-${ip}`, 3)) return res.status(429).json({ success: false, error: 'Too many requests. 1 minute wait karein.' });
    const { formData: f } = req.body;
    if (!f) return res.status(400).json({ success: false, error: 'Form data required' });

    const subsidyPct = ['SC','ST','OBC','Minority','Ex-Serviceman','Physically Handicapped'].includes(f.category) ? 35 : 25;
    const toNum = (v) => parseFloat(String(v || '0').replace(/,/g, '')) || 0;
    const totalCost = toNum(f.totalProjectCost);
    const loan = toNum(f.loanAmount);
    const own = toNum(f.ownContribution);
    const revenue = toNum(f.expectedRevenueMontly);
    const rmCost = toNum(f.rawMaterialCostMonthly);
    const labourCost = toNum(f.labourCostMonthly);
    const overhead = toNum(f.overheadMonthly);
    const interest = toNum(f.interestRate) || 11.5;
    const tenure = toNum(f.loanTenure) || 7;
    const r = (interest/1200);
    const n = tenure * 12;
    const monthlyEMI = loan * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1);
    const monthlyProfit = revenue - rmCost - labourCost - overhead - monthlyEMI;
    const breakEven = totalCost > 0 && monthlyProfit > 0 ? Math.ceil(totalCost / monthlyProfit) : 0;
    const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
    const fmt = (n) => Math.round(n).toLocaleString('en-IN');

    const prompt = `Write a complete, professional project report in English for bank loan under ${f.loanScheme} scheme.

Applicant: ${f.applicantName}, Father: ${f.fatherName||'N/A'}, DOB: ${f.dob||'N/A'}, Category: ${f.category}
Qualification: ${f.qualification}, Experience: ${f.experience}
Address: ${f.address}, ${f.city}, ${f.state} - ${f.pincode}
Phone: ${f.phone}, Email: ${f.email}
Business: ${f.businessName} (${f.businessType}), Location: ${f.proposedLocation||f.city}
Products: ${f.productDescription}, Market: ${f.targetMarket}
Machine: ${f.machineName} from ${f.machineSupplier}, Cost: ₹${f.machinePrice}, Capacity: ${f.machineCapacity}
Total Project Cost: ₹${fmt(totalCost)} | Own: ₹${fmt(own)} | Loan: ₹${fmt(loan)}
Bank: ${f.bankName}, Tenure: ${tenure}yrs, Rate: ${interest}%, EMI: ₹${fmt(monthlyEMI)}/month
Revenue: ₹${fmt(revenue)}/mo | Profit: ₹${fmt(monthlyProfit)}/mo | Payback: ~${breakEven} months
Subsidy: ${subsidyPct}% (${f.category})

Write a complete 14-section report:
1. COVER PAGE (Date: ${today}, Ref: SAI-PR-${Date.now().toString().slice(-6)})
2. EXECUTIVE SUMMARY
3. PROMOTER'S PROFILE
4. PROJECT DESCRIPTION
5. MARKET ANALYSIS & DEMAND
6. TECHNICAL DETAILS
7. COST OF PROJECT (itemized table)
8. MEANS OF FINANCE (own contribution, bank loan, ${f.loanScheme} subsidy: ${subsidyPct}%)
9. FINANCIAL PROJECTIONS - 5 YEAR PLAN (table: 70%/80%/90%/90%/90% capacity)
10. REPAYMENT SCHEDULE (EMI: ₹${fmt(monthlyEMI)}/month × ${n} months)
11. BREAK-EVEN ANALYSIS
12. EMPLOYMENT GENERATION (${f.manpowerTotal||'N/A'} total jobs)
13. SOCIAL & ECONOMIC IMPACT
14. DECLARATION

Be thorough, professional, bank-ready. ~1200-1500 words.`;

    const report = await gemini(
      [{ role: 'user', parts: [{ text: prompt }] }],
      null, { maxTokens: 4096, temp: 0.3 }
    );
    res.json({ success: true, report });
  } catch (err) {
    console.error('[project-report]', err);
    res.status(500).json({ success: false, error: 'Report generation failed, please try again' });
  }
});

/* ── AI: Machine Spec Estimator ─────────── */
app.post('/api/ai-machine-spec', async (req, res) => {
  try {
    const lenErr = validateInputLengths(req.body);
    if (lenErr) return res.status(400).json({ success: false, error: lenErr });
    const ip = req.ip;
    if (rateLimitKey(`spec-${ip}`, 10)) return res.status(429).json({ success: false, error: 'Too many requests' });
    const { form } = req.body;

    const prompt = `You are a roll forming machine expert at SAI RoloTech, Pune.
Based on requirements below, give a brief technical machine spec in Hinglish.

Material: ${form.materialType}, Thickness: ${form.minThickness}-${form.maxThickness}mm
Strip Width: ${form.minStripWidth}-${form.maxStripWidth}mm, Profile H: ${form.profileHeight||'N/A'}mm
Type: ${form.machineType}, Punching: ${form.punchingOption} ${form.punchingDetails||''}
Speed: ${form.outputSpeed||'N/A'} m/min, Coil: ${form.coilWeight||'N/A'}kg, Cut: ${form.cutType||'N/A'}
Control: ${form.controlSystem||'N/A'}, Special: ${form.specialRequirements||'None'}

5-8 lines covering: forming stations, motor/drive, frame, tooling material, machine size (L×W×H), technical notes.`;

    const rawSpec = await gemini([{ role: 'user', parts: [{ text: prompt }] }], null, { maxTokens: 512, temp: 0.3 });
    const validated = validateAIResponse(rawSpec);
    if (validated.blocked) {
      logSecurity({ type: 'ai_blocked', endpoint: '/api/ai-machine-spec', detail: 'harmful content', severity: 'critical' });
      return res.json({ success: false, error: 'Request blocked for safety reasons.' });
    }
    res.json({ success: true, spec: validated.response || SAFE_AI_FALLBACK });
  } catch (err) {
    console.error('[ai-machine-spec]', err);
    res.status(500).json({ success: false, error: 'AI service temporarily unavailable' });
  }
});

/* ── AI: Quotation Analyzer ─────────────── */
app.post('/api/analyze-quotation', async (req, res) => {
  try {
    const lenErr = validateInputLengths(req.body);
    if (lenErr) return res.status(400).json({ success: false, error: lenErr });
    const ip = req.ip;
    if (rateLimitKey(`analyze-${ip}`, 5)) return res.status(429).json({ success: false, error: 'Too many requests' });
    const { quotationText, catalogData = {} } = req.body;

    const saiPricing = (catalogData.products || []).map(p => `${p.name}: ₹${p.basePrice?.toLocaleString('en-IN')}/${p.unit}`).join('\n')
      || 'PLC Panels: ₹28,000-₹85,000, HMI: ₹18,000-₹32,000, VFD: ₹8,500-₹22,000';

    const systemPrompt = `You are an expert industrial automation procurement analyst for SAI RoloTech, Pune.
SAI Reference Pricing: ${saiPricing}

Analyze the quotation and return ONLY valid JSON:
{"companyName":"","quotationRef":"","totalAmount":"","overallScore":0,"overallVerdict":"Good","summary":"","pros":[{"point":"","detail":""}],"cons":[{"point":"","detail":"","severity":"High"}],"priceAnalysis":{"verdict":"Fair","detail":"","savingOpportunity":""},"missingItems":[],"redFlags":[],"recommendations":[],"sairolotech_advantage":""}`;

    const text = await gemini(
      [{ role: 'user', parts: [{ text: `Analyze:\n\n${quotationText}` }] }],
      systemPrompt, { maxTokens: 2048, temp: 0.4 }
    );
    const { data: analysis, error: parseErr } = safeJsonParse(text);
    if (parseErr || !analysis) return res.status(500).json({ success: false, error: 'Analysis failed, please try again' });
    res.json({ success: true, analysis });
  } catch (err) {
    console.error('[analyze-quotation]', err);
    res.status(500).json({ success: false, error: 'Analysis service temporarily unavailable' });
  }
});

/* ── AI: Question Generator (OpenAI) ─────── */
app.post('/api/generate-questions', async (req, res) => {
  try {
    const lenErr = validateInputLengths(req.body);
    if (lenErr) return res.status(400).json({ success: false, error: lenErr });
    const ip = req.ip;
    if (rateLimitKey(`questions-${ip}`, 5)) return res.status(429).json({ success: false, error: 'Too many requests' });
    const { topic, count, qType } = req.body;
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY });

    const prompt = `Generate exactly ${count||5} ${qType==='MCQ'?'multiple choice':qType==='Short'?'short answer':'mixed'} questions about "${topic||'Industrial Automation, PLC'}".
Context: SAI RoloTech CRM — PLC, HMI, SCADA, VFD, Servo Motors, Panel Manufacturing, Machine Testing.
Return ONLY valid JSON array. Each: {"q":"(Hinglish)","a":"correct answer","type":"MCQ or Short","options":["(4 options, MCQ only)"]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.8, max_tokens: 2000
    });
    let text = completion.choices[0]?.message?.content || '[]';
    const { data: questions, error: parseErr } = safeJsonParse(text);
    res.json({ success: true, questions: questions || [] });
  } catch (err) {
    console.error('[generate-questions]', err);
    res.status(500).json({ success: false, error: 'Question generation failed' });
  }
});

/* ── Gmail helpers ──────────────────────── */
async function getGmailClient() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? 'repl ' + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? 'depl ' + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken || !hostname) throw new Error('Gmail connector not configured');
  const connResp = await fetch('https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail', { headers: { Accept: 'application/json', 'X-Replit-Token': xReplitToken } });
  const connData = await connResp.json();
  const conn = connData.items?.[0];
  const accessToken = conn?.settings?.access_token || conn?.settings?.oauth?.credentials?.access_token;
  if (!accessToken) throw new Error('Gmail not connected');
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/* ── Lead Analytics (Bug #1 Fix) ─────────── */
/* lead-intelligence.tsx calls this endpoint */
app.get('/api/lead-analytics', async (req, res) => {
  try {
    const token = req.headers['x-admin-token'] || req.headers['authorization']?.replace('Bearer ', '');
    const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;
    if (ADMIN_TOKEN && token !== ADMIN_TOKEN) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const stats         = getStats();
    const sources       = getSourceAnalytics();
    const locations     = getLocationAnalytics();
    const priorityLeads = getPriorityLeads(10);
    res.json({ success: true, stats, sources, locations, priorityLeads });
  } catch (err) {
    console.error('[lead-analytics]', err);
    res.status(500).json({ success: false, error: 'Analytics service unavailable' });
  }
});

/* ── Integration Status Check ─────────────── */
app.get('/api/integration-status', (req, res) => {
  const access = checkOptionalAdminAccess(req, res);
  if (!access.allowed) return;
  res.json({
    success: true,
    configured: true,
    authConfigured: access.authConfigured,
    usingFallbackAccess: access.usingFallbackAccess,
    statuses: getIntegrationStatuses(),
  });
});

/* ── AI: Message Quality Analyzer ─────────── */
/* POST /api/message-quality  body: { message, leadContext? } */
app.post('/api/message-quality', async (req, res) => {
  try {
    const lenErr = validateInputLengths(req.body);
    if (lenErr) return res.status(400).json({ success: false, error: lenErr });
    const ip = req.ip;
    if (rateLimitKey(`msgq-${ip}`, 10)) return res.status(429).json({ success: false, error: 'Too many requests' });
    const { message, leadContext = '' } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, error: 'Message required' });

    const prompt = `You are a WhatsApp sales message quality checker for SAI RoloTech (Roll Forming Machine manufacturer, New Delhi).

Analyze this follow-up message:
"${message}"

Lead context: ${leadContext || 'Industrial machinery buyer'}

Return a JSON object (no markdown) with:
{
  "score": <0-100 number>,
  "grade": <"Excellent"|"Good"|"Average"|"Weak"|"Poor">,
  "issues": [<list of problems, max 3>],
  "improved": "<rewritten improved version in Hinglish, max 3 lines>",
  "tips": [<2 quick tips>]
}`;

    const raw = await gemini([{ role: 'user', parts: [{ text: prompt }] }], '', { maxTokens: 512, temp: 0.4 });
    const json = raw.match(/\{[\s\S]*\}/)?.[0];
    let result;
    try { result = json ? JSON.parse(json) : { score: 50, grade: 'Average', issues: [], improved: message, tips: [] }; }
    catch { result = { score: 50, grade: 'Average', issues: [], improved: message, tips: [] }; }
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[message-quality]', err);
    res.status(500).json({ success: false, error: 'AI service temporarily unavailable' });
  }
});

/* ── AI: A/B Message Variants ──────────────── */
/* POST /api/ab-variants  body: { goal, leadName, locationZone, source } */
app.post('/api/ab-variants', async (req, res) => {
  try {
    const lenErr = validateInputLengths(req.body);
    if (lenErr) return res.status(400).json({ success: false, error: lenErr });
    const ip = req.ip;
    if (rateLimitKey(`ab-${ip}`, 10)) return res.status(429).json({ success: false, error: 'Too many requests' });
    const { goal = 'meeting', leadName = 'Customer', locationZone = 'HIGH', source = 'indiamart' } = req.body;

    const zones = { HIGH: 'Delhi/NCR (nearby — same day visit possible)', MEDIUM: 'North India (video call preferred)', LOW: 'South India (app self-service)', UNKNOWN: 'Unknown location' };
    const zoneDesc = zones[locationZone] || zones.UNKNOWN;

    const prompt = `You are a WhatsApp sales copywriter for SAI RoloTech (Roll Forming Machine manufacturer, New Delhi).

Generate exactly 2 A/B test variants for a follow-up WhatsApp message.
Lead name: ${leadName}
Goal: ${goal} (meeting/quotation/demo)
Location: ${zoneDesc}
Source: ${source}

Return ONLY a JSON object (no markdown):
{
  "variantA": {
    "label": "Short & Direct",
    "message": "<message in Hinglish, 2-3 lines>",
    "tone": "<tone description>",
    "bestFor": "<when to use>"
  },
  "variantB": {
    "label": "Value-First",
    "message": "<message in Hinglish, 2-3 lines>",
    "tone": "<tone description>",
    "bestFor": "<when to use>"
  }
}`;

    const raw = await gemini([{ role: 'user', parts: [{ text: prompt }] }], '', { maxTokens: 600, temp: 0.8 });
    const json = raw.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return res.status(500).json({ success: false, error: 'AI failed to generate variants, please try again' });
    const { data: result, error: parseErr } = safeJsonParse(json);
    if (parseErr || !result) return res.status(500).json({ success: false, error: 'AI response parsing failed' });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[ab-variants]', err);
    res.status(500).json({ success: false, error: 'AI service temporarily unavailable' });
  }
});

/* ── AI: Smart Follow-up Timing ─────────────── */
/* POST /api/smart-timing  body: { score, locationZone, source, daysSinceCreation, repliesCount } */
app.post('/api/smart-timing', async (req, res) => {
  try {
    const lenErr = validateInputLengths(req.body);
    if (lenErr) return res.status(400).json({ success: false, error: lenErr });
    const ip = req.ip;
    if (rateLimitKey(`timing-${ip}`, 15)) return res.status(429).json({ success: false, error: 'Too many requests' });
    const { score = 'WARM', locationZone = 'UNKNOWN', source = 'unknown', daysSinceCreation = 0, repliesCount = 0 } = req.body;

    const prompt = `You are a sales timing advisor for SAI RoloTech (industrial machinery CRM).

Lead profile:
- Score: ${score} (COLD/WARM/HOT/VERY_HOT)
- Location zone: ${locationZone} (HIGH=Delhi/NCR, MEDIUM=North India, LOW=South India)
- Lead source: ${source}
- Days since first contact: ${daysSinceCreation}
- Number of replies received: ${repliesCount}

Advise the BEST time to send the next follow-up message.

Return ONLY a JSON object (no markdown):
{
  "waitDays": <number: how many days to wait before next message>,
  "bestTime": "<e.g. '10am-12pm IST'>",
  "urgency": "<'Immediate'|'Today'|'This Week'|'Next Week'|'Monthly'>",
  "reason": "<1 line explanation in Hinglish>",
  "action": "<what to say/do next>"
}`;

    const raw = await gemini([{ role: 'user', parts: [{ text: prompt }] }], '', { maxTokens: 300, temp: 0.3 });
    const json = raw.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return res.status(500).json({ success: false, error: 'AI failed to generate timing, please try again' });
    const { data: timing, error: parseErr } = safeJsonParse(json);
    if (parseErr || !timing) return res.status(500).json({ success: false, error: 'AI response parsing failed' });
    res.json({ success: true, ...timing });
  } catch (err) {
    console.error('[smart-timing]', err);
    res.status(500).json({ success: false, error: 'AI service temporarily unavailable' });
  }
});

/* ── Gmail: Leads ───────────────────────── */
app.get('/api/gmail-leads', inlineAdminAuth, async (req, res) => {
  try {
    const gmail = await getGmailClient();
    const labelsResp = await gmail.users.labels.list({ userId: 'me' });
    const labels = (labelsResp.data.labels || []).map(l => ({ id: l.id, name: l.name }));
    const inboxLabel = labelsResp.data.labels?.find(l => l.id === 'INBOX');
    const inboxDetail = inboxLabel ? (await gmail.users.labels.get({ userId: 'me', id: 'INBOX' })).data : null;
    res.json({ success: true, connected: true, email: 'inquirysairolotech@gmail.com', labels, inbox: inboxDetail ? { total: inboxDetail.messagesTotal, unread: inboxDetail.messagesUnread } : null, leads: [] });
  } catch (err) {
    console.error('[gmail-leads]', err);
    res.json({ success: false, error: 'Gmail service unavailable', leads: [], labels: [] });
  }
});

/* ── Gmail Admin: Lead Capture System ────── */
const _gmailState = { connected: false, email: '', connectedAt: '', lastSyncedAt: '', leads: [], history: [] };

app.get('/api/admin/gmail/status', inlineAdminAuth, async (req, res) => {
  try {
    const gmail = await getGmailClient();
    const profile = await gmail.users.getProfile({ userId: 'me' });
    _gmailState.connected = true;
    _gmailState.email = profile.data.emailAddress || 'inquirysairolotech@gmail.com';
    if (!_gmailState.connectedAt) _gmailState.connectedAt = new Date().toISOString();
    res.json({ success: true, connected: true, email: _gmailState.email, connectedAt: _gmailState.connectedAt, lastSyncedAt: _gmailState.lastSyncedAt });
  } catch {
    res.json({ success: true, connected: false });
  }
});

app.get('/api/admin/gmail/connect', inlineAdminAuth, (req, res) => {
  res.json({ success: true, authUrl: '', message: 'Gmail is connected via Replit integration. Use Sync to fetch leads.' });
});

app.delete('/api/admin/gmail/disconnect', inlineAdminAuth, (req, res) => {
  _gmailState.connected = false; _gmailState.email = ''; _gmailState.leads = [];
  res.json({ success: true });
});

app.post('/api/admin/gmail/sync', inlineAdminAuth, async (req, res) => {
  try {
    const gmail = await getGmailClient();
    const PORTAL_SENDERS = {
      'IndiaMart': ['indiamart', 'buyerconnect', 'buyleads'],
      'JustDial': ['justdial', 'jd.com'],
      'TradeIndia': ['tradeindia'],
    };
    const searchQuery = 'in:inbox (from:indiamart OR from:justdial OR from:tradeindia OR from:buyerconnect OR from:buyleads OR subject:inquiry OR subject:enquiry OR subject:lead OR subject:quote OR subject:interest) newer_than:30d';
    const msgList = await gmail.users.messages.list({ userId: 'me', maxResults: 50, q: searchQuery });
    const messages = msgList.data.messages || [];
    const parsedLeads = [];

    for (const msg of messages.slice(0, 40)) {
      try {
        const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
        const headers = detail.data.payload?.headers || [];
        const from = headers.find(h => h.name === 'From')?.value || '';
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';
        const fromLower = from.toLowerCase();

        let source = 'Gmail';
        for (const [portal, keywords] of Object.entries(PORTAL_SENDERS)) {
          if (keywords.some(k => fromLower.includes(k))) { source = portal; break; }
        }
        if (source === 'Gmail') {
          const subLower = subject.toLowerCase();
          if (subLower.includes('indiamart') || subLower.includes('buyer')) source = 'IndiaMart';
          else if (subLower.includes('justdial') || subLower.includes('jd.com') || subLower.includes('just dial')) source = 'JustDial';
          else if (subLower.includes('tradeindia')) source = 'TradeIndia';
        }
        if (source === 'Gmail') continue;

        let bodyText = '';
        function extractText(part) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            bodyText += Buffer.from(part.body.data, 'base64').toString('utf8');
          }
          if (part.parts) part.parts.forEach(extractText);
        }
        if (detail.data.payload) extractText(detail.data.payload);
        if (!bodyText && detail.data.snippet) bodyText = detail.data.snippet;

        const phoneMatch = bodyText.match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/);
        const nameMatch = bodyText.match(/(?:name|buyer|contact|client)\s*[:\-]?\s*([A-Za-z\s]{2,40})/i);
        const cityMatch = bodyText.match(/(?:city|location|address|place)\s*[:\-]?\s*([A-Za-z\s]{2,30})/i);
        const productMatch = bodyText.match(/(?:product|machine|item|interest|requirement|looking for)\s*[:\-]?\s*([A-Za-z\s,]{3,60})/i);
        const emailMatch = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const nameFromHeader = from.match(/^"?([^"<]+)"?\s*</) ? from.match(/^"?([^"<]+)"?\s*</)[1].trim() : '';

        parsedLeads.push({
          id: msg.id,
          source,
          name: nameMatch?.[1]?.trim() || nameFromHeader || 'Unknown',
          phone: phoneMatch ? phoneMatch[0].replace(/[\s-]/g, '') : '',
          email: emailMatch ? emailMatch[0] : '',
          company: '',
          product: productMatch?.[1]?.trim() || '',
          city: cityMatch?.[1]?.trim() || '',
          receivedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
          rawSubject: subject,
          imported: _gmailState.leads.some(l => l.id === msg.id && l.imported),
        });
      } catch {}
    }

    _gmailState.leads = parsedLeads;
    _gmailState.lastSyncedAt = new Date().toISOString();
    const newLeads = parsedLeads.filter(l => !l.imported).length;

    _gmailState.history.unshift({
      id: `sync_${Date.now()}`,
      syncedAt: _gmailState.lastSyncedAt,
      source: 'gmail',
      totalFetched: messages.length,
      newLeads,
      imported: 0,
      skipped: parsedLeads.filter(l => l.imported).length,
    });
    if (_gmailState.history.length > 20) _gmailState.history = _gmailState.history.slice(0, 20);

    res.json({ success: true, leads: parsedLeads, totalFetched: messages.length, newLeads, syncedAt: _gmailState.lastSyncedAt });
  } catch (err) {
    console.error('[gmail-sync]', err);
    res.json({ success: false, error: 'Gmail sync failed', leads: [] });
  }
});

app.get('/api/admin/gmail/leads', inlineAdminAuth, (req, res) => {
  res.json({ success: true, leads: _gmailState.leads });
});

app.post('/api/admin/gmail/import', inlineAdminAuth, (req, res) => {
  try {
    const leadIds = req.body?.leadIds || [];
    let imported = 0, skipped = 0;
    for (const id of leadIds) {
      const lead = _gmailState.leads.find(l => l.id === id);
      if (!lead || lead.imported) { skipped++; continue; }
      lead.imported = true;
      imported++;
    }
    if (_gmailState.history.length > 0) _gmailState.history[0].imported += imported;
    res.json({ success: true, imported, skipped });
  } catch {
    res.json({ success: false, imported: 0, skipped: 0 });
  }
});

app.get('/api/admin/gmail/history', inlineAdminAuth, (req, res) => {
  res.json({ success: true, history: _gmailState.history });
});

/* ── Gmail: Send Inquiry (Sanitized) ─────── */
app.post('/api/send-inquiry', async (req, res) => {
  try {
    const lenErr = validateInputLengths(req.body);
    if (lenErr) return res.status(400).json({ success: false, error: lenErr });
    const stripCRLF = (s) => s.replace(/[\r\n]/g, ' ');
    const safeName = stripCRLF(sanitizeInput(req.body.name || 'Unknown'));
    const safeEmail = stripCRLF(sanitizeInput(req.body.email || ''));
    const safePhone = stripCRLF(sanitizeInput(req.body.phone || 'N/A'));
    const safeMessage = sanitizeInput(req.body.message || 'N/A');
    const safeSource = stripCRLF(sanitizeInput(req.body.source || 'Website'));
    const gmail = await getGmailClient();
    const INQUIRY_EMAIL = 'inquirysairolotech@gmail.com';
    const emailContent = [
      `From: CRM System <${INQUIRY_EMAIL}>`, `To: ${INQUIRY_EMAIL}`,
      `Subject: New Lead: ${safeName} (${safeSource})`,
      `MIME-Version: 1.0`, `Content-Type: text/html; charset=utf-8`, ``,
      `<div style="font-family:Arial;max-width:600px;padding:20px">`,
      `<h2 style="color:#2563eb">New Lead Inquiry</h2>`,
      `<p><b>Name:</b> ${safeName}</p><p><b>Email:</b> ${safeEmail}</p>`,
      `<p><b>Phone:</b> ${safePhone}</p><p><b>Message:</b> ${safeMessage}</p>`,
      `<p style="color:#6b7280;font-size:12px">Time: ${new Date().toLocaleString('en-IN')}</p></div>`,
    ].join('\n');
    const encoded = Buffer.from(emailContent).toString('base64url');
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
    res.json({ success: true });
  } catch (err) {
    console.error('[send-inquiry]', err);
    res.json({ success: false, error: 'Email service unavailable' });
  }
});

/* ── CRM Lead Routes ─────────────────────── */
app.use('/', leadsRouter);
app.use('/api/products', productsRouter);
app.use('/', (await import('./routes/adminPanel.js')).default);

/* ── Queue Job Handlers ──────────────────── */
registerHandler('SEND_WELCOME', async ({ phone }) => {
  const lead = getLead(phone);
  if (lead) await sendWelcomeMessage(lead);
});

registerHandler('SEND_FOLLOWUP', async ({ phone, followupIndex }) => {
  const lead = getLead(phone);
  if (!lead || lead.dnd || lead.followupIndex >= 999) return;

  // ⏭️ Time Waste Filter: LOW location + COLD score = auto-skip (no follow-up wasted)
  const loc = lead.locationPriority || 'UNKNOWN';
  const score = (lead.score || '').toUpperCase();
  if (loc === 'LOW' && score === 'COLD') {
    console.log(`⏭️ Skipped follow-up for LOW+COLD lead ${phone} — time waste filter`);
    return;
  }

  await sendFollowup(lead, followupIndex);
});

registerHandler('SEND_AI_REPLY', async ({ phone, message, leadName }) => {
  const lead = getLead(phone);
  const memoryContext = buildContextPrompt(phone);
  const reply = await generateReply(message, {
    leadName: leadName || lead?.name,
    leadPhone: phone,
    leadScore: lead?.score || 'COLD',
    leadCity: lead?.city,
    leadProduct: lead?.machine_interest || lead?.machineInterest,
    memoryContext,
  });
  if (reply) {
    const { saveConversation: saveMem, getConversationHistory: getHist } = await import('./services/memoryService.js');
    saveMem(phone, 'assistant', reply);
    if (lead) {
      await sendQuotationFollowup({ ...lead, _aiReply: reply }).catch(() => {});
    }
    console.log(`🤖 AI reply to ${phone}: ${reply.slice(0, 80)}`);
    const hist = getHist(phone, 50);
    if (hist.length > 0 && hist.length % 5 === 0) {
      generateLeadNotes(phone).catch(() => {});
    }
  }
});

registerHandler('SEND_QUOTATION_FOLLOWUP', async ({ phone }) => {
  const lead = getLead(phone);
  if (lead) await sendQuotationFollowup(lead);
});

registerHandler('ADMIN_ALERT', async ({ phone, event }) => {
  const lead = getLead(phone);
  if (lead) await sendAdminAlert(lead, event);
});

registerHandler('SEND_PUSH', async ({ phone, fcmToken, title, body }) => {
  if (fcmToken) {
    await sendPushNotification({ fcmToken, title, body, data: { phone } });
  } else {
    const lead = getLead(phone);
    if (lead) await sendFollowup(lead, 0);
  }
});

registerHandler('SMART_FOLLOWUP', async ({ followupId }) => {
  const result = executeSmartFollowup(followupId);
  if (result) {
    try {
      await sendCustom(result.phone, result.message);
      markFollowupSent(result.followupId);
      logWhatsApp('smart_followup', result.phone, { intent: result.intent, message: result.message.slice(0, 80) });
      console.log(`🧠 Smart follow-up delivered: [${result.intent}] → ${result.phone}`);
    } catch (err) {
      markFollowupFailed(result.followupId);
      console.error(`❌ Smart follow-up send failed: ${err.message}`);
      throw err;
    }
  }
});

registerHandler('TASK_FOLLOWUP', async ({ taskId }) => {
  const result = executeTaskFollowup(taskId);
  if (result) {
    let msg = result.followupMessage;
    if (!msg) {
      msg = await generateFollowUpMessage(result.phone);
    }
    if (!msg) {
      markTaskFailed(result.taskId, 'no_message_generated');
      throw new Error(`No follow-up message for task ${taskId}`);
    }
    try {
      await sendCustom(result.phone, msg);
      completeTask(result.taskId);
      logWhatsApp('task_followup', result.phone, { task: result.task.slice(0, 80), priority: result.priority });
      console.log(`📋 Task follow-up sent: [${result.priority}] → ${result.phone}`);
    } catch (err) {
      markTaskFailed(result.taskId, `send_failed: ${err.message}`);
      throw err;
    }
  }
});

/* ── AI Memory & Smart Follow-up Endpoints ── */
app.get('/api/admin/memory/stats', inlineAdminAuth, (req, res) => {
  try {
    const stats = getSmartFollowupStats();
    res.json({ success: true, ...stats });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/memory/lead/:phone', inlineAdminAuth, (req, res) => {
  try {
    const phone = req.params.phone.replace(/\D/g, '');
    if (!phone) return res.status(400).json({ success: false, error: 'Phone required' });
    const profile = getLeadProfile(phone);
    const history = getConversationHistory(phone, 20);
    const context = buildContextPrompt(phone);
    res.json({ success: true, profile, history, context });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/* ── AI Notes & Tasks Endpoints ── */
app.get('/api/admin/tasks/stats', inlineAdminAuth, (req, res) => {
  try { res.json({ success: true, ...getTaskStats() }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/tasks/today', inlineAdminAuth, (req, res) => {
  try { res.json({ success: true, tasks: getTodayTasks() }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/tasks/upcoming', inlineAdminAuth, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    res.json({ success: true, tasks: getUpcomingTasks(Math.min(days, 30)) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/tasks/daily-plan', inlineAdminAuth, async (req, res) => {
  try {
    const plan = await generateDailyPlan();
    res.json({ success: true, ...plan });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/admin/tasks/create', inlineAdminAuth, async (req, res) => {
  try {
    const { phone, task: taskText, scheduledAt, priority } = req.body;
    if (!phone || !taskText || !scheduledAt) return res.status(400).json({ success: false, error: 'phone, task, scheduledAt required' });
    if (typeof phone !== 'string' || typeof taskText !== 'string') return res.status(400).json({ success: false, error: 'Invalid input types' });
    const result = createManualTask(phone.slice(0, 20), taskText.slice(0, 300), scheduledAt, priority);
    if (!result) return res.status(400).json({ success: false, error: 'Invalid date' });
    res.json({ success: true, task: result });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/admin/tasks/:id/complete', inlineAdminAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid task ID' });
    const result = completeTask(id);
    if (!result) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, task: result });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/admin/tasks/:id/skip', inlineAdminAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid task ID' });
    const result = skipTask(id);
    if (!result) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, task: result });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/notes/all', inlineAdminAuth, (req, res) => {
  try { res.json({ success: true, notes: getAllNotes() }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/notes/:phone', inlineAdminAuth, (req, res) => {
  try {
    const phone = req.params.phone.replace(/\D/g, '');
    if (!phone) return res.status(400).json({ success: false, error: 'Phone required' });
    const notes = getLeadNotes(phone);
    const tasks = getLeadTasks(phone);
    res.json({ success: true, notes, tasks });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/admin/notes/generate/:phone', inlineAdminAuth, async (req, res) => {
  try {
    const phone = req.params.phone.replace(/\D/g, '');
    if (!phone) return res.status(400).json({ success: false, error: 'Phone required' });
    const notes = await generateLeadNotes(phone);
    if (!notes) return res.status(400).json({ success: false, error: 'No data to generate notes from' });
    res.json({ success: true, notes });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/admin/notes/bulk-generate', inlineAdminAuth, async (req, res) => {
  try {
    const result = await bulkGenerateNotes();
    res.json({ success: true, ...result });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/admin/followup-message/:phone', inlineAdminAuth, async (req, res) => {
  try {
    const phone = req.params.phone.replace(/\D/g, '');
    if (!phone) return res.status(400).json({ success: false, error: 'Phone required' });
    const message = await generateFollowUpMessage(phone);
    if (!message) return res.status(400).json({ success: false, error: 'No data for this lead' });
    res.json({ success: true, message });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/* ── Beta Testing Endpoints (Admin Auth Required) ── */
const betaLog = [];

app.post('/api/beta/create-lead', inlineAdminAuth, async (req, res) => {
  try {
    const { createLead } = await import('./models/leadModel.js');
    const { name, phone, source = 'beta_test', state = 'Delhi', notes = '' } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, error: 'name and phone required' });
    const result = createLead({ name, phone, source, extra: { state, notes, isBetaTest: true } });
    res.json({ success: true, ...result });
  } catch (e) { console.error('[beta/create-lead]', e); res.status(500).json({ success: false, error: 'Lead creation failed' }); }
});

app.post('/api/beta/send-wa', inlineAdminAuth, async (req, res) => {
  try {
    const { phone, messageType, dayIndex = 0, customText } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: 'phone required' });
    const lead = getLead(phone.replace(/\D/g, ''));
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found — pehle Create Lead karo' });

    let waResult;
    const typeLabels = { welcome: 'Welcome', followup: `Follow-up D${dayIndex}`, admin_alert: 'Admin Alert', quotation: 'Quotation Follow-up', custom: 'Custom' };

    switch (messageType) {
      case 'welcome':   waResult = await sendWelcomeMessage(lead); break;
      case 'followup':  waResult = await sendFollowup(lead, dayIndex); break;
      case 'admin_alert': waResult = await sendAdminAlert(lead, 'Beta Test'); break;
      case 'quotation': waResult = await sendQuotationFollowup(lead); break;
      case 'custom':
        if (!customText) return res.status(400).json({ success: false, error: 'customText required' });
        waResult = await sendCustom(phone, customText); break;
      default: return res.status(400).json({ success: false, error: 'Invalid messageType' });
    }

    const entry = {
      id: `msg_${Date.now()}`,
      phone: lead.phone,
      leadName: lead.name,
      messageType,
      label: typeLabels[messageType] || messageType,
      dayIndex,
      mock: !!waResult?.mock,
      blocked: !!waResult?.blocked,
      blockedReason: waResult?.reason || null,
      waMessageId: waResult?.messages?.[0]?.id || null,
      status: waResult?.blocked ? 'blocked' : waResult?.mock ? 'mock_sent' : 'real_sent',
      timestamp: new Date().toISOString(),
    };
    betaLog.unshift(entry);
    if (betaLog.length > 200) betaLog.pop();
    res.json({ success: true, entry, waResult });
  } catch (e) { console.error('[beta/send-wa]', e); res.status(500).json({ success: false, error: 'WhatsApp send failed' }); }
});

app.get('/api/beta/get-lead', inlineAdminAuth, (req, res) => {
  const phone = (req.query.phone || '').replace(/\D/g, '');
  if (!phone) return res.status(400).json({ success: false, error: 'phone required' });
  const lead = getLead(phone);
  if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
  res.json({ success: true, lead });
});

app.get('/api/beta/message-log', inlineAdminAuth, (req, res) => {
  const phone = (req.query.phone || '').replace(/\D/g, '');
  const log = phone ? betaLog.filter(m => m.phone === phone) : betaLog;
  res.json({ success: true, log, total: log.length });
});

app.delete('/api/beta/clear-log', inlineAdminAuth, (req, res) => {
  betaLog.length = 0;
  res.json({ success: true, message: 'Log cleared' });
});

/* ── Health check ───────────────────────── */
app.post('/api/account-deletion-request', (req, res) => {
  const userId = String(req.body?.userId || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const name = String(req.body?.name || '').trim();
  const reason = String(req.body?.reason || '').trim().slice(0, 500);
  const source = String(req.body?.source || 'unknown').trim().slice(0, 50);

  if (!userId && !email) {
    return res.status(400).json({ success: false, error: 'User ID or email required' });
  }

  const requests = loadAccountDeletionRequests();
  const requestId = `del_${Date.now()}`;
  requests.unshift({
    requestId,
    userId: userId || null,
    email: email || null,
    name: name || null,
    reason: reason || null,
    source,
    createdAt: new Date().toISOString(),
  });
  saveAccountDeletionRequests(requests);
  logSecurity({ type: 'account_deletion_requested', userId: userId || undefined, detail: email || name || source, severity: 'medium' });

  res.json({ success: true, requestId });
});

app.get('/api/admin/account-deletion-requests', inlineAdminAuth, (req, res) => {
  res.json({ success: true, requests: loadAccountDeletionRequests() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '5.7.0-secure', timestamp: new Date().toISOString(), ai: !!GEMINI_KEY });
});

/* ── Global Error Handler (Codex Fix #5) ── */
app.use((err, req, res, next) => {
  if (err.message === 'CORS blocked') {
    logSecurity({ type: 'cors_blocked', ip: req.ip, endpoint: req.originalUrl, severity: 'medium' });
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  console.error('[GLOBAL ERROR]', err);
  logSecurity({ type: 'unhandled_error', ip: req.ip, endpoint: req.originalUrl, detail: err.message, severity: 'high' });
  res.status(500).json({ success: false, error: 'Something went wrong' });
});

/* ── Serve React SPA ─────────────────────── */
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath, { maxAge: '1y', etag: true }));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ SAI RoloTech CRM v5.6 PRO running on port ${PORT}`);
  console.log(`   Gemini AI:   ${GEMINI_KEY ? '✅ Connected' : '⚠️  Key missing'}`);
  console.log(`   WhatsApp:    ${process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Configured' : '⚠️  Not configured (mock mode)'}`);
  console.log(`   FCM Push:    ${process.env.FCM_SERVER_KEY ? '✅ Configured' : '⚠️  Not configured (mock mode)'}`);
  console.log(`   OpenRouter:  ${(process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY) ? '✅ Configured (code audit only)' : '⚠️  Not configured'}`);

  resumeFollowups();
  resumeSmartFollowups();
  resumeTasks();
  startDailyReporter();
  startDailyTaskCron();
});
