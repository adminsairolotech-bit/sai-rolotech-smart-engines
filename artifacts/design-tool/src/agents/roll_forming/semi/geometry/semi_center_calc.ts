/**
 * SEMI_CENTER_CALC - Roll Forming Semi Agent
 * ===========================================
 * Centerline calculation agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  CenterlineResult,
  DXFEntity,
  Point2D,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_CENTER_CALC',
  version: '1.0.0',
  timeout: 15000,
  retries: 2,
};

export interface CenterCalcInput {
  profile: DXFEntity[];
  thickness: number;
  method: 'offset' | 'bisector' | 'voronoi';
  kFactor?: number;
}

export interface CenterCalcOutput {
  centerline: Point2D[][];
  inner: Point2D[][];
  outer: Point2D[][];
  offset: number;
  kFactor: number;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function calculateCenterline(
  input: CenterCalcInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<CenterCalcOutput>> {
  try {
    const offset = input.thickness / 2;
    const kFactor = input.kFactor || calculateKFactor(input.profile);

    const centerline = extractCenterline(input.profile);
    const inner = offsetContour(centerline, -offset);
    const outer = offsetContour(centerline, offset);

    return {
      success: true,
      data: {
        centerline,
        inner,
        outer,
        offset,
        kFactor,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Centerline calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function calculateKFactor(entities: DXFEntity[]): number {
  const avgBendRadius = calculateAverageBendRadius(entities);

  if (avgBendRadius < 1.5) return 0.35;
  if (avgBendRadius < 2.5) return 0.40;
  if (avgBendRadius < 4.0) return 0.45;
  return 0.50;
}

function calculateAverageBendRadius(entities: DXFEntity[]): number {
  const arcs = entities.filter(e => e.type === 'ARC');
  if (arcs.length === 0) return 3.0;

  let totalRadius = 0;
  for (const arc of arcs) {
    if (arc.points.length >= 2) {
      const dx = arc.points[arc.points.length - 1].x - arc.points[0].x;
      const dy = arc.points[arc.points.length - 1].y - arc.points[0].y;
      totalRadius += Math.sqrt(dx * dx + dy * dy) / 2;
    }
  }

  return totalRadius / arcs.length;
}

function extractCenterline(profile: DXFEntity[]): Point2D[][] {
  const contours: Point2D[][] = [];

  const polylines = profile.filter(e => e.type === 'POLYLINE');
  for (const polyline of polylines) {
    if (polyline.points.length >= 2) {
      contours.push([...polyline.points]);
    }
  }

  if (contours.length === 0) {
    const lines = profile.filter(e => e.type === 'LINE');
    for (const line of lines) {
      contours.push([...line.points]);
    }
  }

  return contours;
}

function offsetContour(contours: Point2D[][], distance: number): Point2D[][] {
  return contours.map(contour => offsetContourSingle(contour, distance));
}

function offsetContourSingle(contour: Point2D[], distance: number): Point2D[] {
  if (contour.length < 2) return contour;

  const offsetPoints: Point2D[] = [];
  const n = contour.length;

  for (let i = 0; i < n; i++) {
    const prev = contour[(i - 1 + n) % n];
    const curr = contour[i];
    const next = contour[(i + 1) % n];

    const dir1 = normalize(subtract(curr, prev));
    const dir2 = normalize(subtract(next, curr));

    const avgDir = normalize(add(dir1, dir2));

    const normal = { x: -avgDir.y, y: avgDir.x };

    const offset = scaleVector(normal, distance);

    offsetPoints.push(add(curr, offset));
  }

  return offsetPoints;
}

function subtract(a: Point2D, b: Point2D): Point2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

function add(a: Point2D, b: Point2D): Point2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

function normalize(v: Point2D): Point2D {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function scaleVector(v: Point2D, scale: number): Point2D {
  return { x: v.x * scale, y: v.y * scale };
}

// ============================================
// VALIDATION
// ============================================

export function validateCenterline(result: CenterCalcOutput): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  const allPoints = [...result.centerline.flat(), ...result.inner.flat(), ...result.outer.flat()];
  const hasNaN = allPoints.some(p => isNaN(p.x) || isNaN(p.y));

  if (hasNaN) {
    warnings.push('Centerline contains invalid (NaN) coordinates');
  }

  for (const inner of result.inner) {
    for (const outer of result.outer) {
      if (inner.length > 0 && outer.length > 0) {
        const innerDist = calculateMinDistance(inner[0], inner);
        const outerDist = calculateMinDistance(inner[0], outer);
        if (outerDist < innerDist * 0.8) {
          warnings.push('Potential contour intersection detected');
        }
      }
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

function calculateMinDistance(point: Point2D, contour: Point2D[]): number {
  let minDist = Infinity;
  for (const p of contour) {
    const dist = Math.sqrt(Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2));
    minDist = Math.min(minDist, dist);
  }
  return minDist;
}

// ============================================
// EXPORT
// ============================================

export const SemiCenterCalc = {
  config: CONFIG,
  calculateCenterline,
  validateCenterline,
};

export default SemiCenterCalc;
