var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/models/leadModel.js
var leadModel_exports = {};
__export(leadModel_exports, {
  calculateSmartScore: () => calculateSmartScore,
  createLead: () => createLead,
  getActiveLeads: () => getActiveLeads,
  getAllLeads: () => getAllLeads,
  getLead: () => getLead,
  getLeadsByScore: () => getLeadsByScore,
  getLocationAnalytics: () => getLocationAnalytics,
  getLocationPriority: () => getLocationPriority,
  getPriorityLeads: () => getPriorityLeads,
  getSourceAnalytics: () => getSourceAnalytics,
  getStats: () => getStats,
  markDND: () => markDND,
  recalculateScore: () => recalculateScore,
  updateLead: () => updateLead
});
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
function loadLeads() {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const raw = fs.readFileSync(LEADS_FILE, "utf8");
      const arr = JSON.parse(raw);
      arr.forEach((l) => leads.set(l.phone, l));
      console.log(`\u{1F4C2} Loaded ${arr.length} leads from disk`);
    }
  } catch (err) {
    console.error("\u26A0\uFE0F  Could not load leads:", err.message);
  }
}
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(LEADS_FILE, JSON.stringify([...leads.values()], null, 2));
    } catch (err) {
      console.error("\u26A0\uFE0F  Could not save leads:", err.message);
    }
  }, 1e3);
}
function getLocationPriority(state = "") {
  const s = state.toLowerCase().trim();
  if (!s) return "UNKNOWN";
  if (NEAR_STATES.some((n) => s.includes(n))) return "HIGH";
  if (MEDIUM_STATES.some((m) => s.includes(m))) return "MEDIUM";
  return "LOW";
}
function calculateSmartScore(lead) {
  let score = 0;
  if (lead.meetingBooked) score += 40;
  else if (lead.features?.includes("quotation")) score += 32;
  else if (lead.features?.length > 0) score += 20;
  else if (lead.appOpened) score += 12;
  const loc = lead.locationPriority || getLocationPriority(lead.state);
  if (loc === "HIGH") score += 40;
  else if (loc === "MEDIUM") score += 24;
  else if (loc === "LOW") score += 8;
  const src = (lead.source || "").toLowerCase();
  if (src.includes("indiamart")) score += 20;
  else if (src.includes("justdial")) score += 14;
  else if (src === "app_direct") score += 18;
  else score += 10;
  if (score >= 80) return "VERY_HOT";
  if (score >= 52) return "HOT";
  if (score >= 30) return "WARM";
  return "COLD";
}
function createLead({ name, phone, source = "unknown", email = "", extra = {} }) {
  if (!phone) throw new Error("Phone required");
  const clean = phone.replace(/\D/g, "");
  if (leads.has(clean)) return { existing: true, lead: leads.get(clean) };
  const city = extra.city || "";
  const state = extra.state || "";
  const locationPriority = getLocationPriority(state);
  const lead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name || "Unknown",
    phone: clean,
    email,
    source,
    score: "COLD",
    // COLD | WARM | HOT | VERY_HOT
    smartScore: 0,
    // numeric composite score
    status: "new",
    // new | contacted | active | dnd | converted
    conversionStatus: null,
    // null | 'converted' | 'lost'
    revenue: 0,
    // ₹ revenue if converted
    appInstalled: false,
    appOpened: false,
    features: [],
    // ['quotation', 'maintenance', 'quality']
    meetingBooked: false,
    dnd: false,
    fcmToken: null,
    followupIndex: 0,
    lastContact: null,
    nextFollowup: null,
    replies: [],
    notes: extra.notes || "",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    ...extra,
    city,
    state,
    locationPriority
    // HIGH | MEDIUM | LOW | UNKNOWN — always override extra
  };
  leads.set(clean, lead);
  scheduleSave();
  return { existing: false, lead };
}
function getLead(phone) {
  return leads.get(phone.replace(/\D/g, "")) || null;
}
function updateLead(phone, updates) {
  const clean = phone.replace(/\D/g, "");
  const lead = leads.get(clean);
  if (!lead) return null;
  const updated = { ...lead, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  leads.set(clean, updated);
  scheduleSave();
  return updated;
}
function getAllLeads() {
  return [...leads.values()];
}
function getLeadsByScore(score) {
  return [...leads.values()].filter((l) => l.score === score);
}
function getActiveLeads() {
  return [...leads.values()].filter((l) => !l.dnd && l.status !== "converted");
}
function markDND(phone) {
  return updateLead(phone, { dnd: true, status: "dnd" });
}
function recalculateScore(phone) {
  const lead = getLead(phone);
  if (!lead) return null;
  const score = calculateSmartScore(lead);
  return updateLead(phone, { score });
}
function getStats() {
  const all = getAllLeads();
  return {
    total: all.length,
    cold: all.filter((l) => l.score === "COLD").length,
    warm: all.filter((l) => l.score === "WARM").length,
    hot: all.filter((l) => l.score === "HOT").length,
    veryHot: all.filter((l) => l.score === "VERY_HOT").length,
    dnd: all.filter((l) => l.dnd).length,
    appInstalled: all.filter((l) => l.appInstalled).length,
    meetings: all.filter((l) => l.meetingBooked).length
  };
}
function getSourceAnalytics() {
  const all = getAllLeads();
  const sources = {};
  for (const lead of all) {
    const src = lead.source || "unknown";
    if (!sources[src]) sources[src] = { source: src, total: 0, hot: 0, veryHot: 0, converted: 0, revenue: 0, meetings: 0 };
    sources[src].total++;
    if (lead.score === "HOT") sources[src].hot++;
    if (lead.score === "VERY_HOT") {
      sources[src].veryHot++;
      sources[src].hot++;
    }
    if (lead.conversionStatus === "converted") {
      sources[src].converted++;
      sources[src].revenue += lead.revenue || 0;
    }
    if (lead.meetingBooked) sources[src].meetings++;
  }
  return Object.values(sources).map((s) => ({
    ...s,
    conversionRate: s.total > 0 ? Math.round(s.converted / s.total * 100) : 0,
    hotRate: s.total > 0 ? Math.round(s.hot / s.total * 100) : 0
  })).sort((a, b) => b.hot - a.hot);
}
function getLocationAnalytics() {
  const all = getAllLeads();
  const loc = { HIGH: { total: 0, hot: 0, meetings: 0 }, MEDIUM: { total: 0, hot: 0, meetings: 0 }, LOW: { total: 0, hot: 0, meetings: 0 }, UNKNOWN: { total: 0, hot: 0, meetings: 0 } };
  for (const lead of all) {
    const p = lead.locationPriority || "UNKNOWN";
    if (!loc[p]) continue;
    loc[p].total++;
    if (lead.score === "HOT" || lead.score === "VERY_HOT") loc[p].hot++;
    if (lead.meetingBooked) loc[p].meetings++;
  }
  return loc;
}
function getPriorityLeads(limit = 10) {
  const all = getAllLeads();
  return all.filter((l) => !l.dnd && (l.score === "HOT" || l.score === "VERY_HOT")).sort((a, b) => {
    const locScore = { HIGH: 3, MEDIUM: 2, LOW: 1, UNKNOWN: 0 };
    const scoreScore = { VERY_HOT: 4, HOT: 3, WARM: 2, COLD: 1 };
    return locScore[b.locationPriority] + scoreScore[b.score] - (locScore[a.locationPriority] + scoreScore[a.score]);
  }).slice(0, limit).map((l) => ({ id: l.id, name: l.name, phone: l.phone.slice(0, -4) + "XXXX", score: l.score, locationPriority: l.locationPriority, city: l.city, state: l.state, source: l.source, meetingBooked: l.meetingBooked, features: l.features }));
}
var __vite_injected_original_import_meta_url, __dirname2, DATA_DIR, LEADS_FILE, leads, saveTimer, NEAR_STATES, MEDIUM_STATES;
var init_leadModel = __esm({
  "server/models/leadModel.js"() {
    __vite_injected_original_import_meta_url = "file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/crm-2/server/models/leadModel.js";
    __dirname2 = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
    DATA_DIR = path.join(__dirname2, "..", "..", "data");
    LEADS_FILE = path.join(DATA_DIR, "leads.json");
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    leads = /* @__PURE__ */ new Map();
    saveTimer = null;
    loadLeads();
    NEAR_STATES = ["delhi", "haryana", "uttar pradesh", "up", "rajasthan", "punjab", "himachal pradesh", "uttarakhand", "chandigarh"];
    MEDIUM_STATES = ["maharashtra", "gujarat", "madhya pradesh", "mp", "bihar", "jharkhand", "chhattisgarh", "west bengal"];
  }
});

// server/services/queueService.js
var queueService_exports = {};
__export(queueService_exports, {
  enqueue: () => enqueue,
  getQueueStats: () => getQueueStats,
  registerHandler: () => registerHandler
});
function enqueue(type, payload, options = {}) {
  const job = {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    payload,
    retryCount: 0,
    maxRetries: options.maxRetries ?? 5,
    runAt: Date.now() + (options.delayMs || 0),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  queue.push(job);
  console.log(`\u{1F4E5} Queued [${type}] for ${payload.phone || payload.leadId || "system"} (${queue.length} in queue)`);
  if (!workerRunning) startWorker();
  return job;
}
function getQueueStats() {
  return { queued: queue.length, processing: processing.size };
}
function registerHandler(type, fn) {
  handlers[type] = fn;
}
async function startWorker() {
  if (workerRunning) return;
  workerRunning = true;
  while (true) {
    const now = Date.now();
    const ready = queue.filter((j) => j.runAt <= now && !processing.has(j.id));
    if (ready.length === 0) {
      await sleep(5e3);
      continue;
    }
    for (const job of ready) {
      processing.add(job.id);
      runJob(job).finally(() => processing.delete(job.id));
    }
    await sleep(2e3);
  }
}
async function runJob(job) {
  const idx = queue.indexOf(job);
  if (idx === -1) return;
  if (typeof job.type !== "string" || !ALLOWED_JOB_TYPES.has(job.type)) {
    console.warn(`\u26A0\uFE0F  Rejected unknown job type: ${String(job.type).slice(0, 30)}`);
    queue.splice(idx, 1);
    return;
  }
  const handler = handlers[job.type];
  if (!handler) {
    console.warn(`\u26A0\uFE0F  No handler for job type: ${job.type}`);
    queue.splice(idx, 1);
    return;
  }
  try {
    await withTimeout(handler(job.payload), 1e4);
    queue.splice(queue.indexOf(job), 1);
    console.log(`\u2705 Job done [${job.type}] id=${job.id}`);
  } catch (err) {
    job.retryCount++;
    console.error(`\u274C Job failed [${job.type}] attempt ${job.retryCount}/${job.maxRetries}: ${err.message}`);
    if (job.retryCount >= job.maxRetries) {
      console.error(`\u{1F6AB} Max retries reached, dropping job: ${job.id}`);
      queue.splice(queue.indexOf(job), 1);
    } else {
      const delaySec = RETRY_DELAYS[job.retryCount - 1] || 14400;
      job.runAt = Date.now() + delaySec * 1e3;
      console.log(`\u{1F504} Retry ${job.retryCount} for job ${job.id} in ${delaySec}s`);
    }
  }
}
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`Timeout after ${ms}ms`)), ms))
  ]);
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
var queue, processing, workerRunning, RETRY_DELAYS, handlers, ALLOWED_JOB_TYPES;
var init_queueService = __esm({
  "server/services/queueService.js"() {
    queue = [];
    processing = /* @__PURE__ */ new Set();
    workerRunning = false;
    RETRY_DELAYS = [60, 300, 900, 3600, 14400];
    handlers = {};
    ALLOWED_JOB_TYPES = /* @__PURE__ */ new Set([
      "SEND_WELCOME",
      "SEND_FOLLOWUP",
      "SEND_AI_REPLY",
      "SEND_QUOTATION_FOLLOWUP",
      "ADMIN_ALERT",
      "SEND_PUSH",
      "SEND_MEETING_SLOTS",
      "SMART_NOTIFY",
      "SMART_FOLLOWUP",
      "TASK_FOLLOWUP"
    ]);
  }
});

// server/routes/products.js
var products_exports = {};
__export(products_exports, {
  default: () => products_default
});
import express from "file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/express@5.2.1/node_modules/express/index.js";
import multer from "file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/multer@2.1.1/node_modules/multer/index.js";
import fs2 from "fs";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
function readProducts() {
  try {
    if (!fs2.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs2.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}
function writeProducts(products) {
  fs2.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
}
var __vite_injected_original_import_meta_url2, __dirname3, router, DATA_FILE, UPLOAD_DIR, storage, upload, products_default;
var init_products = __esm({
  "server/routes/products.js"() {
    __vite_injected_original_import_meta_url2 = "file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/crm-2/server/routes/products.js";
    __dirname3 = path2.dirname(fileURLToPath2(__vite_injected_original_import_meta_url2));
    router = express.Router();
    DATA_FILE = path2.join(__dirname3, "..", "..", "data", "products.json");
    UPLOAD_DIR = path2.join(__dirname3, "..", "..", "public", "uploads", "products");
    if (!fs2.existsSync(path2.join(__dirname3, "..", "..", "data"))) {
      fs2.mkdirSync(path2.join(__dirname3, "..", "..", "data"), { recursive: true });
    }
    if (!fs2.existsSync(UPLOAD_DIR)) {
      fs2.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
      filename: (req, file, cb) => {
        const ext = path2.extname(file.originalname).toLowerCase() || ".jpg";
        const name = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`;
        cb(null, name);
      }
    });
    upload = multer({
      storage,
      limits: { fileSize: 20 * 1024 * 1024 },
      // 20MB
      fileFilter: (req, file, cb) => {
        const allowed = /image\/(jpeg|jpg|png|webp|gif)|video\/(mp4|mov|avi|webm)/;
        cb(null, allowed.test(file.mimetype));
      }
    });
    router.get("/", (req, res) => {
      const products = readProducts();
      const { category, featured, available } = req.query;
      let filtered = products;
      if (category) filtered = filtered.filter((p) => p.category === category);
      if (featured === "true") filtered = filtered.filter((p) => p.featured);
      if (available === "true") filtered = filtered.filter((p) => p.available !== false);
      res.json({ success: true, products: filtered, total: filtered.length });
    });
    router.get("/categories/list", (req, res) => {
      const products = readProducts();
      const categories = [...new Set(products.map((p) => p.category))];
      res.json({ success: true, categories });
    });
    router.post("/ai-command", async (req, res) => {
      try {
        const GEMINI_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
        if (!GEMINI_KEY) {
          return res.status(503).json({ success: false, error: "Gemini API key not configured." });
        }
        const { command, history = [] } = req.body;
        if (!command?.trim()) return res.status(400).json({ success: false, error: "command required" });
        const products = readProducts();
        const productSummary = products.map(
          (p) => `- ID: ${p.id} | Name: "${p.name}" | Category: "${p.category}" | Price: \u20B9${p.price} | Available: ${p.available} | Featured: ${p.featured}`
        ).join("\n");
        const systemPrompt = `Tu SAI RoloTech CRM ka AI Product Manager hai. SAI RoloTtech Delhi mein Roll Forming Machine manufacturer hai.

CURRENT PRODUCTS IN DATABASE:
${productSummary || "(koi product nahi hai abhi)"}

VALID CATEGORIES: Shutter Plant, False Ceiling, Pipe Mill, Purlin Machine, Stud Track, Custom

Admin ki natural language command sun aur SIRF ek valid JSON object return kar. Koi bhi extra text, explanation ya markdown nahi \u2014 sirf raw JSON.

JSON format:
{
  "action": "create" | "update" | "delete" | "none",
  "message": "<Hinglish mein kya kiya ya kya samjha \u2014 ek line>",
  "data": { name, category, description, price, unit, specs, leadTime, available, featured, tags },
  "id": "prod_xxx",
  "changes": { field: value }
}

Rules:
- create: naya product. data mein sab fields bharo. price = number (350000 for \u20B93.5 lac). available=true by default.
- update: existing product update. id zaroori. changes mein sirf changed fields.
- delete: product delete. id zaroori.
- none: command unclear hai ya info chahiye. message mein samjhao.
- Product name se match karo (case-insensitive, partial ok) \u2014 phir uska ID use karo.
- "lac"/"lakh" in price \u2192 multiply by 100000. "k"/"K" \u2192 multiply by 1000.
- Category change = update with changes:{ category: "New Category" }.
- Agar command mein product ka naam ambiguous hai, action "none" aur clarify karo.`;
        const { GoogleGenAI } = await import("file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/@google+genai@1.46.0/node_modules/@google/genai/dist/node/index.mjs");
        const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
        const contents = [
          ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
          { role: "user", parts: [{ text: command }] }
        ];
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: { systemInstruction: systemPrompt, maxOutputTokens: 1024, temperature: 0.1 }
        });
        const raw = (response.text || "{}").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return res.json({ success: false, error: "Gemini ne valid JSON nahi diya", raw });
        const aiResult = JSON.parse(jsonMatch[0]);
        const { action, message, data, id, changes } = aiResult;
        let executedProduct = null;
        let executionResult = "none";
        if (action === "create" && data) {
          const prods = readProducts();
          const newProd = {
            id: `prod_${Date.now()}`,
            name: (data.name || "Untitled").trim(),
            category: data.category || "Custom",
            description: data.description || "",
            price: parseFloat(data.price) || 0,
            unit: data.unit || "Set",
            photos: [],
            videoUrl: data.videoUrl || "",
            specs: data.specs || "",
            leadTime: data.leadTime || "",
            available: data.available !== false,
            featured: !!data.featured,
            tags: Array.isArray(data.tags) ? data.tags : [],
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          prods.push(newProd);
          writeProducts(prods);
          executedProduct = newProd;
          executionResult = "created";
        } else if (action === "update" && id && changes) {
          const prods = readProducts();
          const idx = prods.findIndex((p) => p.id === id);
          if (idx === -1) return res.json({ success: false, error: `Product ID "${id}" nahi mila`, aiMessage: message });
          if (changes.price !== void 0) changes.price = parseFloat(changes.price) || 0;
          if (changes.available !== void 0) changes.available = changes.available !== false && changes.available !== "false";
          if (changes.featured !== void 0) changes.featured = changes.featured === true || changes.featured === "true";
          prods[idx] = { ...prods[idx], ...changes, id: prods[idx].id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
          writeProducts(prods);
          executedProduct = prods[idx];
          executionResult = "updated";
        } else if (action === "delete" && id) {
          const prods = readProducts();
          const prod = prods.find((p) => p.id === id);
          if (!prod) return res.json({ success: false, error: `Product ID "${id}" nahi mila`, aiMessage: message });
          (prod.photos || []).forEach((url) => {
            const fp = path2.join(__dirname3, "..", "..", "public", url.replace(/^\//, ""));
            if (fs2.existsSync(fp)) fs2.unlinkSync(fp);
          });
          writeProducts(prods.filter((p) => p.id !== id));
          executedProduct = prod;
          executionResult = "deleted";
        }
        res.json({
          success: true,
          action,
          executionResult,
          message: message || "Done",
          product: executedProduct,
          products: readProducts()
        });
      } catch (e) {
        console.error("[AI-Command]", e.message);
        res.status(500).json({ success: false, error: e.message });
      }
    });
    router.get("/:id", (req, res) => {
      const products = readProducts();
      const product = products.find((p) => p.id === req.params.id);
      if (!product) return res.status(404).json({ success: false, error: "Product not found" });
      res.json({ success: true, product });
    });
    router.post("/", (req, res) => {
      try {
        const { name, category, description, price, unit, specs, leadTime, videoUrl, tags, featured, available } = req.body;
        if (!name || !category) return res.status(400).json({ success: false, error: "name and category required" });
        const products = readProducts();
        const product = {
          id: `prod_${Date.now()}`,
          name: name.trim(),
          category: category.trim(),
          description: description?.trim() || "",
          price: parseFloat(price) || 0,
          unit: unit || "Set",
          photos: [],
          videoUrl: videoUrl?.trim() || "",
          specs: specs?.trim() || "",
          leadTime: leadTime?.trim() || "",
          available: available !== false && available !== "false",
          featured: featured === true || featured === "true",
          tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        products.push(product);
        writeProducts(products);
        res.json({ success: true, product });
      } catch (e) {
        res.status(500).json({ success: false, error: e.message });
      }
    });
    router.put("/:id", (req, res) => {
      try {
        const products = readProducts();
        const idx = products.findIndex((p) => p.id === req.params.id);
        if (idx === -1) return res.status(404).json({ success: false, error: "Product not found" });
        const updates = req.body;
        if (updates.price !== void 0) updates.price = parseFloat(updates.price) || 0;
        if (updates.available !== void 0) updates.available = updates.available !== false && updates.available !== "false";
        if (updates.featured !== void 0) updates.featured = updates.featured === true || updates.featured === "true";
        products[idx] = { ...products[idx], ...updates, id: products[idx].id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
        writeProducts(products);
        res.json({ success: true, product: products[idx] });
      } catch (e) {
        res.status(500).json({ success: false, error: e.message });
      }
    });
    router.delete("/:id", (req, res) => {
      try {
        const products = readProducts();
        const product = products.find((p) => p.id === req.params.id);
        if (!product) return res.status(404).json({ success: false, error: "Product not found" });
        (product.photos || []).forEach((photoUrl) => {
          const filePath = path2.join(__dirname3, "..", "..", "public", photoUrl.replace("/uploads", "uploads"));
          if (fs2.existsSync(filePath)) fs2.unlinkSync(filePath);
        });
        writeProducts(products.filter((p) => p.id !== req.params.id));
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ success: false, error: e.message });
      }
    });
    router.post("/:id/photos", upload.array("photos", 10), (req, res) => {
      try {
        const products = readProducts();
        const idx = products.findIndex((p) => p.id === req.params.id);
        if (idx === -1) return res.status(404).json({ success: false, error: "Product not found" });
        if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, error: "No files uploaded" });
        const urls = req.files.map((f) => `/uploads/products/${f.filename}`);
        products[idx].photos = [...products[idx].photos || [], ...urls];
        products[idx].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        writeProducts(products);
        res.json({ success: true, urls, product: products[idx] });
      } catch (e) {
        res.status(500).json({ success: false, error: e.message });
      }
    });
    router.delete("/:id/photos", (req, res) => {
      try {
        const { url } = req.body;
        const products = readProducts();
        const idx = products.findIndex((p) => p.id === req.params.id);
        if (idx === -1) return res.status(404).json({ success: false, error: "Product not found" });
        const filePath = path2.join(__dirname3, "..", "..", "public", url.replace(/^\//, ""));
        if (fs2.existsSync(filePath)) fs2.unlinkSync(filePath);
        products[idx].photos = (products[idx].photos || []).filter((p) => p !== url);
        products[idx].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        writeProducts(products);
        res.json({ success: true, product: products[idx] });
      } catch (e) {
        res.status(500).json({ success: false, error: e.message });
      }
    });
    products_default = router;
  }
});

// server/services/configService.js
import fs3 from "fs";
import path3 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
function scheduleReset() {
  const now = /* @__PURE__ */ new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  const msUntilMidnight = midnight.getTime() - now.getTime();
  setTimeout(() => {
    _stats.messagesToday = 0;
    console.log("[ConfigService] Daily message counter reset");
    setInterval(() => {
      _stats.messagesToday = 0;
    }, 24 * 60 * 60 * 1e3);
  }, msUntilMidnight);
}
function isEnabled(feature) {
  if (_config.maintenanceMode && feature !== "admin") return false;
  return _config[feature] !== false;
}
function logError(source, message, details = null) {
  const entry = {
    id: Date.now() + Math.random(),
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    source: String(source).slice(0, 40),
    message: String(message).slice(0, 200),
    details: details ? String(details).slice(0, 400) : null
  };
  _errorLogs.unshift(entry);
  if (_errorLogs.length > 200) _errorLogs = _errorLogs.slice(0, 200);
}
function increment(key) {
  if (key in _stats) _stats[key]++;
  if (key === "whatsappSent") _stats.messagesToday++;
}
function isWithinDailyLimit() {
  return _stats.messagesToday < _config.dailyMessageLimit;
}
async function retryOperation(fn, retries = 3, delayMs = 500) {
  try {
    return await fn();
  } catch (e) {
    if (retries <= 0) throw e;
    await new Promise((r) => setTimeout(r, delayMs));
    return retryOperation(fn, retries - 1, delayMs * 2);
  }
}
var __vite_injected_original_import_meta_url3, __dirname4, CONFIG_FILE, DEFAULT_CONFIG, _config, _errorLogs, _stats;
var init_configService = __esm({
  "server/services/configService.js"() {
    __vite_injected_original_import_meta_url3 = "file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/crm-2/server/services/configService.js";
    __dirname4 = path3.dirname(fileURLToPath3(__vite_injected_original_import_meta_url3));
    CONFIG_FILE = path3.join(__dirname4, "../../data/system-config.json");
    DEFAULT_CONFIG = {
      aiEnabled: true,
      aiModel: "gemini-2.5-flash",
      whatsappEnabled: true,
      pushEnabled: true,
      followupEnabled: true,
      maintenanceMode: false,
      dailyMessageLimit: 100,
      alertOnError: true
    };
    _config = { ...DEFAULT_CONFIG };
    _errorLogs = [];
    _stats = {
      aiCalls: 0,
      aiErrors: 0,
      aiFiltered: 0,
      whatsappSent: 0,
      whatsappFailed: 0,
      pushSent: 0,
      totalLeads: 0,
      followupsSent: 0,
      messagesToday: 0,
      startTime: Date.now()
    };
    scheduleReset();
    try {
      if (fs3.existsSync(CONFIG_FILE)) {
        const saved = JSON.parse(fs3.readFileSync(CONFIG_FILE, "utf8"));
        _config = { ...DEFAULT_CONFIG, ...saved };
        console.log("[ConfigService] \u2705 Config loaded from file");
      }
    } catch (e) {
      console.warn("[ConfigService] Could not load config file:", e.message);
    }
  }
});

// server/services/activityLogger.js
import fs4 from "fs";
import path4 from "path";
import { fileURLToPath as fileURLToPath4 } from "url";
function getTimestamp() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function addLog(category, entry) {
  const log = { ts: getTimestamp(), ...entry };
  if (!_logs[category]) _logs[category] = [];
  _logs[category].unshift(log);
  if (_logs[category].length > MAX_MEMORY_LOGS) {
    _logs[category] = _logs[category].slice(0, MAX_MEMORY_LOGS);
  }
  appendToFile(category, log);
}
function appendToFile(category, log) {
  try {
    const file = path4.join(LOG_DIR, `${category}-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.log`);
    const stats = fs4.existsSync(file) ? fs4.statSync(file) : null;
    if (stats && stats.size > MAX_FILE_SIZE) return;
    fs4.appendFileSync(file, JSON.stringify(log) + "\n");
  } catch (e) {
  }
}
function logWhatsApp(data) {
  addLog("whatsapp", {
    type: data.type || "send",
    to: String(data.to || "").replace(/\d{4}$/, "****"),
    template: data.template || "custom",
    status: data.status || "sent",
    error: data.error || null,
    blocked: data.blocked || false,
    reason: data.reason || null
  });
}
var __vite_injected_original_import_meta_url4, __dirname5, LOG_DIR, MAX_MEMORY_LOGS, MAX_FILE_SIZE, _logs;
var init_activityLogger = __esm({
  "server/services/activityLogger.js"() {
    __vite_injected_original_import_meta_url4 = "file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/crm-2/server/services/activityLogger.js";
    __dirname5 = path4.dirname(fileURLToPath4(__vite_injected_original_import_meta_url4));
    LOG_DIR = path4.join(__dirname5, "../../data/logs");
    if (!fs4.existsSync(LOG_DIR)) fs4.mkdirSync(LOG_DIR, { recursive: true });
    MAX_MEMORY_LOGS = 500;
    MAX_FILE_SIZE = 5 * 1024 * 1024;
    _logs = {
      ai: [],
      whatsapp: [],
      security: [],
      system: []
    };
  }
});

// server/services/whatsappService.js
var whatsappService_exports = {};
__export(whatsappService_exports, {
  handleIncoming: () => handleIncoming,
  isConfigured: () => isConfigured,
  sendAdminAlert: () => sendAdminAlert,
  sendCustom: () => sendCustom,
  sendDailyReport: () => sendDailyReport,
  sendFollowup: () => sendFollowup,
  sendQuotationFollowup: () => sendQuotationFollowup,
  sendWelcomeMessage: () => sendWelcomeMessage
});
function isConfigured() {
  return !!(WA_TOKEN && PHONE_ID);
}
async function sendRaw(to, body, options = {}) {
  const normalizedPhone = to.replace(/\D/g, "");
  const isAdminAlert = options?.isAdminAlert === true;
  if (!isEnabled("whatsappEnabled")) {
    logWhatsApp({ to: normalizedPhone, status: "blocked", reason: "whatsapp_disabled" });
    return { blocked: true, reason: "whatsapp_disabled" };
  }
  if (!isAdminAlert) {
    const lastSent = phoneLastSentMap.get(normalizedPhone);
    if (lastSent && Date.now() - lastSent < PHONE_COOLDOWN_MS) {
      logWhatsApp({ to: normalizedPhone, status: "blocked", reason: "cooldown_4h" });
      return { blocked: true, reason: "cooldown_active", nextAllowedAt: lastSent + PHONE_COOLDOWN_MS };
    }
  }
  if (!isWithinDailyLimit()) {
    logWhatsApp({ to: normalizedPhone, status: "blocked", reason: "daily_limit" });
    logError("WhatsApp", "Daily message limit reached", `Attempted to send to ${to}`);
    return { blocked: true, reason: "daily_limit_reached" };
  }
  if (!isConfigured()) {
    console.log(`[WA MOCK] To: ${to}`);
    increment("whatsappSent");
    phoneLastSentMap.set(normalizedPhone, Date.now());
    logWhatsApp({ to: normalizedPhone, status: "mock_sent" });
    return { mock: true };
  }
  try {
    const result = await retryOperation(async () => {
      const res = await fetch(WA_API, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WA_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalizedPhone,
          type: "text",
          text: { body }
        }),
        signal: AbortSignal.timeout(1e4)
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`WA API ${res.status}: ${err}`);
      }
      return res.json();
    }, 3, 1e3);
    increment("whatsappSent");
    phoneLastSentMap.set(normalizedPhone, Date.now());
    logWhatsApp({ to: normalizedPhone, status: "sent" });
    return result;
  } catch (e) {
    increment("whatsappFailed");
    logWhatsApp({ to: normalizedPhone, status: "failed", error: e.message });
    logError("WhatsApp", e.message, `To: ${to} | Message: ${body.slice(0, 80)}`);
    throw e;
  }
}
async function sendWelcomeMessage(lead) {
  const { phone, name } = lead;
  const existing = getLead(phone);
  if (existing?.dnd) return;
  const msg = `\u{1F64F} Namaste ${name}!

SAI RoloTech ki taraf se aapka swagat hai \u2014 New Delhi ki trusted Roll Forming Machine manufacturer.

Hamare *FREE app* mein ye sab milega:
\u2705 AI Quotation (instant machine quote)
\u2705 Maintenance Guide (apni machine ka care karo)
\u2705 Quality Check (production issues solve karo)

App download karein \u{1F447}
${APP_LINK}?user=${phone}

Koi bhi sawaal ho \u2014 hum yahan hain! \u{1F60A}`;
  return sendRaw(phone, msg);
}
async function sendFollowup(lead, dayIndex) {
  const { phone, name } = lead;
  const existing = getLead(phone);
  if (existing?.dnd) return;
  const loc = existing?.locationPriority || "UNKNOWN";
  const NEAR_MESSAGES = [
    `Hi ${name}! App download kiya? Aap Delhi/NCR mein hain \u2014 hum same-day visit arrange kar sakte hain! \u{1F525} ${APP_LINK}?user=${phone}`,
    `${name} ji, aap nearby hain isliye personally discuss karna chahenge? Free factory visit arrange karte hain \u2014 bas ek call karein! \u{1F4DE}`,
    `Namaste ${name}! Nearby customers ke liye fast delivery + free installation support dete hain. Apni requirement share karein! \u{1F3ED}`,
    `${name} ji, 2-3 din mein machine demo arrange kar sakte hain aapke paas. Kab convenient rahega? Meeting fix karte hain! \u{1F4C5}`,
    `Hi ${name}! Nearby hone ki wajah se 48-hour delivery aur lifetime support milta hai. Kya is week discuss kar sakte hain?`,
    `${name} ji, last message \u2014 kabhi bhi machine ki zaroorat ho, SAI RoloTech ek call door hai. Hum Delhi/NCR mein hain! \u{1F64F}`
  ];
  const MEDIUM_MESSAGES = [
    `Hi ${name}! App download kiya? Hum aapki machine query instantly solve kar sakte hain \u2014 free consultation bhi! ${APP_LINK}?user=${phone}`,
    `${name} ji, aapki requirement ke hisaab se best machine suggest kar sakte hain. Detail share karein, quote bhejte hain! \u{1F4CB}`,
    `Namaste ${name}! Is mahine special offer hai. Customize quote + delivery plan ke saath bhejte hain \u2014 bata dein requirements! \u{1F3ED}`,
    `${name} ji, video call pe machine demo arrange kar sakte hain. Aap interested hain to time fix karte hain!`,
    `Hi ${name}! Customers ne hamare saath switch karke cost 25% kam ki. Aap bhi discuss karna chahenge? 15-min video call?`,
    `${name} ji, last message \u2014 future mein machine zaroorat ho to zaroor batayein. SAI RoloTech hamesha available! \u{1F64F}`
  ];
  const FAR_MESSAGES = [
    `Hi ${name}! SAI RoloTech CRM app mein detailed machine info, specs aur quotes mil jaate hain. Explore karein! ${APP_LINK}?user=${phone}`,
    `${name} ji, app mein apni requirement ke hisaab se quote generate kar sakte hain. Koi sawaal ho toh bata dein! \u{1F4AC}`,
    `Namaste ${name}! Aap app mein machine guide aur troubleshooting bhi dekh sakte hain \u2014 bilkul free! \u{1F527}`,
    `${name} ji, agar future mein machine ki zaroorat ho toh please consider karein. Online delivery arrangement possible hai!`,
    `Hi ${name}! Aapki requirement note kar li gayi hai. Jab bhi decide karein, main details share kar sakta hoon.`,
    `${name} ji, thank you for considering SAI RoloTech. Kabhi bhi contact karein \u2014 always here to help! \u{1F64F}`
  ];
  let MESSAGES;
  if (loc === "HIGH") MESSAGES = NEAR_MESSAGES;
  else if (loc === "MEDIUM") MESSAGES = MEDIUM_MESSAGES;
  else MESSAGES = FAR_MESSAGES;
  const msg = MESSAGES[Math.min(dayIndex, MESSAGES.length - 1)];
  return sendRaw(phone, msg);
}
async function sendAdminAlert(lead, event) {
  const ADMIN_PHONE = process.env.ADMIN_PHONE;
  if (!ADMIN_PHONE) return;
  const loc = (lead.locationPriority || "UNKNOWN").toUpperCase();
  const score = (lead.score || "").toUpperCase();
  const isGolden = loc === "HIGH" && (score === "HOT" || score === "VERY_HOT" || score === "VERY HOT");
  const header = isGolden ? "\u{1F6A8} URGENT \u2014 GOLDEN LEAD!\n(NEAR + HOT = MAX PROFIT \u{1F4B0})\n" : "\u{1F525} HOT LEAD ALERT!\n";
  const locationLabel = loc === "HIGH" ? "\u{1F4CD} NEAR (Delhi/NCR) \u2014 Fast close possible!" : loc === "MEDIUM" ? "\u{1F4CD} MEDIUM (North India)" : loc === "LOW" ? "\u{1F4CD} FAR (South/Other)" : "\u{1F4CD} Location unknown";
  const action = isGolden ? "\n\u{1F449} Call IMMEDIATELY \u2014 same-day visit arrange karo!" : loc === "HIGH" ? "\n\u{1F449} Call today \u2014 nearby lead, fast close possible." : "\n\u{1F449} Follow up within 2-3 days.";
  const msg = `${header}
Name:     ${lead.name}
Phone:    ${lead.phone}
${locationLabel}
Score:    ${lead.score || "N/A"}
Source:   ${lead.source || "N/A"}
Event:    ${event}
Time:     ${(/* @__PURE__ */ new Date()).toLocaleString("en-IN")}
${action}`;
  return sendRaw(ADMIN_PHONE, msg, { isAdminAlert: true });
}
async function sendQuotationFollowup(lead) {
  const { phone, name } = lead;
  const existing = getLead(phone);
  if (existing?.dnd) return;
  const msg = `${name} ji! Aapne quotation create kiya \u2014 bahut achha! \u{1F389}

Kya main aapki further help kar sakta hoon?
- Machine specs ke baare mein?
- Delivery timeline?
- Installation support?

Batayein, hum ready hain! \u{1F60A}`;
  return sendRaw(phone, msg);
}
async function handleIncoming(phone, message) {
  const lower = message.toLowerCase().trim();
  const DND_WORDS = ["stop", "remove", "no message", "mat bhejo", "band karo", "unsubscribe"];
  if (DND_WORDS.some((w) => lower.includes(w))) {
    markDND(phone);
    console.log(`\u{1F6AB} DND set for ${phone}`);
    await sendRaw(phone, "Aapko unsubscribe kar diya gaya hai. Agar future mein zaroorat ho toh contact karein. \u{1F64F}");
    return { dnd: true };
  }
  if (MEETING_KEYWORDS.some((k) => lower.includes(k))) {
    console.log(`\u{1F4C5} Meeting interest detected from ${phone}: "${message}"`);
    const lead = getLead(phone);
    const name = lead?.name || "Sir";
    const slotMsg = `${name} ji, meeting ke liye ye slots available hain:

\u{1F4C5} *Available Time Slots:*
\u2022 10:00 AM
\u2022 11:00 AM
\u2022 2:00 PM
\u2022 3:00 PM
\u2022 5:00 PM

Koi bhi time batayein \u2014 hum turant confirm kar denge!

Meeting type:
\u{1F3ED} Factory Visit (Mundka, Delhi)
\u{1F4F9} Video Call (WhatsApp/Google Meet)
\u{1F3E2} Aapki site par visit

Bas reply karein apna preferred time aur type! \u{1F64F}`;
    try {
      await sendRaw(phone, slotMsg, { isAdminAlert: true });
    } catch (e) {
      console.error(`[Meeting Auto] Failed to send slots to ${phone}:`, e.message);
    }
    return { dnd: false, message, meetingInterest: true };
  }
  return { dnd: false, message };
}
async function sendDailyReport(stats) {
  const ADMIN_PHONE = process.env.ADMIN_PHONE;
  if (!ADMIN_PHONE) return;
  const msg = `\u{1F4CA} SAI RoloTech Daily Report
${(/* @__PURE__ */ new Date()).toLocaleDateString("en-IN")}

\u{1F465} Total Leads: ${stats.total}
\u{1F525} Hot: ${stats.hot} | Very Hot: ${stats.veryHot}
\u{1F321}\uFE0F Warm: ${stats.warm} | \u2744\uFE0F Cold: ${stats.cold}
\u{1F4F1} App Installed: ${stats.appInstalled}
\u{1F4C5} Meetings: ${stats.meetings}
\u{1F6AB} DND: ${stats.dnd}`;
  return sendRaw(ADMIN_PHONE, msg);
}
async function sendCustom(phone, text) {
  if (!text || typeof text !== "string" || text.trim().length < 2) {
    return { blocked: true, reason: "empty_message" };
  }
  if (text.length > 1e3) {
    return { blocked: true, reason: "message_too_long" };
  }
  for (const pattern of WA_BLOCKED_CONTENT) {
    if (pattern.test(text)) {
      console.warn(`[WA FILTER] Blocked suspicious content to ${phone}: ${pattern.source}`);
      return { blocked: true, reason: "content_blocked" };
    }
  }
  return sendRaw(phone, text);
}
var WA_TOKEN, PHONE_ID, WA_API, APP_LINK, PHONE_COOLDOWN_MS, phoneLastSentMap, MEETING_KEYWORDS, WA_BLOCKED_CONTENT;
var init_whatsappService = __esm({
  "server/services/whatsappService.js"() {
    init_leadModel();
    init_configService();
    init_activityLogger();
    WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    PHONE_ID = process.env.WHATSAPP_PHONE_ID;
    WA_API = `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`;
    APP_LINK = process.env.APP_DOWNLOAD_LINK || "https://sairolotech.app";
    PHONE_COOLDOWN_MS = 4 * 60 * 60 * 1e3;
    phoneLastSentMap = /* @__PURE__ */ new Map();
    setInterval(() => {
      const cutoff = Date.now() - PHONE_COOLDOWN_MS * 2;
      for (const [phone, ts] of phoneLastSentMap) {
        if (ts < cutoff) phoneLastSentMap.delete(phone);
      }
    }, 30 * 60 * 1e3);
    MEETING_KEYWORDS = ["demo", "meeting", "milna", "dekhna", "visit", "dikha", "call", "video call", "factory visit", "time slot", "appointment"];
    WA_BLOCKED_CONTENT = [
      /https?:\/\/(?!(?:www\.)?sairolotech\.(?:com|app)(?:\/|$))/i,
      /click\s+(?:here|this|now)/i,
      /you\s+(?:won|win|selected)/i,
      /free\s+(?:money|cash|gift|prize)/i,
      /(?:otp|password|bank\s*account|card\s*number)/i
    ];
  }
});

// vite.config.js
import { defineConfig } from "file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/vite@5.4.21_@types+node@25.5.0_lightningcss@1.32.0/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/@vitejs+plugin-react@4.7.0__f7d2495779ecee785a83fed33a3bf0ca/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/@tailwindcss+vite@4.2.2_vit_2694785378cb586b7e160007f09c30cb/node_modules/@tailwindcss/vite/dist/index.mjs";
import path5 from "path";
var __vite_injected_original_dirname = "C:\\Users\\Sai Rolotech\\New folder\\cloud-code-extension\\crm-2";
var SAFE_AI_FALLBACK_DEV = "Maaf kijiye, abhi main is sawal ka reliable jawab confirm nahi kar pa raha. Hamare expert team se baat karein \u2014 SAI RoloTech helpline pe call karein.";
var UNCERTAINTY_REGEX_DEV = /\b(maybe|i\s*think|not\s*sure|i\s*don'?t\s*know|possibly|i\s*am\s*not\s*certain|mujhe\s*pata\s*nahi|shayad)\b/i;
var HARMFUL_REGEX_DEV = /\b(kill\s*yourself|suicide|self[-\s]*harm|make\s*a\s*bomb|terrorist|sexual\s*assault|child\s*porn|genocide|hate\s*speech)\b/i;
function devValidateAI(text) {
  if (!text || typeof text !== "string" || text.trim().length < 20) return SAFE_AI_FALLBACK_DEV;
  if (HARMFUL_REGEX_DEV.test(text)) return "";
  if (UNCERTAINTY_REGEX_DEV.test(text)) return SAFE_AI_FALLBACK_DEV;
  return text.trim().slice(0, 3e3);
}
function devValidateInput(str, maxLen = 2e3) {
  if (!str || typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").replace(/javascript:/gi, "").slice(0, maxLen).trim();
}
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "ai-api-endpoints",
      configureServer(server) {
        server.middlewares.use("/api/buddy-chat", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end("Method not allowed");
            return;
          }
          try {
            let body = "";
            for await (const chunk of req) body += chunk;
            const { message, history } = JSON.parse(body);
            const safeMessage = devValidateInput(message, 1e3);
            if (!safeMessage) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: "Invalid input" }));
              return;
            }
            const { GoogleGenAI } = await import("file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/@google+genai@1.46.0/node_modules/@google/genai/dist/node/index.mjs");
            const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY });
            const systemPrompt = `You are "Buddy" \u2014 SAI RoloTech CRM ka AI Assistant. You help with:
- Sales & Lead Management (products: PLC Panels, HMI, SCADA, VFD, Servo Motors)
- Service & Troubleshooting (machine repairs, PLC errors, maintenance)
- Industrial Automation (PLC programming - Siemens, Allen Bradley, Mitsubishi, Omron, Delta)
- PNMG Loan Schemes (Personal/Business/Machinery/Home/Education loans)
- Machine Testing (15 test parameters for industrial panels)
- CRM Navigation help

Rules:
- Reply in Hinglish (Hindi + English mix) unless user speaks pure English
- Keep responses concise but helpful
- Use bullet points and formatting
- If user says "open X" or "go to X", tell them you'll navigate them there
- You represent SAI RoloTech company
- Be friendly and professional`;
            const contents = [];
            if (history && history.length > 0) {
              for (const h of history.slice(-10)) {
                contents.push({ role: h.from === "user" ? "user" : "model", parts: [{ text: devValidateInput(h.text, 500) }] });
              }
            }
            contents.push({ role: "user", parts: [{ text: safeMessage }] });
            let rawReply = "";
            for (let attempt = 1; attempt <= 2; attempt++) {
              try {
                const response = await ai.models.generateContent({
                  model: "gemini-2.5-flash",
                  contents,
                  config: { systemInstruction: systemPrompt, maxOutputTokens: 1024, temperature: 0.7 }
                });
                rawReply = response.text || "";
                if (rawReply.trim()) break;
              } catch (retryErr) {
                console.error(`[Buddy] attempt ${attempt} failed:`, retryErr.message);
                if (attempt < 2) await new Promise((r) => setTimeout(r, 1e3));
              }
            }
            const reply = devValidateAI(rawReply) || SAFE_AI_FALLBACK_DEV;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, reply }));
          } catch (err) {
            console.error("Buddy chat error:", err.message);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "AI service temporarily unavailable" }));
          }
        });
        server.middlewares.use("/api/ai-quotation", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end("Method not allowed");
            return;
          }
          try {
            let body = "";
            for await (const chunk of req) body += chunk;
            const { clientName, clientPhone, clientEmail, clientCompany, products, budget, requirements, catalogData } = JSON.parse(body);
            const { GoogleGenAI } = await import("file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/@google+genai@1.46.0/node_modules/@google/genai/dist/node/index.mjs");
            const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY });
            const catalog = catalogData || {};
            const productList = (catalog.products || []).map(
              (p) => `- ${p.name} (${p.category}): \u20B9${p.basePrice.toLocaleString("en-IN")}/${p.unit}, HSN: ${p.hsn}, Lead Time: ${p.leadTime}`
            ).join("\n");
            const systemPrompt = `You are a professional quotation generator for SAI RoloTech, an industrial automation company based in Pune, Maharashtra.

Company Info:
- Name: ${catalog.company?.name || "SAI RoloTech"}
- Address: ${catalog.company?.address || "MIDC Industrial Area, Pune"}
- Phone: ${catalog.company?.phone || "+91 98765 43210"}
- Email: ${catalog.company?.email || "inquirysairolotech@gmail.com"}
- GSTIN: ${catalog.company?.gstin || "27AABCS1429B1Z1"}

Available Products & Pricing:
${productList || "PLC Panels (\u20B928,000 - \u20B985,000), HMI (\u20B918,000 - \u20B932,000), VFD (\u20B98,500 - \u20B922,000), SCADA (\u20B985,000), Servo Motors (\u20B935,000/set)"}

Payment Terms: ${catalog.terms?.payment || "50% advance, 50% before delivery"}
GST Rate: ${catalog.terms?.gst || 18}%
Warranty: ${catalog.terms?.warranty || "12 months"}
Delivery: ${catalog.terms?.delivery || "Ex-works Pune"}

Generate a professional quotation in JSON format with this EXACT structure:
{
  "quotationNo": "SAI-YYYY-NNNN (current year, random 4 digit number)",
  "date": "current date in DD/MM/YYYY",
  "validUntil": "date 30 days from now in DD/MM/YYYY",
  "client": {
    "name": "client name",
    "phone": "client phone",
    "email": "client email or N/A",
    "company": "client company or individual"
  },
  "items": [
    {
      "sno": 1,
      "description": "product name and brief spec",
      "hsn": "HSN code",
      "qty": number,
      "unit": "unit",
      "unitPrice": number (without GST),
      "amount": number (qty \xD7 unitPrice)
    }
  ],
  "subtotal": number,
  "discount": number (percentage, 0-15 based on budget/qty),
  "discountAmount": number,
  "taxableAmount": number,
  "gstRate": 18,
  "gstAmount": number,
  "grandTotal": number,
  "paymentTerms": "${catalog.terms?.payment || "50% advance, 50% before delivery"}",
  "deliveryTerms": "${catalog.terms?.delivery || "Ex-works Pune, freight extra"}",
  "warranty": "${catalog.terms?.warranty || "12 months on manufacturing defects"}",
  "notes": "2-3 lines of professional notes about the quotation",
  "executiveName": "Technical Sales Team"
}

Return ONLY valid JSON, no other text. Match products to client requirements intelligently.`;
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [{ role: "user", parts: [{ text: `Generate quotation for:
Client: ${clientName}
Phone: ${clientPhone}
Email: ${clientEmail || "N/A"}
Company: ${clientCompany || "Individual"}
Products/Requirements: ${products}
Budget: ${budget || "Not specified"}
Special Requirements: ${requirements || "None"}` }] }],
              config: { systemInstruction: systemPrompt, maxOutputTokens: 2048, temperature: 0.3 }
            });
            let text = response.text || "{}";
            text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const quotation = JSON.parse(text);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, quotation }));
          } catch (err) {
            console.error("AI Quotation error:", err.message);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Service temporarily unavailable" }));
          }
        });
        server.middlewares.use("/api/machine-guide", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end("Method not allowed");
            return;
          }
          try {
            let body = "";
            for await (const chunk of req) body += chunk;
            const { message, history } = JSON.parse(body);
            const { GoogleGenAI } = await import("file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/@google+genai@1.46.0/node_modules/@google/genai/dist/node/index.mjs");
            const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY });
            const systemPrompt = `You are "MASTER" \u2014 SAI RoloTech ka Roll Forming Machine Expert AI. Aap ek senior machine technician hain jo 20+ saal se roll forming machines pe kaam kar rahe hain.

Aapki expertise:
- Roll Forming Machines (Sheet Metal Profile Making)
- Coil Slitting, Decoiler, Straightener
- Forming Stations / Rollers / Tooling
- Punching Units (In-line punch press)
- Cut-off systems (Run length / Rotary die)
- PLC / HMI / Encoder / Servo systems
- Material handling (MS, SS, GI, PPGI, Aluminum)

COMMON ROLL FORMING MACHINE PROBLEMS AND SOLUTIONS:

1. PATTI LEFT JA RAHI HAI (Strip going left / Edge camber):
   Causes: Roll alignment off, material edge camber, side guide pressure uneven
   Solutions: Check side guides, align entry guide, check roll tooling alignment, adjust side guide pressure, check if material has edge camber

2. PATTI RIGHT JA RAHI HAI (Strip going right):
   Same as above but opposite side \u2014 check entry guide tilt, roll alignment

3. STRIP UPAR JA RAHI HAI / BOW UP (Strip bowing upward):
   Causes: Bottom roll gap too tight, material spring back, last station overpressed
   Solutions: Increase bottom roll gap, reduce forming pressure on last 2-3 stations, check material thickness consistency, add pressure roll at exit

4. STRIP NEECHE JA RAHI HAI / BOW DOWN (Strip bowing downward):
   Causes: Top roll gap too tight, too much downward pressure
   Solutions: Reduce top roll pressure, adjust gap uniformly, check straightener setting

5. PROFILE MEIN TWIST AA RAHA HAI (Profile twisting):
   Causes: Roll misalignment left-right, uneven material stress, asymmetric profile
   Solutions: Check shaft alignment, level all stations, check if tooling is worn, ensure equal roll pressure on both sides

6. PROFILE KE END MEIN FLARE / BELL MOUTH (Flaring at ends):
   Causes: Last station too aggressive, spring back not compensated
   Solutions: Add support rolls, adjust last station angle, use exit support table

7. WAVE / BUCKLE / WRINKLE (Tarangein ya shikanje):
   Causes: Roll gap too loose, material too thin for roll design, excess forming speed
   Solutions: Reduce speed, tighten roll gap progressively, check material thickness, add more forming stations

8. PROFILE KI DIMENSIONS GALAT HAIN:
   Causes: Roll wear, incorrect gap setting, wrong material thickness
   Solutions: Measure roll gap with feeler gauge, compare profile with drawing, check tooling wear

9. SURFACE PE MARKS / SCRATCHES:
   Causes: Dirty rolls, roll surface damage, no lubrication, debris in material
   Solutions: Clean all rolls with cloth, apply light oil, inspect roll surface, check material quality

10. CUTTING DIMENSION WRONG (Cut length galat):
    Causes: Encoder slip, encoder calibration off, PLC parameter wrong, material stretch
    Solutions: Re-calibrate encoder, check encoder coupling, adjust length factor in PLC, check pinch roll pressure

11. PUNCHING GALAT JAGAH HO RAHA HAI:
    Causes: Encoder error, punch trigger signal delay, material slipping in punch
    Solutions: Re-sync encoder, check pilot pin, adjust PLC punch timing, check clamp pressure

12. MACHINE MEIN VIBRATION / NOISE:
    Causes: Bearing damage, gear backlash, loose bolts, roll imbalance
    Solutions: Check all bearings, check gearbox oil, tighten all fasteners, inspect roll surface

13. MATERIAL SLIP HO RAHA HAI (Material slipping):
    Causes: Pinch roll pressure low, surface contamination, wrong roll surface
    Solutions: Increase pinch roll pressure, clean rolls, check roll surface condition

14. MOTOR OVERLOAD / TRIP HO RAHA HAI:
    Causes: Too much load, forming too aggressive, material too thick, mechanical jam
    Solutions: Reduce speed, check for jam, verify material thickness, adjust forming pressure

15. STRAIGHTENER SE MATERIAL SEEDHA NAHI AA RAHA:
    Causes: Straightener roll setting wrong, coil set too strong
    Solutions: Adjust straightener rolls, increase straightener pressure, check coil quality

REPLY RULES:
- Hamesha Hinglish mein jawab do (Hindi + English mix)
- Step-by-step numbered list format use karo
- Practical aur actionable advice do
- Agar problem unclear ho toh pehle clarifying questions poochho
- Safety warnings zaroor do jahan applicable ho
- "MASTER" ki tarah confident aur helpful raho
- Emojis use karo readability ke liye (\u{1F527} \u2699\uFE0F \u2705 \u26A0\uFE0F \u{1F4CF})
- Har response ke end mein poochho: "Kya aur help chahiye?"`;
            const contents = [];
            if (history && history.length > 0) {
              for (const h of history.slice(-12)) {
                contents.push({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.text }] });
              }
            }
            contents.push({ role: "user", parts: [{ text: message }] });
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents,
              config: { systemInstruction: systemPrompt, maxOutputTokens: 1500, temperature: 0.5 }
            });
            const reply = response.text || "Sorry, kuch error aaya. Dobara try karein.";
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, reply }));
          } catch (err) {
            console.error("Machine guide error:", err.message);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Service temporarily unavailable" }));
          }
        });
        server.middlewares.use("/api/generate-project-report", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }
          try {
            let body = "";
            for await (const chunk of req) body += chunk;
            const { formData: f } = JSON.parse(body);
            const { GoogleGenAI } = await import("file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/@google+genai@1.46.0/node_modules/@google/genai/dist/node/index.mjs");
            const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY });
            const subsidyPct = ["SC", "ST", "OBC", "Minority", "Ex-Serviceman", "Physically Handicapped"].includes(f.category) ? 35 : 25;
            const totalCost = parseFloat(f.totalProjectCost.replace(/,/g, "")) || 0;
            const loan = parseFloat(f.loanAmount.replace(/,/g, "")) || 0;
            const own = parseFloat(f.ownContribution.replace(/,/g, "")) || 0;
            const revenue = parseFloat(f.expectedRevenueMontly.replace(/,/g, "")) || 0;
            const rmCost = parseFloat(f.rawMaterialCostMonthly.replace(/,/g, "")) || 0;
            const labourCost = parseFloat(f.labourCostMonthly.replace(/,/g, "")) || 0;
            const overhead = parseFloat(f.overheadMonthly.replace(/,/g, "")) || 0;
            const interest = parseFloat(f.interestRate) || 11.5;
            const tenure = parseFloat(f.loanTenure) || 7;
            const monthlyEMI = loan * (interest / 1200) * Math.pow(1 + interest / 1200, tenure * 12) / (Math.pow(1 + interest / 1200, tenure * 12) - 1);
            const monthlyProfit = revenue - rmCost - labourCost - overhead - monthlyEMI;
            const annualRevenue = revenue * 12;
            const annualProfit = monthlyProfit * 12;
            const breakEven = totalCost > 0 && monthlyProfit > 0 ? Math.ceil(totalCost / monthlyProfit) : 0;
            const today = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
            const prompt = `Write a complete, professional project report in English for bank loan application under ${f.loanScheme} scheme. Use formal report language. Format with clear sections and subsections.

Applicant: ${f.applicantName}, Father: ${f.fatherName || "N/A"}, DOB: ${f.dob || "N/A"}, Category: ${f.category}
Qualification: ${f.qualification}, Experience: ${f.experience}
Address: ${f.address}, ${f.city}, ${f.state} - ${f.pincode}
Phone: ${f.phone}, Email: ${f.email}
Aadhaar: ${f.aadhaar || "N/A"}, PAN: ${f.pan || "N/A"}

Business Name: ${f.businessName}, Type: ${f.businessType}
Location: ${f.proposedLocation || f.city + ", " + f.state}
Industry: ${f.industryType}, Loan Scheme: ${f.loanScheme}
Products: ${f.productDescription}
Target Market: ${f.targetMarket}

Machine: ${f.machineName} from ${f.machineSupplier}
Machine Cost: \u20B9${f.machinePrice}, Capacity: ${f.machineCapacity}
Land: ${f.landArea} sqft, Building Cost: \u20B9${f.buildingCost}
Other Equipment: ${f.otherEquipment}
Raw Material: ${f.rawMaterial}, Power: ${f.powerRequirement} kW
Total Employees: ${f.manpowerTotal} (Skilled: ${f.manpowerSkilled}), Working Days: ${f.workingDaysPerYear}/year

Total Project Cost: \u20B9${totalCost.toLocaleString("en-IN")}
Own Contribution: \u20B9${own.toLocaleString("en-IN")} (${totalCost > 0 ? Math.round(own / totalCost * 100) : 0}%)
Bank Loan: \u20B9${loan.toLocaleString("en-IN")} (${totalCost > 0 ? Math.round(loan / totalCost * 100) : 0}%)
Bank: ${f.bankName}, Tenure: ${tenure} years, Interest: ${interest}%
Monthly EMI: \u20B9${Math.round(monthlyEMI).toLocaleString("en-IN")}

Monthly Revenue: \u20B9${revenue.toLocaleString("en-IN")}
Monthly Raw Material: \u20B9${rmCost.toLocaleString("en-IN")}
Monthly Labour: \u20B9${labourCost.toLocaleString("en-IN")}
Monthly Overhead: \u20B9${overhead.toLocaleString("en-IN")}
Monthly Net Profit: \u20B9${Math.round(monthlyProfit).toLocaleString("en-IN")}
Annual Revenue: \u20B9${annualRevenue.toLocaleString("en-IN")}
Annual Net Profit: \u20B9${Math.round(annualProfit).toLocaleString("en-IN")}
Payback Period: ~${breakEven} months

Write a detailed project report with these sections (use proper formatting with section titles in capitals):

1. COVER PAGE INFO (Date: ${today}, Ref No: SAI-PR-${Date.now().toString().slice(-6)})
2. EXECUTIVE SUMMARY (3-4 paragraphs)
3. PROMOTER'S PROFILE (education, experience, family background)
4. PROJECT DESCRIPTION (products, manufacturing process with roll forming details)
5. MARKET ANALYSIS & DEMAND (demand for profiles in construction, infrastructure; competition; USP)
6. TECHNICAL DETAILS (machine specs, production capacity, infrastructure, power, manpower)
7. COST OF PROJECT (itemized table: Land & Building, Plant & Machinery, Working Capital, Misc)
8. MEANS OF FINANCE (own contribution, bank loan, ${f.loanScheme} subsidy if applicable: ${subsidyPct}% of project cost)
9. FINANCIAL PROJECTIONS - 5 YEAR PLAN (table format: revenue, expenses, profit year-wise, assume 70% capacity Y1, 80% Y2, 90% Y3-5)
10. REPAYMENT SCHEDULE (EMI: \u20B9${Math.round(monthlyEMI).toLocaleString("en-IN")}/month, ${tenure} years)
11. BREAK-EVEN ANALYSIS (fixed costs, variable costs, break-even point)
12. EMPLOYMENT GENERATION (total jobs: ${f.manpowerTotal || "N/A"})
13. SOCIAL & ECONOMIC IMPACT
14. DECLARATION

Be thorough, professional and bank-ready. Include realistic numbers. Keep total report ~1200-1500 words.`;
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              config: { maxOutputTokens: 4096, temperature: 0.3 }
            });
            const report = response.text || "";
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, report }));
          } catch (err) {
            console.error("Project report error:", err.message);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Service temporarily unavailable" }));
          }
        });
        server.middlewares.use("/api/ai-machine-spec", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end("Method not allowed");
            return;
          }
          try {
            let body = "";
            for await (const chunk of req) body += chunk;
            const { form } = JSON.parse(body);
            const { GoogleGenAI } = await import("file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/@google+genai@1.46.0/node_modules/@google/genai/dist/node/index.mjs");
            const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY });
            const prompt = `You are a roll forming machine expert at SAI RoloTech, Pune.
Based on the following customer requirements, provide a brief technical machine specification estimate in Hinglish (Hindi+English).

Customer Requirements:
- Material: ${form.materialType}
- Thickness Range: ${form.minThickness}mm to ${form.maxThickness}mm
- Strip Width Range: ${form.minStripWidth}mm to ${form.maxStripWidth}mm
- Profile Height: ${form.profileHeight || "Not specified"}mm
- Machine Type: ${form.machineType}
- Punching: ${form.punchingOption} ${form.punchingDetails || ""}
- Output Speed: ${form.outputSpeed || "Not specified"} m/min
- Coil Weight: ${form.coilWeight || "Not specified"} kg
- Cut Type: ${form.cutType || "Not specified"}
- Control System: ${form.controlSystem || "Not specified"}
- Special: ${form.specialRequirements || "None"}

Give a 5-8 line technical estimate covering:
1. Estimated number of forming stations
2. Motor/drive requirements
3. Frame/structure recommendations
4. Tooling material recommendation
5. Approximate machine size (L x W x H)
6. Any special technical notes
Keep it concise, practical and professional.`;
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              config: { maxOutputTokens: 512, temperature: 0.3 }
            });
            const spec = response.text || "";
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, spec }));
          } catch (err) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Service temporarily unavailable" }));
          }
        });
        server.middlewares.use("/api/analyze-quotation", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end("Method not allowed");
            return;
          }
          try {
            let body = "";
            for await (const chunk of req) body += chunk;
            const { quotationText, catalogData } = JSON.parse(body);
            const { GoogleGenAI } = await import("file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/@google+genai@1.46.0/node_modules/@google/genai/dist/node/index.mjs");
            const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY });
            const catalog = catalogData || {};
            const saiPricing = (catalog.products || []).map(
              (p) => `${p.name}: \u20B9${p.basePrice.toLocaleString("en-IN")}/${p.unit} (${p.category})`
            ).join("\n");
            const systemPrompt = `You are an expert industrial automation procurement analyst working for SAI RoloTech, Pune. You analyze quotations from any company and give a detailed, professional assessment.

SAI RoloTech Reference Pricing (for comparison):
${saiPricing || "PLC Panels: \u20B928,000-\u20B985,000, HMI: \u20B918,000-\u20B932,000, VFD: \u20B98,500-\u20B922,000, SCADA: \u20B985,000, Servo: \u20B935,000/set, Panels: \u20B915,000+"}

Analyze the given quotation and return ONLY a valid JSON object with this EXACT structure:
{
  "companyName": "detected company name or 'Unknown Company'",
  "quotationRef": "quotation number if found or 'N/A'",
  "totalAmount": "total amount as string with \u20B9 or currency symbol, or 'N/A'",
  "overallScore": number between 1 and 10,
  "overallVerdict": "one of: Excellent | Good | Average | Below Average | Poor",
  "summary": "2-3 sentence executive summary in Hinglish",
  "pros": [
    { "point": "what is good", "detail": "brief explanation in Hinglish" }
  ],
  "cons": [
    { "point": "what is bad or missing", "detail": "brief explanation in Hinglish", "severity": "High | Medium | Low" }
  ],
  "priceAnalysis": {
    "verdict": "one of: Overpriced | Fair | Competitive | Cheap (quality risk)",
    "detail": "price comparison and analysis in Hinglish",
    "savingOpportunity": "estimated savings if switched to SAI RoloTech or better alternatives"
  },
  "missingItems": ["list of items that should be in a good quotation but are missing"],
  "redFlags": ["any suspicious or concerning items found"],
  "recommendations": ["3-5 actionable recommendations in Hinglish"],
  "sairolotech_advantage": "why SAI RoloTech would be better (1-2 lines)"
}

Be honest, specific, and helpful. If the text is not a quotation, still analyze what you can see.`;
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [{ role: "user", parts: [{ text: `Analyze this quotation:

${quotationText}` }] }],
              config: { systemInstruction: systemPrompt, maxOutputTokens: 2048, temperature: 0.4 }
            });
            let text = response.text || "{}";
            text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const analysis = JSON.parse(text);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, analysis }));
          } catch (err) {
            console.error("Analyze Quotation error:", err.message);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Service temporarily unavailable" }));
          }
        });
        server.middlewares.use("/api/generate-questions", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end("Method not allowed");
            return;
          }
          try {
            let body = "";
            for await (const chunk of req) body += chunk;
            const { topic, count, qType } = JSON.parse(body);
            const OpenAI = (await import("file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/openai@6.34.0_ws@8.20.0_zod@4.3.6/node_modules/openai/index.mjs")).default;
            const openai = new OpenAI({ apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY });
            const prompt = `Generate exactly ${count || 5} ${qType === "MCQ" ? "multiple choice" : qType === "Short" ? "short answer" : "mixed (MCQ and short answer)"} questions about "${topic || "Industrial Automation, PLC, Electrical Safety, CRM Sales"}".

Context: These are for SAI RoloTech CRM - an industrial automation company dealing with PLC, HMI, SCADA, VFD, Servo Motors, Panel Manufacturing, Machine Testing, and CRM/Sales.

Return ONLY valid JSON array. Each question object must have:
- "q": question text (in Hinglish - Hindi+English mix)
- "a": correct answer
- "type": "MCQ" or "Short"
- "options": array of 4 options (only for MCQ type, include correct answer)

Example: [{"q":"PLC ka full form kya hai?","a":"Programmable Logic Controller","type":"MCQ","options":["Programmable Logic Controller","Power Logic Circuit","Program Level Control","Process Logic Computer"]}]

Return ONLY the JSON array, no other text.`;
            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.8,
              max_tokens: 2e3
            });
            let text = completion.choices[0]?.message?.content || "[]";
            text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const questions = JSON.parse(text);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, questions }));
          } catch (err) {
            console.error("Question gen error:", err.message);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Service temporarily unavailable" }));
          }
        });
        async function getGmailClient() {
          const { google } = await import("file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/googleapis@171.4.0/node_modules/googleapis/build/src/index.js");
          const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
          const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
          const connResp = await fetch(
            "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=google-mail",
            { headers: { Accept: "application/json", "X-Replit-Token": xReplitToken } }
          );
          const connData = await connResp.json();
          const conn = connData.items?.[0];
          const accessToken = conn?.settings?.access_token || conn?.settings?.oauth?.credentials?.access_token;
          if (!accessToken) throw new Error("Gmail not connected");
          const oauth2Client = new google.auth.OAuth2();
          oauth2Client.setCredentials({ access_token: accessToken });
          return google.gmail({ version: "v1", auth: oauth2Client });
        }
        server.middlewares.use("/api/send-inquiry", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end("Method not allowed");
            return;
          }
          try {
            let body = "";
            for await (const chunk of req) body += chunk;
            const { name, email, phone, message, source } = JSON.parse(body);
            const gmail = await getGmailClient();
            const INQUIRY_EMAIL = "inquirysairolotech@gmail.com";
            const ADMIN_EMAIL = "admin.sairolotech@gmail.com";
            const emailContent = [
              `From: CRM System <${INQUIRY_EMAIL}>`,
              `To: ${INQUIRY_EMAIL}`,
              `Cc: ${ADMIN_EMAIL}`,
              `Subject: New Lead Inquiry: ${name} (${source || "Website"})`,
              `MIME-Version: 1.0`,
              `Content-Type: text/html; charset=utf-8`,
              ``,
              `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">`,
              `<h2 style="color:#667eea;border-bottom:2px solid #667eea;padding-bottom:10px;">New Lead Inquiry</h2>`,
              `<table style="width:100%;border-collapse:collapse;">`,
              `<tr><td style="padding:8px;font-weight:bold;">Name:</td><td style="padding:8px;">${name}</td></tr>`,
              `<tr style="background:#f9fafb;"><td style="padding:8px;font-weight:bold;">Email:</td><td style="padding:8px;">${email}</td></tr>`,
              `<tr><td style="padding:8px;font-weight:bold;">Phone:</td><td style="padding:8px;">${phone || "Not provided"}</td></tr>`,
              `<tr style="background:#f9fafb;"><td style="padding:8px;font-weight:bold;">Source:</td><td style="padding:8px;">${source || "Website Form"}</td></tr>`,
              `<tr><td style="padding:8px;font-weight:bold;">Message:</td><td style="padding:8px;">${message || "No message"}</td></tr>`,
              `<tr style="background:#f9fafb;"><td style="padding:8px;font-weight:bold;">Time:</td><td style="padding:8px;">${(/* @__PURE__ */ new Date()).toLocaleString("en-IN")}</td></tr>`,
              `</table></div>`
            ].join("\n");
            const encoded = Buffer.from(emailContent).toString("base64url");
            await gmail.users.messages.send({ userId: "me", requestBody: { raw: encoded } });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, message: "Inquiry sent successfully" }));
          } catch (err) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Service temporarily unavailable" }));
          }
        });
        server.middlewares.use("/new-lead", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }
          try {
            let body = "";
            for await (const chunk of req) body += chunk;
            const { name, phone, source, email } = JSON.parse(body || "{}");
            if (!phone) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Phone required" }));
              return;
            }
            const { createLead: createLead2, scheduleFollowups } = await Promise.resolve().then(() => (init_leadModel(), leadModel_exports)).catch(() => ({}));
            const { enqueue: enqueue2 } = await Promise.resolve().then(() => (init_queueService(), queueService_exports)).catch(() => ({}));
            if (createLead2) {
              const { existing, lead } = createLead2({ name, phone, source: source || "pabbly", email });
              if (!existing && enqueue2) enqueue2("SEND_WELCOME", { phone: lead.phone }, { delayMs: 2e3 });
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, duplicate: existing, leadId: lead.id }));
            } else {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, mock: true }));
            }
          } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Service temporarily unavailable" }));
          }
        });
        server.middlewares.use("/api/track", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }
          try {
            let body = "";
            for await (const chunk of req) body += chunk;
            const { phone, event, fcmToken } = JSON.parse(body || "{}");
            if (!phone || !event) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "phone and event required" }));
              return;
            }
            const { getLead: getLead2, updateLead: updateLead2, createLead: createLead2, recalculateScore: recalculateScore2 } = await Promise.resolve().then(() => (init_leadModel(), leadModel_exports)).catch(() => ({}));
            if (getLead2) {
              let lead = getLead2(phone) || createLead2({ phone, name: "App User", source: "app" }).lead;
              const updates = {};
              if (event === "download") updates.appInstalled = true;
              if (event === "app_open") {
                updates.appOpened = true;
                if (fcmToken) updates.fcmToken = fcmToken;
              }
              if (["quotation", "maintenance", "quality"].includes(event)) updates.features = [.../* @__PURE__ */ new Set([...lead.features || [], event])];
              updateLead2(phone, updates);
              const scored = recalculateScore2(phone);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, score: scored?.score }));
            } else {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, mock: true }));
            }
          } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Service temporarily unavailable" }));
          }
        });
        server.middlewares.use("/api/leads", async (req, res) => {
          if (req.method !== "GET") {
            res.writeHead(405);
            res.end();
            return;
          }
          const token = req.headers["x-admin-token"] || new URL(req.url, "http://x").searchParams.get("token");
          const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;
          if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Unauthorized" }));
            return;
          }
          try {
            const { getAllLeads: getAllLeads2, getStats: getStats2 } = await Promise.resolve().then(() => (init_leadModel(), leadModel_exports)).catch(() => ({}));
            if (getAllLeads2) {
              const leads2 = getAllLeads2();
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, total: leads2.length, leads: leads2, stats: getStats2() }));
            } else {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, total: 0, leads: [] }));
            }
          } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Service temporarily unavailable" }));
          }
        });
        server.middlewares.use("/api/lead-stats", async (req, res) => {
          const token = req.headers["x-admin-token"] || new URL(req.url, "http://x").searchParams.get("token");
          const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;
          if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Unauthorized" }));
            return;
          }
          try {
            const { getStats: getStats2 } = await Promise.resolve().then(() => (init_leadModel(), leadModel_exports)).catch(() => ({}));
            const stats = getStats2 ? getStats2() : { total: 0 };
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, stats }));
          } catch (err) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, stats: { total: 0 } }));
          }
        });
        server.middlewares.use("/api/gmail-leads", async (req, res) => {
          try {
            const gmail = await getGmailClient();
            const labelsResp = await gmail.users.labels.list({ userId: "me" });
            const labels = (labelsResp.data.labels || []).map((l) => ({ id: l.id, name: l.name }));
            const inboxDetail = (await gmail.users.labels.get({ userId: "me", id: "INBOX" })).data;
            let leads2 = [];
            let emailsScanned = 0;
            let scanMethod = "none";
            try {
              const msgList = await gmail.users.messages.list({
                userId: "me",
                maxResults: 50,
                q: "in:inbox"
              });
              const messages = msgList.data.messages || [];
              emailsScanned = messages.length;
              scanMethod = "full";
              for (const msg of messages.slice(0, 30)) {
                try {
                  const detail = await gmail.users.messages.get({
                    userId: "me",
                    id: msg.id,
                    format: "metadata",
                    metadataHeaders: ["From", "Subject", "Date"]
                  });
                  const headers = detail.data.payload?.headers || [];
                  const from = headers.find((h) => h.name === "From")?.value || "";
                  const subject = headers.find((h) => h.name === "Subject")?.value || "";
                  const date = headers.find((h) => h.name === "Date")?.value || "";
                  const nameMatch = from.match(/^"?([^"<]+)"?\s*<?/);
                  const emailMatch = from.match(/<([^>]+)>/) || from.match(/([^\s<]+@[^\s>]+)/);
                  const senderName = nameMatch ? nameMatch[1].trim() : from.split("@")[0];
                  const senderEmail = emailMatch ? emailMatch[1] : from;
                  const isLead = /inquiry|lead|quote|price|buy|order|interest|request|contact|help|service|product/i.test(subject) || /inquiry|lead|quote|price|order|interest|request/i.test(from);
                  const isInternal = /sairolotech|noreply|no-reply|mailer-daemon|postmaster/i.test(senderEmail);
                  const labelIds = detail.data.labelIds || [];
                  const isUnread = labelIds.includes("UNREAD");
                  leads2.push({
                    id: msg.id,
                    name: senderName,
                    email: senderEmail,
                    subject,
                    date,
                    snippet: detail.data.snippet || "",
                    isLead,
                    isInternal,
                    isUnread,
                    status: isLead ? "Hot Lead" : isInternal ? "Internal" : "New",
                    source: "Gmail"
                  });
                } catch (e) {
                }
              }
              leads2 = leads2.filter((l) => !l.isInternal);
            } catch (readErr) {
              scanMethod = "labels_only";
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
              success: true,
              connected: true,
              email: "inquirysairolotech@gmail.com",
              adminEmail: "admin.sairolotech@gmail.com",
              labels,
              inbox: {
                total: inboxDetail.messagesTotal,
                unread: inboxDetail.messagesUnread
              },
              leads: leads2,
              emailsScanned,
              scanMethod,
              totalLeads: leads2.filter((l) => l.isLead).length
            }));
          } catch (err) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Service temporarily unavailable", leads: [], labels: [] }));
          }
        });
        const _gmailState = { connected: false, email: "", connectedAt: "", lastSyncedAt: "", leads: [], history: [] };
        server.middlewares.use("/api/admin/gmail/status", async (req, res) => {
          try {
            const gmail = await getGmailClient();
            const profile = await gmail.users.getProfile({ userId: "me" });
            _gmailState.connected = true;
            _gmailState.email = profile.data.emailAddress || "inquirysairolotech@gmail.com";
            if (!_gmailState.connectedAt) _gmailState.connectedAt = (/* @__PURE__ */ new Date()).toISOString();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, connected: true, email: _gmailState.email, connectedAt: _gmailState.connectedAt, lastSyncedAt: _gmailState.lastSyncedAt }));
          } catch {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, connected: false }));
          }
        });
        server.middlewares.use("/api/admin/gmail/connect", async (req, res) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, authUrl: "", message: "Gmail is connected via Replit integration. Use Sync to fetch leads." }));
        });
        server.middlewares.use("/api/admin/gmail/disconnect", async (req, res) => {
          _gmailState.connected = false;
          _gmailState.email = "";
          _gmailState.leads = [];
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        });
        server.middlewares.use("/api/admin/gmail/sync", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }
          try {
            const gmail = await getGmailClient();
            const PORTAL_SENDERS = {
              "IndiaMart": ["indiamart", "buyerconnect", "buyleads"],
              "JustDial": ["justdial", "jd.com"],
              "TradeIndia": ["tradeindia"]
            };
            const searchQuery = "in:inbox (from:indiamart OR from:justdial OR from:tradeindia OR from:buyerconnect OR from:buyleads OR subject:inquiry OR subject:enquiry OR subject:lead OR subject:quote OR subject:interest) newer_than:30d";
            const msgList = await gmail.users.messages.list({ userId: "me", maxResults: 50, q: searchQuery });
            const messages = msgList.data.messages || [];
            const parsedLeads = [];
            for (const msg of messages.slice(0, 40)) {
              try {
                let extractText = function(part) {
                  if (part.mimeType === "text/plain" && part.body?.data) {
                    bodyText += Buffer.from(part.body.data, "base64").toString("utf8");
                  }
                  if (part.parts) part.parts.forEach(extractText);
                };
                const detail = await gmail.users.messages.get({ userId: "me", id: msg.id, format: "full" });
                const headers = detail.data.payload?.headers || [];
                const from = headers.find((h) => h.name === "From")?.value || "";
                const subject = headers.find((h) => h.name === "Subject")?.value || "";
                const date = headers.find((h) => h.name === "Date")?.value || "";
                const fromLower = from.toLowerCase();
                let source = "Gmail";
                for (const [portal, keywords] of Object.entries(PORTAL_SENDERS)) {
                  if (keywords.some((k) => fromLower.includes(k))) {
                    source = portal;
                    break;
                  }
                }
                if (source === "Gmail") {
                  const subLower = subject.toLowerCase();
                  if (subLower.includes("indiamart") || subLower.includes("buyer")) source = "IndiaMart";
                  else if (subLower.includes("justdial") || subLower.includes("jd.com") || subLower.includes("just dial")) source = "JustDial";
                  else if (subLower.includes("tradeindia")) source = "TradeIndia";
                }
                if (source === "Gmail") continue;
                let bodyText = "";
                if (detail.data.payload) extractText(detail.data.payload);
                if (!bodyText && detail.data.snippet) bodyText = detail.data.snippet;
                const phoneMatch = bodyText.match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/);
                const nameMatch = bodyText.match(/(?:name|buyer|contact|client)\s*[:\-]?\s*([A-Za-z\s]{2,40})/i);
                const cityMatch = bodyText.match(/(?:city|location|address|place)\s*[:\-]?\s*([A-Za-z\s]{2,30})/i);
                const productMatch = bodyText.match(/(?:product|machine|item|interest|requirement|looking for)\s*[:\-]?\s*([A-Za-z\s,]{3,60})/i);
                const emailMatch = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                const nameFromHeader = from.match(/^"?([^"<]+)"?\s*</) ? from.match(/^"?([^"<]+)"?\s*</)[1].trim() : "";
                parsedLeads.push({
                  id: msg.id,
                  source,
                  name: nameMatch?.[1]?.trim() || nameFromHeader || "Unknown",
                  phone: phoneMatch ? phoneMatch[0].replace(/[\s-]/g, "") : "",
                  email: emailMatch ? emailMatch[0] : "",
                  company: "",
                  product: productMatch?.[1]?.trim() || "",
                  city: cityMatch?.[1]?.trim() || "",
                  receivedAt: date ? new Date(date).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
                  rawSubject: subject,
                  imported: _gmailState.leads.some((l) => l.id === msg.id && l.imported)
                });
              } catch {
              }
            }
            _gmailState.leads = parsedLeads;
            _gmailState.lastSyncedAt = (/* @__PURE__ */ new Date()).toISOString();
            const newLeads = parsedLeads.filter((l) => !l.imported).length;
            _gmailState.history.unshift({
              id: `sync_${Date.now()}`,
              syncedAt: _gmailState.lastSyncedAt,
              source: "gmail",
              totalFetched: messages.length,
              newLeads,
              imported: 0,
              skipped: parsedLeads.filter((l) => l.imported).length
            });
            if (_gmailState.history.length > 20) _gmailState.history = _gmailState.history.slice(0, 20);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, leads: parsedLeads, totalFetched: messages.length, newLeads, syncedAt: _gmailState.lastSyncedAt }));
          } catch (err) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Gmail sync failed", leads: [] }));
          }
        });
        server.middlewares.use("/api/admin/gmail/leads", async (req, res) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, leads: _gmailState.leads }));
        });
        server.middlewares.use("/api/admin/gmail/import", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }
          try {
            const body = await new Promise((resolve) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch {
                  resolve({});
                }
              });
            });
            const leadIds = body.leadIds || [];
            let imported = 0, skipped = 0;
            for (const id of leadIds) {
              const lead = _gmailState.leads.find((l) => l.id === id);
              if (!lead || lead.imported) {
                skipped++;
                continue;
              }
              lead.imported = true;
              imported++;
            }
            if (_gmailState.history.length > 0) {
              _gmailState.history[0].imported += imported;
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, imported, skipped }));
          } catch {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, imported: 0, skipped: 0 }));
          }
        });
        server.middlewares.use("/api/admin/gmail/history", async (req, res) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, history: _gmailState.history }));
        });
        const _memoryConversations = /* @__PURE__ */ new Map();
        const _memoryFollowups = /* @__PURE__ */ new Map();
        server.middlewares.use("/api/admin/memory/stats", async (req, res) => {
          if (!adminOk(req, res)) return;
          const all = [..._memoryFollowups.values()];
          json(res, {
            success: true,
            total: all.length,
            pending: all.filter((f) => f.status === "pending").length,
            sent: all.filter((f) => f.status === "sent").length,
            cancelled: all.filter((f) => f.status === "cancelled").length
          });
        });
        server.middlewares.use("/api/admin/memory/lead/", async (req, res) => {
          if (!adminOk(req, res)) return;
          const phone = req.url.replace(/^\//, "").replace(/\D/g, "");
          const msgs = _memoryConversations.get(phone) || [];
          const intents = msgs.filter((m) => m.intent).map((m) => m.intent);
          json(res, {
            success: true,
            profile: { phone, totalMessages: msgs.length, intents },
            history: msgs.slice(-20),
            context: `Lead ${phone}: ${msgs.length} messages, intents: ${intents.join(", ") || "none"}`
          });
        });
        const _devTasks = /* @__PURE__ */ new Map();
        const _devNotes = /* @__PURE__ */ new Map();
        let _devTaskId = 1;
        server.middlewares.use("/api/admin/tasks/stats", async (req, res) => {
          if (!adminOk(req, res)) return;
          const all = [..._devTasks.values()];
          json(res, { success: true, total: all.length, pending: all.filter((t) => t.status === "pending").length, completed: all.filter((t) => t.status === "completed").length, skipped: all.filter((t) => t.status === "skipped").length, todayPending: 0, highPriority: 0, notesCount: _devNotes.size });
        });
        server.middlewares.use("/api/admin/tasks/today", async (req, res) => {
          if (!adminOk(req, res)) return;
          json(res, { success: true, tasks: [..._devTasks.values()].filter((t) => t.status === "pending") });
        });
        server.middlewares.use("/api/admin/tasks/upcoming", async (req, res) => {
          if (!adminOk(req, res)) return;
          json(res, { success: true, tasks: [..._devTasks.values()].filter((t) => t.status === "pending") });
        });
        server.middlewares.use("/api/admin/tasks/daily-plan", async (req, res) => {
          if (!adminOk(req, res)) return;
          json(res, { success: true, plan: "Dev mode: No tasks yet. Create leads and interact to generate AI notes and tasks.", tasks: [], taskCount: 0, highPriority: 0, generatedAt: (/* @__PURE__ */ new Date()).toISOString() });
        });
        server.middlewares.use("/api/admin/notes/all", async (req, res) => {
          if (!adminOk(req, res)) return;
          json(res, { success: true, notes: [..._devNotes.values()] });
        });
        const _cfg = {
          aiEnabled: true,
          aiModel: "gemini-2.5-flash",
          whatsappEnabled: true,
          pushEnabled: true,
          followupEnabled: true,
          maintenanceMode: false,
          dailyMessageLimit: 100,
          alertOnError: true
        };
        const _logs2 = [];
        const _stats2 = { aiCalls: 0, aiErrors: 0, whatsappSent: 0, whatsappFailed: 0, pushSent: 0, totalLeads: 0, followupsSent: 0, messagesToday: 0, startTime: Date.now() };
        const _midnightReset = () => {
          const n = /* @__PURE__ */ new Date();
          const ms = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 5) - n;
          setTimeout(() => {
            _stats2.messagesToday = 0;
            setInterval(() => {
              _stats2.messagesToday = 0;
            }, 864e5);
          }, ms);
        };
        _midnightReset();
        function readBody(req) {
          return new Promise((resolve) => {
            let b = "";
            req.on("data", (c) => b += c);
            req.on("end", () => {
              try {
                resolve(JSON.parse(b || "{}"));
              } catch {
                resolve({});
              }
            });
          });
        }
        function adminOk(req, res) {
          const TOKEN = process.env.ADMIN_API_TOKEN;
          if (!TOKEN) {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "ADMIN_API_TOKEN not configured" }));
            return false;
          }
          const bearer = (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "") || req.headers["x-admin-token"] || "";
          if (bearer !== TOKEN) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Unauthorized" }));
            return false;
          }
          return true;
        }
        function json(res, data, status = 200) {
          res.writeHead(status, { "Content-Type": "application/json" });
          res.end(JSON.stringify(data));
        }
        server.middlewares.use("/api/admin/verify", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }
          const TOKEN = process.env.ADMIN_API_TOKEN;
          if (!TOKEN) return json(res, { error: "ADMIN_API_TOKEN not configured" }, 503);
          const body = await readBody(req);
          if (body.token === TOKEN) return json(res, { success: true });
          return json(res, { error: "Invalid token" }, 401);
        });
        server.middlewares.use("/api/admin/config", async (req, res) => {
          if (!adminOk(req, res)) return;
          if (req.method === "GET") return json(res, { ..._cfg });
          if (req.method === "PATCH") {
            const body = await readBody(req);
            const allowed = ["aiEnabled", "aiModel", "whatsappEnabled", "pushEnabled", "followupEnabled", "maintenanceMode", "dailyMessageLimit", "alertOnError"];
            for (const k of allowed) {
              if (k in body) _cfg[k] = body[k];
            }
            return json(res, { ..._cfg });
          }
          res.writeHead(405);
          res.end();
        });
        server.middlewares.use("/api/admin/config/reset", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }
          if (!adminOk(req, res)) return;
          Object.assign(_cfg, { aiEnabled: true, aiModel: "gemini-2.5-flash", whatsappEnabled: true, pushEnabled: true, followupEnabled: true, maintenanceMode: false, dailyMessageLimit: 100, alertOnError: true });
          return json(res, { ..._cfg });
        });
        server.middlewares.use("/api/admin/stats", async (req, res) => {
          if (req.method !== "GET") {
            res.writeHead(405);
            res.end();
            return;
          }
          if (!adminOk(req, res)) return;
          json(res, {
            stats: { ..._stats2, uptimeSeconds: Math.floor((Date.now() - _stats2.startTime) / 1e3), errorCount: _logs2.length },
            config: { ..._cfg },
            env: {
              whatsapp: !!process.env.WHATSAPP_ACCESS_TOKEN,
              fcm: !!process.env.FCM_SERVER_KEY,
              openrouter: !!(process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY),
              gemini: !!(process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY),
              adminToken: !!process.env.ADMIN_API_TOKEN
            },
            uptime: process.uptime(),
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        });
        server.middlewares.use("/api/admin/logs", async (req, res) => {
          if (req.method === "GET") {
            if (!adminOk(req, res)) return;
            return json(res, { logs: _logs2.slice(0, 50), total: _logs2.length });
          }
          if (req.method === "DELETE") {
            if (!adminOk(req, res)) return;
            _logs2.length = 0;
            return json(res, { success: true, message: "Logs cleared" });
          }
          res.writeHead(405);
          res.end();
        });
        server.middlewares.use("/api/admin/logs/test", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }
          if (!adminOk(req, res)) return;
          _logs2.unshift({ id: Date.now(), ts: (/* @__PURE__ */ new Date()).toISOString(), source: "AdminPanel", message: "Test error \u2014 manual trigger from Control Panel", details: "System is working correctly." });
          return json(res, { success: true, message: "Test log entry added" });
        });
        server.middlewares.use("/api/lead-analytics", async (req, res) => {
          try {
            const { getStats: getStats2, getSourceAnalytics: getSourceAnalytics2, getLocationAnalytics: getLocationAnalytics2, getPriorityLeads: getPriorityLeads2 } = await Promise.resolve().then(() => (init_leadModel(), leadModel_exports)).catch(() => ({}));
            if (!getStats2) {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, stats: { total: 0, hot: 0, warm: 0, cold: 0, converted: 0, dropped: 0 }, sources: [], locations: [], priorityLeads: [] }));
              return;
            }
            const stats = getStats2();
            const sources = getSourceAnalytics2 ? getSourceAnalytics2() : [];
            const locations = getLocationAnalytics2 ? getLocationAnalytics2() : [];
            const priorityLeads = getPriorityLeads2 ? getPriorityLeads2(10) : [];
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, stats, sources, locations, priorityLeads }));
          } catch (err) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, stats: { total: 0 }, sources: [], locations: [], priorityLeads: [] }));
          }
        });
        server.middlewares.use("/api/integration-status", async (req, res) => {
          const statuses = {
            whatsapp: { connected: !!process.env.WHATSAPP_ACCESS_TOKEN, label: "WhatsApp Business API", note: process.env.WHATSAPP_ACCESS_TOKEN ? "Live" : "Token not set \u2014 mock mode" },
            fcm: { connected: !!process.env.FCM_SERVER_KEY, label: "Firebase Cloud Messaging", note: process.env.FCM_SERVER_KEY ? "Live" : "FCM_SERVER_KEY not set \u2014 no push" },
            gmail: { connected: true, label: "Gmail OAuth", note: "Via Replit connector" },
            gemini: { connected: !!process.env.AI_INTEGRATIONS_GEMINI_API_KEY, label: "Gemini AI", note: process.env.AI_INTEGRATIONS_GEMINI_API_KEY ? "Active" : "API key missing" }
          };
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, statuses }));
        });
        server.middlewares.use("/api/message-quality", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }
          try {
            let body = "";
            for await (const chunk of req) body += chunk;
            const { message, leadContext } = JSON.parse(body);
            const { GoogleGenAI } = await import("file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/@google+genai@1.46.0/node_modules/@google/genai/dist/node/index.mjs");
            const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY });
            const prompt = `You are a WhatsApp sales message expert for SAI RoloTech (Roll Forming Machine manufacturer, Delhi).
Analyze this message and return ONLY valid JSON:
{
  "score": <number 0-100>,
  "grade": "<Excellent|Good|Average|Weak|Poor>",
  "issues": ["<issue1>", "<issue2>"],
  "improved": "<improved version of message in Hinglish>",
  "tips": ["<tip1>", "<tip2>"]
}

Message to analyze: "${message}"
Lead Context: "${leadContext || "General lead"}"

Score based on: clarity, urgency, personalization, call-to-action, length, Hinglish tone.`;
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: [{ role: "user", parts: [{ text: prompt }] }], config: { maxOutputTokens: 800, temperature: 0.3 } });
            let text = (response.text || "{}").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const result = JSON.parse(text);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, ...result }));
          } catch (err) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Service temporarily unavailable" }));
          }
        });
        server.middlewares.use("/api/ab-variants", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }
          try {
            let body = "";
            for await (const chunk of req) body += chunk;
            const { goal, leadName, locationZone, source } = JSON.parse(body);
            const { GoogleGenAI } = await import("file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/@google+genai@1.46.0/node_modules/@google/genai/dist/node/index.mjs");
            const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY });
            const prompt = `You are a WhatsApp sales expert for SAI RoloTech (Roll Forming Machines, Delhi).
Generate 2 A/B test message variants. Return ONLY valid JSON:
{
  "variantA": { "label": "<short label>", "message": "<WhatsApp message in Hinglish>", "tone": "<Formal/Friendly/Urgent>", "bestFor": "<when to use>" },
  "variantB": { "label": "<short label>", "message": "<WhatsApp message in Hinglish, different approach>", "tone": "<Formal/Friendly/Urgent>", "bestFor": "<when to use>" }
}

Goal: ${goal}
Lead Name: ${leadName || "Customer"}
Location Zone: ${locationZone || "HIGH"}
Source: ${source || "indiamart"}`;
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: [{ role: "user", parts: [{ text: prompt }] }], config: { maxOutputTokens: 800, temperature: 0.7 } });
            let text = (response.text || "{}").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const result = JSON.parse(text);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, ...result }));
          } catch (err) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Service temporarily unavailable" }));
          }
        });
        {
          let productApp = null;
          server.middlewares.use("/api/products", async (req, res, next) => {
            if (!productApp) {
              const { default: exp } = await import("file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/express@5.2.1/node_modules/express/index.js");
              const { default: productsRouter } = await Promise.resolve().then(() => (init_products(), products_exports));
              productApp = exp();
              productApp.use(exp.json({ limit: "2mb" }));
              productApp.use(exp.urlencoded({ extended: false }));
              productApp.use("/", productsRouter);
            }
            req.url = req.url.replace(/^\/api\/products/, "") || "/";
            productApp(req, res, next);
          });
        }
        {
          const devBetaLog = [];
          server.middlewares.use("/api/beta/create-lead", async (req, res) => {
            if (req.method !== "POST") {
              res.writeHead(405);
              res.end();
              return;
            }
            try {
              let body = "";
              for await (const c of req) body += c;
              const { name, phone, source = "beta_test", state = "Delhi", notes = "" } = JSON.parse(body);
              if (!name || !phone) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: "name and phone required" }));
                return;
              }
              const { createLead: createLead2 } = await Promise.resolve().then(() => (init_leadModel(), leadModel_exports)).catch(() => ({}));
              if (!createLead2) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, mock: true, lead: { name, phone: phone.replace(/\D/g, ""), source, state } }));
                return;
              }
              const result = createLead2({ name, phone, source, extra: { state, notes, isBetaTest: true } });
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, ...result }));
            } catch (e) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          server.middlewares.use("/api/beta/send-wa", async (req, res) => {
            if (req.method !== "POST") {
              res.writeHead(405);
              res.end();
              return;
            }
            try {
              let body = "";
              for await (const c of req) body += c;
              const { phone, messageType, dayIndex = 0, customText } = JSON.parse(body);
              const { getLead: getLead2 } = await Promise.resolve().then(() => (init_leadModel(), leadModel_exports)).catch(() => ({}));
              const lead = getLead2 ? getLead2(phone.replace(/\D/g, "")) : null;
              const mockLead = lead || { name: "Beta Tester", phone: phone.replace(/\D/g, ""), score: "WARM", locationPriority: "HIGH", source: "beta_test" };
              const entry = { id: `msg_${Date.now()}`, phone: mockLead.phone, leadName: mockLead.name, messageType, label: { welcome: "Welcome", followup: `Follow-up D${dayIndex}`, admin_alert: "Admin Alert", quotation: "Quotation", custom: "Custom" }[messageType] || messageType, dayIndex, mock: !process.env.WHATSAPP_ACCESS_TOKEN, blocked: false, waMessageId: null, status: process.env.WHATSAPP_ACCESS_TOKEN ? "real_sent" : "mock_sent", timestamp: (/* @__PURE__ */ new Date()).toISOString() };
              if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_ID) {
                const wa = await Promise.resolve().then(() => (init_whatsappService(), whatsappService_exports)).catch(() => ({}));
                try {
                  let waResult;
                  if (messageType === "welcome") waResult = await wa.sendWelcomeMessage?.(mockLead);
                  else if (messageType === "followup") waResult = await wa.sendFollowup?.(mockLead, dayIndex);
                  else if (messageType === "admin_alert") waResult = await wa.sendAdminAlert?.(mockLead, "Beta Test");
                  else if (messageType === "quotation") waResult = await wa.sendQuotationFollowup?.(mockLead);
                  else if (messageType === "custom" && customText) waResult = await wa.sendCustom?.(phone, customText);
                  entry.waMessageId = waResult?.messages?.[0]?.id || null;
                  entry.mock = !!waResult?.mock;
                  entry.blocked = !!waResult?.blocked;
                  entry.status = waResult?.blocked ? "blocked" : waResult?.mock ? "mock_sent" : "real_sent";
                } catch (err) {
                  entry.status = "error";
                  entry.error = err.message;
                }
              }
              devBetaLog.unshift(entry);
              if (devBetaLog.length > 200) devBetaLog.pop();
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, entry }));
            } catch (e) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          server.middlewares.use("/api/beta/get-lead", async (req, res) => {
            const url = new URL(req.url, "http://x");
            const phone = (url.searchParams.get("phone") || "").replace(/\D/g, "");
            const { getLead: getLead2 } = await Promise.resolve().then(() => (init_leadModel(), leadModel_exports)).catch(() => ({}));
            const lead = getLead2 ? getLead2(phone) : null;
            if (!lead) {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: "Lead not found" }));
              return;
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, lead }));
          });
          server.middlewares.use("/api/beta/message-log", (req, res) => {
            const url = new URL(req.url, "http://x");
            const phone = (url.searchParams.get("phone") || "").replace(/\D/g, "");
            const log = phone ? devBetaLog.filter((m) => m.phone === phone) : devBetaLog;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, log, total: log.length }));
          });
          server.middlewares.use("/api/beta/clear-log", (req, res) => {
            devBetaLog.length = 0;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          });
        }
        server.middlewares.use("/api/smart-timing", async (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }
          try {
            let body = "";
            for await (const chunk of req) body += chunk;
            const { score, locationZone, source, daysSinceCreation, repliesCount } = JSON.parse(body);
            const { GoogleGenAI } = await import("file:///C:/Users/Sai%20Rolotech/New%20folder/cloud-code-extension/node_modules/.pnpm/@google+genai@1.46.0/node_modules/@google/genai/dist/node/index.mjs");
            const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY });
            const prompt = `You are a sales timing expert for SAI RoloTech CRM (Roll Forming Machines, Delhi).
Based on lead profile, recommend follow-up timing. Return ONLY valid JSON:
{
  "waitDays": <number 0-30>,
  "bestTime": "<e.g. 10:00 AM - 12:00 PM>",
  "urgency": "<Immediate|Today|This Week|Next Week|Monthly>",
  "reason": "<1-2 lines why this timing>",
  "action": "<specific action to take>"
}

Lead Score: ${score}
Location Zone: ${locationZone}
Source: ${source}
Days Since Creation: ${daysSinceCreation}
Replies Given: ${repliesCount}`;
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: [{ role: "user", parts: [{ text: prompt }] }], config: { maxOutputTokens: 400, temperature: 0.3 } });
            let text = (response.text || "{}").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const result = JSON.parse(text);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, ...result }));
          } catch (err) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Service temporarily unavailable" }));
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@": path5.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    allowedHosts: true,
    watch: {
      ignored: ["**/.local/**", "**/node_modules/**"]
    }
  },
  build: {
    target: "es2015",
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-motion": ["framer-motion"],
          "vendor-charts": ["recharts"],
          "vendor-router": ["wouter"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle"
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  define: {
    "import.meta.env.VITE_FIREBASE_API_KEY": JSON.stringify(
      process.env.VITE_FIREBASE_API_KEY || process.env.FIRE_BASE_API_KEY || process.env.GOOGLE_API_KEY || ""
    )
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2VydmVyL21vZGVscy9sZWFkTW9kZWwuanMiLCAic2VydmVyL3NlcnZpY2VzL3F1ZXVlU2VydmljZS5qcyIsICJzZXJ2ZXIvcm91dGVzL3Byb2R1Y3RzLmpzIiwgInNlcnZlci9zZXJ2aWNlcy9jb25maWdTZXJ2aWNlLmpzIiwgInNlcnZlci9zZXJ2aWNlcy9hY3Rpdml0eUxvZ2dlci5qcyIsICJzZXJ2ZXIvc2VydmljZXMvd2hhdHNhcHBTZXJ2aWNlLmpzIiwgInZpdGUuY29uZmlnLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcU2FpIFJvbG90ZWNoXFxcXE5ldyBmb2xkZXJcXFxcY2xvdWQtY29kZS1leHRlbnNpb25cXFxcY3JtLTJcXFxcc2VydmVyXFxcXG1vZGVsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcU2FpIFJvbG90ZWNoXFxcXE5ldyBmb2xkZXJcXFxcY2xvdWQtY29kZS1leHRlbnNpb25cXFxcY3JtLTJcXFxcc2VydmVyXFxcXG1vZGVsc1xcXFxsZWFkTW9kZWwuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1NhaSUyMFJvbG90ZWNoL05ldyUyMGZvbGRlci9jbG91ZC1jb2RlLWV4dGVuc2lvbi9jcm0tMi9zZXJ2ZXIvbW9kZWxzL2xlYWRNb2RlbC5qc1wiOy8qKlxyXG4gKiBMZWFkIE1vZGVsIFx1MjAxNCBpbi1tZW1vcnkgc3RvcmUgd2l0aCBKU09OIGZpbGUgcGVyc2lzdGVuY2VcclxuICogTW9uZ29EQiBuYWhpIGhvbmUgcGFyIGJoaSBkYXRhIHNhdmUgcmVodGEgaGFpIHJlc3RhcnQga2UgYmFhZFxyXG4gKi9cclxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnO1xyXG5cclxuY29uc3QgX19kaXJuYW1lID0gcGF0aC5kaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSk7XHJcbmNvbnN0IERBVEFfRElSID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ2RhdGEnKTtcclxuY29uc3QgTEVBRFNfRklMRSA9IHBhdGguam9pbihEQVRBX0RJUiwgJ2xlYWRzLmpzb24nKTtcclxuXHJcbi8vIEVuc3VyZSBkYXRhIGRpcmVjdG9yeSBleGlzdHNcclxuaWYgKCFmcy5leGlzdHNTeW5jKERBVEFfRElSKSkgZnMubWtkaXJTeW5jKERBVEFfRElSLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxuXHJcbi8vIEluLW1lbW9yeSBzdG9yZVxyXG5sZXQgbGVhZHMgPSBuZXcgTWFwKCk7IC8vIHBob25lIFx1MjE5MiBsZWFkIG9iamVjdFxyXG5cclxuLy8gTG9hZCBleGlzdGluZyBsZWFkcyBmcm9tIGZpbGVcclxuZnVuY3Rpb24gbG9hZExlYWRzKCkge1xyXG4gIHRyeSB7XHJcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhMRUFEU19GSUxFKSkge1xyXG4gICAgICBjb25zdCByYXcgPSBmcy5yZWFkRmlsZVN5bmMoTEVBRFNfRklMRSwgJ3V0ZjgnKTtcclxuICAgICAgY29uc3QgYXJyID0gSlNPTi5wYXJzZShyYXcpO1xyXG4gICAgICBhcnIuZm9yRWFjaChsID0+IGxlYWRzLnNldChsLnBob25lLCBsKSk7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdURDQzIgTG9hZGVkICR7YXJyLmxlbmd0aH0gbGVhZHMgZnJvbSBkaXNrYCk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdcdTI2QTBcdUZFMEYgIENvdWxkIG5vdCBsb2FkIGxlYWRzOicsIGVyci5tZXNzYWdlKTtcclxuICB9XHJcbn1cclxuXHJcbi8vIFNhdmUgbGVhZHMgdG8gZmlsZSAoZGVib3VuY2VkKVxyXG5sZXQgc2F2ZVRpbWVyID0gbnVsbDtcclxuZnVuY3Rpb24gc2NoZWR1bGVTYXZlKCkge1xyXG4gIGlmIChzYXZlVGltZXIpIGNsZWFyVGltZW91dChzYXZlVGltZXIpO1xyXG4gIHNhdmVUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgZnMud3JpdGVGaWxlU3luYyhMRUFEU19GSUxFLCBKU09OLnN0cmluZ2lmeShbLi4ubGVhZHMudmFsdWVzKCldLCBudWxsLCAyKSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignXHUyNkEwXHVGRTBGICBDb3VsZCBub3Qgc2F2ZSBsZWFkczonLCBlcnIubWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgfSwgMTAwMCk7XHJcbn1cclxuXHJcbmxvYWRMZWFkcygpO1xyXG5cclxuLyogXHUyNTAwXHUyNTAwIENSVUQgT3BlcmF0aW9ucyBcdTI1MDBcdTI1MDAgKi9cclxuXHJcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBMb2NhdGlvbiBQcmlvcml0eSBTeXN0ZW0gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbmNvbnN0IE5FQVJfU1RBVEVTICAgPSBbJ2RlbGhpJywgJ2hhcnlhbmEnLCAndXR0YXIgcHJhZGVzaCcsICd1cCcsICdyYWphc3RoYW4nLCAncHVuamFiJywgJ2hpbWFjaGFsIHByYWRlc2gnLCAndXR0YXJha2hhbmQnLCAnY2hhbmRpZ2FyaCddO1xyXG5jb25zdCBNRURJVU1fU1RBVEVTID0gWydtYWhhcmFzaHRyYScsICdndWphcmF0JywgJ21hZGh5YSBwcmFkZXNoJywgJ21wJywgJ2JpaGFyJywgJ2poYXJraGFuZCcsICdjaGhhdHRpc2dhcmgnLCAnd2VzdCBiZW5nYWwnXTtcclxuLy8gRXZlcnl0aGluZyBlbHNlID0gRkFSIChzb3V0aCBpbmRpYSwgbm9ydGgtZWFzdCwgZXRjLilcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhdGlvblByaW9yaXR5KHN0YXRlID0gJycpIHtcclxuICBjb25zdCBzID0gc3RhdGUudG9Mb3dlckNhc2UoKS50cmltKCk7XHJcbiAgaWYgKCFzKSByZXR1cm4gJ1VOS05PV04nO1xyXG4gIGlmIChORUFSX1NUQVRFUy5zb21lKG4gPT4gcy5pbmNsdWRlcyhuKSkpIHJldHVybiAnSElHSCc7XHJcbiAgaWYgKE1FRElVTV9TVEFURVMuc29tZShtID0+IHMuaW5jbHVkZXMobSkpKSByZXR1cm4gJ01FRElVTSc7XHJcbiAgcmV0dXJuICdMT1cnO1xyXG59XHJcblxyXG4vKiogU21hcnQgY29tcG9zaXRlIHNjb3JlOiBMb2NhdGlvbiA0MCUgKyBCZWhhdmlvciA0MCUgKyBTb3VyY2UgMjAlICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVTbWFydFNjb3JlKGxlYWQpIHtcclxuICBsZXQgc2NvcmUgPSAwO1xyXG5cclxuICAvLyBCZWhhdmlvciBzY29yZSAoNDAgcHRzKVxyXG4gIGlmIChsZWFkLm1lZXRpbmdCb29rZWQpIHNjb3JlICs9IDQwO1xyXG4gIGVsc2UgaWYgKGxlYWQuZmVhdHVyZXM/LmluY2x1ZGVzKCdxdW90YXRpb24nKSkgc2NvcmUgKz0gMzI7XHJcbiAgZWxzZSBpZiAobGVhZC5mZWF0dXJlcz8ubGVuZ3RoID4gMCkgc2NvcmUgKz0gMjA7XHJcbiAgZWxzZSBpZiAobGVhZC5hcHBPcGVuZWQpIHNjb3JlICs9IDEyO1xyXG5cclxuICAvLyBMb2NhdGlvbiBzY29yZSAoNDAgcHRzKVxyXG4gIGNvbnN0IGxvYyA9IGxlYWQubG9jYXRpb25Qcmlvcml0eSB8fCBnZXRMb2NhdGlvblByaW9yaXR5KGxlYWQuc3RhdGUpO1xyXG4gIGlmIChsb2MgPT09ICdISUdIJykgICBzY29yZSArPSA0MDtcclxuICBlbHNlIGlmIChsb2MgPT09ICdNRURJVU0nKSBzY29yZSArPSAyNDtcclxuICBlbHNlIGlmIChsb2MgPT09ICdMT1cnKSAgICBzY29yZSArPSA4O1xyXG5cclxuICAvLyBTb3VyY2Ugc2NvcmUgKDIwIHB0cylcclxuICBjb25zdCBzcmMgPSAobGVhZC5zb3VyY2UgfHwgJycpLnRvTG93ZXJDYXNlKCk7XHJcbiAgaWYgKHNyYy5pbmNsdWRlcygnaW5kaWFtYXJ0JykpIHNjb3JlICs9IDIwO1xyXG4gIGVsc2UgaWYgKHNyYy5pbmNsdWRlcygnanVzdGRpYWwnKSkgc2NvcmUgKz0gMTQ7XHJcbiAgZWxzZSBpZiAoc3JjID09PSAnYXBwX2RpcmVjdCcpIHNjb3JlICs9IDE4O1xyXG4gIGVsc2Ugc2NvcmUgKz0gMTA7XHJcblxyXG4gIC8vIENvbnZlcnQgdG8gbGFiZWxcclxuICBpZiAoc2NvcmUgPj0gODApIHJldHVybiAnVkVSWV9IT1QnO1xyXG4gIGlmIChzY29yZSA+PSA1MikgcmV0dXJuICdIT1QnO1xyXG4gIGlmIChzY29yZSA+PSAzMCkgcmV0dXJuICdXQVJNJztcclxuICByZXR1cm4gJ0NPTEQnO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTGVhZCh7IG5hbWUsIHBob25lLCBzb3VyY2UgPSAndW5rbm93bicsIGVtYWlsID0gJycsIGV4dHJhID0ge30gfSkge1xyXG4gIGlmICghcGhvbmUpIHRocm93IG5ldyBFcnJvcignUGhvbmUgcmVxdWlyZWQnKTtcclxuICBjb25zdCBjbGVhbiA9IHBob25lLnJlcGxhY2UoL1xcRC9nLCAnJyk7XHJcbiAgaWYgKGxlYWRzLmhhcyhjbGVhbikpIHJldHVybiB7IGV4aXN0aW5nOiB0cnVlLCBsZWFkOiBsZWFkcy5nZXQoY2xlYW4pIH07XHJcblxyXG4gIGNvbnN0IGNpdHkgID0gZXh0cmEuY2l0eSAgfHwgJyc7XHJcbiAgY29uc3Qgc3RhdGUgPSBleHRyYS5zdGF0ZSB8fCAnJztcclxuICBjb25zdCBsb2NhdGlvblByaW9yaXR5ID0gZ2V0TG9jYXRpb25Qcmlvcml0eShzdGF0ZSk7XHJcblxyXG4gIGNvbnN0IGxlYWQgPSB7XHJcbiAgICBpZDogYGxlYWRfJHtEYXRlLm5vdygpfV8ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDcpfWAsXHJcbiAgICBuYW1lOiBuYW1lIHx8ICdVbmtub3duJyxcclxuICAgIHBob25lOiBjbGVhbixcclxuICAgIGVtYWlsLFxyXG4gICAgc291cmNlLFxyXG4gICAgc2NvcmU6ICdDT0xEJywgICAgICAgICAvLyBDT0xEIHwgV0FSTSB8IEhPVCB8IFZFUllfSE9UXHJcbiAgICBzbWFydFNjb3JlOiAwLCAgICAgICAgIC8vIG51bWVyaWMgY29tcG9zaXRlIHNjb3JlXHJcbiAgICBzdGF0dXM6ICduZXcnLCAgICAgICAgIC8vIG5ldyB8IGNvbnRhY3RlZCB8IGFjdGl2ZSB8IGRuZCB8IGNvbnZlcnRlZFxyXG4gICAgY29udmVyc2lvblN0YXR1czogbnVsbCwvLyBudWxsIHwgJ2NvbnZlcnRlZCcgfCAnbG9zdCdcclxuICAgIHJldmVudWU6IDAsICAgICAgICAgICAgLy8gXHUyMEI5IHJldmVudWUgaWYgY29udmVydGVkXHJcbiAgICBhcHBJbnN0YWxsZWQ6IGZhbHNlLFxyXG4gICAgYXBwT3BlbmVkOiBmYWxzZSxcclxuICAgIGZlYXR1cmVzOiBbXSwgICAgICAgICAgLy8gWydxdW90YXRpb24nLCAnbWFpbnRlbmFuY2UnLCAncXVhbGl0eSddXHJcbiAgICBtZWV0aW5nQm9va2VkOiBmYWxzZSxcclxuICAgIGRuZDogZmFsc2UsXHJcbiAgICBmY21Ub2tlbjogbnVsbCxcclxuICAgIGZvbGxvd3VwSW5kZXg6IDAsXHJcbiAgICBsYXN0Q29udGFjdDogbnVsbCxcclxuICAgIG5leHRGb2xsb3d1cDogbnVsbCxcclxuICAgIHJlcGxpZXM6IFtdLFxyXG4gICAgbm90ZXM6IGV4dHJhLm5vdGVzIHx8ICcnLFxyXG4gICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgIC4uLmV4dHJhLFxyXG4gICAgY2l0eSxcclxuICAgIHN0YXRlLFxyXG4gICAgbG9jYXRpb25Qcmlvcml0eSwgICAgICAvLyBISUdIIHwgTUVESVVNIHwgTE9XIHwgVU5LTk9XTiBcdTIwMTQgYWx3YXlzIG92ZXJyaWRlIGV4dHJhXHJcbiAgfTtcclxuXHJcbiAgbGVhZHMuc2V0KGNsZWFuLCBsZWFkKTtcclxuICBzY2hlZHVsZVNhdmUoKTtcclxuICByZXR1cm4geyBleGlzdGluZzogZmFsc2UsIGxlYWQgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldExlYWQocGhvbmUpIHtcclxuICByZXR1cm4gbGVhZHMuZ2V0KHBob25lLnJlcGxhY2UoL1xcRC9nLCAnJykpIHx8IG51bGw7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVMZWFkKHBob25lLCB1cGRhdGVzKSB7XHJcbiAgY29uc3QgY2xlYW4gPSBwaG9uZS5yZXBsYWNlKC9cXEQvZywgJycpO1xyXG4gIGNvbnN0IGxlYWQgPSBsZWFkcy5nZXQoY2xlYW4pO1xyXG4gIGlmICghbGVhZCkgcmV0dXJuIG51bGw7XHJcbiAgY29uc3QgdXBkYXRlZCA9IHsgLi4ubGVhZCwgLi4udXBkYXRlcywgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfTtcclxuICBsZWFkcy5zZXQoY2xlYW4sIHVwZGF0ZWQpO1xyXG4gIHNjaGVkdWxlU2F2ZSgpO1xyXG4gIHJldHVybiB1cGRhdGVkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsTGVhZHMoKSB7XHJcbiAgcmV0dXJuIFsuLi5sZWFkcy52YWx1ZXMoKV07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMZWFkc0J5U2NvcmUoc2NvcmUpIHtcclxuICByZXR1cm4gWy4uLmxlYWRzLnZhbHVlcygpXS5maWx0ZXIobCA9PiBsLnNjb3JlID09PSBzY29yZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVMZWFkcygpIHtcclxuICByZXR1cm4gWy4uLmxlYWRzLnZhbHVlcygpXS5maWx0ZXIobCA9PiAhbC5kbmQgJiYgbC5zdGF0dXMgIT09ICdjb252ZXJ0ZWQnKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1hcmtETkQocGhvbmUpIHtcclxuICByZXR1cm4gdXBkYXRlTGVhZChwaG9uZSwgeyBkbmQ6IHRydWUsIHN0YXR1czogJ2RuZCcgfSk7XHJcbn1cclxuXHJcbi8qKiBTY29yZSBhIGxlYWQgYmFzZWQgb24gYWN0aXZpdHkgKyBsb2NhdGlvbiArIHNvdXJjZSAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmVjYWxjdWxhdGVTY29yZShwaG9uZSkge1xyXG4gIGNvbnN0IGxlYWQgPSBnZXRMZWFkKHBob25lKTtcclxuICBpZiAoIWxlYWQpIHJldHVybiBudWxsO1xyXG4gIGNvbnN0IHNjb3JlID0gY2FsY3VsYXRlU21hcnRTY29yZShsZWFkKTtcclxuICByZXR1cm4gdXBkYXRlTGVhZChwaG9uZSwgeyBzY29yZSB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFN0YXRzKCkge1xyXG4gIGNvbnN0IGFsbCA9IGdldEFsbExlYWRzKCk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHRvdGFsOiBhbGwubGVuZ3RoLFxyXG4gICAgY29sZDogYWxsLmZpbHRlcihsID0+IGwuc2NvcmUgPT09ICdDT0xEJykubGVuZ3RoLFxyXG4gICAgd2FybTogYWxsLmZpbHRlcihsID0+IGwuc2NvcmUgPT09ICdXQVJNJykubGVuZ3RoLFxyXG4gICAgaG90OiBhbGwuZmlsdGVyKGwgPT4gbC5zY29yZSA9PT0gJ0hPVCcpLmxlbmd0aCxcclxuICAgIHZlcnlIb3Q6IGFsbC5maWx0ZXIobCA9PiBsLnNjb3JlID09PSAnVkVSWV9IT1QnKS5sZW5ndGgsXHJcbiAgICBkbmQ6IGFsbC5maWx0ZXIobCA9PiBsLmRuZCkubGVuZ3RoLFxyXG4gICAgYXBwSW5zdGFsbGVkOiBhbGwuZmlsdGVyKGwgPT4gbC5hcHBJbnN0YWxsZWQpLmxlbmd0aCxcclxuICAgIG1lZXRpbmdzOiBhbGwuZmlsdGVyKGwgPT4gbC5tZWV0aW5nQm9va2VkKS5sZW5ndGgsXHJcbiAgfTtcclxufVxyXG5cclxuLyoqIFNvdXJjZS13aXNlIGFuYWx5dGljcyBmb3IgUk9JIHRyYWNraW5nICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRTb3VyY2VBbmFseXRpY3MoKSB7XHJcbiAgY29uc3QgYWxsID0gZ2V0QWxsTGVhZHMoKTtcclxuICBjb25zdCBzb3VyY2VzID0ge307XHJcbiAgZm9yIChjb25zdCBsZWFkIG9mIGFsbCkge1xyXG4gICAgY29uc3Qgc3JjID0gbGVhZC5zb3VyY2UgfHwgJ3Vua25vd24nO1xyXG4gICAgaWYgKCFzb3VyY2VzW3NyY10pIHNvdXJjZXNbc3JjXSA9IHsgc291cmNlOiBzcmMsIHRvdGFsOiAwLCBob3Q6IDAsIHZlcnlIb3Q6IDAsIGNvbnZlcnRlZDogMCwgcmV2ZW51ZTogMCwgbWVldGluZ3M6IDAgfTtcclxuICAgIHNvdXJjZXNbc3JjXS50b3RhbCsrO1xyXG4gICAgaWYgKGxlYWQuc2NvcmUgPT09ICdIT1QnKSBzb3VyY2VzW3NyY10uaG90Kys7XHJcbiAgICBpZiAobGVhZC5zY29yZSA9PT0gJ1ZFUllfSE9UJykgeyBzb3VyY2VzW3NyY10udmVyeUhvdCsrOyBzb3VyY2VzW3NyY10uaG90Kys7IH1cclxuICAgIGlmIChsZWFkLmNvbnZlcnNpb25TdGF0dXMgPT09ICdjb252ZXJ0ZWQnKSB7IHNvdXJjZXNbc3JjXS5jb252ZXJ0ZWQrKzsgc291cmNlc1tzcmNdLnJldmVudWUgKz0gbGVhZC5yZXZlbnVlIHx8IDA7IH1cclxuICAgIGlmIChsZWFkLm1lZXRpbmdCb29rZWQpIHNvdXJjZXNbc3JjXS5tZWV0aW5ncysrO1xyXG4gIH1cclxuICByZXR1cm4gT2JqZWN0LnZhbHVlcyhzb3VyY2VzKVxyXG4gICAgLm1hcChzID0+ICh7XHJcbiAgICAgIC4uLnMsXHJcbiAgICAgIGNvbnZlcnNpb25SYXRlOiBzLnRvdGFsID4gMCA/IE1hdGgucm91bmQoKHMuY29udmVydGVkIC8gcy50b3RhbCkgKiAxMDApIDogMCxcclxuICAgICAgaG90UmF0ZTogcy50b3RhbCA+IDAgPyBNYXRoLnJvdW5kKCgocy5ob3QpIC8gcy50b3RhbCkgKiAxMDApIDogMCxcclxuICAgIH0pKVxyXG4gICAgLnNvcnQoKGEsIGIpID0+IGIuaG90IC0gYS5ob3QpO1xyXG59XHJcblxyXG4vKiogTG9jYXRpb24td2lzZSBhbmFseXRpY3MgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2F0aW9uQW5hbHl0aWNzKCkge1xyXG4gIGNvbnN0IGFsbCA9IGdldEFsbExlYWRzKCk7XHJcbiAgY29uc3QgbG9jID0geyBISUdIOiB7IHRvdGFsOiAwLCBob3Q6IDAsIG1lZXRpbmdzOiAwIH0sIE1FRElVTTogeyB0b3RhbDogMCwgaG90OiAwLCBtZWV0aW5nczogMCB9LCBMT1c6IHsgdG90YWw6IDAsIGhvdDogMCwgbWVldGluZ3M6IDAgfSwgVU5LTk9XTjogeyB0b3RhbDogMCwgaG90OiAwLCBtZWV0aW5nczogMCB9IH07XHJcbiAgZm9yIChjb25zdCBsZWFkIG9mIGFsbCkge1xyXG4gICAgY29uc3QgcCA9IGxlYWQubG9jYXRpb25Qcmlvcml0eSB8fCAnVU5LTk9XTic7XHJcbiAgICBpZiAoIWxvY1twXSkgY29udGludWU7XHJcbiAgICBsb2NbcF0udG90YWwrKztcclxuICAgIGlmIChsZWFkLnNjb3JlID09PSAnSE9UJyB8fCBsZWFkLnNjb3JlID09PSAnVkVSWV9IT1QnKSBsb2NbcF0uaG90Kys7XHJcbiAgICBpZiAobGVhZC5tZWV0aW5nQm9va2VkKSBsb2NbcF0ubWVldGluZ3MrKztcclxuICB9XHJcbiAgcmV0dXJuIGxvYztcclxufVxyXG5cclxuLyoqIFByaW9yaXR5IGxlYWRzIFx1MjAxNCBuZWFyICsgaG90IGZvciBpbW1lZGlhdGUgYWN0aW9uICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmlvcml0eUxlYWRzKGxpbWl0ID0gMTApIHtcclxuICBjb25zdCBhbGwgPSBnZXRBbGxMZWFkcygpO1xyXG4gIHJldHVybiBhbGxcclxuICAgIC5maWx0ZXIobCA9PiAhbC5kbmQgJiYgKGwuc2NvcmUgPT09ICdIT1QnIHx8IGwuc2NvcmUgPT09ICdWRVJZX0hPVCcpKVxyXG4gICAgLnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgY29uc3QgbG9jU2NvcmUgPSB7IEhJR0g6IDMsIE1FRElVTTogMiwgTE9XOiAxLCBVTktOT1dOOiAwIH07XHJcbiAgICAgIGNvbnN0IHNjb3JlU2NvcmUgPSB7IFZFUllfSE9UOiA0LCBIT1Q6IDMsIFdBUk06IDIsIENPTEQ6IDEgfTtcclxuICAgICAgcmV0dXJuIChsb2NTY29yZVtiLmxvY2F0aW9uUHJpb3JpdHldICsgc2NvcmVTY29yZVtiLnNjb3JlXSkgLSAobG9jU2NvcmVbYS5sb2NhdGlvblByaW9yaXR5XSArIHNjb3JlU2NvcmVbYS5zY29yZV0pO1xyXG4gICAgfSlcclxuICAgIC5zbGljZSgwLCBsaW1pdClcclxuICAgIC5tYXAobCA9PiAoeyBpZDogbC5pZCwgbmFtZTogbC5uYW1lLCBwaG9uZTogbC5waG9uZS5zbGljZSgwLCAtNCkgKyAnWFhYWCcsIHNjb3JlOiBsLnNjb3JlLCBsb2NhdGlvblByaW9yaXR5OiBsLmxvY2F0aW9uUHJpb3JpdHksIGNpdHk6IGwuY2l0eSwgc3RhdGU6IGwuc3RhdGUsIHNvdXJjZTogbC5zb3VyY2UsIG1lZXRpbmdCb29rZWQ6IGwubWVldGluZ0Jvb2tlZCwgZmVhdHVyZXM6IGwuZmVhdHVyZXMgfSkpO1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcU2FpIFJvbG90ZWNoXFxcXE5ldyBmb2xkZXJcXFxcY2xvdWQtY29kZS1leHRlbnNpb25cXFxcY3JtLTJcXFxcc2VydmVyXFxcXHNlcnZpY2VzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTYWkgUm9sb3RlY2hcXFxcTmV3IGZvbGRlclxcXFxjbG91ZC1jb2RlLWV4dGVuc2lvblxcXFxjcm0tMlxcXFxzZXJ2ZXJcXFxcc2VydmljZXNcXFxccXVldWVTZXJ2aWNlLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9TYWklMjBSb2xvdGVjaC9OZXclMjBmb2xkZXIvY2xvdWQtY29kZS1leHRlbnNpb24vY3JtLTIvc2VydmVyL3NlcnZpY2VzL3F1ZXVlU2VydmljZS5qc1wiOy8qKlxyXG4gKiBRdWV1ZSBTZXJ2aWNlIFx1MjAxNCBJbi1tZW1vcnkgam9iIHF1ZXVlIHdpdGggcmV0cnkgbG9naWNcclxuICogSGFyIGxlYWQga2EgbWVzc2FnZSByZWxpYWJseSBkZWxpdmVyIGhvdGEgaGFpIFx1MjAxNCBubyBkYXRhIGxvc3NcclxuICovXHJcblxyXG5jb25zdCBxdWV1ZSA9IFtdOyAgICAgICAgICAgLy8gcGVuZGluZyBqb2JzXHJcbmNvbnN0IHByb2Nlc3NpbmcgPSBuZXcgU2V0KCk7IC8vIGpvYiBJRHMgY3VycmVudGx5IHJ1bm5pbmdcclxubGV0IHdvcmtlclJ1bm5pbmcgPSBmYWxzZTtcclxuXHJcbmNvbnN0IFJFVFJZX0RFTEFZUyA9IFs2MCwgMzAwLCA5MDAsIDM2MDAsIDE0NDAwXTsgLy8gc2Vjb25kczogMW0sIDVtLCAxNW0sIDFoLCA0aFxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGVucXVldWUodHlwZSwgcGF5bG9hZCwgb3B0aW9ucyA9IHt9KSB7XHJcbiAgY29uc3Qgam9iID0ge1xyXG4gICAgaWQ6IGBqb2JfJHtEYXRlLm5vdygpfV8ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDcpfWAsXHJcbiAgICB0eXBlLFxyXG4gICAgcGF5bG9hZCxcclxuICAgIHJldHJ5Q291bnQ6IDAsXHJcbiAgICBtYXhSZXRyaWVzOiBvcHRpb25zLm1heFJldHJpZXMgPz8gNSxcclxuICAgIHJ1bkF0OiBEYXRlLm5vdygpICsgKG9wdGlvbnMuZGVsYXlNcyB8fCAwKSxcclxuICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gIH07XHJcbiAgcXVldWUucHVzaChqb2IpO1xyXG4gIGNvbnNvbGUubG9nKGBcdUQ4M0RcdURDRTUgUXVldWVkIFske3R5cGV9XSBmb3IgJHtwYXlsb2FkLnBob25lIHx8IHBheWxvYWQubGVhZElkIHx8ICdzeXN0ZW0nfSAoJHtxdWV1ZS5sZW5ndGh9IGluIHF1ZXVlKWApO1xyXG4gIGlmICghd29ya2VyUnVubmluZykgc3RhcnRXb3JrZXIoKTtcclxuICByZXR1cm4gam9iO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UXVldWVTdGF0cygpIHtcclxuICByZXR1cm4geyBxdWV1ZWQ6IHF1ZXVlLmxlbmd0aCwgcHJvY2Vzc2luZzogcHJvY2Vzc2luZy5zaXplIH07XHJcbn1cclxuXHJcbi8qIFx1MjUwMFx1MjUwMCBXb3JrZXIgTG9vcCBcdTI1MDBcdTI1MDAgKi9cclxuY29uc3QgaGFuZGxlcnMgPSB7fTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckhhbmRsZXIodHlwZSwgZm4pIHtcclxuICBoYW5kbGVyc1t0eXBlXSA9IGZuO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzdGFydFdvcmtlcigpIHtcclxuICBpZiAod29ya2VyUnVubmluZykgcmV0dXJuO1xyXG4gIHdvcmtlclJ1bm5pbmcgPSB0cnVlO1xyXG5cclxuICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcclxuICAgIGNvbnN0IHJlYWR5ID0gcXVldWUuZmlsdGVyKGogPT4gai5ydW5BdCA8PSBub3cgJiYgIXByb2Nlc3NpbmcuaGFzKGouaWQpKTtcclxuXHJcbiAgICBpZiAocmVhZHkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIGF3YWl0IHNsZWVwKDUwMDApO1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGNvbnN0IGpvYiBvZiByZWFkeSkge1xyXG4gICAgICBwcm9jZXNzaW5nLmFkZChqb2IuaWQpO1xyXG4gICAgICBydW5Kb2Ioam9iKS5maW5hbGx5KCgpID0+IHByb2Nlc3NpbmcuZGVsZXRlKGpvYi5pZCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGF3YWl0IHNsZWVwKDIwMDApO1xyXG4gIH1cclxufVxyXG5cclxuLy8gVmFsaWQgam9iIHR5cGVzIFx1MjAxNCBvbmx5IHJlZ2lzdGVyZWQgc3RyaW5ncyBhbGxvd2VkIChwcmV2ZW50cyBwcm90b3R5cGUgaW5qZWN0aW9uKVxyXG5jb25zdCBBTExPV0VEX0pPQl9UWVBFUyA9IG5ldyBTZXQoW1xyXG4gICdTRU5EX1dFTENPTUUnLCAnU0VORF9GT0xMT1dVUCcsICdTRU5EX0FJX1JFUExZJyxcclxuICAnU0VORF9RVU9UQVRJT05fRk9MTE9XVVAnLCAnQURNSU5fQUxFUlQnLCAnU0VORF9QVVNIJyxcclxuICAnU0VORF9NRUVUSU5HX1NMT1RTJywgJ1NNQVJUX05PVElGWScsICdTTUFSVF9GT0xMT1dVUCcsICdUQVNLX0ZPTExPV1VQJyxcclxuXSk7XHJcblxyXG5hc3luYyBmdW5jdGlvbiBydW5Kb2Ioam9iKSB7XHJcbiAgY29uc3QgaWR4ID0gcXVldWUuaW5kZXhPZihqb2IpO1xyXG4gIGlmIChpZHggPT09IC0xKSByZXR1cm47IC8vIGFscmVhZHkgcmVtb3ZlZFxyXG5cclxuICAvLyBWYWxpZGF0ZSBqb2IgdHlwZSBpcyBhIGtub3duIHN0cmluZyAocHJldmVudHMgcHJvdG90eXBlIHBvbGx1dGlvbilcclxuICBpZiAodHlwZW9mIGpvYi50eXBlICE9PSAnc3RyaW5nJyB8fCAhQUxMT1dFRF9KT0JfVFlQRVMuaGFzKGpvYi50eXBlKSkge1xyXG4gICAgY29uc29sZS53YXJuKGBcdTI2QTBcdUZFMEYgIFJlamVjdGVkIHVua25vd24gam9iIHR5cGU6ICR7U3RyaW5nKGpvYi50eXBlKS5zbGljZSgwLCAzMCl9YCk7XHJcbiAgICBxdWV1ZS5zcGxpY2UoaWR4LCAxKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IGhhbmRsZXIgPSBoYW5kbGVyc1tqb2IudHlwZV07XHJcbiAgaWYgKCFoYW5kbGVyKSB7XHJcbiAgICBjb25zb2xlLndhcm4oYFx1MjZBMFx1RkUwRiAgTm8gaGFuZGxlciBmb3Igam9iIHR5cGU6ICR7am9iLnR5cGV9YCk7XHJcbiAgICBxdWV1ZS5zcGxpY2UoaWR4LCAxKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCB3aXRoVGltZW91dChoYW5kbGVyKGpvYi5wYXlsb2FkKSwgMTAwMDApO1xyXG4gICAgcXVldWUuc3BsaWNlKHF1ZXVlLmluZGV4T2Yoam9iKSwgMSk7XHJcbiAgICBjb25zb2xlLmxvZyhgXHUyNzA1IEpvYiBkb25lIFske2pvYi50eXBlfV0gaWQ9JHtqb2IuaWR9YCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBqb2IucmV0cnlDb3VudCsrO1xyXG4gICAgY29uc29sZS5lcnJvcihgXHUyNzRDIEpvYiBmYWlsZWQgWyR7am9iLnR5cGV9XSBhdHRlbXB0ICR7am9iLnJldHJ5Q291bnR9LyR7am9iLm1heFJldHJpZXN9OiAke2Vyci5tZXNzYWdlfWApO1xyXG5cclxuICAgIGlmIChqb2IucmV0cnlDb3VudCA+PSBqb2IubWF4UmV0cmllcykge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGBcdUQ4M0RcdURFQUIgTWF4IHJldHJpZXMgcmVhY2hlZCwgZHJvcHBpbmcgam9iOiAke2pvYi5pZH1gKTtcclxuICAgICAgcXVldWUuc3BsaWNlKHF1ZXVlLmluZGV4T2Yoam9iKSwgMSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBkZWxheVNlYyA9IFJFVFJZX0RFTEFZU1tqb2IucmV0cnlDb3VudCAtIDFdIHx8IDE0NDAwO1xyXG4gICAgICBqb2IucnVuQXQgPSBEYXRlLm5vdygpICsgZGVsYXlTZWMgKiAxMDAwO1xyXG4gICAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVERDA0IFJldHJ5ICR7am9iLnJldHJ5Q291bnR9IGZvciBqb2IgJHtqb2IuaWR9IGluICR7ZGVsYXlTZWN9c2ApO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gd2l0aFRpbWVvdXQocHJvbWlzZSwgbXMpIHtcclxuICByZXR1cm4gUHJvbWlzZS5yYWNlKFtcclxuICAgIHByb21pc2UsXHJcbiAgICBuZXcgUHJvbWlzZSgoXywgcmVqKSA9PiBzZXRUaW1lb3V0KCgpID0+IHJlaihuZXcgRXJyb3IoYFRpbWVvdXQgYWZ0ZXIgJHttc31tc2ApKSwgbXMpKSxcclxuICBdKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2xlZXAobXMpIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIG1zKSk7XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTYWkgUm9sb3RlY2hcXFxcTmV3IGZvbGRlclxcXFxjbG91ZC1jb2RlLWV4dGVuc2lvblxcXFxjcm0tMlxcXFxzZXJ2ZXJcXFxccm91dGVzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTYWkgUm9sb3RlY2hcXFxcTmV3IGZvbGRlclxcXFxjbG91ZC1jb2RlLWV4dGVuc2lvblxcXFxjcm0tMlxcXFxzZXJ2ZXJcXFxccm91dGVzXFxcXHByb2R1Y3RzLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9TYWklMjBSb2xvdGVjaC9OZXclMjBmb2xkZXIvY2xvdWQtY29kZS1leHRlbnNpb24vY3JtLTIvc2VydmVyL3JvdXRlcy9wcm9kdWN0cy5qc1wiOy8qKlxyXG4gKiBQcm9kdWN0IENhdGFsb2cgQ1JVRCArIFBob3RvL1ZpZGVvIFVwbG9hZFxyXG4gKiBSb3V0ZXM6IC9hcGkvcHJvZHVjdHMvKlxyXG4gKi9cclxuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XHJcbmltcG9ydCBtdWx0ZXIgZnJvbSAnbXVsdGVyJztcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnO1xyXG5cclxuY29uc3QgX19kaXJuYW1lID0gcGF0aC5kaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSk7XHJcbmNvbnN0IHJvdXRlciA9IGV4cHJlc3MuUm91dGVyKCk7XHJcblxyXG4vKiBcdTI1MDBcdTI1MDAgRmlsZSBwYXRocyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgKi9cclxuY29uc3QgREFUQV9GSUxFICAgID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ2RhdGEnLCAncHJvZHVjdHMuanNvbicpO1xyXG5jb25zdCBVUExPQURfRElSICAgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAncHVibGljJywgJ3VwbG9hZHMnLCAncHJvZHVjdHMnKTtcclxuXHJcbi8qIFx1MjUwMFx1MjUwMCBFbnN1cmUgZGlyZWN0b3JpZXMgZXhpc3QgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXHJcbmlmICghZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAnZGF0YScpKSkge1xyXG4gIGZzLm1rZGlyU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAnZGF0YScpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxufVxyXG5pZiAoIWZzLmV4aXN0c1N5bmMoVVBMT0FEX0RJUikpIHtcclxuICBmcy5ta2RpclN5bmMoVVBMT0FEX0RJUiwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbn1cclxuXHJcbi8qIFx1MjUwMFx1MjUwMCBNdWx0ZXIgXHUyMDE0IGRpc2sgc3RvcmFnZSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgKi9cclxuY29uc3Qgc3RvcmFnZSA9IG11bHRlci5kaXNrU3RvcmFnZSh7XHJcbiAgZGVzdGluYXRpb246IChyZXEsIGZpbGUsIGNiKSA9PiBjYihudWxsLCBVUExPQURfRElSKSxcclxuICBmaWxlbmFtZTogKHJlcSwgZmlsZSwgY2IpID0+IHtcclxuICAgIGNvbnN0IGV4dCAgPSBwYXRoLmV4dG5hbWUoZmlsZS5vcmlnaW5hbG5hbWUpLnRvTG93ZXJDYXNlKCkgfHwgJy5qcGcnO1xyXG4gICAgY29uc3QgbmFtZSA9IGBwcm9kXyR7RGF0ZS5ub3coKX1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA2KX0ke2V4dH1gO1xyXG4gICAgY2IobnVsbCwgbmFtZSk7XHJcbiAgfSxcclxufSk7XHJcbmNvbnN0IHVwbG9hZCA9IG11bHRlcih7XHJcbiAgc3RvcmFnZSxcclxuICBsaW1pdHM6IHsgZmlsZVNpemU6IDIwICogMTAyNCAqIDEwMjQgfSwgLy8gMjBNQlxyXG4gIGZpbGVGaWx0ZXI6IChyZXEsIGZpbGUsIGNiKSA9PiB7XHJcbiAgICBjb25zdCBhbGxvd2VkID0gL2ltYWdlXFwvKGpwZWd8anBnfHBuZ3x3ZWJwfGdpZil8dmlkZW9cXC8obXA0fG1vdnxhdml8d2VibSkvO1xyXG4gICAgY2IobnVsbCwgYWxsb3dlZC50ZXN0KGZpbGUubWltZXR5cGUpKTtcclxuICB9LFxyXG59KTtcclxuXHJcbi8qIFx1MjUwMFx1MjUwMCBQcm9kdWN0IGhlbHBlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXHJcbmZ1bmN0aW9uIHJlYWRQcm9kdWN0cygpIHtcclxuICB0cnkge1xyXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKERBVEFfRklMRSkpIHJldHVybiBbXTtcclxuICAgIHJldHVybiBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhEQVRBX0ZJTEUsICd1dGY4JykpO1xyXG4gIH0gY2F0Y2ggeyByZXR1cm4gW107IH1cclxufVxyXG5cclxuZnVuY3Rpb24gd3JpdGVQcm9kdWN0cyhwcm9kdWN0cykge1xyXG4gIGZzLndyaXRlRmlsZVN5bmMoREFUQV9GSUxFLCBKU09OLnN0cmluZ2lmeShwcm9kdWN0cywgbnVsbCwgMikpO1xyXG59XHJcblxyXG4vKiBcdTI1MDBcdTI1MDAgR0VUIC9hcGkvcHJvZHVjdHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXHJcbnJvdXRlci5nZXQoJy8nLCAocmVxLCByZXMpID0+IHtcclxuICBjb25zdCBwcm9kdWN0cyA9IHJlYWRQcm9kdWN0cygpO1xyXG4gIGNvbnN0IHsgY2F0ZWdvcnksIGZlYXR1cmVkLCBhdmFpbGFibGUgfSA9IHJlcS5xdWVyeTtcclxuICBsZXQgZmlsdGVyZWQgPSBwcm9kdWN0cztcclxuICBpZiAoY2F0ZWdvcnkpICBmaWx0ZXJlZCA9IGZpbHRlcmVkLmZpbHRlcihwID0+IHAuY2F0ZWdvcnkgPT09IGNhdGVnb3J5KTtcclxuICBpZiAoZmVhdHVyZWQgPT09ICd0cnVlJykgZmlsdGVyZWQgPSBmaWx0ZXJlZC5maWx0ZXIocCA9PiBwLmZlYXR1cmVkKTtcclxuICBpZiAoYXZhaWxhYmxlID09PSAndHJ1ZScpIGZpbHRlcmVkID0gZmlsdGVyZWQuZmlsdGVyKHAgPT4gcC5hdmFpbGFibGUgIT09IGZhbHNlKTtcclxuICByZXMuanNvbih7IHN1Y2Nlc3M6IHRydWUsIHByb2R1Y3RzOiBmaWx0ZXJlZCwgdG90YWw6IGZpbHRlcmVkLmxlbmd0aCB9KTtcclxufSk7XHJcblxyXG4vKiBcdTI1MDBcdTI1MDAgR0VUIC9hcGkvcHJvZHVjdHMvY2F0ZWdvcmllcy9saXN0IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xyXG4vKiBOT1RFOiBNdXN0IGJlIGJlZm9yZSAvOmlkIHRvIGF2b2lkIEV4cHJlc3MgbWF0Y2hpbmcgXCJjYXRlZ29yaWVzXCIgYXMgYW4gSUQgKi9cclxucm91dGVyLmdldCgnL2NhdGVnb3JpZXMvbGlzdCcsIChyZXEsIHJlcykgPT4ge1xyXG4gIGNvbnN0IHByb2R1Y3RzID0gcmVhZFByb2R1Y3RzKCk7XHJcbiAgY29uc3QgY2F0ZWdvcmllcyA9IFsuLi5uZXcgU2V0KHByb2R1Y3RzLm1hcChwID0+IHAuY2F0ZWdvcnkpKV07XHJcbiAgcmVzLmpzb24oeyBzdWNjZXNzOiB0cnVlLCBjYXRlZ29yaWVzIH0pO1xyXG59KTtcclxuXHJcbi8qIFx1MjUwMFx1MjUwMCBQT1NUIC9hcGkvcHJvZHVjdHMvYWktY29tbWFuZCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgKi9cclxuLyogTk9URTogTXVzdCBiZSBiZWZvcmUgLzppZCB0byBhdm9pZCBFeHByZXNzIG1hdGNoaW5nIFwiYWktY29tbWFuZFwiIGFzIGFuIElEICovXHJcbnJvdXRlci5wb3N0KCcvYWktY29tbWFuZCcsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBHRU1JTklfS0VZID0gcHJvY2Vzcy5lbnYuQUlfSU5URUdSQVRJT05TX0dFTUlOSV9BUElfS0VZO1xyXG4gICAgaWYgKCFHRU1JTklfS0VZKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMykuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0dlbWluaSBBUEkga2V5IG5vdCBjb25maWd1cmVkLicgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyBjb21tYW5kLCBoaXN0b3J5ID0gW10gfSA9IHJlcS5ib2R5O1xyXG4gICAgaWYgKCFjb21tYW5kPy50cmltKCkpIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ2NvbW1hbmQgcmVxdWlyZWQnIH0pO1xyXG5cclxuICAgIGNvbnN0IHByb2R1Y3RzID0gcmVhZFByb2R1Y3RzKCk7XHJcbiAgICBjb25zdCBwcm9kdWN0U3VtbWFyeSA9IHByb2R1Y3RzLm1hcChwID0+XHJcbiAgICAgIGAtIElEOiAke3AuaWR9IHwgTmFtZTogXCIke3AubmFtZX1cIiB8IENhdGVnb3J5OiBcIiR7cC5jYXRlZ29yeX1cIiB8IFByaWNlOiBcdTIwQjkke3AucHJpY2V9IHwgQXZhaWxhYmxlOiAke3AuYXZhaWxhYmxlfSB8IEZlYXR1cmVkOiAke3AuZmVhdHVyZWR9YFxyXG4gICAgKS5qb2luKCdcXG4nKTtcclxuXHJcbiAgICBjb25zdCBzeXN0ZW1Qcm9tcHQgPSBgVHUgU0FJIFJvbG9UZWNoIENSTSBrYSBBSSBQcm9kdWN0IE1hbmFnZXIgaGFpLiBTQUkgUm9sb1R0ZWNoIERlbGhpIG1laW4gUm9sbCBGb3JtaW5nIE1hY2hpbmUgbWFudWZhY3R1cmVyIGhhaS5cclxuXHJcbkNVUlJFTlQgUFJPRFVDVFMgSU4gREFUQUJBU0U6XHJcbiR7cHJvZHVjdFN1bW1hcnkgfHwgJyhrb2kgcHJvZHVjdCBuYWhpIGhhaSBhYmhpKSd9XHJcblxyXG5WQUxJRCBDQVRFR09SSUVTOiBTaHV0dGVyIFBsYW50LCBGYWxzZSBDZWlsaW5nLCBQaXBlIE1pbGwsIFB1cmxpbiBNYWNoaW5lLCBTdHVkIFRyYWNrLCBDdXN0b21cclxuXHJcbkFkbWluIGtpIG5hdHVyYWwgbGFuZ3VhZ2UgY29tbWFuZCBzdW4gYXVyIFNJUkYgZWsgdmFsaWQgSlNPTiBvYmplY3QgcmV0dXJuIGthci4gS29pIGJoaSBleHRyYSB0ZXh0LCBleHBsYW5hdGlvbiB5YSBtYXJrZG93biBuYWhpIFx1MjAxNCBzaXJmIHJhdyBKU09OLlxyXG5cclxuSlNPTiBmb3JtYXQ6XHJcbntcclxuICBcImFjdGlvblwiOiBcImNyZWF0ZVwiIHwgXCJ1cGRhdGVcIiB8IFwiZGVsZXRlXCIgfCBcIm5vbmVcIixcclxuICBcIm1lc3NhZ2VcIjogXCI8SGluZ2xpc2ggbWVpbiBreWEga2l5YSB5YSBreWEgc2FtamhhIFx1MjAxNCBlayBsaW5lPlwiLFxyXG4gIFwiZGF0YVwiOiB7IG5hbWUsIGNhdGVnb3J5LCBkZXNjcmlwdGlvbiwgcHJpY2UsIHVuaXQsIHNwZWNzLCBsZWFkVGltZSwgYXZhaWxhYmxlLCBmZWF0dXJlZCwgdGFncyB9LFxyXG4gIFwiaWRcIjogXCJwcm9kX3h4eFwiLFxyXG4gIFwiY2hhbmdlc1wiOiB7IGZpZWxkOiB2YWx1ZSB9XHJcbn1cclxuXHJcblJ1bGVzOlxyXG4tIGNyZWF0ZTogbmF5YSBwcm9kdWN0LiBkYXRhIG1laW4gc2FiIGZpZWxkcyBiaGFyby4gcHJpY2UgPSBudW1iZXIgKDM1MDAwMCBmb3IgXHUyMEI5My41IGxhYykuIGF2YWlsYWJsZT10cnVlIGJ5IGRlZmF1bHQuXHJcbi0gdXBkYXRlOiBleGlzdGluZyBwcm9kdWN0IHVwZGF0ZS4gaWQgemFyb29yaS4gY2hhbmdlcyBtZWluIHNpcmYgY2hhbmdlZCBmaWVsZHMuXHJcbi0gZGVsZXRlOiBwcm9kdWN0IGRlbGV0ZS4gaWQgemFyb29yaS5cclxuLSBub25lOiBjb21tYW5kIHVuY2xlYXIgaGFpIHlhIGluZm8gY2hhaGl5ZS4gbWVzc2FnZSBtZWluIHNhbWpoYW8uXHJcbi0gUHJvZHVjdCBuYW1lIHNlIG1hdGNoIGthcm8gKGNhc2UtaW5zZW5zaXRpdmUsIHBhcnRpYWwgb2spIFx1MjAxNCBwaGlyIHVza2EgSUQgdXNlIGthcm8uXHJcbi0gXCJsYWNcIi9cImxha2hcIiBpbiBwcmljZSBcdTIxOTIgbXVsdGlwbHkgYnkgMTAwMDAwLiBcImtcIi9cIktcIiBcdTIxOTIgbXVsdGlwbHkgYnkgMTAwMC5cclxuLSBDYXRlZ29yeSBjaGFuZ2UgPSB1cGRhdGUgd2l0aCBjaGFuZ2VzOnsgY2F0ZWdvcnk6IFwiTmV3IENhdGVnb3J5XCIgfS5cclxuLSBBZ2FyIGNvbW1hbmQgbWVpbiBwcm9kdWN0IGthIG5hYW0gYW1iaWd1b3VzIGhhaSwgYWN0aW9uIFwibm9uZVwiIGF1ciBjbGFyaWZ5IGthcm8uYDtcclxuXHJcbiAgICBjb25zdCB7IEdvb2dsZUdlbkFJIH0gPSBhd2FpdCBpbXBvcnQoJ0Bnb29nbGUvZ2VuYWknKTtcclxuICAgIGNvbnN0IGFpID0gbmV3IEdvb2dsZUdlbkFJKHsgYXBpS2V5OiBHRU1JTklfS0VZIH0pO1xyXG5cclxuICAgIGNvbnN0IGNvbnRlbnRzID0gW1xyXG4gICAgICAuLi5oaXN0b3J5Lm1hcChoID0+ICh7IHJvbGU6IGgucm9sZSwgcGFydHM6IFt7IHRleHQ6IGgudGV4dCB9XSB9KSksXHJcbiAgICAgIHsgcm9sZTogJ3VzZXInLCBwYXJ0czogW3sgdGV4dDogY29tbWFuZCB9XSB9LFxyXG4gICAgXTtcclxuXHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFpLm1vZGVscy5nZW5lcmF0ZUNvbnRlbnQoe1xyXG4gICAgICBtb2RlbDogJ2dlbWluaS0yLjUtZmxhc2gnLFxyXG4gICAgICBjb250ZW50cyxcclxuICAgICAgY29uZmlnOiB7IHN5c3RlbUluc3RydWN0aW9uOiBzeXN0ZW1Qcm9tcHQsIG1heE91dHB1dFRva2VuczogMTAyNCwgdGVtcGVyYXR1cmU6IDAuMSB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcmF3ID0gKHJlc3BvbnNlLnRleHQgfHwgJ3t9JykucmVwbGFjZSgvYGBganNvblxcbj8vZywgJycpLnJlcGxhY2UoL2BgYFxcbj8vZywgJycpLnRyaW0oKTtcclxuICAgIGNvbnN0IGpzb25NYXRjaCA9IHJhdy5tYXRjaCgvXFx7W1xcc1xcU10qXFx9Lyk7XHJcbiAgICBpZiAoIWpzb25NYXRjaCkgcmV0dXJuIHJlcy5qc29uKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnR2VtaW5pIG5lIHZhbGlkIEpTT04gbmFoaSBkaXlhJywgcmF3IH0pO1xyXG4gICAgY29uc3QgYWlSZXN1bHQgPSBKU09OLnBhcnNlKGpzb25NYXRjaFswXSk7XHJcbiAgICBjb25zdCB7IGFjdGlvbiwgbWVzc2FnZSwgZGF0YSwgaWQsIGNoYW5nZXMgfSA9IGFpUmVzdWx0O1xyXG5cclxuICAgIGxldCBleGVjdXRlZFByb2R1Y3QgPSBudWxsO1xyXG4gICAgbGV0IGV4ZWN1dGlvblJlc3VsdCA9ICdub25lJztcclxuXHJcbiAgICBpZiAoYWN0aW9uID09PSAnY3JlYXRlJyAmJiBkYXRhKSB7XHJcbiAgICAgIGNvbnN0IHByb2RzID0gcmVhZFByb2R1Y3RzKCk7XHJcbiAgICAgIGNvbnN0IG5ld1Byb2QgPSB7XHJcbiAgICAgICAgaWQ6IGBwcm9kXyR7RGF0ZS5ub3coKX1gLFxyXG4gICAgICAgIG5hbWU6IChkYXRhLm5hbWUgfHwgJ1VudGl0bGVkJykudHJpbSgpLFxyXG4gICAgICAgIGNhdGVnb3J5OiBkYXRhLmNhdGVnb3J5IHx8ICdDdXN0b20nLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBkYXRhLmRlc2NyaXB0aW9uIHx8ICcnLFxyXG4gICAgICAgIHByaWNlOiBwYXJzZUZsb2F0KGRhdGEucHJpY2UpIHx8IDAsXHJcbiAgICAgICAgdW5pdDogZGF0YS51bml0IHx8ICdTZXQnLFxyXG4gICAgICAgIHBob3RvczogW10sXHJcbiAgICAgICAgdmlkZW9Vcmw6IGRhdGEudmlkZW9VcmwgfHwgJycsXHJcbiAgICAgICAgc3BlY3M6IGRhdGEuc3BlY3MgfHwgJycsXHJcbiAgICAgICAgbGVhZFRpbWU6IGRhdGEubGVhZFRpbWUgfHwgJycsXHJcbiAgICAgICAgYXZhaWxhYmxlOiBkYXRhLmF2YWlsYWJsZSAhPT0gZmFsc2UsXHJcbiAgICAgICAgZmVhdHVyZWQ6ICEhZGF0YS5mZWF0dXJlZCxcclxuICAgICAgICB0YWdzOiBBcnJheS5pc0FycmF5KGRhdGEudGFncykgPyBkYXRhLnRhZ3MgOiBbXSxcclxuICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgfTtcclxuICAgICAgcHJvZHMucHVzaChuZXdQcm9kKTtcclxuICAgICAgd3JpdGVQcm9kdWN0cyhwcm9kcyk7XHJcbiAgICAgIGV4ZWN1dGVkUHJvZHVjdCA9IG5ld1Byb2Q7XHJcbiAgICAgIGV4ZWN1dGlvblJlc3VsdCA9ICdjcmVhdGVkJztcclxuXHJcbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ3VwZGF0ZScgJiYgaWQgJiYgY2hhbmdlcykge1xyXG4gICAgICBjb25zdCBwcm9kcyA9IHJlYWRQcm9kdWN0cygpO1xyXG4gICAgICBjb25zdCBpZHggPSBwcm9kcy5maW5kSW5kZXgocCA9PiBwLmlkID09PSBpZCk7XHJcbiAgICAgIGlmIChpZHggPT09IC0xKSByZXR1cm4gcmVzLmpzb24oeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBQcm9kdWN0IElEIFwiJHtpZH1cIiBuYWhpIG1pbGFgLCBhaU1lc3NhZ2U6IG1lc3NhZ2UgfSk7XHJcbiAgICAgIGlmIChjaGFuZ2VzLnByaWNlICE9PSB1bmRlZmluZWQpIGNoYW5nZXMucHJpY2UgPSBwYXJzZUZsb2F0KGNoYW5nZXMucHJpY2UpIHx8IDA7XHJcbiAgICAgIGlmIChjaGFuZ2VzLmF2YWlsYWJsZSAhPT0gdW5kZWZpbmVkKSBjaGFuZ2VzLmF2YWlsYWJsZSA9IGNoYW5nZXMuYXZhaWxhYmxlICE9PSBmYWxzZSAmJiBjaGFuZ2VzLmF2YWlsYWJsZSAhPT0gJ2ZhbHNlJztcclxuICAgICAgaWYgKGNoYW5nZXMuZmVhdHVyZWQgIT09IHVuZGVmaW5lZCkgY2hhbmdlcy5mZWF0dXJlZCA9IGNoYW5nZXMuZmVhdHVyZWQgPT09IHRydWUgfHwgY2hhbmdlcy5mZWF0dXJlZCA9PT0gJ3RydWUnO1xyXG4gICAgICBwcm9kc1tpZHhdID0geyAuLi5wcm9kc1tpZHhdLCAuLi5jaGFuZ2VzLCBpZDogcHJvZHNbaWR4XS5pZCwgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfTtcclxuICAgICAgd3JpdGVQcm9kdWN0cyhwcm9kcyk7XHJcbiAgICAgIGV4ZWN1dGVkUHJvZHVjdCA9IHByb2RzW2lkeF07XHJcbiAgICAgIGV4ZWN1dGlvblJlc3VsdCA9ICd1cGRhdGVkJztcclxuXHJcbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2RlbGV0ZScgJiYgaWQpIHtcclxuICAgICAgY29uc3QgcHJvZHMgPSByZWFkUHJvZHVjdHMoKTtcclxuICAgICAgY29uc3QgcHJvZCA9IHByb2RzLmZpbmQocCA9PiBwLmlkID09PSBpZCk7XHJcbiAgICAgIGlmICghcHJvZCkgcmV0dXJuIHJlcy5qc29uKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgUHJvZHVjdCBJRCBcIiR7aWR9XCIgbmFoaSBtaWxhYCwgYWlNZXNzYWdlOiBtZXNzYWdlIH0pO1xyXG4gICAgICAocHJvZC5waG90b3MgfHwgW10pLmZvckVhY2godXJsID0+IHtcclxuICAgICAgICBjb25zdCBmcCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICcuLicsICdwdWJsaWMnLCB1cmwucmVwbGFjZSgvXlxcLy8sICcnKSk7XHJcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZnApKSBmcy51bmxpbmtTeW5jKGZwKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHdyaXRlUHJvZHVjdHMocHJvZHMuZmlsdGVyKHAgPT4gcC5pZCAhPT0gaWQpKTtcclxuICAgICAgZXhlY3V0ZWRQcm9kdWN0ID0gcHJvZDtcclxuICAgICAgZXhlY3V0aW9uUmVzdWx0ID0gJ2RlbGV0ZWQnO1xyXG4gICAgfVxyXG5cclxuICAgIHJlcy5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgYWN0aW9uLFxyXG4gICAgICBleGVjdXRpb25SZXN1bHQsXHJcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UgfHwgJ0RvbmUnLFxyXG4gICAgICBwcm9kdWN0OiBleGVjdXRlZFByb2R1Y3QsXHJcbiAgICAgIHByb2R1Y3RzOiByZWFkUHJvZHVjdHMoKSxcclxuICAgIH0pO1xyXG5cclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdbQUktQ29tbWFuZF0nLCBlLm1lc3NhZ2UpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9KTtcclxuICB9XHJcbn0pO1xyXG5cclxuLyogXHUyNTAwXHUyNTAwIEdFVCAvYXBpL3Byb2R1Y3RzLzppZCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgKi9cclxucm91dGVyLmdldCgnLzppZCcsIChyZXEsIHJlcykgPT4ge1xyXG4gIGNvbnN0IHByb2R1Y3RzID0gcmVhZFByb2R1Y3RzKCk7XHJcbiAgY29uc3QgcHJvZHVjdCA9IHByb2R1Y3RzLmZpbmQocCA9PiBwLmlkID09PSByZXEucGFyYW1zLmlkKTtcclxuICBpZiAoIXByb2R1Y3QpIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1Byb2R1Y3Qgbm90IGZvdW5kJyB9KTtcclxuICByZXMuanNvbih7IHN1Y2Nlc3M6IHRydWUsIHByb2R1Y3QgfSk7XHJcbn0pO1xyXG5cclxuLyogXHUyNTAwXHUyNTAwIFBPU1QgL2FwaS9wcm9kdWN0cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgKi9cclxucm91dGVyLnBvc3QoJy8nLCAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBuYW1lLCBjYXRlZ29yeSwgZGVzY3JpcHRpb24sIHByaWNlLCB1bml0LCBzcGVjcywgbGVhZFRpbWUsIHZpZGVvVXJsLCB0YWdzLCBmZWF0dXJlZCwgYXZhaWxhYmxlIH0gPSByZXEuYm9keTtcclxuICAgIGlmICghbmFtZSB8fCAhY2F0ZWdvcnkpIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ25hbWUgYW5kIGNhdGVnb3J5IHJlcXVpcmVkJyB9KTtcclxuXHJcbiAgICBjb25zdCBwcm9kdWN0cyA9IHJlYWRQcm9kdWN0cygpO1xyXG4gICAgY29uc3QgcHJvZHVjdCA9IHtcclxuICAgICAgaWQ6IGBwcm9kXyR7RGF0ZS5ub3coKX1gLFxyXG4gICAgICBuYW1lOiBuYW1lLnRyaW0oKSxcclxuICAgICAgY2F0ZWdvcnk6IGNhdGVnb3J5LnRyaW0oKSxcclxuICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uPy50cmltKCkgfHwgJycsXHJcbiAgICAgIHByaWNlOiBwYXJzZUZsb2F0KHByaWNlKSB8fCAwLFxyXG4gICAgICB1bml0OiB1bml0IHx8ICdTZXQnLFxyXG4gICAgICBwaG90b3M6IFtdLFxyXG4gICAgICB2aWRlb1VybDogdmlkZW9Vcmw/LnRyaW0oKSB8fCAnJyxcclxuICAgICAgc3BlY3M6IHNwZWNzPy50cmltKCkgfHwgJycsXHJcbiAgICAgIGxlYWRUaW1lOiBsZWFkVGltZT8udHJpbSgpIHx8ICcnLFxyXG4gICAgICBhdmFpbGFibGU6IGF2YWlsYWJsZSAhPT0gZmFsc2UgJiYgYXZhaWxhYmxlICE9PSAnZmFsc2UnLFxyXG4gICAgICBmZWF0dXJlZDogZmVhdHVyZWQgPT09IHRydWUgfHwgZmVhdHVyZWQgPT09ICd0cnVlJyxcclxuICAgICAgdGFnczogQXJyYXkuaXNBcnJheSh0YWdzKSA/IHRhZ3MgOiAodGFncyA/IFt0YWdzXSA6IFtdKSxcclxuICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgfTtcclxuICAgIHByb2R1Y3RzLnB1c2gocHJvZHVjdCk7XHJcbiAgICB3cml0ZVByb2R1Y3RzKHByb2R1Y3RzKTtcclxuICAgIHJlcy5qc29uKHsgc3VjY2VzczogdHJ1ZSwgcHJvZHVjdCB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH0pO1xyXG4gIH1cclxufSk7XHJcblxyXG4vKiBcdTI1MDBcdTI1MDAgUFVUIC9hcGkvcHJvZHVjdHMvOmlkIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xyXG5yb3V0ZXIucHV0KCcvOmlkJywgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHByb2R1Y3RzID0gcmVhZFByb2R1Y3RzKCk7XHJcbiAgICBjb25zdCBpZHggPSBwcm9kdWN0cy5maW5kSW5kZXgocCA9PiBwLmlkID09PSByZXEucGFyYW1zLmlkKTtcclxuICAgIGlmIChpZHggPT09IC0xKSByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdQcm9kdWN0IG5vdCBmb3VuZCcgfSk7XHJcblxyXG4gICAgY29uc3QgdXBkYXRlcyA9IHJlcS5ib2R5O1xyXG4gICAgaWYgKHVwZGF0ZXMucHJpY2UgIT09IHVuZGVmaW5lZCkgdXBkYXRlcy5wcmljZSA9IHBhcnNlRmxvYXQodXBkYXRlcy5wcmljZSkgfHwgMDtcclxuICAgIGlmICh1cGRhdGVzLmF2YWlsYWJsZSAhPT0gdW5kZWZpbmVkKSB1cGRhdGVzLmF2YWlsYWJsZSA9IHVwZGF0ZXMuYXZhaWxhYmxlICE9PSBmYWxzZSAmJiB1cGRhdGVzLmF2YWlsYWJsZSAhPT0gJ2ZhbHNlJztcclxuICAgIGlmICh1cGRhdGVzLmZlYXR1cmVkICE9PSB1bmRlZmluZWQpIHVwZGF0ZXMuZmVhdHVyZWQgPSB1cGRhdGVzLmZlYXR1cmVkID09PSB0cnVlIHx8IHVwZGF0ZXMuZmVhdHVyZWQgPT09ICd0cnVlJztcclxuXHJcbiAgICBwcm9kdWN0c1tpZHhdID0geyAuLi5wcm9kdWN0c1tpZHhdLCAuLi51cGRhdGVzLCBpZDogcHJvZHVjdHNbaWR4XS5pZCwgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfTtcclxuICAgIHdyaXRlUHJvZHVjdHMocHJvZHVjdHMpO1xyXG4gICAgcmVzLmpzb24oeyBzdWNjZXNzOiB0cnVlLCBwcm9kdWN0OiBwcm9kdWN0c1tpZHhdIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfSk7XHJcbiAgfVxyXG59KTtcclxuXHJcbi8qIFx1MjUwMFx1MjUwMCBERUxFVEUgL2FwaS9wcm9kdWN0cy86aWQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXHJcbnJvdXRlci5kZWxldGUoJy86aWQnLCAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcHJvZHVjdHMgPSByZWFkUHJvZHVjdHMoKTtcclxuICAgIGNvbnN0IHByb2R1Y3QgPSBwcm9kdWN0cy5maW5kKHAgPT4gcC5pZCA9PT0gcmVxLnBhcmFtcy5pZCk7XHJcbiAgICBpZiAoIXByb2R1Y3QpIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1Byb2R1Y3Qgbm90IGZvdW5kJyB9KTtcclxuXHJcbiAgICAvLyBEZWxldGUgcGhvdG8gZmlsZXNcclxuICAgIChwcm9kdWN0LnBob3RvcyB8fCBbXSkuZm9yRWFjaChwaG90b1VybCA9PiB7XHJcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3B1YmxpYycsIHBob3RvVXJsLnJlcGxhY2UoJy91cGxvYWRzJywgJ3VwbG9hZHMnKSk7XHJcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZpbGVQYXRoKSkgZnMudW5saW5rU3luYyhmaWxlUGF0aCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB3cml0ZVByb2R1Y3RzKHByb2R1Y3RzLmZpbHRlcihwID0+IHAuaWQgIT09IHJlcS5wYXJhbXMuaWQpKTtcclxuICAgIHJlcy5qc29uKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH0pO1xyXG4gIH1cclxufSk7XHJcblxyXG4vKiBcdTI1MDBcdTI1MDAgUE9TVCAvYXBpL3Byb2R1Y3RzLzppZC9waG90b3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXHJcbnJvdXRlci5wb3N0KCcvOmlkL3Bob3RvcycsIHVwbG9hZC5hcnJheSgncGhvdG9zJywgMTApLCAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcHJvZHVjdHMgPSByZWFkUHJvZHVjdHMoKTtcclxuICAgIGNvbnN0IGlkeCA9IHByb2R1Y3RzLmZpbmRJbmRleChwID0+IHAuaWQgPT09IHJlcS5wYXJhbXMuaWQpO1xyXG4gICAgaWYgKGlkeCA9PT0gLTEpIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1Byb2R1Y3Qgbm90IGZvdW5kJyB9KTtcclxuICAgIGlmICghcmVxLmZpbGVzIHx8IHJlcS5maWxlcy5sZW5ndGggPT09IDApIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGZpbGVzIHVwbG9hZGVkJyB9KTtcclxuXHJcbiAgICBjb25zdCB1cmxzID0gcmVxLmZpbGVzLm1hcChmID0+IGAvdXBsb2Fkcy9wcm9kdWN0cy8ke2YuZmlsZW5hbWV9YCk7XHJcbiAgICBwcm9kdWN0c1tpZHhdLnBob3RvcyA9IFsuLi4ocHJvZHVjdHNbaWR4XS5waG90b3MgfHwgW10pLCAuLi51cmxzXTtcclxuICAgIHByb2R1Y3RzW2lkeF0udXBkYXRlZEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xyXG4gICAgd3JpdGVQcm9kdWN0cyhwcm9kdWN0cyk7XHJcbiAgICByZXMuanNvbih7IHN1Y2Nlc3M6IHRydWUsIHVybHMsIHByb2R1Y3Q6IHByb2R1Y3RzW2lkeF0gfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9KTtcclxuICB9XHJcbn0pO1xyXG5cclxuLyogXHUyNTAwXHUyNTAwIERFTEVURSAvYXBpL3Byb2R1Y3RzLzppZC9waG90b3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXHJcbnJvdXRlci5kZWxldGUoJy86aWQvcGhvdG9zJywgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgdXJsIH0gPSByZXEuYm9keTtcclxuICAgIGNvbnN0IHByb2R1Y3RzID0gcmVhZFByb2R1Y3RzKCk7XHJcbiAgICBjb25zdCBpZHggPSBwcm9kdWN0cy5maW5kSW5kZXgocCA9PiBwLmlkID09PSByZXEucGFyYW1zLmlkKTtcclxuICAgIGlmIChpZHggPT09IC0xKSByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdQcm9kdWN0IG5vdCBmb3VuZCcgfSk7XHJcblxyXG4gICAgLy8gRGVsZXRlIGZpbGVcclxuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3B1YmxpYycsIHVybC5yZXBsYWNlKC9eXFwvLywgJycpKTtcclxuICAgIGlmIChmcy5leGlzdHNTeW5jKGZpbGVQYXRoKSkgZnMudW5saW5rU3luYyhmaWxlUGF0aCk7XHJcblxyXG4gICAgcHJvZHVjdHNbaWR4XS5waG90b3MgPSAocHJvZHVjdHNbaWR4XS5waG90b3MgfHwgW10pLmZpbHRlcihwID0+IHAgIT09IHVybCk7XHJcbiAgICBwcm9kdWN0c1tpZHhdLnVwZGF0ZWRBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcclxuICAgIHdyaXRlUHJvZHVjdHMocHJvZHVjdHMpO1xyXG4gICAgcmVzLmpzb24oeyBzdWNjZXNzOiB0cnVlLCBwcm9kdWN0OiBwcm9kdWN0c1tpZHhdIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfSk7XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHJvdXRlcjtcclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTYWkgUm9sb3RlY2hcXFxcTmV3IGZvbGRlclxcXFxjbG91ZC1jb2RlLWV4dGVuc2lvblxcXFxjcm0tMlxcXFxzZXJ2ZXJcXFxcc2VydmljZXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFNhaSBSb2xvdGVjaFxcXFxOZXcgZm9sZGVyXFxcXGNsb3VkLWNvZGUtZXh0ZW5zaW9uXFxcXGNybS0yXFxcXHNlcnZlclxcXFxzZXJ2aWNlc1xcXFxjb25maWdTZXJ2aWNlLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9TYWklMjBSb2xvdGVjaC9OZXclMjBmb2xkZXIvY2xvdWQtY29kZS1leHRlbnNpb24vY3JtLTIvc2VydmVyL3NlcnZpY2VzL2NvbmZpZ1NlcnZpY2UuanNcIjsvKipcclxuICogQ29uZmlnU2VydmljZSBcdTIwMTQgUnVudGltZSBDb25maWcgKyBFcnJvciBMb2cgKyBTdGF0cyBUcmFja2luZ1xyXG4gKiBTaW5nbGUgc291cmNlIG9mIHRydXRoIGZvciBhbGwgZmVhdHVyZSBmbGFncyAmIHN5c3RlbSBoZWFsdGhcclxuICovXHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJztcclxuXHJcbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpO1xyXG5jb25zdCBDT05GSUdfRklMRSA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9kYXRhL3N5c3RlbS1jb25maWcuanNvbicpO1xyXG5cclxuY29uc3QgREVGQVVMVF9DT05GSUcgPSB7XHJcbiAgYWlFbmFibGVkOiB0cnVlLFxyXG4gIGFpTW9kZWw6ICdnZW1pbmktMi41LWZsYXNoJyxcclxuICB3aGF0c2FwcEVuYWJsZWQ6IHRydWUsXHJcbiAgcHVzaEVuYWJsZWQ6IHRydWUsXHJcbiAgZm9sbG93dXBFbmFibGVkOiB0cnVlLFxyXG4gIG1haW50ZW5hbmNlTW9kZTogZmFsc2UsXHJcbiAgZGFpbHlNZXNzYWdlTGltaXQ6IDEwMCxcclxuICBhbGVydE9uRXJyb3I6IHRydWUsXHJcbn07XHJcblxyXG5sZXQgX2NvbmZpZyA9IHsgLi4uREVGQVVMVF9DT05GSUcgfTtcclxubGV0IF9lcnJvckxvZ3MgPSBbXTtcclxubGV0IF9zdGF0cyA9IHtcclxuICBhaUNhbGxzOiAwLFxyXG4gIGFpRXJyb3JzOiAwLFxyXG4gIGFpRmlsdGVyZWQ6IDAsXHJcbiAgd2hhdHNhcHBTZW50OiAwLFxyXG4gIHdoYXRzYXBwRmFpbGVkOiAwLFxyXG4gIHB1c2hTZW50OiAwLFxyXG4gIHRvdGFsTGVhZHM6IDAsXHJcbiAgZm9sbG93dXBzU2VudDogMCxcclxuICBtZXNzYWdlc1RvZGF5OiAwLFxyXG4gIHN0YXJ0VGltZTogRGF0ZS5ub3coKSxcclxufTtcclxuXHJcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBEYWlseSByZXNldCBcdTIwMTQgbWlkbmlnaHQgbWVpbiBtZXNzYWdlc1RvZGF5IHJlc2V0IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG5mdW5jdGlvbiBzY2hlZHVsZVJlc2V0KCkge1xyXG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XHJcbiAgY29uc3QgbWlkbmlnaHQgPSBuZXcgRGF0ZShub3cuZ2V0RnVsbFllYXIoKSwgbm93LmdldE1vbnRoKCksIG5vdy5nZXREYXRlKCkgKyAxLCAwLCAwLCA1KTtcclxuICBjb25zdCBtc1VudGlsTWlkbmlnaHQgPSBtaWRuaWdodC5nZXRUaW1lKCkgLSBub3cuZ2V0VGltZSgpO1xyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgX3N0YXRzLm1lc3NhZ2VzVG9kYXkgPSAwO1xyXG4gICAgY29uc29sZS5sb2coJ1tDb25maWdTZXJ2aWNlXSBEYWlseSBtZXNzYWdlIGNvdW50ZXIgcmVzZXQnKTtcclxuICAgIHNldEludGVydmFsKCgpID0+IHsgX3N0YXRzLm1lc3NhZ2VzVG9kYXkgPSAwOyB9LCAyNCAqIDYwICogNjAgKiAxMDAwKTtcclxuICB9LCBtc1VudGlsTWlkbmlnaHQpO1xyXG59XHJcbnNjaGVkdWxlUmVzZXQoKTtcclxuXHJcbi8vIExvYWQgcGVyc2lzdGVkIGNvbmZpZyBvbiBzdGFydHVwXHJcbnRyeSB7XHJcbiAgaWYgKGZzLmV4aXN0c1N5bmMoQ09ORklHX0ZJTEUpKSB7XHJcbiAgICBjb25zdCBzYXZlZCA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKENPTkZJR19GSUxFLCAndXRmOCcpKTtcclxuICAgIF9jb25maWcgPSB7IC4uLkRFRkFVTFRfQ09ORklHLCAuLi5zYXZlZCB9O1xyXG4gICAgY29uc29sZS5sb2coJ1tDb25maWdTZXJ2aWNlXSBcdTI3MDUgQ29uZmlnIGxvYWRlZCBmcm9tIGZpbGUnKTtcclxuICB9XHJcbn0gY2F0Y2ggKGUpIHtcclxuICBjb25zb2xlLndhcm4oJ1tDb25maWdTZXJ2aWNlXSBDb3VsZCBub3QgbG9hZCBjb25maWcgZmlsZTonLCBlLm1lc3NhZ2UpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzYXZlQ29uZmlnKCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoQ09ORklHX0ZJTEUpO1xyXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgZnMud3JpdGVGaWxlU3luYyhDT05GSUdfRklMRSwgSlNPTi5zdHJpbmdpZnkoX2NvbmZpZywgbnVsbCwgMikpO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGNvbnNvbGUud2FybignW0NvbmZpZ1NlcnZpY2VdIENvdWxkIG5vdCBzYXZlIGNvbmZpZzonLCBlLm1lc3NhZ2UpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENvbmZpZyBDUlVEIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnKCkgeyByZXR1cm4geyAuLi5fY29uZmlnIH07IH1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDb25maWcodXBkYXRlcyA9IHt9KSB7XHJcbiAgY29uc3QgYWxsb3dlZCA9IFtcclxuICAgICdhaUVuYWJsZWQnLCAnYWlNb2RlbCcsICd3aGF0c2FwcEVuYWJsZWQnLCAncHVzaEVuYWJsZWQnLFxyXG4gICAgJ2ZvbGxvd3VwRW5hYmxlZCcsICdtYWludGVuYW5jZU1vZGUnLCAnZGFpbHlNZXNzYWdlTGltaXQnLCAnYWxlcnRPbkVycm9yJyxcclxuICBdO1xyXG4gIGZvciAoY29uc3QgayBvZiBhbGxvd2VkKSB7XHJcbiAgICBpZiAoayBpbiB1cGRhdGVzKSBfY29uZmlnW2tdID0gdXBkYXRlc1trXTtcclxuICB9XHJcbiAgc2F2ZUNvbmZpZygpO1xyXG4gIHJldHVybiB7IC4uLl9jb25maWcgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0Q29uZmlnKCkge1xyXG4gIF9jb25maWcgPSB7IC4uLkRFRkFVTFRfQ09ORklHIH07XHJcbiAgc2F2ZUNvbmZpZygpO1xyXG4gIHJldHVybiB7IC4uLl9jb25maWcgfTtcclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIEZlYXR1cmUgZmxhZ3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0VuYWJsZWQoZmVhdHVyZSkge1xyXG4gIGlmIChfY29uZmlnLm1haW50ZW5hbmNlTW9kZSAmJiBmZWF0dXJlICE9PSAnYWRtaW4nKSByZXR1cm4gZmFsc2U7XHJcbiAgcmV0dXJuIF9jb25maWdbZmVhdHVyZV0gIT09IGZhbHNlO1xyXG59XHJcblxyXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgRXJyb3IgbG9nZ2luZyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuZXhwb3J0IGZ1bmN0aW9uIGxvZ0Vycm9yKHNvdXJjZSwgbWVzc2FnZSwgZGV0YWlscyA9IG51bGwpIHtcclxuICBjb25zdCBlbnRyeSA9IHtcclxuICAgIGlkOiBEYXRlLm5vdygpICsgTWF0aC5yYW5kb20oKSxcclxuICAgIHRzOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICBzb3VyY2U6IFN0cmluZyhzb3VyY2UpLnNsaWNlKDAsIDQwKSxcclxuICAgIG1lc3NhZ2U6IFN0cmluZyhtZXNzYWdlKS5zbGljZSgwLCAyMDApLFxyXG4gICAgZGV0YWlsczogZGV0YWlscyA/IFN0cmluZyhkZXRhaWxzKS5zbGljZSgwLCA0MDApIDogbnVsbCxcclxuICB9O1xyXG4gIF9lcnJvckxvZ3MudW5zaGlmdChlbnRyeSk7XHJcbiAgaWYgKF9lcnJvckxvZ3MubGVuZ3RoID4gMjAwKSBfZXJyb3JMb2dzID0gX2Vycm9yTG9ncy5zbGljZSgwLCAyMDApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXJyb3JMb2dzKGxpbWl0ID0gNTApIHsgcmV0dXJuIF9lcnJvckxvZ3Muc2xpY2UoMCwgbGltaXQpOyB9XHJcbmV4cG9ydCBmdW5jdGlvbiBjbGVhckVycm9yTG9ncygpIHsgX2Vycm9yTG9ncyA9IFtdOyB9XHJcblxyXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgU3RhdHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbmV4cG9ydCBmdW5jdGlvbiBpbmNyZW1lbnQoa2V5KSB7XHJcbiAgaWYgKGtleSBpbiBfc3RhdHMpIF9zdGF0c1trZXldKys7XHJcbiAgLy8gQWxzbyB0cmFjayBkYWlseSBtZXNzYWdlIGNvdW50IGZvciBXQSBzZW5kc1xyXG4gIGlmIChrZXkgPT09ICd3aGF0c2FwcFNlbnQnKSBfc3RhdHMubWVzc2FnZXNUb2RheSsrO1xyXG59XHJcblxyXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgRGFpbHkgbGltaXQgY2hlY2sgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1dpdGhpbkRhaWx5TGltaXQoKSB7XHJcbiAgcmV0dXJuIF9zdGF0cy5tZXNzYWdlc1RvZGF5IDwgX2NvbmZpZy5kYWlseU1lc3NhZ2VMaW1pdDtcclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFJldHJ5IHdpdGggZXhwb25lbnRpYWwgYmFja29mZiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJldHJ5T3BlcmF0aW9uKGZuLCByZXRyaWVzID0gMywgZGVsYXlNcyA9IDUwMCkge1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gYXdhaXQgZm4oKTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBpZiAocmV0cmllcyA8PSAwKSB0aHJvdyBlO1xyXG4gICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIGRlbGF5TXMpKTtcclxuICAgIHJldHVybiByZXRyeU9wZXJhdGlvbihmbiwgcmV0cmllcyAtIDEsIGRlbGF5TXMgKiAyKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRMZWFkQ291bnQobikgeyBfc3RhdHMudG90YWxMZWFkcyA9IG47IH1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRTdGF0cygpIHtcclxuICByZXR1cm4ge1xyXG4gICAgLi4uX3N0YXRzLFxyXG4gICAgdXB0aW1lU2Vjb25kczogTWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIF9zdGF0cy5zdGFydFRpbWUpIC8gMTAwMCksXHJcbiAgICBlcnJvckNvdW50OiBfZXJyb3JMb2dzLmxlbmd0aCxcclxuICB9O1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcU2FpIFJvbG90ZWNoXFxcXE5ldyBmb2xkZXJcXFxcY2xvdWQtY29kZS1leHRlbnNpb25cXFxcY3JtLTJcXFxcc2VydmVyXFxcXHNlcnZpY2VzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTYWkgUm9sb3RlY2hcXFxcTmV3IGZvbGRlclxcXFxjbG91ZC1jb2RlLWV4dGVuc2lvblxcXFxjcm0tMlxcXFxzZXJ2ZXJcXFxcc2VydmljZXNcXFxcYWN0aXZpdHlMb2dnZXIuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1NhaSUyMFJvbG90ZWNoL05ldyUyMGZvbGRlci9jbG91ZC1jb2RlLWV4dGVuc2lvbi9jcm0tMi9zZXJ2ZXIvc2VydmljZXMvYWN0aXZpdHlMb2dnZXIuanNcIjsvKipcclxuICogQWN0aXZpdHkgTG9nZ2VyIFx1MjAxNCBUcmFja3MgYWxsIEFJLCBXaGF0c0FwcCwgYW5kIHN5c3RlbSBldmVudHNcclxuICogUHJvZHVjdGlvbi1sZXZlbCBsb2dnaW5nIGZvciBtb25pdG9yaW5nIGFuZCBkZWJ1Z2dpbmdcclxuICovXHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJztcclxuXHJcbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpO1xyXG5jb25zdCBMT0dfRElSID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL2RhdGEvbG9ncycpO1xyXG5cclxuaWYgKCFmcy5leGlzdHNTeW5jKExPR19ESVIpKSBmcy5ta2RpclN5bmMoTE9HX0RJUiwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcblxyXG5jb25zdCBNQVhfTUVNT1JZX0xPR1MgPSA1MDA7XHJcbmNvbnN0IE1BWF9GSUxFX1NJWkUgPSA1ICogMTAyNCAqIDEwMjQ7XHJcblxyXG5jb25zdCBfbG9ncyA9IHtcclxuICBhaTogW10sXHJcbiAgd2hhdHNhcHA6IFtdLFxyXG4gIHNlY3VyaXR5OiBbXSxcclxuICBzeXN0ZW06IFtdLFxyXG59O1xyXG5cclxuZnVuY3Rpb24gZ2V0VGltZXN0YW1wKCkge1xyXG4gIHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFkZExvZyhjYXRlZ29yeSwgZW50cnkpIHtcclxuICBjb25zdCBsb2cgPSB7IHRzOiBnZXRUaW1lc3RhbXAoKSwgLi4uZW50cnkgfTtcclxuICBpZiAoIV9sb2dzW2NhdGVnb3J5XSkgX2xvZ3NbY2F0ZWdvcnldID0gW107XHJcbiAgX2xvZ3NbY2F0ZWdvcnldLnVuc2hpZnQobG9nKTtcclxuICBpZiAoX2xvZ3NbY2F0ZWdvcnldLmxlbmd0aCA+IE1BWF9NRU1PUllfTE9HUykge1xyXG4gICAgX2xvZ3NbY2F0ZWdvcnldID0gX2xvZ3NbY2F0ZWdvcnldLnNsaWNlKDAsIE1BWF9NRU1PUllfTE9HUyk7XHJcbiAgfVxyXG4gIGFwcGVuZFRvRmlsZShjYXRlZ29yeSwgbG9nKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYXBwZW5kVG9GaWxlKGNhdGVnb3J5LCBsb2cpIHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgZmlsZSA9IHBhdGguam9pbihMT0dfRElSLCBgJHtjYXRlZ29yeX0tJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXX0ubG9nYCk7XHJcbiAgICBjb25zdCBzdGF0cyA9IGZzLmV4aXN0c1N5bmMoZmlsZSkgPyBmcy5zdGF0U3luYyhmaWxlKSA6IG51bGw7XHJcbiAgICBpZiAoc3RhdHMgJiYgc3RhdHMuc2l6ZSA+IE1BWF9GSUxFX1NJWkUpIHJldHVybjtcclxuICAgIGZzLmFwcGVuZEZpbGVTeW5jKGZpbGUsIEpTT04uc3RyaW5naWZ5KGxvZykgKyAnXFxuJyk7XHJcbiAgfSBjYXRjaCAoZSkgeyAvKiBzaWxlbnQgKi8gfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbG9nQUkoZGF0YSkge1xyXG4gIGFkZExvZygnYWknLCB7XHJcbiAgICB0eXBlOiAnYWlfY2FsbCcsXHJcbiAgICBpbnB1dDogU3RyaW5nKGRhdGEuaW5wdXQgfHwgJycpLnNsaWNlKDAsIDIwMCksXHJcbiAgICBvdXRwdXQ6IFN0cmluZyhkYXRhLm91dHB1dCB8fCAnJykuc2xpY2UoMCwgMzAwKSxcclxuICAgIG1vZGVsOiBkYXRhLm1vZGVsIHx8ICd1bmtub3duJyxcclxuICAgIHZhbGlkYXRlZDogZGF0YS52YWxpZGF0ZWQgPz8gdHJ1ZSxcclxuICAgIGlzc3Vlc0ZpeGVkOiBkYXRhLmlzc3Vlc0ZpeGVkIHx8IDAsXHJcbiAgICBsYXRlbmN5TXM6IGRhdGEubGF0ZW5jeU1zIHx8IDAsXHJcbiAgICBzb3VyY2U6IGRhdGEuc291cmNlIHx8ICd1bmtub3duJyxcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvZ1doYXRzQXBwKGRhdGEpIHtcclxuICBhZGRMb2coJ3doYXRzYXBwJywge1xyXG4gICAgdHlwZTogZGF0YS50eXBlIHx8ICdzZW5kJyxcclxuICAgIHRvOiBTdHJpbmcoZGF0YS50byB8fCAnJykucmVwbGFjZSgvXFxkezR9JC8sICcqKioqJyksXHJcbiAgICB0ZW1wbGF0ZTogZGF0YS50ZW1wbGF0ZSB8fCAnY3VzdG9tJyxcclxuICAgIHN0YXR1czogZGF0YS5zdGF0dXMgfHwgJ3NlbnQnLFxyXG4gICAgZXJyb3I6IGRhdGEuZXJyb3IgfHwgbnVsbCxcclxuICAgIGJsb2NrZWQ6IGRhdGEuYmxvY2tlZCB8fCBmYWxzZSxcclxuICAgIHJlYXNvbjogZGF0YS5yZWFzb24gfHwgbnVsbCxcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvZ1NlY3VyaXR5KGRhdGEpIHtcclxuICBhZGRMb2coJ3NlY3VyaXR5Jywge1xyXG4gICAgdHlwZTogZGF0YS50eXBlIHx8ICdhbGVydCcsXHJcbiAgICBpcDogZGF0YS5pcCB8fCAndW5rbm93bicsXHJcbiAgICBlbmRwb2ludDogZGF0YS5lbmRwb2ludCB8fCAnJyxcclxuICAgIGRldGFpbDogU3RyaW5nKGRhdGEuZGV0YWlsIHx8ICcnKS5zbGljZSgwLCAzMDApLFxyXG4gICAgc2V2ZXJpdHk6IGRhdGEuc2V2ZXJpdHkgfHwgJ21lZGl1bScsXHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2dTeXN0ZW0oZGF0YSkge1xyXG4gIGFkZExvZygnc3lzdGVtJywge1xyXG4gICAgdHlwZTogZGF0YS50eXBlIHx8ICdpbmZvJyxcclxuICAgIG1lc3NhZ2U6IFN0cmluZyhkYXRhLm1lc3NhZ2UgfHwgJycpLnNsaWNlKDAsIDMwMCksXHJcbiAgICBkZXRhaWw6IGRhdGEuZGV0YWlsIHx8IG51bGwsXHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2dzKGNhdGVnb3J5LCBsaW1pdCA9IDUwKSB7XHJcbiAgaWYgKGNhdGVnb3J5ICYmIF9sb2dzW2NhdGVnb3J5XSkge1xyXG4gICAgcmV0dXJuIF9sb2dzW2NhdGVnb3J5XS5zbGljZSgwLCBsaW1pdCk7XHJcbiAgfVxyXG4gIGNvbnN0IGFsbCA9IFtdO1xyXG4gIGZvciAoY29uc3QgY2F0IG9mIE9iamVjdC5rZXlzKF9sb2dzKSkge1xyXG4gICAgZm9yIChjb25zdCBsb2cgb2YgX2xvZ3NbY2F0XSkge1xyXG4gICAgICBhbGwucHVzaCh7IGNhdGVnb3J5OiBjYXQsIC4uLmxvZyB9KTtcclxuICAgIH1cclxuICB9XHJcbiAgYWxsLnNvcnQoKGEsIGIpID0+IGIudHMubG9jYWxlQ29tcGFyZShhLnRzKSk7XHJcbiAgcmV0dXJuIGFsbC5zbGljZSgwLCBsaW1pdCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2dTdGF0cygpIHtcclxuICByZXR1cm4ge1xyXG4gICAgYWk6IF9sb2dzLmFpLmxlbmd0aCxcclxuICAgIHdoYXRzYXBwOiBfbG9ncy53aGF0c2FwcC5sZW5ndGgsXHJcbiAgICBzZWN1cml0eTogX2xvZ3Muc2VjdXJpdHkubGVuZ3RoLFxyXG4gICAgc3lzdGVtOiBfbG9ncy5zeXN0ZW0ubGVuZ3RoLFxyXG4gICAgdG90YWw6IE9iamVjdC52YWx1ZXMoX2xvZ3MpLnJlZHVjZSgocywgYSkgPT4gcyArIGEubGVuZ3RoLCAwKSxcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJMb2dzKGNhdGVnb3J5KSB7XHJcbiAgaWYgKGNhdGVnb3J5ICYmIF9sb2dzW2NhdGVnb3J5XSkge1xyXG4gICAgX2xvZ3NbY2F0ZWdvcnldID0gW107XHJcbiAgfSBlbHNlIHtcclxuICAgIGZvciAoY29uc3QgayBvZiBPYmplY3Qua2V5cyhfbG9ncykpIF9sb2dzW2tdID0gW107XHJcbiAgfVxyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcU2FpIFJvbG90ZWNoXFxcXE5ldyBmb2xkZXJcXFxcY2xvdWQtY29kZS1leHRlbnNpb25cXFxcY3JtLTJcXFxcc2VydmVyXFxcXHNlcnZpY2VzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTYWkgUm9sb3RlY2hcXFxcTmV3IGZvbGRlclxcXFxjbG91ZC1jb2RlLWV4dGVuc2lvblxcXFxjcm0tMlxcXFxzZXJ2ZXJcXFxcc2VydmljZXNcXFxcd2hhdHNhcHBTZXJ2aWNlLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9TYWklMjBSb2xvdGVjaC9OZXclMjBmb2xkZXIvY2xvdWQtY29kZS1leHRlbnNpb24vY3JtLTIvc2VydmVyL3NlcnZpY2VzL3doYXRzYXBwU2VydmljZS5qc1wiOy8qKlxyXG4gKiBXaGF0c0FwcCBCdXNpbmVzcyBBUEkgU2VydmljZVxyXG4gKiBFbnYgdmFycyBuZWVkZWQ6IFdIQVRTQVBQX0FDQ0VTU19UT0tFTiwgV0hBVFNBUFBfUEhPTkVfSURcclxuICogR2V0IGZyb206IE1ldGEgQnVzaW5lc3MgXHUyMTkyIFdoYXRzQXBwIFx1MjE5MiBBUEkgU2V0dXBcclxuICovXHJcblxyXG5jb25zdCBXQV9UT0tFTiA9IHByb2Nlc3MuZW52LldIQVRTQVBQX0FDQ0VTU19UT0tFTjtcclxuY29uc3QgUEhPTkVfSUQgPSBwcm9jZXNzLmVudi5XSEFUU0FQUF9QSE9ORV9JRDtcclxuY29uc3QgV0FfQVBJID0gYGh0dHBzOi8vZ3JhcGguZmFjZWJvb2suY29tL3YxOC4wLyR7UEhPTkVfSUR9L21lc3NhZ2VzYDtcclxuY29uc3QgQVBQX0xJTksgPSBwcm9jZXNzLmVudi5BUFBfRE9XTkxPQURfTElOSyB8fCAnaHR0cHM6Ly9zYWlyb2xvdGVjaC5hcHAnO1xyXG5cclxuaW1wb3J0IHsgZ2V0TGVhZCwgbWFya0RORCB9IGZyb20gJy4uL21vZGVscy9sZWFkTW9kZWwuanMnO1xyXG5pbXBvcnQgeyBpc0VuYWJsZWQsIGluY3JlbWVudCwgbG9nRXJyb3IsIGlzV2l0aGluRGFpbHlMaW1pdCwgcmV0cnlPcGVyYXRpb24gfSBmcm9tICcuL2NvbmZpZ1NlcnZpY2UuanMnO1xyXG5pbXBvcnQgeyBsb2dXaGF0c0FwcCwgbG9nU2VjdXJpdHkgfSBmcm9tICcuL2FjdGl2aXR5TG9nZ2VyLmpzJztcclxuXHJcbmNvbnN0IFBIT05FX0NPT0xET1dOX01TID0gNCAqIDYwICogNjAgKiAxMDAwO1xyXG5jb25zdCBwaG9uZUxhc3RTZW50TWFwID0gbmV3IE1hcCgpO1xyXG5cclxuc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gIGNvbnN0IGN1dG9mZiA9IERhdGUubm93KCkgLSBQSE9ORV9DT09MRE9XTl9NUyAqIDI7XHJcbiAgZm9yIChjb25zdCBbcGhvbmUsIHRzXSBvZiBwaG9uZUxhc3RTZW50TWFwKSB7XHJcbiAgICBpZiAodHMgPCBjdXRvZmYpIHBob25lTGFzdFNlbnRNYXAuZGVsZXRlKHBob25lKTtcclxuICB9XHJcbn0sIDMwICogNjAgKiAxMDAwKTtcclxuXHJcbmZ1bmN0aW9uIGlzQ29uZmlndXJlZCgpIHtcclxuICByZXR1cm4gISEoV0FfVE9LRU4gJiYgUEhPTkVfSUQpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzZW5kUmF3KHRvLCBib2R5LCBvcHRpb25zID0ge30pIHtcclxuICBjb25zdCBub3JtYWxpemVkUGhvbmUgPSB0by5yZXBsYWNlKC9cXEQvZywgJycpO1xyXG4gIGNvbnN0IGlzQWRtaW5BbGVydCA9IG9wdGlvbnM/LmlzQWRtaW5BbGVydCA9PT0gdHJ1ZTtcclxuXHJcbiAgaWYgKCFpc0VuYWJsZWQoJ3doYXRzYXBwRW5hYmxlZCcpKSB7XHJcbiAgICBsb2dXaGF0c0FwcCh7IHRvOiBub3JtYWxpemVkUGhvbmUsIHN0YXR1czogJ2Jsb2NrZWQnLCByZWFzb246ICd3aGF0c2FwcF9kaXNhYmxlZCcgfSk7XHJcbiAgICByZXR1cm4geyBibG9ja2VkOiB0cnVlLCByZWFzb246ICd3aGF0c2FwcF9kaXNhYmxlZCcgfTtcclxuICB9XHJcblxyXG4gIGlmICghaXNBZG1pbkFsZXJ0KSB7XHJcbiAgICBjb25zdCBsYXN0U2VudCA9IHBob25lTGFzdFNlbnRNYXAuZ2V0KG5vcm1hbGl6ZWRQaG9uZSk7XHJcbiAgICBpZiAobGFzdFNlbnQgJiYgRGF0ZS5ub3coKSAtIGxhc3RTZW50IDwgUEhPTkVfQ09PTERPV05fTVMpIHtcclxuICAgICAgbG9nV2hhdHNBcHAoeyB0bzogbm9ybWFsaXplZFBob25lLCBzdGF0dXM6ICdibG9ja2VkJywgcmVhc29uOiAnY29vbGRvd25fNGgnIH0pO1xyXG4gICAgICByZXR1cm4geyBibG9ja2VkOiB0cnVlLCByZWFzb246ICdjb29sZG93bl9hY3RpdmUnLCBuZXh0QWxsb3dlZEF0OiBsYXN0U2VudCArIFBIT05FX0NPT0xET1dOX01TIH07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAoIWlzV2l0aGluRGFpbHlMaW1pdCgpKSB7XHJcbiAgICBsb2dXaGF0c0FwcCh7IHRvOiBub3JtYWxpemVkUGhvbmUsIHN0YXR1czogJ2Jsb2NrZWQnLCByZWFzb246ICdkYWlseV9saW1pdCcgfSk7XHJcbiAgICBsb2dFcnJvcignV2hhdHNBcHAnLCAnRGFpbHkgbWVzc2FnZSBsaW1pdCByZWFjaGVkJywgYEF0dGVtcHRlZCB0byBzZW5kIHRvICR7dG99YCk7XHJcbiAgICByZXR1cm4geyBibG9ja2VkOiB0cnVlLCByZWFzb246ICdkYWlseV9saW1pdF9yZWFjaGVkJyB9O1xyXG4gIH1cclxuXHJcbiAgaWYgKCFpc0NvbmZpZ3VyZWQoKSkge1xyXG4gICAgY29uc29sZS5sb2coYFtXQSBNT0NLXSBUbzogJHt0b31gKTtcclxuICAgIGluY3JlbWVudCgnd2hhdHNhcHBTZW50Jyk7XHJcbiAgICBwaG9uZUxhc3RTZW50TWFwLnNldChub3JtYWxpemVkUGhvbmUsIERhdGUubm93KCkpO1xyXG4gICAgbG9nV2hhdHNBcHAoeyB0bzogbm9ybWFsaXplZFBob25lLCBzdGF0dXM6ICdtb2NrX3NlbnQnIH0pO1xyXG4gICAgcmV0dXJuIHsgbW9jazogdHJ1ZSB9O1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJldHJ5T3BlcmF0aW9uKGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goV0FfQVBJLCB7XHJcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7V0FfVE9LRU59YCxcclxuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICBtZXNzYWdpbmdfcHJvZHVjdDogJ3doYXRzYXBwJyxcclxuICAgICAgICAgIHRvOiBub3JtYWxpemVkUGhvbmUsXHJcbiAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICB0ZXh0OiB7IGJvZHkgfSxcclxuICAgICAgICB9KSxcclxuICAgICAgICBzaWduYWw6IEFib3J0U2lnbmFsLnRpbWVvdXQoMTAwMDApLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGlmICghcmVzLm9rKSB7XHJcbiAgICAgICAgY29uc3QgZXJyID0gYXdhaXQgcmVzLnRleHQoKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFdBIEFQSSAke3Jlcy5zdGF0dXN9OiAke2Vycn1gKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVzLmpzb24oKTtcclxuICAgIH0sIDMsIDEwMDApO1xyXG5cclxuICAgIGluY3JlbWVudCgnd2hhdHNhcHBTZW50Jyk7XHJcbiAgICBwaG9uZUxhc3RTZW50TWFwLnNldChub3JtYWxpemVkUGhvbmUsIERhdGUubm93KCkpO1xyXG4gICAgbG9nV2hhdHNBcHAoeyB0bzogbm9ybWFsaXplZFBob25lLCBzdGF0dXM6ICdzZW50JyB9KTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgaW5jcmVtZW50KCd3aGF0c2FwcEZhaWxlZCcpO1xyXG4gICAgbG9nV2hhdHNBcHAoeyB0bzogbm9ybWFsaXplZFBob25lLCBzdGF0dXM6ICdmYWlsZWQnLCBlcnJvcjogZS5tZXNzYWdlIH0pO1xyXG4gICAgbG9nRXJyb3IoJ1doYXRzQXBwJywgZS5tZXNzYWdlLCBgVG86ICR7dG99IHwgTWVzc2FnZTogJHtib2R5LnNsaWNlKDAsIDgwKX1gKTtcclxuICAgIHRocm93IGU7XHJcbiAgfVxyXG59XHJcblxyXG4vKiogU2VuZCBmaXJzdCBtZXNzYWdlIFx1MjAxNCBmb2N1c2VkIG9uIGFwcCBkb3dubG9hZCAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZFdlbGNvbWVNZXNzYWdlKGxlYWQpIHtcclxuICBjb25zdCB7IHBob25lLCBuYW1lIH0gPSBsZWFkO1xyXG5cclxuICAvLyBDaGVjayBETkRcclxuICBjb25zdCBleGlzdGluZyA9IGdldExlYWQocGhvbmUpO1xyXG4gIGlmIChleGlzdGluZz8uZG5kKSByZXR1cm47XHJcblxyXG4gIGNvbnN0IG1zZyA9XHJcbmBcdUQ4M0RcdURFNEYgTmFtYXN0ZSAke25hbWV9IVxyXG5cclxuU0FJIFJvbG9UZWNoIGtpIHRhcmFmIHNlIGFhcGthIHN3YWdhdCBoYWkgXHUyMDE0IE5ldyBEZWxoaSBraSB0cnVzdGVkIFJvbGwgRm9ybWluZyBNYWNoaW5lIG1hbnVmYWN0dXJlci5cclxuXHJcbkhhbWFyZSAqRlJFRSBhcHAqIG1laW4geWUgc2FiIG1pbGVnYTpcclxuXHUyNzA1IEFJIFF1b3RhdGlvbiAoaW5zdGFudCBtYWNoaW5lIHF1b3RlKVxyXG5cdTI3MDUgTWFpbnRlbmFuY2UgR3VpZGUgKGFwbmkgbWFjaGluZSBrYSBjYXJlIGthcm8pXHJcblx1MjcwNSBRdWFsaXR5IENoZWNrIChwcm9kdWN0aW9uIGlzc3VlcyBzb2x2ZSBrYXJvKVxyXG5cclxuQXBwIGRvd25sb2FkIGthcmVpbiBcdUQ4M0RcdURDNDdcclxuJHtBUFBfTElOS30/dXNlcj0ke3Bob25lfVxyXG5cclxuS29pIGJoaSBzYXdhYWwgaG8gXHUyMDE0IGh1bSB5YWhhbiBoYWluISBcdUQ4M0RcdURFMEFgO1xyXG5cclxuICByZXR1cm4gc2VuZFJhdyhwaG9uZSwgbXNnKTtcclxufVxyXG5cclxuLyoqIFNlbmQgZm9sbG93LXVwIG1lc3NhZ2UgYmFzZWQgb24gZGF5IGluZGV4ICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZW5kRm9sbG93dXAobGVhZCwgZGF5SW5kZXgpIHtcclxuICBjb25zdCB7IHBob25lLCBuYW1lIH0gPSBsZWFkO1xyXG5cclxuICBjb25zdCBleGlzdGluZyA9IGdldExlYWQocGhvbmUpO1xyXG4gIGlmIChleGlzdGluZz8uZG5kKSByZXR1cm47XHJcblxyXG4gIGNvbnN0IGxvYyA9IGV4aXN0aW5nPy5sb2NhdGlvblByaW9yaXR5IHx8ICdVTktOT1dOJztcclxuXHJcbiAgLy8gTG9jYXRpb24tYXdhcmUgbWVzc2FnZSB0ZW1wbGF0ZXNcclxuICBjb25zdCBORUFSX01FU1NBR0VTID0gW1xyXG4gICAgYEhpICR7bmFtZX0hIEFwcCBkb3dubG9hZCBraXlhPyBBYXAgRGVsaGkvTkNSIG1laW4gaGFpbiBcdTIwMTQgaHVtIHNhbWUtZGF5IHZpc2l0IGFycmFuZ2Uga2FyIHNha3RlIGhhaW4hIFx1RDgzRFx1REQyNSAke0FQUF9MSU5LfT91c2VyPSR7cGhvbmV9YCxcclxuICAgIGAke25hbWV9IGppLCBhYXAgbmVhcmJ5IGhhaW4gaXNsaXllIHBlcnNvbmFsbHkgZGlzY3VzcyBrYXJuYSBjaGFoZW5nZT8gRnJlZSBmYWN0b3J5IHZpc2l0IGFycmFuZ2Uga2FydGUgaGFpbiBcdTIwMTQgYmFzIGVrIGNhbGwga2FyZWluISBcdUQ4M0RcdURDREVgLFxyXG4gICAgYE5hbWFzdGUgJHtuYW1lfSEgTmVhcmJ5IGN1c3RvbWVycyBrZSBsaXllIGZhc3QgZGVsaXZlcnkgKyBmcmVlIGluc3RhbGxhdGlvbiBzdXBwb3J0IGRldGUgaGFpbi4gQXBuaSByZXF1aXJlbWVudCBzaGFyZSBrYXJlaW4hIFx1RDgzQ1x1REZFRGAsXHJcbiAgICBgJHtuYW1lfSBqaSwgMi0zIGRpbiBtZWluIG1hY2hpbmUgZGVtbyBhcnJhbmdlIGthciBzYWt0ZSBoYWluIGFhcGtlIHBhYXMuIEthYiBjb252ZW5pZW50IHJhaGVnYT8gTWVldGluZyBmaXgga2FydGUgaGFpbiEgXHVEODNEXHVEQ0M1YCxcclxuICAgIGBIaSAke25hbWV9ISBOZWFyYnkgaG9uZSBraSB3YWphaCBzZSA0OC1ob3VyIGRlbGl2ZXJ5IGF1ciBsaWZldGltZSBzdXBwb3J0IG1pbHRhIGhhaS4gS3lhIGlzIHdlZWsgZGlzY3VzcyBrYXIgc2FrdGUgaGFpbj9gLFxyXG4gICAgYCR7bmFtZX0gamksIGxhc3QgbWVzc2FnZSBcdTIwMTQga2FiaGkgYmhpIG1hY2hpbmUga2kgemFyb29yYXQgaG8sIFNBSSBSb2xvVGVjaCBlayBjYWxsIGRvb3IgaGFpLiBIdW0gRGVsaGkvTkNSIG1laW4gaGFpbiEgXHVEODNEXHVERTRGYCxcclxuICBdO1xyXG5cclxuICBjb25zdCBNRURJVU1fTUVTU0FHRVMgPSBbXHJcbiAgICBgSGkgJHtuYW1lfSEgQXBwIGRvd25sb2FkIGtpeWE/IEh1bSBhYXBraSBtYWNoaW5lIHF1ZXJ5IGluc3RhbnRseSBzb2x2ZSBrYXIgc2FrdGUgaGFpbiBcdTIwMTQgZnJlZSBjb25zdWx0YXRpb24gYmhpISAke0FQUF9MSU5LfT91c2VyPSR7cGhvbmV9YCxcclxuICAgIGAke25hbWV9IGppLCBhYXBraSByZXF1aXJlbWVudCBrZSBoaXNhYWIgc2UgYmVzdCBtYWNoaW5lIHN1Z2dlc3Qga2FyIHNha3RlIGhhaW4uIERldGFpbCBzaGFyZSBrYXJlaW4sIHF1b3RlIGJoZWp0ZSBoYWluISBcdUQ4M0RcdURDQ0JgLFxyXG4gICAgYE5hbWFzdGUgJHtuYW1lfSEgSXMgbWFoaW5lIHNwZWNpYWwgb2ZmZXIgaGFpLiBDdXN0b21pemUgcXVvdGUgKyBkZWxpdmVyeSBwbGFuIGtlIHNhYXRoIGJoZWp0ZSBoYWluIFx1MjAxNCBiYXRhIGRlaW4gcmVxdWlyZW1lbnRzISBcdUQ4M0NcdURGRURgLFxyXG4gICAgYCR7bmFtZX0gamksIHZpZGVvIGNhbGwgcGUgbWFjaGluZSBkZW1vIGFycmFuZ2Uga2FyIHNha3RlIGhhaW4uIEFhcCBpbnRlcmVzdGVkIGhhaW4gdG8gdGltZSBmaXgga2FydGUgaGFpbiFgLFxyXG4gICAgYEhpICR7bmFtZX0hIEN1c3RvbWVycyBuZSBoYW1hcmUgc2FhdGggc3dpdGNoIGthcmtlIGNvc3QgMjUlIGthbSBraS4gQWFwIGJoaSBkaXNjdXNzIGthcm5hIGNoYWhlbmdlPyAxNS1taW4gdmlkZW8gY2FsbD9gLFxyXG4gICAgYCR7bmFtZX0gamksIGxhc3QgbWVzc2FnZSBcdTIwMTQgZnV0dXJlIG1laW4gbWFjaGluZSB6YXJvb3JhdCBobyB0byB6YXJvb3IgYmF0YXllaW4uIFNBSSBSb2xvVGVjaCBoYW1lc2hhIGF2YWlsYWJsZSEgXHVEODNEXHVERTRGYCxcclxuICBdO1xyXG5cclxuICBjb25zdCBGQVJfTUVTU0FHRVMgPSBbXHJcbiAgICBgSGkgJHtuYW1lfSEgU0FJIFJvbG9UZWNoIENSTSBhcHAgbWVpbiBkZXRhaWxlZCBtYWNoaW5lIGluZm8sIHNwZWNzIGF1ciBxdW90ZXMgbWlsIGphYXRlIGhhaW4uIEV4cGxvcmUga2FyZWluISAke0FQUF9MSU5LfT91c2VyPSR7cGhvbmV9YCxcclxuICAgIGAke25hbWV9IGppLCBhcHAgbWVpbiBhcG5pIHJlcXVpcmVtZW50IGtlIGhpc2FhYiBzZSBxdW90ZSBnZW5lcmF0ZSBrYXIgc2FrdGUgaGFpbi4gS29pIHNhd2FhbCBobyB0b2ggYmF0YSBkZWluISBcdUQ4M0RcdURDQUNgLFxyXG4gICAgYE5hbWFzdGUgJHtuYW1lfSEgQWFwIGFwcCBtZWluIG1hY2hpbmUgZ3VpZGUgYXVyIHRyb3VibGVzaG9vdGluZyBiaGkgZGVraCBzYWt0ZSBoYWluIFx1MjAxNCBiaWxrdWwgZnJlZSEgXHVEODNEXHVERDI3YCxcclxuICAgIGAke25hbWV9IGppLCBhZ2FyIGZ1dHVyZSBtZWluIG1hY2hpbmUga2kgemFyb29yYXQgaG8gdG9oIHBsZWFzZSBjb25zaWRlciBrYXJlaW4uIE9ubGluZSBkZWxpdmVyeSBhcnJhbmdlbWVudCBwb3NzaWJsZSBoYWkhYCxcclxuICAgIGBIaSAke25hbWV9ISBBYXBraSByZXF1aXJlbWVudCBub3RlIGthciBsaSBnYXlpIGhhaS4gSmFiIGJoaSBkZWNpZGUga2FyZWluLCBtYWluIGRldGFpbHMgc2hhcmUga2FyIHNha3RhIGhvb24uYCxcclxuICAgIGAke25hbWV9IGppLCB0aGFuayB5b3UgZm9yIGNvbnNpZGVyaW5nIFNBSSBSb2xvVGVjaC4gS2FiaGkgYmhpIGNvbnRhY3Qga2FyZWluIFx1MjAxNCBhbHdheXMgaGVyZSB0byBoZWxwISBcdUQ4M0RcdURFNEZgLFxyXG4gIF07XHJcblxyXG4gIGxldCBNRVNTQUdFUztcclxuICBpZiAobG9jID09PSAnSElHSCcpIE1FU1NBR0VTID0gTkVBUl9NRVNTQUdFUztcclxuICBlbHNlIGlmIChsb2MgPT09ICdNRURJVU0nKSBNRVNTQUdFUyA9IE1FRElVTV9NRVNTQUdFUztcclxuICBlbHNlIE1FU1NBR0VTID0gRkFSX01FU1NBR0VTO1xyXG5cclxuICBjb25zdCBtc2cgPSBNRVNTQUdFU1tNYXRoLm1pbihkYXlJbmRleCwgTUVTU0FHRVMubGVuZ3RoIC0gMSldO1xyXG4gIHJldHVybiBzZW5kUmF3KHBob25lLCBtc2cpO1xyXG59XHJcblxyXG4vKiogU2VuZCBob3QgbGVhZCBhbGVydCB0byBhZG1pbiBcdTIwMTQgZW5oYW5jZWQgd2l0aCBsb2NhdGlvbitzY29yZSBjb21ibyBkZXRlY3Rpb24gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRBZG1pbkFsZXJ0KGxlYWQsIGV2ZW50KSB7XHJcbiAgY29uc3QgQURNSU5fUEhPTkUgPSBwcm9jZXNzLmVudi5BRE1JTl9QSE9ORTtcclxuICBpZiAoIUFETUlOX1BIT05FKSByZXR1cm47XHJcblxyXG4gIGNvbnN0IGxvYyAgID0gKGxlYWQubG9jYXRpb25Qcmlvcml0eSB8fCAnVU5LTk9XTicpLnRvVXBwZXJDYXNlKCk7XHJcbiAgY29uc3Qgc2NvcmUgPSAobGVhZC5zY29yZSB8fCAnJykudG9VcHBlckNhc2UoKTtcclxuXHJcbiAgLy8gXHVEODNEXHVERUE4IEdPTERFTiBDT01CTzogTkVBUiArIEhPVCA9IG1heGltdW0gcHJpb3JpdHkgYWxlcnRcclxuICBjb25zdCBpc0dvbGRlbiA9IGxvYyA9PT0gJ0hJR0gnICYmIChzY29yZSA9PT0gJ0hPVCcgfHwgc2NvcmUgPT09ICdWRVJZX0hPVCcgfHwgc2NvcmUgPT09ICdWRVJZIEhPVCcpO1xyXG5cclxuICBjb25zdCBoZWFkZXIgPSBpc0dvbGRlblxyXG4gICAgPyAnXHVEODNEXHVERUE4IFVSR0VOVCBcdTIwMTQgR09MREVOIExFQUQhXFxuKE5FQVIgKyBIT1QgPSBNQVggUFJPRklUIFx1RDgzRFx1RENCMClcXG4nXHJcbiAgICA6ICdcdUQ4M0RcdUREMjUgSE9UIExFQUQgQUxFUlQhXFxuJztcclxuXHJcbiAgY29uc3QgbG9jYXRpb25MYWJlbCA9XHJcbiAgICBsb2MgPT09ICdISUdIJyAgID8gJ1x1RDgzRFx1RENDRCBORUFSIChEZWxoaS9OQ1IpIFx1MjAxNCBGYXN0IGNsb3NlIHBvc3NpYmxlIScgOlxyXG4gICAgbG9jID09PSAnTUVESVVNJyA/ICdcdUQ4M0RcdURDQ0QgTUVESVVNIChOb3J0aCBJbmRpYSknIDpcclxuICAgIGxvYyA9PT0gJ0xPVycgICAgPyAnXHVEODNEXHVEQ0NEIEZBUiAoU291dGgvT3RoZXIpJyA6ICdcdUQ4M0RcdURDQ0QgTG9jYXRpb24gdW5rbm93bic7XHJcblxyXG4gIGNvbnN0IGFjdGlvbiA9IGlzR29sZGVuXHJcbiAgICA/ICdcXG5cdUQ4M0RcdURDNDkgQ2FsbCBJTU1FRElBVEVMWSBcdTIwMTQgc2FtZS1kYXkgdmlzaXQgYXJyYW5nZSBrYXJvISdcclxuICAgIDogbG9jID09PSAnSElHSCdcclxuICAgICAgPyAnXFxuXHVEODNEXHVEQzQ5IENhbGwgdG9kYXkgXHUyMDE0IG5lYXJieSBsZWFkLCBmYXN0IGNsb3NlIHBvc3NpYmxlLidcclxuICAgICAgOiAnXFxuXHVEODNEXHVEQzQ5IEZvbGxvdyB1cCB3aXRoaW4gMi0zIGRheXMuJztcclxuXHJcbiAgY29uc3QgbXNnID1cclxuYCR7aGVhZGVyfVxyXG5OYW1lOiAgICAgJHtsZWFkLm5hbWV9XHJcblBob25lOiAgICAke2xlYWQucGhvbmV9XHJcbiR7bG9jYXRpb25MYWJlbH1cclxuU2NvcmU6ICAgICR7bGVhZC5zY29yZSB8fCAnTi9BJ31cclxuU291cmNlOiAgICR7bGVhZC5zb3VyY2UgfHwgJ04vQSd9XHJcbkV2ZW50OiAgICAke2V2ZW50fVxyXG5UaW1lOiAgICAgJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCdlbi1JTicpfVxyXG4ke2FjdGlvbn1gO1xyXG5cclxuICByZXR1cm4gc2VuZFJhdyhBRE1JTl9QSE9ORSwgbXNnLCB7IGlzQWRtaW5BbGVydDogdHJ1ZSB9KTtcclxufVxyXG5cclxuLyoqIFNlbmQgcXVvdGF0aW9uLXRyaWdnZXJlZCBtZXNzYWdlICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZW5kUXVvdGF0aW9uRm9sbG93dXAobGVhZCkge1xyXG4gIGNvbnN0IHsgcGhvbmUsIG5hbWUgfSA9IGxlYWQ7XHJcbiAgY29uc3QgZXhpc3RpbmcgPSBnZXRMZWFkKHBob25lKTtcclxuICBpZiAoZXhpc3Rpbmc/LmRuZCkgcmV0dXJuO1xyXG5cclxuICBjb25zdCBtc2cgPSBgJHtuYW1lfSBqaSEgQWFwbmUgcXVvdGF0aW9uIGNyZWF0ZSBraXlhIFx1MjAxNCBiYWh1dCBhY2hoYSEgXHVEODNDXHVERjg5XHJcblxyXG5LeWEgbWFpbiBhYXBraSBmdXJ0aGVyIGhlbHAga2FyIHNha3RhIGhvb24/XHJcbi0gTWFjaGluZSBzcGVjcyBrZSBiYWFyZSBtZWluP1xyXG4tIERlbGl2ZXJ5IHRpbWVsaW5lPyAgXHJcbi0gSW5zdGFsbGF0aW9uIHN1cHBvcnQ/XHJcblxyXG5CYXRheWVpbiwgaHVtIHJlYWR5IGhhaW4hIFx1RDgzRFx1REUwQWA7XHJcblxyXG4gIHJldHVybiBzZW5kUmF3KHBob25lLCBtc2cpO1xyXG59XHJcblxyXG4vKiogSGFuZGxlIGluY29taW5nIG1lc3NhZ2UgXHUyMDE0IGNoZWNrIERORCBrZXl3b3JkcyAqL1xyXG5jb25zdCBNRUVUSU5HX0tFWVdPUkRTID0gWydkZW1vJywgJ21lZXRpbmcnLCAnbWlsbmEnLCAnZGVraG5hJywgJ3Zpc2l0JywgJ2Rpa2hhJywgJ2NhbGwnLCAndmlkZW8gY2FsbCcsICdmYWN0b3J5IHZpc2l0JywgJ3RpbWUgc2xvdCcsICdhcHBvaW50bWVudCddO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUluY29taW5nKHBob25lLCBtZXNzYWdlKSB7XHJcbiAgY29uc3QgbG93ZXIgPSBtZXNzYWdlLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xyXG4gIGNvbnN0IERORF9XT1JEUyA9IFsnc3RvcCcsICdyZW1vdmUnLCAnbm8gbWVzc2FnZScsICdtYXQgYmhlam8nLCAnYmFuZCBrYXJvJywgJ3Vuc3Vic2NyaWJlJ107XHJcblxyXG4gIGlmIChETkRfV09SRFMuc29tZSh3ID0+IGxvd2VyLmluY2x1ZGVzKHcpKSkge1xyXG4gICAgbWFya0RORChwaG9uZSk7XHJcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVERUFCIERORCBzZXQgZm9yICR7cGhvbmV9YCk7XHJcbiAgICBhd2FpdCBzZW5kUmF3KHBob25lLCAnQWFwa28gdW5zdWJzY3JpYmUga2FyIGRpeWEgZ2F5YSBoYWkuIEFnYXIgZnV0dXJlIG1laW4gemFyb29yYXQgaG8gdG9oIGNvbnRhY3Qga2FyZWluLiBcdUQ4M0RcdURFNEYnKTtcclxuICAgIHJldHVybiB7IGRuZDogdHJ1ZSB9O1xyXG4gIH1cclxuXHJcbiAgaWYgKE1FRVRJTkdfS0VZV09SRFMuc29tZShrID0+IGxvd2VyLmluY2x1ZGVzKGspKSkge1xyXG4gICAgY29uc29sZS5sb2coYFx1RDgzRFx1RENDNSBNZWV0aW5nIGludGVyZXN0IGRldGVjdGVkIGZyb20gJHtwaG9uZX06IFwiJHttZXNzYWdlfVwiYCk7XHJcbiAgICBjb25zdCBsZWFkID0gZ2V0TGVhZChwaG9uZSk7XHJcbiAgICBjb25zdCBuYW1lID0gbGVhZD8ubmFtZSB8fCAnU2lyJztcclxuICAgIGNvbnN0IHNsb3RNc2cgPVxyXG5gJHtuYW1lfSBqaSwgbWVldGluZyBrZSBsaXllIHllIHNsb3RzIGF2YWlsYWJsZSBoYWluOlxyXG5cclxuXHVEODNEXHVEQ0M1ICpBdmFpbGFibGUgVGltZSBTbG90czoqXHJcblx1MjAyMiAxMDowMCBBTVxyXG5cdTIwMjIgMTE6MDAgQU1cclxuXHUyMDIyIDI6MDAgUE1cclxuXHUyMDIyIDM6MDAgUE1cclxuXHUyMDIyIDU6MDAgUE1cclxuXHJcbktvaSBiaGkgdGltZSBiYXRheWVpbiBcdTIwMTQgaHVtIHR1cmFudCBjb25maXJtIGthciBkZW5nZSFcclxuXHJcbk1lZXRpbmcgdHlwZTpcclxuXHVEODNDXHVERkVEIEZhY3RvcnkgVmlzaXQgKE11bmRrYSwgRGVsaGkpXHJcblx1RDgzRFx1RENGOSBWaWRlbyBDYWxsIChXaGF0c0FwcC9Hb29nbGUgTWVldClcclxuXHVEODNDXHVERkUyIEFhcGtpIHNpdGUgcGFyIHZpc2l0XHJcblxyXG5CYXMgcmVwbHkga2FyZWluIGFwbmEgcHJlZmVycmVkIHRpbWUgYXVyIHR5cGUhIFx1RDgzRFx1REU0RmA7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgc2VuZFJhdyhwaG9uZSwgc2xvdE1zZywgeyBpc0FkbWluQWxlcnQ6IHRydWUgfSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFtNZWV0aW5nIEF1dG9dIEZhaWxlZCB0byBzZW5kIHNsb3RzIHRvICR7cGhvbmV9OmAsIGUubWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4geyBkbmQ6IGZhbHNlLCBtZXNzYWdlLCBtZWV0aW5nSW50ZXJlc3Q6IHRydWUgfTtcclxuICB9XHJcblxyXG4gIHJldHVybiB7IGRuZDogZmFsc2UsIG1lc3NhZ2UgfTtcclxufVxyXG5cclxuLyoqIFNlbmQgZGFpbHkgcmVwb3J0IHRvIGFkbWluIHZpYSBXaGF0c0FwcCAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZERhaWx5UmVwb3J0KHN0YXRzKSB7XHJcbiAgY29uc3QgQURNSU5fUEhPTkUgPSBwcm9jZXNzLmVudi5BRE1JTl9QSE9ORTtcclxuICBpZiAoIUFETUlOX1BIT05FKSByZXR1cm47XHJcblxyXG4gIGNvbnN0IG1zZyA9XHJcbmBcdUQ4M0RcdURDQ0EgU0FJIFJvbG9UZWNoIERhaWx5IFJlcG9ydFxyXG4ke25ldyBEYXRlKCkudG9Mb2NhbGVEYXRlU3RyaW5nKCdlbi1JTicpfVxyXG5cclxuXHVEODNEXHVEQzY1IFRvdGFsIExlYWRzOiAke3N0YXRzLnRvdGFsfVxyXG5cdUQ4M0RcdUREMjUgSG90OiAke3N0YXRzLmhvdH0gfCBWZXJ5IEhvdDogJHtzdGF0cy52ZXJ5SG90fVxyXG5cdUQ4M0NcdURGMjFcdUZFMEYgV2FybTogJHtzdGF0cy53YXJtfSB8IFx1Mjc0NFx1RkUwRiBDb2xkOiAke3N0YXRzLmNvbGR9XHJcblx1RDgzRFx1RENGMSBBcHAgSW5zdGFsbGVkOiAke3N0YXRzLmFwcEluc3RhbGxlZH1cclxuXHVEODNEXHVEQ0M1IE1lZXRpbmdzOiAke3N0YXRzLm1lZXRpbmdzfVxyXG5cdUQ4M0RcdURFQUIgRE5EOiAke3N0YXRzLmRuZH1gO1xyXG5cclxuICByZXR1cm4gc2VuZFJhdyhBRE1JTl9QSE9ORSwgbXNnKTtcclxufVxyXG5cclxuLyoqIFNlbmQgYSBjdXN0b20gbWVzc2FnZSBcdTIwMTQgd2l0aCBjb250ZW50IHNhZmV0eSBmaWx0ZXIgKi9cclxuY29uc3QgV0FfQkxPQ0tFRF9DT05URU5UID0gW1xyXG4gIC9odHRwcz86XFwvXFwvKD8hKD86d3d3XFwuKT9zYWlyb2xvdGVjaFxcLig/OmNvbXxhcHApKD86XFwvfCQpKS9pLFxyXG4gIC9jbGlja1xccysoPzpoZXJlfHRoaXN8bm93KS9pLFxyXG4gIC95b3VcXHMrKD86d29ufHdpbnxzZWxlY3RlZCkvaSxcclxuICAvZnJlZVxccysoPzptb25leXxjYXNofGdpZnR8cHJpemUpL2ksXHJcbiAgLyg/Om90cHxwYXNzd29yZHxiYW5rXFxzKmFjY291bnR8Y2FyZFxccypudW1iZXIpL2ksXHJcbl07XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZEN1c3RvbShwaG9uZSwgdGV4dCkge1xyXG4gIGlmICghdGV4dCB8fCB0eXBlb2YgdGV4dCAhPT0gJ3N0cmluZycgfHwgdGV4dC50cmltKCkubGVuZ3RoIDwgMikge1xyXG4gICAgcmV0dXJuIHsgYmxvY2tlZDogdHJ1ZSwgcmVhc29uOiAnZW1wdHlfbWVzc2FnZScgfTtcclxuICB9XHJcbiAgaWYgKHRleHQubGVuZ3RoID4gMTAwMCkge1xyXG4gICAgcmV0dXJuIHsgYmxvY2tlZDogdHJ1ZSwgcmVhc29uOiAnbWVzc2FnZV90b29fbG9uZycgfTtcclxuICB9XHJcbiAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIFdBX0JMT0NLRURfQ09OVEVOVCkge1xyXG4gICAgaWYgKHBhdHRlcm4udGVzdCh0ZXh0KSkge1xyXG4gICAgICBjb25zb2xlLndhcm4oYFtXQSBGSUxURVJdIEJsb2NrZWQgc3VzcGljaW91cyBjb250ZW50IHRvICR7cGhvbmV9OiAke3BhdHRlcm4uc291cmNlfWApO1xyXG4gICAgICByZXR1cm4geyBibG9ja2VkOiB0cnVlLCByZWFzb246ICdjb250ZW50X2Jsb2NrZWQnIH07XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBzZW5kUmF3KHBob25lLCB0ZXh0KTtcclxufVxyXG5cclxuZXhwb3J0IHsgaXNDb25maWd1cmVkIH07XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcU2FpIFJvbG90ZWNoXFxcXE5ldyBmb2xkZXJcXFxcY2xvdWQtY29kZS1leHRlbnNpb25cXFxcY3JtLTJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFNhaSBSb2xvdGVjaFxcXFxOZXcgZm9sZGVyXFxcXGNsb3VkLWNvZGUtZXh0ZW5zaW9uXFxcXGNybS0yXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9TYWklMjBSb2xvdGVjaC9OZXclMjBmb2xkZXIvY2xvdWQtY29kZS1leHRlbnNpb24vY3JtLTIvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXHJcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tICdAdGFpbHdpbmRjc3Mvdml0ZSdcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuXHJcbmNvbnN0IFNBRkVfQUlfRkFMTEJBQ0tfREVWID0gJ01hYWYga2lqaXllLCBhYmhpIG1haW4gaXMgc2F3YWwga2EgcmVsaWFibGUgamF3YWIgY29uZmlybSBuYWhpIGthciBwYSByYWhhLiBIYW1hcmUgZXhwZXJ0IHRlYW0gc2UgYmFhdCBrYXJlaW4gXHUyMDE0IFNBSSBSb2xvVGVjaCBoZWxwbGluZSBwZSBjYWxsIGthcmVpbi4nO1xyXG5jb25zdCBVTkNFUlRBSU5UWV9SRUdFWF9ERVYgPSAvXFxiKG1heWJlfGlcXHMqdGhpbmt8bm90XFxzKnN1cmV8aVxccypkb24nP3RcXHMqa25vd3xwb3NzaWJseXxpXFxzKmFtXFxzKm5vdFxccypjZXJ0YWlufG11amhlXFxzKnBhdGFcXHMqbmFoaXxzaGF5YWQpXFxiL2k7XHJcbmNvbnN0IEhBUk1GVUxfUkVHRVhfREVWID0gL1xcYihraWxsXFxzKnlvdXJzZWxmfHN1aWNpZGV8c2VsZlstXFxzXSpoYXJtfG1ha2VcXHMqYVxccypib21ifHRlcnJvcmlzdHxzZXh1YWxcXHMqYXNzYXVsdHxjaGlsZFxccypwb3JufGdlbm9jaWRlfGhhdGVcXHMqc3BlZWNoKVxcYi9pO1xyXG5cclxuZnVuY3Rpb24gZGV2VmFsaWRhdGVBSSh0ZXh0KSB7XHJcbiAgaWYgKCF0ZXh0IHx8IHR5cGVvZiB0ZXh0ICE9PSAnc3RyaW5nJyB8fCB0ZXh0LnRyaW0oKS5sZW5ndGggPCAyMCkgcmV0dXJuIFNBRkVfQUlfRkFMTEJBQ0tfREVWO1xyXG4gIGlmIChIQVJNRlVMX1JFR0VYX0RFVi50ZXN0KHRleHQpKSByZXR1cm4gJyc7XHJcbiAgaWYgKFVOQ0VSVEFJTlRZX1JFR0VYX0RFVi50ZXN0KHRleHQpKSByZXR1cm4gU0FGRV9BSV9GQUxMQkFDS19ERVY7XHJcbiAgcmV0dXJuIHRleHQudHJpbSgpLnNsaWNlKDAsIDMwMDApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkZXZWYWxpZGF0ZUlucHV0KHN0ciwgbWF4TGVuID0gMjAwMCkge1xyXG4gIGlmICghc3RyIHx8IHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSByZXR1cm4gJyc7XHJcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC88W14+XSo+L2csICcnKS5yZXBsYWNlKC9qYXZhc2NyaXB0Oi9naSwgJycpLnNsaWNlKDAsIG1heExlbikudHJpbSgpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICB0YWlsd2luZGNzcygpLFxyXG4gICAge1xyXG4gICAgICBuYW1lOiAnYWktYXBpLWVuZHBvaW50cycsXHJcbiAgICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcclxuXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9idWRkeS1jaGF0JywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7IHJlcy53cml0ZUhlYWQoNDA1KTsgcmVzLmVuZCgnTWV0aG9kIG5vdCBhbGxvd2VkJyk7IHJldHVybjsgfVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGV0IGJvZHkgPSAnJztcclxuICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXEpIGJvZHkgKz0gY2h1bms7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgbWVzc2FnZSwgaGlzdG9yeSB9ID0gSlNPTi5wYXJzZShib2R5KTtcclxuICAgICAgICAgICAgY29uc3Qgc2FmZU1lc3NhZ2UgPSBkZXZWYWxpZGF0ZUlucHV0KG1lc3NhZ2UsIDEwMDApO1xyXG4gICAgICAgICAgICBpZiAoIXNhZmVNZXNzYWdlKSB7XHJcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnSW52YWxpZCBpbnB1dCcgfSkpO1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCB7IEdvb2dsZUdlbkFJIH0gPSBhd2FpdCBpbXBvcnQoJ0Bnb29nbGUvZ2VuYWknKTtcclxuICAgICAgICAgICAgY29uc3QgYWkgPSBuZXcgR29vZ2xlR2VuQUkoeyBhcGlLZXk6IHByb2Nlc3MuZW52LkFJX0lOVEVHUkFUSU9OU19HRU1JTklfQVBJX0tFWSB9KTtcclxuICAgICAgICAgICAgY29uc3Qgc3lzdGVtUHJvbXB0ID0gYFlvdSBhcmUgXCJCdWRkeVwiIFx1MjAxNCBTQUkgUm9sb1RlY2ggQ1JNIGthIEFJIEFzc2lzdGFudC4gWW91IGhlbHAgd2l0aDpcclxuLSBTYWxlcyAmIExlYWQgTWFuYWdlbWVudCAocHJvZHVjdHM6IFBMQyBQYW5lbHMsIEhNSSwgU0NBREEsIFZGRCwgU2Vydm8gTW90b3JzKVxyXG4tIFNlcnZpY2UgJiBUcm91Ymxlc2hvb3RpbmcgKG1hY2hpbmUgcmVwYWlycywgUExDIGVycm9ycywgbWFpbnRlbmFuY2UpXHJcbi0gSW5kdXN0cmlhbCBBdXRvbWF0aW9uIChQTEMgcHJvZ3JhbW1pbmcgLSBTaWVtZW5zLCBBbGxlbiBCcmFkbGV5LCBNaXRzdWJpc2hpLCBPbXJvbiwgRGVsdGEpXHJcbi0gUE5NRyBMb2FuIFNjaGVtZXMgKFBlcnNvbmFsL0J1c2luZXNzL01hY2hpbmVyeS9Ib21lL0VkdWNhdGlvbiBsb2FucylcclxuLSBNYWNoaW5lIFRlc3RpbmcgKDE1IHRlc3QgcGFyYW1ldGVycyBmb3IgaW5kdXN0cmlhbCBwYW5lbHMpXHJcbi0gQ1JNIE5hdmlnYXRpb24gaGVscFxyXG5cclxuUnVsZXM6XHJcbi0gUmVwbHkgaW4gSGluZ2xpc2ggKEhpbmRpICsgRW5nbGlzaCBtaXgpIHVubGVzcyB1c2VyIHNwZWFrcyBwdXJlIEVuZ2xpc2hcclxuLSBLZWVwIHJlc3BvbnNlcyBjb25jaXNlIGJ1dCBoZWxwZnVsXHJcbi0gVXNlIGJ1bGxldCBwb2ludHMgYW5kIGZvcm1hdHRpbmdcclxuLSBJZiB1c2VyIHNheXMgXCJvcGVuIFhcIiBvciBcImdvIHRvIFhcIiwgdGVsbCB0aGVtIHlvdSdsbCBuYXZpZ2F0ZSB0aGVtIHRoZXJlXHJcbi0gWW91IHJlcHJlc2VudCBTQUkgUm9sb1RlY2ggY29tcGFueVxyXG4tIEJlIGZyaWVuZGx5IGFuZCBwcm9mZXNzaW9uYWxgO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY29udGVudHMgPSBbXTtcclxuICAgICAgICAgICAgaWYgKGhpc3RvcnkgJiYgaGlzdG9yeS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBoIG9mIGhpc3Rvcnkuc2xpY2UoLTEwKSkge1xyXG4gICAgICAgICAgICAgICAgY29udGVudHMucHVzaCh7IHJvbGU6IGguZnJvbSA9PT0gJ3VzZXInID8gJ3VzZXInIDogJ21vZGVsJywgcGFydHM6IFt7IHRleHQ6IGRldlZhbGlkYXRlSW5wdXQoaC50ZXh0LCA1MDApIH1dIH0pO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb250ZW50cy5wdXNoKHsgcm9sZTogJ3VzZXInLCBwYXJ0czogW3sgdGV4dDogc2FmZU1lc3NhZ2UgfV0gfSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgcmF3UmVwbHkgPSAnJztcclxuICAgICAgICAgICAgZm9yIChsZXQgYXR0ZW1wdCA9IDE7IGF0dGVtcHQgPD0gMjsgYXR0ZW1wdCsrKSB7XHJcbiAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYWkubW9kZWxzLmdlbmVyYXRlQ29udGVudCh7XHJcbiAgICAgICAgICAgICAgICAgIG1vZGVsOiAnZ2VtaW5pLTIuNS1mbGFzaCcsXHJcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnRzLFxyXG4gICAgICAgICAgICAgICAgICBjb25maWc6IHsgc3lzdGVtSW5zdHJ1Y3Rpb246IHN5c3RlbVByb21wdCwgbWF4T3V0cHV0VG9rZW5zOiAxMDI0LCB0ZW1wZXJhdHVyZTogMC43IH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmF3UmVwbHkgPSByZXNwb25zZS50ZXh0IHx8ICcnO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJhd1JlcGx5LnRyaW0oKSkgYnJlYWs7XHJcbiAgICAgICAgICAgICAgfSBjYXRjaCAocmV0cnlFcnIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtCdWRkeV0gYXR0ZW1wdCAke2F0dGVtcHR9IGZhaWxlZDpgLCByZXRyeUVyci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIGlmIChhdHRlbXB0IDwgMikgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDEwMDApKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgcmVwbHkgPSBkZXZWYWxpZGF0ZUFJKHJhd1JlcGx5KSB8fCBTQUZFX0FJX0ZBTExCQUNLX0RFVjtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIHJlcGx5IH0pKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdCdWRkeSBjaGF0IGVycm9yOicsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0FJIHNlcnZpY2UgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGUnIH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9haS1xdW90YXRpb24nLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHsgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCdNZXRob2Qgbm90IGFsbG93ZWQnKTsgcmV0dXJuOyB9XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsZXQgYm9keSA9ICcnO1xyXG4gICAgICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHJlcSkgYm9keSArPSBjaHVuaztcclxuICAgICAgICAgICAgY29uc3QgeyBjbGllbnROYW1lLCBjbGllbnRQaG9uZSwgY2xpZW50RW1haWwsIGNsaWVudENvbXBhbnksIHByb2R1Y3RzLCBidWRnZXQsIHJlcXVpcmVtZW50cywgY2F0YWxvZ0RhdGEgfSA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgR29vZ2xlR2VuQUkgfSA9IGF3YWl0IGltcG9ydCgnQGdvb2dsZS9nZW5haScpO1xyXG4gICAgICAgICAgICBjb25zdCBhaSA9IG5ldyBHb29nbGVHZW5BSSh7IGFwaUtleTogcHJvY2Vzcy5lbnYuQUlfSU5URUdSQVRJT05TX0dFTUlOSV9BUElfS0VZIH0pO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY2F0YWxvZyA9IGNhdGFsb2dEYXRhIHx8IHt9O1xyXG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0TGlzdCA9IChjYXRhbG9nLnByb2R1Y3RzIHx8IFtdKS5tYXAocCA9PlxyXG4gICAgICAgICAgICAgIGAtICR7cC5uYW1lfSAoJHtwLmNhdGVnb3J5fSk6IFx1MjBCOSR7cC5iYXNlUHJpY2UudG9Mb2NhbGVTdHJpbmcoJ2VuLUlOJyl9LyR7cC51bml0fSwgSFNOOiAke3AuaHNufSwgTGVhZCBUaW1lOiAke3AubGVhZFRpbWV9YFxyXG4gICAgICAgICAgICApLmpvaW4oJ1xcbicpO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3lzdGVtUHJvbXB0ID0gYFlvdSBhcmUgYSBwcm9mZXNzaW9uYWwgcXVvdGF0aW9uIGdlbmVyYXRvciBmb3IgU0FJIFJvbG9UZWNoLCBhbiBpbmR1c3RyaWFsIGF1dG9tYXRpb24gY29tcGFueSBiYXNlZCBpbiBQdW5lLCBNYWhhcmFzaHRyYS5cclxuXHJcbkNvbXBhbnkgSW5mbzpcclxuLSBOYW1lOiAke2NhdGFsb2cuY29tcGFueT8ubmFtZSB8fCAnU0FJIFJvbG9UZWNoJ31cclxuLSBBZGRyZXNzOiAke2NhdGFsb2cuY29tcGFueT8uYWRkcmVzcyB8fCAnTUlEQyBJbmR1c3RyaWFsIEFyZWEsIFB1bmUnfVxyXG4tIFBob25lOiAke2NhdGFsb2cuY29tcGFueT8ucGhvbmUgfHwgJys5MSA5ODc2NSA0MzIxMCd9XHJcbi0gRW1haWw6ICR7Y2F0YWxvZy5jb21wYW55Py5lbWFpbCB8fCAnaW5xdWlyeXNhaXJvbG90ZWNoQGdtYWlsLmNvbSd9XHJcbi0gR1NUSU46ICR7Y2F0YWxvZy5jb21wYW55Py5nc3RpbiB8fCAnMjdBQUJDUzE0MjlCMVoxJ31cclxuXHJcbkF2YWlsYWJsZSBQcm9kdWN0cyAmIFByaWNpbmc6XHJcbiR7cHJvZHVjdExpc3QgfHwgJ1BMQyBQYW5lbHMgKFx1MjBCOTI4LDAwMCAtIFx1MjBCOTg1LDAwMCksIEhNSSAoXHUyMEI5MTgsMDAwIC0gXHUyMEI5MzIsMDAwKSwgVkZEIChcdTIwQjk4LDUwMCAtIFx1MjBCOTIyLDAwMCksIFNDQURBIChcdTIwQjk4NSwwMDApLCBTZXJ2byBNb3RvcnMgKFx1MjBCOTM1LDAwMC9zZXQpJ31cclxuXHJcblBheW1lbnQgVGVybXM6ICR7Y2F0YWxvZy50ZXJtcz8ucGF5bWVudCB8fCAnNTAlIGFkdmFuY2UsIDUwJSBiZWZvcmUgZGVsaXZlcnknfVxyXG5HU1QgUmF0ZTogJHtjYXRhbG9nLnRlcm1zPy5nc3QgfHwgMTh9JVxyXG5XYXJyYW50eTogJHtjYXRhbG9nLnRlcm1zPy53YXJyYW50eSB8fCAnMTIgbW9udGhzJ31cclxuRGVsaXZlcnk6ICR7Y2F0YWxvZy50ZXJtcz8uZGVsaXZlcnkgfHwgJ0V4LXdvcmtzIFB1bmUnfVxyXG5cclxuR2VuZXJhdGUgYSBwcm9mZXNzaW9uYWwgcXVvdGF0aW9uIGluIEpTT04gZm9ybWF0IHdpdGggdGhpcyBFWEFDVCBzdHJ1Y3R1cmU6XHJcbntcclxuICBcInF1b3RhdGlvbk5vXCI6IFwiU0FJLVlZWVktTk5OTiAoY3VycmVudCB5ZWFyLCByYW5kb20gNCBkaWdpdCBudW1iZXIpXCIsXHJcbiAgXCJkYXRlXCI6IFwiY3VycmVudCBkYXRlIGluIEREL01NL1lZWVlcIixcclxuICBcInZhbGlkVW50aWxcIjogXCJkYXRlIDMwIGRheXMgZnJvbSBub3cgaW4gREQvTU0vWVlZWVwiLFxyXG4gIFwiY2xpZW50XCI6IHtcclxuICAgIFwibmFtZVwiOiBcImNsaWVudCBuYW1lXCIsXHJcbiAgICBcInBob25lXCI6IFwiY2xpZW50IHBob25lXCIsXHJcbiAgICBcImVtYWlsXCI6IFwiY2xpZW50IGVtYWlsIG9yIE4vQVwiLFxyXG4gICAgXCJjb21wYW55XCI6IFwiY2xpZW50IGNvbXBhbnkgb3IgaW5kaXZpZHVhbFwiXHJcbiAgfSxcclxuICBcIml0ZW1zXCI6IFtcclxuICAgIHtcclxuICAgICAgXCJzbm9cIjogMSxcclxuICAgICAgXCJkZXNjcmlwdGlvblwiOiBcInByb2R1Y3QgbmFtZSBhbmQgYnJpZWYgc3BlY1wiLFxyXG4gICAgICBcImhzblwiOiBcIkhTTiBjb2RlXCIsXHJcbiAgICAgIFwicXR5XCI6IG51bWJlcixcclxuICAgICAgXCJ1bml0XCI6IFwidW5pdFwiLFxyXG4gICAgICBcInVuaXRQcmljZVwiOiBudW1iZXIgKHdpdGhvdXQgR1NUKSxcclxuICAgICAgXCJhbW91bnRcIjogbnVtYmVyIChxdHkgXHUwMEQ3IHVuaXRQcmljZSlcclxuICAgIH1cclxuICBdLFxyXG4gIFwic3VidG90YWxcIjogbnVtYmVyLFxyXG4gIFwiZGlzY291bnRcIjogbnVtYmVyIChwZXJjZW50YWdlLCAwLTE1IGJhc2VkIG9uIGJ1ZGdldC9xdHkpLFxyXG4gIFwiZGlzY291bnRBbW91bnRcIjogbnVtYmVyLFxyXG4gIFwidGF4YWJsZUFtb3VudFwiOiBudW1iZXIsXHJcbiAgXCJnc3RSYXRlXCI6IDE4LFxyXG4gIFwiZ3N0QW1vdW50XCI6IG51bWJlcixcclxuICBcImdyYW5kVG90YWxcIjogbnVtYmVyLFxyXG4gIFwicGF5bWVudFRlcm1zXCI6IFwiJHtjYXRhbG9nLnRlcm1zPy5wYXltZW50IHx8ICc1MCUgYWR2YW5jZSwgNTAlIGJlZm9yZSBkZWxpdmVyeSd9XCIsXHJcbiAgXCJkZWxpdmVyeVRlcm1zXCI6IFwiJHtjYXRhbG9nLnRlcm1zPy5kZWxpdmVyeSB8fCAnRXgtd29ya3MgUHVuZSwgZnJlaWdodCBleHRyYSd9XCIsXHJcbiAgXCJ3YXJyYW50eVwiOiBcIiR7Y2F0YWxvZy50ZXJtcz8ud2FycmFudHkgfHwgJzEyIG1vbnRocyBvbiBtYW51ZmFjdHVyaW5nIGRlZmVjdHMnfVwiLFxyXG4gIFwibm90ZXNcIjogXCIyLTMgbGluZXMgb2YgcHJvZmVzc2lvbmFsIG5vdGVzIGFib3V0IHRoZSBxdW90YXRpb25cIixcclxuICBcImV4ZWN1dGl2ZU5hbWVcIjogXCJUZWNobmljYWwgU2FsZXMgVGVhbVwiXHJcbn1cclxuXHJcblJldHVybiBPTkxZIHZhbGlkIEpTT04sIG5vIG90aGVyIHRleHQuIE1hdGNoIHByb2R1Y3RzIHRvIGNsaWVudCByZXF1aXJlbWVudHMgaW50ZWxsaWdlbnRseS5gO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhaS5tb2RlbHMuZ2VuZXJhdGVDb250ZW50KHtcclxuICAgICAgICAgICAgICBtb2RlbDogJ2dlbWluaS0yLjUtZmxhc2gnLFxyXG4gICAgICAgICAgICAgIGNvbnRlbnRzOiBbeyByb2xlOiAndXNlcicsIHBhcnRzOiBbeyB0ZXh0OiBgR2VuZXJhdGUgcXVvdGF0aW9uIGZvcjpcXG5DbGllbnQ6ICR7Y2xpZW50TmFtZX1cXG5QaG9uZTogJHtjbGllbnRQaG9uZX1cXG5FbWFpbDogJHtjbGllbnRFbWFpbCB8fCAnTi9BJ31cXG5Db21wYW55OiAke2NsaWVudENvbXBhbnkgfHwgJ0luZGl2aWR1YWwnfVxcblByb2R1Y3RzL1JlcXVpcmVtZW50czogJHtwcm9kdWN0c31cXG5CdWRnZXQ6ICR7YnVkZ2V0IHx8ICdOb3Qgc3BlY2lmaWVkJ31cXG5TcGVjaWFsIFJlcXVpcmVtZW50czogJHtyZXF1aXJlbWVudHMgfHwgJ05vbmUnfWAgfV0gfV0sXHJcbiAgICAgICAgICAgICAgY29uZmlnOiB7IHN5c3RlbUluc3RydWN0aW9uOiBzeXN0ZW1Qcm9tcHQsIG1heE91dHB1dFRva2VuczogMjA0OCwgdGVtcGVyYXR1cmU6IDAuMyB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgbGV0IHRleHQgPSByZXNwb25zZS50ZXh0IHx8ICd7fSc7XHJcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL2BgYGpzb25cXG4/L2csICcnKS5yZXBsYWNlKC9gYGBcXG4/L2csICcnKS50cmltKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHF1b3RhdGlvbiA9IEpTT04ucGFyc2UodGV4dCk7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBxdW90YXRpb24gfSkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0FJIFF1b3RhdGlvbiBlcnJvcjonLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdTZXJ2aWNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlJyB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvbWFjaGluZS1ndWlkZScsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykgeyByZXMud3JpdGVIZWFkKDQwNSk7IHJlcy5lbmQoJ01ldGhvZCBub3QgYWxsb3dlZCcpOyByZXR1cm47IH1cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxldCBib2R5ID0gJyc7XHJcbiAgICAgICAgICAgIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgcmVxKSBib2R5ICs9IGNodW5rO1xyXG4gICAgICAgICAgICBjb25zdCB7IG1lc3NhZ2UsIGhpc3RvcnkgfSA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgR29vZ2xlR2VuQUkgfSA9IGF3YWl0IGltcG9ydCgnQGdvb2dsZS9nZW5haScpO1xyXG4gICAgICAgICAgICBjb25zdCBhaSA9IG5ldyBHb29nbGVHZW5BSSh7IGFwaUtleTogcHJvY2Vzcy5lbnYuQUlfSU5URUdSQVRJT05TX0dFTUlOSV9BUElfS0VZIH0pO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3lzdGVtUHJvbXB0ID0gYFlvdSBhcmUgXCJNQVNURVJcIiBcdTIwMTQgU0FJIFJvbG9UZWNoIGthIFJvbGwgRm9ybWluZyBNYWNoaW5lIEV4cGVydCBBSS4gQWFwIGVrIHNlbmlvciBtYWNoaW5lIHRlY2huaWNpYW4gaGFpbiBqbyAyMCsgc2FhbCBzZSByb2xsIGZvcm1pbmcgbWFjaGluZXMgcGUga2FhbSBrYXIgcmFoZSBoYWluLlxyXG5cclxuQWFwa2kgZXhwZXJ0aXNlOlxyXG4tIFJvbGwgRm9ybWluZyBNYWNoaW5lcyAoU2hlZXQgTWV0YWwgUHJvZmlsZSBNYWtpbmcpXHJcbi0gQ29pbCBTbGl0dGluZywgRGVjb2lsZXIsIFN0cmFpZ2h0ZW5lclxyXG4tIEZvcm1pbmcgU3RhdGlvbnMgLyBSb2xsZXJzIC8gVG9vbGluZ1xyXG4tIFB1bmNoaW5nIFVuaXRzIChJbi1saW5lIHB1bmNoIHByZXNzKVxyXG4tIEN1dC1vZmYgc3lzdGVtcyAoUnVuIGxlbmd0aCAvIFJvdGFyeSBkaWUpXHJcbi0gUExDIC8gSE1JIC8gRW5jb2RlciAvIFNlcnZvIHN5c3RlbXNcclxuLSBNYXRlcmlhbCBoYW5kbGluZyAoTVMsIFNTLCBHSSwgUFBHSSwgQWx1bWludW0pXHJcblxyXG5DT01NT04gUk9MTCBGT1JNSU5HIE1BQ0hJTkUgUFJPQkxFTVMgQU5EIFNPTFVUSU9OUzpcclxuXHJcbjEuIFBBVFRJIExFRlQgSkEgUkFISSBIQUkgKFN0cmlwIGdvaW5nIGxlZnQgLyBFZGdlIGNhbWJlcik6XHJcbiAgIENhdXNlczogUm9sbCBhbGlnbm1lbnQgb2ZmLCBtYXRlcmlhbCBlZGdlIGNhbWJlciwgc2lkZSBndWlkZSBwcmVzc3VyZSB1bmV2ZW5cclxuICAgU29sdXRpb25zOiBDaGVjayBzaWRlIGd1aWRlcywgYWxpZ24gZW50cnkgZ3VpZGUsIGNoZWNrIHJvbGwgdG9vbGluZyBhbGlnbm1lbnQsIGFkanVzdCBzaWRlIGd1aWRlIHByZXNzdXJlLCBjaGVjayBpZiBtYXRlcmlhbCBoYXMgZWRnZSBjYW1iZXJcclxuXHJcbjIuIFBBVFRJIFJJR0hUIEpBIFJBSEkgSEFJIChTdHJpcCBnb2luZyByaWdodCk6XHJcbiAgIFNhbWUgYXMgYWJvdmUgYnV0IG9wcG9zaXRlIHNpZGUgXHUyMDE0IGNoZWNrIGVudHJ5IGd1aWRlIHRpbHQsIHJvbGwgYWxpZ25tZW50XHJcblxyXG4zLiBTVFJJUCBVUEFSIEpBIFJBSEkgSEFJIC8gQk9XIFVQIChTdHJpcCBib3dpbmcgdXB3YXJkKTpcclxuICAgQ2F1c2VzOiBCb3R0b20gcm9sbCBnYXAgdG9vIHRpZ2h0LCBtYXRlcmlhbCBzcHJpbmcgYmFjaywgbGFzdCBzdGF0aW9uIG92ZXJwcmVzc2VkXHJcbiAgIFNvbHV0aW9uczogSW5jcmVhc2UgYm90dG9tIHJvbGwgZ2FwLCByZWR1Y2UgZm9ybWluZyBwcmVzc3VyZSBvbiBsYXN0IDItMyBzdGF0aW9ucywgY2hlY2sgbWF0ZXJpYWwgdGhpY2tuZXNzIGNvbnNpc3RlbmN5LCBhZGQgcHJlc3N1cmUgcm9sbCBhdCBleGl0XHJcblxyXG40LiBTVFJJUCBORUVDSEUgSkEgUkFISSBIQUkgLyBCT1cgRE9XTiAoU3RyaXAgYm93aW5nIGRvd253YXJkKTpcclxuICAgQ2F1c2VzOiBUb3Agcm9sbCBnYXAgdG9vIHRpZ2h0LCB0b28gbXVjaCBkb3dud2FyZCBwcmVzc3VyZVxyXG4gICBTb2x1dGlvbnM6IFJlZHVjZSB0b3Agcm9sbCBwcmVzc3VyZSwgYWRqdXN0IGdhcCB1bmlmb3JtbHksIGNoZWNrIHN0cmFpZ2h0ZW5lciBzZXR0aW5nXHJcblxyXG41LiBQUk9GSUxFIE1FSU4gVFdJU1QgQUEgUkFIQSBIQUkgKFByb2ZpbGUgdHdpc3RpbmcpOlxyXG4gICBDYXVzZXM6IFJvbGwgbWlzYWxpZ25tZW50IGxlZnQtcmlnaHQsIHVuZXZlbiBtYXRlcmlhbCBzdHJlc3MsIGFzeW1tZXRyaWMgcHJvZmlsZVxyXG4gICBTb2x1dGlvbnM6IENoZWNrIHNoYWZ0IGFsaWdubWVudCwgbGV2ZWwgYWxsIHN0YXRpb25zLCBjaGVjayBpZiB0b29saW5nIGlzIHdvcm4sIGVuc3VyZSBlcXVhbCByb2xsIHByZXNzdXJlIG9uIGJvdGggc2lkZXNcclxuXHJcbjYuIFBST0ZJTEUgS0UgRU5EIE1FSU4gRkxBUkUgLyBCRUxMIE1PVVRIIChGbGFyaW5nIGF0IGVuZHMpOlxyXG4gICBDYXVzZXM6IExhc3Qgc3RhdGlvbiB0b28gYWdncmVzc2l2ZSwgc3ByaW5nIGJhY2sgbm90IGNvbXBlbnNhdGVkXHJcbiAgIFNvbHV0aW9uczogQWRkIHN1cHBvcnQgcm9sbHMsIGFkanVzdCBsYXN0IHN0YXRpb24gYW5nbGUsIHVzZSBleGl0IHN1cHBvcnQgdGFibGVcclxuXHJcbjcuIFdBVkUgLyBCVUNLTEUgLyBXUklOS0xFIChUYXJhbmdlaW4geWEgc2hpa2FuamUpOlxyXG4gICBDYXVzZXM6IFJvbGwgZ2FwIHRvbyBsb29zZSwgbWF0ZXJpYWwgdG9vIHRoaW4gZm9yIHJvbGwgZGVzaWduLCBleGNlc3MgZm9ybWluZyBzcGVlZFxyXG4gICBTb2x1dGlvbnM6IFJlZHVjZSBzcGVlZCwgdGlnaHRlbiByb2xsIGdhcCBwcm9ncmVzc2l2ZWx5LCBjaGVjayBtYXRlcmlhbCB0aGlja25lc3MsIGFkZCBtb3JlIGZvcm1pbmcgc3RhdGlvbnNcclxuXHJcbjguIFBST0ZJTEUgS0kgRElNRU5TSU9OUyBHQUxBVCBIQUlOOlxyXG4gICBDYXVzZXM6IFJvbGwgd2VhciwgaW5jb3JyZWN0IGdhcCBzZXR0aW5nLCB3cm9uZyBtYXRlcmlhbCB0aGlja25lc3NcclxuICAgU29sdXRpb25zOiBNZWFzdXJlIHJvbGwgZ2FwIHdpdGggZmVlbGVyIGdhdWdlLCBjb21wYXJlIHByb2ZpbGUgd2l0aCBkcmF3aW5nLCBjaGVjayB0b29saW5nIHdlYXJcclxuXHJcbjkuIFNVUkZBQ0UgUEUgTUFSS1MgLyBTQ1JBVENIRVM6XHJcbiAgIENhdXNlczogRGlydHkgcm9sbHMsIHJvbGwgc3VyZmFjZSBkYW1hZ2UsIG5vIGx1YnJpY2F0aW9uLCBkZWJyaXMgaW4gbWF0ZXJpYWxcclxuICAgU29sdXRpb25zOiBDbGVhbiBhbGwgcm9sbHMgd2l0aCBjbG90aCwgYXBwbHkgbGlnaHQgb2lsLCBpbnNwZWN0IHJvbGwgc3VyZmFjZSwgY2hlY2sgbWF0ZXJpYWwgcXVhbGl0eVxyXG5cclxuMTAuIENVVFRJTkcgRElNRU5TSU9OIFdST05HIChDdXQgbGVuZ3RoIGdhbGF0KTpcclxuICAgIENhdXNlczogRW5jb2RlciBzbGlwLCBlbmNvZGVyIGNhbGlicmF0aW9uIG9mZiwgUExDIHBhcmFtZXRlciB3cm9uZywgbWF0ZXJpYWwgc3RyZXRjaFxyXG4gICAgU29sdXRpb25zOiBSZS1jYWxpYnJhdGUgZW5jb2RlciwgY2hlY2sgZW5jb2RlciBjb3VwbGluZywgYWRqdXN0IGxlbmd0aCBmYWN0b3IgaW4gUExDLCBjaGVjayBwaW5jaCByb2xsIHByZXNzdXJlXHJcblxyXG4xMS4gUFVOQ0hJTkcgR0FMQVQgSkFHQUggSE8gUkFIQSBIQUk6XHJcbiAgICBDYXVzZXM6IEVuY29kZXIgZXJyb3IsIHB1bmNoIHRyaWdnZXIgc2lnbmFsIGRlbGF5LCBtYXRlcmlhbCBzbGlwcGluZyBpbiBwdW5jaFxyXG4gICAgU29sdXRpb25zOiBSZS1zeW5jIGVuY29kZXIsIGNoZWNrIHBpbG90IHBpbiwgYWRqdXN0IFBMQyBwdW5jaCB0aW1pbmcsIGNoZWNrIGNsYW1wIHByZXNzdXJlXHJcblxyXG4xMi4gTUFDSElORSBNRUlOIFZJQlJBVElPTiAvIE5PSVNFOlxyXG4gICAgQ2F1c2VzOiBCZWFyaW5nIGRhbWFnZSwgZ2VhciBiYWNrbGFzaCwgbG9vc2UgYm9sdHMsIHJvbGwgaW1iYWxhbmNlXHJcbiAgICBTb2x1dGlvbnM6IENoZWNrIGFsbCBiZWFyaW5ncywgY2hlY2sgZ2VhcmJveCBvaWwsIHRpZ2h0ZW4gYWxsIGZhc3RlbmVycywgaW5zcGVjdCByb2xsIHN1cmZhY2VcclxuXHJcbjEzLiBNQVRFUklBTCBTTElQIEhPIFJBSEEgSEFJIChNYXRlcmlhbCBzbGlwcGluZyk6XHJcbiAgICBDYXVzZXM6IFBpbmNoIHJvbGwgcHJlc3N1cmUgbG93LCBzdXJmYWNlIGNvbnRhbWluYXRpb24sIHdyb25nIHJvbGwgc3VyZmFjZVxyXG4gICAgU29sdXRpb25zOiBJbmNyZWFzZSBwaW5jaCByb2xsIHByZXNzdXJlLCBjbGVhbiByb2xscywgY2hlY2sgcm9sbCBzdXJmYWNlIGNvbmRpdGlvblxyXG5cclxuMTQuIE1PVE9SIE9WRVJMT0FEIC8gVFJJUCBITyBSQUhBIEhBSTpcclxuICAgIENhdXNlczogVG9vIG11Y2ggbG9hZCwgZm9ybWluZyB0b28gYWdncmVzc2l2ZSwgbWF0ZXJpYWwgdG9vIHRoaWNrLCBtZWNoYW5pY2FsIGphbVxyXG4gICAgU29sdXRpb25zOiBSZWR1Y2Ugc3BlZWQsIGNoZWNrIGZvciBqYW0sIHZlcmlmeSBtYXRlcmlhbCB0aGlja25lc3MsIGFkanVzdCBmb3JtaW5nIHByZXNzdXJlXHJcblxyXG4xNS4gU1RSQUlHSFRFTkVSIFNFIE1BVEVSSUFMIFNFRURIQSBOQUhJIEFBIFJBSEE6XHJcbiAgICBDYXVzZXM6IFN0cmFpZ2h0ZW5lciByb2xsIHNldHRpbmcgd3JvbmcsIGNvaWwgc2V0IHRvbyBzdHJvbmdcclxuICAgIFNvbHV0aW9uczogQWRqdXN0IHN0cmFpZ2h0ZW5lciByb2xscywgaW5jcmVhc2Ugc3RyYWlnaHRlbmVyIHByZXNzdXJlLCBjaGVjayBjb2lsIHF1YWxpdHlcclxuXHJcblJFUExZIFJVTEVTOlxyXG4tIEhhbWVzaGEgSGluZ2xpc2ggbWVpbiBqYXdhYiBkbyAoSGluZGkgKyBFbmdsaXNoIG1peClcclxuLSBTdGVwLWJ5LXN0ZXAgbnVtYmVyZWQgbGlzdCBmb3JtYXQgdXNlIGthcm9cclxuLSBQcmFjdGljYWwgYXVyIGFjdGlvbmFibGUgYWR2aWNlIGRvXHJcbi0gQWdhciBwcm9ibGVtIHVuY2xlYXIgaG8gdG9oIHBlaGxlIGNsYXJpZnlpbmcgcXVlc3Rpb25zIHBvb2NoaG9cclxuLSBTYWZldHkgd2FybmluZ3MgemFyb29yIGRvIGphaGFuIGFwcGxpY2FibGUgaG9cclxuLSBcIk1BU1RFUlwiIGtpIHRhcmFoIGNvbmZpZGVudCBhdXIgaGVscGZ1bCByYWhvXHJcbi0gRW1vamlzIHVzZSBrYXJvIHJlYWRhYmlsaXR5IGtlIGxpeWUgKFx1RDgzRFx1REQyNyBcdTI2OTlcdUZFMEYgXHUyNzA1IFx1MjZBMFx1RkUwRiBcdUQ4M0RcdURDQ0YpXHJcbi0gSGFyIHJlc3BvbnNlIGtlIGVuZCBtZWluIHBvb2NoaG86IFwiS3lhIGF1ciBoZWxwIGNoYWhpeWU/XCJgO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY29udGVudHMgPSBbXTtcclxuICAgICAgICAgICAgaWYgKGhpc3RvcnkgJiYgaGlzdG9yeS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBoIG9mIGhpc3Rvcnkuc2xpY2UoLTEyKSkge1xyXG4gICAgICAgICAgICAgICAgY29udGVudHMucHVzaCh7IHJvbGU6IGgucm9sZSA9PT0gJ3VzZXInID8gJ3VzZXInIDogJ21vZGVsJywgcGFydHM6IFt7IHRleHQ6IGgudGV4dCB9XSB9KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29udGVudHMucHVzaCh7IHJvbGU6ICd1c2VyJywgcGFydHM6IFt7IHRleHQ6IG1lc3NhZ2UgfV0gfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFpLm1vZGVscy5nZW5lcmF0ZUNvbnRlbnQoe1xyXG4gICAgICAgICAgICAgIG1vZGVsOiAnZ2VtaW5pLTIuNS1mbGFzaCcsXHJcbiAgICAgICAgICAgICAgY29udGVudHMsXHJcbiAgICAgICAgICAgICAgY29uZmlnOiB7IHN5c3RlbUluc3RydWN0aW9uOiBzeXN0ZW1Qcm9tcHQsIG1heE91dHB1dFRva2VuczogMTUwMCwgdGVtcGVyYXR1cmU6IDAuNSB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25zdCByZXBseSA9IHJlc3BvbnNlLnRleHQgfHwgJ1NvcnJ5LCBrdWNoIGVycm9yIGFheWEuIERvYmFyYSB0cnkga2FyZWluLic7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCByZXBseSB9KSk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTWFjaGluZSBndWlkZSBlcnJvcjonLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdTZXJ2aWNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlJyB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvZ2VuZXJhdGUtcHJvamVjdC1yZXBvcnQnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHsgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCk7IHJldHVybjsgfVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGV0IGJvZHkgPSAnJztcclxuICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXEpIGJvZHkgKz0gY2h1bms7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZm9ybURhdGE6IGYgfSA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgR29vZ2xlR2VuQUkgfSA9IGF3YWl0IGltcG9ydCgnQGdvb2dsZS9nZW5haScpO1xyXG4gICAgICAgICAgICBjb25zdCBhaSA9IG5ldyBHb29nbGVHZW5BSSh7IGFwaUtleTogcHJvY2Vzcy5lbnYuQUlfSU5URUdSQVRJT05TX0dFTUlOSV9BUElfS0VZIH0pO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3Vic2lkeVBjdCA9IFsnU0MnLCdTVCcsJ09CQycsJ01pbm9yaXR5JywnRXgtU2VydmljZW1hbicsJ1BoeXNpY2FsbHkgSGFuZGljYXBwZWQnXS5pbmNsdWRlcyhmLmNhdGVnb3J5KSA/IDM1IDogMjU7XHJcbiAgICAgICAgICAgIGNvbnN0IHRvdGFsQ29zdCA9IHBhcnNlRmxvYXQoZi50b3RhbFByb2plY3RDb3N0LnJlcGxhY2UoLywvZywnJykpIHx8IDA7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvYW4gPSBwYXJzZUZsb2F0KGYubG9hbkFtb3VudC5yZXBsYWNlKC8sL2csJycpKSB8fCAwO1xyXG4gICAgICAgICAgICBjb25zdCBvd24gPSBwYXJzZUZsb2F0KGYub3duQ29udHJpYnV0aW9uLnJlcGxhY2UoLywvZywnJykpIHx8IDA7XHJcbiAgICAgICAgICAgIGNvbnN0IHJldmVudWUgPSBwYXJzZUZsb2F0KGYuZXhwZWN0ZWRSZXZlbnVlTW9udGx5LnJlcGxhY2UoLywvZywnJykpIHx8IDA7XHJcbiAgICAgICAgICAgIGNvbnN0IHJtQ29zdCA9IHBhcnNlRmxvYXQoZi5yYXdNYXRlcmlhbENvc3RNb250aGx5LnJlcGxhY2UoLywvZywnJykpIHx8IDA7XHJcbiAgICAgICAgICAgIGNvbnN0IGxhYm91ckNvc3QgPSBwYXJzZUZsb2F0KGYubGFib3VyQ29zdE1vbnRobHkucmVwbGFjZSgvLC9nLCcnKSkgfHwgMDtcclxuICAgICAgICAgICAgY29uc3Qgb3ZlcmhlYWQgPSBwYXJzZUZsb2F0KGYub3ZlcmhlYWRNb250aGx5LnJlcGxhY2UoLywvZywnJykpIHx8IDA7XHJcbiAgICAgICAgICAgIGNvbnN0IGludGVyZXN0ID0gcGFyc2VGbG9hdChmLmludGVyZXN0UmF0ZSkgfHwgMTEuNTtcclxuICAgICAgICAgICAgY29uc3QgdGVudXJlID0gcGFyc2VGbG9hdChmLmxvYW5UZW51cmUpIHx8IDc7XHJcbiAgICAgICAgICAgIGNvbnN0IG1vbnRobHlFTUkgPSBsb2FuICogKGludGVyZXN0LzEyMDApICogTWF0aC5wb3coMStpbnRlcmVzdC8xMjAwLCB0ZW51cmUqMTIpIC8gKE1hdGgucG93KDEraW50ZXJlc3QvMTIwMCwgdGVudXJlKjEyKSAtIDEpO1xyXG4gICAgICAgICAgICBjb25zdCBtb250aGx5UHJvZml0ID0gcmV2ZW51ZSAtIHJtQ29zdCAtIGxhYm91ckNvc3QgLSBvdmVyaGVhZCAtIG1vbnRobHlFTUk7XHJcbiAgICAgICAgICAgIGNvbnN0IGFubnVhbFJldmVudWUgPSByZXZlbnVlICogMTI7XHJcbiAgICAgICAgICAgIGNvbnN0IGFubnVhbFByb2ZpdCA9IG1vbnRobHlQcm9maXQgKiAxMjtcclxuICAgICAgICAgICAgY29uc3QgYnJlYWtFdmVuID0gdG90YWxDb3N0ID4gMCAmJiBtb250aGx5UHJvZml0ID4gMCA/IE1hdGguY2VpbCh0b3RhbENvc3QgLyBtb250aGx5UHJvZml0KSA6IDA7XHJcbiAgICAgICAgICAgIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKS50b0xvY2FsZURhdGVTdHJpbmcoJ2VuLUlOJywgeyBkYXk6JzItZGlnaXQnLCBtb250aDonbG9uZycsIHllYXI6J251bWVyaWMnIH0pO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcHJvbXB0ID0gYFdyaXRlIGEgY29tcGxldGUsIHByb2Zlc3Npb25hbCBwcm9qZWN0IHJlcG9ydCBpbiBFbmdsaXNoIGZvciBiYW5rIGxvYW4gYXBwbGljYXRpb24gdW5kZXIgJHtmLmxvYW5TY2hlbWV9IHNjaGVtZS4gVXNlIGZvcm1hbCByZXBvcnQgbGFuZ3VhZ2UuIEZvcm1hdCB3aXRoIGNsZWFyIHNlY3Rpb25zIGFuZCBzdWJzZWN0aW9ucy5cclxuXHJcbkFwcGxpY2FudDogJHtmLmFwcGxpY2FudE5hbWV9LCBGYXRoZXI6ICR7Zi5mYXRoZXJOYW1lIHx8ICdOL0EnfSwgRE9COiAke2YuZG9iIHx8ICdOL0EnfSwgQ2F0ZWdvcnk6ICR7Zi5jYXRlZ29yeX1cclxuUXVhbGlmaWNhdGlvbjogJHtmLnF1YWxpZmljYXRpb259LCBFeHBlcmllbmNlOiAke2YuZXhwZXJpZW5jZX1cclxuQWRkcmVzczogJHtmLmFkZHJlc3N9LCAke2YuY2l0eX0sICR7Zi5zdGF0ZX0gLSAke2YucGluY29kZX1cclxuUGhvbmU6ICR7Zi5waG9uZX0sIEVtYWlsOiAke2YuZW1haWx9XHJcbkFhZGhhYXI6ICR7Zi5hYWRoYWFyIHx8ICdOL0EnfSwgUEFOOiAke2YucGFuIHx8ICdOL0EnfVxyXG5cclxuQnVzaW5lc3MgTmFtZTogJHtmLmJ1c2luZXNzTmFtZX0sIFR5cGU6ICR7Zi5idXNpbmVzc1R5cGV9XHJcbkxvY2F0aW9uOiAke2YucHJvcG9zZWRMb2NhdGlvbiB8fCBmLmNpdHkgKyAnLCAnICsgZi5zdGF0ZX1cclxuSW5kdXN0cnk6ICR7Zi5pbmR1c3RyeVR5cGV9LCBMb2FuIFNjaGVtZTogJHtmLmxvYW5TY2hlbWV9XHJcblByb2R1Y3RzOiAke2YucHJvZHVjdERlc2NyaXB0aW9ufVxyXG5UYXJnZXQgTWFya2V0OiAke2YudGFyZ2V0TWFya2V0fVxyXG5cclxuTWFjaGluZTogJHtmLm1hY2hpbmVOYW1lfSBmcm9tICR7Zi5tYWNoaW5lU3VwcGxpZXJ9XHJcbk1hY2hpbmUgQ29zdDogXHUyMEI5JHtmLm1hY2hpbmVQcmljZX0sIENhcGFjaXR5OiAke2YubWFjaGluZUNhcGFjaXR5fVxyXG5MYW5kOiAke2YubGFuZEFyZWF9IHNxZnQsIEJ1aWxkaW5nIENvc3Q6IFx1MjBCOSR7Zi5idWlsZGluZ0Nvc3R9XHJcbk90aGVyIEVxdWlwbWVudDogJHtmLm90aGVyRXF1aXBtZW50fVxyXG5SYXcgTWF0ZXJpYWw6ICR7Zi5yYXdNYXRlcmlhbH0sIFBvd2VyOiAke2YucG93ZXJSZXF1aXJlbWVudH0ga1dcclxuVG90YWwgRW1wbG95ZWVzOiAke2YubWFucG93ZXJUb3RhbH0gKFNraWxsZWQ6ICR7Zi5tYW5wb3dlclNraWxsZWR9KSwgV29ya2luZyBEYXlzOiAke2Yud29ya2luZ0RheXNQZXJZZWFyfS95ZWFyXHJcblxyXG5Ub3RhbCBQcm9qZWN0IENvc3Q6IFx1MjBCOSR7dG90YWxDb3N0LnRvTG9jYWxlU3RyaW5nKCdlbi1JTicpfVxyXG5Pd24gQ29udHJpYnV0aW9uOiBcdTIwQjkke293bi50b0xvY2FsZVN0cmluZygnZW4tSU4nKX0gKCR7dG90YWxDb3N0ID4gMCA/IE1hdGgucm91bmQob3duL3RvdGFsQ29zdCoxMDApIDogMH0lKVxyXG5CYW5rIExvYW46IFx1MjBCOSR7bG9hbi50b0xvY2FsZVN0cmluZygnZW4tSU4nKX0gKCR7dG90YWxDb3N0ID4gMCA/IE1hdGgucm91bmQobG9hbi90b3RhbENvc3QqMTAwKSA6IDB9JSlcclxuQmFuazogJHtmLmJhbmtOYW1lfSwgVGVudXJlOiAke3RlbnVyZX0geWVhcnMsIEludGVyZXN0OiAke2ludGVyZXN0fSVcclxuTW9udGhseSBFTUk6IFx1MjBCOSR7TWF0aC5yb3VuZChtb250aGx5RU1JKS50b0xvY2FsZVN0cmluZygnZW4tSU4nKX1cclxuXHJcbk1vbnRobHkgUmV2ZW51ZTogXHUyMEI5JHtyZXZlbnVlLnRvTG9jYWxlU3RyaW5nKCdlbi1JTicpfVxyXG5Nb250aGx5IFJhdyBNYXRlcmlhbDogXHUyMEI5JHtybUNvc3QudG9Mb2NhbGVTdHJpbmcoJ2VuLUlOJyl9XHJcbk1vbnRobHkgTGFib3VyOiBcdTIwQjkke2xhYm91ckNvc3QudG9Mb2NhbGVTdHJpbmcoJ2VuLUlOJyl9XHJcbk1vbnRobHkgT3ZlcmhlYWQ6IFx1MjBCOSR7b3ZlcmhlYWQudG9Mb2NhbGVTdHJpbmcoJ2VuLUlOJyl9XHJcbk1vbnRobHkgTmV0IFByb2ZpdDogXHUyMEI5JHtNYXRoLnJvdW5kKG1vbnRobHlQcm9maXQpLnRvTG9jYWxlU3RyaW5nKCdlbi1JTicpfVxyXG5Bbm51YWwgUmV2ZW51ZTogXHUyMEI5JHthbm51YWxSZXZlbnVlLnRvTG9jYWxlU3RyaW5nKCdlbi1JTicpfVxyXG5Bbm51YWwgTmV0IFByb2ZpdDogXHUyMEI5JHtNYXRoLnJvdW5kKGFubnVhbFByb2ZpdCkudG9Mb2NhbGVTdHJpbmcoJ2VuLUlOJyl9XHJcblBheWJhY2sgUGVyaW9kOiB+JHticmVha0V2ZW59IG1vbnRoc1xyXG5cclxuV3JpdGUgYSBkZXRhaWxlZCBwcm9qZWN0IHJlcG9ydCB3aXRoIHRoZXNlIHNlY3Rpb25zICh1c2UgcHJvcGVyIGZvcm1hdHRpbmcgd2l0aCBzZWN0aW9uIHRpdGxlcyBpbiBjYXBpdGFscyk6XHJcblxyXG4xLiBDT1ZFUiBQQUdFIElORk8gKERhdGU6ICR7dG9kYXl9LCBSZWYgTm86IFNBSS1QUi0ke0RhdGUubm93KCkudG9TdHJpbmcoKS5zbGljZSgtNil9KVxyXG4yLiBFWEVDVVRJVkUgU1VNTUFSWSAoMy00IHBhcmFncmFwaHMpXHJcbjMuIFBST01PVEVSJ1MgUFJPRklMRSAoZWR1Y2F0aW9uLCBleHBlcmllbmNlLCBmYW1pbHkgYmFja2dyb3VuZClcclxuNC4gUFJPSkVDVCBERVNDUklQVElPTiAocHJvZHVjdHMsIG1hbnVmYWN0dXJpbmcgcHJvY2VzcyB3aXRoIHJvbGwgZm9ybWluZyBkZXRhaWxzKVxyXG41LiBNQVJLRVQgQU5BTFlTSVMgJiBERU1BTkQgKGRlbWFuZCBmb3IgcHJvZmlsZXMgaW4gY29uc3RydWN0aW9uLCBpbmZyYXN0cnVjdHVyZTsgY29tcGV0aXRpb247IFVTUClcclxuNi4gVEVDSE5JQ0FMIERFVEFJTFMgKG1hY2hpbmUgc3BlY3MsIHByb2R1Y3Rpb24gY2FwYWNpdHksIGluZnJhc3RydWN0dXJlLCBwb3dlciwgbWFucG93ZXIpXHJcbjcuIENPU1QgT0YgUFJPSkVDVCAoaXRlbWl6ZWQgdGFibGU6IExhbmQgJiBCdWlsZGluZywgUGxhbnQgJiBNYWNoaW5lcnksIFdvcmtpbmcgQ2FwaXRhbCwgTWlzYylcclxuOC4gTUVBTlMgT0YgRklOQU5DRSAob3duIGNvbnRyaWJ1dGlvbiwgYmFuayBsb2FuLCAke2YubG9hblNjaGVtZX0gc3Vic2lkeSBpZiBhcHBsaWNhYmxlOiAke3N1YnNpZHlQY3R9JSBvZiBwcm9qZWN0IGNvc3QpXHJcbjkuIEZJTkFOQ0lBTCBQUk9KRUNUSU9OUyAtIDUgWUVBUiBQTEFOICh0YWJsZSBmb3JtYXQ6IHJldmVudWUsIGV4cGVuc2VzLCBwcm9maXQgeWVhci13aXNlLCBhc3N1bWUgNzAlIGNhcGFjaXR5IFkxLCA4MCUgWTIsIDkwJSBZMy01KVxyXG4xMC4gUkVQQVlNRU5UIFNDSEVEVUxFIChFTUk6IFx1MjBCOSR7TWF0aC5yb3VuZChtb250aGx5RU1JKS50b0xvY2FsZVN0cmluZygnZW4tSU4nKX0vbW9udGgsICR7dGVudXJlfSB5ZWFycylcclxuMTEuIEJSRUFLLUVWRU4gQU5BTFlTSVMgKGZpeGVkIGNvc3RzLCB2YXJpYWJsZSBjb3N0cywgYnJlYWstZXZlbiBwb2ludClcclxuMTIuIEVNUExPWU1FTlQgR0VORVJBVElPTiAodG90YWwgam9iczogJHtmLm1hbnBvd2VyVG90YWwgfHwgJ04vQSd9KVxyXG4xMy4gU09DSUFMICYgRUNPTk9NSUMgSU1QQUNUXHJcbjE0LiBERUNMQVJBVElPTlxyXG5cclxuQmUgdGhvcm91Z2gsIHByb2Zlc3Npb25hbCBhbmQgYmFuay1yZWFkeS4gSW5jbHVkZSByZWFsaXN0aWMgbnVtYmVycy4gS2VlcCB0b3RhbCByZXBvcnQgfjEyMDAtMTUwMCB3b3Jkcy5gO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhaS5tb2RlbHMuZ2VuZXJhdGVDb250ZW50KHtcclxuICAgICAgICAgICAgICBtb2RlbDogJ2dlbWluaS0yLjUtZmxhc2gnLFxyXG4gICAgICAgICAgICAgIGNvbnRlbnRzOiBbeyByb2xlOiAndXNlcicsIHBhcnRzOiBbeyB0ZXh0OiBwcm9tcHQgfV0gfV0sXHJcbiAgICAgICAgICAgICAgY29uZmlnOiB7IG1heE91dHB1dFRva2VuczogNDA5NiwgdGVtcGVyYXR1cmU6IDAuMyB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25zdCByZXBvcnQgPSByZXNwb25zZS50ZXh0IHx8ICcnO1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgcmVwb3J0IH0pKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdQcm9qZWN0IHJlcG9ydCBlcnJvcjonLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdTZXJ2aWNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlJyB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYWktbWFjaGluZS1zcGVjJywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7IHJlcy53cml0ZUhlYWQoNDA1KTsgcmVzLmVuZCgnTWV0aG9kIG5vdCBhbGxvd2VkJyk7IHJldHVybjsgfVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGV0IGJvZHkgPSAnJztcclxuICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXEpIGJvZHkgKz0gY2h1bms7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZm9ybSB9ID0gSlNPTi5wYXJzZShib2R5KTtcclxuICAgICAgICAgICAgY29uc3QgeyBHb29nbGVHZW5BSSB9ID0gYXdhaXQgaW1wb3J0KCdAZ29vZ2xlL2dlbmFpJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGFpID0gbmV3IEdvb2dsZUdlbkFJKHsgYXBpS2V5OiBwcm9jZXNzLmVudi5BSV9JTlRFR1JBVElPTlNfR0VNSU5JX0FQSV9LRVkgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwcm9tcHQgPSBgWW91IGFyZSBhIHJvbGwgZm9ybWluZyBtYWNoaW5lIGV4cGVydCBhdCBTQUkgUm9sb1RlY2gsIFB1bmUuXHJcbkJhc2VkIG9uIHRoZSBmb2xsb3dpbmcgY3VzdG9tZXIgcmVxdWlyZW1lbnRzLCBwcm92aWRlIGEgYnJpZWYgdGVjaG5pY2FsIG1hY2hpbmUgc3BlY2lmaWNhdGlvbiBlc3RpbWF0ZSBpbiBIaW5nbGlzaCAoSGluZGkrRW5nbGlzaCkuXHJcblxyXG5DdXN0b21lciBSZXF1aXJlbWVudHM6XHJcbi0gTWF0ZXJpYWw6ICR7Zm9ybS5tYXRlcmlhbFR5cGV9XHJcbi0gVGhpY2tuZXNzIFJhbmdlOiAke2Zvcm0ubWluVGhpY2tuZXNzfW1tIHRvICR7Zm9ybS5tYXhUaGlja25lc3N9bW1cclxuLSBTdHJpcCBXaWR0aCBSYW5nZTogJHtmb3JtLm1pblN0cmlwV2lkdGh9bW0gdG8gJHtmb3JtLm1heFN0cmlwV2lkdGh9bW1cclxuLSBQcm9maWxlIEhlaWdodDogJHtmb3JtLnByb2ZpbGVIZWlnaHQgfHwgJ05vdCBzcGVjaWZpZWQnfW1tXHJcbi0gTWFjaGluZSBUeXBlOiAke2Zvcm0ubWFjaGluZVR5cGV9XHJcbi0gUHVuY2hpbmc6ICR7Zm9ybS5wdW5jaGluZ09wdGlvbn0gJHtmb3JtLnB1bmNoaW5nRGV0YWlscyB8fCAnJ31cclxuLSBPdXRwdXQgU3BlZWQ6ICR7Zm9ybS5vdXRwdXRTcGVlZCB8fCAnTm90IHNwZWNpZmllZCd9IG0vbWluXHJcbi0gQ29pbCBXZWlnaHQ6ICR7Zm9ybS5jb2lsV2VpZ2h0IHx8ICdOb3Qgc3BlY2lmaWVkJ30ga2dcclxuLSBDdXQgVHlwZTogJHtmb3JtLmN1dFR5cGUgfHwgJ05vdCBzcGVjaWZpZWQnfVxyXG4tIENvbnRyb2wgU3lzdGVtOiAke2Zvcm0uY29udHJvbFN5c3RlbSB8fCAnTm90IHNwZWNpZmllZCd9XHJcbi0gU3BlY2lhbDogJHtmb3JtLnNwZWNpYWxSZXF1aXJlbWVudHMgfHwgJ05vbmUnfVxyXG5cclxuR2l2ZSBhIDUtOCBsaW5lIHRlY2huaWNhbCBlc3RpbWF0ZSBjb3ZlcmluZzpcclxuMS4gRXN0aW1hdGVkIG51bWJlciBvZiBmb3JtaW5nIHN0YXRpb25zXHJcbjIuIE1vdG9yL2RyaXZlIHJlcXVpcmVtZW50cyAgXHJcbjMuIEZyYW1lL3N0cnVjdHVyZSByZWNvbW1lbmRhdGlvbnNcclxuNC4gVG9vbGluZyBtYXRlcmlhbCByZWNvbW1lbmRhdGlvblxyXG41LiBBcHByb3hpbWF0ZSBtYWNoaW5lIHNpemUgKEwgeCBXIHggSClcclxuNi4gQW55IHNwZWNpYWwgdGVjaG5pY2FsIG5vdGVzXHJcbktlZXAgaXQgY29uY2lzZSwgcHJhY3RpY2FsIGFuZCBwcm9mZXNzaW9uYWwuYDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYWkubW9kZWxzLmdlbmVyYXRlQ29udGVudCh7XHJcbiAgICAgICAgICAgICAgbW9kZWw6ICdnZW1pbmktMi41LWZsYXNoJyxcclxuICAgICAgICAgICAgICBjb250ZW50czogW3sgcm9sZTogJ3VzZXInLCBwYXJ0czogW3sgdGV4dDogcHJvbXB0IH1dIH1dLFxyXG4gICAgICAgICAgICAgIGNvbmZpZzogeyBtYXhPdXRwdXRUb2tlbnM6IDUxMiwgdGVtcGVyYXR1cmU6IDAuMyB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBzcGVjID0gcmVzcG9uc2UudGV4dCB8fCAnJztcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIHNwZWMgfSkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdTZXJ2aWNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlJyB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYW5hbHl6ZS1xdW90YXRpb24nLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHsgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCdNZXRob2Qgbm90IGFsbG93ZWQnKTsgcmV0dXJuOyB9XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsZXQgYm9keSA9ICcnO1xyXG4gICAgICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHJlcSkgYm9keSArPSBjaHVuaztcclxuICAgICAgICAgICAgY29uc3QgeyBxdW90YXRpb25UZXh0LCBjYXRhbG9nRGF0YSB9ID0gSlNPTi5wYXJzZShib2R5KTtcclxuICAgICAgICAgICAgY29uc3QgeyBHb29nbGVHZW5BSSB9ID0gYXdhaXQgaW1wb3J0KCdAZ29vZ2xlL2dlbmFpJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGFpID0gbmV3IEdvb2dsZUdlbkFJKHsgYXBpS2V5OiBwcm9jZXNzLmVudi5BSV9JTlRFR1JBVElPTlNfR0VNSU5JX0FQSV9LRVkgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjYXRhbG9nID0gY2F0YWxvZ0RhdGEgfHwge307XHJcbiAgICAgICAgICAgIGNvbnN0IHNhaVByaWNpbmcgPSAoY2F0YWxvZy5wcm9kdWN0cyB8fCBbXSkubWFwKHAgPT5cclxuICAgICAgICAgICAgICBgJHtwLm5hbWV9OiBcdTIwQjkke3AuYmFzZVByaWNlLnRvTG9jYWxlU3RyaW5nKCdlbi1JTicpfS8ke3AudW5pdH0gKCR7cC5jYXRlZ29yeX0pYFxyXG4gICAgICAgICAgICApLmpvaW4oJ1xcbicpO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3lzdGVtUHJvbXB0ID0gYFlvdSBhcmUgYW4gZXhwZXJ0IGluZHVzdHJpYWwgYXV0b21hdGlvbiBwcm9jdXJlbWVudCBhbmFseXN0IHdvcmtpbmcgZm9yIFNBSSBSb2xvVGVjaCwgUHVuZS4gWW91IGFuYWx5emUgcXVvdGF0aW9ucyBmcm9tIGFueSBjb21wYW55IGFuZCBnaXZlIGEgZGV0YWlsZWQsIHByb2Zlc3Npb25hbCBhc3Nlc3NtZW50LlxyXG5cclxuU0FJIFJvbG9UZWNoIFJlZmVyZW5jZSBQcmljaW5nIChmb3IgY29tcGFyaXNvbik6XHJcbiR7c2FpUHJpY2luZyB8fCAnUExDIFBhbmVsczogXHUyMEI5MjgsMDAwLVx1MjBCOTg1LDAwMCwgSE1JOiBcdTIwQjkxOCwwMDAtXHUyMEI5MzIsMDAwLCBWRkQ6IFx1MjBCOTgsNTAwLVx1MjBCOTIyLDAwMCwgU0NBREE6IFx1MjBCOTg1LDAwMCwgU2Vydm86IFx1MjBCOTM1LDAwMC9zZXQsIFBhbmVsczogXHUyMEI5MTUsMDAwKyd9XHJcblxyXG5BbmFseXplIHRoZSBnaXZlbiBxdW90YXRpb24gYW5kIHJldHVybiBPTkxZIGEgdmFsaWQgSlNPTiBvYmplY3Qgd2l0aCB0aGlzIEVYQUNUIHN0cnVjdHVyZTpcclxue1xyXG4gIFwiY29tcGFueU5hbWVcIjogXCJkZXRlY3RlZCBjb21wYW55IG5hbWUgb3IgJ1Vua25vd24gQ29tcGFueSdcIixcclxuICBcInF1b3RhdGlvblJlZlwiOiBcInF1b3RhdGlvbiBudW1iZXIgaWYgZm91bmQgb3IgJ04vQSdcIixcclxuICBcInRvdGFsQW1vdW50XCI6IFwidG90YWwgYW1vdW50IGFzIHN0cmluZyB3aXRoIFx1MjBCOSBvciBjdXJyZW5jeSBzeW1ib2wsIG9yICdOL0EnXCIsXHJcbiAgXCJvdmVyYWxsU2NvcmVcIjogbnVtYmVyIGJldHdlZW4gMSBhbmQgMTAsXHJcbiAgXCJvdmVyYWxsVmVyZGljdFwiOiBcIm9uZSBvZjogRXhjZWxsZW50IHwgR29vZCB8IEF2ZXJhZ2UgfCBCZWxvdyBBdmVyYWdlIHwgUG9vclwiLFxyXG4gIFwic3VtbWFyeVwiOiBcIjItMyBzZW50ZW5jZSBleGVjdXRpdmUgc3VtbWFyeSBpbiBIaW5nbGlzaFwiLFxyXG4gIFwicHJvc1wiOiBbXHJcbiAgICB7IFwicG9pbnRcIjogXCJ3aGF0IGlzIGdvb2RcIiwgXCJkZXRhaWxcIjogXCJicmllZiBleHBsYW5hdGlvbiBpbiBIaW5nbGlzaFwiIH1cclxuICBdLFxyXG4gIFwiY29uc1wiOiBbXHJcbiAgICB7IFwicG9pbnRcIjogXCJ3aGF0IGlzIGJhZCBvciBtaXNzaW5nXCIsIFwiZGV0YWlsXCI6IFwiYnJpZWYgZXhwbGFuYXRpb24gaW4gSGluZ2xpc2hcIiwgXCJzZXZlcml0eVwiOiBcIkhpZ2ggfCBNZWRpdW0gfCBMb3dcIiB9XHJcbiAgXSxcclxuICBcInByaWNlQW5hbHlzaXNcIjoge1xyXG4gICAgXCJ2ZXJkaWN0XCI6IFwib25lIG9mOiBPdmVycHJpY2VkIHwgRmFpciB8IENvbXBldGl0aXZlIHwgQ2hlYXAgKHF1YWxpdHkgcmlzaylcIixcclxuICAgIFwiZGV0YWlsXCI6IFwicHJpY2UgY29tcGFyaXNvbiBhbmQgYW5hbHlzaXMgaW4gSGluZ2xpc2hcIixcclxuICAgIFwic2F2aW5nT3Bwb3J0dW5pdHlcIjogXCJlc3RpbWF0ZWQgc2F2aW5ncyBpZiBzd2l0Y2hlZCB0byBTQUkgUm9sb1RlY2ggb3IgYmV0dGVyIGFsdGVybmF0aXZlc1wiXHJcbiAgfSxcclxuICBcIm1pc3NpbmdJdGVtc1wiOiBbXCJsaXN0IG9mIGl0ZW1zIHRoYXQgc2hvdWxkIGJlIGluIGEgZ29vZCBxdW90YXRpb24gYnV0IGFyZSBtaXNzaW5nXCJdLFxyXG4gIFwicmVkRmxhZ3NcIjogW1wiYW55IHN1c3BpY2lvdXMgb3IgY29uY2VybmluZyBpdGVtcyBmb3VuZFwiXSxcclxuICBcInJlY29tbWVuZGF0aW9uc1wiOiBbXCIzLTUgYWN0aW9uYWJsZSByZWNvbW1lbmRhdGlvbnMgaW4gSGluZ2xpc2hcIl0sXHJcbiAgXCJzYWlyb2xvdGVjaF9hZHZhbnRhZ2VcIjogXCJ3aHkgU0FJIFJvbG9UZWNoIHdvdWxkIGJlIGJldHRlciAoMS0yIGxpbmVzKVwiXHJcbn1cclxuXHJcbkJlIGhvbmVzdCwgc3BlY2lmaWMsIGFuZCBoZWxwZnVsLiBJZiB0aGUgdGV4dCBpcyBub3QgYSBxdW90YXRpb24sIHN0aWxsIGFuYWx5emUgd2hhdCB5b3UgY2FuIHNlZS5gO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhaS5tb2RlbHMuZ2VuZXJhdGVDb250ZW50KHtcclxuICAgICAgICAgICAgICBtb2RlbDogJ2dlbWluaS0yLjUtZmxhc2gnLFxyXG4gICAgICAgICAgICAgIGNvbnRlbnRzOiBbeyByb2xlOiAndXNlcicsIHBhcnRzOiBbeyB0ZXh0OiBgQW5hbHl6ZSB0aGlzIHF1b3RhdGlvbjpcXG5cXG4ke3F1b3RhdGlvblRleHR9YCB9XSB9XSxcclxuICAgICAgICAgICAgICBjb25maWc6IHsgc3lzdGVtSW5zdHJ1Y3Rpb246IHN5c3RlbVByb21wdCwgbWF4T3V0cHV0VG9rZW5zOiAyMDQ4LCB0ZW1wZXJhdHVyZTogMC40IH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgdGV4dCA9IHJlc3BvbnNlLnRleHQgfHwgJ3t9JztcclxuICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvYGBganNvblxcbj8vZywgJycpLnJlcGxhY2UoL2BgYFxcbj8vZywgJycpLnRyaW0oKTtcclxuICAgICAgICAgICAgY29uc3QgYW5hbHlzaXMgPSBKU09OLnBhcnNlKHRleHQpO1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgYW5hbHlzaXMgfSkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0FuYWx5emUgUXVvdGF0aW9uIGVycm9yOicsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1NlcnZpY2UgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGUnIH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9nZW5lcmF0ZS1xdWVzdGlvbnMnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHsgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCdNZXRob2Qgbm90IGFsbG93ZWQnKTsgcmV0dXJuOyB9XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsZXQgYm9keSA9ICcnO1xyXG4gICAgICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHJlcSkgYm9keSArPSBjaHVuaztcclxuICAgICAgICAgICAgY29uc3QgeyB0b3BpYywgY291bnQsIHFUeXBlIH0gPSBKU09OLnBhcnNlKGJvZHkpO1xyXG4gICAgICAgICAgICBjb25zdCBPcGVuQUkgPSAoYXdhaXQgaW1wb3J0KCdvcGVuYWknKSkuZGVmYXVsdDtcclxuICAgICAgICAgICAgY29uc3Qgb3BlbmFpID0gbmV3IE9wZW5BSSh7IGFwaUtleTogcHJvY2Vzcy5lbnYuQUlfSU5URUdSQVRJT05TX09QRU5BSV9BUElfS0VZIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBwcm9tcHQgPSBgR2VuZXJhdGUgZXhhY3RseSAke2NvdW50IHx8IDV9ICR7cVR5cGUgPT09ICdNQ1EnID8gJ211bHRpcGxlIGNob2ljZScgOiBxVHlwZSA9PT0gJ1Nob3J0JyA/ICdzaG9ydCBhbnN3ZXInIDogJ21peGVkIChNQ1EgYW5kIHNob3J0IGFuc3dlciknfSBxdWVzdGlvbnMgYWJvdXQgXCIke3RvcGljIHx8ICdJbmR1c3RyaWFsIEF1dG9tYXRpb24sIFBMQywgRWxlY3RyaWNhbCBTYWZldHksIENSTSBTYWxlcyd9XCIuXHJcblxyXG5Db250ZXh0OiBUaGVzZSBhcmUgZm9yIFNBSSBSb2xvVGVjaCBDUk0gLSBhbiBpbmR1c3RyaWFsIGF1dG9tYXRpb24gY29tcGFueSBkZWFsaW5nIHdpdGggUExDLCBITUksIFNDQURBLCBWRkQsIFNlcnZvIE1vdG9ycywgUGFuZWwgTWFudWZhY3R1cmluZywgTWFjaGluZSBUZXN0aW5nLCBhbmQgQ1JNL1NhbGVzLlxyXG5cclxuUmV0dXJuIE9OTFkgdmFsaWQgSlNPTiBhcnJheS4gRWFjaCBxdWVzdGlvbiBvYmplY3QgbXVzdCBoYXZlOlxyXG4tIFwicVwiOiBxdWVzdGlvbiB0ZXh0IChpbiBIaW5nbGlzaCAtIEhpbmRpK0VuZ2xpc2ggbWl4KVxyXG4tIFwiYVwiOiBjb3JyZWN0IGFuc3dlclxyXG4tIFwidHlwZVwiOiBcIk1DUVwiIG9yIFwiU2hvcnRcIlxyXG4tIFwib3B0aW9uc1wiOiBhcnJheSBvZiA0IG9wdGlvbnMgKG9ubHkgZm9yIE1DUSB0eXBlLCBpbmNsdWRlIGNvcnJlY3QgYW5zd2VyKVxyXG5cclxuRXhhbXBsZTogW3tcInFcIjpcIlBMQyBrYSBmdWxsIGZvcm0ga3lhIGhhaT9cIixcImFcIjpcIlByb2dyYW1tYWJsZSBMb2dpYyBDb250cm9sbGVyXCIsXCJ0eXBlXCI6XCJNQ1FcIixcIm9wdGlvbnNcIjpbXCJQcm9ncmFtbWFibGUgTG9naWMgQ29udHJvbGxlclwiLFwiUG93ZXIgTG9naWMgQ2lyY3VpdFwiLFwiUHJvZ3JhbSBMZXZlbCBDb250cm9sXCIsXCJQcm9jZXNzIExvZ2ljIENvbXB1dGVyXCJdfV1cclxuXHJcblJldHVybiBPTkxZIHRoZSBKU09OIGFycmF5LCBubyBvdGhlciB0ZXh0LmA7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjb21wbGV0aW9uID0gYXdhaXQgb3BlbmFpLmNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcclxuICAgICAgICAgICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcclxuICAgICAgICAgICAgICBtZXNzYWdlczogW3sgcm9sZTogJ3VzZXInLCBjb250ZW50OiBwcm9tcHQgfV0sXHJcbiAgICAgICAgICAgICAgdGVtcGVyYXR1cmU6IDAuOCxcclxuICAgICAgICAgICAgICBtYXhfdG9rZW5zOiAyMDAwLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgbGV0IHRleHQgPSBjb21wbGV0aW9uLmNob2ljZXNbMF0/Lm1lc3NhZ2U/LmNvbnRlbnQgfHwgJ1tdJztcclxuICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvYGBganNvblxcbj8vZywgJycpLnJlcGxhY2UoL2BgYFxcbj8vZywgJycpLnRyaW0oKTtcclxuICAgICAgICAgICAgY29uc3QgcXVlc3Rpb25zID0gSlNPTi5wYXJzZSh0ZXh0KTtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIHF1ZXN0aW9ucyB9KSk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignUXVlc3Rpb24gZ2VuIGVycm9yOicsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1NlcnZpY2UgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGUnIH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gZ2V0R21haWxDbGllbnQoKSB7XHJcbiAgICAgICAgICBjb25zdCB7IGdvb2dsZSB9ID0gYXdhaXQgaW1wb3J0KCdnb29nbGVhcGlzJyk7XHJcbiAgICAgICAgICBjb25zdCBob3N0bmFtZSA9IHByb2Nlc3MuZW52LlJFUExJVF9DT05ORUNUT1JTX0hPU1ROQU1FO1xyXG4gICAgICAgICAgY29uc3QgeFJlcGxpdFRva2VuID0gcHJvY2Vzcy5lbnYuUkVQTF9JREVOVElUWVxyXG4gICAgICAgICAgICA/ICdyZXBsICcgKyBwcm9jZXNzLmVudi5SRVBMX0lERU5USVRZXHJcbiAgICAgICAgICAgIDogcHJvY2Vzcy5lbnYuV0VCX1JFUExfUkVORVdBTFxyXG4gICAgICAgICAgICA/ICdkZXBsICcgKyBwcm9jZXNzLmVudi5XRUJfUkVQTF9SRU5FV0FMXHJcbiAgICAgICAgICAgIDogbnVsbDtcclxuICAgICAgICAgIGNvbnN0IGNvbm5SZXNwID0gYXdhaXQgZmV0Y2goXHJcbiAgICAgICAgICAgICdodHRwczovLycgKyBob3N0bmFtZSArICcvYXBpL3YyL2Nvbm5lY3Rpb24/aW5jbHVkZV9zZWNyZXRzPXRydWUmY29ubmVjdG9yX25hbWVzPWdvb2dsZS1tYWlsJyxcclxuICAgICAgICAgICAgeyBoZWFkZXJzOiB7IEFjY2VwdDogJ2FwcGxpY2F0aW9uL2pzb24nLCAnWC1SZXBsaXQtVG9rZW4nOiB4UmVwbGl0VG9rZW4gfSB9XHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgY29uc3QgY29ubkRhdGEgPSBhd2FpdCBjb25uUmVzcC5qc29uKCk7XHJcbiAgICAgICAgICBjb25zdCBjb25uID0gY29ubkRhdGEuaXRlbXM/LlswXTtcclxuICAgICAgICAgIGNvbnN0IGFjY2Vzc1Rva2VuID0gY29ubj8uc2V0dGluZ3M/LmFjY2Vzc190b2tlbiB8fCBjb25uPy5zZXR0aW5ncz8ub2F1dGg/LmNyZWRlbnRpYWxzPy5hY2Nlc3NfdG9rZW47XHJcbiAgICAgICAgICBpZiAoIWFjY2Vzc1Rva2VuKSB0aHJvdyBuZXcgRXJyb3IoJ0dtYWlsIG5vdCBjb25uZWN0ZWQnKTtcclxuICAgICAgICAgIGNvbnN0IG9hdXRoMkNsaWVudCA9IG5ldyBnb29nbGUuYXV0aC5PQXV0aDIoKTtcclxuICAgICAgICAgIG9hdXRoMkNsaWVudC5zZXRDcmVkZW50aWFscyh7IGFjY2Vzc190b2tlbjogYWNjZXNzVG9rZW4gfSk7XHJcbiAgICAgICAgICByZXR1cm4gZ29vZ2xlLmdtYWlsKHsgdmVyc2lvbjogJ3YxJywgYXV0aDogb2F1dGgyQ2xpZW50IH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9zZW5kLWlucXVpcnknLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCdNZXRob2Qgbm90IGFsbG93ZWQnKTsgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGV0IGJvZHkgPSAnJztcclxuICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXEpIGJvZHkgKz0gY2h1bms7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgbmFtZSwgZW1haWwsIHBob25lLCBtZXNzYWdlLCBzb3VyY2UgfSA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGdtYWlsID0gYXdhaXQgZ2V0R21haWxDbGllbnQoKTtcclxuICAgICAgICAgICAgY29uc3QgSU5RVUlSWV9FTUFJTCA9ICdpbnF1aXJ5c2Fpcm9sb3RlY2hAZ21haWwuY29tJztcclxuICAgICAgICAgICAgY29uc3QgQURNSU5fRU1BSUwgPSAnYWRtaW4uc2Fpcm9sb3RlY2hAZ21haWwuY29tJztcclxuICAgICAgICAgICAgY29uc3QgZW1haWxDb250ZW50ID0gW1xyXG4gICAgICAgICAgICAgIGBGcm9tOiBDUk0gU3lzdGVtIDwke0lOUVVJUllfRU1BSUx9PmAsXHJcbiAgICAgICAgICAgICAgYFRvOiAke0lOUVVJUllfRU1BSUx9YCxcclxuICAgICAgICAgICAgICBgQ2M6ICR7QURNSU5fRU1BSUx9YCxcclxuICAgICAgICAgICAgICBgU3ViamVjdDogTmV3IExlYWQgSW5xdWlyeTogJHtuYW1lfSAoJHtzb3VyY2UgfHwgJ1dlYnNpdGUnfSlgLFxyXG4gICAgICAgICAgICAgIGBNSU1FLVZlcnNpb246IDEuMGAsXHJcbiAgICAgICAgICAgICAgYENvbnRlbnQtVHlwZTogdGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04YCxcclxuICAgICAgICAgICAgICBgYCxcclxuICAgICAgICAgICAgICBgPGRpdiBzdHlsZT1cImZvbnQtZmFtaWx5OkFyaWFsLHNhbnMtc2VyaWY7bWF4LXdpZHRoOjYwMHB4O21hcmdpbjowIGF1dG87cGFkZGluZzoyMHB4O1wiPmAsXHJcbiAgICAgICAgICAgICAgYDxoMiBzdHlsZT1cImNvbG9yOiM2NjdlZWE7Ym9yZGVyLWJvdHRvbToycHggc29saWQgIzY2N2VlYTtwYWRkaW5nLWJvdHRvbToxMHB4O1wiPk5ldyBMZWFkIElucXVpcnk8L2gyPmAsXHJcbiAgICAgICAgICAgICAgYDx0YWJsZSBzdHlsZT1cIndpZHRoOjEwMCU7Ym9yZGVyLWNvbGxhcHNlOmNvbGxhcHNlO1wiPmAsXHJcbiAgICAgICAgICAgICAgYDx0cj48dGQgc3R5bGU9XCJwYWRkaW5nOjhweDtmb250LXdlaWdodDpib2xkO1wiPk5hbWU6PC90ZD48dGQgc3R5bGU9XCJwYWRkaW5nOjhweDtcIj4ke25hbWV9PC90ZD48L3RyPmAsXHJcbiAgICAgICAgICAgICAgYDx0ciBzdHlsZT1cImJhY2tncm91bmQ6I2Y5ZmFmYjtcIj48dGQgc3R5bGU9XCJwYWRkaW5nOjhweDtmb250LXdlaWdodDpib2xkO1wiPkVtYWlsOjwvdGQ+PHRkIHN0eWxlPVwicGFkZGluZzo4cHg7XCI+JHtlbWFpbH08L3RkPjwvdHI+YCxcclxuICAgICAgICAgICAgICBgPHRyPjx0ZCBzdHlsZT1cInBhZGRpbmc6OHB4O2ZvbnQtd2VpZ2h0OmJvbGQ7XCI+UGhvbmU6PC90ZD48dGQgc3R5bGU9XCJwYWRkaW5nOjhweDtcIj4ke3Bob25lIHx8ICdOb3QgcHJvdmlkZWQnfTwvdGQ+PC90cj5gLFxyXG4gICAgICAgICAgICAgIGA8dHIgc3R5bGU9XCJiYWNrZ3JvdW5kOiNmOWZhZmI7XCI+PHRkIHN0eWxlPVwicGFkZGluZzo4cHg7Zm9udC13ZWlnaHQ6Ym9sZDtcIj5Tb3VyY2U6PC90ZD48dGQgc3R5bGU9XCJwYWRkaW5nOjhweDtcIj4ke3NvdXJjZSB8fCAnV2Vic2l0ZSBGb3JtJ308L3RkPjwvdHI+YCxcclxuICAgICAgICAgICAgICBgPHRyPjx0ZCBzdHlsZT1cInBhZGRpbmc6OHB4O2ZvbnQtd2VpZ2h0OmJvbGQ7XCI+TWVzc2FnZTo8L3RkPjx0ZCBzdHlsZT1cInBhZGRpbmc6OHB4O1wiPiR7bWVzc2FnZSB8fCAnTm8gbWVzc2FnZSd9PC90ZD48L3RyPmAsXHJcbiAgICAgICAgICAgICAgYDx0ciBzdHlsZT1cImJhY2tncm91bmQ6I2Y5ZmFmYjtcIj48dGQgc3R5bGU9XCJwYWRkaW5nOjhweDtmb250LXdlaWdodDpib2xkO1wiPlRpbWU6PC90ZD48dGQgc3R5bGU9XCJwYWRkaW5nOjhweDtcIj4ke25ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoJ2VuLUlOJyl9PC90ZD48L3RyPmAsXHJcbiAgICAgICAgICAgICAgYDwvdGFibGU+PC9kaXY+YCxcclxuICAgICAgICAgICAgXS5qb2luKCdcXG4nKTtcclxuICAgICAgICAgICAgY29uc3QgZW5jb2RlZCA9IEJ1ZmZlci5mcm9tKGVtYWlsQ29udGVudCkudG9TdHJpbmcoJ2Jhc2U2NHVybCcpO1xyXG4gICAgICAgICAgICBhd2FpdCBnbWFpbC51c2Vycy5tZXNzYWdlcy5zZW5kKHsgdXNlcklkOiAnbWUnLCByZXF1ZXN0Qm9keTogeyByYXc6IGVuY29kZWQgfSB9KTtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICdJbnF1aXJ5IHNlbnQgc3VjY2Vzc2Z1bGx5JyB9KSk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1NlcnZpY2UgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGUnIH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLyogXHUyNTAwXHUyNTAwIENSTTogTmV3IExlYWQgKFBhYmJseSB3ZWJob29rKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgKi9cclxuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvbmV3LWxlYWQnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHsgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCk7IHJldHVybjsgfVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGV0IGJvZHkgPSAnJztcclxuICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXEpIGJvZHkgKz0gY2h1bms7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgbmFtZSwgcGhvbmUsIHNvdXJjZSwgZW1haWwgfSA9IEpTT04ucGFyc2UoYm9keSB8fCAne30nKTtcclxuICAgICAgICAgICAgaWYgKCFwaG9uZSkgeyByZXMud3JpdGVIZWFkKDQwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pOyByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdQaG9uZSByZXF1aXJlZCcgfSkpOyByZXR1cm47IH1cclxuICAgICAgICAgICAgY29uc3QgeyBjcmVhdGVMZWFkLCBzY2hlZHVsZUZvbGxvd3VwcyB9ID0gYXdhaXQgaW1wb3J0KCcuL3NlcnZlci9tb2RlbHMvbGVhZE1vZGVsLmpzJykuY2F0Y2goKCkgPT4gKHt9KSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZW5xdWV1ZSB9ID0gYXdhaXQgaW1wb3J0KCcuL3NlcnZlci9zZXJ2aWNlcy9xdWV1ZVNlcnZpY2UuanMnKS5jYXRjaCgoKSA9PiAoe30pKTtcclxuICAgICAgICAgICAgaWYgKGNyZWF0ZUxlYWQpIHtcclxuICAgICAgICAgICAgICBjb25zdCB7IGV4aXN0aW5nLCBsZWFkIH0gPSBjcmVhdGVMZWFkKHsgbmFtZSwgcGhvbmUsIHNvdXJjZTogc291cmNlIHx8ICdwYWJibHknLCBlbWFpbCB9KTtcclxuICAgICAgICAgICAgICBpZiAoIWV4aXN0aW5nICYmIGVucXVldWUpIGVucXVldWUoJ1NFTkRfV0VMQ09NRScsIHsgcGhvbmU6IGxlYWQucGhvbmUgfSwgeyBkZWxheU1zOiAyMDAwIH0pO1xyXG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIGR1cGxpY2F0ZTogZXhpc3RpbmcsIGxlYWRJZDogbGVhZC5pZCB9KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgbW9jazogdHJ1ZSB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdTZXJ2aWNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlJyB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8qIFx1MjUwMFx1MjUwMCBDUk06IEFwcCBUcmFja2luZyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgKi9cclxuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL3RyYWNrJywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7IHJlcy53cml0ZUhlYWQoNDA1KTsgcmVzLmVuZCgpOyByZXR1cm47IH1cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxldCBib2R5ID0gJyc7XHJcbiAgICAgICAgICAgIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgcmVxKSBib2R5ICs9IGNodW5rO1xyXG4gICAgICAgICAgICBjb25zdCB7IHBob25lLCBldmVudCwgZmNtVG9rZW4gfSA9IEpTT04ucGFyc2UoYm9keSB8fCAne30nKTtcclxuICAgICAgICAgICAgaWYgKCFwaG9uZSB8fCAhZXZlbnQpIHsgcmVzLndyaXRlSGVhZCg0MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTsgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAncGhvbmUgYW5kIGV2ZW50IHJlcXVpcmVkJyB9KSk7IHJldHVybjsgfVxyXG4gICAgICAgICAgICBjb25zdCB7IGdldExlYWQsIHVwZGF0ZUxlYWQsIGNyZWF0ZUxlYWQsIHJlY2FsY3VsYXRlU2NvcmUgfSA9IGF3YWl0IGltcG9ydCgnLi9zZXJ2ZXIvbW9kZWxzL2xlYWRNb2RlbC5qcycpLmNhdGNoKCgpID0+ICh7fSkpO1xyXG4gICAgICAgICAgICBpZiAoZ2V0TGVhZCkge1xyXG4gICAgICAgICAgICAgIGxldCBsZWFkID0gZ2V0TGVhZChwaG9uZSkgfHwgY3JlYXRlTGVhZCh7IHBob25lLCBuYW1lOiAnQXBwIFVzZXInLCBzb3VyY2U6ICdhcHAnIH0pLmxlYWQ7XHJcbiAgICAgICAgICAgICAgY29uc3QgdXBkYXRlcyA9IHt9O1xyXG4gICAgICAgICAgICAgIGlmIChldmVudCA9PT0gJ2Rvd25sb2FkJykgdXBkYXRlcy5hcHBJbnN0YWxsZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIGlmIChldmVudCA9PT0gJ2FwcF9vcGVuJykgeyB1cGRhdGVzLmFwcE9wZW5lZCA9IHRydWU7IGlmIChmY21Ub2tlbikgdXBkYXRlcy5mY21Ub2tlbiA9IGZjbVRva2VuOyB9XHJcbiAgICAgICAgICAgICAgaWYgKFsncXVvdGF0aW9uJywgJ21haW50ZW5hbmNlJywgJ3F1YWxpdHknXS5pbmNsdWRlcyhldmVudCkpIHVwZGF0ZXMuZmVhdHVyZXMgPSBbLi4ubmV3IFNldChbLi4uKGxlYWQuZmVhdHVyZXMgfHwgW10pLCBldmVudF0pXTtcclxuICAgICAgICAgICAgICB1cGRhdGVMZWFkKHBob25lLCB1cGRhdGVzKTtcclxuICAgICAgICAgICAgICBjb25zdCBzY29yZWQgPSByZWNhbGN1bGF0ZVNjb3JlKHBob25lKTtcclxuICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBzY29yZTogc2NvcmVkPy5zY29yZSB9KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgbW9jazogdHJ1ZSB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdTZXJ2aWNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlJyB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8qIFx1MjUwMFx1MjUwMCBDUk06IEFkbWluIFx1MjAxNCBBbGwgTGVhZHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9sZWFkcycsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdHRVQnKSB7IHJlcy53cml0ZUhlYWQoNDA1KTsgcmVzLmVuZCgpOyByZXR1cm47IH1cclxuICAgICAgICAgIGNvbnN0IHRva2VuID0gcmVxLmhlYWRlcnNbJ3gtYWRtaW4tdG9rZW4nXSB8fCBuZXcgVVJMKHJlcS51cmwsICdodHRwOi8veCcpLnNlYXJjaFBhcmFtcy5nZXQoJ3Rva2VuJyk7XHJcbiAgICAgICAgICBjb25zdCBBRE1JTl9UT0tFTiA9IHByb2Nlc3MuZW52LkFETUlOX0FQSV9UT0tFTjtcclxuICAgICAgICAgIGlmICghQURNSU5fVE9LRU4gfHwgdG9rZW4gIT09IEFETUlOX1RPS0VOKSB7IHJlcy53cml0ZUhlYWQoNDAxLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7IHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1VuYXV0aG9yaXplZCcgfSkpOyByZXR1cm47IH1cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZ2V0QWxsTGVhZHMsIGdldFN0YXRzIH0gPSBhd2FpdCBpbXBvcnQoJy4vc2VydmVyL21vZGVscy9sZWFkTW9kZWwuanMnKS5jYXRjaCgoKSA9PiAoe30pKTtcclxuICAgICAgICAgICAgaWYgKGdldEFsbExlYWRzKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgbGVhZHMgPSBnZXRBbGxMZWFkcygpO1xyXG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIHRvdGFsOiBsZWFkcy5sZW5ndGgsIGxlYWRzLCBzdGF0czogZ2V0U3RhdHMoKSB9KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgdG90YWw6IDAsIGxlYWRzOiBbXSB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdTZXJ2aWNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlJyB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8qIFx1MjUwMFx1MjUwMCBDUk06IExlYWQgU3RhdHMgKGFkbWluIHByb3RlY3RlZCkgXHUyNTAwXHUyNTAwICovXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9sZWFkLXN0YXRzJywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCB0b2tlbiA9IHJlcS5oZWFkZXJzWyd4LWFkbWluLXRva2VuJ10gfHwgbmV3IFVSTChyZXEudXJsLCAnaHR0cDovL3gnKS5zZWFyY2hQYXJhbXMuZ2V0KCd0b2tlbicpO1xyXG4gICAgICAgICAgY29uc3QgQURNSU5fVE9LRU4gPSBwcm9jZXNzLmVudi5BRE1JTl9BUElfVE9LRU47XHJcbiAgICAgICAgICBpZiAoIUFETUlOX1RPS0VOIHx8IHRva2VuICE9PSBBRE1JTl9UT0tFTikge1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMSwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdVbmF1dGhvcml6ZWQnIH0pKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBnZXRTdGF0cyB9ID0gYXdhaXQgaW1wb3J0KCcuL3NlcnZlci9tb2RlbHMvbGVhZE1vZGVsLmpzJykuY2F0Y2goKCkgPT4gKHt9KSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gZ2V0U3RhdHMgPyBnZXRTdGF0cygpIDogeyB0b3RhbDogMCB9O1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgc3RhdHMgfSkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBzdGF0czogeyB0b3RhbDogMCB9IH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9nbWFpbC1sZWFkcycsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZ21haWwgPSBhd2FpdCBnZXRHbWFpbENsaWVudCgpO1xyXG4gICAgICAgICAgICBjb25zdCBsYWJlbHNSZXNwID0gYXdhaXQgZ21haWwudXNlcnMubGFiZWxzLmxpc3QoeyB1c2VySWQ6ICdtZScgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGxhYmVscyA9IChsYWJlbHNSZXNwLmRhdGEubGFiZWxzIHx8IFtdKS5tYXAobCA9PiAoeyBpZDogbC5pZCwgbmFtZTogbC5uYW1lIH0pKTtcclxuICAgICAgICAgICAgY29uc3QgaW5ib3hEZXRhaWwgPSAoYXdhaXQgZ21haWwudXNlcnMubGFiZWxzLmdldCh7IHVzZXJJZDogJ21lJywgaWQ6ICdJTkJPWCcgfSkpLmRhdGE7XHJcblxyXG4gICAgICAgICAgICBsZXQgbGVhZHMgPSBbXTtcclxuICAgICAgICAgICAgbGV0IGVtYWlsc1NjYW5uZWQgPSAwO1xyXG4gICAgICAgICAgICBsZXQgc2Nhbk1ldGhvZCA9ICdub25lJztcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBjb25zdCBtc2dMaXN0ID0gYXdhaXQgZ21haWwudXNlcnMubWVzc2FnZXMubGlzdCh7XHJcbiAgICAgICAgICAgICAgICB1c2VySWQ6ICdtZScsXHJcbiAgICAgICAgICAgICAgICBtYXhSZXN1bHRzOiA1MCxcclxuICAgICAgICAgICAgICAgIHE6ICdpbjppbmJveCcsXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgY29uc3QgbWVzc2FnZXMgPSBtc2dMaXN0LmRhdGEubWVzc2FnZXMgfHwgW107XHJcbiAgICAgICAgICAgICAgZW1haWxzU2Nhbm5lZCA9IG1lc3NhZ2VzLmxlbmd0aDtcclxuICAgICAgICAgICAgICBzY2FuTWV0aG9kID0gJ2Z1bGwnO1xyXG4gICAgICAgICAgICAgIGZvciAoY29uc3QgbXNnIG9mIG1lc3NhZ2VzLnNsaWNlKDAsIDMwKSkge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgZGV0YWlsID0gYXdhaXQgZ21haWwudXNlcnMubWVzc2FnZXMuZ2V0KHtcclxuICAgICAgICAgICAgICAgICAgICB1c2VySWQ6ICdtZScsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IG1zZy5pZCxcclxuICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6ICdtZXRhZGF0YScsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGFIZWFkZXJzOiBbJ0Zyb20nLCAnU3ViamVjdCcsICdEYXRlJ10sXHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCBoZWFkZXJzID0gZGV0YWlsLmRhdGEucGF5bG9hZD8uaGVhZGVycyB8fCBbXTtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgZnJvbSA9IGhlYWRlcnMuZmluZChoID0+IGgubmFtZSA9PT0gJ0Zyb20nKT8udmFsdWUgfHwgJyc7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHN1YmplY3QgPSBoZWFkZXJzLmZpbmQoaCA9PiBoLm5hbWUgPT09ICdTdWJqZWN0Jyk/LnZhbHVlIHx8ICcnO1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCBkYXRlID0gaGVhZGVycy5maW5kKGggPT4gaC5uYW1lID09PSAnRGF0ZScpPy52YWx1ZSB8fCAnJztcclxuICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZU1hdGNoID0gZnJvbS5tYXRjaCgvXlwiPyhbXlwiPF0rKVwiP1xccyo8Py8pO1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCBlbWFpbE1hdGNoID0gZnJvbS5tYXRjaCgvPChbXj5dKyk+LykgfHwgZnJvbS5tYXRjaCgvKFteXFxzPF0rQFteXFxzPl0rKS8pO1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCBzZW5kZXJOYW1lID0gbmFtZU1hdGNoID8gbmFtZU1hdGNoWzFdLnRyaW0oKSA6IGZyb20uc3BsaXQoJ0AnKVswXTtcclxuICAgICAgICAgICAgICAgICAgY29uc3Qgc2VuZGVyRW1haWwgPSBlbWFpbE1hdGNoID8gZW1haWxNYXRjaFsxXSA6IGZyb207XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGlzTGVhZCA9IC9pbnF1aXJ5fGxlYWR8cXVvdGV8cHJpY2V8YnV5fG9yZGVyfGludGVyZXN0fHJlcXVlc3R8Y29udGFjdHxoZWxwfHNlcnZpY2V8cHJvZHVjdC9pLnRlc3Qoc3ViamVjdClcclxuICAgICAgICAgICAgICAgICAgICB8fCAvaW5xdWlyeXxsZWFkfHF1b3RlfHByaWNlfG9yZGVyfGludGVyZXN0fHJlcXVlc3QvaS50ZXN0KGZyb20pO1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCBpc0ludGVybmFsID0gL3NhaXJvbG90ZWNofG5vcmVwbHl8bm8tcmVwbHl8bWFpbGVyLWRhZW1vbnxwb3N0bWFzdGVyL2kudGVzdChzZW5kZXJFbWFpbCk7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhYmVsSWRzID0gZGV0YWlsLmRhdGEubGFiZWxJZHMgfHwgW107XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGlzVW5yZWFkID0gbGFiZWxJZHMuaW5jbHVkZXMoJ1VOUkVBRCcpO1xyXG4gICAgICAgICAgICAgICAgICBsZWFkcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogbXNnLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHNlbmRlck5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZW1haWw6IHNlbmRlckVtYWlsLFxyXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3Q6IHN1YmplY3QsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0ZTogZGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBzbmlwcGV0OiBkZXRhaWwuZGF0YS5zbmlwcGV0IHx8ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIGlzTGVhZCxcclxuICAgICAgICAgICAgICAgICAgICBpc0ludGVybmFsLFxyXG4gICAgICAgICAgICAgICAgICAgIGlzVW5yZWFkLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogaXNMZWFkID8gJ0hvdCBMZWFkJyA6IGlzSW50ZXJuYWwgPyAnSW50ZXJuYWwnIDogJ05ldycsXHJcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiAnR21haWwnLFxyXG4gICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGxlYWRzID0gbGVhZHMuZmlsdGVyKGwgPT4gIWwuaXNJbnRlcm5hbCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKHJlYWRFcnIpIHtcclxuICAgICAgICAgICAgICBzY2FuTWV0aG9kID0gJ2xhYmVsc19vbmx5JztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICBjb25uZWN0ZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgZW1haWw6ICdpbnF1aXJ5c2Fpcm9sb3RlY2hAZ21haWwuY29tJyxcclxuICAgICAgICAgICAgICBhZG1pbkVtYWlsOiAnYWRtaW4uc2Fpcm9sb3RlY2hAZ21haWwuY29tJyxcclxuICAgICAgICAgICAgICBsYWJlbHMsXHJcbiAgICAgICAgICAgICAgaW5ib3g6IHtcclxuICAgICAgICAgICAgICAgIHRvdGFsOiBpbmJveERldGFpbC5tZXNzYWdlc1RvdGFsLFxyXG4gICAgICAgICAgICAgICAgdW5yZWFkOiBpbmJveERldGFpbC5tZXNzYWdlc1VucmVhZCxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGxlYWRzLFxyXG4gICAgICAgICAgICAgIGVtYWlsc1NjYW5uZWQsXHJcbiAgICAgICAgICAgICAgc2Nhbk1ldGhvZCxcclxuICAgICAgICAgICAgICB0b3RhbExlYWRzOiBsZWFkcy5maWx0ZXIobCA9PiBsLmlzTGVhZCkubGVuZ3RoLFxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1NlcnZpY2UgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGUnLCBsZWFkczogW10sIGxhYmVsczogW10gfSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBcdTI1MDBcdTI1MDBcdTI1MDAgR21haWwgQWRtaW4gQVBJIChMZWFkIENhcHR1cmUgU3lzdGVtKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuICAgICAgICBjb25zdCBfZ21haWxTdGF0ZSA9IHsgY29ubmVjdGVkOiBmYWxzZSwgZW1haWw6ICcnLCBjb25uZWN0ZWRBdDogJycsIGxhc3RTeW5jZWRBdDogJycsIGxlYWRzOiBbXSwgaGlzdG9yeTogW10gfTtcclxuXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9hZG1pbi9nbWFpbC9zdGF0dXMnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGdtYWlsID0gYXdhaXQgZ2V0R21haWxDbGllbnQoKTtcclxuICAgICAgICAgICAgY29uc3QgcHJvZmlsZSA9IGF3YWl0IGdtYWlsLnVzZXJzLmdldFByb2ZpbGUoeyB1c2VySWQ6ICdtZScgfSk7XHJcbiAgICAgICAgICAgIF9nbWFpbFN0YXRlLmNvbm5lY3RlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIF9nbWFpbFN0YXRlLmVtYWlsID0gcHJvZmlsZS5kYXRhLmVtYWlsQWRkcmVzcyB8fCAnaW5xdWlyeXNhaXJvbG90ZWNoQGdtYWlsLmNvbSc7XHJcbiAgICAgICAgICAgIGlmICghX2dtYWlsU3RhdGUuY29ubmVjdGVkQXQpIF9nbWFpbFN0YXRlLmNvbm5lY3RlZEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgY29ubmVjdGVkOiB0cnVlLCBlbWFpbDogX2dtYWlsU3RhdGUuZW1haWwsIGNvbm5lY3RlZEF0OiBfZ21haWxTdGF0ZS5jb25uZWN0ZWRBdCwgbGFzdFN5bmNlZEF0OiBfZ21haWxTdGF0ZS5sYXN0U3luY2VkQXQgfSkpO1xyXG4gICAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBjb25uZWN0ZWQ6IGZhbHNlIH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9hZG1pbi9nbWFpbC9jb25uZWN0JywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIGF1dGhVcmw6ICcnLCBtZXNzYWdlOiAnR21haWwgaXMgY29ubmVjdGVkIHZpYSBSZXBsaXQgaW50ZWdyYXRpb24uIFVzZSBTeW5jIHRvIGZldGNoIGxlYWRzLicgfSkpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2FkbWluL2dtYWlsL2Rpc2Nvbm5lY3QnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIF9nbWFpbFN0YXRlLmNvbm5lY3RlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgX2dtYWlsU3RhdGUuZW1haWwgPSAnJztcclxuICAgICAgICAgIF9nbWFpbFN0YXRlLmxlYWRzID0gW107XHJcbiAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUgfSkpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2FkbWluL2dtYWlsL3N5bmMnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHsgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCk7IHJldHVybjsgfVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZ21haWwgPSBhd2FpdCBnZXRHbWFpbENsaWVudCgpO1xyXG4gICAgICAgICAgICBjb25zdCBQT1JUQUxfU0VOREVSUyA9IHtcclxuICAgICAgICAgICAgICAnSW5kaWFNYXJ0JzogWydpbmRpYW1hcnQnLCAnYnV5ZXJjb25uZWN0JywgJ2J1eWxlYWRzJ10sXHJcbiAgICAgICAgICAgICAgJ0p1c3REaWFsJzogWydqdXN0ZGlhbCcsICdqZC5jb20nXSxcclxuICAgICAgICAgICAgICAnVHJhZGVJbmRpYSc6IFsndHJhZGVpbmRpYSddLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjb25zdCBzZWFyY2hRdWVyeSA9ICdpbjppbmJveCAoZnJvbTppbmRpYW1hcnQgT1IgZnJvbTpqdXN0ZGlhbCBPUiBmcm9tOnRyYWRlaW5kaWEgT1IgZnJvbTpidXllcmNvbm5lY3QgT1IgZnJvbTpidXlsZWFkcyBPUiBzdWJqZWN0OmlucXVpcnkgT1Igc3ViamVjdDplbnF1aXJ5IE9SIHN1YmplY3Q6bGVhZCBPUiBzdWJqZWN0OnF1b3RlIE9SIHN1YmplY3Q6aW50ZXJlc3QpIG5ld2VyX3RoYW46MzBkJztcclxuICAgICAgICAgICAgY29uc3QgbXNnTGlzdCA9IGF3YWl0IGdtYWlsLnVzZXJzLm1lc3NhZ2VzLmxpc3QoeyB1c2VySWQ6ICdtZScsIG1heFJlc3VsdHM6IDUwLCBxOiBzZWFyY2hRdWVyeSB9KTtcclxuICAgICAgICAgICAgY29uc3QgbWVzc2FnZXMgPSBtc2dMaXN0LmRhdGEubWVzc2FnZXMgfHwgW107XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZExlYWRzID0gW107XHJcblxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IG1zZyBvZiBtZXNzYWdlcy5zbGljZSgwLCA0MCkpIHtcclxuICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGV0YWlsID0gYXdhaXQgZ21haWwudXNlcnMubWVzc2FnZXMuZ2V0KHsgdXNlcklkOiAnbWUnLCBpZDogbXNnLmlkLCBmb3JtYXQ6ICdmdWxsJyB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhlYWRlcnMgPSBkZXRhaWwuZGF0YS5wYXlsb2FkPy5oZWFkZXJzIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZnJvbSA9IGhlYWRlcnMuZmluZChoID0+IGgubmFtZSA9PT0gJ0Zyb20nKT8udmFsdWUgfHwgJyc7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJqZWN0ID0gaGVhZGVycy5maW5kKGggPT4gaC5uYW1lID09PSAnU3ViamVjdCcpPy52YWx1ZSB8fCAnJztcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGUgPSBoZWFkZXJzLmZpbmQoaCA9PiBoLm5hbWUgPT09ICdEYXRlJyk/LnZhbHVlIHx8ICcnO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZnJvbUxvd2VyID0gZnJvbS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBzb3VyY2UgPSAnR21haWwnO1xyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBbcG9ydGFsLCBrZXl3b3Jkc10gb2YgT2JqZWN0LmVudHJpZXMoUE9SVEFMX1NFTkRFUlMpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChrZXl3b3Jkcy5zb21lKGsgPT4gZnJvbUxvd2VyLmluY2x1ZGVzKGspKSkgeyBzb3VyY2UgPSBwb3J0YWw7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlID09PSAnR21haWwnKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHN1Ykxvd2VyID0gc3ViamVjdC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgICBpZiAoc3ViTG93ZXIuaW5jbHVkZXMoJ2luZGlhbWFydCcpIHx8IHN1Ykxvd2VyLmluY2x1ZGVzKCdidXllcicpKSBzb3VyY2UgPSAnSW5kaWFNYXJ0JztcclxuICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3ViTG93ZXIuaW5jbHVkZXMoJ2p1c3RkaWFsJykgfHwgc3ViTG93ZXIuaW5jbHVkZXMoJ2pkLmNvbScpIHx8IHN1Ykxvd2VyLmluY2x1ZGVzKCdqdXN0IGRpYWwnKSkgc291cmNlID0gJ0p1c3REaWFsJztcclxuICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3ViTG93ZXIuaW5jbHVkZXMoJ3RyYWRlaW5kaWEnKSkgc291cmNlID0gJ1RyYWRlSW5kaWEnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZSA9PT0gJ0dtYWlsJykgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGJvZHlUZXh0ID0gJyc7XHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBleHRyYWN0VGV4dChwYXJ0KSB7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChwYXJ0Lm1pbWVUeXBlID09PSAndGV4dC9wbGFpbicgJiYgcGFydC5ib2R5Py5kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9keVRleHQgKz0gQnVmZmVyLmZyb20ocGFydC5ib2R5LmRhdGEsICdiYXNlNjQnKS50b1N0cmluZygndXRmOCcpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGlmIChwYXJ0LnBhcnRzKSBwYXJ0LnBhcnRzLmZvckVhY2goZXh0cmFjdFRleHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGRldGFpbC5kYXRhLnBheWxvYWQpIGV4dHJhY3RUZXh0KGRldGFpbC5kYXRhLnBheWxvYWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFib2R5VGV4dCAmJiBkZXRhaWwuZGF0YS5zbmlwcGV0KSBib2R5VGV4dCA9IGRldGFpbC5kYXRhLnNuaXBwZXQ7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgcGhvbmVNYXRjaCA9IGJvZHlUZXh0Lm1hdGNoKC8oPzpcXCs5MVtcXHMtXT8pP1s2LTldXFxkezR9W1xccy1dP1xcZHs1fS8pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZU1hdGNoID0gYm9keVRleHQubWF0Y2goLyg/Om5hbWV8YnV5ZXJ8Y29udGFjdHxjbGllbnQpXFxzKls6XFwtXT9cXHMqKFtBLVphLXpcXHNdezIsNDB9KS9pKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNpdHlNYXRjaCA9IGJvZHlUZXh0Lm1hdGNoKC8oPzpjaXR5fGxvY2F0aW9ufGFkZHJlc3N8cGxhY2UpXFxzKls6XFwtXT9cXHMqKFtBLVphLXpcXHNdezIsMzB9KS9pKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RNYXRjaCA9IGJvZHlUZXh0Lm1hdGNoKC8oPzpwcm9kdWN0fG1hY2hpbmV8aXRlbXxpbnRlcmVzdHxyZXF1aXJlbWVudHxsb29raW5nIGZvcilcXHMqWzpcXC1dP1xccyooW0EtWmEtelxccyxdezMsNjB9KS9pKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVtYWlsTWF0Y2ggPSBib2R5VGV4dC5tYXRjaCgvW2EtekEtWjAtOS5fJSstXStAW2EtekEtWjAtOS4tXStcXC5bYS16QS1aXXsyLH0vKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lRnJvbUhlYWRlciA9IGZyb20ubWF0Y2goL15cIj8oW15cIjxdKylcIj9cXHMqPC8pID8gZnJvbS5tYXRjaCgvXlwiPyhbXlwiPF0rKVwiP1xccyo8LylbMV0udHJpbSgpIDogJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgcGFyc2VkTGVhZHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgIGlkOiBtc2cuaWQsXHJcbiAgICAgICAgICAgICAgICAgIHNvdXJjZSxcclxuICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZU1hdGNoPy5bMV0/LnRyaW0oKSB8fCBuYW1lRnJvbUhlYWRlciB8fCAnVW5rbm93bicsXHJcbiAgICAgICAgICAgICAgICAgIHBob25lOiBwaG9uZU1hdGNoID8gcGhvbmVNYXRjaFswXS5yZXBsYWNlKC9bXFxzLV0vZywgJycpIDogJycsXHJcbiAgICAgICAgICAgICAgICAgIGVtYWlsOiBlbWFpbE1hdGNoID8gZW1haWxNYXRjaFswXSA6ICcnLFxyXG4gICAgICAgICAgICAgICAgICBjb21wYW55OiAnJyxcclxuICAgICAgICAgICAgICAgICAgcHJvZHVjdDogcHJvZHVjdE1hdGNoPy5bMV0/LnRyaW0oKSB8fCAnJyxcclxuICAgICAgICAgICAgICAgICAgY2l0eTogY2l0eU1hdGNoPy5bMV0/LnRyaW0oKSB8fCAnJyxcclxuICAgICAgICAgICAgICAgICAgcmVjZWl2ZWRBdDogZGF0ZSA/IG5ldyBEYXRlKGRhdGUpLnRvSVNPU3RyaW5nKCkgOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICAgIHJhd1N1YmplY3Q6IHN1YmplY3QsXHJcbiAgICAgICAgICAgICAgICAgIGltcG9ydGVkOiBfZ21haWxTdGF0ZS5sZWFkcy5zb21lKGwgPT4gbC5pZCA9PT0gbXNnLmlkICYmIGwuaW1wb3J0ZWQpLFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgfSBjYXRjaCB7fVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBfZ21haWxTdGF0ZS5sZWFkcyA9IHBhcnNlZExlYWRzO1xyXG4gICAgICAgICAgICBfZ21haWxTdGF0ZS5sYXN0U3luY2VkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IG5ld0xlYWRzID0gcGFyc2VkTGVhZHMuZmlsdGVyKGwgPT4gIWwuaW1wb3J0ZWQpLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIF9nbWFpbFN0YXRlLmhpc3RvcnkudW5zaGlmdCh7XHJcbiAgICAgICAgICAgICAgaWQ6IGBzeW5jXyR7RGF0ZS5ub3coKX1gLFxyXG4gICAgICAgICAgICAgIHN5bmNlZEF0OiBfZ21haWxTdGF0ZS5sYXN0U3luY2VkQXQsXHJcbiAgICAgICAgICAgICAgc291cmNlOiAnZ21haWwnLFxyXG4gICAgICAgICAgICAgIHRvdGFsRmV0Y2hlZDogbWVzc2FnZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgIG5ld0xlYWRzLFxyXG4gICAgICAgICAgICAgIGltcG9ydGVkOiAwLFxyXG4gICAgICAgICAgICAgIHNraXBwZWQ6IHBhcnNlZExlYWRzLmZpbHRlcihsID0+IGwuaW1wb3J0ZWQpLmxlbmd0aCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmIChfZ21haWxTdGF0ZS5oaXN0b3J5Lmxlbmd0aCA+IDIwKSBfZ21haWxTdGF0ZS5oaXN0b3J5ID0gX2dtYWlsU3RhdGUuaGlzdG9yeS5zbGljZSgwLCAyMCk7XHJcblxyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgbGVhZHM6IHBhcnNlZExlYWRzLCB0b3RhbEZldGNoZWQ6IG1lc3NhZ2VzLmxlbmd0aCwgbmV3TGVhZHMsIHN5bmNlZEF0OiBfZ21haWxTdGF0ZS5sYXN0U3luY2VkQXQgfSkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdHbWFpbCBzeW5jIGZhaWxlZCcsIGxlYWRzOiBbXSB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYWRtaW4vZ21haWwvbGVhZHMnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgbGVhZHM6IF9nbWFpbFN0YXRlLmxlYWRzIH0pKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9hZG1pbi9nbWFpbC9pbXBvcnQnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHsgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCk7IHJldHVybjsgfVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7IGxldCBiID0gJyc7IHJlcS5vbignZGF0YScsIGMgPT4gYiArPSBjKTsgcmVxLm9uKCdlbmQnLCAoKSA9PiB7IHRyeSB7IHJlc29sdmUoSlNPTi5wYXJzZShiIHx8ICd7fScpKTsgfSBjYXRjaCB7IHJlc29sdmUoe30pOyB9IH0pOyB9KTtcclxuICAgICAgICAgICAgY29uc3QgbGVhZElkcyA9IGJvZHkubGVhZElkcyB8fCBbXTtcclxuICAgICAgICAgICAgbGV0IGltcG9ydGVkID0gMCwgc2tpcHBlZCA9IDA7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGlkIG9mIGxlYWRJZHMpIHtcclxuICAgICAgICAgICAgICBjb25zdCBsZWFkID0gX2dtYWlsU3RhdGUubGVhZHMuZmluZChsID0+IGwuaWQgPT09IGlkKTtcclxuICAgICAgICAgICAgICBpZiAoIWxlYWQgfHwgbGVhZC5pbXBvcnRlZCkgeyBza2lwcGVkKys7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgbGVhZC5pbXBvcnRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgaW1wb3J0ZWQrKztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKF9nbWFpbFN0YXRlLmhpc3RvcnkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgIF9nbWFpbFN0YXRlLmhpc3RvcnlbMF0uaW1wb3J0ZWQgKz0gaW1wb3J0ZWQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBpbXBvcnRlZCwgc2tpcHBlZCB9KSk7XHJcbiAgICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBpbXBvcnRlZDogMCwgc2tpcHBlZDogMCB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYWRtaW4vZ21haWwvaGlzdG9yeScsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBoaXN0b3J5OiBfZ21haWxTdGF0ZS5oaXN0b3J5IH0pKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gXHUyNTAwXHUyNTAwXHUyNTAwIEFJIE1lbW9yeSAmIFNtYXJ0IEZvbGxvdy11cCBBUEkgKERldiBNb2RlKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuICAgICAgICBjb25zdCBfbWVtb3J5Q29udmVyc2F0aW9ucyA9IG5ldyBNYXAoKTtcclxuICAgICAgICBjb25zdCBfbWVtb3J5Rm9sbG93dXBzID0gbmV3IE1hcCgpO1xyXG5cclxuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2FkbWluL21lbW9yeS9zdGF0cycsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gICAgICAgICAgaWYgKCFhZG1pbk9rKHJlcSwgcmVzKSkgcmV0dXJuO1xyXG4gICAgICAgICAgY29uc3QgYWxsID0gWy4uLl9tZW1vcnlGb2xsb3d1cHMudmFsdWVzKCldO1xyXG4gICAgICAgICAganNvbihyZXMsIHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgdG90YWw6IGFsbC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBlbmRpbmc6IGFsbC5maWx0ZXIoZiA9PiBmLnN0YXR1cyA9PT0gJ3BlbmRpbmcnKS5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNlbnQ6IGFsbC5maWx0ZXIoZiA9PiBmLnN0YXR1cyA9PT0gJ3NlbnQnKS5sZW5ndGgsXHJcbiAgICAgICAgICAgIGNhbmNlbGxlZDogYWxsLmZpbHRlcihmID0+IGYuc3RhdHVzID09PSAnY2FuY2VsbGVkJykubGVuZ3RoLFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYWRtaW4vbWVtb3J5L2xlYWQvJywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICBpZiAoIWFkbWluT2socmVxLCByZXMpKSByZXR1cm47XHJcbiAgICAgICAgICBjb25zdCBwaG9uZSA9IHJlcS51cmwucmVwbGFjZSgvXlxcLy8sICcnKS5yZXBsYWNlKC9cXEQvZywgJycpO1xyXG4gICAgICAgICAgY29uc3QgbXNncyA9IF9tZW1vcnlDb252ZXJzYXRpb25zLmdldChwaG9uZSkgfHwgW107XHJcbiAgICAgICAgICBjb25zdCBpbnRlbnRzID0gbXNncy5maWx0ZXIobSA9PiBtLmludGVudCkubWFwKG0gPT4gbS5pbnRlbnQpO1xyXG4gICAgICAgICAganNvbihyZXMsIHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgcHJvZmlsZTogeyBwaG9uZSwgdG90YWxNZXNzYWdlczogbXNncy5sZW5ndGgsIGludGVudHMgfSxcclxuICAgICAgICAgICAgaGlzdG9yeTogbXNncy5zbGljZSgtMjApLFxyXG4gICAgICAgICAgICBjb250ZXh0OiBgTGVhZCAke3Bob25lfTogJHttc2dzLmxlbmd0aH0gbWVzc2FnZXMsIGludGVudHM6ICR7aW50ZW50cy5qb2luKCcsICcpIHx8ICdub25lJ31gLFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFx1MjUwMFx1MjUwMFx1MjUwMCBBSSBOb3RlcyAmIFRhc2tzIEFQSSAoRGV2IE1vZGUpIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG4gICAgICAgIGNvbnN0IF9kZXZUYXNrcyA9IG5ldyBNYXAoKTtcclxuICAgICAgICBjb25zdCBfZGV2Tm90ZXMgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgbGV0IF9kZXZUYXNrSWQgPSAxO1xyXG5cclxuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2FkbWluL3Rhc2tzL3N0YXRzJywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICBpZiAoIWFkbWluT2socmVxLCByZXMpKSByZXR1cm47XHJcbiAgICAgICAgICBjb25zdCBhbGwgPSBbLi4uX2RldlRhc2tzLnZhbHVlcygpXTtcclxuICAgICAgICAgIGpzb24ocmVzLCB7IHN1Y2Nlc3M6IHRydWUsIHRvdGFsOiBhbGwubGVuZ3RoLCBwZW5kaW5nOiBhbGwuZmlsdGVyKHQgPT4gdC5zdGF0dXMgPT09ICdwZW5kaW5nJykubGVuZ3RoLCBjb21wbGV0ZWQ6IGFsbC5maWx0ZXIodCA9PiB0LnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcpLmxlbmd0aCwgc2tpcHBlZDogYWxsLmZpbHRlcih0ID0+IHQuc3RhdHVzID09PSAnc2tpcHBlZCcpLmxlbmd0aCwgdG9kYXlQZW5kaW5nOiAwLCBoaWdoUHJpb3JpdHk6IDAsIG5vdGVzQ291bnQ6IF9kZXZOb3Rlcy5zaXplIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2FkbWluL3Rhc2tzL3RvZGF5JywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICBpZiAoIWFkbWluT2socmVxLCByZXMpKSByZXR1cm47XHJcbiAgICAgICAgICBqc29uKHJlcywgeyBzdWNjZXNzOiB0cnVlLCB0YXNrczogWy4uLl9kZXZUYXNrcy52YWx1ZXMoKV0uZmlsdGVyKHQgPT4gdC5zdGF0dXMgPT09ICdwZW5kaW5nJykgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYWRtaW4vdGFza3MvdXBjb21pbmcnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmICghYWRtaW5PayhyZXEsIHJlcykpIHJldHVybjtcclxuICAgICAgICAgIGpzb24ocmVzLCB7IHN1Y2Nlc3M6IHRydWUsIHRhc2tzOiBbLi4uX2RldlRhc2tzLnZhbHVlcygpXS5maWx0ZXIodCA9PiB0LnN0YXR1cyA9PT0gJ3BlbmRpbmcnKSB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9hZG1pbi90YXNrcy9kYWlseS1wbGFuJywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICBpZiAoIWFkbWluT2socmVxLCByZXMpKSByZXR1cm47XHJcbiAgICAgICAgICBqc29uKHJlcywgeyBzdWNjZXNzOiB0cnVlLCBwbGFuOiAnRGV2IG1vZGU6IE5vIHRhc2tzIHlldC4gQ3JlYXRlIGxlYWRzIGFuZCBpbnRlcmFjdCB0byBnZW5lcmF0ZSBBSSBub3RlcyBhbmQgdGFza3MuJywgdGFza3M6IFtdLCB0YXNrQ291bnQ6IDAsIGhpZ2hQcmlvcml0eTogMCwgZ2VuZXJhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9hZG1pbi9ub3Rlcy9hbGwnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmICghYWRtaW5PayhyZXEsIHJlcykpIHJldHVybjtcclxuICAgICAgICAgIGpzb24ocmVzLCB7IHN1Y2Nlc3M6IHRydWUsIG5vdGVzOiBbLi4uX2Rldk5vdGVzLnZhbHVlcygpXSB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gXHUyNTAwXHUyNTAwXHUyNTAwIEFkbWluIENvbnRyb2wgUGFuZWwgQVBJIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG4gICAgICAgIC8vIEluLW1lbW9yeSBjb25maWcgKyBlcnJvciBsb2cgc3RvcmUgKGRldiBtb2RlKVxyXG4gICAgICAgIGNvbnN0IF9jZmcgPSB7XHJcbiAgICAgICAgICBhaUVuYWJsZWQ6IHRydWUsIGFpTW9kZWw6ICdnZW1pbmktMi41LWZsYXNoJywgd2hhdHNhcHBFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgcHVzaEVuYWJsZWQ6IHRydWUsIGZvbGxvd3VwRW5hYmxlZDogdHJ1ZSwgbWFpbnRlbmFuY2VNb2RlOiBmYWxzZSxcclxuICAgICAgICAgIGRhaWx5TWVzc2FnZUxpbWl0OiAxMDAsIGFsZXJ0T25FcnJvcjogdHJ1ZSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnN0IF9sb2dzID0gW107XHJcbiAgICAgICAgY29uc3QgX3N0YXRzID0geyBhaUNhbGxzOiAwLCBhaUVycm9yczogMCwgd2hhdHNhcHBTZW50OiAwLCB3aGF0c2FwcEZhaWxlZDogMCwgcHVzaFNlbnQ6IDAsIHRvdGFsTGVhZHM6IDAsIGZvbGxvd3Vwc1NlbnQ6IDAsIG1lc3NhZ2VzVG9kYXk6IDAsIHN0YXJ0VGltZTogRGF0ZS5ub3coKSB9O1xyXG4gICAgICAgIC8vIERhaWx5IHJlc2V0IGF0IG1pZG5pZ2h0XHJcbiAgICAgICAgY29uc3QgX21pZG5pZ2h0UmVzZXQgPSAoKSA9PiB7IGNvbnN0IG4gPSBuZXcgRGF0ZSgpOyBjb25zdCBtcyA9IG5ldyBEYXRlKG4uZ2V0RnVsbFllYXIoKSwgbi5nZXRNb250aCgpLCBuLmdldERhdGUoKSArIDEsIDAsIDAsIDUpIC0gbjsgc2V0VGltZW91dCgoKSA9PiB7IF9zdGF0cy5tZXNzYWdlc1RvZGF5ID0gMDsgc2V0SW50ZXJ2YWwoKCkgPT4geyBfc3RhdHMubWVzc2FnZXNUb2RheSA9IDA7IH0sIDg2NDAwMDAwKTsgfSwgbXMpOyB9O1xyXG4gICAgICAgIF9taWRuaWdodFJlc2V0KCk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlYWRCb2R5KHJlcSkge1xyXG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBiID0gJyc7IHJlcS5vbignZGF0YScsIGMgPT4gYiArPSBjKTsgcmVxLm9uKCdlbmQnLCAoKSA9PiB7IHRyeSB7IHJlc29sdmUoSlNPTi5wYXJzZShiIHx8ICd7fScpKTsgfSBjYXRjaCB7IHJlc29sdmUoe30pOyB9IH0pO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBhZG1pbk9rKHJlcSwgcmVzKSB7XHJcbiAgICAgICAgICBjb25zdCBUT0tFTiA9IHByb2Nlc3MuZW52LkFETUlOX0FQSV9UT0tFTjtcclxuICAgICAgICAgIGlmICghVE9LRU4pIHsgcmVzLndyaXRlSGVhZCg1MDMsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTsgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnQURNSU5fQVBJX1RPS0VOIG5vdCBjb25maWd1cmVkJyB9KSk7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgICAgY29uc3QgYmVhcmVyID0gKHJlcS5oZWFkZXJzWydhdXRob3JpemF0aW9uJ10gfHwgJycpLnJlcGxhY2UoL15CZWFyZXJcXHMrL2ksICcnKSB8fCByZXEuaGVhZGVyc1sneC1hZG1pbi10b2tlbiddIHx8ICcnO1xyXG4gICAgICAgICAgaWYgKGJlYXJlciAhPT0gVE9LRU4pIHsgcmVzLndyaXRlSGVhZCg0MDEsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTsgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnVW5hdXRob3JpemVkJyB9KSk7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBqc29uKHJlcywgZGF0YSwgc3RhdHVzID0gMjAwKSB7IHJlcy53cml0ZUhlYWQoc3RhdHVzLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7IHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpOyB9XHJcblxyXG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYWRtaW4vdmVyaWZ5JywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7IHJlcy53cml0ZUhlYWQoNDA1KTsgcmVzLmVuZCgpOyByZXR1cm47IH1cclxuICAgICAgICAgIGNvbnN0IFRPS0VOID0gcHJvY2Vzcy5lbnYuQURNSU5fQVBJX1RPS0VOO1xyXG4gICAgICAgICAgaWYgKCFUT0tFTikgcmV0dXJuIGpzb24ocmVzLCB7IGVycm9yOiAnQURNSU5fQVBJX1RPS0VOIG5vdCBjb25maWd1cmVkJyB9LCA1MDMpO1xyXG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRCb2R5KHJlcSk7XHJcbiAgICAgICAgICBpZiAoYm9keS50b2tlbiA9PT0gVE9LRU4pIHJldHVybiBqc29uKHJlcywgeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgcmV0dXJuIGpzb24ocmVzLCB7IGVycm9yOiAnSW52YWxpZCB0b2tlbicgfSwgNDAxKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9hZG1pbi9jb25maWcnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmICghYWRtaW5PayhyZXEsIHJlcykpIHJldHVybjtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnR0VUJykgcmV0dXJuIGpzb24ocmVzLCB7IC4uLl9jZmcgfSk7XHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ1BBVENIJykge1xyXG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxKTtcclxuICAgICAgICAgICAgY29uc3QgYWxsb3dlZCA9IFsnYWlFbmFibGVkJywnYWlNb2RlbCcsJ3doYXRzYXBwRW5hYmxlZCcsJ3B1c2hFbmFibGVkJywnZm9sbG93dXBFbmFibGVkJywnbWFpbnRlbmFuY2VNb2RlJywnZGFpbHlNZXNzYWdlTGltaXQnLCdhbGVydE9uRXJyb3InXTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBrIG9mIGFsbG93ZWQpIHsgaWYgKGsgaW4gYm9keSkgX2NmZ1trXSA9IGJvZHlba107IH1cclxuICAgICAgICAgICAgcmV0dXJuIGpzb24ocmVzLCB7IC4uLl9jZmcgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXMud3JpdGVIZWFkKDQwNSk7IHJlcy5lbmQoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9hZG1pbi9jb25maWcvcmVzZXQnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHsgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCk7IHJldHVybjsgfVxyXG4gICAgICAgICAgaWYgKCFhZG1pbk9rKHJlcSwgcmVzKSkgcmV0dXJuO1xyXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbihfY2ZnLCB7IGFpRW5hYmxlZDogdHJ1ZSwgYWlNb2RlbDogJ2dlbWluaS0yLjUtZmxhc2gnLCB3aGF0c2FwcEVuYWJsZWQ6IHRydWUsIHB1c2hFbmFibGVkOiB0cnVlLCBmb2xsb3d1cEVuYWJsZWQ6IHRydWUsIG1haW50ZW5hbmNlTW9kZTogZmFsc2UsIGRhaWx5TWVzc2FnZUxpbWl0OiAxMDAsIGFsZXJ0T25FcnJvcjogdHJ1ZSB9KTtcclxuICAgICAgICAgIHJldHVybiBqc29uKHJlcywgeyAuLi5fY2ZnIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2FkbWluL3N0YXRzJywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ0dFVCcpIHsgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCk7IHJldHVybjsgfVxyXG4gICAgICAgICAgaWYgKCFhZG1pbk9rKHJlcSwgcmVzKSkgcmV0dXJuO1xyXG4gICAgICAgICAganNvbihyZXMsIHtcclxuICAgICAgICAgICAgc3RhdHM6IHsgLi4uX3N0YXRzLCB1cHRpbWVTZWNvbmRzOiBNYXRoLmZsb29yKChEYXRlLm5vdygpIC0gX3N0YXRzLnN0YXJ0VGltZSkgLyAxMDAwKSwgZXJyb3JDb3VudDogX2xvZ3MubGVuZ3RoIH0sXHJcbiAgICAgICAgICAgIGNvbmZpZzogeyAuLi5fY2ZnIH0sXHJcbiAgICAgICAgICAgIGVudjoge1xyXG4gICAgICAgICAgICAgIHdoYXRzYXBwOiAhIXByb2Nlc3MuZW52LldIQVRTQVBQX0FDQ0VTU19UT0tFTixcclxuICAgICAgICAgICAgICBmY206ICEhcHJvY2Vzcy5lbnYuRkNNX1NFUlZFUl9LRVksXHJcbiAgICAgICAgICAgICAgb3BlbnJvdXRlcjogISEocHJvY2Vzcy5lbnYuQUlfSU5URUdSQVRJT05TX09QRU5ST1VURVJfQVBJX0tFWSB8fCBwcm9jZXNzLmVudi5PUEVOUk9VVEVSX0FQSV9LRVkpLFxyXG4gICAgICAgICAgICAgIGdlbWluaTogISEocHJvY2Vzcy5lbnYuR0VNSU5JX0FQSV9LRVkgfHwgcHJvY2Vzcy5lbnYuQUlfSU5URUdSQVRJT05TX0dFTUlOSV9BUElfS0VZKSxcclxuICAgICAgICAgICAgICBhZG1pblRva2VuOiAhIXByb2Nlc3MuZW52LkFETUlOX0FQSV9UT0tFTixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdXB0aW1lOiBwcm9jZXNzLnVwdGltZSgpLFxyXG4gICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2FkbWluL2xvZ3MnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgICAgICAgICBpZiAoIWFkbWluT2socmVxLCByZXMpKSByZXR1cm47XHJcbiAgICAgICAgICAgIHJldHVybiBqc29uKHJlcywgeyBsb2dzOiBfbG9ncy5zbGljZSgwLCA1MCksIHRvdGFsOiBfbG9ncy5sZW5ndGggfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ0RFTEVURScpIHtcclxuICAgICAgICAgICAgaWYgKCFhZG1pbk9rKHJlcSwgcmVzKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBfbG9ncy5sZW5ndGggPSAwO1xyXG4gICAgICAgICAgICByZXR1cm4ganNvbihyZXMsIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ0xvZ3MgY2xlYXJlZCcgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXMud3JpdGVIZWFkKDQwNSk7IHJlcy5lbmQoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9hZG1pbi9sb2dzL3Rlc3QnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHsgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCk7IHJldHVybjsgfVxyXG4gICAgICAgICAgaWYgKCFhZG1pbk9rKHJlcSwgcmVzKSkgcmV0dXJuO1xyXG4gICAgICAgICAgX2xvZ3MudW5zaGlmdCh7IGlkOiBEYXRlLm5vdygpLCB0czogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLCBzb3VyY2U6ICdBZG1pblBhbmVsJywgbWVzc2FnZTogJ1Rlc3QgZXJyb3IgXHUyMDE0IG1hbnVhbCB0cmlnZ2VyIGZyb20gQ29udHJvbCBQYW5lbCcsIGRldGFpbHM6ICdTeXN0ZW0gaXMgd29ya2luZyBjb3JyZWN0bHkuJyB9KTtcclxuICAgICAgICAgIHJldHVybiBqc29uKHJlcywgeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnVGVzdCBsb2cgZW50cnkgYWRkZWQnIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvKiBcdTI1MDBcdTI1MDAgQUk6IExlYWQgQW5hbHl0aWNzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xyXG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvbGVhZC1hbmFseXRpY3MnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZ2V0U3RhdHMsIGdldFNvdXJjZUFuYWx5dGljcywgZ2V0TG9jYXRpb25BbmFseXRpY3MsIGdldFByaW9yaXR5TGVhZHMgfSA9IGF3YWl0IGltcG9ydCgnLi9zZXJ2ZXIvbW9kZWxzL2xlYWRNb2RlbC5qcycpLmNhdGNoKCgpID0+ICh7fSkpO1xyXG4gICAgICAgICAgICBpZiAoIWdldFN0YXRzKSB7XHJcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgc3RhdHM6IHsgdG90YWw6IDAsIGhvdDogMCwgd2FybTogMCwgY29sZDogMCwgY29udmVydGVkOiAwLCBkcm9wcGVkOiAwIH0sIHNvdXJjZXM6IFtdLCBsb2NhdGlvbnM6IFtdLCBwcmlvcml0eUxlYWRzOiBbXSB9KSk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gZ2V0U3RhdHMoKTtcclxuICAgICAgICAgICAgY29uc3Qgc291cmNlcyA9IGdldFNvdXJjZUFuYWx5dGljcyA/IGdldFNvdXJjZUFuYWx5dGljcygpIDogW107XHJcbiAgICAgICAgICAgIGNvbnN0IGxvY2F0aW9ucyA9IGdldExvY2F0aW9uQW5hbHl0aWNzID8gZ2V0TG9jYXRpb25BbmFseXRpY3MoKSA6IFtdO1xyXG4gICAgICAgICAgICBjb25zdCBwcmlvcml0eUxlYWRzID0gZ2V0UHJpb3JpdHlMZWFkcyA/IGdldFByaW9yaXR5TGVhZHMoMTApIDogW107XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBzdGF0cywgc291cmNlcywgbG9jYXRpb25zLCBwcmlvcml0eUxlYWRzIH0pKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgc3RhdHM6IHsgdG90YWw6IDAgfSwgc291cmNlczogW10sIGxvY2F0aW9uczogW10sIHByaW9yaXR5TGVhZHM6IFtdIH0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLyogXHUyNTAwXHUyNTAwIEFJOiBJbnRlZ3JhdGlvbiBTdGF0dXMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9pbnRlZ3JhdGlvbi1zdGF0dXMnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHN0YXR1c2VzID0ge1xyXG4gICAgICAgICAgICB3aGF0c2FwcDogeyBjb25uZWN0ZWQ6ICEhKHByb2Nlc3MuZW52LldIQVRTQVBQX0FDQ0VTU19UT0tFTiksIGxhYmVsOiAnV2hhdHNBcHAgQnVzaW5lc3MgQVBJJywgbm90ZTogcHJvY2Vzcy5lbnYuV0hBVFNBUFBfQUNDRVNTX1RPS0VOID8gJ0xpdmUnIDogJ1Rva2VuIG5vdCBzZXQgXHUyMDE0IG1vY2sgbW9kZScgfSxcclxuICAgICAgICAgICAgZmNtOiB7IGNvbm5lY3RlZDogISEocHJvY2Vzcy5lbnYuRkNNX1NFUlZFUl9LRVkpLCBsYWJlbDogJ0ZpcmViYXNlIENsb3VkIE1lc3NhZ2luZycsIG5vdGU6IHByb2Nlc3MuZW52LkZDTV9TRVJWRVJfS0VZID8gJ0xpdmUnIDogJ0ZDTV9TRVJWRVJfS0VZIG5vdCBzZXQgXHUyMDE0IG5vIHB1c2gnIH0sXHJcbiAgICAgICAgICAgIGdtYWlsOiB7IGNvbm5lY3RlZDogdHJ1ZSwgbGFiZWw6ICdHbWFpbCBPQXV0aCcsIG5vdGU6ICdWaWEgUmVwbGl0IGNvbm5lY3RvcicgfSxcclxuICAgICAgICAgICAgZ2VtaW5pOiB7IGNvbm5lY3RlZDogISEocHJvY2Vzcy5lbnYuQUlfSU5URUdSQVRJT05TX0dFTUlOSV9BUElfS0VZKSwgbGFiZWw6ICdHZW1pbmkgQUknLCBub3RlOiBwcm9jZXNzLmVudi5BSV9JTlRFR1JBVElPTlNfR0VNSU5JX0FQSV9LRVkgPyAnQWN0aXZlJyA6ICdBUEkga2V5IG1pc3NpbmcnIH0sXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBzdGF0dXNlcyB9KSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8qIFx1MjUwMFx1MjUwMCBBSTogTWVzc2FnZSBRdWFsaXR5IENoZWNrZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9tZXNzYWdlLXF1YWxpdHknLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHsgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCk7IHJldHVybjsgfVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGV0IGJvZHkgPSAnJztcclxuICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXEpIGJvZHkgKz0gY2h1bms7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgbWVzc2FnZSwgbGVhZENvbnRleHQgfSA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgR29vZ2xlR2VuQUkgfSA9IGF3YWl0IGltcG9ydCgnQGdvb2dsZS9nZW5haScpO1xyXG4gICAgICAgICAgICBjb25zdCBhaSA9IG5ldyBHb29nbGVHZW5BSSh7IGFwaUtleTogcHJvY2Vzcy5lbnYuQUlfSU5URUdSQVRJT05TX0dFTUlOSV9BUElfS0VZIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBwcm9tcHQgPSBgWW91IGFyZSBhIFdoYXRzQXBwIHNhbGVzIG1lc3NhZ2UgZXhwZXJ0IGZvciBTQUkgUm9sb1RlY2ggKFJvbGwgRm9ybWluZyBNYWNoaW5lIG1hbnVmYWN0dXJlciwgRGVsaGkpLlxyXG5BbmFseXplIHRoaXMgbWVzc2FnZSBhbmQgcmV0dXJuIE9OTFkgdmFsaWQgSlNPTjpcclxue1xyXG4gIFwic2NvcmVcIjogPG51bWJlciAwLTEwMD4sXHJcbiAgXCJncmFkZVwiOiBcIjxFeGNlbGxlbnR8R29vZHxBdmVyYWdlfFdlYWt8UG9vcj5cIixcclxuICBcImlzc3Vlc1wiOiBbXCI8aXNzdWUxPlwiLCBcIjxpc3N1ZTI+XCJdLFxyXG4gIFwiaW1wcm92ZWRcIjogXCI8aW1wcm92ZWQgdmVyc2lvbiBvZiBtZXNzYWdlIGluIEhpbmdsaXNoPlwiLFxyXG4gIFwidGlwc1wiOiBbXCI8dGlwMT5cIiwgXCI8dGlwMj5cIl1cclxufVxyXG5cclxuTWVzc2FnZSB0byBhbmFseXplOiBcIiR7bWVzc2FnZX1cIlxyXG5MZWFkIENvbnRleHQ6IFwiJHtsZWFkQ29udGV4dCB8fCAnR2VuZXJhbCBsZWFkJ31cIlxyXG5cclxuU2NvcmUgYmFzZWQgb246IGNsYXJpdHksIHVyZ2VuY3ksIHBlcnNvbmFsaXphdGlvbiwgY2FsbC10by1hY3Rpb24sIGxlbmd0aCwgSGluZ2xpc2ggdG9uZS5gO1xyXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFpLm1vZGVscy5nZW5lcmF0ZUNvbnRlbnQoeyBtb2RlbDogJ2dlbWluaS0yLjUtZmxhc2gnLCBjb250ZW50czogW3sgcm9sZTogJ3VzZXInLCBwYXJ0czogW3sgdGV4dDogcHJvbXB0IH1dIH1dLCBjb25maWc6IHsgbWF4T3V0cHV0VG9rZW5zOiA4MDAsIHRlbXBlcmF0dXJlOiAwLjMgfSB9KTtcclxuICAgICAgICAgICAgbGV0IHRleHQgPSAocmVzcG9uc2UudGV4dCB8fCAne30nKS5yZXBsYWNlKC9gYGBqc29uXFxuPy9nLCAnJykucmVwbGFjZSgvYGBgXFxuPy9nLCAnJykudHJpbSgpO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBKU09OLnBhcnNlKHRleHQpO1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgLi4ucmVzdWx0IH0pKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnU2VydmljZSB0ZW1wb3JhcmlseSB1bmF2YWlsYWJsZScgfSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvKiBcdTI1MDBcdTI1MDAgQUk6IEEvQiBNZXNzYWdlIFZhcmlhbnRzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xyXG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYWItdmFyaWFudHMnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHsgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCk7IHJldHVybjsgfVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGV0IGJvZHkgPSAnJztcclxuICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXEpIGJvZHkgKz0gY2h1bms7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZ29hbCwgbGVhZE5hbWUsIGxvY2F0aW9uWm9uZSwgc291cmNlIH0gPSBKU09OLnBhcnNlKGJvZHkpO1xyXG4gICAgICAgICAgICBjb25zdCB7IEdvb2dsZUdlbkFJIH0gPSBhd2FpdCBpbXBvcnQoJ0Bnb29nbGUvZ2VuYWknKTtcclxuICAgICAgICAgICAgY29uc3QgYWkgPSBuZXcgR29vZ2xlR2VuQUkoeyBhcGlLZXk6IHByb2Nlc3MuZW52LkFJX0lOVEVHUkFUSU9OU19HRU1JTklfQVBJX0tFWSB9KTtcclxuICAgICAgICAgICAgY29uc3QgcHJvbXB0ID0gYFlvdSBhcmUgYSBXaGF0c0FwcCBzYWxlcyBleHBlcnQgZm9yIFNBSSBSb2xvVGVjaCAoUm9sbCBGb3JtaW5nIE1hY2hpbmVzLCBEZWxoaSkuXHJcbkdlbmVyYXRlIDIgQS9CIHRlc3QgbWVzc2FnZSB2YXJpYW50cy4gUmV0dXJuIE9OTFkgdmFsaWQgSlNPTjpcclxue1xyXG4gIFwidmFyaWFudEFcIjogeyBcImxhYmVsXCI6IFwiPHNob3J0IGxhYmVsPlwiLCBcIm1lc3NhZ2VcIjogXCI8V2hhdHNBcHAgbWVzc2FnZSBpbiBIaW5nbGlzaD5cIiwgXCJ0b25lXCI6IFwiPEZvcm1hbC9GcmllbmRseS9VcmdlbnQ+XCIsIFwiYmVzdEZvclwiOiBcIjx3aGVuIHRvIHVzZT5cIiB9LFxyXG4gIFwidmFyaWFudEJcIjogeyBcImxhYmVsXCI6IFwiPHNob3J0IGxhYmVsPlwiLCBcIm1lc3NhZ2VcIjogXCI8V2hhdHNBcHAgbWVzc2FnZSBpbiBIaW5nbGlzaCwgZGlmZmVyZW50IGFwcHJvYWNoPlwiLCBcInRvbmVcIjogXCI8Rm9ybWFsL0ZyaWVuZGx5L1VyZ2VudD5cIiwgXCJiZXN0Rm9yXCI6IFwiPHdoZW4gdG8gdXNlPlwiIH1cclxufVxyXG5cclxuR29hbDogJHtnb2FsfVxyXG5MZWFkIE5hbWU6ICR7bGVhZE5hbWUgfHwgJ0N1c3RvbWVyJ31cclxuTG9jYXRpb24gWm9uZTogJHtsb2NhdGlvblpvbmUgfHwgJ0hJR0gnfVxyXG5Tb3VyY2U6ICR7c291cmNlIHx8ICdpbmRpYW1hcnQnfWA7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYWkubW9kZWxzLmdlbmVyYXRlQ29udGVudCh7IG1vZGVsOiAnZ2VtaW5pLTIuNS1mbGFzaCcsIGNvbnRlbnRzOiBbeyByb2xlOiAndXNlcicsIHBhcnRzOiBbeyB0ZXh0OiBwcm9tcHQgfV0gfV0sIGNvbmZpZzogeyBtYXhPdXRwdXRUb2tlbnM6IDgwMCwgdGVtcGVyYXR1cmU6IDAuNyB9IH0pO1xyXG4gICAgICAgICAgICBsZXQgdGV4dCA9IChyZXNwb25zZS50ZXh0IHx8ICd7fScpLnJlcGxhY2UoL2BgYGpzb25cXG4/L2csICcnKS5yZXBsYWNlKC9gYGBcXG4/L2csICcnKS50cmltKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IEpTT04ucGFyc2UodGV4dCk7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCAuLi5yZXN1bHQgfSkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdTZXJ2aWNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlJyB9KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8qIFx1MjUwMFx1MjUwMCBQcm9kdWN0cyBDUlVEICsgUGhvdG8gVXBsb2FkIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGxldCBwcm9kdWN0QXBwID0gbnVsbDtcclxuICAgICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvcHJvZHVjdHMnLCBhc3luYyAocmVxLCByZXMsIG5leHQpID0+IHtcclxuICAgICAgICAgICAgaWYgKCFwcm9kdWN0QXBwKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBleHAgfSA9IGF3YWl0IGltcG9ydCgnZXhwcmVzcycpO1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogcHJvZHVjdHNSb3V0ZXIgfSA9IGF3YWl0IGltcG9ydCgnLi9zZXJ2ZXIvcm91dGVzL3Byb2R1Y3RzLmpzJyk7XHJcbiAgICAgICAgICAgICAgcHJvZHVjdEFwcCA9IGV4cCgpO1xyXG4gICAgICAgICAgICAgIHByb2R1Y3RBcHAudXNlKGV4cC5qc29uKHsgbGltaXQ6ICcybWInIH0pKTtcclxuICAgICAgICAgICAgICBwcm9kdWN0QXBwLnVzZShleHAudXJsZW5jb2RlZCh7IGV4dGVuZGVkOiBmYWxzZSB9KSk7XHJcbiAgICAgICAgICAgICAgcHJvZHVjdEFwcC51c2UoJy8nLCBwcm9kdWN0c1JvdXRlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVxLnVybCA9IHJlcS51cmwucmVwbGFjZSgvXlxcL2FwaVxcL3Byb2R1Y3RzLywgJycpIHx8ICcvJztcclxuICAgICAgICAgICAgcHJvZHVjdEFwcChyZXEsIHJlcywgbmV4dCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qIFx1MjUwMFx1MjUwMCBCZXRhIFRlc3RpbmcgRW5kcG9pbnRzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGNvbnN0IGRldkJldGFMb2cgPSBbXTtcclxuXHJcbiAgICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2JldGEvY3JlYXRlLWxlYWQnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykgeyByZXMud3JpdGVIZWFkKDQwNSk7IHJlcy5lbmQoKTsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgbGV0IGJvZHkgPSAnJzsgZm9yIGF3YWl0IChjb25zdCBjIG9mIHJlcSkgYm9keSArPSBjO1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgbmFtZSwgcGhvbmUsIHNvdXJjZSA9ICdiZXRhX3Rlc3QnLCBzdGF0ZSA9ICdEZWxoaScsIG5vdGVzID0gJycgfSA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgICAgICAgaWYgKCFuYW1lIHx8ICFwaG9uZSkgeyByZXMud3JpdGVIZWFkKDQwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pOyByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnbmFtZSBhbmQgcGhvbmUgcmVxdWlyZWQnIH0pKTsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgY29uc3QgeyBjcmVhdGVMZWFkIH0gPSBhd2FpdCBpbXBvcnQoJy4vc2VydmVyL21vZGVscy9sZWFkTW9kZWwuanMnKS5jYXRjaCgoKSA9PiAoe30pKTtcclxuICAgICAgICAgICAgICBpZiAoIWNyZWF0ZUxlYWQpIHsgcmVzLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTsgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIG1vY2s6IHRydWUsIGxlYWQ6IHsgbmFtZSwgcGhvbmU6IHBob25lLnJlcGxhY2UoL1xcRC9nLCcnKSwgc291cmNlLCBzdGF0ZSB9IH0pKTsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gY3JlYXRlTGVhZCh7IG5hbWUsIHBob25lLCBzb3VyY2UsIGV4dHJhOiB7IHN0YXRlLCBub3RlcywgaXNCZXRhVGVzdDogdHJ1ZSB9IH0pO1xyXG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7IHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCAuLi5yZXN1bHQgfSkpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7IHJlcy53cml0ZUhlYWQoNTAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7IHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9KSk7IH1cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYmV0YS9zZW5kLXdhJywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHsgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCk7IHJldHVybjsgfVxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGxldCBib2R5ID0gJyc7IGZvciBhd2FpdCAoY29uc3QgYyBvZiByZXEpIGJvZHkgKz0gYztcclxuICAgICAgICAgICAgICBjb25zdCB7IHBob25lLCBtZXNzYWdlVHlwZSwgZGF5SW5kZXggPSAwLCBjdXN0b21UZXh0IH0gPSBKU09OLnBhcnNlKGJvZHkpO1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgZ2V0TGVhZCB9ID0gYXdhaXQgaW1wb3J0KCcuL3NlcnZlci9tb2RlbHMvbGVhZE1vZGVsLmpzJykuY2F0Y2goKCkgPT4gKHt9KSk7XHJcbiAgICAgICAgICAgICAgY29uc3QgbGVhZCA9IGdldExlYWQgPyBnZXRMZWFkKHBob25lLnJlcGxhY2UoL1xcRC9nLCAnJykpIDogbnVsbDtcclxuICAgICAgICAgICAgICBjb25zdCBtb2NrTGVhZCA9IGxlYWQgfHwgeyBuYW1lOiAnQmV0YSBUZXN0ZXInLCBwaG9uZTogcGhvbmUucmVwbGFjZSgvXFxEL2csICcnKSwgc2NvcmU6ICdXQVJNJywgbG9jYXRpb25Qcmlvcml0eTogJ0hJR0gnLCBzb3VyY2U6ICdiZXRhX3Rlc3QnIH07XHJcbiAgICAgICAgICAgICAgY29uc3QgZW50cnkgPSB7IGlkOiBgbXNnXyR7RGF0ZS5ub3coKX1gLCBwaG9uZTogbW9ja0xlYWQucGhvbmUsIGxlYWROYW1lOiBtb2NrTGVhZC5uYW1lLCBtZXNzYWdlVHlwZSwgbGFiZWw6IHsgd2VsY29tZTogJ1dlbGNvbWUnLCBmb2xsb3d1cDogYEZvbGxvdy11cCBEJHtkYXlJbmRleH1gLCBhZG1pbl9hbGVydDogJ0FkbWluIEFsZXJ0JywgcXVvdGF0aW9uOiAnUXVvdGF0aW9uJywgY3VzdG9tOiAnQ3VzdG9tJyB9W21lc3NhZ2VUeXBlXSB8fCBtZXNzYWdlVHlwZSwgZGF5SW5kZXgsIG1vY2s6ICEocHJvY2Vzcy5lbnYuV0hBVFNBUFBfQUNDRVNTX1RPS0VOKSwgYmxvY2tlZDogZmFsc2UsIHdhTWVzc2FnZUlkOiBudWxsLCBzdGF0dXM6IHByb2Nlc3MuZW52LldIQVRTQVBQX0FDQ0VTU19UT0tFTiA/ICdyZWFsX3NlbnQnIDogJ21vY2tfc2VudCcsIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH07XHJcbiAgICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52LldIQVRTQVBQX0FDQ0VTU19UT0tFTiAmJiBwcm9jZXNzLmVudi5XSEFUU0FQUF9QSE9ORV9JRCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgd2EgPSBhd2FpdCBpbXBvcnQoJy4vc2VydmVyL3NlcnZpY2VzL3doYXRzYXBwU2VydmljZS5qcycpLmNhdGNoKCgpID0+ICh7fSkpO1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgbGV0IHdhUmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICBpZiAobWVzc2FnZVR5cGUgPT09ICd3ZWxjb21lJykgd2FSZXN1bHQgPSBhd2FpdCB3YS5zZW5kV2VsY29tZU1lc3NhZ2U/Lihtb2NrTGVhZCk7XHJcbiAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1lc3NhZ2VUeXBlID09PSAnZm9sbG93dXAnKSB3YVJlc3VsdCA9IGF3YWl0IHdhLnNlbmRGb2xsb3d1cD8uKG1vY2tMZWFkLCBkYXlJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1lc3NhZ2VUeXBlID09PSAnYWRtaW5fYWxlcnQnKSB3YVJlc3VsdCA9IGF3YWl0IHdhLnNlbmRBZG1pbkFsZXJ0Py4obW9ja0xlYWQsICdCZXRhIFRlc3QnKTtcclxuICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobWVzc2FnZVR5cGUgPT09ICdxdW90YXRpb24nKSB3YVJlc3VsdCA9IGF3YWl0IHdhLnNlbmRRdW90YXRpb25Gb2xsb3d1cD8uKG1vY2tMZWFkKTtcclxuICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobWVzc2FnZVR5cGUgPT09ICdjdXN0b20nICYmIGN1c3RvbVRleHQpIHdhUmVzdWx0ID0gYXdhaXQgd2Euc2VuZEN1c3RvbT8uKHBob25lLCBjdXN0b21UZXh0KTtcclxuICAgICAgICAgICAgICAgICAgZW50cnkud2FNZXNzYWdlSWQgPSB3YVJlc3VsdD8ubWVzc2FnZXM/LlswXT8uaWQgfHwgbnVsbDtcclxuICAgICAgICAgICAgICAgICAgZW50cnkubW9jayA9ICEhd2FSZXN1bHQ/Lm1vY2s7IGVudHJ5LmJsb2NrZWQgPSAhIXdhUmVzdWx0Py5ibG9ja2VkO1xyXG4gICAgICAgICAgICAgICAgICBlbnRyeS5zdGF0dXMgPSB3YVJlc3VsdD8uYmxvY2tlZCA/ICdibG9ja2VkJyA6IHdhUmVzdWx0Py5tb2NrID8gJ21vY2tfc2VudCcgOiAncmVhbF9zZW50JztcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikgeyBlbnRyeS5zdGF0dXMgPSAnZXJyb3InOyBlbnRyeS5lcnJvciA9IGVyci5tZXNzYWdlOyB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGRldkJldGFMb2cudW5zaGlmdChlbnRyeSk7IGlmIChkZXZCZXRhTG9nLmxlbmd0aCA+IDIwMCkgZGV2QmV0YUxvZy5wb3AoKTtcclxuICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pOyByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgZW50cnkgfSkpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7IHJlcy53cml0ZUhlYWQoNTAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7IHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9KSk7IH1cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYmV0YS9nZXQtbGVhZCcsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwsICdodHRwOi8veCcpOyBjb25zdCBwaG9uZSA9ICh1cmwuc2VhcmNoUGFyYW1zLmdldCgncGhvbmUnKSB8fCAnJykucmVwbGFjZSgvXFxEL2csICcnKTtcclxuICAgICAgICAgICAgY29uc3QgeyBnZXRMZWFkIH0gPSBhd2FpdCBpbXBvcnQoJy4vc2VydmVyL21vZGVscy9sZWFkTW9kZWwuanMnKS5jYXRjaCgoKSA9PiAoe30pKTtcclxuICAgICAgICAgICAgY29uc3QgbGVhZCA9IGdldExlYWQgPyBnZXRMZWFkKHBob25lKSA6IG51bGw7XHJcbiAgICAgICAgICAgIGlmICghbGVhZCkgeyByZXMud3JpdGVIZWFkKDQwNCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pOyByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTGVhZCBub3QgZm91bmQnIH0pKTsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7IHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBsZWFkIH0pKTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYmV0YS9tZXNzYWdlLWxvZycsIChyZXEsIHJlcykgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwsICdodHRwOi8veCcpOyBjb25zdCBwaG9uZSA9ICh1cmwuc2VhcmNoUGFyYW1zLmdldCgncGhvbmUnKSB8fCAnJykucmVwbGFjZSgvXFxEL2csICcnKTtcclxuICAgICAgICAgICAgY29uc3QgbG9nID0gcGhvbmUgPyBkZXZCZXRhTG9nLmZpbHRlcihtID0+IG0ucGhvbmUgPT09IHBob25lKSA6IGRldkJldGFMb2c7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7IHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBsb2csIHRvdGFsOiBsb2cubGVuZ3RoIH0pKTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYmV0YS9jbGVhci1sb2cnLCAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgICAgZGV2QmV0YUxvZy5sZW5ndGggPSAwO1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pOyByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSB9KSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qIFx1MjUwMFx1MjUwMCBBSTogU21hcnQgVGltaW5nIEFkdmlzb3IgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9zbWFydC10aW1pbmcnLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHsgcmVzLndyaXRlSGVhZCg0MDUpOyByZXMuZW5kKCk7IHJldHVybjsgfVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGV0IGJvZHkgPSAnJztcclxuICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXEpIGJvZHkgKz0gY2h1bms7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgc2NvcmUsIGxvY2F0aW9uWm9uZSwgc291cmNlLCBkYXlzU2luY2VDcmVhdGlvbiwgcmVwbGllc0NvdW50IH0gPSBKU09OLnBhcnNlKGJvZHkpO1xyXG4gICAgICAgICAgICBjb25zdCB7IEdvb2dsZUdlbkFJIH0gPSBhd2FpdCBpbXBvcnQoJ0Bnb29nbGUvZ2VuYWknKTtcclxuICAgICAgICAgICAgY29uc3QgYWkgPSBuZXcgR29vZ2xlR2VuQUkoeyBhcGlLZXk6IHByb2Nlc3MuZW52LkFJX0lOVEVHUkFUSU9OU19HRU1JTklfQVBJX0tFWSB9KTtcclxuICAgICAgICAgICAgY29uc3QgcHJvbXB0ID0gYFlvdSBhcmUgYSBzYWxlcyB0aW1pbmcgZXhwZXJ0IGZvciBTQUkgUm9sb1RlY2ggQ1JNIChSb2xsIEZvcm1pbmcgTWFjaGluZXMsIERlbGhpKS5cclxuQmFzZWQgb24gbGVhZCBwcm9maWxlLCByZWNvbW1lbmQgZm9sbG93LXVwIHRpbWluZy4gUmV0dXJuIE9OTFkgdmFsaWQgSlNPTjpcclxue1xyXG4gIFwid2FpdERheXNcIjogPG51bWJlciAwLTMwPixcclxuICBcImJlc3RUaW1lXCI6IFwiPGUuZy4gMTA6MDAgQU0gLSAxMjowMCBQTT5cIixcclxuICBcInVyZ2VuY3lcIjogXCI8SW1tZWRpYXRlfFRvZGF5fFRoaXMgV2Vla3xOZXh0IFdlZWt8TW9udGhseT5cIixcclxuICBcInJlYXNvblwiOiBcIjwxLTIgbGluZXMgd2h5IHRoaXMgdGltaW5nPlwiLFxyXG4gIFwiYWN0aW9uXCI6IFwiPHNwZWNpZmljIGFjdGlvbiB0byB0YWtlPlwiXHJcbn1cclxuXHJcbkxlYWQgU2NvcmU6ICR7c2NvcmV9XHJcbkxvY2F0aW9uIFpvbmU6ICR7bG9jYXRpb25ab25lfVxyXG5Tb3VyY2U6ICR7c291cmNlfVxyXG5EYXlzIFNpbmNlIENyZWF0aW9uOiAke2RheXNTaW5jZUNyZWF0aW9ufVxyXG5SZXBsaWVzIEdpdmVuOiAke3JlcGxpZXNDb3VudH1gO1xyXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFpLm1vZGVscy5nZW5lcmF0ZUNvbnRlbnQoeyBtb2RlbDogJ2dlbWluaS0yLjUtZmxhc2gnLCBjb250ZW50czogW3sgcm9sZTogJ3VzZXInLCBwYXJ0czogW3sgdGV4dDogcHJvbXB0IH1dIH1dLCBjb25maWc6IHsgbWF4T3V0cHV0VG9rZW5zOiA0MDAsIHRlbXBlcmF0dXJlOiAwLjMgfSB9KTtcclxuICAgICAgICAgICAgbGV0IHRleHQgPSAocmVzcG9uc2UudGV4dCB8fCAne30nKS5yZXBsYWNlKC9gYGBqc29uXFxuPy9nLCAnJykucmVwbGFjZSgvYGBgXFxuPy9nLCAnJykudHJpbSgpO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBKU09OLnBhcnNlKHRleHQpO1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgLi4ucmVzdWx0IH0pKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnU2VydmljZSB0ZW1wb3JhcmlseSB1bmF2YWlsYWJsZScgfSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgXSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogJzAuMC4wLjAnLFxyXG4gICAgcG9ydDogNTAwMCxcclxuICAgIGFsbG93ZWRIb3N0czogdHJ1ZSxcclxuICAgIHdhdGNoOiB7XHJcbiAgICAgIGlnbm9yZWQ6IFsnKiovLmxvY2FsLyoqJywgJyoqL25vZGVfbW9kdWxlcy8qKiddLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIGJ1aWxkOiB7XHJcbiAgICB0YXJnZXQ6ICdlczIwMTUnLFxyXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgJ3ZlbmRvci1yZWFjdCc6IFsncmVhY3QnLCAncmVhY3QtZG9tJ10sXHJcbiAgICAgICAgICAndmVuZG9yLW1vdGlvbic6IFsnZnJhbWVyLW1vdGlvbiddLFxyXG4gICAgICAgICAgJ3ZlbmRvci1jaGFydHMnOiBbJ3JlY2hhcnRzJ10sXHJcbiAgICAgICAgICAndmVuZG9yLXJvdXRlcic6IFsnd291dGVyJ10sXHJcbiAgICAgICAgICAndmVuZG9yLXVpJzogW1xyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWRpYWxvZycsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9hc3QnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRvZ2dsZScsXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA2MDAsXHJcbiAgfSxcclxuICBkZWZpbmU6IHtcclxuICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9GSVJFQkFTRV9BUElfS0VZJzogSlNPTi5zdHJpbmdpZnkoXHJcbiAgICAgIHByb2Nlc3MuZW52LlZJVEVfRklSRUJBU0VfQVBJX0tFWSB8fFxyXG4gICAgICBwcm9jZXNzLmVudi5GSVJFX0JBU0VfQVBJX0tFWSB8fFxyXG4gICAgICBwcm9jZXNzLmVudi5HT09HTEVf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SztBQUFBLE1BQzVDLFFBQVEsSUFBSSx5QkFDWixRQUFRLElBQUkscUJBQ1osUUFBUSxJQUFJLGtCQUFrQjtBQUFBLElBQ2hDO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbIl9fZGlybmFtZSIsICJmcyIsICJwYXRoIiwgImZpbGVVUkxUb1BhdGgiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCIsICJfX2Rpcm5hbWUiLCAiZnMiLCAicGF0aCIsICJmaWxlVVJMVG9QYXRoIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwiLCAiX19kaXJuYW1lIiwgImZzIiwgInBhdGgiLCAiZmlsZVVSTFRvUGF0aCIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsIiwgIl9fZGlybmFtZSIsICJwYXRoIiwgImNyZWF0ZUxlYWQiLCAiZW5xdWV1ZSIsICJnZXRMZWFkIiwgInVwZGF0ZUxlYWQiLCAicmVjYWxjdWxhdGVTY29yZSIsICJnZXRBbGxMZWFkcyIsICJnZXRTdGF0cyIsICJsZWFkcyIsICJfbG9ncyIsICJfc3RhdHMiLCAiZ2V0U291cmNlQW5hbHl0aWNzIiwgImdldExvY2F0aW9uQW5hbHl0aWNzIiwgImdldFByaW9yaXR5TGVhZHMiLCAicGF0aCJdCn0K
