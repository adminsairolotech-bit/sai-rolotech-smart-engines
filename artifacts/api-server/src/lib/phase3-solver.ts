import { stressFromStrain, type MaterialCurve } from "./material-curves.js";

export interface IncrementalSolverInput {
  materialCurve: MaterialCurve;
  thickness: number;
  targetAngle: number;
  bendRadius: number;
  rollGap: number;
  clearance: number;
  basePassStrain: number;
  previousPlasticStrain: number;
  previousEffectiveAngle: number;
  contactPressureHintMPa: number;
}

export interface IncrementalSolverResult {
  converged: boolean;
  iterations: number;
  residual: number;
  solvedPassStrain: number;
  solvedStressMPa: number;
  plasticStrain: number;
  tangentModulusMPa: number;
  elasticRecoveredStrain: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value: number, precision = 6): number {
  return parseFloat(value.toFixed(precision));
}

function tangentModulus(curve: MaterialCurve, strain: number): number {
  const base = stressFromStrain(curve, strain).stressMPa;
  const nextStrain = strain + 1e-4;
  const next = stressFromStrain(curve, nextStrain).stressMPa;
  return Math.max(1, (next - base) / (nextStrain - strain));
}

export function solveIncrementalElastoPlasticPass(
  input: IncrementalSolverInput,
): IncrementalSolverResult {
  const {
    materialCurve,
    thickness,
    targetAngle,
    bendRadius,
    rollGap,
    clearance,
    basePassStrain,
    previousPlasticStrain,
    previousEffectiveAngle,
    contactPressureHintMPa,
  } = input;

  const targetCurvatureStrain = thickness / (2 * Math.max(0.001, bendRadius));
  const angleFactor = clamp(targetAngle / 90, 0.05, 2.5);
  const gapClosureFactor = clamp(thickness / Math.max(rollGap, thickness * 0.8), 0.88, 1.18);
  const clearanceRelief = clamp(1 - clearance / Math.max(rollGap, 0.05) * 0.08, 0.9, 1.02);
  const contactFactor = clamp(contactPressureHintMPa / Math.max(materialCurve.yieldStrengthMPa, 1), 0.18, 1.6);
  const plasticCarry = clamp(previousPlasticStrain / Math.max(materialCurve.maxStrain, 1e-6), 0, 1.2);
  const previousAngleFactor = clamp(previousEffectiveAngle / Math.max(targetAngle, 1), 0, 1.25);

  let strain = Math.max(basePassStrain, targetCurvatureStrain * 0.92);
  let residual = 1;
  let iterations = 0;

  for (let iteration = 1; iteration <= 10; iteration += 1) {
    iterations = iteration;
    const state = stressFromStrain(materialCurve, strain);
    const stressRatio = state.stressMPa / Math.max(materialCurve.utsMPa, 1);
    const targetStrain =
      targetCurvatureStrain *
      (1 + angleFactor * 0.08 + contactFactor * 0.07 + plasticCarry * 0.05 + previousAngleFactor * 0.02) *
      gapClosureFactor *
      clearanceRelief *
      (1 + stressRatio * 0.03);

    const relaxation = state.regime === "PLASTIC" ? 0.42 : 0.58;
    const nextStrain = strain + (targetStrain - strain) * relaxation;
    residual = Math.abs(nextStrain - strain);
    strain = nextStrain;
    if (residual < 1e-5) break;
  }

  const solvedState = stressFromStrain(materialCurve, strain);
  const tangent = tangentModulus(materialCurve, strain);
  const elasticRecoveredStrain = solvedState.stressMPa / Math.max(materialCurve.elasticModulusMPa, 1);

  return {
    converged: residual < 5e-5,
    iterations,
    residual: toNumber(residual, 8),
    solvedPassStrain: toNumber(strain, 6),
    solvedStressMPa: toNumber(solvedState.stressMPa),
    plasticStrain: toNumber(solvedState.plasticStrain, 6),
    tangentModulusMPa: toNumber(tangent),
    elasticRecoveredStrain: toNumber(elasticRecoveredStrain, 6),
  };
}
