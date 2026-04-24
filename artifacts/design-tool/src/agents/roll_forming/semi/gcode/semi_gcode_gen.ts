/**
 * SEMI_GCODE_GEN - Roll Forming Semi Agent
 * ===========================================
 * G-code generation agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  GCodeResult,
  Station,
  RollDesign,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_GCODE_GEN',
  version: '1.0.0',
  timeout: 30000,
  retries: 2,
};

export interface GCodeGenInput {
  stations: Station[];
  rollDesigns: RollDesign[];
  format?: 'fanuc' | 'siemens' | 'heidenhain' | 'generic';
  feedRate?: number;
  spindleSpeed?: number;
}

export interface GCodeGenOutput {
  result: GCodeResult;
  lineCount: number;
  estimatedTime: number;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function generateGCode(
  input: GCodeGenInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<GCodeGenOutput>> {
  try {
    const format = input.format || 'fanuc';
    const feedRate = input.feedRate || 1000;
    const spindleSpeed = input.spindleSpeed || 3000;

    let code = generateHeader(format, spindleSpeed);

    for (const station of input.stations) {
      code += generateStationCode(station, format, feedRate);
    }

    code += generateFooter(format);

    const validation = validateGCode(code);
    const lineCount = code.split('\n').length;
    const estimatedTime = calculateEstimatedTime(input.stations);

    const result: GCodeResult = {
      code,
      format,
      safetyScore: validation.score,
      validation,
      estimatedTime,
      tools: [{ number: 1, type: 'endmill', diameter: 10, feedRate, spindleSpeed }],
    };

    return {
      success: true,
      data: { result, lineCount, estimatedTime },
    };
  } catch (error) {
    return {
      success: false,
      error: `G-code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function generateHeader(format: string, spindleSpeed: number): string {
  const headers: Record<string, string> = {
    fanuc: `O1001 (ROLL FORMING G-CODE)\nG21 (MM)\nG90 (ABSOLUTE)\nG40 (CANCEL COMP)\nG80 (CANCEL CYCLE)\nT1 M6 (TOOL 1)\nS${spindleSpeed} M3 (SPINDLE CW)\nG0 X0 Y0 Z100\n`,
    siemens: `; ROLL FORMING G-CODE\nG71 (MM)\nG90 (ABSOLUTE)\nTOOL CALL 1\nSPOS=${spindleSpeed}\nL CYC0\n`,
    heidenhain: `0 BEGIN PGM ROLLFORMING MM\n1 BLK FORM 0.1 Z X-100 Y-100 Z+50\n2 TOOL CALL 1 Z S${spindleSpeed}\n`,
    generic: `; ROLL FORMING G-CODE (GENERIC)\nG21\nG90\nM3 S${spindleSpeed}\n`,
  };

  return headers[format] || headers.generic;
}

function generateStationCode(station: Station, format: string, feedRate: number): string {
  const x = station.position;
  const z = -station.rollGap;
  const angle = station.formingAngle;

  const codes: Record<string, string> = {
    fanuc: `; STATION ${station.index}\nG0 X${x.toFixed(1)} Z${z.toFixed(1)}\nG1 Z${(z - 5).toFixed(1)} F${feedRate}\nG0 Z${z.toFixed(1)}\nG1 A${angle.toFixed(2)} F500\n`,
    siemens: `; STATION ${station.index}\nG0 X=${x.toFixed(1)} Z=${z.toFixed(1)}\nG1 Z=${(z - 5).toFixed(1)} F=${feedRate}\nG0 Z=${z.toFixed(1)}\n`,
    heidenhain: `; STATION ${station.index}\nL X+${x.toFixed(1)} Z+${z.toFixed(1)} FMAX\nL Z+${(z - 5).toFixed(1)} F${feedRate}\nL Z+${z.toFixed(1)} FMAX\n`,
    generic: `; STATION ${station.index}\nG0 X${x.toFixed(1)} Z${z.toFixed(1)}\nG1 Z${(z - 5).toFixed(1)}\nG0 Z${z.toFixed(1)}\n`,
  };

  return codes[format] || codes.generic;
}

function generateFooter(format: string): string {
  const footers: Record<string, string> = {
    fanuc: `G0 Z100\nM5 (SPINDLE STOP)\nM30 (END)\n`,
    siemens: `G0 Z100\nM5\nM30\n`,
    heidenhain: `L Z+100 FMAX\nM2\nEND PGM ROLLFORMING MM\n`,
    generic: `G0 Z100\nM5\nM30\n`,
  };

  return footers[format] || footers.generic;
}

function validateGCode(code: string): GCodeResult['validation'] {
  const errors: GCodeResult['validation']['errors'] = [];
  const warnings: GCodeResult['validation']['warnings'] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('M30') || line.startsWith('M2')) {
      if (i !== lines.length - 1) {
        warnings.push({ line: i + 1, code: 'W001', message: 'End code not at end of file' });
      }
    }
  }

  const hasSpindle = code.includes('S') || code.includes('SPOS');
  if (!hasSpindle) {
    warnings.push({ line: 0, code: 'W002', message: 'No spindle speed specified' });
  }

  const score = errors.length === 0 ? (warnings.length === 0 ? 100 : 85) : 50;

  return { valid: errors.length === 0, errors, warnings, score };
}

function calculateEstimatedTime(stations: Station[]): number {
  return stations.length * 5 + 10;
}

export const SemiGCodeGen = { config: CONFIG, generateGCode };
export default SemiGCodeGen;
