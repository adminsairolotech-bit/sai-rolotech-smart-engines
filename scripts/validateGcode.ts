#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  formatValidationResultMarkdown,
  validateGcode,
  type BendSign,
  type GcodeValidationInput,
} from "../artifacts/design-tool/src/validators/gcodeSafetyValidator.ts";

type CliArgs = {
  gcodeFile: string;
  profileFile?: string;
  highestMaterialZ?: number;
  safeClearanceMm?: number;
  minSafeZ?: number;
  expectedBendSequence?: BendSign[];
};

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolvePath(inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.join(REPO_ROOT, inputPath);
}

type ProfileShape = {
  machineProfile?: { minSafeZ?: number };
  safety?: { highestMaterialZ?: number; safeClearanceMm?: number };
  expectedBendSequence?: number[];
};

function parseNumber(value: string, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid number for ${label}: ${value}`);
  }
  return n;
}

function parseBendSequence(raw: string): BendSign[] {
  const parsed = raw
    .split(",")
    .map(v => v.trim())
    .filter(Boolean)
    .map(Number);

  if (parsed.some(v => v !== -1 && v !== 1)) {
    throw new Error(`Invalid bend sequence: ${raw}. Allowed values are -1 or 1.`);
  }

  return parsed as BendSign[];
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { gcodeFile: "" };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === "--gcode-file" && next) {
      args.gcodeFile = next;
      i += 1;
      continue;
    }

    if (token === "--profile-file" && next) {
      args.profileFile = next;
      i += 1;
      continue;
    }

    if (token === "--highest-material-z" && next) {
      args.highestMaterialZ = parseNumber(next, "highest-material-z");
      i += 1;
      continue;
    }

    if (token === "--safe-clearance" && next) {
      args.safeClearanceMm = parseNumber(next, "safe-clearance");
      i += 1;
      continue;
    }

    if (token === "--min-safe-z" && next) {
      args.minSafeZ = parseNumber(next, "min-safe-z");
      i += 1;
      continue;
    }

    if (token === "--expected-bends" && next) {
      args.expectedBendSequence = parseBendSequence(next);
      i += 1;
      continue;
    }

    if (token === "--") {
      continue;
    }

    if (token === "--help" || token === "-h") {
      printUsage();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  if (!args.gcodeFile) {
    throw new Error("Missing required argument: --gcode-file <path>");
  }

  return args;
}

function printUsage(): void {
  const usage = `Usage: pnpm tsx scripts/validateGcode.ts --gcode-file <file> [options]\n\nOptions:\n  --profile-file <file>      Profile JSON containing safety + machineProfile\n  --highest-material-z <n>   Override profile safety.highestMaterialZ\n  --safe-clearance <n>       Override profile safety.safeClearanceMm\n  --min-safe-z <n>           Override profile machineProfile.minSafeZ\n  --expected-bends <csv>     Override expected bend sequence, e.g. -1,1,-1\n  --help                     Show help\n`;
  process.stdout.write(usage);
}

async function readJson<T>(filePath: string): Promise<T> {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text) as T;
}

function coerceExpectedBends(raw: number[] | undefined): BendSign[] | undefined {
  if (!raw) return undefined;
  if (raw.some(v => v !== -1 && v !== 1)) {
    throw new Error("expectedBendSequence in profile contains unsupported values.");
  }
  return raw as BendSign[];
}


function requireFinite(value: number | undefined, message: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(message);
  }
  return value as number;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const resolvedGcode = resolvePath(args.gcodeFile);
  const gcodeText = await fs.readFile(resolvedGcode, "utf8");

  let profile: ProfileShape | undefined;
  if (args.profileFile) {
    const resolvedProfile = resolvePath(args.profileFile);
    profile = await readJson<ProfileShape>(resolvedProfile);
  }

  const highestMaterialZ = args.highestMaterialZ ?? profile?.safety?.highestMaterialZ;
  const safeClearanceMm = args.safeClearanceMm ?? profile?.safety?.safeClearanceMm;
  const minSafeZ = args.minSafeZ ?? profile?.machineProfile?.minSafeZ;
  const expectedBendSequence = args.expectedBendSequence ?? coerceExpectedBends(profile?.expectedBendSequence);

  const resolvedHighestMaterialZ = requireFinite(
    highestMaterialZ,
    "Missing highest material Z. Provide --highest-material-z or profile.safety.highestMaterialZ.",
  );

  const resolvedSafeClearanceMm = requireFinite(
    safeClearanceMm,
    "Missing safe clearance. Provide --safe-clearance or profile.safety.safeClearanceMm.",
  );

  const resolvedMinSafeZ = requireFinite(
    minSafeZ,
    "Missing machine min safe Z. Provide --min-safe-z or profile.machineProfile.minSafeZ.",
  );

  const input: GcodeValidationInput = {
    gcodeText,
    highestMaterialZ: resolvedHighestMaterialZ,
    safeClearanceMm: resolvedSafeClearanceMm,
    machineProfile: { minSafeZ: resolvedMinSafeZ },
    expectedBendSequence,
  };

  const result = validateGcode(input);
  process.stdout.write(`${formatValidationResultMarkdown(result)}\n`);

  if (result.status !== "PASS") {
    process.exitCode = 1;
  }
}

await main();
