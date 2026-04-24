/**
 * SEMI_POWER_ESTIMATE - Roll Forming Semi Agent
 * ===========================================
 * Power estimation agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  PowerEstimate,
  Station,
  Material,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_POWER_ESTIMATE',
  version: '1.0.0',
  timeout: 12000,
  retries: 2,
};

export interface PowerEstimateInput {
  stations: Station[];
  material: Material;
  speed: number;
  efficiency?: number;
}

export interface PowerEstimateOutput {
  estimate: PowerEstimate;
  perStationPower: number[];
  driveRecommendation: DriveRecommendation;
}

export interface DriveRecommendation {
  motorPower: number;
  motorType: string;
  gearboxRatio: number;
  driveConfig: 'single' | 'dual' | 'multi';
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function estimatePower(
  input: PowerEstimateInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<PowerEstimateOutput>> {
  try {
    const efficiency = input.efficiency || 0.85;
    let totalPower = 0;
    const perStationPower: number[] = [];

    for (const station of input.stations) {
      const stationPower = calculateStationPower(station, input.material, input.speed);
      perStationPower.push(Math.round(stationPower * 10) / 10);
      totalPower += stationPower;
    }

    const peakPower = Math.max(...perStationPower);
    const avgPower = totalPower / input.stations.length;
    const motorPower = peakPower * 1.2 / efficiency;
    const torque = calculateTotalTorque(input.stations, input.material);
    const speedRPM = calculateRPM(input.speed);

    const estimate: PowerEstimate = {
      formingPower: Math.round(avgPower * 10) / 10,
      torque: Math.round(torque * 10) / 10,
      speed: Math.round(speedRPM * 10) / 10,
      energyPerMeter: Math.round((avgPower / (input.speed / 60)) * 100) / 100,
    };

    const driveRecommendation = getDriveRecommendation(motorPower, torque);

    return {
      success: true,
      data: { estimate, perStationPower, driveRecommendation },
    };
  } catch (error) {
    return {
      success: false,
      error: `Power estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function calculateStationPower(station: Station, material: Material, speed: number): number {
  const formingForce = station.materialState.strain * material.yieldStrength * station.materialState.thickness * 1000;
  const speedMPS = speed / 60;
  const power = (formingForce * speedMPS) / 1000;
  const materialFactor = getMaterialPowerFactor(material.type);
  return power * materialFactor;
}

function getMaterialPowerFactor(type: string): number {
  const factors: Record<string, number> = { MS: 1.0, HSS: 1.5, SS: 1.3, AL: 0.7, TI: 1.8, CU: 0.8, BR: 0.9 };
  return factors[type] || 1.0;
}

function calculateTotalTorque(stations: Station[], material: Material): number {
  let totalTorque = 0;
  for (const station of stations) {
    const force = station.materialState.strain * material.yieldStrength * station.materialState.thickness * 1000;
    const radius = 0.1;
    totalTorque += force * radius * 0.001;
  }
  return totalTorque;
}

function calculateRPM(lineSpeed: number): number {
  const rollDiameter = 0.15;
  const rollCircumference = Math.PI * rollDiameter;
  return Math.round((lineSpeed / 60 / rollCircumference) * 10) / 10;
}

function getDriveRecommendation(motorPower: number, torque: number): DriveRecommendation {
  let motorType = 'AC Induction';
  if (motorPower > 75) motorType = 'AC Variable Frequency';
  if (torque > 1000) motorType = 'Servo';

  let driveConfig: 'single' | 'dual' | 'multi' = 'single';
  if (motorPower > 50) driveConfig = 'dual';
  if (motorPower > 100) driveConfig = 'multi';

  const baseRatio = torque / (motorPower * 1000 / (2 * Math.PI * 1500 / 60));
  const gearboxRatio = baseRatio < 1 ? Math.round(1 / baseRatio * 10) / 10 : Math.round(baseRatio * 10) / 10;

  return {
    motorPower: Math.ceil(motorPower / 5) * 5,
    motorType,
    gearboxRatio,
    driveConfig,
  };
}

export const SemiPowerEstimate = { config: CONFIG, estimatePower };
export default SemiPowerEstimate;
