/**
 * SEMI_DEF_ANALYZER - Roll Forming Semi Agent
 * ===========================================
 * Deformation analysis agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  Station,
  Material,
  SimulationMetrics,
  DefectPrediction,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_DEF_ANALYZER',
  version: '1.0.0',
  timeout: 20000,
  retries: 2,
};

export interface DefAnalyzerInput {
  stations: Station[];
  material: Material;
  speed: number;
  rollDiameter: number;
}

export interface DefAnalyzerOutput {
  metrics: SimulationMetrics;
  predictions: DefectPrediction[];
  overallQuality: number;
  criticalStations: number[];
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function analyzeDeformation(
  input: DefAnalyzerInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<DefAnalyzerOutput>> {
  try {
    const metrics = calculateSimulationMetrics(input.stations);
    const predictions = predictDefects(input.stations, input.material, input.speed, input.rollDiameter);
    const overallQuality = calculateOverallQuality(metrics, predictions);
    const criticalStations = identifyCriticalStations(predictions);

    return {
      success: true,
      data: {
        metrics,
        predictions,
        overallQuality,
        criticalStations,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Deformation analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function calculateSimulationMetrics(stations: Station[]): SimulationMetrics {
  let maxStrain = 0;
  let maxStress = 0;
  let maxDisplacement = 0;
  let springback = 0;
  let formingForce = 0;

  for (const station of stations) {
    maxStrain = Math.max(maxStrain, station.materialState.strain);
    maxStress = Math.max(maxStress, station.materialState.stress);
    maxDisplacement = Math.max(maxDisplacement, station.formingAngle * 0.1);
    formingForce += station.materialState.strain * station.materialState.thickness * 1000;
  }

  springback = maxStrain * 0.1;

  const avgForce = stations.length > 0 ? formingForce / stations.length : 0;

  return {
    maxStrain: Math.round(maxStrain * 1e6) / 1e6,
    maxStress: Math.round(maxStress / 1000 * 1e6) / 1e6,
    maxDisplacement: Math.round(maxDisplacement * 1000) / 1000,
    springback: Math.round(springback * 1000) / 1000,
    formingForce: Math.round(avgForce * 10) / 10,
    powerRequired: Math.round(avgForce * 0.5 * 10) / 10,
    elongation: calculateElongation(stations),
    thicknessReduction: calculateThicknessReduction(stations),
  };
}

function calculateElongation(stations: Station[]): number {
  if (stations.length < 2) return 0;

  const initial = stations[0].materialState.thickness;
  const final = stations[stations.length - 1].materialState.thickness;

  return Math.round(((initial - final) / initial) * 1000) / 1000;
}

function calculateThicknessReduction(stations: Station[]): number {
  if (stations.length < 2) return 0;

  const initial = stations[0].materialState.thickness;
  const final = stations[stations.length - 1].materialState.thickness;

  return Math.round(((initial - final) / initial * 100) * 10) / 10;
}

function predictDefects(
  stations: Station[],
  material: Material,
  speed: number,
  rollDiameter: number
): DefectPrediction[] {
  const predictions: DefectPrediction[] = [];

  predictions.push(...checkEdgeWave(stations, material));
  predictions.push(...checkTwist(stations));
  predictions.push(...checkFlare(stations, material));
  predictions.push(...checkCamber(stations, speed));
  predictions.push(...checkSpringback(stations, material, rollDiameter));

  return predictions;
}

function checkEdgeWave(stations: Station[], material: Material): DefectPrediction[] {
  const predictions: DefectPrediction[] = [];

  for (const station of stations) {
    const strainRate = station.materialState.strain / (station.position / 1000 + 1);
    const threshold = 0.15 / (material.springbackFactor || 1);

    if (strainRate > threshold) {
      predictions.push({
        type: 'edge_wave',
        probability: Math.min(1, strainRate / threshold),
        location: `Station ${station.index}`,
        severity: strainRate / threshold > 1.5 ? 'high' : 'medium',
        mitigation: 'Reduce forming speed or increase number of stations',
      });
    }
  }

  return predictions;
}

function checkTwist(stations: Station[]): DefectPrediction[] {
  const predictions: DefectPrediction[] = [];

  for (let i = 1; i < stations.length; i++) {
    const prevStrain = stations[i - 1].materialState.strain;
    const currStrain = stations[i].materialState.strain;
    const strainDiff = Math.abs(currStrain - prevStrain);

    if (strainDiff > 0.05) {
      predictions.push({
        type: 'twist',
        probability: strainDiff / 0.1,
        location: `Between stations ${i - 1} and ${i}`,
        severity: strainDiff > 0.1 ? 'high' : 'medium',
        mitigation: 'Balance strain distribution across stations',
      });
    }
  }

  return predictions;
}

function checkFlare(stations: Station[], material: Material): DefectPrediction[] {
  const predictions: DefectPrediction[] = [];

  const finalStation = stations[stations.length - 1];
  if (finalStation && finalStation.formingAngle > 60) {
    const flareRisk = finalStation.formingAngle / 90 * (material.springbackFactor - 1);

    if (flareRisk > 0.02) {
      predictions.push({
        type: 'flare',
        probability: flareRisk * 10,
        location: `Station ${finalStation.index} (exit)`,
        severity: flareRisk > 0.05 ? 'high' : 'medium',
        mitigation: 'Add edge guides or adjust final pass angle',
      });
    }
  }

  return predictions;
}

function checkCamber(stations: Station[], speed: number): DefectPrediction[] {
  const predictions: DefectPrediction[] = [];

  if (speed > 100) {
    const camberRisk = (speed - 100) / 200;

    predictions.push({
      type: 'camber',
      probability: camberRisk,
      location: 'Throughout process',
      severity: camberRisk > 0.3 ? 'high' : 'medium',
      mitigation: 'Reduce line speed or increase tension control',
    });
  }

  return predictions;
}

function checkSpringback(
  stations: Station[],
  material: Material,
  rollDiameter: number
): DefectPrediction[] {
  const predictions: DefectPrediction[] = [];

  for (const station of stations) {
    const springbackAngle = station.formingAngle * (material.springbackFactor - 1);
    const radiusRatio = rollDiameter / station.materialState.thickness;

    if (springbackAngle > 5 && radiusRatio < 20) {
      predictions.push({
        type: 'springback',
        probability: Math.min(1, springbackAngle / 15),
        location: `Station ${station.index}`,
        severity: springbackAngle > 10 ? 'high' : 'medium',
        mitigation: 'Apply overbending compensation',
      });
    }
  }

  return predictions;
}

function calculateOverallQuality(
  metrics: SimulationMetrics,
  predictions: DefectPrediction[]
): number {
  let quality = 100;

  if (metrics.maxStrain > 0.2) quality -= 20;
  else if (metrics.maxStrain > 0.15) quality -= 10;

  if (metrics.springback > 5) quality -= 15;
  else if (metrics.springback > 3) quality -= 8;

  const highSeverityDefects = predictions.filter(p => p.severity === 'high').length;
  quality -= highSeverityDefects * 15;

  const mediumSeverityDefects = predictions.filter(p => p.severity === 'medium').length;
  quality -= mediumSeverityDefects * 5;

  return Math.max(0, Math.min(100, Math.round(quality)));
}

function identifyCriticalStations(predictions: DefectPrediction[]): number[] {
  const stationSet = new Set<number>();

  for (const prediction of predictions) {
    const match = prediction.location.match(/Station (\d+)/);
    if (match) {
      stationSet.add(parseInt(match[1]));
    }
  }

  return Array.from(stationSet).sort((a, b) => a - b);
}

// ============================================
// VALIDATION
// ============================================

export function validateDeformationAnalysis(output: DefAnalyzerOutput): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (output.overallQuality < 70) {
    warnings.push(`Low quality score: ${output.overallQuality}%`);
  }

  const criticalDefects = output.predictions.filter(p => p.severity === 'high');
  if (criticalDefects.length > 0) {
    warnings.push(`${criticalDefects.length} high-severity defects detected`);
  }

  if (output.criticalStations.length > output.predictions.length * 0.5) {
    warnings.push('Many critical stations identified - consider redesign');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiDefAnalyzer = {
  config: CONFIG,
  analyzeDeformation,
  validateDeformationAnalysis,
};

export default SemiDefAnalyzer;
