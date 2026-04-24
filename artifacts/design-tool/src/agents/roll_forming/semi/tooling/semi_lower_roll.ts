/**
 * SEMI_LOWER_ROLL - Roll Forming Semi Agent
 * ===========================================
 * Lower roll design agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  Roll,
  RollProfile,
  RollProfileSegment,
  Point2D,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_LOWER_ROLL',
  version: '1.0.0',
  timeout: 15000,
  retries: 2,
};

export interface LowerRollInput {
  centerline: Point2D[];
  thickness: number;
  formingAngle: number;
  material: string;
  rollDiameter?: number;
  offset?: number;
  matchUpperRoll?: boolean;
}

export interface LowerRollOutput {
  roll: Roll;
  groove: LowerGrooveGeometry;
  gapAdjustment: number;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function designLowerRoll(
  input: LowerRollInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<LowerRollOutput>> {
  try {
    const offset = input.offset || -(input.thickness / 2 + 3);
    const profile = generateLowerProfileContour(input.centerline, offset);

    let rollDiameter = input.rollDiameter;
    if (input.matchUpperRoll) {
      rollDiameter = rollDiameter || calculateRollDiameter(input.centerline, input.thickness);
    } else {
      rollDiameter = rollDiameter || calculateRollDiameter(input.centerline, input.thickness);
    }

    const faceWidth = calculateFaceWidth(input.centerline);
    const boreDiameter = calculateBoreDiameter(rollDiameter);

    const groove = calculateGrooveGeometry(profile, input.thickness);

    const rollProfile: RollProfile = {
      segments: convertToSegments(profile),
      totalLength: calculateLength(profile),
      grooveDepth: groove.depth,
    };

    const roll: Roll = {
      id: `lower_roll_${context.projectId}`,
      profile: rollProfile,
      diameter: rollDiameter,
      faceWidth,
      material: input.material,
      boreDiameter,
      weight: calculateWeight(rollDiameter, faceWidth),
      centerOffset: offset,
    };

    const gapAdjustment = calculateGapAdjustment(roll, input.thickness);

    return {
      success: true,
      data: {
        roll,
        groove,
        gapAdjustment,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Lower roll design failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function generateLowerProfileContour(centerline: Point2D[], offset: number): Point2D[] {
  const contour: Point2D[] = [];

  for (let i = 0; i < centerline.length; i++) {
    const prev = centerline[Math.max(0, i - 1)];
    const curr = centerline[i];
    const next = centerline[Math.min(centerline.length - 1, i + 1)];

    let nx: number, ny: number;

    if (i === 0) {
      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      nx = -dy / len;
      ny = dx / len;
    } else if (i === centerline.length - 1) {
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      nx = -dy / len;
      ny = dx / len;
    } else {
      const dx1 = curr.x - prev.x;
      const dy1 = curr.y - prev.y;
      const dx2 = next.x - curr.x;
      const dy2 = next.y - curr.y;

      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      nx = (-dy1 / len1 - dy2 / len2) / 2;
      ny = (dx1 / len1 + dx2 / len2) / 2;
      const len = Math.sqrt(nx * nx + ny * ny);
      if (len > 0) {
        nx /= len;
        ny /= len;
      }
    }

    contour.push({
      x: curr.x + nx * offset,
      y: curr.y + ny * offset,
    });
  }

  return contour;
}

function calculateRollDiameter(centerline: Point2D[], thickness: number): number {
  const bounds = calculateBounds(centerline);
  const height = bounds.maxY - bounds.minY;
  const baseDiameter = Math.max(height * 2 + 40, 100);

  return Math.round(baseDiameter / 10) * 10;
}

function calculateFaceWidth(centerline: Point2D[]): number {
  const length = calculateLength(centerline);
  return length + 30;
}

function calculateBoreDiameter(rollDiameter: number): number {
  return Math.round((rollDiameter * 0.25) / 2) * 2 + 5;
}

function calculateGrooveGeometry(profile: Point2D[], thickness: number): LowerGrooveGeometry {
  const bounds = calculateBounds(profile);

  return {
    depth: Math.abs(bounds.maxY - bounds.minY) / 2 + thickness,
    width: Math.abs(bounds.maxX - bounds.minX) + 10,
    angle: 90,
    radius: thickness * 1.5,
    reliefWidth: thickness * 3,
  };
}

interface LowerGrooveGeometry {
  depth: number;
  width: number;
  angle: number;
  radius: number;
  reliefWidth: number;
}

function convertToSegments(contour: Point2D[]): RollProfileSegment[] {
  const segments: RollProfileSegment[] = [];

  for (let i = 0; i < contour.length - 1; i++) {
    const p1 = contour[i];
    const p2 = contour[i + 1];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    segments.push({
      type: i < contour.length / 2 ? 'web' : 'flange',
      startX: p1.x,
      startY: p1.y,
      endX: p2.x,
      endY: p2.y,
      radius: 0,
      angle,
    });
  }

  return segments;
}

function calculateLength(points: Point2D[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

function calculateBounds(points: Point2D[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  return {
    minX: Math.min(...points.map(p => p.x)),
    minY: Math.min(...points.map(p => p.y)),
    maxX: Math.max(...points.map(p => p.x)),
    maxY: Math.max(...points.map(p => p.y)),
  };
}

function calculateWeight(diameter: number, faceWidth: number): number {
  const radius = diameter / 2000;
  const length = faceWidth / 1000;
  const volume = Math.PI * radius * radius * length;
  return volume * 7850;
}

function calculateGapAdjustment(roll: Roll, thickness: number): number {
  const idealGap = thickness + 0.5;
  const currentGap = Math.abs(roll.centerOffset || 0) * 2 - roll.diameter;
  return idealGap - currentGap;
}

// ============================================
// VALIDATION
// ============================================

export function validateLowerRoll(roll: Roll, thickness: number): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (roll.diameter < thickness * 5) {
    errors.push('Roll diameter too small');
  }

  if (roll.faceWidth < 20) {
    errors.push('Face width too narrow');
  }

  if (roll.boreDiameter > roll.diameter * 0.6) {
    errors.push('Bore diameter too large');
  }

  if (roll.centerOffset === undefined || roll.centerOffset === 0) {
    errors.push('Center offset not set');
  }

  if (roll.centerOffset! > 0) {
    errors.push('Lower roll should have negative offset');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiLowerRoll = {
  config: CONFIG,
  designLowerRoll,
  validateLowerRoll,
};

export default SemiLowerRoll;
