export type BendSign = -1 | 1;

export type ValidationSeverity = "CRITICAL" | "WARNING" | "INFO";

export type ValidationStatus = "PASS" | "FAIL";

export interface GcodeValidationInput {
  gcodeText: string;
  highestMaterialZ: number;
  safeClearanceMm: number;
  machineProfile: {
    minSafeZ: number;
    machineName?: string;
  };
  expectedBendSequence?: BendSign[];
}

export interface ValidationIssue {
  code:
    | "INVALID_VALIDATION_INPUT"
    | "INVALID_MACHINE_PROFILE"
    | "MISSING_METRIC_MODE"
    | "MISSING_ABSOLUTE_MODE"
    | "UNSAFE_LATERAL_MOVE"
    | "MALFORMED_BEND_COMMAND"
    | "BEND_DIRECTION_MISMATCH"
    | "BEND_COUNT_MISMATCH"
    | "MISSING_PROGRAM_END"
    | "MISSING_FINAL_RETRACT";
  severity: ValidationSeverity;
  message: string;
  lineNumber?: number;
  details?: Record<string, unknown>;
}

export interface GcodeValidationResult {
  status: ValidationStatus;
  score: number;
  requiredSafeZ: number;
  parsedLineCount: number;
  actualBendSequence: BendSign[];
  issues: ValidationIssue[];
}

type ParsedLine = {
  lineNumber: number;
  raw: string;
  stripped: string;
  hasComment: boolean;
  command?: string;
  x?: number;
  y?: number;
  z?: number;
  bendSign?: BendSign;
  bendAngleDeg?: number;
  malformedBend?: boolean;
};

const CRITICAL_PENALTY = 25;
const WARNING_PENALTY = 10;

const ISSUE_ORDER: Record<ValidationIssue["code"], number> = {
  INVALID_VALIDATION_INPUT: 1,
  INVALID_MACHINE_PROFILE: 2,
  MISSING_METRIC_MODE: 3,
  MISSING_ABSOLUTE_MODE: 4,
  MALFORMED_BEND_COMMAND: 5,
  UNSAFE_LATERAL_MOVE: 6,
  BEND_DIRECTION_MISMATCH: 7,
  BEND_COUNT_MISMATCH: 8,
  MISSING_FINAL_RETRACT: 9,
  MISSING_PROGRAM_END: 10,
};

const NUMBER_TOKEN = "([+-]?\\d+(?:\\.\\d+)?)";

function parseAxis(stripped: string, axis: "X" | "Y" | "Z"): number | undefined {
  const m = stripped.match(new RegExp(`\\b${axis}${NUMBER_TOKEN}\\b`, "i"));
  return m ? Number(m[1]) : undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function pushIssue(issues: ValidationIssue[], issue: ValidationIssue): void {
  issues.push(issue);
}

export function computeRequiredSafeZ(input: {
  highestMaterialZ: number;
  safeClearanceMm: number;
  machineProfile: { minSafeZ: number };
}): number {
  const clearanceTop = input.highestMaterialZ + input.safeClearanceMm;
  return Math.max(clearanceTop, input.machineProfile.minSafeZ);
}

export function parseGcode(gcodeText: string): ParsedLine[] {
  const lines = gcodeText.split(/\r?\n/);

  return lines.map((raw, idx) => {
    const lineNumber = idx + 1;
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      return {
        lineNumber,
        raw,
        stripped: "",
        hasComment: false,
      };
    }

    const commentStart = trimmed.indexOf(";");
    const stripped = commentStart >= 0 ? trimmed.slice(0, commentStart).trim() : trimmed;

    const parsed: ParsedLine = {
      lineNumber,
      raw,
      stripped,
      hasComment: commentStart >= 0,
    };

    if (!stripped) {
      return parsed;
    }

    const motion = stripped.match(/\b(G0|G00|G1|G01)\b/i);
    if (motion) {
      parsed.command = motion[1].toUpperCase();
      parsed.x = parseAxis(stripped, "X");
      parsed.y = parseAxis(stripped, "Y");
      parsed.z = parseAxis(stripped, "Z");
      return parsed;
    }

    const simple = stripped.match(/\b(G21|G90|M30)\b/i);
    if (simple) {
      parsed.command = simple[1].toUpperCase();
      return parsed;
    }

    if (/\bM201\b/i.test(stripped)) {
      const bend = stripped.match(/^M201\s+(BEND_LEFT|BEND_RIGHT)\s+A([+-]?\d+(?:\.\d+)?)\s*$/i);
      if (!bend) {
        parsed.command = "M201";
        parsed.malformedBend = true;
        return parsed;
      }

      parsed.command = "M201";
      parsed.bendSign = bend[1].toUpperCase() === "BEND_LEFT" ? -1 : 1;
      parsed.bendAngleDeg = Number(bend[2]);
      return parsed;
    }

    return parsed;
  });
}

export function validateGcode(input: GcodeValidationInput): GcodeValidationResult {
  const issues: ValidationIssue[] = [];

  const hasValidInput =
    typeof input.gcodeText === "string" &&
    input.gcodeText.trim().length > 0 &&
    isFiniteNumber(input.highestMaterialZ) &&
    isFiniteNumber(input.safeClearanceMm);

  if (!hasValidInput) {
    pushIssue(issues, {
      code: "INVALID_VALIDATION_INPUT",
      severity: "CRITICAL",
      message: "Validation input is malformed: gcodeText/highestMaterialZ/safeClearanceMm are required.",
    });
  }

  if (!input.machineProfile || !isFiniteNumber(input.machineProfile.minSafeZ) || input.machineProfile.minSafeZ < 0) {
    pushIssue(issues, {
      code: "INVALID_MACHINE_PROFILE",
      severity: "CRITICAL",
      message: "Machine profile is invalid: minSafeZ must be a finite, non-negative number.",
    });
  }

  if (!hasValidInput || issues.some(i => i.code === "INVALID_MACHINE_PROFILE")) {
    const sortedBase = [...issues].sort((a, b) => ISSUE_ORDER[a.code] - ISSUE_ORDER[b.code]);
    return {
      status: "FAIL",
      score: 0,
      requiredSafeZ: Number.NaN,
      parsedLineCount: 0,
      actualBendSequence: [],
      issues: sortedBase,
    };
  }

  const requiredSafeZ = computeRequiredSafeZ(input);
  const parsed = parseGcode(input.gcodeText);

  let hasMetricMode = false;
  let hasAbsoluteMode = false;
  let hasProgramEnd = false;

  let currentX: number | undefined;
  let currentY: number | undefined;
  let currentZ: number | undefined;
  let zBeforeM30: number | undefined;

  const actualBendSequence: BendSign[] = [];

  for (const line of parsed) {
    if (line.command === "G21") hasMetricMode = true;
    if (line.command === "G90") hasAbsoluteMode = true;
    if (line.command === "M30") {
      hasProgramEnd = true;
      zBeforeM30 = currentZ;
    }

    if (line.malformedBend) {
      pushIssue(issues, {
        code: "MALFORMED_BEND_COMMAND",
        severity: "CRITICAL",
        lineNumber: line.lineNumber,
        message: "Malformed M201 bend command. Expected format: M201 BEND_LEFT|BEND_RIGHT A<angle>.",
      });
    }

    if (line.command === "M201" && typeof line.bendSign !== "undefined") {
      actualBendSequence.push(line.bendSign);
    }

    if (!line.command || !/^(G0|G00|G1|G01)$/.test(line.command)) {
      continue;
    }

    const nextX = typeof line.x === "number" ? line.x : currentX;
    const nextY = typeof line.y === "number" ? line.y : currentY;
    const nextZ = typeof line.z === "number" ? line.z : currentZ;

    const lateralChanged =
      (typeof line.x === "number" && line.x !== currentX) ||
      (typeof line.y === "number" && line.y !== currentY);

    if (lateralChanged) {
      const zForSafety = typeof nextZ === "number" ? nextZ : -Infinity;
      if (zForSafety < requiredSafeZ) {
        pushIssue(issues, {
          code: "UNSAFE_LATERAL_MOVE",
          severity: "CRITICAL",
          lineNumber: line.lineNumber,
          message: `Lateral move executed below safe Z. Required >= ${requiredSafeZ.toFixed(3)} mm, found ${zForSafety.toFixed(3)} mm.`,
          details: {
            requiredSafeZ,
            actualZ: zForSafety,
            x: nextX,
            y: nextY,
          },
        });
      }
    }

    currentX = nextX;
    currentY = nextY;
    currentZ = nextZ;
  }

  if (!hasMetricMode) {
    pushIssue(issues, {
      code: "MISSING_METRIC_MODE",
      severity: "CRITICAL",
      message: "Missing G21 metric mode command.",
    });
  }

  if (!hasAbsoluteMode) {
    pushIssue(issues, {
      code: "MISSING_ABSOLUTE_MODE",
      severity: "CRITICAL",
      message: "Missing G90 absolute mode command.",
    });
  }

  if (input.expectedBendSequence) {
    const expected = input.expectedBendSequence;
    const minLen = Math.min(expected.length, actualBendSequence.length);

    for (let idx = 0; idx < minLen; idx += 1) {
      if (expected[idx] !== actualBendSequence[idx]) {
        pushIssue(issues, {
          code: "BEND_DIRECTION_MISMATCH",
          severity: "CRITICAL",
          message: `Bend direction mismatch at index ${idx}: expected ${expected[idx]}, got ${actualBendSequence[idx]}.`,
          details: {
            index: idx,
            expected: expected[idx],
            actual: actualBendSequence[idx],
          },
        });
      }
    }

    if (expected.length !== actualBendSequence.length) {
      pushIssue(issues, {
        code: "BEND_COUNT_MISMATCH",
        severity: "CRITICAL",
        message: `Bend count mismatch: expected ${expected.length}, got ${actualBendSequence.length}.`,
        details: {
          expectedCount: expected.length,
          actualCount: actualBendSequence.length,
        },
      });
    }
  }

  if (!hasProgramEnd) {
    pushIssue(issues, {
      code: "MISSING_PROGRAM_END",
      severity: "CRITICAL",
      message: "Missing M30 end-of-program command.",
    });
  }

  const finalZ = hasProgramEnd ? zBeforeM30 : currentZ;
  if (typeof finalZ !== "number" || finalZ < requiredSafeZ) {
    pushIssue(issues, {
      code: "MISSING_FINAL_RETRACT",
      severity: "CRITICAL",
      message: `Program did not retract to safe Z before end. Required >= ${requiredSafeZ.toFixed(3)} mm.`,
      details: {
        requiredSafeZ,
        finalZ,
      },
    });
  }

  const sortedIssues = [...issues].sort((a, b) => {
    const orderDiff = ISSUE_ORDER[a.code] - ISSUE_ORDER[b.code];
    if (orderDiff !== 0) return orderDiff;
    const lineA = a.lineNumber ?? Number.MAX_SAFE_INTEGER;
    const lineB = b.lineNumber ?? Number.MAX_SAFE_INTEGER;
    if (lineA !== lineB) return lineA - lineB;
    return a.message.localeCompare(b.message);
  });

  const penalty = sortedIssues.reduce((acc, issue) => {
    if (issue.severity === "CRITICAL") return acc + CRITICAL_PENALTY;
    if (issue.severity === "WARNING") return acc + WARNING_PENALTY;
    return acc;
  }, 0);

  const score = Math.max(0, 100 - penalty);
  const hasCritical = sortedIssues.some(issue => issue.severity === "CRITICAL");

  return {
    status: hasCritical ? "FAIL" : "PASS",
    score,
    requiredSafeZ,
    parsedLineCount: parsed.length,
    actualBendSequence,
    issues: sortedIssues,
  };
}

export function formatValidationResultMarkdown(result: GcodeValidationResult): string {
  const lines: string[] = [];
  lines.push("## G-code Safety Validation");
  lines.push(`- Status: **${result.status}**`);
  lines.push(`- Score: **${result.score}**`);
  lines.push(`- Required Safe Z: **${Number.isFinite(result.requiredSafeZ) ? result.requiredSafeZ.toFixed(3) : "N/A"} mm**`);
  lines.push(`- Parsed Lines: **${result.parsedLineCount}**`);
  lines.push(`- Bend Sequence: **[${result.actualBendSequence.join(", ")}]**`);

  if (result.issues.length === 0) {
    lines.push("\n### Issues\n- None");
    return lines.join("\n");
  }

  lines.push("\n### Issues");
  for (const issue of result.issues) {
    const location = issue.lineNumber ? ` (line ${issue.lineNumber})` : "";
    lines.push(`- [${issue.severity}] ${issue.code}${location}: ${issue.message}`);
  }

  return lines.join("\n");
}
