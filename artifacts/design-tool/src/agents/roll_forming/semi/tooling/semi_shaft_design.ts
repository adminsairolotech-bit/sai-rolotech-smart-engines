/**
 * SEMI_SHAFT_DESIGN - Roll Forming Semi Agent
 * ===========================================
 * Shaft design agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  Shaft,
  BearingSeat,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_SHAFT_DESIGN',
  version: '1.0.0',
  timeout: 12000,
  retries: 2,
};

export interface ShaftDesignInput {
  rollDiameter: number;
  rollFaceWidth: number;
  material?: string;
  torque?: number;
  speed?: number;
  bearingType?: 'deep_groove' | 'angular_contact' | 'tapered';
  keywayRequired?: boolean;
}

export interface ShaftDesignOutput {
  shaft: Shaft;
  strengthAnalysis: StrengthAnalysis;
  deflection: DeflectionAnalysis;
}

export interface StrengthAnalysis {
  maxShearStress: number;
  allowableStress: number;
  safetyFactor: number;
  criticalSection: string;
}

export interface DeflectionAnalysis {
  maxDeflection: number;
  allowableDeflection: number;
  deflectionAtMidspan: number;
  angleOfTwist: number;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function designShaft(
  input: ShaftDesignInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<ShaftDesignOutput>> {
  try {
    const diameter = calculateShaftDiameter(input.rollDiameter);
    const length = input.rollFaceWidth + 40;

    const keywayWidth = diameter * 0.2;
    const keywayDepth = diameter * 0.05;

    const bearingSeats: BearingSeat[] = [
      { position: 10, diameter: diameter + 10, width: 20 },
      { position: length - 30, diameter: diameter + 10, width: 20 },
    ];

    const shaft: Shaft = {
      diameter,
      length,
      keywayWidth: input.keywayRequired !== false ? keywayWidth : 0,
      keywayDepth: input.keywayRequired !== false ? keywayDepth : 0,
      bearingSeats,
      material: input.material || '1045 Steel',
      maxTorque: calculateMaxTorque(diameter),
      maxDeflection: length * 0.0005,
    };

    const torque = input.torque || calculateRequiredTorque(input.rollDiameter, input.speed);
    const strengthAnalysis = analyzeStrength(shaft, torque);
    const deflectionAnalysis = analyzeDeflection(shaft, torque);

    return {
      success: true,
      data: {
        shaft,
        strengthAnalysis,
        deflection: deflectionAnalysis,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Shaft design failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function calculateShaftDiameter(rollDiameter: number): number {
  const d = rollDiameter * 0.3;
  return Math.round(d / 2) * 2 + 5;
}

function calculateRequiredTorque(rollDiameter: number, speed?: number): number {
  const force = 5000;
  const radius = rollDiameter / 2000;
  return force * radius;
}

function calculateMaxTorque(diameter: number): number {
  const tauAllowable = 350;
  const d = diameter / 1000;
  return (tauAllowable * Math.PI * Math.pow(d, 3)) / 16;
}

function analyzeStrength(shaft: Shaft, torque: number): StrengthAnalysis {
  const d = shaft.diameter / 1000;
  const tauMax = (16 * torque) / (Math.PI * Math.pow(d, 3));
  const allowableStress = 350;
  const safetyFactor = allowableStress / tauMax;

  return {
    maxShearStress: tauMax,
    allowableStress,
    safetyFactor,
    criticalSection: 'At keyway',
  };
}

function analyzeDeflection(shaft: Shaft, torque: number): DeflectionAnalysis {
  const E = 210e9;
  const d = shaft.diameter / 1000;
  const I = (Math.PI * Math.pow(d, 4)) / 64;
  const L = shaft.length / 1000;
  const load = 5000;
  const midspanDeflection = (load * Math.pow(L, 3)) / (48 * E * I);
  const maxDeflection = midspanDeflection * 1.5;
  const allowableDeflection = L * 0.001;
  const G = 80e9;
  const J = (Math.PI * Math.pow(d, 4)) / 32;
  const angleOfTwist = (torque * L) / (G * J);

  return {
    maxDeflection,
    allowableDeflection,
    deflectionAtMidspan: midspanDeflection,
    angleOfTwist,
  };
}

// ============================================
// KEYWAY DESIGN
// ============================================

export function designKeyway(
  shaftDiameter: number,
  torque: number
): { width: number; depth: number; length: number } {
  return {
    width: shaftDiameter * 0.2,
    depth: shaftDiameter * 0.05,
    length: shaftDiameter * 0.75,
  };
}

// ============================================
// BEARING SELECTION
// ============================================

export function selectBearing(
  shaftDiameter: number,
  speed: number,
  load: number
): { bore: number; OD: number; width: number; type: string } {
  const bore = shaftDiameter + 5;
  const OD = bore + 20;
  const width = 15;

  return {
    bore,
    OD,
    width,
    type: speed > 3000 ? 'angular_contact' : 'deep_groove',
  };
}

// ============================================
// VALIDATION
// ============================================

export function validateShaft(shaft: Shaft, torque: number): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const analysis = analyzeStrength(shaft, torque);
  if (analysis.safetyFactor < 1.5) {
    errors.push(`Low safety factor: ${analysis.safetyFactor.toFixed(2)}`);
  }

  const deflection = analyzeDeflection(shaft, torque);
  if (deflection.maxDeflection > deflection.allowableDeflection) {
    warnings.push('Deflection exceeds allowable limit');
  }

  if (shaft.diameter < 20) {
    errors.push('Shaft diameter too small');
  }

  if (shaft.keywayDepth > shaft.diameter * 0.1) {
    warnings.push('Keyway depth is significant - check stress concentration');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiShaftDesign = {
  config: CONFIG,
  designShaft,
  designKeyway,
  selectBearing,
  validateShaft,
};

export default SemiShaftDesign;
