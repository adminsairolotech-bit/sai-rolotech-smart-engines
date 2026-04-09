import type { ProfileGeometry } from "../lib/dxf-parser-util.js";
import { generateFlowerPattern } from "../lib/power-pattern.js";
import { generatePhase2RollTooling } from "../lib/phase2-roll-tooling-engine.js";
import { generatePhase3Simulation } from "../lib/phase3-simulation-engine.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function test(name: string, fn: () => void): void {
  try {
    fn();
    // eslint-disable-next-line no-console
    console.log(`  PASS ${name}`);
    passed += 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error(`  FAIL ${name}`);
    // eslint-disable-next-line no-console
    console.error(`    -> ${message}`);
    failed += 1;
  }
}

function classifyRisk(rank: "LOW" | "MEDIUM" | "HIGH"): number {
  if (rank === "LOW") return 1;
  if (rank === "MEDIUM") return 2;
  return 3;
}

const GEO_U_PROFILE: ProfileGeometry = {
  segments: [
    { type: "line", x1: 0, y1: 40, x2: 0, y2: 10, length: 30 },
    { type: "arc", x1: 0, y1: 10, x2: 10, y2: 0, radius: 10, cx: 10, cy: 10, startAngle: 180, endAngle: 270, length: Math.PI * 10 / 2 },
    { type: "line", x1: 10, y1: 0, x2: 50, y2: 0, length: 40 },
    { type: "arc", x1: 50, y1: 0, x2: 60, y2: 10, radius: 10, cx: 50, cy: 10, startAngle: 270, endAngle: 360, length: Math.PI * 10 / 2 },
    { type: "line", x1: 60, y1: 10, x2: 60, y2: 40, length: 30 },
  ],
  bends: [
    { angle: 90, radius: 10, segmentIndex: 1, side: "left", direction: "up" },
    { angle: 90, radius: 10, segmentIndex: 3, side: "right", direction: "up" },
  ],
  totalLength: 131.416,
  boundingBox: { minX: 0, minY: 0, maxX: 60, maxY: 40, width: 60, height: 40 },
};

const GEO_C_PROFILE: ProfileGeometry = {
  segments: [
    { type: "line", x1: 0, y1: 15, x2: 0, y2: 0, length: 15 },
    { type: "arc", x1: 0, y1: 0, x2: 5, y2: -5, radius: 5, cx: 5, cy: 0, startAngle: 180, endAngle: 270, length: Math.PI * 5 / 2 },
    { type: "line", x1: 5, y1: -5, x2: 55, y2: -5, length: 50 },
    { type: "arc", x1: 55, y1: -5, x2: 60, y2: 0, radius: 5, cx: 55, cy: 0, startAngle: 270, endAngle: 360, length: Math.PI * 5 / 2 },
    { type: "line", x1: 60, y1: 0, x2: 60, y2: 45, length: 45 },
    { type: "arc", x1: 60, y1: 45, x2: 55, y2: 50, radius: 5, cx: 55, cy: 45, startAngle: 0, endAngle: 90, length: Math.PI * 5 / 2 },
    { type: "line", x1: 55, y1: 50, x2: 5, y2: 50, length: 50 },
    { type: "arc", x1: 5, y1: 50, x2: 0, y2: 45, radius: 5, cx: 5, cy: 45, startAngle: 90, endAngle: 180, length: Math.PI * 5 / 2 },
    { type: "line", x1: 0, y1: 45, x2: 0, y2: 30, length: 15 },
  ],
  bends: [
    { angle: 90, radius: 5, segmentIndex: 1, side: "left", direction: "down" },
    { angle: 90, radius: 5, segmentIndex: 3, side: "right", direction: "up" },
    { angle: 90, radius: 5, segmentIndex: 5, side: "right", direction: "up" },
    { angle: 90, radius: 5, segmentIndex: 7, side: "left", direction: "down" },
  ],
  totalLength: 206.416,
  boundingBox: { minX: 0, minY: -5, maxX: 60, maxY: 50, width: 60, height: 55 },
};

const GEO_HAT_PROFILE: ProfileGeometry = {
  segments: [
    { type: "line", x1: 0, y1: 0, x2: 18, y2: 0, length: 18 },
    { type: "arc", x1: 18, y1: 0, x2: 22, y2: 4, radius: 4, cx: 22, cy: 0, startAngle: 180, endAngle: 270, length: Math.PI * 4 / 2 },
    { type: "line", x1: 22, y1: 4, x2: 22, y2: 18, length: 14 },
    { type: "arc", x1: 22, y1: 18, x2: 26, y2: 22, radius: 4, cx: 26, cy: 18, startAngle: 180, endAngle: 90, length: Math.PI * 4 / 2 },
    { type: "line", x1: 26, y1: 22, x2: 54, y2: 22, length: 28 },
    { type: "arc", x1: 54, y1: 22, x2: 58, y2: 18, radius: 4, cx: 54, cy: 18, startAngle: 90, endAngle: 0, length: Math.PI * 4 / 2 },
    { type: "line", x1: 58, y1: 18, x2: 58, y2: 4, length: 14 },
    { type: "arc", x1: 58, y1: 4, x2: 62, y2: 0, radius: 4, cx: 58, cy: 0, startAngle: 270, endAngle: 360, length: Math.PI * 4 / 2 },
    { type: "line", x1: 62, y1: 0, x2: 80, y2: 0, length: 18 },
  ],
  bends: [
    { angle: 90, radius: 4, segmentIndex: 1, side: "left", direction: "up" },
    { angle: 90, radius: 4, segmentIndex: 3, side: "left", direction: "up" },
    { angle: 90, radius: 4, segmentIndex: 5, side: "right", direction: "down" },
    { angle: 90, radius: 4, segmentIndex: 7, side: "right", direction: "down" },
  ],
  totalLength: 142.132,
  boundingBox: { minX: 0, minY: 0, maxX: 80, maxY: 22, width: 80, height: 22 },
};

interface BenchmarkCase {
  name: string;
  geometry: ProfileGeometry;
  material: string;
  thickness: number;
  stations: number;
  minRetention: number;
  maxRetention: number;
  minMeanSpringback: number;
  maxMeanSpringback: number;
  allowedRisk: Array<"LOW" | "MEDIUM" | "HIGH">;
}

function runBenchmarkCase(benchmark: BenchmarkCase) {
  const flower = generateFlowerPattern(
    benchmark.geometry,
    benchmark.stations,
    "B",
    benchmark.material,
    benchmark.thickness,
  );
  const phase2 = generatePhase2RollTooling({
    flowerStations: flower.stations,
    flowerPasses: flower.passes,
    profileGeometry: benchmark.geometry,
    material: benchmark.material,
    thickness: benchmark.thickness,
  });
  const phase3 = generatePhase3Simulation({
    flowerStations: flower.stations,
    flowerPasses: flower.passes,
    rollStations: phase2.rollStations,
    rollGeometryByStation: phase2.rollGeometryByStation,
    material: benchmark.material,
    thickness: benchmark.thickness,
  });

  const totalTargetAngle = flower.totalBendAngle;
  const totalEffectiveAngle = phase3.stationSimulation[phase3.stationSimulation.length - 1]?.cumulativeEffectiveAngle ?? 0;
  const retentionRatio = totalTargetAngle > 0 ? totalEffectiveAngle / totalTargetAngle : 0;
  const meanSpringbackRatio = phase3.springbackAdjusted.passes.length > 0
    ? phase3.springbackAdjusted.passes.reduce((sum, pass) => {
      return sum + (pass.inputAngle > 0 ? pass.recoveredAngle / pass.inputAngle : 0);
    }, 0) / phase3.springbackAdjusted.passes.length
    : 0;
  const finalAngleError = Math.abs(totalTargetAngle - totalEffectiveAngle);

  return {
    flower,
    phase2,
    phase3,
    totalTargetAngle,
    totalEffectiveAngle,
    retentionRatio,
    meanSpringbackRatio,
    finalAngleError,
  };
}

const BENCHMARK_CASES: BenchmarkCase[] = [
  {
    name: "U profile GI 1.0mm benchmark",
    geometry: GEO_U_PROFILE,
    material: "GI",
    thickness: 1.0,
    stations: 5,
    minRetention: 0.992,
    maxRetention: 1.0,
    minMeanSpringback: 0.002,
    maxMeanSpringback: 0.012,
    allowedRisk: ["HIGH"],
  },
  {
    name: "C profile CRCA 1.2mm benchmark",
    geometry: GEO_C_PROFILE,
    material: "CRCA",
    thickness: 1.2,
    stations: 7,
    minRetention: 0.992,
    maxRetention: 1.0,
    minMeanSpringback: 0.002,
    maxMeanSpringback: 0.012,
    allowedRisk: ["HIGH"],
  },
  {
    name: "Hat profile SS304 1.0mm benchmark",
    geometry: GEO_HAT_PROFILE,
    material: "SS304",
    thickness: 1.0,
    stations: 8,
    minRetention: 0.988,
    maxRetention: 1.0,
    minMeanSpringback: 0.004,
    maxMeanSpringback: 0.02,
    allowedRisk: ["HIGH"],
  },
];

// eslint-disable-next-line no-console
console.log("\nPHASE-3 VALIDATION BENCHMARKS");

for (const benchmark of BENCHMARK_CASES) {
  test(benchmark.name, () => {
    const result = runBenchmarkCase(benchmark);
    assert(result.phase3.stationSimulation.length === benchmark.stations, `${benchmark.name}: station count mismatch`);
    assert(result.phase3.shapeEvolution.length === benchmark.stations, `${benchmark.name}: shape evolution should cover all stations`);
    assert(result.phase3.finalProfile !== null, `${benchmark.name}: final profile must exist`);
    assert(
      result.retentionRatio >= benchmark.minRetention && result.retentionRatio <= benchmark.maxRetention,
      `${benchmark.name}: retention ratio ${result.retentionRatio.toFixed(4)} outside window ${benchmark.minRetention}-${benchmark.maxRetention}`,
    );
    assert(
      result.meanSpringbackRatio >= benchmark.minMeanSpringback &&
      result.meanSpringbackRatio <= benchmark.maxMeanSpringback,
      `${benchmark.name}: mean springback ${result.meanSpringbackRatio.toFixed(4)} outside window ${benchmark.minMeanSpringback}-${benchmark.maxMeanSpringback}`,
    );
    assert(
      benchmark.allowedRisk.includes(result.phase3.overallRisk),
      `${benchmark.name}: overall risk ${result.phase3.overallRisk} not in allowed set ${benchmark.allowedRisk.join("/")}`,
    );
    assert(
      result.finalAngleError <= result.totalTargetAngle * (1 - benchmark.minRetention) + 1,
      `${benchmark.name}: final angle error ${result.finalAngleError.toFixed(3)} too high`,
    );
  });
}

test("material benchmark: SS304 springs back more than GI on same U profile", () => {
  const gi = runBenchmarkCase({
    name: "U profile GI compare",
    geometry: GEO_U_PROFILE,
    material: "GI",
    thickness: 1.0,
    stations: 5,
    minRetention: 0.75,
    maxRetention: 0.99,
    minMeanSpringback: 0.02,
    maxMeanSpringback: 0.2,
    allowedRisk: ["LOW", "MEDIUM"],
  });
  const ss = runBenchmarkCase({
    name: "U profile SS compare",
    geometry: GEO_U_PROFILE,
    material: "SS304",
    thickness: 1.0,
    stations: 5,
    minRetention: 0.65,
    maxRetention: 0.96,
    minMeanSpringback: 0.03,
    maxMeanSpringback: 0.25,
    allowedRisk: ["LOW", "MEDIUM", "HIGH"],
  });

  assert(
    ss.meanSpringbackRatio > gi.meanSpringbackRatio,
    `SS mean springback ${ss.meanSpringbackRatio.toFixed(4)} should exceed GI ${gi.meanSpringbackRatio.toFixed(4)}`,
  );
  assert(
    ss.phase3.peakStressMPa > gi.phase3.peakStressMPa,
    `SS peak stress ${ss.phase3.peakStressMPa} should exceed GI ${gi.phase3.peakStressMPa}`,
  );
  assert(
    ss.retentionRatio < gi.retentionRatio,
    `SS retention ${ss.retentionRatio.toFixed(4)} should be lower than GI ${gi.retentionRatio.toFixed(4)}`,
  );
});

test("material benchmark: titanium case stays riskier than CRCA for same hat geometry", () => {
  const cr = runBenchmarkCase({
    name: "Hat profile CRCA compare",
    geometry: GEO_HAT_PROFILE,
    material: "CRCA",
    thickness: 1.4,
    stations: 8,
    minRetention: 0.7,
    maxRetention: 0.98,
    minMeanSpringback: 0.03,
    maxMeanSpringback: 0.22,
    allowedRisk: ["LOW", "MEDIUM", "HIGH"],
  });
  const ti = runBenchmarkCase({
    name: "Hat profile TI compare",
    geometry: GEO_HAT_PROFILE,
    material: "TI",
    thickness: 1.4,
    stations: 8,
    minRetention: 0.55,
    maxRetention: 0.95,
    minMeanSpringback: 0.05,
    maxMeanSpringback: 0.3,
    allowedRisk: ["MEDIUM", "HIGH"],
  });

  assert(
    classifyRisk(ti.phase3.overallRisk) >= classifyRisk(cr.phase3.overallRisk),
    `Titanium risk ${ti.phase3.overallRisk} should not be below CRCA ${cr.phase3.overallRisk}`,
  );
  assert(
    ti.meanSpringbackRatio > cr.meanSpringbackRatio,
    `Titanium mean springback ${ti.meanSpringbackRatio.toFixed(4)} should exceed CRCA ${cr.meanSpringbackRatio.toFixed(4)}`,
  );
});

// eslint-disable-next-line no-console
console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
