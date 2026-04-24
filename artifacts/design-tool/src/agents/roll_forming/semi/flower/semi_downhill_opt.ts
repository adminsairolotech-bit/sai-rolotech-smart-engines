/**
 * SEMI_DOWNHILL_OPT - Roll Forming Semi Agent
 * ===========================================
 * Down-hill optimization agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  FlowerStation,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_DOWNHILL_OPT',
  version: '1.0.0',
  timeout: 20000,
  retries: 2,
};

export interface DownhillOptInput {
  stations: FlowerStation[];
  stripWidth: number;
  materialType: string;
  yieldStrength?: number;
  optimizeDirection?: 'auto' | 'top' | 'bottom';
}

export interface DownhillOptOutput {
  recommendedDirection: 'top' | 'bottom';
  downhillAngle: number;
  weightBalance: number;
  energyOptimization: number;
  adjustments: DownhillAdjustment[];
}

export interface DownhillAdjustment {
  stationIndex: number;
  angleChange: number;
  radiusChange: number;
  reason: string;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function optimizeDownhill(
  input: DownhillOptInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<DownhillOptOutput>> {
  try {
    const topWeight = calculateTopWeight(input.stations, input.stripWidth);
    const bottomWeight = calculateBottomWeight(input.stations, input.stripWidth);

    const topDownhill = calculateDownhillAngle(input.stations, 'top');
    const bottomDownhill = calculateDownhillAngle(input.stations, 'bottom');

    const topEnergy = calculateFormingEnergy(input.stations, 'top', input.yieldStrength);
    const bottomEnergy = calculateFormingEnergy(input.stations, 'bottom', input.yieldStrength);

    let recommendedDirection: 'top' | 'bottom';
    let weightBalance: number;
    let energyOptimization: number;

    if (input.optimizeDirection === 'auto') {
      const topScore = (1 - Math.abs(topWeight - bottomWeight) / Math.max(topWeight, bottomWeight)) * 0.5 +
                      (1 - topEnergy / Math.max(topEnergy, bottomEnergy)) * 0.5;
      const bottomScore = (1 - Math.abs(bottomWeight - topWeight) / Math.max(bottomWeight, topWeight)) * 0.5 +
                          (1 - bottomEnergy / Math.max(bottomEnergy, topEnergy)) * 0.5;

      recommendedDirection = topScore >= bottomScore ? 'top' : 'bottom';
      weightBalance = recommendedDirection === 'top' ? topWeight / bottomWeight : bottomWeight / topWeight;
      energyOptimization = recommendedDirection === 'top'
        ? (1 - topEnergy / bottomEnergy) * 100
        : (1 - bottomEnergy / topEnergy) * 100;
    } else {
      recommendedDirection = input.optimizeDirection || 'top';
      weightBalance = recommendedDirection === 'top' ? topWeight / bottomWeight : bottomWeight / topWeight;
      energyOptimization = recommendedDirection === 'top'
        ? (1 - topEnergy / bottomEnergy) * 100
        : (1 - bottomEnergy / topEnergy) * 100;
    }

    const downhillAngle = recommendedDirection === 'top' ? topDownhill : bottomDownhill;

    const adjustments = generateAdjustments(
      input.stations,
      recommendedDirection,
      weightBalance
    );

    return {
      success: true,
      data: {
        recommendedDirection,
        downhillAngle,
        weightBalance,
        energyOptimization,
        adjustments,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Downhill optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function calculateTopWeight(stations: FlowerStation[], stripWidth: number): number {
  let weight = 0;
  for (const station of stations) {
    weight += station.formLevel * stripWidth * station.radius * 0.01;
  }
  return weight;
}

function calculateBottomWeight(stations: FlowerStation[], stripWidth: number): number {
  let weight = 0;
  for (const station of stations) {
    weight += (1 - station.formLevel) * stripWidth * station.radius * 0.01;
  }
  return weight;
}

function calculateDownhillAngle(stations: FlowerStation[], direction: 'top' | 'bottom'): number {
  if (stations.length < 2) return 0;

  let downhill = 0;

  for (let i = 1; i < stations.length; i++) {
    const prev = stations[i - 1];
    const curr = stations[i];

    const prevRadius = direction === 'top'
      ? prev.radius * (1 + prev.formLevel * 0.1)
      : prev.radius * (1 - prev.formLevel * 0.1);

    const currRadius = direction === 'top'
      ? curr.radius * (1 + curr.formLevel * 0.1)
      : curr.radius * (1 - curr.formLevel * 0.1);

    if (currRadius < prevRadius) {
      downhill += Math.atan((prevRadius - currRadius) / 100) * (180 / Math.PI);
    }
  }

  return downhill;
}

function calculateFormingEnergy(
  stations: FlowerStation[],
  direction: 'top' | 'bottom',
  yieldStrength?: number
): number {
  const ys = yieldStrength || 250;
  let energy = 0;

  for (let i = 1; i < stations.length; i++) {
    const prev = stations[i - 1];
    const curr = stations[i];

    const angleDiff = curr.targetAngle - prev.targetAngle;
    if (angleDiff > 0) {
      const radius = direction === 'top' ? curr.radius : curr.radius * 0.9;
      energy += angleDiff * radius * ys * 0.0001;
    }
  }

  return energy;
}

function generateAdjustments(
  stations: FlowerStation[],
  direction: 'top' | 'bottom',
  weightBalance: number
): DownhillAdjustment[] {
  const adjustments: DownhillAdjustment[] = [];

  if (weightBalance > 0.9 && weightBalance < 1.1) {
    return adjustments;
  }

  const adjustmentFactor = weightBalance > 1.1 ? -0.05 : 0.05;

  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];

    if (direction === 'top' && station.formLevel > 0.6) {
      adjustments.push({
        stationIndex: i,
        angleChange: station.targetAngle * adjustmentFactor,
        radiusChange: station.radius * adjustmentFactor,
        reason: 'Reduce top forming for balance',
      });
    } else if (direction === 'bottom' && station.formLevel < 0.4) {
      adjustments.push({
        stationIndex: i,
        angleChange: station.targetAngle * adjustmentFactor,
        radiusChange: station.radius * adjustmentFactor,
        reason: 'Increase bottom forming for balance',
      });
    }
  }

  return adjustments;
}

// ============================================
// DRIVE CALCULATION
// ============================================

export interface DriveRequirement {
  requiredTorque: number;
  requiredPower: number;
  recommendedSpeed: number;
  driveType: 'single' | 'dual' | 'multi';
}

export function calculateDriveRequirements(
  stations: FlowerStation[],
  downhillAngle: number,
  materialType: string
): DriveRequirement {
  const baseTorque = stations.reduce((sum, s) => sum + s.targetAngle * s.radius * 0.001, 0);
  const materialFactor = getMaterialFactor(materialType);

  const requiredTorque = baseTorque * materialFactor * (1 + downhillAngle * 0.01);
  const recommendedSpeed = 50 / materialFactor;
  const requiredPower = requiredTorque * recommendedSpeed * 0.001;

  let driveType: 'single' | 'dual' | 'multi' = 'single';
  if (requiredPower > 50) driveType = 'dual';
  if (requiredPower > 100) driveType = 'multi';

  return {
    requiredTorque,
    requiredPower,
    recommendedSpeed,
    driveType,
  };
}

function getMaterialFactor(type: string): number {
  const factors: Record<string, number> = {
    MS: 1.0,
    HSS: 1.5,
    SS: 1.3,
    AL: 0.7,
    TI: 1.8,
    CU: 0.8,
    BR: 0.9,
  };
  return factors[type] || 1.0;
}

// ============================================
// VALIDATION
// ============================================

export function validateDownhillOptimization(result: DownhillOptOutput): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (result.weightBalance < 0.7 || result.weightBalance > 1.3) {
    warnings.push(`Poor weight balance: ${(result.weightBalance * 100).toFixed(0)}%`);
  }

  if (result.downhillAngle > 15) {
    warnings.push(`High downhill angle: ${result.downhillAngle.toFixed(1)}°`);
  }

  if (result.energyOptimization < -10) {
    warnings.push('Negative energy optimization indicates inefficiency');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiDownhillOpt = {
  config: CONFIG,
  optimizeDownhill,
  calculateDriveRequirements,
  validateDownhillOptimization,
};

export default SemiDownhillOpt;
