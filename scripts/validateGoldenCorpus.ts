#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { validateGcode, type BendSign } from "../artifacts/design-tool/src/validators/gcodeSafetyValidator.ts";

type GoldenProfile = {
  caseId: string;
  machineProfile?: { minSafeZ?: number };
  safety?: { highestMaterialZ?: number; safeClearanceMm?: number };
  expectedBendSequence?: number[];
};

type ExpectedValidatorSummary = {
  status: "PASS" | "FAIL";
  requiredSafeZ: number;
  actualBendSequence?: BendSign[];
  issueCodes: string[];
};

type ValidationRecord = {
  caseId: string;
  file: string;
  ok: boolean;
  message: string;
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text) as T;
}

function assertFinite(value: unknown, label: string, caseId: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${caseId}: missing finite ${label}`);
  }
  return value;
}

function asBendSigns(raw: number[] | undefined, caseId: string): BendSign[] | undefined {
  if (!raw) return undefined;
  if (raw.some(v => v !== -1 && v !== 1)) {
    throw new Error(`${caseId}: expectedBendSequence contains non BendSign values`);
  }
  return raw as BendSign[];
}

function compareSummary(
  expected: ExpectedValidatorSummary,
  actual: ReturnType<typeof validateGcode>,
  caseId: string,
  label: string,
): string[] {
  const errors: string[] = [];

  if (expected.status !== actual.status) {
    errors.push(`${caseId}/${label}: status mismatch expected=${expected.status} actual=${actual.status}`);
  }

  if (Number(expected.requiredSafeZ) !== Number(actual.requiredSafeZ)) {
    errors.push(`${caseId}/${label}: requiredSafeZ mismatch expected=${expected.requiredSafeZ} actual=${actual.requiredSafeZ}`);
  }

  if (expected.actualBendSequence) {
    const exp = JSON.stringify(expected.actualBendSequence);
    const act = JSON.stringify(actual.actualBendSequence);
    if (exp !== act) {
      errors.push(`${caseId}/${label}: actualBendSequence mismatch expected=${exp} actual=${act}`);
    }
  }

  const actualCodes = [...new Set(actual.issues.map(issue => issue.code))];
  const expectedCodes = expected.issueCodes;
  if (JSON.stringify(actualCodes) !== JSON.stringify(expectedCodes)) {
    errors.push(
      `${caseId}/${label}: issueCodes mismatch expected=${JSON.stringify(expectedCodes)} actual=${JSON.stringify(actualCodes)}`,
    );
  }

  return errors;
}

async function validateGcodeSummary(
  caseDir: string,
  profile: GoldenProfile,
  gcodeFileName: string,
  expectedFileName: string,
): Promise<ValidationRecord> {
  const caseId = profile.caseId;
  const gcodePath = path.join(caseDir, "expected", gcodeFileName);
  const expectedPath = path.join(caseDir, "expected", expectedFileName);

  const gcodeText = await fs.readFile(gcodePath, "utf8");
  const expectedSummary = await readJson<ExpectedValidatorSummary>(expectedPath);

  const result = validateGcode({
    gcodeText,
    highestMaterialZ: assertFinite(profile.safety?.highestMaterialZ, "safety.highestMaterialZ", caseId),
    safeClearanceMm: assertFinite(profile.safety?.safeClearanceMm, "safety.safeClearanceMm", caseId),
    machineProfile: { minSafeZ: assertFinite(profile.machineProfile?.minSafeZ, "machineProfile.minSafeZ", caseId) },
    expectedBendSequence: asBendSigns(profile.expectedBendSequence, caseId),
  });

  const errors = compareSummary(expectedSummary, result, caseId, gcodeFileName);
  return {
    caseId,
    file: gcodeFileName,
    ok: errors.length === 0,
    message: errors.length ? errors.join("; ") : `${caseId}/${gcodeFileName}: OK`,
  };
}

function validateNormalizedGeometryContract(caseId: string, normalized: unknown): ValidationRecord {
  const file = "normalized-geometry.json";
  if (!normalized || typeof normalized !== "object") {
    return { caseId, file, ok: false, message: `${caseId}/${file}: not an object` };
  }

  const shape = normalized as {
    status?: unknown;
    normalizedGeometry?: { polyline?: unknown };
  };

  const polyline = shape.normalizedGeometry?.polyline;
  if (!Array.isArray(polyline) || polyline.length < 4) {
    return { caseId, file, ok: false, message: `${caseId}/${file}: polyline invalid length` };
  }

  const parsed = polyline.map((pt, idx) => {
    if (!Array.isArray(pt) || pt.length !== 2) {
      throw new Error(`${caseId}/${file}: polyline[${idx}] is not [x,y]`);
    }
    const x = Number(pt[0]);
    const y = Number(pt[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`${caseId}/${file}: polyline[${idx}] has non-finite coordinate`);
    }
    return [x, y] as const;
  });

  const first = parsed[0];
  const last = parsed[parsed.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return { caseId, file, ok: false, message: `${caseId}/${file}: polyline must be closed (first point equals last)` };
  }

  for (let i = 1; i < parsed.length; i += 1) {
    if (parsed[i - 1][0] === parsed[i][0] && parsed[i - 1][1] === parsed[i][1]) {
      return { caseId, file, ok: false, message: `${caseId}/${file}: sequential duplicate points at index ${i - 1}/${i}` };
    }
  }

  if (shape.status !== "RECOVERED") {
    return { caseId, file, ok: false, message: `${caseId}/${file}: expected status RECOVERED` };
  }

  return { caseId, file, ok: true, message: `${caseId}/${file}: OK` };
}

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main(): Promise<void> {
  const root = path.join(REPO_ROOT, "testdata", "golden");
  const caseDirs = await fs.readdir(root, { withFileTypes: true });
  const records: ValidationRecord[] = [];

  for (const dirent of caseDirs) {
    if (!dirent.isDirectory()) continue;

    const caseDir = path.join(root, dirent.name);
    const profilePath = path.join(caseDir, "input", "profile.json");
    if (!(await exists(profilePath))) {
      records.push({ caseId: dirent.name, file: "profile.json", ok: false, message: `${dirent.name}: missing input/profile.json` });
      continue;
    }

    const profile = await readJson<GoldenProfile>(profilePath);

    if (await exists(path.join(caseDir, "expected", "export-safe.nc"))) {
      records.push(await validateGcodeSummary(caseDir, profile, "export-safe.nc", "validator-pass.json"));
    }

    if (await exists(path.join(caseDir, "expected", "export-unsafe.nc"))) {
      records.push(await validateGcodeSummary(caseDir, profile, "export-unsafe.nc", "validator-fail.json"));
    }

    const normalizedPath = path.join(caseDir, "expected", "normalized-geometry.json");
    if (await exists(normalizedPath)) {
      const normalized = await readJson<unknown>(normalizedPath);
      records.push(validateNormalizedGeometryContract(profile.caseId ?? dirent.name, normalized));
    }
  }

  const failures = records.filter(record => !record.ok);
  for (const record of records) {
    const prefix = record.ok ? "PASS" : "FAIL";
    process.stdout.write(`${prefix} ${record.message}\n`);
  }

  if (failures.length > 0) {
    process.exitCode = 1;
    throw new Error(`Golden corpus validation failed for ${failures.length} record(s).`);
  }
}

await main();
