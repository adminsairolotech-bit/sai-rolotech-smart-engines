/**
 * SEMI_ROLL_DRAFT - Roll Forming Semi Agent
 * ===========================================
 * Roll auto-drafting agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  RollDesign,
  Roll,
  Shaft,
  RollProfile,
  RollProfileSegment,
  DXFEntity,
  Point2D,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_ROLL_DRAFT',
  version: '1.0.0',
  timeout: 25000,
  retries: 2,
};

export interface RollDraftInput {
  stationIndex: number;
  profile: DXFEntity[];
  thickness: number;
  rollDiameter?: number;
  faceWidth?: number;
  shaftDiameter?: number;
  material?: string;
}

export interface RollDraftOutput {
  rollDesign: RollDesign;
  upperRoll: Roll;
  lowerRoll: Roll;
  shaft: Shaft;
  warnings: string[];
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function draftRoll(
  input: RollDraftInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<RollDraftOutput>> {
  try {
    const profile = extractProfileContour(input.profile, input.thickness);

    const upperProfile = generateUpperProfile(profile, input.thickness);
    const lowerProfile = generateLowerProfile(profile, input.thickness);

    const rollDiameter = input.rollDiameter || calculateOptimalRollDiameter(input.profile, input.thickness);
    const faceWidth = input.faceWidth || calculateFaceWidth(profile);
    const shaftDiameter = input.shaftDiameter || rollDiameter * 0.3;

    const upperRoll: Roll = {
      id: `upper_roll_${input.stationIndex}`,
      profile: upperProfile,
      diameter: rollDiameter,
      faceWidth,
      material: input.material || '4140 Steel',
      boreDiameter: shaftDiameter + 5,
      weight: calculateRollWeight(rollDiameter, faceWidth, 'upper'),
      centerOffset: calculateUpperOffset(profile),
    };

    const lowerRoll: Roll = {
      id: `lower_roll_${input.stationIndex}`,
      profile: lowerProfile,
      diameter: rollDiameter,
      faceWidth,
      material: input.material || '4140 Steel',
      boreDiameter: shaftDiameter + 5,
      weight: calculateRollWeight(rollDiameter, faceWidth, 'lower'),
      centerOffset: calculateLowerOffset(profile),
    };

    const shaft: Shaft = {
      diameter: shaftDiameter,
      length: faceWidth + 40,
      keywayWidth: shaftDiameter * 0.2,
      keywayDepth: shaftDiameter * 0.05,
      bearingSeats: [
        { position: 10, diameter: shaftDiameter + 10, width: 20 },
        { position: faceWidth + 30, diameter: shaftDiameter + 10, width: 20 },
      ],
      material: '1045 Steel',
      maxTorque: calculateMaxTorque(shaftDiameter),
      maxDeflection: shaftDiameter * 0.001,
    };

    const rollDesign: RollDesign = {
      id: `roll_design_${input.stationIndex}`,
      stationIndex: input.stationIndex,
      upperRoll,
      lowerRoll,
      shaft,
      status: 'draft',
    };

    const warnings = validateRollDraft(rollDesign, input.thickness);

    return {
      success: true,
      data: {
        rollDesign,
        upperRoll,
        lowerRoll,
        shaft,
        warnings,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Roll drafting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function extractProfileContour(profile: DXFEntity[], thickness: number): Point2D[] {
  const points: Point2D[] = [];

  for (const entity of profile) {
    if (entity.type === 'POLYLINE') {
      for (const point of entity.points) {
        points.push({ ...point });
      }
    } else if (entity.type === 'LINE' && entity.points.length === 2) {
      points.push({ ...entity.points[0] });
    }
  }

  return points.length > 0 ? points : [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }];
}

function generateUpperProfile(centerline: Point2D[], thickness: number): RollProfile {
  const offset = thickness / 2 + 2;
  const segments: RollProfileSegment[] = [];

  for (let i = 0; i < centerline.length - 1; i++) {
    const p1 = centerline[i];
    const p2 = centerline[i + 1];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    const nx = -dy / len;
    const ny = dx / len;

    segments.push({
      type: 'flange',
      startX: p1.x + nx * offset,
      startY: p1.y + ny * offset,
      endX: p2.x + nx * offset,
      endY: p2.y + ny * offset,
      radius: 0,
      angle: Math.atan2(dy, dx) * (180 / Math.PI),
    });
  }

  return {
    segments,
    totalLength: calculateProfileLength(centerline),
  };
}

function generateLowerProfile(centerline: Point2D[], thickness: number): RollProfile {
  const offset = -(thickness / 2 + 2);
  const segments: RollProfileSegment[] = [];

  for (let i = 0; i < centerline.length - 1; i++) {
    const p1 = centerline[i];
    const p2 = centerline[i + 1];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    const nx = -dy / len;
    const ny = dx / len;

    segments.push({
      type: 'web',
      startX: p1.x + nx * offset,
      startY: p1.y + ny * offset,
      endX: p2.x + nx * offset,
      endY: p2.y + ny * offset,
      radius: 0,
      angle: Math.atan2(dy, dx) * (180 / Math.PI),
    });
  }

  return {
    segments,
    totalLength: calculateProfileLength(centerline),
  };
}

function calculateProfileLength(points: Point2D[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

function calculateOptimalRollDiameter(profile: DXFEntity[], thickness: number): number {
  const baseSize = 100;
  const thicknessFactor = 1 + thickness * 0.1;

  let maxDimension = 100;
  for (const entity of profile) {
    for (const point of entity.points) {
      maxDimension = Math.max(maxDimension, Math.abs(point.x), Math.abs(point.y));
    }
  }

  const profileFactor = maxDimension / 50;
  const rollDiameter = baseSize * Math.max(thicknessFactor, profileFactor);

  return Math.round(rollDiameter / 5) * 5;
}

function calculateFaceWidth(profile: Point2D[]): number {
  return calculateProfileLength(profile) + 20;
}

function calculateUpperOffset(profile: Point2D[]): number {
  if (profile.length === 0) return 10;
  const maxY = Math.max(...profile.map(p => p.y));
  return maxY * 0.5 + 10;
}

function calculateLowerOffset(profile: Point2D[]): number {
  if (profile.length === 0) return -10;
  const minY = Math.min(...profile.map(p => p.y));
  return minY * 0.5 - 10;
}

function calculateRollWeight(diameter: number, faceWidth: number, position: 'upper' | 'lower'): number {
  const radius = diameter / 2;
  const volume = Math.PI * radius * radius * faceWidth;
  const density = 7850;
  const factor = position === 'upper' ? 0.95 : 1.0;

  return (volume / 1e6) * density * factor;
}

function calculateMaxTorque(shaftDiameter: number): number {
  const tauAllowable = 350;
  const d = shaftDiameter / 1000;
  return (tauAllowable * Math.PI * Math.pow(d, 3)) / 16;
}

function validateRollDraft(rollDesign: RollDesign, thickness: number): string[] {
  const warnings: string[] = [];

  if (rollDesign.upperRoll.diameter < thickness * 10) {
    warnings.push('Roll diameter may be too small for thickness');
  }

  if (rollDesign.lowerRoll.diameter < thickness * 10) {
    warnings.push('Lower roll diameter may be too small');
  }

  const rollGap = rollDesign.upperRoll.centerOffset! - rollDesign.lowerRoll.centerOffset!;
  if (rollGap < thickness * 0.8) {
    warnings.push('Roll gap may cause material compression');
  }

  if (rollDesign.shaft.diameter < rollDesign.upperRoll.boreDiameter * 0.5) {
    warnings.push('Shaft diameter may be undersized');
  }

  if (rollDesign.upperRoll.weight > 500 || rollDesign.lowerRoll.weight > 500) {
    warnings.push('Roll weight exceeds 500kg - check handling requirements');
  }

  return warnings;
}

// ============================================
// CLONE & MODIFY
// ============================================

export function cloneRollDesign(
  source: RollDesign,
  newStationIndex: number
): RollDesign {
  return {
    ...source,
    id: `roll_design_${newStationIndex}`,
    stationIndex: newStationIndex,
    status: 'draft',
    upperRoll: {
      ...source.upperRoll,
      id: `upper_roll_${newStationIndex}`,
    },
    lowerRoll: {
      ...source.lowerRoll,
      id: `lower_roll_${newStationIndex}`,
    },
  };
}

export function modifyRollProfile(
  roll: Roll,
  modifications: Partial<RollProfile>
): Roll {
  return {
    ...roll,
    profile: {
      ...roll.profile,
      ...modifications,
    },
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiRollDraft = {
  config: CONFIG,
  draftRoll,
  cloneRollDesign,
  modifyRollProfile,
};

export default SemiRollDraft;
