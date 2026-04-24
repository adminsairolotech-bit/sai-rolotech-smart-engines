/**
 * SEMI_STATION_DECOMP - Roll Forming Semi Agent
 * ===========================================
 * Station decomposition agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  StationDecomposition,
  Station,
  StationLayout,
  MaterialState,
  FlowerStation,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_STATION_DECOMP',
  version: '1.0.0',
  timeout: 20000,
  retries: 2,
};

export interface StationDecompInput {
  flowerStations: FlowerStation[];
  totalAngle: number;
  materialThickness: number;
  materialType: string;
  stripWidth: number;
  spacing?: number;
  layout?: 'linear' | 'zigzag' | 'cluster';
}

export interface StationDecompOutput {
  decomposition: StationDecomposition;
  costEstimate: CostEstimate;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function decomposeStations(
  input: StationDecompInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<StationDecompOutput>> {
  try {
    const spacing = input.spacing || 200;
    const layout = input.layout || 'linear';

    const stations: Station[] = [];
    let position = 0;

    for (const flowerStation of input.flowerStations) {
      const materialState = calculateMaterialState(
        flowerStation,
        input.materialThickness,
        input.materialType
      );

      const station: Station = {
        index: flowerStation.index,
        position,
        rollGap: calculateRollGap(materialState, input.materialThickness),
        formingAngle: flowerStation.targetAngle,
        materialState,
        tooling: `roll_set_${flowerStation.index}`,
      };

      stations.push(station);
      position += spacing;
    }

    const stationLayout: StationLayout = {
      type: layout,
      orientation: 'horizontal',
      entryAngle: 0,
      exitAngle: input.totalAngle,
    };

    const decomposition: StationDecomposition = {
      totalStations: stations.length,
      stations,
      spacing,
      layout: stationLayout,
      estimatedCost: estimateCost(stations, input.materialType),
    };

    const costEstimate = calculateCostBreakdown(decomposition, input.materialType);

    return {
      success: true,
      data: {
        decomposition,
        costEstimate,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Station decomposition failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function calculateMaterialState(
  flowerStation: FlowerStation,
  thickness: number,
  materialType: string
): MaterialState {
  const strain = flowerStation.formLevel * calculateMaxStrain(thickness, materialType);
  const stress = strain * getElasticModulus(materialType);
  const temperature = 20 + strain * 100;
  const hardening: 'none' | 'partial' | 'full' = flowerStation.formLevel < 0.3
    ? 'none'
    : flowerStation.formLevel < 0.7
    ? 'partial'
    : 'full';

  return {
    thickness,
    strain,
    stress,
    temperature,
    hardening,
  };
}

function calculateMaxStrain(thickness: number, materialType: string): number {
  const baseStrain = 0.15;
  const thicknessFactor = 2 / (thickness + 1);

  const typeFactors: Record<string, number> = {
    MS: 1.0, HSS: 0.8, SS: 0.9, AL: 1.5, TI: 0.6,
  };

  const factor = typeFactors[materialType] || 1.0;
  return baseStrain * thicknessFactor * factor;
}

function getElasticModulus(materialType: string): number {
  const moduli: Record<string, number> = {
    MS: 210, HSS: 210, SS: 193, AL: 69, TI: 105, CU: 117, BR: 100,
  };
  return (moduli[materialType] || 210) * 1000;
}

function calculateRollGap(materialState: MaterialState, thickness: number): number {
  const springback = materialState.strain * 0.1;
  return materialState.thickness * (1 - springback);
}

function estimateCost(stations: Station[], materialType: string): number {
  const stationCost = stations.length * 15000;
  const toolingCost = stations.length * 5000;
  const materialFactor = getMaterialCostFactor(materialType);

  return (stationCost + toolingCost) * materialFactor;
}

function getMaterialCostFactor(type: string): number {
  const factors: Record<string, number> = {
    MS: 1.0, HSS: 1.5, SS: 2.5, AL: 1.8, TI: 5.0, CU: 3.0, BR: 2.0,
  };
  return factors[type] || 1.0;
}

function calculateCostBreakdown(
  decomposition: StationDecomposition,
  materialType: string
): CostEstimate {
  const stationCost = decomposition.totalStations * 15000;
  const toolingCost = decomposition.totalStations * 5000;
  const setupCost = 5000;
  const engineeringCost = decomposition.totalStations * 2000;

  const materialFactor = getMaterialCostFactor(materialType);

  return {
    stationCost,
    toolingCost,
    setupCost,
    engineeringCost,
    materialFactor,
    totalCost: (stationCost + toolingCost + setupCost + engineeringCost) * materialFactor,
    currency: 'USD',
  };
}

export interface CostEstimate {
  stationCost: number;
  toolingCost: number;
  setupCost: number;
  engineeringCost: number;
  materialFactor: number;
  totalCost: number;
  currency: string;
}

// ============================================
// VALIDATION
// ============================================

export function validateStationDecomposition(decomposition: StationDecomposition): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (decomposition.totalStations < 2) {
    errors.push('Need at least 2 stations');
  }

  if (decomposition.totalStations > 30) {
    warnings.push('Large number of stations may increase cost');
  }

  for (const station of decomposition.stations) {
    if (station.rollGap <= 0) {
      errors.push(`Invalid roll gap at station ${station.index}`);
    }

    if (station.materialState.strain > 0.3) {
      warnings.push(`High strain at station ${station.index}`);
    }
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

export const SemiStationDecomp = {
  config: CONFIG,
  decomposeStations,
  validateStationDecomposition,
};

export default SemiStationDecomp;
