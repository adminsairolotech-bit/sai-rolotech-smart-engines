/**
 * SEMI_FORM_CURVE - Roll Forming Semi Agent
 * ===========================================
 * Forming curve generation agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  FlowerStation,
  FormingCurve,
  Point2D,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_FORM_CURVE',
  version: '1.0.0',
  timeout: 15000,
  retries: 2,
};

export interface FormCurveInput {
  stations: FlowerStation[];
  radius?: number;
  resolution?: number;
  curveType?: 'bezier' | 'b-spline' | 'linear' | 'catmull-rom';
}

export interface FormCurveOutput {
  curves: FormingCurve[];
  totalLength: number;
  smoothness: number;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function generateFormingCurves(
  input: FormCurveInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<FormCurveOutput>> {
  try {
    const curves: FormingCurve[] = [];
    let totalLength = 0;

    for (let i = 0; i < input.stations.length; i++) {
      const station = input.stations[i];
      const radius = input.radius || station.radius;

      const curvePoints = generateCurvePoints(
        radius,
        input.resolution || 32,
        input.curveType || 'bezier'
      );

      const slope = i > 0
        ? (radius - input.stations[i - 1].radius) / (station.index - input.stations[i - 1].index)
        : 0;

      curves.push({
        stationIndex: i,
        radius,
        slope,
        points: curvePoints,
      });

      totalLength += calculateCurveLength(curvePoints);
    }

    const smoothness = calculateSmoothness(curves);

    return {
      success: true,
      data: {
        curves,
        totalLength,
        smoothness,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Forming curve generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function generateCurvePoints(
  radius: number,
  resolution: number,
  curveType: string
): Point2D[] {
  const points: Point2D[] = [];

  switch (curveType) {
    case 'linear':
      for (let i = 0; i <= resolution; i++) {
        const t = i / resolution;
        points.push({
          x: t * radius * 2,
          y: Math.sin(t * Math.PI) * radius * 0.1,
        });
      }
      break;

    case 'bezier':
      const cp1 = { x: radius * 0.3, y: radius * 0.05 };
      const cp2 = { x: radius * 0.7, y: radius * 0.05 };
      const end = { x: radius, y: 0 };
      for (let i = 0; i <= resolution; i++) {
        const t = i / resolution;
        points.push(bezierPoint({ x: 0, y: 0 }, cp1, cp2, end, t));
      }
      break;

    case 'b-spline':
      const controlPoints = [
        { x: 0, y: 0 },
        { x: radius * 0.25, y: radius * 0.03 },
        { x: radius * 0.5, y: radius * 0.02 },
        { x: radius * 0.75, y: -radius * 0.01 },
        { x: radius, y: 0 },
      ];
      for (let i = 0; i <= resolution; i++) {
        const t = i / resolution;
        points.push(bSplinePoint(controlPoints, t));
      }
      break;

    case 'catmull-rom':
      const crPoints = [
        { x: 0, y: 0 },
        { x: radius * 0.33, y: radius * 0.04 },
        { x: radius * 0.66, y: radius * 0.02 },
        { x: radius, y: 0 },
      ];
      for (let i = 0; i <= resolution; i++) {
        const t = i / resolution;
        const seg = Math.min(Math.floor(t * (crPoints.length - 1)), crPoints.length - 2);
        const localT = t * (crPoints.length - 1) - seg;
        points.push(catmullRomPoint(
          crPoints[Math.max(0, seg - 1)],
          crPoints[seg],
          crPoints[Math.min(crPoints.length - 1, seg + 1)],
          crPoints[Math.min(crPoints.length - 1, seg + 2)],
          localT
        ));
      }
      break;

    default:
      for (let i = 0; i <= resolution; i++) {
        const t = i / resolution;
        points.push({
          x: t * radius,
          y: Math.sin(t * Math.PI) * radius * 0.05,
        });
      }
  }

  return points;
}

function bezierPoint(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number): Point2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

function bSplinePoint(controlPoints: Point2D[], t: number): Point2D {
  const n = controlPoints.length - 1;
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt3 = mt * mt * mt;

  const i = Math.min(Math.floor(t * n), n - 1);
  const localT = t * n - i;

  const p0 = controlPoints[Math.max(0, i - 1)];
  const p1 = controlPoints[i];
  const p2 = controlPoints[Math.min(controlPoints.length - 1, i + 1)];
  const p3 = controlPoints[Math.min(controlPoints.length - 1, i + 2)];

  const a = -mt3 + 3 * mt * mt - 3 * mt * t + t3;
  const b = 3 * mt3 - 6 * mt * t + 3 * t2;
  const c = -3 * mt3 + 3 * mt * t + 3 * t2 - t3;
  const d = mt3;

  return {
    x: 0.1667 * (a * p0.x + b * p1.x + c * p2.x + d * p3.x),
    y: 0.1667 * (a * p0.y + b * p1.y + c * p2.y + d * p3.y),
  };
}

function catmullRomPoint(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number): Point2D {
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    ),
    y: 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    ),
  };
}

function calculateCurveLength(points: Point2D[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

function calculateSmoothness(curves: FormingCurve[]): number {
  if (curves.length < 2) return 100;

  let totalCurvatureChange = 0;
  let comparisons = 0;

  for (let i = 1; i < curves.length; i++) {
    const curvature1 = calculateCurvature(curves[i - 1].points);
    const curvature2 = calculateCurvature(curves[i].points);
    totalCurvatureChange += Math.abs(curvature2 - curvature1);
    comparisons++;
  }

  const avgChange = totalCurvatureChange / comparisons;
  const smoothness = Math.max(0, 100 - avgChange * 10);

  return Math.round(smoothness * 10) / 10;
}

function calculateCurvature(points: Point2D[]): number {
  if (points.length < 3) return 0;

  let totalCurvature = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const v1 = {
      x: points[i].x - points[i - 1].x,
      y: points[i].y - points[i - 1].y,
    };
    const v2 = {
      x: points[i + 1].x - points[i].x,
      y: points[i + 1].y - points[i].y,
    };

    const cross = v1.x * v2.y - v1.y * v2.x;
    const dot = v1.x * v2.x + v1.y * v2.y;
    const angle = Math.atan2(cross, dot);

    totalCurvature += Math.abs(angle);
  }

  return totalCurvature / (points.length - 2);
}

// ============================================
// VALIDATION
// ============================================

export function validateFormingCurves(curves: FormingCurve[]): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (curves.length === 0) {
    warnings.push('No forming curves generated');
  }

  for (const curve of curves) {
    if (curve.points.length < 2) {
      warnings.push(`Curve at station ${curve.stationIndex} has insufficient points`);
    }

    if (curve.radius <= 0) {
      warnings.push(`Invalid radius at station ${curve.stationIndex}`);
    }
  }

  const radiusChanges = [];
  for (let i = 1; i < curves.length; i++) {
    radiusChanges.push(Math.abs(curves[i].radius - curves[i - 1].radius));
  }

  if (radiusChanges.length > 0) {
    const maxChange = Math.max(...radiusChanges);
    if (maxChange > 20) {
      warnings.push(`Large radius change detected: ${maxChange.toFixed(1)}mm`);
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiFormCurve = {
  config: CONFIG,
  generateFormingCurves,
  validateFormingCurves,
};

export default SemiFormCurve;
