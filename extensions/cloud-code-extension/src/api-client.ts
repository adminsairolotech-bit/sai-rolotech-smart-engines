/**
 * API Client — Bridge from VS Code Extension to Python API
 * Python API runs on port 9000 with 30 engineering engines
 */

const API_BASE = 'http://localhost:9000/api';
const TIMEOUT = 15000;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ServiceHealth {
  name: string;
  port: number;
  status: 'running' | 'stopped' | 'checking';
  version?: string;
  uptime?: number;
}

export interface PipelineInput {
  geometry: {
    segments: Array<{ type: 'line' | 'arc'; length?: number; angle?: number; startAngle?: number; endAngle?: number }>;
    boundingBox: { width: number; height: number; minX?: number; minY?: number; maxX?: number; maxY?: number };
    bends?: Array<{ angle: number; radius: number; segmentIndex: number; side: 'left' | 'right'; direction: 'up' | 'down' }>;
    totalLength?: number;
  };
  thickness: number;
  material: string;
  sectionModel?: 'open' | 'closed';
  motorKw?: number;
  rpm?: number;
  shaftDiameter?: number;
}

export interface PipelineStep {
  step: number;
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'skip' | 'warn';
  reason?: string;
  data?: Record<string, unknown>;
}

export interface FlowerStation {
  station: number;
  angle: number;
  rollGap: number;
  rollDiameter: number;
  stripWidth: number;
  formingForce: number;
  springbackAngle: number;
  zone: string;
}

export interface PipelineSummary {
  section_width_mm: number;
  section_height_mm: number;
  sheet_thickness_mm: number;
  material: string;
  bend_count: number;
  total_length_mm: number;
  strip_width_mm: number;
  flower_pattern_generated: boolean;
  estimated_stations: number;
  shaft_diameter_mm: number;
  bearing_type: string;
  motor_kw: number;
  forming_force_max_kn: number;
  profile_complexity: string;
  section_type: string;
  accuracy_score: number;
  notes: string[];
}

export interface PipelineResult {
  pipeline_status: 'pass' | 'fail' | 'partial';
  steps: PipelineStep[];
  summary: PipelineSummary;
  flower_stations: FlowerStation[];
  roll_tooling: unknown[];
  errors: string[];
  warnings: string[];
}

// ─── HTTP Helper ─────────────────────────────────────────────────────────────
async function apiFetch<T>(url: string, options?: RequestInit, timeout = TIMEOUT): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const res = await fetch(url, {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  clearTimeout(timer);

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error');
    throw new Error(`API ${res.status}: ${errText}`);
  }

  return res.json() as Promise<T>;
}

// ─── Health Checks ────────────────────────────────────────────────────────────
export async function checkServices(): Promise<ServiceHealth[]> {
  const services: ServiceHealth[] = [
    { name: 'API Server', port: 8080, status: 'checking' },
    { name: 'Design Tool', port: 5000, status: 'checking' },
    { name: 'Python API', port: 9000, status: 'checking' },
  ];

  // Parallel health checks
  const results = await Promise.allSettled(
    services.map(async (s) => {
      const url = s.port === 5000 ? `http://localhost:${s.port}` : `${API_BASE}/health`;
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
      return { port: s.port, ok: res.ok || res.status < 500 };
    })
  );

  services.forEach((s, i) => {
    const r = results[i];
    if (r.status === 'fulfilled' && r.value.ok) {
      s.status = 'running';
    } else {
      s.status = 'stopped';
    }
  });

  // Try python-health for more detail
  try {
    const pyHealth = await apiFetch<{ status: string; engines?: string[] }>(
      `${API_BASE}/python-health`, {}, 5000
    );
    const pyService = services.find(s => s.name === 'Python API');
    if (pyService) {
      pyService.status = pyHealth.status === 'pass' ? 'running' : 'stopped';
      pyService.version = pyHealth.engines ? `v2.3 — ${pyHealth.engines.length} engines` : 'v2.3';
    }
  } catch {
    // python-health failed, keep stopped status
  }

  return services;
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────
export async function runAutoPipeline(input: PipelineInput): Promise<PipelineResult> {
  return apiFetch<PipelineResult>(`${API_BASE}/auto-pipeline`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ─── Flower Pattern ───────────────────────────────────────────────────────────
export async function generateFlower(params: {
  profileId?: string;
  geometry?: PipelineInput['geometry'];
  numStations: number;
  material: string;
  thickness: number;
  passAngleType?: 'linear' | 'progressive' | 'soft' | 'aggressive';
}): Promise<{
  stations: FlowerStation[];
  flowerSvg: string;
  complexity: string;
  accuracyScore: number;
}> {
  // Try python-api first
  try {
    return await apiFetch(`${API_BASE}/generate-flower`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  } catch {
    // Fallback to api-server
    return apiFetch(`${API_BASE}/generate-flower`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

// ─── Roll Tooling ─────────────────────────────────────────────────────────────
export async function generateRollTooling(params: {
  flowerId?: string;
  flowerStations?: FlowerStation[];
  material: string;
  thickness: number;
}): Promise<{
  rollTooling: unknown[];
  rollSvg: string;
  shaftData: { diameter: number; material: string; keyway: string };
  bearingData: { type: string; od: number; id: number; loadRating: string };
}> {
  try {
    return await apiFetch(`${API_BASE}/generate-roll-tooling`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  } catch {
    return apiFetch(`${API_BASE}/generate-roll-tooling`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

// ─── Materials ────────────────────────────────────────────────────────────────
export interface Material {
  code: string;
  name: string;
  fy_mpa: number;
  e_gpa: number;
  max_angle_per_station: number;
  k_factor: number;
  forming_difficulty: 'easy' | 'medium' | 'hard' | 'very_hard';
  category: 'steel' | 'aluminum' | 'special';
}

export async function getMaterials(): Promise<{
  status: string;
  materials: Record<string, {
    name: string;
    Fy_mpa: number;
    Uts_mpa: number;
    E_gpa: number;
    n_value: number;
    r_value: number;
    k_factor: number;
    density_kg_m3: number;
    min_bend_radius_x_t: number;
    max_thickness_mm: number;
    forming_difficulty: string;
    notes: string;
  }>;
  supported_codes: string[];
}> {
  return apiFetch(`${API_BASE}/materials`, {}, 5000);
}

// ─── Springback ──────────────────────────────────────────────────────────────
export async function calculateSpringback(params: {
  material: string;
  target_angle_deg: number;
  thickness_mm?: number;
  bend_radius_mm?: number;
}): Promise<{
  status: string;
  data?: {
    target_angle_deg: number;
    springback_deg: number;
    corrected_angle_deg: number;
    springback_compensation_deg: number;
    model_used: string;
    confidence: string;
    blocking: boolean;
  };
  reason?: string;
}> {
  return apiFetch(`${API_BASE}/springback`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ─── Strip Width ─────────────────────────────────────────────────────────────
export async function calculateStripWidth(params: {
  segments_mm: number[];
  bend_angles_deg: number[];
  thickness_mm: number;
  bend_radius_mm: number;
  material: string;
  include_coil_width?: boolean;
}): Promise<{
  status: string;
  data?: {
    flat_blank_mm: number;
    bend_allowances: number[];
    coil_strip_width_mm?: number;
    coil_weight_kg_per_m?: number;
    k_factor?: number;
    neutral_axis_shift?: number;
  };
  reason?: string;
}> {
  return apiFetch(`${API_BASE}/bend-allowance`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ─── BOM ─────────────────────────────────────────────────────────────────────
export interface BOMItem {
  item: string;
  material: string;
  quantity: number;
  unit: string;
  weight_kg: number;
  notes: string;
}

export async function generateBOM(params: {
  profile: PipelineSummary;
  flowerStations: FlowerStation[];
  rollTooling?: unknown[];
}): Promise<{
  items: BOMItem[];
  totalWeight: number;
  estimatedCost: number;
  currency: string;
}> {
  try {
    return await apiFetch(`${API_BASE}/bom`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  } catch {
    return apiFetch(`${API_BASE}/bom`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

// ─── DXF Upload ──────────────────────────────────────────────────────────────
export async function uploadDXF(fileBuffer: ArrayBuffer, fileName: string): Promise<{
  geometry: PipelineInput['geometry'];
  profileType: string;
  bendCount: number;
  sectionWidth: number;
  sectionHeight: number;
}> {
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer]), fileName);

  const res = await fetch(`${API_BASE}/upload-dxf`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

// ─── Process Simulation ───────────────────────────────────────────────────────
export async function runSimulation(params: {
  toolingId?: string;
  rollTooling: unknown[];
  material: string;
  thickness: number;
  speed: number;
}): Promise<{
  strain: Array<{ station: number; maxStrain: number; zone: string }>;
  stress: Array<{ station: number; maxStress: number; unit: string }>;
  defects: Array<{ type: string; probability: number; severity: string; station: number }>;
  qualityScore: number;
  formingEnergy: number;
  simulationLevel: number;
}> {
  try {
    return await apiFetch(`${API_BASE}/simulate-phase3`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  } catch {
    return apiFetch(`${API_BASE}/simulate-phase3`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

// ─── CAD Export ───────────────────────────────────────────────────────────────
export async function exportCAD(params: {
  toolingId?: string;
  rollTooling: unknown[];
  format: 'dxf' | 'step' | 'pdf';
}): Promise<{ downloadUrl: string; fileName: string; size_kb: number }> {
  try {
    return await apiFetch(`${API_BASE}/export/cad`, {
      method: 'POST',
      body: JSON.stringify({ ...params, export_format: params.format }),
    });
  } catch {
    return apiFetch(`${API_BASE}/export/cad`, {
      method: 'POST',
      body: JSON.stringify({ ...params, export_format: params.format }),
    });
  }
}

// ─── G-Code Generation ───────────────────────────────────────────────────────
export async function generateGCode(params: {
  flowerId?: string;
  flowerStations: FlowerStation[];
  machine?: string;
}): Promise<{
  gcode: string;
  fileName: string;
  safetyScore: number;
  issues: string[];
}> {
  try {
    return await apiFetch(`${API_BASE}/generate-gcode`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  } catch {
    return apiFetch(`${API_BASE}/generate-gcode`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

// ─── AI Chat (via api-server) ───────────────────────────────────────────────
export async function aiChat(message: string, history?: Array<{ role: string; content: string }>): Promise<{
  response: string;
  mode: string;
}> {
  return apiFetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  }, 90000);
}
