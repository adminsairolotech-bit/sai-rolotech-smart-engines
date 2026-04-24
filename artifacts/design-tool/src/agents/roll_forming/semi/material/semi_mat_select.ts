/**
 * SEMI_MAT_SELECT - Roll Forming Semi Agent
 * ===========================================
 * Material selection agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  Material,
  MaterialType,
  MaterialWarning,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_MAT_SELECT',
  version: '1.0.0',
  timeout: 5000,
  retries: 1,
};

export interface MaterialSelectInput {
  grade?: string;
  type?: MaterialType;
  thickness: number;
  requiredYieldStrength?: number;
}

export interface MaterialSelectOutput {
  material: Material;
  alternatives: Material[];
  warnings: MaterialWarning[];
}

// ============================================
// MATERIAL DATABASE
// ============================================

const MATERIAL_DATABASE: Material[] = [
  {
    id: 'MS_A36',
    name: 'Mild Steel A36',
    grade: 'A36',
    type: 'MS',
    yieldStrength: 250,
    tensileStrength: 400,
    elasticity: 200,
    density: 7850,
    thickness: { min: 0.5, max: 6.0, recommended: 2.0 },
    maxFormingSpeed: 120,
    springbackFactor: 1.02,
    kFactor: 0.40,
  },
  {
    id: 'MS_DX51',
    name: 'Galvanized Steel DX51',
    grade: 'DX51',
    type: 'MS',
    yieldStrength: 280,
    tensileStrength: 360,
    elasticity: 200,
    density: 7850,
    thickness: { min: 0.4, max: 3.0, recommended: 1.5 },
    maxFormingSpeed: 100,
    springbackFactor: 1.025,
    kFactor: 0.42,
  },
  {
    id: 'MS_S350',
    name: 'Structural Steel S350',
    grade: 'S350',
    type: 'MS',
    yieldStrength: 350,
    tensileStrength: 490,
    elasticity: 210,
    density: 7850,
    thickness: { min: 1.0, max: 10.0, recommended: 3.0 },
    maxFormingSpeed: 80,
    springbackFactor: 1.03,
    kFactor: 0.45,
  },
  {
    id: 'HSS_HSLA',
    name: 'High Strength Low Alloy',
    grade: 'HSLA',
    type: 'HSS',
    yieldStrength: 450,
    tensileStrength: 550,
    elasticity: 210,
    density: 7850,
    thickness: { min: 1.5, max: 8.0, recommended: 2.5 },
    maxFormingSpeed: 60,
    springbackFactor: 1.04,
    kFactor: 0.48,
  },
  {
    id: 'HSS_DP600',
    name: 'Dual Phase DP600',
    grade: 'DP600',
    type: 'HSS',
    yieldStrength: 600,
    tensileStrength: 750,
    elasticity: 210,
    density: 7850,
    thickness: { min: 1.0, max: 4.0, recommended: 2.0 },
    maxFormingSpeed: 50,
    springbackFactor: 1.05,
    kFactor: 0.50,
  },
  {
    id: 'SS_304',
    name: 'Stainless Steel 304',
    grade: '304',
    type: 'SS',
    yieldStrength: 215,
    tensileStrength: 505,
    elasticity: 193,
    density: 8000,
    thickness: { min: 0.5, max: 5.0, recommended: 1.5 },
    maxFormingSpeed: 60,
    springbackFactor: 1.03,
    kFactor: 0.44,
    warnings: [
      { type: 'coolant', message: 'Coolant required for forming', severity: 'critical' },
    ],
  },
  {
    id: 'SS_316',
    name: 'Stainless Steel 316',
    grade: '316',
    type: 'SS',
    yieldStrength: 200,
    tensileStrength: 490,
    elasticity: 193,
    density: 8000,
    thickness: { min: 0.5, max: 4.0, recommended: 1.5 },
    maxFormingSpeed: 50,
    springbackFactor: 1.035,
    kFactor: 0.45,
    warnings: [
      { type: 'coolant', message: 'Coolant required for forming', severity: 'critical' },
    ],
  },
  {
    id: 'AL_6061',
    name: 'Aluminum 6061-T6',
    grade: '6061-T6',
    type: 'AL',
    yieldStrength: 276,
    tensileStrength: 310,
    elasticity: 69,
    density: 2700,
    thickness: { min: 0.5, max: 6.0, recommended: 2.0 },
    maxFormingSpeed: 150,
    springbackFactor: 1.015,
    kFactor: 0.35,
  },
  {
    id: 'AL_3003',
    name: 'Aluminum 3003-H14',
    grade: '3003-H14',
    type: 'AL',
    yieldStrength: 145,
    tensileStrength: 152,
    elasticity: 69,
    density: 2730,
    thickness: { min: 0.3, max: 4.0, recommended: 1.5 },
    maxFormingSpeed: 180,
    springbackFactor: 1.012,
    kFactor: 0.33,
  },
  {
    id: 'TI_Gr2',
    name: 'Titanium Grade 2',
    grade: 'Gr2',
    type: 'TI',
    yieldStrength: 345,
    tensileStrength: 480,
    elasticity: 105,
    density: 4510,
    thickness: { min: 0.5, max: 3.0, recommended: 1.5 },
    maxFormingSpeed: 20,
    springbackFactor: 1.025,
    kFactor: 0.42,
    warnings: [
      { type: 'speed', message: 'Low forming speed required', severity: 'critical' },
      { type: 'coolant', message: 'Coolant required for forming', severity: 'critical' },
    ],
  },
  {
    id: 'CU_C101',
    name: 'Copper C101',
    grade: 'C101',
    type: 'CU',
    yieldStrength: 69,
    tensileStrength: 220,
    elasticity: 117,
    density: 8900,
    thickness: { min: 0.3, max: 3.0, recommended: 1.0 },
    maxFormingSpeed: 100,
    springbackFactor: 1.01,
    kFactor: 0.30,
  },
  {
    id: 'BR_C260',
    name: 'Brass C260',
    grade: 'C260',
    type: 'BR',
    yieldStrength: 110,
    tensileStrength: 300,
    elasticity: 100,
    density: 8500,
    thickness: { min: 0.3, max: 2.5, recommended: 1.0 },
    maxFormingSpeed: 80,
    springbackFactor: 1.015,
    kFactor: 0.32,
  },
];

// ============================================
// CORE FUNCTIONS
// ============================================

export async function selectMaterial(
  input: MaterialSelectInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<MaterialSelectOutput>> {
  try {
    let candidates = [...MATERIAL_DATABASE];

    if (input.type) {
      candidates = candidates.filter(m => m.type === input.type);
    }

    if (input.grade) {
      const exactMatch = candidates.find(m =>
        m.grade.toLowerCase().includes(input.grade!.toLowerCase())
      );
      if (exactMatch) {
        candidates = [exactMatch, ...candidates.filter(m => m.id !== exactMatch.id)];
      }
    }

    candidates = candidates.filter(m =>
      input.thickness >= m.thickness.min && input.thickness <= m.thickness.max
    );

    if (input.requiredYieldStrength) {
      candidates = candidates.filter(m => m.yieldStrength >= input.requiredYieldStrength!);
    }

    if (candidates.length === 0) {
      return {
        success: false,
        error: 'No suitable material found for the given criteria',
      };
    }

    candidates.sort((a, b) => {
      const aDiff = Math.abs(a.thickness.recommended - input.thickness);
      const bDiff = Math.abs(b.thickness.recommended - input.thickness);
      return aDiff - bDiff;
    });

    const primary = candidates[0];
    const alternatives = candidates.slice(1, 4);
    const warnings = generateWarnings(primary, input.thickness);

    return {
      success: true,
      data: {
        material: primary,
        alternatives,
        warnings,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Material selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function generateWarnings(material: Material, thickness: number): MaterialWarning[] {
  const warnings: MaterialWarning[] = [];

  if (material.warnings) {
    warnings.push(...material.warnings);
  }

  if (thickness < material.thickness.min) {
    warnings.push({
      type: 'thickness',
      message: `Thickness ${thickness}mm below minimum ${material.thickness.min}mm`,
      severity: 'critical',
    });
  }

  if (thickness > material.thickness.max) {
    warnings.push({
      type: 'thickness',
      message: `Thickness ${thickness}mm above maximum ${material.thickness.max}mm`,
      severity: 'critical',
    });
  }

  if (thickness > 3 && material.type === 'HSS') {
    warnings.push({
      type: 'cracking',
      message: 'High cracking risk for HSS above 3mm thickness',
      severity: 'warning',
    });
  }

  return warnings;
}

// ============================================
// MATERIAL QUERY
// ============================================

export function getMaterialById(id: string): Material | undefined {
  return MATERIAL_DATABASE.find(m => m.id === id);
}

export function getMaterialsByType(type: MaterialType): Material[] {
  return MATERIAL_DATABASE.filter(m => m.type === type);
}

export function getAllMaterials(): Material[] {
  return [...MATERIAL_DATABASE];
}

// ============================================
// EXPORT
// ============================================

export const SemiMatSelect = {
  config: CONFIG,
  selectMaterial,
  getMaterialById,
  getMaterialsByType,
  getAllMaterials,
};

export default SemiMatSelect;
