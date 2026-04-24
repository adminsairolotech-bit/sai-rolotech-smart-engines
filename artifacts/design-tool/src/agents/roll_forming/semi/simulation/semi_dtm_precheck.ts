/**
 * SEMI_DTM_PRECHECK - Roll Forming Semi Agent
 * ===========================================
 * DTM pre-check simulation agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  DTMPrecheckResult,
  DefectRiskLevel,
  Station,
  Material,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_DTM_PRECHECK',
  version: '1.0.0',
  timeout: 15000,
  retries: 2,
};

export interface DTMPrecheckInput {
  stations: Station[];
  material: Material;
  rollDiameter: number;
  speed: number;
}

export interface DTMPrecheckOutput {
  result: DTMPrecheckResult;
  metrics: DTMPrecheckMetrics;
  recommendations: string[];
}

export interface DTMPrecheckMetrics {
  deformationIndex: number;
  elongationRatio: number;
  rollDiameterRatio: number;
  formingSpeed: number;
  defectRisk: DefectRiskLevel;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function runDTMPrecheck(
  input: DTMPrecheckInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<DTMPrecheckOutput>> {
  try {
    const deformationIndex = calculateDeformationIndex(input.stations);
    const elongationRatio = calculateElongationRatio(input.stations, input.material);
    const rollDiameterRatio = calculateRollDiameterRatio(input.rollDiameter, input.material.thickness.recommended);
    const formingSpeed = calculateFormingSpeed(input.speed, input.material);

    const defectRisk = determineDefectRisk(
      deformationIndex,
      elongationRatio,
      rollDiameterRatio,
      input.material
    );

    const recommendations = generateRecommendations(
      deformationIndex,
      elongationRatio,
      rollDiameterRatio,
      formingSpeed,
      defectRisk
    );

    const result: DTMPrecheckResult = {
      deformationIndex,
      elongationRatio,
      rollDiameterRatio,
      defectRisk,
      recommendations,
    };

    const metrics: DTMPrecheckMetrics = {
      deformationIndex,
      elongationRatio,
      rollDiameterRatio,
      formingSpeed,
      defectRisk,
    };

    return {
      success: true,
      data: {
        result,
        metrics,
        recommendations,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `DTM precheck failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function calculateDeformationIndex(stations: Station[]): number {
  if (stations.length === 0) return 0;

  let totalStrain = 0;
  let totalAngle = 0;

  for (const station of stations) {
    totalStrain += station.materialState.strain;
    totalAngle += station.formingAngle;
  }

  const avgStrain = totalStrain / stations.length;
  const strainRate = totalAngle / stations.length;

  const deformationIndex = (avgStrain * 100 + strainRate) / 2;

  return Math.round(deformationIndex * 100) / 100;
}

function calculateElongationRatio(stations: Station[], material: Material): number {
  if (stations.length < 2) return 1;

  const initialThickness = stations[0].materialState.thickness;
  const finalThickness = stations[stations.length - 1].materialState.thickness;

  const thicknessRatio = finalThickness / initialThickness;
  const lengthChange = 1 + material.springbackFactor * (1 - thicknessRatio);

  return Math.round(lengthChange * 1000) / 1000;
}

function calculateRollDiameterRatio(rollDiameter: number, thickness: number): number {
  return Math.round((rollDiameter / thickness) * 10) / 10;
}

function calculateFormingSpeed(speed: number, material: Material): number {
  const ratio = speed / material.maxFormingSpeed;

  return {
    value: speed,
    ratio,
    withinLimits: ratio <= 1,
  }.value;
}

function determineDefectRisk(
  deformationIndex: number,
  elongationRatio: number,
  rollDiameterRatio: number,
  material: Material
): DefectRiskLevel {
  let riskScore = 0;

  if (deformationIndex > 15) riskScore += 3;
  else if (deformationIndex > 10) riskScore += 2;
  else if (deformationIndex > 5) riskScore += 1;

  if (elongationRatio > 1.1) riskScore += 2;
  else if (elongationRatio > 1.05) riskScore += 1;

  if (rollDiameterRatio < 10) riskScore += 2;
  else if (rollDiameterRatio < 15) riskScore += 1;

  if (material.type === 'HSS' || material.type === 'TI') riskScore += 1;

  if (riskScore >= 5) return 'critical';
  if (riskScore >= 3) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
}

function generateRecommendations(
  deformationIndex: number,
  elongationRatio: number,
  rollDiameterRatio: number,
  formingSpeed: number,
  defectRisk: DefectRiskLevel
): string[] {
  const recommendations: string[] = [];

  if (deformationIndex > 10) {
    recommendations.push('Consider increasing number of stations to reduce deformation per station');
  }

  if (elongationRatio > 1.1) {
    recommendations.push('High elongation detected - verify material strain limits');
  }

  if (rollDiameterRatio < 15) {
    recommendations.push('Roll diameter may be too small - consider larger rolls for better bending');
  }

  if (formingSpeed > 100) {
    recommendations.push('High forming speed - ensure proper cooling and material support');
  }

  if (defectRisk === 'critical') {
    recommendations.push('CRITICAL: Review material selection and process parameters');
  } else if (defectRisk === 'high') {
    recommendations.push('HIGH RISK: Consider design modifications before production');
  }

  if (recommendations.length === 0) {
    recommendations.push('Parameters within acceptable range - proceed with production');
  }

  return recommendations;
}

// ============================================
// VALIDATION
// ============================================

export function validateDTMPrecheck(result: DTMPrecheckResult): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (result.deformationIndex < 0 || result.deformationIndex > 50) {
    errors.push('Invalid deformation index');
  }

  if (result.elongationRatio < 0.9 || result.elongationRatio > 1.5) {
    errors.push('Invalid elongation ratio');
  }

  if (result.rollDiameterRatio < 1 || result.rollDiameterRatio > 100) {
    errors.push('Invalid roll diameter ratio');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiDTMPrecheck = {
  config: CONFIG,
  runDTMPrecheck,
  validateDTMPrecheck,
};

export default SemiDTMPrecheck;
