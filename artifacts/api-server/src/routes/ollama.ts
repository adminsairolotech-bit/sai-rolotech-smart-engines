import { Router } from 'express';

const router = Router();

// Ollama configuration
const OLLAMA_BASE = process.env.OLLAMA_BASE || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'sairolotech-expert';
const FALLBACK_MODEL = 'llama3.2:3b';

// Check if Ollama is available
router.get('/status', async (_req, res) => {
  try {
    const response = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      res.json({
        success: true,
        available: true,
        base: OLLAMA_BASE,
        defaultModel: DEFAULT_MODEL,
        models: data.models?.map((m: any) => m.name) || []
      });
    } else {
      res.json({ success: true, available: false, error: 'Ollama not responding' });
    }
  } catch (e: any) {
    res.json({ success: true, available: false, error: e.message });
  }
});

// List available models
router.get('/models', async (_req, res) => {
  try {
    const response = await fetch(`${OLLAMA_BASE}/api/tags`);
    const data = await response.json();
    res.json({ success: true, models: data.models || [] });
  } catch (e: any) {
    res.json({ success: false, error: e.message, models: [] });
  }
});

// Generate completion using Ollama
router.post('/generate', async (req, res) => {
  const { prompt, model = DEFAULT_MODEL, system, temperature = 0.7, maxTokens = 500 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system: system || 'You are a helpful AI assistant for SAI RoloTech.',
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    res.json({
      success: true,
      model,
      response: data.response,
      done: data.done,
      totalDuration: data.total_duration,
    });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// Chat completion (conversational)
router.post('/chat', async (req, res) => {
  const { messages, model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 500 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    res.json({
      success: true,
      model,
      message: data.message,
      done: data.done,
    });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// Roll Forming Expert - specialized endpoint
router.post('/expert', async (req, res) => {
  const { question, context } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'question is required' });
  }

  const systemPrompt = `You are "MASTER" — SAI RoloTech ka Roll Forming Machine Expert AI. Aap ek senior machine technician hain jo 20+ saal se roll forming machines pe kaam kar rahe hain.

Aapki expertise:
- Roll Forming Machines (Sheet Metal Profile Making)
- Coil Slitting, Decoiler, Straightener
- Forming Stations / Rollers / Tooling
- Punching Units (In-line punch press)
- Cut-off systems (Run length / Rotary die)
- PLC / HMI / Encoder / Servo systems
- Material handling (MS, SS, GI, PPGI, Aluminum)

REPLY RULES:
- Hamesha Hinglish mein jawab do (Hindi + English mix)
- Step-by-step numbered list format use karo
- Practical aur actionable advice do
- Emojis use karo readability ke liye (🔧 ⚙️ ✅ ⚠️ 📏)
- Har response ke end mein poochho: "Kya aur help chahiye?"`;

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sairolotech-expert',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(context ? [{ role: 'assistant', content: context }] : []),
          { role: 'user', content: question }
        ],
        stream: false,
        options: { temperature: 0.7, num_predict: 800 }
      })
    });

    if (!response.ok) {
      // Fallback to gemma if expert model fails
      const fallback = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: FALLBACK_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          stream: false,
        })
      });
      const data = await fallback.json();
      return res.json({ success: true, model: FALLBACK_MODEL, answer: data.message?.content || 'Kuch error aaya.' });
    }

    const data = await response.json();
    res.json({
      success: true,
      model: 'sairolotech-expert',
      answer: data.message?.content || 'Sorry, kuch error aaya.',
    });
  } catch (e: any) {
    res.json({ success: false, error: e.message, hint: 'Start Ollama: ollama serve' });
  }
});

// Buddy CRM Assistant
router.post('/buddy', async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  const systemPrompt = `You are "Buddy" — SAI RoloTech CRM ka AI Assistant. You help with:
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
- Be friendly and professional`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10),
      { role: 'user', content: message }
    ];

    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        stream: false,
        options: { temperature: 0.8, num_predict: 600 }
      })
    });

    if (!response.ok) throw new Error('Ollama error');

    const data = await response.json();
    res.json({
      success: true,
      reply: data.message?.content || 'Sorry, kuch error aaya.',
    });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

export default router;
