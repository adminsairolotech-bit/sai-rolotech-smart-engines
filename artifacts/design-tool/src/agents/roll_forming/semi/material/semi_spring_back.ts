/**
 * SEMI_SPRING_BACK - Roll Forming Semi Agent
 * ===========================================
 * Springback compensation agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  SpringbackResult,
  MaterialType,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_SPRING_BACK',
  version: '1.0.0',
  timeout: 8000,
  retries: 2,
};

export interface SpringbackInput {
  targetAngle: number;
  materialType: MaterialType;
  thickness: number;
  bendRadius: number;
  yieldStrength?: number;
  elasticModulus?: number;
}

export interface SpringbackOutput {
  results: SpringbackResult[];
  totalCompensation: number;
  averageFactor: number;
}

// ============================================
// SPRINGBACK FACTORS DATABASE
// ============================================

const SPRINGBACK_FACTORS: Record<MaterialType, { min: number; max: number; default: number }> = {
  MS: { min: 1.02, max: 1.03, default: 1.025 },
  HSS: { min: 1.04, max: 1.06, default: 1.05 },
  SS: { min: 1.02, max: 1.04, default: 1.03 },
  AL: { min: 1.01, max: 1.02, default: 1.015 },
  TI: { min: 1.02, max: 1.04, default: 1.025 },
  CU: { min: 1.01, max: 1.015, default: 1.012 },
  BR: { min: 1.01, max: 1.02, default: 1.015 },
};

// ============================================
// CORE FUNCTIONS
// ============================================

export async function calculateSpringback(
  input: SpringbackInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<SpringbackOutput>> {
  try {
    const results: SpringbackResult[] = [];

    const materialFactor = SPRINGBACK_FACTORS[input.materialType];

    const thicknessRatio = input.bendRadius / input.thickness;
    const materialFactor2 = calculateMaterialFactor(
      input.materialType,
      thicknessRatio,
      input.yieldStrength,
      input.elasticModulus
    );

    const radiusFactor = calculateRadiusFactor(input.bendRadius, input.thickness);

    const compensationFactor = materialFactor2 * radiusFactor;

    const springbackAngle = input.targetAngle * (compensationFactor - 1);
    const overbendTarget = input.targetAngle / compensationFactor;

    results.push({
      originalAngle: input.targetAngle,
      springbackAngle,
      overbendTarget,
      compensationFactor,
      material: input.materialType,
      thickness: input.thickness,
    });

    const totalCompensation = results.reduce((sum, r) => sum + r.overbendTarget, 0);
    const averageFactor = results.reduce((sum, r) => sum + r.compensationFactor, 0) / results.length;

    return {
      success: true,
      data: {
        results,
        totalCompensation,
        averageFactor,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Springback calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function calculateMaterialFactor(
  type: MaterialType,
  radiusThicknessRatio: number,
  yieldStrength?: number,
  elasticModulus?: number
): number {
  const baseFactor = SPRINGBACK_FACTORS[type].default;

  let modifier = 1.0;

  if (yieldStrength && elasticModulus) {
    const normalizedYield = yieldStrength / elasticModulus;
    modifier = 1 + (normalizedYield - 0.001) * 0.5;
  }

  if (radiusThicknessRatio < 1.5) {
    modifier *= 1.1;
  } else if (radiusThicknessRatio > 5.0) {
    modifier *= 0.95;
  }

  return baseFactor * modifier;
}

function calculateRadiusFactor(radius: number, thickness: number): number {
  const ratio = radius / thickness;

  if (ratio < 0.5) return 1.15;
  if (ratio < 1.0) return 1.10;
  if (ratio < 2.0) return 1.05;
  if (ratio < 4.0) return 1.02;
  if (ratio < 8.0) return 1.01;

  return 1.00;
}

// ============================================
// BATCH SPRINGBACK CALCULATION
// ============================================

export async function calculateSpringbackBatch(
  inputs: SpringbackInput[],
  context: SemiAgentContext
): Promise<SemiAgentResult<SpringbackOutput>> {
  try {
    const allResults: SpringbackResult[] = [];

    for (const input of inputs) {
      const result = await calculateSpringback(input, context);
      if (result.success && result.data) {
        allResults.push(...result.data.results);
      }
    }

    const totalCompensation = allResults.reduce((sum, r) => sum + r.overbendTarget, 0);
    const averageFactor = allResults.reduce((sum, r) => sum + r.compensationFactor, 0) / allResults.length;

    return {
      success: true,
      data: {
        results: allResults,
        totalCompensation,
        averageFactor,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Batch springback calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================
// SPRINGBACK COMPENSATION TABLE
// ============================================

export function getSpringbackTable(
  materialType: MaterialType,
  thickness: number
): { radiusRatio: number; factor: number }[] {
  const ratios = [0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 8.0, 10.0];

  return ratios.map(ratio => ({
    radiusRatio: ratio,
    factor: calculateMaterialFactor(materialType, ratio) * calculateRadiusFactor(ratio * thickness, thickness),
  }));
}

// ============================================
// VALIDATION
// ============================================

export function validateSpringback(result: SpringbackOutput): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (result.results.length === 0) {
    warnings.push('No springback results generated');
  }

  for (const r of result.results) {
    if (r.compensationFactor < 1.0 || r.compensationFactor > 1.15) {
      warnings.push(`Unusual compensation factor ${r.compensationFactor.toFixed(3)}`);
    }

    if (r.springbackAngle < 0 || r.springbackAngle > 30) {
      warnings.push(`Unusual springback angle ${r.springbackAngle.toFixed(2)}°`);
    }
  }

  if (result.averageFactor < 1.0 || result.averageFactor > 1.10) {
    warnings.push(`Average factor ${result.averageFactor.toFixed(3)} outside typical range`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiSpringBack = {
  config: CONFIG,
  calculateSpringback,
  calculateSpringbackBatch,
  getSpringbackTable,
  validateSpringback,
  SPRINGBACK_FACTORS,
};

export default SemiSpringBack;
