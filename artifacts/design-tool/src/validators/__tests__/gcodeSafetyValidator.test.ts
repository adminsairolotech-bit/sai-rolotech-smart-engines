import { describe, expect, it } from "vitest";
import {
  computeRequiredSafeZ,
  formatValidationResultMarkdown,
  parseGcode,
  validateGcode,
  type GcodeValidationInput,
} from "../gcodeSafetyValidator";

const SAFE_GCODE = `; Safe U-channel station program
G21
G90
G0 Z15.0
G0 X0.0 Y0.0
M201 BEND_LEFT A90.000
G1 X20.0 Y0.0 Z15.0
M201 BEND_RIGHT A90.000
G1 X40.0 Y0.0 Z15.0
M201 BEND_LEFT A90.000
G0 Z22.0
M30`;

function makeInput(overrides: Partial<GcodeValidationInput> = {}): GcodeValidationInput {
  return {
    gcodeText: SAFE_GCODE,
    highestMaterialZ: 8,
    safeClearanceMm: 5,
    machineProfile: { minSafeZ: 12, machineName: "SRX-1000" },
    expectedBendSequence: [-1, 1, -1],
    ...overrides,
  };
}

describe("gcodeSafetyValidator", () => {
  it("computes required safe Z", () => {
    const z = computeRequiredSafeZ({
      highestMaterialZ: 7,
      safeClearanceMm: 4,
      machineProfile: { minSafeZ: 12 },
    });
    expect(z).toBe(12);
  });

  it("parses valid safe G-code", () => {
    const parsed = parseGcode(SAFE_GCODE);
    expect(parsed.some(line => line.command === "G21")).toBe(true);
    expect(parsed.some(line => line.command === "G90")).toBe(true);
    expect(parsed.filter(line => line.command === "M201").length).toBe(3);
    expect(parsed.some(line => line.command === "M30")).toBe(true);
  });

  it("passes safe G-code", () => {
    const result = validateGcode(makeInput());
    expect(result.status).toBe("PASS");
    expect(result.issues).toHaveLength(0);
  });

  it("fails on unsafe lateral move", () => {
    const result = validateGcode(
      makeInput({
        gcodeText: `G21\nG90\nG0 Z8\nG1 X5 Y0\nM30`,
      }),
    );
    expect(result.status).toBe("FAIL");
    expect(result.issues.some(issue => issue.code === "UNSAFE_LATERAL_MOVE")).toBe(true);
  });

  it("fails on wrong bend sequence", () => {
    const result = validateGcode(
      makeInput({
        expectedBendSequence: [1, -1, 1],
      }),
    );
    expect(result.status).toBe("FAIL");
    expect(result.issues.some(issue => issue.code === "BEND_DIRECTION_MISMATCH")).toBe(true);
  });

  it("fails on missing final retract", () => {
    const result = validateGcode(
      makeInput({
        gcodeText: `G21\nG90\nG0 Z15\nG1 X10 Y0 Z10\nM30`,
      }),
    );
    expect(result.issues.some(issue => issue.code === "MISSING_FINAL_RETRACT")).toBe(true);
  });

  it("fails on missing G21", () => {
    const result = validateGcode(
      makeInput({
        gcodeText: SAFE_GCODE.replace("G21\n", ""),
      }),
    );
    expect(result.issues.some(issue => issue.code === "MISSING_METRIC_MODE")).toBe(true);
  });

  it("fails on missing G90", () => {
    const result = validateGcode(
      makeInput({
        gcodeText: SAFE_GCODE.replace("G90\n", ""),
      }),
    );
    expect(result.issues.some(issue => issue.code === "MISSING_ABSOLUTE_MODE")).toBe(true);
  });

  it("fails on malformed bend command", () => {
    const result = validateGcode(
      makeInput({
        gcodeText: `G21\nG90\nG0 Z15\nM201 BEND_LEFT90\nG0 Z20\nM30`,
      }),
    );
    expect(result.issues.some(issue => issue.code === "MALFORMED_BEND_COMMAND")).toBe(true);
  });

  it("produces deterministic issue ordering", () => {
    const gcode = `G1 X10 Y0 Z0\nM201 BEND_RIGHT A90\n`;
    const first = validateGcode(
      makeInput({
        gcodeText: gcode,
        expectedBendSequence: [-1, 1, -1],
      }),
    );
    const second = validateGcode(
      makeInput({
        gcodeText: gcode,
        expectedBendSequence: [-1, 1, -1],
      }),
    );

    expect(first.issues.map(issue => issue.code)).toEqual(second.issues.map(issue => issue.code));
  });

  it("formats markdown output", () => {
    const result = validateGcode(makeInput());
    const markdown = formatValidationResultMarkdown(result);
    expect(markdown).toContain("## G-code Safety Validation");
    expect(markdown).toContain("Status: **PASS**");
    expect(markdown).toContain("### Issues");
  });
});
