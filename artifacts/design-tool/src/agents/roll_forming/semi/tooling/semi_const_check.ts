/**
 * SEMI_CONST_CHECK - Roll Forming Semi Agent
 * ===========================================
 * Constraint checking agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  ConstraintCheckResult,
  ConstraintCheck,
  RollDesign,
  Station,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_CONST_CHECK',
  version: '1.0.0',
  timeout: 15000,
  retries: 2,
};

export interface ConstraintCheckInput {
  rollDesigns: RollDesign[];
  stations?: Station[];
  machineLimits?: MachineLimits;
  materialThickness: number;
}

export interface MachineLimits {
  maxRollDiameter: number;
  minRollDiameter: number;
  maxRollWidth: number;
  maxRollGap: number;
  minRollGap: number;
  maxTorque: number;
  maxSpeed: number;
}

export interface ConstraintCheckOutput {
  result: ConstraintCheckResult;
  failedChecks: ConstraintCheck[];
  passedChecks: ConstraintCheck[];
  recommendations: string[];
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function checkConstraints(
  input: ConstraintCheckInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<ConstraintCheckOutput>> {
  try {
    const machineLimits = input.machineLimits || getDefaultMachineLimits();
    const checks: ConstraintCheck[] = [];

    for (const rollDesign of input.rollDesigns) {
      checks.push(...checkRollConstraints(rollDesign, machineLimits));
      checks.push(...checkGapConstraints(rollDesign, input.materialThickness, machineLimits));
      checks.push(...checkInterferenceConstraints(rollDesign));
    }

    if (input.stations) {
      checks.push(...checkStationConstraints(input.stations, machineLimits));
    }

    const passedChecks = checks.filter(c => c.passed);
    const failedChecks = checks.filter(c => !c.passed);
    const overallScore = (passedChecks.length / checks.length) * 100;

    const result: ConstraintCheckResult = {
      passed: failedChecks.length === 0,
      checks,
      overallScore,
    };

    const recommendations = generateRecommendations(failedChecks);

    return {
      success: true,
      data: {
        result,
        failedChecks,
        passedChecks,
        recommendations,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Constraint checking failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function getDefaultMachineLimits(): MachineLimits {
  return {
    maxRollDiameter: 400,
    minRollDiameter: 80,
    maxRollWidth: 600,
    maxRollGap: 200,
    minRollGap: 0.5,
    maxTorque: 10000,
    maxSpeed: 200,
  };
}

function checkRollConstraints(rollDesign: RollDesign, limits: MachineLimits): ConstraintCheck[] {
  const checks: ConstraintCheck[] = [];

  checks.push({
    name: 'Upper Roll Diameter',
    passed: rollDesign.upperRoll.diameter <= limits.maxRollDiameter &&
            rollDesign.upperRoll.diameter >= limits.minRollDiameter,
    value: rollDesign.upperRoll.diameter,
    threshold: limits.maxRollDiameter,
    message: `Upper roll diameter ${rollDesign.upperRoll.diameter}mm`,
  });

  checks.push({
    name: 'Lower Roll Diameter',
    passed: rollDesign.lowerRoll.diameter <= limits.maxRollDiameter &&
            rollDesign.lowerRoll.diameter >= limits.minRollDiameter,
    value: rollDesign.lowerRoll.diameter,
    threshold: limits.maxRollDiameter,
    message: `Lower roll diameter ${rollDesign.lowerRoll.diameter}mm`,
  });

  checks.push({
    name: 'Roll Face Width',
    passed: rollDesign.upperRoll.faceWidth <= limits.maxRollWidth,
    value: rollDesign.upperRoll.faceWidth,
    threshold: limits.maxRollWidth,
    message: `Roll face width ${rollDesign.upperRoll.faceWidth}mm`,
  });

  checks.push({
    name: 'Shaft Diameter',
    passed: rollDesign.shaft.diameter >= rollDesign.upperRoll.boreDiameter * 0.5,
    value: rollDesign.shaft.diameter,
    threshold: rollDesign.upperRoll.boreDiameter * 0.5,
    message: `Shaft diameter ${rollDesign.shaft.diameter}mm`,
  });

  return checks;
}

function checkGapConstraints(
  rollDesign: RollDesign,
  materialThickness: number,
  limits: MachineLimits
): ConstraintCheck[] {
  const checks: ConstraintCheck[] = [];

  const upperOffset = rollDesign.upperRoll.centerOffset || 0;
  const lowerOffset = rollDesign.lowerRoll.centerOffset || 0;
  const rollGap = upperOffset - lowerOffset - rollDesign.upperRoll.diameter - rollDesign.lowerRoll.diameter;

  checks.push({
    name: 'Roll Gap Range',
    passed: rollGap >= limits.minRollGap && rollGap <= limits.maxRollGap,
    value: rollGap,
    threshold: limits.maxRollGap,
    message: `Roll gap ${rollGap.toFixed(1)}mm`,
  });

  checks.push({
    name: 'Material Clearance',
    passed: rollGap >= materialThickness * 1.1,
    value: rollGap,
    threshold: materialThickness * 1.1,
    message: `Clearance ${(rollGap - materialThickness).toFixed(1)}mm`,
  });

  return checks;
}

function checkInterferenceConstraints(rollDesign: RollDesign): ConstraintCheck[] {
  const checks: ConstraintCheck[] = [];

  const upperRadius = rollDesign.upperRoll.diameter / 2;
  const lowerRadius = rollDesign.lowerRoll.diameter / 2;
  const centerDistance = Math.abs((rollDesign.upperRoll.centerOffset || 0) - (rollDesign.lowerRoll.centerOffset || 0));

  const minDistance = upperRadius + lowerRadius;
  const interference = centerDistance < minDistance ? minDistance - centerDistance : 0;

  checks.push({
    name: 'Roll Interference',
    passed: interference === 0,
    value: interference,
    threshold: 0,
    message: interference > 0 ? `Interference: ${interference.toFixed(1)}mm` : 'No interference',
  });

  const maxRollGap = upperRadius + lowerRadius * 0.9;
  checks.push({
    name: 'Maximum Gap',
    passed: centerDistance <= maxRollGap,
    value: centerDistance,
    threshold: maxRollGap,
    message: `Center distance ${centerDistance.toFixed(1)}mm`,
  });

  return checks;
}

function checkStationConstraints(stations: Station[], limits: MachineLimits): ConstraintCheck[] {
  const checks: ConstraintCheck[] = [];

  if (stations.length > 30) {
    checks.push({
      name: 'Station Count',
      passed: false,
      value: stations.length,
      threshold: 30,
      message: `Too many stations: ${stations.length}`,
    });
  }

  const avgSpacing = calculateAverageSpacing(stations);
  checks.push({
    name: 'Station Spacing',
    passed: avgSpacing >= 100 && avgSpacing <= 500,
    value: avgSpacing,
    threshold: 500,
    message: `Average spacing ${avgSpacing.toFixed(0)}mm`,
  });

  return checks;
}

function calculateAverageSpacing(stations: Station[]): number {
  if (stations.length < 2) return 200;

  let totalSpacing = 0;
  for (let i = 1; i < stations.length; i++) {
    totalSpacing += stations[i].position - stations[i - 1].position;
  }

  return totalSpacing / (stations.length - 1);
}

function generateRecommendations(failedChecks: ConstraintCheck[]): string[] {
  const recommendations: string[] = [];

  for (const check of failedChecks) {
    if (check.name.includes('Diameter')) {
      recommendations.push(`Adjust roll diameter to within acceptable range (80-400mm)`);
    } else if (check.name.includes('Width')) {
      recommendations.push(`Reduce roll face width or use wider machine`);    } else if (check.name.includes('Gap')) {
      recommendations.push(`Adjust roll positions to achieve correct gap`);
    } else if (check.name.includes('Interference')) {
      recommendations.push(`Reduce roll diameters or adjust center positions`);
    } else if (check.name.includes('Clearance')) {
      recommendations.push(`Increase roll gap to provide material clearance`);
    } else if (check.name.includes('Station Count')) {
      recommendations.push(`Reduce number of stations by combining forming operations`);
    } else if (check.name.includes('Spacing')) {
      recommendations.push(`Adjust station spacing to 100-500mm range`);
    }
  }

  return [...new Set(recommendations)];
}

// ============================================
// VALIDATION
// ============================================

export function validateConstraints(result: ConstraintCheckResult): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (result.overallScore < 80) {
    warnings.push(`Low constraint score: ${result.overallScore.toFixed(0)}%`);
  }

  const criticalChecks = result.checks.filter(c =>
    c.name.includes('Interference') || c.name.includes('Clearance')
  );

  if (criticalChecks.some(c => !c.passed)) {
    warnings.push('Critical constraints failed - manual review required');
  }

  return {
    valid: result.passed,
    warnings,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiConstCheck = {
  config: CONFIG,
  checkConstraints,
  validateConstraints,
};

export default SemiConstCheck;
