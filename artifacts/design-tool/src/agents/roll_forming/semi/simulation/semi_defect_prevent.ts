/**
 * SEMI_DEFECT_PREVENT - Roll Forming Semi Agent
 * ===========================================
 * Defect prevention agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  Station,
  Material,
  DefectPrediction,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_DEFECT_PREVENT',
  version: '1.0.0',
  timeout: 15000,
  retries: 2,
};

export interface Mitigation {
  defectType: DefectPrediction['type'];
  originalRisk: number;
  mitigationStrategy: string;
  parameterChange: { parameter: string; oldValue: number; newValue: number; unit: string };
  expectedReduction: number;
  applied: boolean;
}

export interface DefectPreventOutput {
  mitigations: Mitigation[];
  adjustedStations: Station[];
  effectivenessScore: number;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function preventDefects(
  input: { stations: Station[]; material: Material; predictions: DefectPrediction[] },
  context: SemiAgentContext
): Promise<SemiAgentResult<DefectPreventOutput>> {
  try {
    const mitigations: Mitigation[] = [];
    const adjustedStations = [...input.stations];

    for (const prediction of input.predictions) {
      const mitigation = generateMitigation(prediction, adjustedStations, input.material);
      mitigations.push(mitigation);
      if (mitigation.applied) applyMitigation(mitigation, adjustedStations);
    }

    const totalRisk = mitigations.reduce((sum, m) => sum + m.originalRisk, 0);
    const remainingRisk = mitigations.reduce((sum, m) => {
      if (m.applied) return sum + m.originalRisk * (1 - m.expectedReduction);
      return sum + m.originalRisk;
    }, 0);
    const effectivenessScore = totalRisk > 0 ? ((totalRisk - remainingRisk) / totalRisk) * 100 : 100;

    return {
      success: true,
      data: { mitigations, adjustedStations, effectivenessScore: Math.round(effectivenessScore * 10) / 10 },
    };
  } catch (error) {
    return {
      success: false,
      error: `Defect prevention failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function generateMitigation(prediction: DefectPrediction, stations: Station[], material: Material): Mitigation {
  let strategy = '';
  let parameterChange = { parameter: '', oldValue: 0, newValue: 0, unit: '' };

  switch (prediction.type) {
    case 'edge_wave':
      strategy = 'Reduce forming speed and increase tension';
      parameterChange = { parameter: 'lineSpeed', oldValue: 100, newValue: 80, unit: 'm/min' };
      break;
    case 'twist':
      strategy = 'Balance strain distribution across stations';
      parameterChange = { parameter: 'stationCount', oldValue: stations.length, newValue: stations.length + 2, unit: 'stations' };
      break;
    case 'flare':
      strategy = 'Add edge guides and adjust final pass angle';
      parameterChange = { parameter: 'finalAngle', oldValue: 90, newValue: 85, unit: 'deg' };
      break;
    case 'camber':
      strategy = 'Reduce line speed and improve tension control';
      parameterChange = { parameter: 'speed', oldValue: 120, newValue: 100, unit: 'm/min' };
      break;
    case 'springback':
      strategy = 'Apply overbending compensation';
      parameterChange = { parameter: 'overbendFactor', oldValue: 1.0, newValue: 1.05, unit: '' };
      break;
    default:
      strategy = 'Review process parameters';
  }

  return { defectType: prediction.type, originalRisk: prediction.probability, mitigationStrategy: strategy, parameterChange, expectedReduction: prediction.probability * 0.7, applied: false };
}

function applyMitigation(mitigation: Mitigation, stations: Station[]): void {
  mitigation.applied = true;
  for (const station of stations) {
    switch (mitigation.parameterChange.parameter) {
      case 'lineSpeed':
      case 'speed':
        station.materialState.strain *= 0.9;
        break;
      case 'finalAngle':
        if (station.index === stations.length - 1) station.formingAngle = mitigation.parameterChange.newValue;
        break;
      case 'overbendFactor':
        station.formingAngle *= mitigation.parameterChange.newValue;
        break;
    }
  }
}

export const SemiDefectPrevent = { config: CONFIG, preventDefects };
export default SemiDefectPrevent;
