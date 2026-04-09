#!/usr/bin/env tsx
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeRequiredSafeZ, validateGcode, type BendSign } from "../artifacts/design-tool/src/validators/gcodeSafetyValidator.ts";

type GoldenProfile = {
  caseId: string;
  machineProfile: { minSafeZ: number };
  safety: { highestMaterialZ: number; safeClearanceMm: number };
  expectedBendSequence?: BendSign[];
};

function fmt(value: number): string {
  return value.toFixed(3);
}

function renderDeterministicExport(profile: GoldenProfile): string {
  const safeZ = computeRequiredSafeZ({
    highestMaterialZ: profile.safety.highestMaterialZ,
    safeClearanceMm: profile.safety.safeClearanceMm,
    machineProfile: { minSafeZ: profile.machineProfile.minSafeZ },
  });

  const bends = profile.expectedBendSequence ?? [];
  const lines: string[] = [
    `; ${profile.caseId} deterministic starter export`,
    "G21",
    "G90",
    `G0 Z${fmt(safeZ)}`,
    "G0 X0.000 Y0.000",
  ];

  bends.forEach((bend, idx) => {
    const bendName = bend === -1 ? "BEND_LEFT" : "BEND_RIGHT";
    lines.push(`M201 ${bendName} A90.000`);
    lines.push(`G1 X${fmt((idx + 1) * 20)} Y0.000 Z${fmt(safeZ)}`);
  });

  lines.push(`G0 Z${fmt(safeZ + 5)}`);
  lines.push("M30");
  return `${lines.join("\n")}\n`;
}

function hashText(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function testDeterministicExport(caseDir: string): Promise<void> {
  const profilePath = path.join(caseDir, "input", "profile.json");
  const profile = JSON.parse(await fs.readFile(profilePath, "utf8")) as GoldenProfile;

  const outputA = renderDeterministicExport(profile);
  const outputB = renderDeterministicExport(profile);
  const outputC = renderDeterministicExport(profile);

  const hashA = hashText(outputA);
  const hashB = hashText(outputB);
  const hashC = hashText(outputC);

  assert(hashA === hashB && hashB === hashC, `${profile.caseId}: non-deterministic export hash mismatch`);

  const validation = validateGcode({
    gcodeText: outputA,
    highestMaterialZ: profile.safety.highestMaterialZ,
    safeClearanceMm: profile.safety.safeClearanceMm,
    machineProfile: { minSafeZ: profile.machineProfile.minSafeZ },
    expectedBendSequence: profile.expectedBendSequence,
  });

  assert(validation.status === "PASS", `${profile.caseId}: deterministic export is not safety-valid`);
  process.stdout.write(`PASS ${profile.caseId}: deterministic export hash=${hashA.slice(0, 12)} status=${validation.status}\n`);
}

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function runGeometryContractTests(): Promise<void> {
  const normalizedPath = path.join(REPO_ROOT, "testdata", "golden", "DIRTY-DXF-001", "expected", "normalized-geometry.json");
  const normalized = JSON.parse(await fs.readFile(normalizedPath, "utf8")) as {
    normalizedGeometry?: { polyline?: number[][] };
  };

  const polyline = normalized.normalizedGeometry?.polyline;
  assert(Array.isArray(polyline), "DIRTY-DXF-001: normalized polyline missing");
  const closedPolyline = polyline as number[][];
  assert(closedPolyline.length >= 4, "DIRTY-DXF-001: normalized polyline must have at least 4 points");

  for (let i = 0; i < closedPolyline.length; i += 1) {
    const [x, y] = closedPolyline[i] ?? [];
    assert(Number.isFinite(x) && Number.isFinite(y), `DIRTY-DXF-001: point ${i} is non-finite`);
  }

  const first = closedPolyline[0];
  const last = closedPolyline[closedPolyline.length - 1];
  assert(first[0] === last[0] && first[1] === last[1], "DIRTY-DXF-001: polyline is not closed");

  for (let i = 1; i < closedPolyline.length; i += 1) {
    assert(
      !(closedPolyline[i - 1][0] === closedPolyline[i][0] && closedPolyline[i - 1][1] === closedPolyline[i][1]),
      `DIRTY-DXF-001: duplicate sequential point at index ${i - 1}/${i}`,
    );
  }

  process.stdout.write("PASS DIRTY-DXF-001: geometry contract checks passed\n");
}

async function main(): Promise<void> {
  const goldenRoot = path.join(REPO_ROOT, "testdata", "golden");
  await testDeterministicExport(path.join(goldenRoot, "U-CH-003"));
  await testDeterministicExport(path.join(goldenRoot, "CNC-RISK-006"));
  await runGeometryContractTests();
}

await main();
