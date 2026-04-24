/**
 * SEMI_BORE_CALC - Roll Forming Semi Agent
 * ===========================================
 * Bore calculation agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_BORE_CALC',
  version: '1.0.0',
  timeout: 8000,
  retries: 2,
};

export interface BoreCalcInput {
  rollDiameter: number;
  shaftDiameter: number;
  fitType?: 'H7/h6' | 'H8/h7' | 'H9/h9';
  boreType?: 'straight' | 'tapered' | 'stepped';
}

export interface BoreCalcOutput {
  boreDiameter: number;
  tolerance: Tolerance;
  surfaceFinish: SurfaceFinish;
  keywaySize: KeywaySize;
}

export interface Tolerance {
  ITGrade: number;
  boreTolerance: number;
  shaftTolerance: number;
  fitClearance: number;
}

export interface SurfaceFinish {
  Ra: number;
  Rz: number;
  method: string;
}

export interface KeywaySize {
  width: number;
  depth: number;
  type: 'parallel' | 'tapered';
}

// ============================================
// TOLERANCE TABLES
// ============================================

const TOLERANCE_TABLE: Record<string, { boreTolerance: number; shaftTolerance: number; clearance: number }> = {
  'H7/h6': { boreTolerance: 0.025, shaftTolerance: -0.013, clearance: 0.038 },
  'H8/h7': { boreTolerance: 0.039, shaftTolerance: -0.018, clearance: 0.057 },
  'H9/h9': { boreTolerance: 0.062, shaftTolerance: -0.062, clearance: 0.124 },
};

// ============================================
// CORE FUNCTIONS
// ============================================

export async function calculateBore(
  input: BoreCalcInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<BoreCalcOutput>> {
  try {
    const baseBore = input.shaftDiameter + 5;
    const roundedBore = Math.round(baseBore / 5) * 5;

    const tolerance = calculateTolerance(roundedBore, input.fitType || 'H7/h6');
    const surfaceFinish = calculateSurfaceFinish(input.boreType || 'straight');
    const keywaySize = calculateKeyway(roundedBore);

    return {
      success: true,
      data: {
        boreDiameter: roundedBore,
        tolerance,
        surfaceFinish,
        keywaySize,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Bore calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function calculateTolerance(boreDiameter: number, fitType: string): Tolerance {
  const table = TOLERANCE_TABLE[fitType] || TOLERANCE_TABLE['H7/h6'];

  return {
    ITGrade: parseInt(fitType.split('/')[0].substring(1)),
    boreTolerance: table.boreTolerance,
    shaftTolerance: table.shaftTolerance,
    fitClearance: table.clearance,
  };
}

function calculateSurfaceFinish(boreType: string): SurfaceFinish {
  if (boreType === 'straight') {
    return {
      Ra: 0.8,
      Rz: 3.2,
      method: 'Honing',
    };
  } else if (boreType === 'tapered') {
    return {
      Ra: 1.6,
      Rz: 6.3,
      method: 'Boring + Reaming',
    };
  } else {
    return {
      Ra: 1.6,
      Rz: 6.3,
      method: 'Stepped boring',
    };
  }
}

function calculateKeyway(boreDiameter: number): KeywaySize {
  const shaftDiameter = boreDiameter - 5;

  const widths: Record<number, number> = {
    10: 3, 12: 4, 17: 5, 22: 6, 30: 8, 38: 10,
  };

  let width = 8;
  for (const [dia, w] of Object.entries(widths)) {
    if (shaftDiameter <= parseInt(dia)) {
      width = w;
      break;
    }
  }

  return {
    width,
    depth: shaftDiameter * 0.05,
    type: 'parallel',
  };
}

// ============================================
// BORE TYPE SELECTION
// ============================================

export function selectBoreType(
  rollDiameter: number,
  torque: number,
  speed: number
): 'straight' | 'tapered' | 'stepped' {
  if (torque > 5000 || speed > 1500) {
    return 'tapered';
  }

  if (rollDiameter > 200) {
    return 'stepped';
  }

  return 'straight';
}

// ============================================
// VALIDATION
// ============================================

export function validateBore(
  boreDiameter: number,
  rollDiameter: number,
  shaftDiameter: number
): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  const ratio = boreDiameter / rollDiameter;
  if (ratio > 0.7) {
    warnings.push(`Bore ratio ${ratio.toFixed(2)} is high - check roll strength`);
  }

  const wallThickness = (rollDiameter - boreDiameter) / 2;
  if (wallThickness < 15) {
    warnings.push(`Thin wall section: ${wallThickness.toFixed(1)}mm`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiBoreCalc = {
  config: CONFIG,
  calculateBore,
  selectBoreType,
  validateBore,
};

export default SemiBoreCalc;
