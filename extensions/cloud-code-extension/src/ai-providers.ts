/**
 * AI Providers — Multi-tier fallback (Custom API > Gemini > OpenRouter > Offline KB)
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { buildRollFormingPrompt } from './rollforming-prompts';

// ─── Offline KB (always available, free) ──────────────────────────────────────
const OFFLINE_KB: Array<{ kw: string[]; response: string }> = [
  {
    kw: ['flower', 'pattern', 'forming', 'station', 'sequence'],
    response: `**Flower Pattern — Roll Forming Best Practices**

• **Station Count:** stations = bends x passes_per_bend + calibration + entry
• **Max Angle/Station:** SS: 10-18deg, AL: 24-35deg, MS: 15-25deg, HSLA: 8-15deg
• **Springback:** Add 2-8deg per station depending on material
• **Down-hill Logic:** Form easy bends first, hard bends last
• **Strip Width:** DIN 6935 K-factor neutral axis method
• **K-Factors:** GI=0.44, CR=0.45, HR=0.50, SS=0.40, AL=0.38
• **Progressive forming:** Recommended for complex profiles`,
  },
  {
    kw: ['springback', 'spring back', 'compensation', 'overbend'],
    response: `**Springback Compensation**

• **Simple Formula:** springback_deg = base_factor x (angle/90)
• **R/t Model:** sb_ep = (Fy/E) x (R/t) x angle
• **Material Factors:** SS: 4.0, HR: 2.5, GI: 1.5, AL: 3.0
• **Corrected = Target + Springback**
• **Example:** 90deg bend in SS, R/t=1 -> springback ~4deg -> overbend to 94deg`,
  },
  {
    kw: ['roll', 'tooling', 'contour', 'groove', 'shaft', 'bearing'],
    response: `**Roll Tooling Design**

• **Roll OD Formula:** OD = max(70, diag x 0.42 + severity x 0.38 + t x 28)
• **Shaft Selection:** LIGHT->40mm(6208), MEDIUM->50mm(6210), HEAVY->60mm(6212)
• **Material:** D2 tool steel, hardness 58-62 HRC
• **Coating:** TiN or TiAlN for wear resistance
• **Roll Gap:** Entry t x 1.08, Forming t x 1.00, Calibration t x 1.01`,
  },
  {
    kw: ['strip', 'width', 'blank', 'flat', 'length', 'k-factor'],
    response: `**Strip Width Calculation — DIN 6935**

• **K-Factors:** GI=0.44, CR=0.45, HR=0.50, SS=0.40, AL=0.38
• **Bend Compensation:** BA = (pi x angle x K x t) / 180
• **Example:** 90deg bend, t=2mm, K=0.44 -> BA = 2.77mm
• **Total Strip:** Sum of flat segments + bend compensations`,
  },
  {
    kw: ['g71', 'g70', 'turning', 'lathe', 'cycle'],
    response: `**G71 Roughing Cycle (Fanuc):**

G71 U(doc) R(retract)
G71 P(start_N) Q(end_N) U(X_allow) W(Z_allow) F(feed)

G70 Finishing: G70 P(start_N) Q(end_N)

Tips:
• Doc: 1.5-2mm for roughing
• Retract: 0.5-1mm
• X-allow: 0.2-0.5mm
• G71 P...Q... defines the profile shape`,
  },
  {
    kw: ['gcode', 'cnc', 'milling', 'toolpath'],
    response: `**G-Code Best Practices**

• **Safety:** Always include M30 at end, M05 for spindle stop
• **Axes:** X=radial, Y=axial, Z=vertical
• **G90:** Absolute mode, G91: Incremental mode
• **Helical Interpolation:** G2/G3 with I,J for roll grooving
• **G28:** Return to home position
• **Coolant:** M08=flood, M09=off`,
  },
  {
    kw: ['defect', 'crack', 'wave', 'wrinkle', 'bow', 'twist'],
    response: `**Roll Forming Defects & Solutions**

• **Edge Wave:** Reduce speed 10-15%, check strip tension
• **Flange Buckling:** Increase flange stiffness, reduce angle
• **Camber:** Check roll alignment, balance forming forces
• **Twist:** Verify roll symmetry, check bearing preload
• **Springback:** Increase overbend by 5-8deg, recalculate K-factor
• **Flange Crack:** Reduce angle per station below 12deg`,
  },
  {
    kw: ['material', 'steel', 'aluminum', 'ss', 'gi', 'hr'],
    response: `**Material Properties for Roll Forming**

| Material | Fy (MPa) | Max Angle/Station | K-Factor |
|----------|----------|-------------------|----------|
| GI       | 250      | 15-20deg          | 0.44     |
| CR       | 280      | 15-20deg          | 0.45     |
| HR       | 240      | 12-18deg          | 0.50     |
| SS304    | 310      | 10-15deg          | 0.40     |
| AL6061   | 160      | 24-35deg          | 0.38     |
| HSLA     | 400      | 8-15deg           | 0.42     |`,
  },
  {
    kw: ['fea', 'simulation', 'stress', 'strain', 'mesh'],
    response: `**FEA Simulation for Roll Forming**

• **Element Type:** S4R shell elements recommended
• **Mesh Size:** 2-5mm for critical areas, 5-10mm general
• **Material Model:** Swift or Ramberg-Osgood hardening
• **Solver:** Abaqus, CalculiX, or LS-DYNA
• **Output:** Strain epsilon = t/(2R+t), Stress sigma = K x epsilon^n
• **Note:** Always validate FEA with physical testing`,
  },
  {
    kw: ['machine', 'motor', 'power', 'speed', 'force'],
    response: `**Machine Power Calculation**

• **Forming Force:** F = 0.8 x t^2 x w x Fy / r (N)
• **Power (kW):** = F x v / (0.75 x 1000)
• **Torque (N.m):** = F x (roll_radius / 1000)
• **Line Speed:** 10-30 m/min typical
• **Motor:** 7.5-22 kW for medium machines`,
  },
];

function scoreQuery(query: string, entry: { kw: string[] }): number {
  const q = query.toLowerCase();
  let score = 0;
  for (const k of entry.kw) {
    if (q.includes(k)) score += k.includes(' ') ? 3 : 1;
  }
  return score;
}

function offlineResponse(query: string): string {
  let best = OFFLINE_KB[0];
  let bestScore = 0;
  for (const entry of OFFLINE_KB) {
    const s = scoreQuery(query, entry);
    if (s > bestScore) { bestScore = s; best = entry; }
  }
  if (bestScore === 0) {
    return `**Sai Rolotech Smart Engines AI**

Main aapki roll forming engineering mein madad kar sakta hoon.

**Topics:**
- Flower pattern design & station sequencing
- Springback compensation (S30/S50 COPRA methods)
- Roll tooling, shaft & bearing design
- Strip width (DIN 6935 K-factor)
- G-Code programming (G71, G70, G76, etc.)
- Material selection (GI, CR, HR, SS, AL, HSLA)
- Defect diagnosis & prevention
- FEA simulation setup
- Machine power calculation

**Quick Start:**
1. Design profile in Profile Designer
2. Generate flower pattern
3. Calculate roll tooling
4. Export DXF/STEP for manufacturing

Aap koi specific engineering question pooch sakte hain!`;
  }
  return best.response;
}

// ─── API Config ───────────────────────────────────────────────────────────────
export type OpenRouterModel =
  | 'anthropic/claude-sonnet-4.6'      // Good reasoning
  | 'anthropic/claude-opus-4.6'        // Best reasoning (expensive)
  | 'deepseek/deepseek-r1'            // Best value - ~$0.50/M tokens
  | 'deepseek/deepseek-r1-ollama'     // FREE
  | 'openai/o1'                       // Advanced reasoning
  | 'openai/o1-mini'                  // Fast reasoning
  | 'google/gemini-2.5-pro'           // Gemini via OpenRouter
  | 'meta-llama/llama-3.2-3b-instruct' // FREE
  | 'meta-llama/llama-3.2-1b-instruct' // FREE
  | 'meta-llama/llama-3.3-70b'        // Fast chat
  | 'mistralai/mistral-nemo-instruct-2407' // FREE
  | 'mistralai/mistral-nemo'          // Fast chat
  | 'qwen/qwen-2.5-7b-instruct'      // FREE
  | 'qwen/qwen-2.5-72b'             // Good chat
  | 'google/gemma-2-9b-it'           // FREE
  | 'x-ai/grok-3'                   // Grok 3
  | 'nvidia/llama-3.1-nemotron-70b' // FREE
  | 'databricks/dbrx-instruct'       // FREE
  | 'openchat/openchat-7b'           // FREE
  | 'undi95/tinyllama-1.1b'          // FREE
;

export const OPENROUTER_MODELS: { id: OpenRouterModel; name: string; desc: string; cost: string; tier: 'FREE' | 'DISCOUNTED' | 'PAID' }[] = [
  // ── FREE Tier (No credits needed) ──────────────────────
  { id: 'deepseek/deepseek-r1-ollama', name: 'DeepSeek R1 (Free)', desc: 'Best free reasoning - Ollama hosted', cost: '$0', tier: 'FREE' },
  { id: 'meta-llama/llama-3.2-3b-instruct', name: 'Llama 3.2 3B', desc: 'Free - fast, good for simple tasks', cost: '$0', tier: 'FREE' },
  { id: 'meta-llama/llama-3.2-1b-instruct', name: 'Llama 3.2 1B', desc: 'Free - fastest, light tasks only', cost: '$0', tier: 'FREE' },
  { id: 'mistralai/mistral-nemo-instruct-2407', name: 'Mistral Nemo', desc: 'Free - Mistral quality chat', cost: '$0', tier: 'FREE' },
  { id: 'qwen/qwen-2.5-7b-instruct', name: 'Qwen 2.5 7B', desc: 'Free - Alibaba quality chat', cost: '$0', tier: 'FREE' },
  { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', desc: 'Free - Google quality chat', cost: '$0', tier: 'FREE' },
  { id: 'nvidia/llama-3.1-nemotron-70b', name: 'Nemotron 70B', desc: 'FREE - Nvidia optimized Llama', cost: '$0', tier: 'FREE' },
  { id: 'databricks/dbrx-instruct', name: 'DBRX Instruct', desc: 'FREE - Databricks MoE', cost: '$0', tier: 'FREE' },
  { id: 'openchat/openchat-7b', name: 'OpenChat 7B', desc: 'FREE - community model', cost: '$0', tier: 'FREE' },
  { id: 'undi95/tinyllama-1.1b', name: 'TinyLlama 1B', desc: 'FREE - ultra light, instant', cost: '$0', tier: 'FREE' },

  // ── DISCOUNTED ($5 credits last long) ───────────────────
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 ⭐', desc: 'BEST VALUE - $0.50/M tokens, opus-level reasoning', cost: '$0.50/1M', tier: 'DISCOUNTED' },
  { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', desc: 'Best balance - reasoning + speed + free thinking', cost: '$3/1M', tier: 'DISCOUNTED' },
  { id: 'anthropic/claude-opus-4.6', name: 'Claude Opus 4.6', desc: 'TOP TIER - best reasoning, expensive', cost: '$15/1M', tier: 'DISCOUNTED' },
  { id: 'openai/o1', name: 'OpenAI o1', desc: 'Advanced reasoning - powerful but slow', cost: '$15/1M', tier: 'DISCOUNTED' },
  { id: 'openai/o1-mini', name: 'OpenAI o1-mini', desc: 'Fast reasoning - good value', cost: '$3/1M', tier: 'DISCOUNTED' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Google best via OpenRouter', cost: '$1/1M', tier: 'DISCOUNTED' },
  { id: 'mistralai/mistral-nemo', name: 'Mistral Nemo (Full)', desc: 'Fast quality chat - paid tier', cost: '$0.15/1M', tier: 'DISCOUNTED' },
  { id: 'meta-llama/llama-3.3-70b', name: 'Llama 3.3 70B', desc: 'Meta flagship - fast + smart', cost: '$0.20/1M', tier: 'DISCOUNTED' },
  { id: 'qwen/qwen-2.5-72b', name: 'Qwen 2.5 72B', desc: 'Good quality chat', cost: '$0.50/1M', tier: 'DISCOUNTED' },
  { id: 'x-ai/grok-3', name: 'Grok 3', desc: 'Elon Musk AI - advanced reasoning', cost: '$5/1M', tier: 'DISCOUNTED' },
];

export interface AIConfig {
  secrets?: vscode.SecretStorage;
  customApiUrl?: string;
  customApiKey?: string;
  geminiKey?: string;
  geminiModel?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  openRouterKey?: string;
  openRouterModel?: OpenRouterModel;
  provider: 'custom' | 'gemini' | 'openrouter' | 'offline' | 'local' | 'expert';
}

export interface AIResponse {
  text: string;
  provider: string;
  model: string;
  latencyMs?: number;
}

// ─── Local AI Servers (Multi-backend support) ─────────────────────────────────

// Check all local AI servers and return the first available
interface LocalServer {
  name: string;
  url: string;
  checkUrl: string;
  checkModel?: string;
}

const LOCAL_SERVERS: LocalServer[] = [
  { name: 'ollama', url: 'http://localhost:11434/api/generate', checkUrl: 'http://localhost:11434/api/tags' },
  { name: 'lm-studio', url: 'http://localhost:1234/v1/completions', checkUrl: 'http://localhost:1234/v1/models' },
  { name: 'jan', url: 'http://localhost:1337/v1/completions', checkUrl: 'http://localhost:1337/v1/models' },
  { name: 'localai', url: 'http://localhost:8080/v1/completions', checkUrl: 'http://localhost:8080/v1/models' },
  { name: 'llama.cpp', url: 'http://localhost:8080/completion', checkUrl: 'http://localhost:8080/health' },
];

async function checkLocalServer(server: LocalServer): Promise<boolean> {
  try {
    const res = await fetch(server.checkUrl, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch { return false; }
}

async function findAvailableLocalServer(): Promise<LocalServer | null> {
  for (const server of LOCAL_SERVERS) {
    if (await checkLocalServer(server)) {
      console.log(`[LocalAI] Found: ${server.name}`);
      return server;
    }
  }
  return null;
}

// Ollama API
export async function callOllama(model: string, prompt: string): Promise<AIResponse | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);

    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: buildRollFormingPrompt(prompt),
        stream: false,
        options: { temperature: 0.7, num_predict: 2000 }
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    if (!res.ok) return null;

    const data = await res.json() as { response?: string };
    const text = data.response;
    return text ? { text, provider: 'ollama', model } : null;
  } catch { return null; }
}

// LM Studio / OpenAI-compatible API
async function callLocalAI(server: LocalServer, model: string, prompt: string): Promise<AIResponse | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);

    const body: Record<string, unknown> = {
      model: model,
      prompt: buildRollFormingPrompt(prompt),
      max_tokens: 2000,
      temperature: 0.7,
      stream: false,
    };

    // Add OpenAI-compatible format variations
    if (server.name === 'lm-studio' || server.name === 'jan' || server.name === 'localai') {
      (body as { messages?: unknown[] }).messages = [{ role: 'user', content: buildRollFormingPrompt(prompt) }];
      (body as { model?: string }).model = model;
    }

    const res = await fetch(server.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);
    if (!res.ok) return null;

    const data = await res.json();

    // Parse response based on server type
    let text = '';
    if (data.choices?.[0]?.text) {
      text = data.choices[0].text;
    } else if (data.choices?.[0]?.message?.content) {
      text = data.choices[0].message.content;
    } else if (data.content) {
      text = data.content;
    } else if (data.response) {
      text = data.response;
    }

    return text ? { text, provider: server.name, model } : null;
  } catch { return null; }
}

// Available Ollama models (best to worst for RTX 4060 ~8GB VRAM):
// - gemma3:4b (3.3GB) - BEST for RTX 4060 ⭐ Google's latest, great quality
// - llama3.2:3b (2GB) - Fast fallback, good for simple queries
// - qwen2.5:7b (4.7GB) - Needs 6GB+ free VRAM, may OOM on busy GPU
// - gemma4:31b (19GB) - Requires 16GB+ free VRAM - NOT usable
// - deepseek-coder:6.7b (3.8GB) - Heavy VRAM usage, often hangs

// Local AI models for different backends (RTX 4060 optimized)
const LOCAL_MODELS: Record<string, string[]> = {
  ollama: ['gemma3:4b', 'llama3.2:3b', 'qwen2.5:7b', 'deepseek-coder:6.7b'],
  'lm-studio': ['gemma-3-4b', 'llama-3.2-3b', 'qwen2.5-7b'],
  jan: ['gemma-3-4b', 'llama-3.2-3b'],
  localai: ['gemma-3-4b', 'llama-3.2-3b'],
};

let cachedLocalServer: LocalServer | null = null;
let cacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

async function getLocalServer(): Promise<LocalServer | null> {
  const now = Date.now();
  if (cachedLocalServer && now - cacheTime < CACHE_DURATION) {
    return cachedLocalServer;
  }
  cachedLocalServer = await findAvailableLocalServer();
  cacheTime = now;
  return cachedLocalServer;
}

async function checkOllama(): Promise<boolean> {
  const server = await getLocalServer();
  return server !== null;
}

// ─── Custom API ────────────────────────────────────────────────────────────────
async function callCustomAPI(
  url: string,
  key: string,
  prompt: string,
  timeout = 60000
): Promise<AIResponse | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({
        model: 'custom',
        messages: [{ role: 'user', content: buildRollFormingPrompt(prompt) }],
        max_tokens: 4000,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    if (!res.ok) return null;

    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    return text ? { text, provider: 'custom-api', model: 'custom' } : null;
  } catch { return null; }
}

// ─── Gemini ───────────────────────────────────────────────────────────────────
async function callGemini(key: string, prompt: string, model = 'gemini-2.5-flash'): Promise<AIResponse | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildRollFormingPrompt(prompt) }] }],
          generationConfig: { maxOutputTokens: 4000, temperature: 0.7 },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timer);
    if (!res.ok) return null;

    const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? { text, provider: 'gemini', model } : null;
  } catch { return null; }
}

// ─── OpenRouter ───────────────────────────────────────────────────────────────
async function callOpenRouter(
  key: string,
  prompt: string,
  model = 'anthropic/claude-sonnet-4.6'
): Promise<AIResponse | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000); // 2 min for deep thinking

    // Check if model supports thinking (o-series and Claude)
    const supportsThinking = model.includes('claude') || model.includes('o1') || model.includes('o3') || model.includes('deepseek');

    const body: Record<string, unknown> = {
      model,
      messages: [{ role: 'user', content: buildRollFormingPrompt(prompt) }],
      max_tokens: 8000,
      temperature: supportsThinking ? 1 : 0.7,
    };

    // Add thinking for supported models
    if (supportsThinking) {
      body.thinking = { type: 'enabled', budget_tokens: 10000 };
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sairolotech.com',
        'X-Title': 'Sai Rolotech Cloud Code Extension',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);
    if (!res.ok) {
      console.log('[OpenRouter] Error:', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    let text = data.choices?.[0]?.message?.content || '';

    // Strip thinking block from response
    if (text.includes('```thinking')) {
      const parts = text.split('```thinking');
      text = parts[parts.length - 1].replace(/```$/, '').trim();
    }

    return text ? { text, provider: 'openrouter', model } : null;
  } catch (err) {
    console.log('[OpenRouter] Failed:', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMART ROUTER - Query Complexity Analysis + Optimal Model Selection
// ═══════════════════════════════════════════════════════════════════════════════

export type QueryComplexity = 'simple' | 'medium' | 'complex';

interface ModelTier {
  name: string;
  model: string;
  provider: 'gemini' | 'openrouter';
  keyPool: 'free' | 'paid' | 'openrouter';
  costPerMillion: number;
  speed: 'fast' | 'medium' | 'slow';
  reasoning: 'basic' | 'good' | 'advanced';
  useFor: QueryComplexity[];
}

// User's Key Pool:
// - 7x FREE Gemini keys (2.5 Flash/Pro, NO billing) - 15 req/min each
// - 6x PAID Gemini keys (3.1 Pro, smart rate limiting) - 60 req/min each
// - 1x OpenRouter key ($5 credits) with FREE tier models!

const MODEL_TIERS: ModelTier[] = [
  // ── TIER 0: FREE Gemini (7 keys, NO billing) ──────────────────────────────
  { name: 'Gemini 2.5 Flash ⭐', model: 'gemini-2.5-flash', provider: 'gemini', keyPool: 'free', costPerMillion: 0, speed: 'fast', reasoning: 'good', useFor: ['simple', 'medium'] },
  { name: 'Gemini 2.5 Pro', model: 'gemini-2.5-pro', provider: 'gemini', keyPool: 'free', costPerMillion: 0, speed: 'medium', reasoning: 'advanced', useFor: ['medium', 'complex'] },

  // ── TIER 1: OPENROUTER FREE MODELS (7+ models, 0 cost!) ───────────────────
  { name: 'Dolphin Mistral 24B ⭐', model: 'cognitivecomputations/dolphin-mistral-24b-venice-edition', provider: 'openrouter', keyPool: 'openrouter', costPerMillion: 0, speed: 'fast', reasoning: 'good', useFor: ['simple', 'medium'] },
  { name: 'LFM 1.2B', model: 'liquid/lfm-2.5-1.2b-instruct:free', provider: 'openrouter', keyPool: 'openrouter', costPerMillion: 0, speed: 'fast', reasoning: 'basic', useFor: ['simple'] },
  { name: 'Gemma 3N E4B', model: 'google/gemma-3n-e4b-it:free', provider: 'openrouter', keyPool: 'openrouter', costPerMillion: 0, speed: 'fast', reasoning: 'basic', useFor: ['simple', 'medium'] },
  { name: 'Gemma 4 31B', model: 'google/gemma-4-31b-it:free', provider: 'openrouter', keyPool: 'openrouter', costPerMillion: 0, speed: 'medium', reasoning: 'good', useFor: ['simple', 'medium', 'complex'] },
  { name: 'GPT-OSS 120B ⭐', model: 'openai/gpt-oss-120b:free', provider: 'openrouter', keyPool: 'openrouter', costPerMillion: 0, speed: 'medium', reasoning: 'good', useFor: ['simple', 'medium', 'complex'] },
  { name: 'Nemotron 120B', model: 'nvidia/nemotron-3-super-120b-a12b:free', provider: 'openrouter', keyPool: 'openrouter', costPerMillion: 0, speed: 'slow', reasoning: 'good', useFor: ['medium', 'complex'] },

  // ── TIER 2: PAID Gemini (6 keys, smart rate limiting) ─────────────────────
  { name: 'Gemini 3.1 Pro (PAID)', model: 'gemini-3.1-pro', provider: 'gemini', keyPool: 'paid', costPerMillion: 1.25, speed: 'medium', reasoning: 'advanced', useFor: ['complex'] },
  { name: 'Gemini 2.5 Pro (PAID)', model: 'gemini-2.5-pro', provider: 'gemini', keyPool: 'paid', costPerMillion: 1.25, speed: 'medium', reasoning: 'advanced', useFor: ['complex', 'medium'] },

  // ── TIER 3: OPENROUTER PAID MODELS ─────────────────────────────────────────
  { name: 'DeepSeek R1 ⭐', model: 'deepseek/deepseek-r1', provider: 'openrouter', keyPool: 'openrouter', costPerMillion: 0.50, speed: 'medium', reasoning: 'advanced', useFor: ['complex'] },
  { name: 'Qwen 2.5 72B', model: 'qwen/qwen-2.5-72b-instruct', provider: 'openrouter', keyPool: 'openrouter', costPerMillion: 0.40, speed: 'medium', reasoning: 'good', useFor: ['medium', 'complex'] },
];

// ─── Query Complexity Analyzer ─────────────────────────────────────────────────
const COMPLEX_KEYWORDS = [
  'analyze', 'analysis', 'calculate', 'simulation', 'fea', 'finite element',
  'optimize', 'optimization', 'compare', 'design', 'engineering',
  'defect prediction', 'springback', 'compensation', 'tolerance',
  'stress', 'strain', 'mesh', 'solver', 'validate', 'verify',
  'complex', 'advanced', 'detailed', 'comprehensive',
  'explain why', 'how does', 'what if', 'investigate',
  'multi-step', 'step by step', 'thorough', 'deep dive',
  'roll pass', 'flower pattern', 'contour', 'interference',
];

const MEDIUM_KEYWORDS = [
  'explain', 'describe', 'help with', 'recommend', 'suggest',
  'g-code', 'g71', 'g70', 'cnc', 'turning', 'milling',
  'material', 'properties', 'selection', 'steel', 'aluminum',
  'formula', 'calculation', 'method', 'process',
  'roll', 'forming', 'tooling', 'shaft', 'bearing',
  'defect', 'issue', 'problem', 'solution',
  'strip width', 'k-factor', 'neutral axis',
  'machine', 'motor', 'power', 'force',
];

function analyzeComplexity(query: string): QueryComplexity {
  const q = query.toLowerCase();
  let score = 0;

  // Count complex keywords
  for (const kw of COMPLEX_KEYWORDS) {
    if (q.includes(kw)) score += 3;
  }

  // Count medium keywords
  for (const kw of MEDIUM_KEYWORDS) {
    if (q.includes(kw)) score += 1;
  }

  // Length bonus (longer queries tend to need more reasoning)
  if (query.length > 200) score += 2;
  if (query.length > 500) score += 3;

  // Question type bonus
  if (q.includes('why') || q.includes('how would')) score += 2;
  if (q.includes('?')) score += 1;

  // Roll forming specific complexity scoring
  if (q.includes('flower pattern') && (q.includes('optimize') || q.includes('analyze'))) score += 4;
  if (q.includes('fea') || q.includes('simulation')) score += 4;
  if (q.includes('defect') && q.includes('multiple')) score += 3;
  if (q.includes('design') && (q.includes('new') || q.includes('complex'))) score += 3;

  if (score >= 8) return 'complex';
  if (score >= 3) return 'medium';
  return 'simple';
}

// ─── Smart Model Selector ───────────────────────────────────────────────────────
function selectBestModel(
  complexity: QueryComplexity,
  availableProviders: { gemini: boolean; openrouter: boolean }
): ModelTier | null {
  for (const tier of MODEL_TIERS) {
    // Check if provider is available
    if (tier.provider === 'gemini' && !availableProviders.gemini) continue;
    if (tier.provider === 'openrouter' && !availableProviders.openrouter) continue;

    // Check if model supports this complexity
    if (!tier.useFor.includes(complexity)) continue;

    return tier;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMART KEY MANAGER - Auto rotation & load balancing
// ═══════════════════════════════════════════════════════════════════════════════

interface KeyStatus {
  key: string;
  isPaused: boolean;
  pauseUntil: number;
  requestCount: number;
  lastUsed: number;
  errorCount: number;
  totalErrors: number;
}

const FREE_KEY_PAUSE_MS = 60000;
const MAX_ERRORS_BEFORE_PAUSE = 3;
const REQUEST_WINDOW_MS = 60000;

class SmartKeyManager {
  private geminiFreeKeys: KeyStatus[] = [];  // 6 FREE keys
  private geminiPaidKeys: KeyStatus[] = [];  // 8 PAID keys
  private openRouterKeys: KeyStatus[] = [];
  private currentGeminiFreeIndex = 0;
  private currentGeminiPaidIndex = 0;
  private currentOpenRouterIndex = 0;
  private requestTimestamps: Map<string, number[]> = new Map();

  initGeminiKeys(keys: string[], isPaid: boolean) {
    const pool = isPaid ? this.geminiPaidKeys : this.geminiFreeKeys;
    const newKeys = keys
      .filter(k => k && k.startsWith('AIza'))
      .map(k => ({
        key: k,
        isPaused: false,
        pauseUntil: 0,
        requestCount: 0,
        lastUsed: 0,
        errorCount: 0,
        totalErrors: 0,
      }));
    pool.push(...newKeys);
    console.log(`[SmartKey] ${newKeys.length} Gemini ${isPaid ? 'PAID' : 'FREE'} keys loaded (Total: ${pool.length})`);
  }

  initOpenRouterKeys(keys: string[]) {
    this.openRouterKeys = keys
      .filter(k => k && k.startsWith('sk-'))
      .map(k => ({
        key: k,
        isPaused: false,
        pauseUntil: 0,
        requestCount: 0,
        lastUsed: 0,
        errorCount: 0,
        totalErrors: 0,
      }));
    console.log(`[SmartKey] ${this.openRouterKeys.length} OpenRouter keys loaded`);
  }

  private shuffleKeys(keys: KeyStatus[]) {
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [keys[i], keys[j]] = [keys[j], keys[i]];
    }
  }

  getGeminiKey(isPaid: boolean = false): string | null {
    const now = Date.now();
    this.cleanRequestTimestamps();
    const pool = isPaid ? this.geminiPaidKeys : this.geminiFreeKeys;
    const currentIndex = isPaid ? this.currentGeminiPaidIndex : this.currentGeminiFreeIndex;

    for (let attempt = 0; attempt < pool.length; attempt++) {
      const index = (currentIndex + attempt) % pool.length;
      const keyStatus = pool[index];

      if (keyStatus.isPaused && keyStatus.pauseUntil > now) continue;
      if (keyStatus.isPaused) { keyStatus.isPaused = false; keyStatus.errorCount = 0; }

      // Rate limit: 15 req/min for free, higher for paid
      const limit = isPaid ? 60 : 15;
      const timestamps = this.requestTimestamps.get(keyStatus.key) || [];
      const recentRequests = timestamps.filter(t => now - t < REQUEST_WINDOW_MS);
      if (recentRequests.length >= limit) {
        keyStatus.isPaused = true;
        keyStatus.pauseUntil = now + 30000;
        continue;
      }

      if (isPaid) this.currentGeminiPaidIndex = (index + 1) % pool.length;
      else this.currentGeminiFreeIndex = (index + 1) % pool.length;
      keyStatus.requestCount++;
      keyStatus.lastUsed = now;
      this.recordRequest(keyStatus.key);
      return keyStatus.key;
    }
    return null;
  }

  getOpenRouterKey(): string | null {
    if (this.openRouterKeys.length === 0) return null;
    const index = this.currentOpenRouterIndex % this.openRouterKeys.length;
    this.currentOpenRouterIndex = (this.currentOpenRouterIndex + 1) % this.openRouterKeys.length;
    return this.openRouterKeys[index].key;
  }

  getOpenRouterKeyWithFallback(): string {
    const now = Date.now();
    for (let i = 0; i < this.openRouterKeys.length; i++) {
      const idx = (this.currentOpenRouterIndex + i) % this.openRouterKeys.length;
      const k = this.openRouterKeys[idx];
      if (!k.isPaused || k.pauseUntil <= now) {
        return k.key;
      }
    }
    return this.openRouterKeys[0]?.key || '';
  }

  private recordRequest(key: string) {
    const timestamps = this.requestTimestamps.get(key) || [];
    timestamps.push(Date.now());
    this.requestTimestamps.set(key, timestamps);
  }

  private cleanRequestTimestamps() {
    const now = Date.now();
    for (const [key, timestamps] of this.requestTimestamps.entries()) {
      const cleaned = timestamps.filter(t => now - t < 120000);
      if (cleaned.length === 0) this.requestTimestamps.delete(key);
      else this.requestTimestamps.set(key, cleaned);
    }
  }

  recordGeminiError(key: string, isPaid: boolean = false) {
    const pool = isPaid ? this.geminiPaidKeys : this.geminiFreeKeys;
    const keyStatus = pool.find(k => k.key === key);
    if (!keyStatus) return;
    keyStatus.errorCount++;
    keyStatus.totalErrors++;
    if (keyStatus.errorCount >= MAX_ERRORS_BEFORE_PAUSE) {
      keyStatus.isPaused = true;
      keyStatus.pauseUntil = Date.now() + FREE_KEY_PAUSE_MS;
    }
  }

  recordOpenRouterError(key: string) {
    const keyStatus = this.openRouterKeys.find(k => k.key === key);
    if (!keyStatus) return;
    keyStatus.errorCount++;
    if (keyStatus.errorCount >= 5) {
      keyStatus.isPaused = true;
      keyStatus.pauseUntil = Date.now() + FREE_KEY_PAUSE_MS;
    }
  }

  hasActiveKeys(): { geminiFree: boolean; geminiPaid: boolean; openrouter: boolean } {
    const now = Date.now();
    const geminiFreeActive = this.geminiFreeKeys.some(k => !k.isPaused || k.pauseUntil <= now);
    const geminiPaidActive = this.geminiPaidKeys.some(k => !k.isPaused || k.pauseUntil <= now);
    const openrouterActive = this.openRouterKeys.length > 0;
    return { geminiFree: geminiFreeActive, geminiPaid: geminiPaidActive, openrouter: openrouterActive };
  }

  getStatus() {
    const now = Date.now();
    return {
      geminiFree: this.geminiFreeKeys.filter(k => !k.isPaused || k.pauseUntil <= now).length,
      geminiPaid: this.geminiPaidKeys.filter(k => !k.isPaused || k.pauseUntil <= now).length,
      openrouter: this.openRouterKeys.filter(k => !k.isPaused).length,
      total: this.geminiFreeKeys.length + this.geminiPaidKeys.length + this.openRouterKeys.length,
    };
  }
}

const keyManager = new SmartKeyManager();

// ─── Store Multiple Keys ─────────────────────────────────────────────────────
export async function storeMultipleKeys(secrets: vscode.SecretStorage, provider: string, keys: string[]): Promise<void> {
  const keyList = keys.filter(k => k && k.length > 10);
  await secrets.store(`cloudcode.${provider}.pool`, JSON.stringify(keyList));
}

export async function loadKeyPool(secrets: vscode.SecretStorage, provider: string): Promise<string[]> {
  try {
    const data = await secrets.get(`cloudcode.${provider}.pool`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ─── Add/Remove Keys ─────────────────────────────────────────────────────────
export async function addKeyToPool(secrets: vscode.SecretStorage, provider: string, newKey: string): Promise<void> {
  const pool = await loadKeyPool(secrets, provider);
  if (!pool.includes(newKey)) {
    pool.push(newKey);
    await secrets.store(`cloudcode.${provider}.pool`, JSON.stringify(pool));
  }
}

// ─── Smart AI with Auto Model Selection ──────────────────────────────────────
export async function smartAI(query: string, config: AIConfig): Promise<AIResponse> {
  const start = Date.now();

  // Load key pools if not initialized
  if (keyManager.getStatus().total === 0) {
    const geminiFreePool = await loadKeyPool(config.secrets!, 'geminiFree');
    const geminiPaidPool = await loadKeyPool(config.secrets!, 'geminiPaid');
    const openRouterPool = await loadKeyPool(config.secrets!, 'openrouter');

    if (geminiFreePool.length > 0) {
      keyManager.initGeminiKeys(geminiFreePool, false);
    }
    if (geminiPaidPool.length > 0) {
      keyManager.initGeminiKeys(geminiPaidPool, true);
    }
    if (openRouterPool.length > 0) {
      keyManager.initOpenRouterKeys(openRouterPool);
    }
  }

  // ─── Step 1: Analyze query complexity ───────────────────────────────────────
  const complexity = analyzeComplexity(query);
  console.log(`[SmartAI] Query complexity: ${complexity}`);

  // ─── Step 2: Check available providers ───────────────────────────────────────
  const available = keyManager.hasActiveKeys();
  const localServer = await getLocalServer();
  const localAvailable = localServer !== null;
  console.log(`[SmartAI] Local=${localServer?.name || 'none'}, Gemini Free=${available.geminiFree}, Gemini Paid=${available.geminiPaid}, OpenRouter=${available.openrouter}`);

  // ─── Step 3: Smart Model Selection based on complexity ───────────────────────

  // SIMPLE queries → LOCAL AI first (FAST!), then OpenRouter, then Gemini
  if (complexity === 'simple') {
    if (localAvailable && localServer?.name === 'ollama') {
      // Gemma 3 4B - Best local model for RTX 4060
      console.log('[SmartAI] → Ollama gemma3:4b (LOCAL GPU ⭐ Google Gemma 3)');
      const result = await callOllama('gemma3:4b', query);
      if (result) return { ...result, latencyMs: Date.now() - start };
      // Fallback to llama3.2:3b
      console.log('[SmartAI] → Ollama llama3.2:3b (LOCAL fallback)');
      const fb = await callOllama('llama3.2:3b', query);
      if (fb) return { ...fb, latencyMs: Date.now() - start };
    } else if (localAvailable) {
      const models = LOCAL_MODELS[localServer!.name] || [];
      for (const model of models.slice(0, 2)) {
        console.log(`[SmartAI] → ${localServer!.name} ${model} (LOCAL GPU)`);
        const result = await callLocalAI(localServer!, model, query);
        if (result) return { ...result, latencyMs: Date.now() - start };
      }
    }
    if (available.openrouter) {
      const key = keyManager.getOpenRouterKeyWithFallback();
      if (key) {
        console.log('[SmartAI] → Dolphin Mistral 24B (FREE)');
        const result = await callOpenRouter(key, query, 'cognitivecomputations/dolphin-mistral-24b-venice-edition');
        if (result) return { ...result, latencyMs: Date.now() - start };
      }
    }
    if (available.geminiFree) {
      const key = keyManager.getGeminiKey(false);
      if (key) {
        console.log('[SmartAI] → Gemini 2.5 Flash (FREE)');
        const result = await callGemini(key, query, 'gemini-2.5-flash');
        if (result) return { ...result, latencyMs: Date.now() - start };
      }
    }
  }

  // MEDIUM queries → LOCAL AI (Gemma 3 4B), then OpenRouter FREE, then Gemini FREE
  if (complexity === 'medium') {
    if (localAvailable && localServer?.name === 'ollama') {
      console.log('[SmartAI] → Ollama gemma3:4b (LOCAL GPU ⭐ Google Gemma 3)');
      const result = await callOllama('gemma3:4b', query);
      if (result) return { ...result, latencyMs: Date.now() - start };
      // Fallback to llama3.2:3b
      console.log('[SmartAI] → Ollama llama3.2:3b (LOCAL fallback)');
      const fb = await callOllama('llama3.2:3b', query);
      if (fb) return { ...fb, latencyMs: Date.now() - start };
    } else if (localAvailable) {
      const models = LOCAL_MODELS[localServer!.name] || [];
      for (const model of models) {
        console.log(`[SmartAI] → ${localServer!.name} ${model} (LOCAL GPU)`);
        const result = await callLocalAI(localServer!, model, query);
        if (result) return { ...result, latencyMs: Date.now() - start };
      }
    }
    if (available.openrouter) {
      const key = keyManager.getOpenRouterKeyWithFallback();
      if (key) {
        console.log('[SmartAI] → GPT-OSS 120B (FREE)');
        const result = await callOpenRouter(key, query, 'openai/gpt-oss-120b:free');
        if (result) return { ...result, latencyMs: Date.now() - start };
      }
    }
    if (available.geminiFree) {
      const key = keyManager.getGeminiKey(false);
      if (key) {
        console.log('[SmartAI] → Gemini 2.5 Flash (FREE)');
        const result = await callGemini(key, query, 'gemini-2.5-flash');
        if (result) return { ...result, latencyMs: Date.now() - start };
      }
    }
  }

  // COMPLEX queries → LOCAL AI first (Gemma 3 4B), then PAID Gemini, then OpenRouter
  if (complexity === 'complex') {
    if (localAvailable && localServer?.name === 'ollama') {
      console.log('[SmartAI] → Ollama gemma3:4b (LOCAL GPU ⭐ Google Gemma 3)');
      const result = await callOllama('gemma3:4b', query);
      if (result) return { ...result, latencyMs: Date.now() - start };
      console.log('[SmartAI] → Ollama llama3.2:3b (LOCAL fallback)');
      const fb = await callOllama('llama3.2:3b', query);
      if (fb) return { ...fb, latencyMs: Date.now() - start };
    } else if (localAvailable) {
      const models = LOCAL_MODELS[localServer!.name] || [];
      for (const model of models) {
        console.log(`[SmartAI] → ${localServer!.name} ${model} (LOCAL GPU)`);
        const result = await callLocalAI(localServer!, model, query);
        if (result) return { ...result, latencyMs: Date.now() - start };
      }
    }
    if (available.geminiPaid) {
      const key = keyManager.getGeminiKey(true);
      if (key) {
        console.log('[SmartAI] → Gemini 3.1 Pro (PAID)');
        const result = await callGemini(key, query, 'gemini-3.1-pro');
        if (result) return { ...result, latencyMs: Date.now() - start };
        keyManager.recordGeminiError(key, true);
      }
    }
    if (available.openrouter) {
      const key = keyManager.getOpenRouterKeyWithFallback();
      if (key) {
        console.log('[SmartAI] → DeepSeek R1 ($0.50/1M)');
        const result = await callOpenRouter(key, query, 'deepseek/deepseek-r1');
        if (result) return { ...result, latencyMs: Date.now() - start };
      }
    }
    if (available.geminiFree) {
      const key = keyManager.getGeminiKey(false);
      if (key) {
        console.log('[SmartAI] → Gemini 2.5 Pro (FREE fallback)');
        const result = await callGemini(key, query, 'gemini-2.5-pro');
        if (result) return { ...result, latencyMs: Date.now() - start };
      }
    }
  }

  // ─── Try Custom API (Last resort before offline KB) ───────────────────────────
  if (config.customApiUrl && config.customApiKey) {
    try {
      const r = await callCustomAPI(config.customApiUrl, config.customApiKey, query);
      if (r) return { ...r, latencyMs: Date.now() - start };
    } catch {}
  }

  // ─── Final Fallback: Offline KB ───────────────────────────────────────────────
  return {
    text: offlineResponse(query),
    provider: 'offline-kb',
    model: 'sai-rolotech-kb-v1',
    latencyMs: Date.now() - start,
  };
}

// ─── Get Key Pool Status ─────────────────────────────────────────────────────
export function getKeyPoolStatus(): { geminiFree: number; geminiPaid: number; openrouter: number; total: number } {
  const status = keyManager.getStatus();
  return {
    geminiFree: status.geminiFree,
    geminiPaid: status.geminiPaid,
    openrouter: status.openrouter,
    total: status.total,
  };
}

// ─── Secret Storage ────────────────────────────────────────────────────────────
// Keys stored in VS Code's encrypted SecretStorage (not in plain .json files)

export async function storeAPIKey(secretStorage: vscode.SecretStorage, keyName: string, value: string): Promise<void> {
  await secretStorage.store(`cloudcode.${keyName}`, value);
}

export async function getAPIKey(secretStorage: vscode.SecretStorage, keyName: string): Promise<string | undefined> {
  return secretStorage.get(`cloudcode.${keyName}`);
}

export async function deleteAPIKey(secretStorage: vscode.SecretStorage, keyName: string): Promise<void> {
  await secretStorage.delete(`cloudcode.${keyName}`);
}

export async function getAllAPIKeys(secretStorage: vscode.SecretStorage): Promise<Record<string, string>> {
  const keys: Record<string, string> = {};
  for (const key of ['geminiKey', 'openRouterKey', 'customApiKey', 'customApiUrl']) {
    const val = await secretStorage.get(`cloudcode.${key}`);
    if (val) keys[key] = val;
  }
  return keys;
}

// ─── AI Chat WebView Provider ─────────────────────────────────────────────────
export class AIChatViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView) {
    this.view = view;
    const htmlPath = path.join(this.context.extensionPath, 'src', 'webviews', 'ai-chat.html');

    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, 'utf8');
      view.webview.html = html;
    } else {
      view.webview.html = '<html><body style="color:#fff;padding:20px;background:#1a1a2e"><h3>AI Chat</h3><p>Loading...</p></body></html>';
    }

    view.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'src', 'webviews'))] };

    view.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'chat') {
        const config = await this.loadConfig();

        // Override provider/model from chat UI selection
        const provider = msg.provider || config.provider;
        const model = msg.model || undefined;

        // Handle ROLL FORMING EXPERT provider (sairolotech-expert model)
        if (provider === 'expert') {
          try {
            const start = Date.now();
            const result = await callOllama('sairolotech-expert', msg.text);
            if (result) {
              view.webview.postMessage({
                type: 'ai-response',
                text: result.text,
                provider: 'expert',
                model: 'sairolotech-expert',
                latency: Date.now() - start,
              });
            } else {
              view.webview.postMessage({
                type: 'error',
                text: 'Roll Forming Expert model not found. Run: ollama create sairolotech-expert -f Modelfile',
              });
            }
          } catch (err) {
            view.webview.postMessage({
              type: 'error',
              text: 'Expert AI error: ' + String(err),
            });
          }
          return;
        }

        // Handle LOCAL provider (Ollama on RTX 4060) directly
        if (provider === 'local') {
          try {
            const start = Date.now();
            const result = await callOllama('gemma3:4b', msg.text);
            if (result) {
              view.webview.postMessage({
                type: 'ai-response',
                text: result.text,
                provider: 'ollama',
                model: 'gemma3:4b',
                latency: Date.now() - start,
              });
            } else {
              // Fallback: try llama3.2:3b
              const fb = await callOllama('llama3.2:3b', msg.text);
              if (fb) {
                view.webview.postMessage({
                  type: 'ai-response',
                  text: fb.text,
                  provider: 'ollama',
                  model: 'llama3.2:3b',
                  latency: Date.now() - start,
                });
              } else {
                view.webview.postMessage({
                  type: 'error',
                  text: 'Local GPU (Ollama) not available. Make sure Ollama is running: `ollama serve`',
                });
              }
            }
          } catch (err) {
            view.webview.postMessage({
              type: 'error',
              text: 'Local GPU error: ' + String(err),
            });
          }
          return;
        }

        // Force specific provider if selected in UI
        const forcedConfig: AIConfig = {
          ...config,
          provider: provider as AIConfig['provider'],
          openRouterModel: model as OpenRouterModel || config.openRouterModel,
        };

        try {
          const result = await smartAI(msg.text, forcedConfig);
          view.webview.postMessage({
            type: 'ai-response',
            text: result.text,
            provider: result.provider,
            model: result.model,
            latency: result.latencyMs,
          });
        } catch (err) {
          view.webview.postMessage({
            type: 'error',
            text: String(err),
          });
        }
      } else if (msg.type === 'setKey') {
        // Securely store API key
        await storeAPIKey(this.context.secrets, msg.keyName, msg.value);
        view.webview.postMessage({
          type: 'keyStored',
          keyName: msg.keyName,
          success: true,
        });
        vscode.window.showInformationMessage(`API key saved securely for ${msg.keyName}`);
      } else if (msg.type === 'getKey') {
        // Check if key exists
        const val = await getAPIKey(this.context.secrets, msg.keyName);
        view.webview.postMessage({
          type: 'keyStatus',
          keyName: msg.keyName,
          hasKey: !!val,
        });
      } else if (msg.type === 'deleteKey') {
        await deleteAPIKey(this.context.secrets, msg.keyName);
        view.webview.postMessage({
          type: 'keyDeleted',
          keyName: msg.keyName,
        });
      }
    });
  }

  private async loadConfig(): Promise<AIConfig> {
    const workspaceConfig = vscode.workspace.getConfiguration('cloudCode');
    const provider = workspaceConfig.get('aiProvider', 'gemini') as AIConfig['provider'];

    // Load single keys from secret storage
    const geminiKey = await getAPIKey(this.context.secrets, 'geminiKey')
      ?? workspaceConfig.get('geminiKey', '');
    const openRouterKey = await getAPIKey(this.context.secrets, 'openRouterKey')
      ?? workspaceConfig.get('openRouterKey', '');
    const customApiKey = await getAPIKey(this.context.secrets, 'customApiKey')
      ?? workspaceConfig.get('customApiKey', '');
    const customApiUrl = await getAPIKey(this.context.secrets, 'customApiUrl')
      ?? workspaceConfig.get('customApiUrl', '');

    return {
      secrets: this.context.secrets,
      customApiUrl,
      customApiKey,
      geminiKey,
      geminiModel: workspaceConfig.get('geminiModel', 'gemini-2.5-flash') as 'gemini-2.5-flash' | 'gemini-2.5-pro',
      openRouterKey,
      openRouterModel: workspaceConfig.get('openRouterModel', 'anthropic/claude-sonnet-4.6') as OpenRouterModel,
      provider,
    };
  }
}
