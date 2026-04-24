import { Router, type Request, type Response } from "express";

const router = Router();

const OLLAMA_BASE = process.env.OLLAMA_BASE || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "sairolotech-expert";
const FALLBACK_MODEL = "llama3.2:3b";

interface OllamaTag {
  name?: string;
}

interface OllamaTagsResponse {
  models?: OllamaTag[];
}

interface OllamaGenerateResponse {
  response?: string;
  done?: boolean;
  total_duration?: number;
}

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
  done?: boolean;
}

router.get("/status", async (_req: Request, res: Response): Promise<void> => {
  try {
    const response = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (response.ok) {
      const data = await response.json() as OllamaTagsResponse;
      res.json({
        success: true,
        available: true,
        base: OLLAMA_BASE,
        defaultModel: DEFAULT_MODEL,
        models: data.models?.map((model) => model.name).filter(Boolean) ?? [],
      });
      return;
    }

    res.json({ success: true, available: false, error: "Ollama not responding" });
  } catch (error: unknown) {
    res.json({
      success: true,
      available: false,
      error: error instanceof Error ? error.message : "Ollama status check failed",
    });
  }
});

router.get("/models", async (_req: Request, res: Response): Promise<void> => {
  try {
    const response = await fetch(`${OLLAMA_BASE}/api/tags`);
    const data = await response.json() as OllamaTagsResponse;
    res.json({ success: true, models: data.models || [] });
  } catch (error: unknown) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to list models",
      models: [],
    });
  }
});

router.post("/generate", async (req: Request, res: Response): Promise<void> => {
  const { prompt, model = DEFAULT_MODEL, system, temperature = 0.7, maxTokens = 500 } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        system: system || "You are a helpful AI assistant for SAI RoloTech.",
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json() as OllamaGenerateResponse;
    res.json({
      success: true,
      model,
      response: data.response,
      done: data.done,
      totalDuration: data.total_duration,
    });
  } catch (error: unknown) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : "Ollama generate failed",
    });
  }
});

router.post("/chat", async (req: Request, res: Response): Promise<void> => {
  const { messages, model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 500 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json() as OllamaChatResponse;
    res.json({
      success: true,
      model,
      message: data.message,
      done: data.done,
    });
  } catch (error: unknown) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : "Ollama chat failed",
    });
  }
});

router.post("/expert", async (req: Request, res: Response): Promise<void> => {
  const { question, context } = req.body;

  if (!question) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  const systemPrompt = `You are "MASTER" - SAI RoloTech ka Roll Forming Machine Expert AI. Aap ek senior machine technician hain jo 20+ saal se roll forming machines pe kaam kar rahe hain.

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
- Har response ke end mein poochho: "Kya aur help chahiye?"`;

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sairolotech-expert",
        messages: [
          { role: "system", content: systemPrompt },
          ...(context ? [{ role: "assistant", content: context }] : []),
          { role: "user", content: question },
        ],
        stream: false,
        options: { temperature: 0.7, num_predict: 800 },
      }),
    });

    if (!response.ok) {
      const fallback = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: FALLBACK_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
          stream: false,
        }),
      });
      const data = await fallback.json() as OllamaChatResponse;
      res.json({
        success: true,
        model: FALLBACK_MODEL,
        answer: data.message?.content || "Kuch error aaya.",
      });
      return;
    }

    const data = await response.json() as OllamaChatResponse;
    res.json({
      success: true,
      model: "sairolotech-expert",
      answer: data.message?.content || "Sorry, kuch error aaya.",
    });
  } catch (error: unknown) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : "Ollama expert request failed",
      hint: "Start Ollama: ollama serve",
    });
  }
});

router.post("/buddy", async (req: Request, res: Response): Promise<void> => {
  const { message, history } = req.body;

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const systemPrompt = `You are "Buddy" - SAI RoloTech CRM ka AI Assistant. You help with:
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
      { role: "system", content: systemPrompt },
      ...((Array.isArray(history) ? history : []).slice(-10)),
      { role: "user", content: message },
    ];

    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        stream: false,
        options: { temperature: 0.8, num_predict: 600 },
      }),
    });

    if (!response.ok) {
      throw new Error("Ollama error");
    }

    const data = await response.json() as OllamaChatResponse;
    res.json({
      success: true,
      reply: data.message?.content || "Sorry, kuch error aaya.",
    });
  } catch (error: unknown) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : "Ollama buddy request failed",
    });
  }
});

export default router;
