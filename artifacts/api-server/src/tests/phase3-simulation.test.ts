import type { ProfileGeometry } from "../lib/dxf-parser-util.js";
import { buildMaterialCurve, stressFromStrain } from "../lib/material-curves.js";
import { resolveMaterialInput } from "../lib/material-model.js";
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

// eslint-disable-next-line no-console
console.log("\nPHASE-3 TEST: Simulation Engine");

test("runs pass-by-pass simulation with springback and strain accumulation", () => {
  const flower = generateFlowerPattern(GEO_U_PROFILE, 6, "P", "CRCA", 1.2);
  const phase2 = generatePhase2RollTooling({
    flowerStations: flower.stations,
    flowerPasses: flower.passes,
    profileGeometry: GEO_U_PROFILE,
    material: "CRCA",
    thickness: 1.2,
  });
  const phase3 = generatePhase3Simulation({
    flowerStations: flower.stations,
    flowerPasses: flower.passes,
    rollStations: phase2.rollStations,
    rollGeometryByStation: phase2.rollGeometryByStation,
    material: "CRCA",
    thickness: 1.2,
  });

  assert(phase3.stationSimulation.length === 6, "station simulation count mismatch");
  assert(phase3.passSimulation.length === 6, "passSimulation output count mismatch");
  assert(phase3.materialModel.code === "CR", "material alias CRCA should resolve to CR");
  assert(phase3.springbackAdjusted.passes.length === 6, "springbackAdjusted output count mismatch");
  assert(phase3.strainMap.length === 6, "strainMap output count mismatch");
  assert(phase3.stressMap.length === 6, "stressMap output count mismatch");
  assert(phase3.pressureZones.length === 6, "pressureZones output count mismatch");
  assert(phase3.peakStressMPa > 0, "peak stress should be positive");
  assert(phase3.materialCurveUsed.points.length >= 20, "material curve should expose sampled points");
  assert(phase3.stripMesh !== null, "strip mesh should be available when roll geometry exists");
  assert(phase3.meshStateHistory.length === 6, "mesh state history count mismatch");
  assert(phase3.contactHistory.length === 6, "contact history count mismatch");
  assert((phase3.stripMesh?.nodes.length ?? 0) > GEO_U_PROFILE.segments.length, "strip mesh should add discretized nodes");

  let previousCumulativeAngle = 0;
  let previousCumulativeStrain = 0;
  for (const station of phase3.stationSimulation) {
    assert(station.commandedAngle >= station.targetBendAngle, `${station.stationId}: commanded angle must include compensation`);
    assert(station.springbackFactor > 1, `${station.stationId}: springback factor should be an overbend multiplier`);
    assert(station.effectiveBendAngle > 0, `${station.stationId}: effective bend angle must be positive`);
    assert(station.passStressMPa > 0, `${station.stationId}: pass stress must be positive`);
    assert(station.tangentModulusMPa > 0, `${station.stationId}: tangent modulus must be positive`);
    assert(station.unloadingStiffnessMPa > 0, `${station.stationId}: unloading stiffness must be positive`);
    assert(station.contactPressureMPa > 0, `${station.stationId}: contact pressure must be positive`);
    assert(station.cumulativeEffectiveAngle > previousCumulativeAngle, `${station.stationId}: cumulative effective angle should increase`);
    assert(station.cumulativeStrain > previousCumulativeStrain, `${station.stationId}: cumulative strain should increase`);
    assert(station.solverIterations > 0, `${station.stationId}: solver iterations should be recorded`);
    assert(station.solverConverged, `${station.stationId}: solver should converge`);
    previousCumulativeAngle = station.cumulativeEffectiveAngle;
    previousCumulativeStrain = station.cumulativeStrain;
  }

  for (const springback of phase3.springbackAdjusted.passes) {
    assert(springback.overbendTargetAngle > springback.inputAngle, `${springback.stationId}: overbend target should exceed desired angle`);
    assert(springback.recoveredAngle > 0, `${springback.stationId}: recovered springback angle must be positive`);
    assert(springback.finalAngle < springback.inputAngle, `${springback.stationId}: springback should reduce final angle`);
  }
});

test("produces shape evolution paths from roll geometry", () => {
  const flower = generateFlowerPattern(GEO_U_PROFILE, 5, "S", "GI", 1.0);
  const phase2 = generatePhase2RollTooling({
    flowerStations: flower.stations,
    flowerPasses: flower.passes,
    profileGeometry: GEO_U_PROFILE,
    material: "GI",
    thickness: 1.0,
  });
  const phase3 = generatePhase3Simulation({
    flowerStations: flower.stations,
    flowerPasses: flower.passes,
    rollStations: phase2.rollStations,
    rollGeometryByStation: phase2.rollGeometryByStation,
    material: "GI",
    thickness: 1.0,
  });

  assert(phase3.shapeEvolution.length === 5, "shape evolution count mismatch");
  assert(phase3.finalProfile !== null, "finalProfile should be available when geometry exists");
  const lastShape = phase3.shapeEvolution[phase3.shapeEvolution.length - 1];
  if (!lastShape) throw new Error("missing final shape evolution");
  assert(lastShape.formedPath.length > GEO_U_PROFILE.segments.length, "formed path should be sampled");

  const changedPoint = lastShape.formedPath.find((point, index) => {
    const post = lastShape.afterSpringbackPath[index];
    if (!post) return false;
    return Math.abs(post.y - point.y) > 1e-4;
  });
  assert(Boolean(changedPoint), "springback-adjusted shape should differ from formed path");
  const lastMeshState = phase3.meshStateHistory[phase3.meshStateHistory.length - 1];
  if (!lastMeshState) throw new Error("missing mesh state history");
  assert(lastMeshState.nodeStates.length === phase3.stripMesh?.nodes.length, "node state count should match strip mesh");
  assert(lastMeshState.elementStates.length === phase3.stripMesh!.elements.length, "element state count should match strip mesh");
  assert(lastMeshState.nodeStates.some((node) => Math.abs(node.afterSpringbackY - node.y) > 1e-4), "mesh nodes should capture springback movement");
  const lastContactState = phase3.contactHistory[phase3.contactHistory.length - 1];
  if (!lastContactState) throw new Error("missing contact history");
  assert(lastContactState.nodeContacts.length === phase3.stripMesh?.nodes.length, "contact nodes should match strip mesh");
  assert(lastContactState.nodeContacts.some((node) => node.contactState !== "FREE"), "contact model should flag near-contact or contact nodes");
});

test("flags overstrain and elevated risk in high-strain titanium case", () => {
  const flower = generateFlowerPattern(GEO_U_PROFILE, 4, "T", "TI", 2.8);
  const phase2 = generatePhase2RollTooling({
    flowerStations: flower.stations,
    flowerPasses: flower.passes,
    profileGeometry: GEO_U_PROFILE,
    material: "TI",
    thickness: 2.8,
  });

  const tunedRollStations = phase2.rollStations.map((station, index) => {
    if (index === 0) {
      return {
        ...station,
        neutralRadius: 2.2,
        strain: 0.11,
      };
    }
    return station;
  });

  const phase3 = generatePhase3Simulation({
    flowerStations: flower.stations,
    flowerPasses: flower.passes,
    rollStations: tunedRollStations,
    rollGeometryByStation: phase2.rollGeometryByStation,
    material: "TI",
    thickness: 2.8,
  });

  assert(phase3.defectSummary.overstrainStations.length > 0, "expected overstrain detection");
  assert(phase3.defectSummary.edgeCrackingStations.length > 0, "expected edge cracking warning");
  assert(phase3.defects.some(defect => defect.type === "OVERSTRAIN"), "expected flattened overstrain defect output");
  assert(phase3.pressureZones.some(zone => zone.isHighPressure), "expected high-pressure zone marking");
  assert(phase3.contactHistory.some((station) => station.peakPressureMPa > 0), "expected non-zero contact pressure history");
  assert(phase3.overallRisk === "HIGH", "overall risk should escalate to HIGH");
  assert(phase3.stationSimulation.some((station) => station.cumulativePlasticIndicator > 0), "expected plastic carry-over indicator");
});

test("material curves are monotonic and stainless carries higher stress than GI at same strain", () => {
  const giCurve = buildMaterialCurve(resolveMaterialInput("GI"), 1.0);
  const ssCurve = buildMaterialCurve(resolveMaterialInput("SS304"), 1.0);
  let previousGiStress = -1;
  for (const point of giCurve.points) {
    assert(point.stress >= previousGiStress, "GI curve must be monotonic increasing");
    previousGiStress = point.stress;
  }

  const comparisonStrain = 0.05;
  const giStress = stressFromStrain(giCurve, comparisonStrain);
  const ssStress = stressFromStrain(ssCurve, comparisonStrain);
  assert(ssStress.stressMPa > giStress.stressMPa, "SS should carry higher stress than GI at the same strain");
});

test("stress model stays elastic below yield and plastic above yield", () => {
  const curve = buildMaterialCurve(resolveMaterialInput("CRCA"), 1.2);
  const elasticStrain = curve.yieldStrain * 0.5;
  const plasticStrain = Math.min(curve.maxStrain, curve.yieldStrain * 1.5 + 0.01);

  const elasticState = stressFromStrain(curve, elasticStrain);
  const plasticState = stressFromStrain(curve, plasticStrain);

  assert(elasticState.regime === "ELASTIC", "state should remain elastic below yield strain");
  assert(plasticState.regime === "PLASTIC", "state should become plastic above yield strain");
  assert(plasticState.stressMPa >= curve.yieldStrengthMPa, "plastic stress should reach yield level");
  assert(plasticState.plasticStrain > 0, "plastic state should report plastic strain");
});

// eslint-disable-next-line no-console
console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
