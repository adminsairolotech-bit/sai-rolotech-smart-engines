/**
 * SEMI_SAFETY_VALIDATOR - Roll Forming Semi Agent
 * ===========================================
 * Safety validation agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  GCodeResult,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_SAFETY_VALIDATOR',
  version: '1.0.0',
  timeout: 15000,
  retries: 2,
};

export interface SafetyValidatorInput {
  gcode: string;
  machineLimits?: MachineLimits;
}

export interface MachineLimits {
  maxFeedRate: number;
  maxSpindleSpeed: number;
  maxDepthOfCut: number;
  minClearance: number;
}

export interface SafetyResult {
  score: number;
  isCNCReady: boolean;
  checks: SafetyCheck[];
  blockingIssues: string[];
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function validateSafety(
  input: SafetyValidatorInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<SafetyResult>> {
  try {
    const limits = input.machineLimits || getDefaultLimits();
    const checks: SafetyCheck[] = [];
    const blockingIssues: string[] = [];

    checks.push(checkFeedRates(input.gcode, limits));
    checks.push(checkSpindleSpeeds(input.gcode, limits));
    checks.push(checkDepthOfCut(input.gcode, limits));
    checks.push(checkRapidMovements(input.gcode));
    checks.push(checkToolChanges(input.gcode));
    checks.push(checkEndCode(input.gcode));
    checks.push(checkSafetyBlock(input.gcode));

    const passedChecks = checks.filter(c => c.passed).length;
    const score = Math.round((passedChecks / checks.length) * 100);

    for (const check of checks) {
      if (!check.passed && check.critical) {
        blockingIssues.push(check.message);
      }
    }

    const isCNCReady = score >= 70 && blockingIssues.length === 0;

    return {
      success: true,
      data: { score, isCNCReady, checks, blockingIssues },
    };
  } catch (error) {
    return {
      success: false,
      error: `Safety validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export interface SafetyCheck {
  name: string;
  passed: boolean;
  critical: boolean;
  message: string;
  value?: number;
  threshold?: number;
}

function getDefaultLimits(): MachineLimits {
  return { maxFeedRate: 5000, maxSpindleSpeed: 10000, maxDepthOfCut: 10, minClearance: 5 };
}

function checkFeedRates(gcode: string, limits: MachineLimits): SafetyCheck {
  const feedMatches = gcode.match(/F(\d+\.?\d*)/g) || [];
  const maxFeed = Math.max(0, ...feedMatches.map(f => parseFloat(f.substring(1))));

  const passed = maxFeed <= limits.maxFeedRate;
  return {
    name: 'Feed Rate',
    passed,
    critical: false,
    message: passed ? `Max feed rate OK: ${maxFeed.toFixed(0)}` : `Feed rate ${maxFeed.toFixed(0)} exceeds limit ${limits.maxFeedRate}`,
    value: maxFeed,
    threshold: limits.maxFeedRate,
  };
}

function checkSpindleSpeeds(gcode: string, limits: MachineLimits): SafetyCheck {
  const spindleMatches = gcode.match(/S(\d+)/g) || [];
  const maxSpindle = Math.max(0, ...spindleMatches.map(s => parseInt(s.substring(1))));

  const passed = maxSpindle <= limits.maxSpindleSpeed;
  return {
    name: 'Spindle Speed',
    passed,
    critical: false,
    message: passed ? `Max spindle speed OK: ${maxSpindle}` : `Spindle speed ${maxSpindle} exceeds limit ${limits.maxSpindleSpeed}`,
    value: maxSpindle,
    threshold: limits.maxSpindleSpeed,
  };
}

function checkDepthOfCut(gcode: string, limits: MachineLimits): SafetyCheck {
  const zMoves = gcode.match(/[G01]\s+[^X].*?Z(-?\d+\.?\d*)/gi) || [];
  let maxZDepth = 0;

  for (const move of zMoves) {
    const zMatch = move.match(/Z(-?\d+\.?\d*)/);
    if (zMatch) {
      const zVal = Math.abs(parseFloat(zMatch[1]));
      maxZDepth = Math.max(maxZDepth, zVal);
    }
  }

  const passed = maxZDepth <= limits.maxDepthOfCut;
  return {
    name: 'Depth of Cut',
    passed,
    critical: true,
    message: passed ? `Depth of cut OK: ${maxZDepth.toFixed(1)}mm` : `Depth of cut ${maxZDepth.toFixed(1)}mm exceeds safe limit ${limits.maxDepthOfCut}mm`,
    value: maxZDepth,
    threshold: limits.maxDepthOfCut,
  };
}

function checkRapidMovements(gcode: string): SafetyCheck {
  const rapidCount = (gcode.match(/G0/gi) || []).length;
  const passed = rapidCount < 100;
  return {
    name: 'Rapid Movements',
    passed,
    critical: false,
    message: passed ? `Rapid movements OK: ${rapidCount}` : `Too many rapid movements: ${rapidCount}`,
    value: rapidCount,
    threshold: 100,
  };
}

function checkToolChanges(gcode: string): SafetyCheck {
  const toolChanges = (gcode.match(/T\d+\s*M6/gi) || []).length;
  const passed = true;
  return {
    name: 'Tool Changes',
    passed,
    critical: false,
    message: `Tool changes: ${toolChanges}`,
    value: toolChanges,
  };
}

function checkEndCode(gcode: string): SafetyCheck {
  const hasM30 = /M30/gi.test(gcode);
  const hasM2 = /M2\b/gi.test(gcode);
  const passed = hasM30 || hasM2;
  return {
    name: 'End Code',
    passed,
    critical: true,
    message: passed ? 'End code present' : 'Missing end code (M30 or M2)',
  };
}

function checkSafetyBlock(gcode: string): SafetyCheck {
  const hasUnits = /G21|G20/i.test(gcode);
  const hasAbsolute = /G90/i.test(gcode);
  const passed = hasUnits && hasAbsolute;
  return {
    name: 'Safety Block',
    passed,
    critical: true,
    message: passed ? 'Safety block present' : 'Missing safety block (G21/G90)',
  };
}

export const SemiSafetyValidator = { config: CONFIG, validateSafety };
export default SemiSafetyValidator;
