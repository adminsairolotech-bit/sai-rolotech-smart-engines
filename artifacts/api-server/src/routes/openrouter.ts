import { Router, type Request, type Response } from "express";

const router = Router();

function getOpenRouterBaseUrl(): string {
  const base = (process.env["AI_INTEGRATIONS_OPENROUTER_BASE_URL"] ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`;
}

router.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    provider: "openrouter",
    configured: Boolean(process.env["AI_INTEGRATIONS_OPENROUTER_API_KEY"]),
    baseUrl: getOpenRouterBaseUrl(),
  });
});

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    success: true,
    provider: "openrouter",
    configured: Boolean(process.env["AI_INTEGRATIONS_OPENROUTER_API_KEY"]),
  });
});

router.post("/chat/completions", async (req: Request, res: Response) => {
  const apiKey = process.env["AI_INTEGRATIONS_OPENROUTER_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ success: false, error: "OpenRouter API key is not configured" });
    return;
  }

  try {
    const upstream = await fetch(`${getOpenRouterBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://sairolotech.local",
        "X-Title": "SAI Rolotech Smart Engines",
      },
      body: JSON.stringify(req.body),
    });

    const payload = await upstream.json() as unknown;
    res.status(upstream.status).json(payload);
  } catch (error: unknown) {
    res.status(502).json({
      success: false,
      error: error instanceof Error ? error.message : "OpenRouter request failed",
    });
  }
});

export default router;
