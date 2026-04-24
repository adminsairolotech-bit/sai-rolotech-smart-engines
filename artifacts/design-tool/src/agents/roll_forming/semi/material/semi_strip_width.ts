/**
 * SEMI_STRIP_WIDTH - Roll Forming Semi Agent
 * ===========================================
 * Strip width calculation agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  StripWidthResult,
  BendAllowance,
  StripWidthMethod,
  DXFEntity,
  Point2D,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_STRIP_WIDTH',
  version: '1.0.0',
  timeout: 10000,
  retries: 2,
};

export interface StripWidthInput {
  profile: DXFEntity[];
  thickness: number;
  kFactor: number;
  method?: StripWidthMethod;
  bendRadii?: number[];
}

export interface StripWidthOutput {
  flatWidth: number;
  bendAllowances: BendAllowance[];
  totalWidth: number;
  kFactor: number;
  method: StripWidthMethod;
  segments: StripSegment[];
}

export interface StripSegment {
  type: 'flat' | 'bend';
  length: number;
  angle?: number;
  radius?: number;
}

// ============================================
// K-FACTOR TABLES
// ============================================

const K_FACTOR_TABLE: Record<string, Record<number, number>> = {
  mild_steel: {
    0.5: 0.35, 1.0: 0.38, 1.5: 0.40, 2.0: 0.42, 2.5: 0.44, 3.0: 0.45,
  },
  high_strength: {
    0.5: 0.40, 1.0: 0.42, 1.5: 0.45, 2.0: 0.48, 2.5: 0.50, 3.0: 0.52,
  },
  stainless: {
    0.5: 0.38, 1.0: 0.40, 1.5: 0.42, 2.0: 0.44, 2.5: 0.46, 3.0: 0.48,
  },
  aluminum: {
    0.5: 0.32, 1.0: 0.33, 1.5: 0.35, 2.0: 0.36, 2.5: 0.38, 3.0: 0.40,
  },
};

// ============================================
// CORE FUNCTIONS
// ============================================

export async function calculateStripWidth(
  input: StripWidthInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<StripWidthOutput>> {
  try {
    const method = input.method || 'analytical';
    const kFactor = input.kFactor || interpolateKFactor(input.thickness);

    const segments = analyzeProfile(input.profile);
    const bendAllowances: BendAllowance[] = [];

    let flatLength = 0;
    let totalBendAllowance = 0;

    for (const segment of segments) {
      if (segment.type === 'flat') {
        flatLength += segment.length;
      } else if (segment.type === 'bend' && segment.angle && segment.radius !== undefined) {
        const allowance = calculateBendAllowance(
          segment.angle,
          segment.radius,
          input.thickness,
          kFactor
        );
        bendAllowances.push({
          bendAngle: segment.angle,
          insideRadius: segment.radius,
          allowance,
        });
        totalBendAllowance += allowance;
      }
    }

    const flatWidth = flatLength;
    const totalWidth = flatWidth + totalBendAllowance;

    return {
      success: true,
      data: {
        flatWidth,
        bendAllowances,
        totalWidth,
        kFactor,
        method,
        segments,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Strip width calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function interpolateKFactor(thickness: number): number {
  const thicknesses = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

  for (let i = 0; i < thicknesses.length - 1; i++) {
    if (thickness >= thicknesses[i] && thickness <= thicknesses[i + 1]) {
      const ratio = (thickness - thicknesses[i]) / (thicknesses[i + 1] - thicknesses[i]);
      return 0.40 + ratio * 0.02;
    }
  }

  return thickness > 3.0 ? 0.45 : 0.38;
}

function analyzeProfile(profile: DXFEntity[]): StripSegment[] {
  const segments: StripSegment[] = [];

  for (const entity of profile) {
    if (entity.type === 'LINE' && entity.points.length === 2) {
      const dx = entity.points[1].x - entity.points[0].x;
      const dy = entity.points[1].y - entity.points[0].y;
      const length = Math.sqrt(dx * dx + dy * dy);
      segments.push({ type: 'flat', length });
    } else if (entity.type === 'ARC' && entity.points.length > 1) {
      const radius = estimateArcRadius(entity.points);
      const angle = estimateArcAngle(entity.points);
      segments.push({
        type: 'bend',
        length: radius * (angle * Math.PI) / 180,
        angle,
        radius,
      });
    } else if (entity.type === 'POLYLINE') {
      for (let i = 0; i < entity.points.length - 1; i++) {
        const dx = entity.points[i + 1].x - entity.points[i].x;
        const dy = entity.points[i + 1].y - entity.points[i].y;
        const length = Math.sqrt(dx * dx + dy * dy);
        segments.push({ type: 'flat', length });
      }
    }
  }

  return mergeAdjacentSegments(segments);
}

function estimateArcRadius(points: Point2D[]): number {
  if (points.length < 3) return 5;

  const p1 = points[0];
  const p2 = points[Math.floor(points.length / 2)];
  const p3 = points[points.length - 1];

  const d12 = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  const d23 = Math.sqrt((p3.x - p2.x) ** 2 + (p3.y - p2.y) ** 2);

  return Math.max(d12, d23) / 2;
}

function estimateArcAngle(points: Point2D[]): number {
  if (points.length < 2) return 90;

  const start = points[0];
  const end = points[points.length - 1];

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const chord = Math.sqrt(dx * dx + dy * dy);

  const radius = estimateArcRadius(points);

  if (chord >= 2 * radius) return 180;

  return Math.min(180, Math.max(15, (chord / radius) * (180 / Math.PI)));
}

function calculateBendAllowance(
  angleDeg: number,
  insideRadius: number,
  thickness: number,
  kFactor: number
): number {
  const angleRad = (angleDeg * Math.PI) / 180;
  const neutralAxis = insideRadius + kFactor * thickness;

  return angleRad * neutralAxis;
}

function mergeAdjacentSegments(segments: StripSegment[]): StripSegment[] {
  if (segments.length <= 1) return segments;

  const merged: StripSegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const next = segments[i];

    if (current.type === 'flat' && next.type === 'flat') {
      current.length += next.length;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
}

// ============================================
// VALIDATION
// ============================================

export function validateStripWidth(result: StripWidthOutput): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (result.totalWidth <= 0) {
    warnings.push('Total width is zero or negative');
  }

  if (result.kFactor < 0.25 || result.kFactor > 0.60) {
    warnings.push(`K-factor ${result.kFactor} is outside typical range (0.25-0.60)`);
  }

  const largeBends = result.bendAllowances.filter(b => b.allowance > result.flatWidth * 0.5);
  if (largeBends.length > 0) {
    warnings.push('Some bend allowances are unusually large compared to flat length');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiStripWidth = {
  config: CONFIG,
  calculateStripWidth,
  validateStripWidth,
  K_FACTOR_TABLE,
};

export default SemiStripWidth;
