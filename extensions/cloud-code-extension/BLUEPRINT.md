# 🗺️ Cloud Code Extension — Integration Blueprint
## Master Plan: VS Code Extension → api-server → python-api → World-Class Simulation

**Date:** 2026-04-10
**Goal:** Grade C+ → A+ in 4 phases
**Free APIs:** OpenRouter, Groq, Together AI, Offline KB

---

## 🔑 KEY INSIGHT (Already Verified)

```
VS Code Extension ──fetch()──> api-server (port 8080)
                              │
                              │ GET /api/health
                              │ GET /api/python-health
                              │ POST /api/auto-pipeline    ← THE POWERHOUSE
                              │ POST /api/ai/chat
                              │ POST /api/bom
                              │ POST /api/export/cad
                              │
                              └───fetch()──> python-api (port 9000)
                                             │
                                             └── 54 engines ✅ WORKING
                                                80+ endpoints ✅ WORKING
                                                534 tests ✅ PASSING
```

**The bridge is just `fetch()` calls from extension to api-server!**

---

## 🚀 FREE API STRATEGY

### Tiers (Zero Cost → Low Cost)

| # | Provider | Free Tier | Models | Best For |
|---|----------|-----------|--------|----------|
| 1 | **OpenRouter** | $5 free credits | Claude Sonnet 4.6 (deep thinking) | Main AI engine |
| 2 | **Groq** | 14,400 req/min free | Llama 3.3 70B, Mixtral | Fast inference |
| 3 | **Together AI** | $5 free credits | Qwen 2.5, DeepSeek | Alternative models |
| 4 | **Offline KB** | **$0 forever** | Built-in 60+ topics | Fallback + roll forming |
| 5 | **Perplexity** | 1000 rays/month free | Sonar | Research only |

### API Key Setup (Quick Start)

**OpenRouter ($5 free):**
```
1. Go to https://openrouter.ai/keys
2. Create account + add $5 credit (₹0 for first users sometimes)
3. Copy key → paste in .env or VS Code settings
4. Done! Claude Sonnet 4.6 deep thinking mode
```

**Groq (Completely Free):**
```
1. Go to https://console.groq.com/keys
2. Create account (no credit card)
3. Create API key
4. Use Llama 3.3 70B — 14,400 req/min FREE
```

**Together AI ($5 free):**
```
1. Go to https://api.together.ai/settings
2. Create account + $5 free
3. Use Qwen 2.5 or DeepSeek models
```

### Extension Settings for API Keys

```json
// VS Code Settings (settings.json)
{
  "cloudCode.openRouterKey": "sk-or-...",
  "cloudCode.groqKey": "gsk_...",
  "cloudCode.togetherKey": "...",
  "cloudCode.aiProvider": "openrouter",  // or "groq", "offline"
  "cloudCode.aiModel": "anthropic/claude-sonnet-4.6"
}
```

---

## 📐 INTEGRATION ARCHITECTURE

### Current State (Broken)
```
extension.ts ──X──> api-server ──X──> python-api
   │                  │                    │
   ❌ no fetch    ❌ no calls          ✅ 54 engines
                    to pipeline           ❌ not used
```

### Target State (Connected)
```
extension.ts ──fetch()──> api-server ──fetch()──> python-api
   │                        │                      │
   │                        │                      │
   └── 20 commands         └── 10 steps            └── 54 engines
        all connected           auto-pipeline            all working
```

---

## 📋 PHASE-BY-PHASE IMPLEMENTATION PLAN

### Phase 1: Bridge Connection (Week 1) — Grade C+ → B-

**Goal:** Connect extension to api-server, enable all commands

#### Step 1.1: Add HTTP Client (10 min)
```typescript
// src/commands.ts — add at top
import { fetch } from 'node:http';  // built-in Node.js
// OR use vscode.env.fetch if available
// OR add axios: npm install axios
```

```typescript
// src/api-client.ts — NEW FILE
const API_BASE = 'http://localhost:8080/api';

export async function healthCheck(): Promise<ServiceHealth> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function pythonHealthCheck(): Promise<PythonHealth> {
  const res = await fetch(`${API_BASE}/python-health`);
  return res.json();
}

export async function runAutoPipeline(input: PipelineInput): Promise<PipelineResult> {
  const res = await fetch(`${API_BASE}/auto-pipeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function aiChat(message: string, history?: ChatEntry[]): Promise<AIResponse> {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  return res.json();
}

export async function generateBOM(params: BOMParams): Promise<BOMResult> {
  const res = await fetch(`${API_BASE}/bom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function getMaterials(): Promise<Material[]> {
  const res = await fetch(`${API_BASE}/roll-pass/materials`);
  return res.json();
}
```

#### Step 1.2: Enable All Commands in Command Palette (5 min)
Remove all `"when": "false"` entries from `package.json`:

```json
// BEFORE (all hidden):
{ "command": "cloudCode.openProfileDesigner", "when": "false" }

// AFTER (visible):
{ "command": "cloudCode.openProfileDesigner" }
```

#### Step 1.3: Wire Dashboard to Real API (20 min)
```typescript
// In dashboard HTML + commands.ts:
// Replace static service check with:
const health = await apiClient.pythonHealthCheck();
dashboard.webview.postMessage({
  type: 'services',
  services: [
    { name: 'API Server', port: 8080, status: 'running' },
    { name: 'Python API', port: 9000, status: health.status === 'pass' ? 'running' : 'stopped' },
    ...
  ]
});
```

#### Step 1.4: Wire Profile Designer WebView (30 min)
```typescript
// In profile-designer WebView HTML, add:
async function submitProfile() {
  const data = {
    geometry: {
      segments: buildSegmentsFromForm(),
      boundingBox: { width, height },
      bends: buildBendsFromForm(),
    },
    thickness: parseFloat(document.getElementById('thickness').value),
    material: document.getElementById('material').value,
  };

  vscode.postMessage({ type: 'runPipeline', data });

  // Show loading spinner
  document.getElementById('results').innerHTML = '<div class="loading">⚙️ Running pipeline...</div>';
}

// Listen for result:
window.addEventListener('message', (event) => {
  if (event.data.type === 'pipelineResult') {
    renderFlowerPattern(event.data.result.flower_stations);
    renderSummary(event.data.result.summary);
  }
});
```

#### Step 1.5: Wire Flower Pattern WebView (20 min)
```typescript
// On form submit in flower-pattern.html:
const result = await apiClient.runAutoPipeline(profileData);
renderFlowerSVG(result.flower_stations);
renderStationTable(result.flower_stations);
```

#### Step 1.6: Wire Material Database WebView (15 min)
```typescript
const materials = await apiClient.getMaterials();
renderMaterialGrid(materials);
```

---

### Phase 2: Core Functions (Week 2) — Grade B- → B+

**Goal:** All major engineering features work end-to-end

#### Step 2.1: Roll Tooling CAD (30 min)
```typescript
// Wire roll-tooling.html to auto-pipeline response
// Auto-pipeline already returns roll_tooling data
// Just render the roll diagrams in WebView SVG
renderRollTooling(result.roll_tooling);
```

#### Step 2.2: Springback Calculator (20 min)
```typescript
// Wire springback-calculator.html
// POST to /api/roll-pass/springback or use python-api directly
const sb = await apiClient.springback({
  angle: 90,
  r_t_ratio: 2.0,
  material: 'SS',
  thickness: 2.0,
});
showResult(`Springback: ${sb.springback_deg}°`);
```

#### Step 2.3: Strip Width Calculator (20 min)
```typescript
// Wire strip-width-calculator.html
// Auto-pipeline already returns strip_width_mm
// Just extract and display from pipeline result
```

#### Step 2.4: BOM Generator (30 min)
```typescript
// Wire bom-generator.html
// Call api-server /api/bom or use python-api bom_engine
const bom = await apiClient.generateBOM({
  profile: result.summary,
  flowerStations: result.flower_stations,
  rollTooling: result.roll_tooling,
});
renderBOMTable(bom.items);
```

#### Step 2.5: DXF Upload (30 min)
```typescript
// Add to profile-designer WebView
const file = await vscode.window.showOpenDialog({
  filters: { 'DXF': ['dxf', 'dwg'] }
});
const formData = new FormData();
formData.append('file', await vscode.workspace.fs.readFile(file[0]));
const result = await fetch(`${API_BASE}/upload-dxf`, {
  method: 'POST',
  body: formData,
});
```

---

### Phase 3: World-Class Simulation (Week 3-4) — Grade B+ → A-

**Goal:** Full python-api engine integration, real simulation results

#### Step 3.1: Advanced Flower Pattern (45 min)
```typescript
// Wire to python-api advanced_flower_engine via api-server
const flower = await fetch(`${PYTHON_API}/api/generate-flower`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profile_id: profileId,
    num_stations: 24,
    material: 'GI',
    thickness: 2.0,
    pass_angle_type: 'progressive',
  }),
});

// Returns: stations[], flower_svg, accuracy_score
renderFlowerDiagram(flower.flower_svg);
renderStationBreakdown(flower.stations);
renderSpringback(flower.springback_data);
```

#### Step 3.2: Process Simulation (45 min)
```typescript
// Wire fea-simulation.html to /api/simulate-phase3
const sim = await fetch(`${API_BASE}/simulate-phase3`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tooling_id: toolingId,
    material: 'GI',
    thickness: 2.0,
    speed: 20,
  }),
});

// Returns: strain[], stress[], defects[], quality_score
renderDefectHeatmap(sim.defects);
renderStressChart(sim.stress);
renderStrainDiagram(sim.strain);
```

#### Step 3.3: Roll Contour SVG (30 min)
```typescript
// Wire 3d-preview.html to /api/generate-roll-tooling
const tooling = await fetch(`${API_BASE}/generate-roll-tooling`, {
  method: 'POST',
  body: JSON.stringify({ flower_id: flowerId }),
});

// Returns: roll_contours[], shaft_data, bearing_data
render3DPreview(tooling.roll_contours, tooling.shaft_data);
renderRollAssembly(tooling);
```

#### Step 3.4: CAD Export (30 min)
```typescript
// Wire export-ui.html to real CAD generation
// Call python-api cad_export_engine
const export = await fetch(`${PYTHON_API}/api/export/cad`, {
  method: 'POST',
  body: JSON.stringify({ tooling_id: toolingId, format: 'dxf' }),
});
// Returns: download URL for DXF file
vscode.commands.executeCommand('vscode.open', export.downloadUrl);
```

#### Step 3.5: PDF Report (20 min)
```typescript
// Wire process-card.html
const report = await fetch(`${API_BASE}/pdf`, {
  method: 'POST',
  body: JSON.stringify({ job_id: jobId }),
});
vscode.env.openExternal(Uri.parse(report.pdf_url));
```

---

### Phase 4: AI Integration & Polish (Week 5-6) — Grade A- → A

**Goal:** Free AI for world-class engineering assistance

#### Step 4.1: AI Chat Panel (30 min)
```typescript
// Wire AI Chat into extension as inline panel
// Uses OpenRouter (Claude Sonnet 4.6 deep thinking) OR Groq (free)
async function aiAssist(query: string) {
  // Try OpenRouter first (Claude Sonnet 4.6)
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.secrets.get('openrouterKey')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.6',
        messages: [{ role: 'user', content: buildRollFormingPrompt(query) }],
        thinking: { type: 'enabled', budget_tokens: 8000 },
        max_tokens: 4000,
      }),
    });
    return (await res.json()).choices[0].message.content;
  } catch {
    // Fallback to Groq (free)
    return await groqResponse(query);
  }
}

async function groqResponse(query: string) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${context.secrets.get('groqKey')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: buildRollFormingPrompt(query) }],
      max_tokens: 2000,
    }),
  });
  return (await res.json()).choices[0].message.content;
}
```

#### Step 4.2: Defect Diagnosis AI (20 min)
```typescript
// Wire to /api/ai/diagnose
const diagnosis = await fetch(`${API_BASE}/ai/diagnose`, {
  method: 'POST',
  body: JSON.stringify({ defect_id: 'edge_wave', material: 'GI', thickness: 2.0 }),
});
// Returns: root causes, corrections with priority, prevention tips
```

#### Step 4.3: 3D Visualization with Three.js (45 min)
```typescript
// Add Three.js to WebViews for 3D roll preview
// Already has placeholder in 3d-preview.html
// Connect to actual roll tooling data from auto-pipeline
import * as THREE from 'three';
function render3DFlower(stations: Station[]) {
  const scene = new THREE.Scene();
  // Create roll geometry from station data
  stations.forEach((station, i) => {
    const geometry = buildRollGeometry(station);
    scene.add(geometry);
  });
  // Animate forming sequence
}
```

#### Step 4.4: Real G-Code Generation (30 min)
```typescript
// Wire G-Code editor to /api/generate-gcode
const gcode = await fetch(`${API_BASE}/generate-gcode`, {
  method: 'POST',
  body: JSON.stringify({ flower_id: flowerId, machine: 'generic' }),
});
// Returns: multi-station G-code with safety verification
openGCodeInEditor(gcode.content);
```

---

## 🧪 PIPELINE ENDPOINT — THE POWERHOUSE

The `POST /api/auto-pipeline` endpoint is the single most important integration point:

```typescript
// Request body:
{
  geometry: {
    segments: [{ type: "line", length: 100 }, { type: "arc", angle: 45 }],
    boundingBox: { width: 100, height: 50 },
    bends: [{ angle: 90, radius: 2, side: "left" }]
  },
  thickness: 2.0,
  material: "GI",
  sectionModel: "open",
  motorKw: 11,
  rpm: 1440
}

// Response (10 steps, all working):
{
  pipeline_status: "pass",
  steps: [
    { step: 1, id: "import", label: "Geometry Import", status: "pass" },
    { step: 2, id: "profile", label: "Profile Validation", status: "pass" },
    { step: 3, id: "thickness", label: "Sheet Thickness", status: "pass" },
    { step: 4, id: "material", label: "Raw Material", status: "pass" },
    { step: 5, id: "strip-width", label: "Neutral Axis", status: "pass" },
    { step: 6, id: "station-count", label: "Station Count", status: "pass" },
    { step: 7, id: "flower", label: "Flower Pattern", status: "pass" },
    { step: 8, id: "shaft-bearing", label: "Shaft & Bearing", status: "pass" },
    { step: 9, id: "motor", label: "Motor Power", status: "pass" },
    { step: 10, id: "report", label: "Engineering Report", status: "pass" }
  ],
  summary: {
    section_width_mm: 100,
    section_height_mm: 50,
    sheet_thickness_mm: 2.0,
    material: "GI",
    strip_width_mm: 226.5,
    estimated_stations: 24,
    shaft_diameter_mm: 60,
    bearing_type: "6212",
    motor_kw: 11,
    forming_force_max_kn: 45.2,
    profile_complexity: "medium",
    accuracy_score: 97
  },
  flower_stations: [ /* 24 station objects */ ],
  roll_tooling: [ /* roll tooling data */ ],
  errors: [],
  warnings: []
}
```

**One API call → Full engineering analysis!**

---

## 📊 FREE API IMPLEMENTATION

### OpenRouter Integration (Primary — Claude Sonnet 4.6)
```typescript
// Use vscode.SecretStorage for API key storage
async function getOpenRouterKey(): Promise<string | undefined> {
  return await context.secrets.get('openrouterKey');
}

async function callClaudeDeepThinking(prompt: string): Promise<string> {
  const key = await getOpenRouterKey();
  if (!key) {
    vscode.window.showWarningMessage('OpenRouter key not set. Using offline AI.');
    return offlineAI(prompt);
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://sairolotech.com',
      'X-Title': 'Sai Rolotech Cloud Code Extension',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.6',
      messages: [{ role: 'user', content: buildEngineeringPrompt(prompt) }],
      thinking: { type: 'enabled', budget_tokens: 10000 },
      max_tokens: 8000,
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Groq Integration (Fallback — Completely Free)
```typescript
async function callGroqLlama(prompt: string): Promise<string> {
  const key = await context.secrets.get('groqKey');
  if (!key) throw new Error('Groq key not set');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: buildEngineeringPrompt(prompt) }],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Together AI Integration (Alternative)
```typescript
async function callTogetherAI(prompt: string): Promise<string> {
  const key = await context.secrets.get('togetherKey');
  if (!key) throw new Error('Together AI key not set');

  const response = await fetch('https://api.together.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      messages: [{ role: 'user', content: buildEngineeringPrompt(prompt) }],
      max_tokens: 4000,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### AI Fallback Chain (Resilient)
```typescript
async function smartAI(prompt: string): Promise<AIPayload> {
  // Try in order of preference
  const chain = [
    () => callClaudeDeepThinking(prompt),       // Best quality
    () => callGroqLlama(prompt),                 // Fast + free
    () => callTogetherAI(prompt),               // Backup
    () => apiServerAI(prompt),                  // api-server offline KB
  ];

  for (const attempt of chain) {
    try {
      const result = await attempt();
      return { text: result, provider: attempt.name, success: true };
    } catch (err) {
      console.warn(`AI ${attempt.name} failed:`, err);
      continue;
    }
  }

  return { text: offlineResponse(prompt), provider: 'offline-kb', success: false };
}
```

---

## 🎯 ROLL FORMING SPECIFIC AI PROMPTS

```typescript
function buildEngineeringPrompt(userQuery: string): string {
  return `You are a roll forming engineering expert at Sai Rolotech.
Role: Senior Roll Forming Engineer with 20+ years experience.
Domain: Roll forming, CNC machining, CAD/CAM, sheet metal, tooling design.

Context:
- Material: ${material || 'GI steel'}
- Thickness: ${thickness || '2.0'}mm
- Profile: ${profileType || 'C-channel'}
- Stations: ${stationCount || '24'}

Question: ${userQuery}

Provide a concise, technically accurate answer. Include formulas where relevant.
Use practical, industry-proven methods (COPRA, Shigley's, DIN 6935).
If uncertain, say so clearly.`;
}

function buildFlowerAdvice(flowerData: FlowerStations[]): string {
  return `Analyze this flower pattern for a roll forming process.
Profile: ${profileType}
Material: ${material}, Thickness: ${thickness}mm
Stations: ${flowerData.length}

Station breakdown:
${flowerData.map(s => `S${s.station}: angle=${s.bendAngle?.toFixed(1)}°, gap=${s.rollGap?.toFixed(2)}mm, strip=${s.stripWidth?.toFixed(1)}mm`).join('\n')}

Provide:
1. Forming quality assessment
2. Problem areas or risks
3. Optimization suggestions
4. Springback compensation recommendations`;
}
```

---

## ⏱️ TIMELINE & EFFORT ESTIMATE

| Phase | Tasks | Effort | Grade Impact |
|-------|-------|--------|--------------|
| Phase 1 | HTTP client + enable commands + wire 3 WebViews | ~3 hours | C+ → B- |
| Phase 2 | Wire 5 more WebViews + DXF upload | ~4 hours | B- → B+ |
| Phase 3 | Wire python-api engines + simulation + 3D | ~6 hours | B+ → A- |
| Phase 4 | AI integration + polish + G-Code editor | ~5 hours | A- → A |

**Total: ~18 hours (3-4 days of work)**

---

## 🛠️ FILE CHANGES SUMMARY

### New Files Needed

| File | Purpose |
|------|---------|
| `src/api-client.ts` | HTTP client for api-server calls |
| `src/ai-providers.ts` | Free API integration (OpenRouter, Groq, Together) |
| `src/secret-store.ts` | VS Code SecretStorage for API keys |
| `src/webview-utils.ts` | Shared WebView rendering utilities |
| `src/rollforming-prompts.ts` | AI prompt templates |
| `src/types/pipeline.ts` | TypeScript interfaces for pipeline data |
| `src/types/api.ts` | TypeScript interfaces for all API types |

### Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Remove `"when": "false"` from 16 commands, add configuration |
| `src/commands.ts` | Import api-client, wire all WebViews to real API |
| `src/extension.ts` | Register secret storage, init API client |
| `webviews/profile-designer.html` | Connect form to auto-pipeline |
| `webviews/flower-pattern.html` | Render flower SVG from pipeline result |
| `webviews/3d-preview.html` | Three.js + real roll tooling data |

---

**Prepared by:** Claude Code
**Last Updated:** 2026-04-10
**Status:** Implementation Ready — Start Phase 1
