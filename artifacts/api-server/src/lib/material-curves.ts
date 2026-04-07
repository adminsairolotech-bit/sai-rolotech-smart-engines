import type { ResolvedMaterialModel } from "./material-model.js";

export interface MaterialCurvePoint {
  strain: number;
  stress: number;
}

export interface MaterialCurve {
  elasticModulusMPa: number;
  yieldStrengthMPa: number;
  utsMPa: number;
  maxStrain: number;
  yieldStrain: number;
  hardeningExponent: number;
  strengthCoefficientMPa: number;
  points: MaterialCurvePoint[];
}

export interface MaterialStressResult {
  stressMPa: number;
  regime: "ELASTIC" | "PLASTIC";
  plasticStrain: number;
}

function toNumber(value: number, precision = 6): number {
  return parseFloat(value.toFixed(precision));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function buildMaterialCurve(
  material: ResolvedMaterialModel,
  thickness: number,
): MaterialCurve {
  const elasticModulusMPa = material.elasticModulusMPa;
  const yieldStrengthMPa = material.yieldStrengthMPa;
  const utsMPa = material.utsMPa;
  const maxStrain = material.maxStrain;
  const yieldStrain = yieldStrengthMPa / Math.max(1, elasticModulusMPa);
  const hardeningExponent = clamp(material.hardeningExponent, 0.04, 0.55);
  const thicknessFactor = clamp(1 + Math.min(Math.max(thickness, 0.2), 6) * 0.015, 1, 1.09);
  const plasticWindow = Math.max(0.002, maxStrain - yieldStrain);
  const availableHardening = Math.max(10, (utsMPa - yieldStrengthMPa) * thicknessFactor);
  const strengthCoefficientMPa = availableHardening / Math.pow(plasticWindow, hardeningExponent);

  const samples = 32;
  const points: MaterialCurvePoint[] = [];
  for (let index = 0; index <= samples; index += 1) {
    const strain = (maxStrain * index) / samples;
    const stress = stressFromStrainValue(
      strain,
      elasticModulusMPa,
      yieldStrengthMPa,
      utsMPa,
      yieldStrain,
      hardeningExponent,
      strengthCoefficientMPa,
    ).stressMPa;
    points.push({
      strain: toNumber(strain),
      stress: toNumber(stress),
    });
  }

  return {
    elasticModulusMPa,
    yieldStrengthMPa,
    utsMPa,
    maxStrain,
    yieldStrain: toNumber(yieldStrain),
    hardeningExponent: toNumber(hardeningExponent),
    strengthCoefficientMPa: toNumber(strengthCoefficientMPa),
    points,
  };
}

function stressFromStrainValue(
  strain: number,
  elasticModulusMPa: number,
  yieldStrengthMPa: number,
  utsMPa: number,
  yieldStrain: number,
  hardeningExponent: number,
  strengthCoefficientMPa: number,
): MaterialStressResult {
  const safeStrain = Math.max(0, strain);
  if (safeStrain <= yieldStrain) {
    return {
      stressMPa: safeStrain * elasticModulusMPa,
      regime: "ELASTIC",
      plasticStrain: 0,
    };
  }

  const plasticStrain = safeStrain - yieldStrain;
  const hardeningStress = yieldStrengthMPa + strengthCoefficientMPa * Math.pow(plasticStrain, hardeningExponent);
  return {
    stressMPa: Math.min(utsMPa, hardeningStress),
    regime: "PLASTIC",
    plasticStrain,
  };
}

export function stressFromStrain(curve: MaterialCurve, strain: number): MaterialStressResult {
  return stressFromStrainValue(
    strain,
    curve.elasticModulusMPa,
    curve.yieldStrengthMPa,
    curve.utsMPa,
    curve.yieldStrain,
    curve.hardeningExponent,
    curve.strengthCoefficientMPa,
  );
}
