/**
 * SEMI_FLOWER_DESIGN - Roll Forming Semi Agent
 * ===========================================
 * Flower pattern design agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  FlowerPattern,
  FlowerStation,
  DXFEntity,
  Point2D,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_FLOWER_DESIGN',
  version: '1.0.0',
  timeout: 20000,
  retries: 2,
};

export interface FlowerDesignInput {
  profile: DXFEntity[];
  totalAngle: number;
  materialType: string;
  thickness: number;
  minIncrement?: number;
  maxStations?: number;
  strategy?: 'linear' | 'progressive' | 'optimized';
}

export interface FlowerDesignOutput {
  flowerPattern: FlowerPattern;
  stats: FlowerStats;
}

export interface FlowerStats {
  totalStations: number;
  avgIncrement: number;
  maxIncrement: number;
  minIncrement: number;
  balanced: boolean;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function designFlowerPattern(
  input: FlowerDesignInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<FlowerDesignOutput>> {
  try {
    const profileAngles = extractProfileAngles(input.profile);
    const totalAngle = input.totalAngle || profileAngles.reduce((a, b) => a + b, 0);

    const minIncrement = input.minIncrement || 5;
    const maxStations = input.maxStations || 20;

    const stationCount = calculateStationCount(totalAngle, minIncrement, maxStations);
    const increments = generateIncrements(totalAngle, stationCount, input.strategy || 'progressive');

    const stations: FlowerStation[] = [];

    let accumulated = 0;
    for (let i = 0; i < stationCount; i++) {
      const targetAngle = accumulated + increments[i];
      accumulated = targetAngle;

      stations.push({
        index: i,
        targetAngle,
        accumulatedAngle: accumulated,
        radius: calculateStationRadius(i, stationCount, profileAngles),
        formLevel: (i + 1) / stationCount,
        status: 'planned',
      });
    }

    const flowerPattern: FlowerPattern = {
      id: `flower_${Date.now()}`,
      profileId: `profile_${context.projectId}`,
      totalAngle,
      stations,
      progressionType: input.strategy || 'progressive',
      downhillAngle: calculateDownhillAngle(stations),
      formingCurves: generateFormingCurves(stations),
    };

    const stats = calculateFlowerStats(increments);

    return {
      success: true,
      data: {
        flowerPattern,
        stats,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Flower design failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function extractProfileAngles(profile: DXFEntity[]): number[] {
  const angles: number[] = [];

  for (const entity of profile) {
    if (entity.type === 'LINE' && entity.points.length === 2) {
      const dx = entity.points[1].x - entity.points[0].x;
      const dy = entity.points[1].y - entity.points[0].y;
      const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
      if (angle > 1) angles.push(angle);
    }
  }

  return angles.length > 0 ? angles : [90, 90, 45, 45];
}

function calculateStationCount(totalAngle: number, minIncrement: number, maxStations: number): number {
  const calculated = Math.ceil(totalAngle / minIncrement);
  return Math.min(Math.max(calculated, 3), maxStations);
}

function generateIncrements(totalAngle: number, stationCount: number, strategy: string): number[] {
  const increments: number[] = [];

  if (strategy === 'linear') {
    const avg = totalAngle / stationCount;
    for (let i = 0; i < stationCount; i++) {
      increments.push(avg);
    }
  } else if (strategy === 'progressive') {
    let remaining = totalAngle;
    for (let i = 0; i < stationCount; i++) {
      const progress = i / (stationCount - 1);
      const factor = 0.5 + progress * 0.5;
      const inc = (remaining / (stationCount - i)) * factor;
      increments.push(Math.min(inc, remaining * 0.4));
      remaining -= increments[i];
    }
    increments[stationCount - 1] += remaining;
  } else {
    const angles = [15, 20, 25, 20, 15, 10, 5];
    let remaining = totalAngle;
    let i = 0;

    while (remaining > 0 && i < stationCount) {
      const angle = angles[i % angles.length];
      const inc = Math.min(angle, remaining);
      increments.push(inc);
      remaining -= inc;
      i++;
    }

    while (increments.length < stationCount) {
      increments.push(0);
    }
  }

  return increments;
}

function calculateStationRadius(stationIndex: number, totalStations: number, profileAngles: number[]): number {
  const progress = stationIndex / (totalStations - 1 || 1);
  const baseRadius = 50;

  return baseRadius * (1 + progress * 0.5);
}

function calculateDownhillAngle(stations: FlowerStation[]): number {
  if (stations.length < 2) return 0;

  let totalDownhill = 0;
  for (let i = 1; i < stations.length; i++) {
    const diff = stations[i].targetAngle - stations[i - 1].targetAngle;
    if (diff < 0) totalDownhill += Math.abs(diff);
  }

  return totalDownhill;
}

function generateFormingCurves(stations: FlowerStation[]): FlowerPattern['formingCurves'] {
  return stations.map((station, i) => ({
    stationIndex: i,
    radius: station.radius,
    slope: i > 0 ? (station.radius - stations[i - 1].radius) : 0,
    points: generateCurvePoints(station.radius, 16),
  }));
}

function generateCurvePoints(radius: number, segments: number): Point2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI;
    points.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  }
  return points;
}

function calculateFlowerStats(increments: number[]): FlowerStats {
  const max = Math.max(...increments);
  const min = Math.min(...increments.filter(i => i > 0));
  const avg = increments.reduce((a, b) => a + b, 0) / increments.length;

  const variance = increments.reduce((sum, inc) => sum + Math.pow(inc - avg, 2), 0) / increments.length;
  const balanced = variance < avg * avg * 0.25;

  return {
    totalStations: increments.length,
    avgIncrement: avg,
    maxIncrement: max,
    minIncrement: min || 0,
    balanced,
  };
}

// ============================================
// VALIDATION
// ============================================

export function validateFlowerPattern(pattern: FlowerPattern): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (pattern.stations.length < 2) {
    errors.push('Need at least 2 stations for forming');
  }

  if (pattern.totalAngle <= 0) {
    errors.push('Total angle must be positive');
  }

  const maxIncrement = Math.max(...pattern.stations.map(s =>
    s.index === 0 ? s.targetAngle : s.targetAngle - pattern.stations[s.index - 1].targetAngle
  ));

  if (maxIncrement > 45) {
    warnings.push(`Large angle increment detected: ${maxIncrement.toFixed(1)}°`);
  }

  const jumpIndices = [];
  for (let i = 1; i < pattern.stations.length; i++) {
    const increment = pattern.stations[i].targetAngle - pattern.stations[i - 1].targetAngle;
    if (increment > 30) {
      jumpIndices.push(i);
    }
  }

  if (jumpIndices.length > 0) {
    warnings.push(`Angle jumps detected at stations: ${jumpIndices.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiFlowerDesign = {
  config: CONFIG,
  designFlowerPattern,
  validateFlowerPattern,
};

export default SemiFlowerDesign;
