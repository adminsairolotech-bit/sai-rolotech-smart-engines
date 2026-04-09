import type { MaterialCurve } from "./material-curves.js";

export interface SpringbackUnloadingInput {
  materialCurve: MaterialCurve;
  targetAngle: number;
  thickness: number;
  bendRadius: number;
  solvedPassStrain: number;
  solvedStressMPa: number;
  plasticStrain: number;
  tangentModulusMPa: number;
  contactPressureMPa: number;
}

export interface SpringbackUnloadingResult {
  elasticRecoveredStrain: number;
  unloadingStiffnessMPa: number;
  recoveredAngle: number;
  finalAngle: number;
  springbackRatio: number;
  overbendFactor: number;
  overbendTargetAngle: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value: number, precision = 6): number {
  return parseFloat(value.toFixed(precision));
}

export function solveSpringbackUnloading(
  input: SpringbackUnloadingInput,
): SpringbackUnloadingResult {
  const {
    materialCurve,
    targetAngle,
    thickness,
    bendRadius,
    solvedPassStrain,
    solvedStressMPa,
    plasticStrain,
    tangentModulusMPa,
    contactPressureMPa,
  } = input;

  const elasticRecoveredStrain = Math.min(
    solvedPassStrain * 0.92,
    solvedStressMPa / Math.max(materialCurve.elasticModulusMPa, 1),
  );
  const elasticShare = clamp(
    elasticRecoveredStrain / Math.max(solvedPassStrain, 1e-6),
    0.01,
    0.92,
  );
  const plasticRetention = clamp(
    1 - (plasticStrain / Math.max(solvedPassStrain, 1e-6)) * 0.55,
    0.35,
    0.98,
  );
  const radiusFactor = clamp(bendRadius / Math.max(thickness, 0.2), 1, 6);
  const geometryAmplification = clamp(0.52 + radiusFactor * 0.065, 0.55, 1.02);
  const pressureConstraint = clamp(
    1 - contactPressureMPa / Math.max(materialCurve.yieldStrengthMPa * 4, 1),
    0.82,
    1.0,
  );
  const unloadingStiffnessMPa = Math.max(
    tangentModulusMPa,
    materialCurve.elasticModulusMPa * 0.14,
  );
  const stiffnessRatio = clamp(
    unloadingStiffnessMPa / Math.max(materialCurve.elasticModulusMPa, 1),
    0.12,
    0.8,
  );

  const recoveredAngle = clamp(
    targetAngle *
      elasticShare *
      geometryAmplification *
      plasticRetention *
      pressureConstraint *
      (0.88 + stiffnessRatio * 0.18),
    0,
    targetAngle * 0.38,
  );
  const finalAngle = Math.max(0, targetAngle - recoveredAngle);
  const springbackRatio = targetAngle > 0 ? recoveredAngle / targetAngle : 0;
  const overbendFactor = 1 + springbackRatio;
  const overbendTargetAngle = targetAngle * overbendFactor;

  return {
    elasticRecoveredStrain: toNumber(elasticRecoveredStrain),
    unloadingStiffnessMPa: toNumber(unloadingStiffnessMPa),
    recoveredAngle: toNumber(recoveredAngle),
    finalAngle: toNumber(finalAngle),
    springbackRatio: toNumber(springbackRatio),
    overbendFactor: toNumber(overbendFactor),
    overbendTargetAngle: toNumber(overbendTargetAngle),
  };
}
