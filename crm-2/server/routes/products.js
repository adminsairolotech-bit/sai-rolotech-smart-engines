/**
 * Product Catalog CRUD + Photo/Video Upload
 * Routes: /api/products/*
 */
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

/* ── File paths ─────────────────────────────────────── */
const DATA_FILE    = path.join(__dirname, '..', '..', 'data', 'products.json');
const UPLOAD_DIR   = path.join(__dirname, '..', '..', 'public', 'uploads', 'products');

/* ── Ensure directories exist ───────────────────────── */
if (!fs.existsSync(path.join(__dirname, '..', '..', 'data'))) {
  fs.mkdirSync(path.join(__dirname, '..', '..', 'data'), { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/* ── Multer — disk storage ──────────────────────────── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = /image\/(jpeg|jpg|png|webp|gif)|video\/(mp4|mov|avi|webm)/;
    cb(null, allowed.test(file.mimetype));
  },
});

/* ── Product helpers ────────────────────────────────── */
function readProducts() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch { return []; }
}

function writeProducts(products) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
}

/* ── GET /api/products ──────────────────────────────── */
router.get('/', (req, res) => {
  const products = readProducts();
  const { category, featured, available } = req.query;
  let filtered = products;
  if (category)  filtered = filtered.filter(p => p.category === category);
  if (featured === 'true') filtered = filtered.filter(p => p.featured);
  if (available === 'true') filtered = filtered.filter(p => p.available !== false);
  res.json({ success: true, products: filtered, total: filtered.length });
});

/* ── GET /api/products/categories/list ──────────────── */
/* NOTE: Must be before /:id to avoid Express matching "categories" as an ID */
router.get('/categories/list', (req, res) => {
  const products = readProducts();
  const categories = [...new Set(products.map(p => p.category))];
  res.json({ success: true, categories });
});

/* ── POST /api/products/ai-command ──────────────────── */
/* NOTE: Must be before /:id to avoid Express matching "ai-command" as an ID */
router.post('/ai-command', async (req, res) => {
  try {
    const GEMINI_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      return res.status(503).json({ success: false, error: 'Gemini API key not configured.' });
    }

    const { command, history = [] } = req.body;
    if (!command?.trim()) return res.status(400).json({ success: false, error: 'command required' });

    const products = readProducts();
    const productSummary = products.map(p =>
      `- ID: ${p.id} | Name: "${p.name}" | Category: "${p.category}" | Price: ₹${p.price} | Available: ${p.available} | Featured: ${p.featured}`
    ).join('\n');

    const systemPrompt = `Tu SAI RoloTech CRM ka AI Product Manager hai. SAI RoloTtech Delhi mein Roll Forming Machine manufacturer hai.

CURRENT PRODUCTS IN DATABASE:
${productSummary || '(koi product nahi hai abhi)'}

VALID CATEGORIES: Shutter Plant, False Ceiling, Pipe Mill, Purlin Machine, Stud Track, Custom

Admin ki natural language command sun aur SIRF ek valid JSON object return kar. Koi bhi extra text, explanation ya markdown nahi — sirf raw JSON.

JSON format:
{
  "action": "create" | "update" | "delete" | "none",
  "message": "<Hinglish mein kya kiya ya kya samjha — ek line>",
  "data": { name, category, description, price, unit, specs, leadTime, available, featured, tags },
  "id": "prod_xxx",
  "changes": { field: value }
}

Rules:
- create: naya product. data mein sab fields bharo. price = number (350000 for ₹3.5 lac). available=true by default.
- update: existing product update. id zaroori. changes mein sirf changed fields.
- delete: product delete. id zaroori.
- none: command unclear hai ya info chahiye. message mein samjhao.
- Product name se match karo (case-insensitive, partial ok) — phir uska ID use karo.
- "lac"/"lakh" in price → multiply by 100000. "k"/"K" → multiply by 1000.
- Category change = update with changes:{ category: "New Category" }.
- Agar command mein product ka naam ambiguous hai, action "none" aur clarify karo.`;

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

    const contents = [
      ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: command }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: { systemInstruction: systemPrompt, maxOutputTokens: 1024, temperature: 0.1 },
    });

    const raw = (response.text || '{}').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.json({ success: false, error: 'Gemini ne valid JSON nahi diya', raw });
    const aiResult = JSON.parse(jsonMatch[0]);
    const { action, message, data, id, changes } = aiResult;

    let executedProduct = null;
    let executionResult = 'none';

    if (action === 'create' && data) {
      const prods = readProducts();
      const newProd = {
        id: `prod_${Date.now()}`,
        name: (data.name || 'Untitled').trim(),
        category: data.category || 'Custom',
        description: data.description || '',
        price: parseFloat(data.price) || 0,
        unit: data.unit || 'Set',
        photos: [],
        videoUrl: data.videoUrl || '',
        specs: data.specs || '',
        leadTime: data.leadTime || '',
        available: data.available !== false,
        featured: !!data.featured,
        tags: Array.isArray(data.tags) ? data.tags : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      prods.push(newProd);
      writeProducts(prods);
      executedProduct = newProd;
      executionResult = 'created';

    } else if (action === 'update' && id && changes) {
      const prods = readProducts();
      const idx = prods.findIndex(p => p.id === id);
      if (idx === -1) return res.json({ success: false, error: `Product ID "${id}" nahi mila`, aiMessage: message });
      if (changes.price !== undefined) changes.price = parseFloat(changes.price) || 0;
      if (changes.available !== undefined) changes.available = changes.available !== false && changes.available !== 'false';
      if (changes.featured !== undefined) changes.featured = changes.featured === true || changes.featured === 'true';
      prods[idx] = { ...prods[idx], ...changes, id: prods[idx].id, updatedAt: new Date().toISOString() };
      writeProducts(prods);
      executedProduct = prods[idx];
      executionResult = 'updated';

    } else if (action === 'delete' && id) {
      const prods = readProducts();
      const prod = prods.find(p => p.id === id);
      if (!prod) return res.json({ success: false, error: `Product ID "${id}" nahi mila`, aiMessage: message });
      (prod.photos || []).forEach(url => {
        const fp = path.join(__dirname, '..', '..', 'public', url.replace(/^\//, ''));
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      });
      writeProducts(prods.filter(p => p.id !== id));
      executedProduct = prod;
      executionResult = 'deleted';
    }

    res.json({
      success: true,
      action,
      executionResult,
      message: message || 'Done',
      product: executedProduct,
      products: readProducts(),
    });

  } catch (e) {
    console.error('[AI-Command]', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/* ── GET /api/products/:id ──────────────────────────── */
router.get('/:id', (req, res) => {
  const products = readProducts();
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, product });
});

/* ── POST /api/products ─────────────────────────────── */
router.post('/', (req, res) => {
  try {
    const { name, category, description, price, unit, specs, leadTime, videoUrl, tags, featured, available } = req.body;
    if (!name || !category) return res.status(400).json({ success: false, error: 'name and category required' });

    const products = readProducts();
    const product = {
      id: `prod_${Date.now()}`,
      name: name.trim(),
      category: category.trim(),
      description: description?.trim() || '',
      price: parseFloat(price) || 0,
      unit: unit || 'Set',
      photos: [],
      videoUrl: videoUrl?.trim() || '',
      specs: specs?.trim() || '',
      leadTime: leadTime?.trim() || '',
      available: available !== false && available !== 'false',
      featured: featured === true || featured === 'true',
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.push(product);
    writeProducts(products);
    res.json({ success: true, product });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/* ── PUT /api/products/:id ──────────────────────────── */
router.put('/:id', (req, res) => {
  try {
    const products = readProducts();
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Product not found' });

    const updates = req.body;
    if (updates.price !== undefined) updates.price = parseFloat(updates.price) || 0;
    if (updates.available !== undefined) updates.available = updates.available !== false && updates.available !== 'false';
    if (updates.featured !== undefined) updates.featured = updates.featured === true || updates.featured === 'true';

    products[idx] = { ...products[idx], ...updates, id: products[idx].id, updatedAt: new Date().toISOString() };
    writeProducts(products);
    res.json({ success: true, product: products[idx] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/* ── DELETE /api/products/:id ───────────────────────── */
router.delete('/:id', (req, res) => {
  try {
    const products = readProducts();
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    // Delete photo files
    (product.photos || []).forEach(photoUrl => {
      const filePath = path.join(__dirname, '..', '..', 'public', photoUrl.replace('/uploads', 'uploads'));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    writeProducts(products.filter(p => p.id !== req.params.id));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/* ── POST /api/products/:id/photos ──────────────────── */
router.post('/:id/photos', upload.array('photos', 10), (req, res) => {
  try {
    const products = readProducts();
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Product not found' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, error: 'No files uploaded' });

    const urls = req.files.map(f => `/uploads/products/${f.filename}`);
    products[idx].photos = [...(products[idx].photos || []), ...urls];
    products[idx].updatedAt = new Date().toISOString();
    writeProducts(products);
    res.json({ success: true, urls, product: products[idx] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/* ── DELETE /api/products/:id/photos ────────────────── */
router.delete('/:id/photos', (req, res) => {
  try {
    const { url } = req.body;
    const products = readProducts();
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Product not found' });

    // Delete file
    const filePath = path.join(__dirname, '..', '..', 'public', url.replace(/^\//, ''));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    products[idx].photos = (products[idx].photos || []).filter(p => p !== url);
    products[idx].updatedAt = new Date().toISOString();
    writeProducts(products);
    res.json({ success: true, product: products[idx] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
