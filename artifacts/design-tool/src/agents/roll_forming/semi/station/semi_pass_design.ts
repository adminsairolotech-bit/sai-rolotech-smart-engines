/**
 * SEMI_PASS_DESIGN - Roll Forming Semi Agent
 * ===========================================
 * Pass design agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  PassDesignResult,
  Pass,
  FlowerStation,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_PASS_DESIGN',
  version: '1.0.0',
  timeout: 18000,
  retries: 2,
};

export interface PassDesignInput {
  flowerStations: FlowerStation[];
  initialThickness: number;
  materialType: string;
  yieldStrength: number;
  strategy?: 'conservative' | 'standard' | 'aggressive';
}

export interface PassDesignOutput {
  result: PassDesignResult;
  strainDistribution: number[];
  reductionSequence: number[];
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function designPasses(
  input: PassDesignInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<PassDesignOutput>> {
  try {
    const strategy = input.strategy || 'standard';
    const maxReduction = getMaxReduction(strategy, input.materialType);
    const passes: Pass[] = [];

    let currentThickness = input.initialThickness;
    const totalAngle = input.flowerStations[input.flowerStations.length - 1]?.targetAngle || 90;
    const anglePerStation = totalAngle / input.flowerStations.length;

    for (let i = 0; i < input.flowerStations.length; i++) {
      const station = input.flowerStations[i];
      const progress = station.formLevel;

      const reduction = calculatePassReduction(
        progress,
        currentThickness,
        maxReduction,
        input.materialType,
        strategy
      );

      const newThickness = currentThickness * (1 - reduction / 100);
      const strain = calculateStrain(currentThickness, newThickness);
      const formingForce = calculateFormingForce(
        station.targetAngle,
        currentThickness,
        input.yieldStrength
      );

      passes.push({
        index: i,
        reduction,
        thickness: newThickness,
        strain,
        formingForce,
      });

      currentThickness = newThickness;
    }

    const strainDistribution = passes.map(p => p.strain);
    const reductionSequence = passes.map(p => p.reduction);

    const result: PassDesignResult = {
      passes,
      strainDistribution,
      totalReduction: ((input.initialThickness - currentThickness) / input.initialThickness) * 100,
      finalThickness: currentThickness,
    };

    return {
      success: true,
      data: {
        result,
        strainDistribution,
        reductionSequence,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Pass design failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function getMaxReduction(strategy: string, materialType: string): number {
  const baseReductions: Record<string, number> = {
    conservative: 15,
    standard: 25,
    aggressive: 40,
  };

  const materialFactors: Record<string, number> = {
    MS: 1.0, HSS: 0.7, SS: 0.8, AL: 1.5, TI: 0.5,
  };

  const base = baseReductions[strategy] || 25;
  const factor = materialFactors[materialType] || 1.0;

  return base * factor;
}

function calculatePassReduction(
  progress: number,
  thickness: number,
  maxReduction: number,
  materialType: string,
  strategy: string
): number {
  const earlyReduction = strategy === 'conservative' ? 0.6 : strategy === 'aggressive' ? 0.8 : 0.7;
  const lateReduction = strategy === 'conservative' ? 0.4 : strategy === 'aggressive' ? 0.6 : 0.5;

  let factor: number;
  if (progress < 0.3) {
    factor = earlyReduction;
  } else if (progress < 0.7) {
    factor = 0.7;
  } else {
    factor = lateReduction;
  }

  const thicknessPenalty = Math.max(0.5, 1 - (thickness - 1) * 0.1);

  return Math.min(maxReduction * factor * thicknessPenalty, 45);
}

function calculateStrain(initialThickness: number, finalThickness: number): number {
  return Math.log(finalThickness / initialThickness);
}

function calculateFormingForce(
  angle: number,
  thickness: number,
  yieldStrength: number
): number {
  const width = 100;
  const lengthFactor = angle / 90;
  const force = yieldStrength * thickness * width * lengthFactor * 0.001;

  return Math.round(force * 10) / 10;
}

// ============================================
// STRAIN CONTROL
// ============================================

export function checkStrainControl(
  passes: Pass[],
  maxStrain: number = 0.25
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  for (const pass of passes) {
    if (pass.strain > maxStrain) {
      warnings.push(`Station ${pass.index}: High strain ${(pass.strain * 100).toFixed(1)}%`);
    }
  }

  const cumulativeStrain = passes.reduce((sum, p) => sum + p.strain, 0);
  if (cumulativeStrain > 1.0) {
    warnings.push(`Total strain ${(cumulativeStrain * 100).toFixed(1)}% is very high`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

// ============================================
// VALIDATION
// ============================================

export function validatePassDesign(result: PassDesignResult): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (result.passes.length === 0) {
    errors.push('No passes designed');
  }

  if (result.totalReduction > 80) {
    warnings.push(`High total reduction: ${result.totalReduction.toFixed(1)}%`);
  }

  for (const pass of result.passes) {
    if (pass.reduction > 50) {
      warnings.push(`Station ${pass.index}: High single-pass reduction ${pass.reduction.toFixed(1)}%`);
    }

    if (pass.thickness < 0.3) {
      warnings.push(`Station ${pass.index}: Very thin material ${pass.thickness.toFixed(2)}mm`);
    }
  }

  const strainCheck = checkStrainControl(result.passes);
  warnings.push(...strainCheck.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiPassDesign = {
  config: CONFIG,
  designPasses,
  checkStrainControl,
  validatePassDesign,
};

export default SemiPassDesign;
