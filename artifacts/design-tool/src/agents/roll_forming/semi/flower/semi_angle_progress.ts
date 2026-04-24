/**
 * SEMI_ANGLE_PROGRESS - Roll Forming Semi Agent
 * ===========================================
 * Angle progression control agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  AngleProgressionResult,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_ANGLE_PROGRESS',
  version: '1.0.0',
  timeout: 10000,
  retries: 2,
};

export interface AngleProgressInput {
  totalAngle: number;
  stationCount: number;
  strategy?: 'equal' | 'front' | 'back' | 'adaptive';
  maxIncrement?: number;
  balanceTolerance?: number;
}

export interface AngleProgressOutput {
  angles: number[];
  increments: number[];
  balanced: boolean;
  maxIncrement: number;
  minIncrement: number;
  qualityScore: number;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function generateAngleProgression(
  input: AngleProgressInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<AngleProgressOutput>> {
  try {
    const strategy = input.strategy || 'equal';
    const maxIncrement = input.maxIncrement || 30;
    const tolerance = input.balanceTolerance || 0.15;

    let increments: number[];

    switch (strategy) {
      case 'equal':
        increments = generateEqualIncrements(input.totalAngle, input.stationCount);
        break;
      case 'front':
        increments = generateFrontLoadedIncrements(input.totalAngle, input.stationCount);
        break;
      case 'back':
        increments = generateBackLoadedIncrements(input.totalAngle, input.stationCount);
        break;
      case 'adaptive':
        increments = generateAdaptiveIncrements(input.totalAngle, input.stationCount, maxIncrement);
        break;
      default:
        increments = generateEqualIncrements(input.totalAngle, input.stationCount);
    }

    const angles: number[] = [];
    let cumulative = 0;
    for (const inc of increments) {
      cumulative += inc;
      angles.push(cumulative);
    }

    const validIncrements = increments.filter(i => i > 0);
    const avgIncrement = validIncrements.reduce((a, b) => a + b, 0) / validIncrements.length;
    const maxInc = Math.max(...validIncrements);
    const minInc = Math.min(...validIncrements);

    const balanceRatio = avgIncrement > 0 ? (maxInc - minInc) / avgIncrement : 0;
    const balanced = balanceRatio <= tolerance;

    const qualityScore = calculateQualityScore(increments, avgIncrement, maxIncrement);

    return {
      success: true,
      data: {
        angles,
        increments,
        balanced,
        maxIncrement: maxInc,
        minIncrement: minInc,
        qualityScore,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Angle progression failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function generateEqualIncrements(totalAngle: number, stationCount: number): number[] {
  const increment = totalAngle / stationCount;
  return Array(stationCount).fill(increment);
}

function generateFrontLoadedIncrements(totalAngle: number, stationCount: number): number[] {
  const increments: number[] = [];
  let remaining = totalAngle;

  for (let i = 0; i < stationCount; i++) {
    const progress = i / (stationCount - 1 || 1);
    const factor = 1.5 - progress * 0.5;
    const inc = Math.min((remaining / (stationCount - i)) * factor, remaining * 0.4);
    increments.push(inc);
    remaining -= inc;
  }

  increments[stationCount - 1] += remaining;
  return increments;
}

function generateBackLoadedIncrements(totalAngle: number, stationCount: number): number[] {
  const increments: number[] = [];
  let remaining = totalAngle;

  for (let i = 0; i < stationCount; i++) {
    const progress = i / (stationCount - 1 || 1);
    const factor = 0.5 + progress * 1.0;
    const inc = Math.min((remaining / (stationCount - i)) * factor, remaining * 0.4);
    increments.push(inc);
    remaining -= inc;
  }

  increments[stationCount - 1] += remaining;
  return increments;
}

function generateAdaptiveIncrements(totalAngle: number, stationCount: number, maxIncrement: number): number[] {
  const increments: number[] = [];
  let remaining = totalAngle;

  const baseCount = Math.ceil(totalAngle / maxIncrement);
  const actualStations = Math.min(Math.max(baseCount, stationCount), stationCount * 2);

  for (let i = 0; i < actualStations && remaining > 0; i++) {
    const progress = i / (actualStations - 1 || 1);
    const factor = 0.7 + progress * 0.3;
    const idealInc = remaining / (actualStations - i);
    const inc = Math.min(idealInc * factor, maxIncrement);
    increments.push(Math.max(inc, 1));
    remaining -= inc;
  }

  while (increments.length < stationCount) {
    increments.unshift(0);
  }

  if (increments.length > stationCount) {
    const excess = increments.length - stationCount;
    for (let i = 0; i < excess; i++) {
      const minIdx = increments.indexOf(Math.min(...increments.filter(x => x > 0)));
      if (minIdx > 0) {
        increments[minIdx - 1] += increments[minIdx] / 2;
        increments[minIdx] /= 2;
      }
    }
    while (increments.length > stationCount) {
      const minIdx = increments.indexOf(Math.min(...increments));
      if (minIdx >= 0 && increments.length > 2) {
        increments.splice(minIdx, 1);
      } else {
        break;
      }
    }
  }

  return increments.slice(0, stationCount);
}

function calculateQualityScore(increments: number[], avgIncrement: number, maxIncrement: number): number {
  const validIncrements = increments.filter(i => i > 0);
  if (validIncrements.length === 0) return 0;

  const variance = validIncrements.reduce((sum, inc) => sum + Math.pow(inc - avgIncrement, 2), 0) / validIncrements.length;
  const stdDev = Math.sqrt(variance);

  const normalizedStdDev = stdDev / avgIncrement;

  const maxViolation = Math.max(...validIncrements.map(inc => Math.max(0, inc - maxIncrement)));
  const violationPenalty = maxViolation / maxIncrement;

  const score = Math.max(0, Math.min(100, 100 - normalizedStdDev * 50 - violationPenalty * 30));

  return Math.round(score * 10) / 10;
}

// ============================================
// OPTIMIZATION
// ============================================

export function optimizeAngleProgression(
  angles: number[],
  targetBalance: number
): AngleProgressionResult {
  const increments: number[] = [];
  for (let i = 0; i < angles.length; i++) {
    increments.push(i === 0 ? angles[i] : angles[i] - angles[i - 1]);
  }

  const validIncrements = increments.filter(i => i > 0);
  const avgIncrement = validIncrements.reduce((a, b) => a + b, 0) / validIncrements.length;
  const maxIncrement = Math.max(...validIncrements);
  const minIncrement = Math.min(...validIncrements);

  const balanceRatio = avgIncrement > 0 ? (maxIncrement - minIncrement) / avgIncrement : Infinity;

  return {
    angles,
    increments,
    balanced: balanceRatio <= 0.15,
    maxIncrement,
    minIncrement,
  };
}

// ============================================
// VALIDATION
// ============================================

export function validateAngleProgression(result: AngleProgressOutput): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (!result.balanced) {
    warnings.push('Increments are not well balanced');
  }

  if (result.maxIncrement > 45) {
    warnings.push(`Large maximum increment: ${result.maxIncrement.toFixed(1)}°`);
  }

  if (result.qualityScore < 70) {
    warnings.push(`Low quality score: ${result.qualityScore.toFixed(1)}%`);
  }

  const zeroIncrements = result.increments.filter(i => i === 0).length;
  if (zeroIncrements > result.increments.length * 0.3) {
    warnings.push(`Too many zero increments: ${zeroIncrements}`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiAngleProgress = {
  config: CONFIG,
  generateAngleProgression,
  optimizeAngleProgression,
  validateAngleProgression,
};

export default SemiAngleProgress;
