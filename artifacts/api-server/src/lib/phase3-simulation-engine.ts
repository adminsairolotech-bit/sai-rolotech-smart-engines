import { computeSpringback } from "./calc-validator.js";
import { evaluateStationContact, type StationContactState } from "./phase3-contact-model.js";
import { buildMaterialCurve, stressFromStrain, type MaterialCurve } from "./material-curves.js";
import type { MaterialModel } from "./material-model.js";
import { resolveMaterialInput } from "./material-model.js";
import { solveIncrementalElastoPlasticPass } from "./phase3-solver.js";
import { solveSpringbackUnloading } from "./phase3-springback-solver.js";
import {
  buildStationMeshState,
  buildStripMeshFromPath,
  type StationMeshState,
  type StripMesh,
} from "./phase3-strip-mesh.js";
import type { FlowerPassPhysics, FlowerStation } from "./power-pattern.js";
import type {
  Phase2RollGeometry,
  Phase2RollStation,
  RollGeometryPoint,
  RollRiskLevel,
} from "./phase2-roll-tooling-engine.js";

export type SimulationDefectType = "WRINKLING" | "EDGE_CRACKING" | "OVERSTRAIN" | "DISTORTION";
export type SimulationSeverity = "LOW" | "MEDIUM" | "HIGH";

export interface SimulationDefect {
  type: SimulationDefectType;
  severity: SimulationSeverity;
  reason: string;
}

export interface SimulationDefectRecord extends SimulationDefect {
  stationId: string;
  pass: number;
}

export interface StationShapeEvolution {
  stationId: string;
  pass: number;
  formedPath: RollGeometryPoint[];
  afterSpringbackPath: RollGeometryPoint[];
}

export interface StationSimulationStep {
  stationId: string;
  pass: number;
  phaseZone: "ENTRY" | "FORMING" | "SIZING";
  targetBendAngle: number;
  commandedAngle: number;
  springbackFactor: number;
  springbackAngle: number;
  residualSpringback: number;
  overbendTargetAngle: number;
  unloadingStiffnessMPa: number;
  effectiveBendAngle: number;
  cumulativeEffectiveAngle: number;
  passStrain: number;
  cumulativeStrain: number;
  passStressMPa: number;
  tangentModulusMPa: number;
  contactPressureMPa: number;
  riskLevel: RollRiskLevel;
  cumulativePlasticIndicator: number;
  solverIterations: number;
  solverResidual: number;
  solverConverged: boolean;
  defects: SimulationDefect[];
}

export interface SimulationDefectSummary {
  wrinklingStations: string[];
  edgeCrackingStations: string[];
  overstrainStations: string[];
  distortionStations: string[];
}

export interface Phase3ValidationReport {
  isSimulationValid: boolean;
  warnings: string[];
}

export interface Phase3MaterialReport extends MaterialModel {
  materialUsed: string;
}

export interface SpringbackAdjustedPass {
  stationId: string;
  pass: number;
  inputAngle: number;
  springbackFactor: number;
  overbendTargetAngle: number;
  recoveredAngle: number;
  finalAngle: number;
}

export interface StrainMapPoint {
  stationId: string;
  pass: number;
  strainPerPass: number;
  cumulativeStrain: number;
  isPeak: boolean;
}

export interface PressureZonePoint {
  stationId: string;
  pass: number;
  pressureMPa: number;
  zone: "LOW" | "MEDIUM" | "HIGH";
  isHighPressure: boolean;
}

export interface StressMapPoint {
  stationId: string;
  pass: number;
  stressMPa: number;
  plasticStrain: number;
  regime: "ELASTIC" | "PLASTIC";
  isPeak: boolean;
}

export interface FinalProfileSummary {
  stationId: string;
  pass: number;
  points: RollGeometryPoint[];
}

export interface Phase3SimulationInput {
  flowerStations: FlowerStation[];
  rollStations: Phase2RollStation[];
  flowerPasses?: FlowerPassPhysics[];
  rollGeometryByStation?: Phase2RollGeometry[];
  material?: string;
  thickness: number;
}

export interface Phase3SimulationResult {
  model: "phase3_simulation_engine_v1";
  materialUsed: string;
  materialModel: Phase3MaterialReport;
  materialCurveUsed: MaterialCurve;
  stripMesh: StripMesh | null;
  meshStateHistory: StationMeshState[];
  contactHistory: StationContactState[];
  stationSimulation: StationSimulationStep[];
  shapeEvolution: StationShapeEvolution[];
  defectSummary: SimulationDefectSummary;
  overallRisk: RollRiskLevel;
  validation: Phase3ValidationReport;
  passSimulation: StationSimulationStep[];
  finalProfile: FinalProfileSummary | null;
  springbackAdjusted: { passes: SpringbackAdjustedPass[] };
  strainMap: StrainMapPoint[];
  stressMap: StressMapPoint[];
  peakStressMPa: number;
  pressureZones: PressureZonePoint[];
  defects: SimulationDefectRecord[];
}

interface MutableStrainPoint {
  stationId: string;
  pass: number;
  strainPerPass: number;
  cumulativeStrain: number;
}

function toNumber(value: number, precision = 4): number {
  return parseFloat(value.toFixed(precision));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function findPass(stationId: string, passes?: FlowerPassPhysics[]): FlowerPassPhysics | undefined {
  if (!passes || passes.length === 0) return undefined;
  return passes.find(pass => pass.stationId === stationId);
}

function findStation(stationId: string, stations: FlowerStation[]): FlowerStation | undefined {
  return stations.find(station => station.stationId === stationId);
}

function findGeometry(stationId: string, geometries?: Phase2RollGeometry[]): Phase2RollGeometry | undefined {
  if (!geometries || geometries.length === 0) return undefined;
  return geometries.find(geometry => geometry.stationId === stationId);
}

function inferBendAngle(station: FlowerStation | undefined, pass: FlowerPassPhysics | undefined): number {
  if (pass && pass.bendAngle > 0) return pass.bendAngle;
  if (station && station.bendAngle > 0) return station.bendAngle;
  return 0;
}

function inferBendRadius(
  thickness: number,
  rollStation: Phase2RollStation,
  station: FlowerStation | undefined,
  pass: FlowerPassPhysics | undefined,
): number {
  if (pass && pass.bendRadius > 0) return pass.bendRadius;
  if (station && typeof station.bendRadius === "number" && station.bendRadius > 0) return station.bendRadius;
  return Math.max(thickness, rollStation.neutralRadius - thickness / 2);
}

function inferPassStrain(
  thickness: number,
  rollStation: Phase2RollStation,
  station: FlowerStation | undefined,
  pass: FlowerPassPhysics | undefined,
  bendRadius: number,
): number {
  if (pass && pass.strain > 0) return pass.strain;
  if (station && typeof station.strain === "number" && station.strain > 0) return station.strain;
  if (rollStation.strain > 0) return rollStation.strain;
  return thickness / (2 * Math.max(0.001, bendRadius));
}

function inferRiskLevel(score: number, defects: SimulationDefect[]): RollRiskLevel {
  if (defects.some(defect => defect.severity === "HIGH")) return "HIGH";
  if (score < 0.45) return "LOW";
  if (score < 0.78) return "MEDIUM";
  return "HIGH";
}

function pushUniqueStation(target: string[], stationId: string): void {
  if (!target.includes(stationId)) target.push(stationId);
}

function detectPressureZone(pressureMPa: number, yieldStrengthMPa: number): PressureZonePoint["zone"] {
  if (pressureMPa < yieldStrengthMPa * 0.25) return "LOW";
  if (pressureMPa < yieldStrengthMPa * 0.45) return "MEDIUM";
  return "HIGH";
}

function mapShapeEvolution(
  geometry: Phase2RollGeometry,
  progression: number,
  springbackRatio: number,
): StationShapeEvolution {
  const formedPath: RollGeometryPoint[] = [];
  const afterSpringbackPath: RollGeometryPoint[] = [];
  const formedScale = clamp(progression, 0.08, 1.2);
  const springbackScale = clamp(1 - springbackRatio, 0.72, 1);

  for (const point of geometry.stripContactPath) {
    formedPath.push({
      x: toNumber(point.x, 4),
      y: toNumber(point.y * formedScale, 4),
    });
    afterSpringbackPath.push({
      x: toNumber(point.x, 4),
      y: toNumber(point.y * formedScale * springbackScale, 4),
    });
  }

  return {
    stationId: geometry.stationId,
    pass: geometry.pass,
    formedPath,
    afterSpringbackPath,
  };
}

export function generatePhase3Simulation(input: Phase3SimulationInput): Phase3SimulationResult {
  const rollStations = Array.isArray(input.rollStations) ? input.rollStations : [];
  if (rollStations.length === 0) {
    throw new Error("rollStations[] is required for Phase-3 simulation");
  }

  const thickness = input.thickness > 0 ? input.thickness : 1;
  const material = resolveMaterialInput(input.material);
  const materialCurve = buildMaterialCurve(material, thickness);
  const totalTargetAngle = rollStations.reduce((sum, station) => {
    const flowerStation = findStation(station.stationId, input.flowerStations);
    const pass = findPass(station.stationId, input.flowerPasses);
    return sum + inferBendAngle(flowerStation, pass);
  }, 0);

  const warnings: string[] = [];
  const stationSimulation: StationSimulationStep[] = [];
  const shapeEvolution: StationShapeEvolution[] = [];
  const meshStateHistory: StationMeshState[] = [];
  const contactHistory: StationContactState[] = [];
  const springbackPasses: SpringbackAdjustedPass[] = [];
  const strainMapRaw: MutableStrainPoint[] = [];
  const pressureZones: PressureZonePoint[] = [];
  const stressMapRaw: Omit<StressMapPoint, "isPeak">[] = [];
  const defects: SimulationDefectRecord[] = [];

  const defectSummary: SimulationDefectSummary = {
    wrinklingStations: [],
    edgeCrackingStations: [],
    overstrainStations: [],
    distortionStations: [],
  };

  let cumulativeStrain = 0;
  let cumulativeEffectiveAngle = 0;
  let cumulativePlasticIndicator = 0;
  let previousEffectiveAngle = 0;
  let previousPassStrain = 0;
  const baseGeometry = input.rollGeometryByStation?.[0];
  const stripMesh = baseGeometry ? buildStripMeshFromPath(baseGeometry.stripContactPath) : null;

  for (const rollStation of rollStations) {
    const flowerStation = findStation(rollStation.stationId, input.flowerStations);
    const pass = findPass(rollStation.stationId, input.flowerPasses);
    const targetAngle = inferBendAngle(flowerStation, pass);
    const bendRadius = inferBendRadius(thickness, rollStation, flowerStation, pass);
    const basePassStrain = inferPassStrain(thickness, rollStation, flowerStation, pass, bendRadius);
    const baseStressState = stressFromStrain(materialCurve, basePassStrain);
    const pressureHint =
      baseStressState.stressMPa *
      (0.2 + targetAngle / 750) *
      (1 + thickness / 2);
    const solver = solveIncrementalElastoPlasticPass({
      materialCurve,
      thickness,
      targetAngle,
      bendRadius,
      rollGap: rollStation.gap,
      clearance: rollStation.clearance,
      basePassStrain,
      previousPlasticStrain: cumulativePlasticIndicator,
      previousEffectiveAngle,
      contactPressureHintMPa: pressureHint,
    });
    const passStrain = solver.solvedPassStrain;
    const stressState = stressFromStrain(materialCurve, passStrain);

    const thicknessFactor = 1 + thickness / 2;
    const stationDefects: SimulationDefect[] = [];
    const projectedStressRatio = stressState.stressMPa / Math.max(1e-6, material.utsMPa);
    const projectedContactPressureMPa =
      stressState.stressMPa *
      (0.22 + targetAngle / 700) *
      thicknessFactor *
      (1 + projectedStressRatio * 0.25);
    const unloading = solveSpringbackUnloading({
      materialCurve,
      targetAngle,
      thickness,
      bendRadius,
      solvedPassStrain: passStrain,
      solvedStressMPa: stressState.stressMPa,
      plasticStrain: solver.plasticStrain,
      tangentModulusMPa: solver.tangentModulusMPa,
      contactPressureMPa: projectedContactPressureMPa,
    });

    const classicSpringback = computeSpringback(
      targetAngle,
      bendRadius,
      thickness,
      material.yieldStrengthMPa,
      material.elasticModulusMPa,
    );
    const springbackFactor = unloading.overbendFactor;
    const springbackRatio = unloading.springbackRatio;
    const effectiveBendAngle = unloading.finalAngle;
    const commandedAngle = unloading.overbendTargetAngle;
    const residualSpringback = unloading.recoveredAngle;

    cumulativeStrain += passStrain;
    cumulativeEffectiveAngle += effectiveBendAngle;
    cumulativePlasticIndicator += solver.plasticStrain;
    previousEffectiveAngle = effectiveBendAngle;

    const strainRatio = passStrain / Math.max(1e-6, material.maxStrain);
    const cumulativeRatio = cumulativeStrain / Math.max(1e-6, material.maxStrain);
    const stressRatio = stressState.stressMPa / Math.max(1e-6, material.utsMPa);
    const contactPressureMPa =
      stressState.stressMPa *
      (0.22 + targetAngle / 700) *
      thicknessFactor *
      (1 + stressRatio * 0.25);
    const pressureZone = detectPressureZone(contactPressureMPa, material.yieldStrengthMPa);

    if (strainRatio >= 1.0 || cumulativeRatio >= 1.8) {
      const defect: SimulationDefect = {
        type: "OVERSTRAIN",
        severity: strainRatio >= 1.1 ? "HIGH" : "MEDIUM",
        reason: `strain ratio ${toNumber(strainRatio, 3)} exceeds material envelope`,
      };
      stationDefects.push(defect);
      defects.push({ stationId: rollStation.stationId, pass: rollStation.pass, ...defect });
      pushUniqueStation(defectSummary.overstrainStations, rollStation.stationId);
    }

    const materialSensitive = material.code === "SS" || material.code === "TI" || material.code === "HSLA";
    if ((materialSensitive && strainRatio > 0.92) || (bendRadius < thickness * 1.8 && strainRatio > 0.8)) {
      const defect: SimulationDefect = {
        type: "EDGE_CRACKING",
        severity: strainRatio > 1 ? "HIGH" : "MEDIUM",
        reason: `small bend radius ${toNumber(bendRadius, 3)}mm with elevated strain`,
      };
      stationDefects.push(defect);
      defects.push({ stationId: rollStation.stationId, pass: rollStation.pass, ...defect });
      pushUniqueStation(defectSummary.edgeCrackingStations, rollStation.stationId);
    }

    if (targetAngle >= 8 && pressureZone === "LOW" && springbackFactor > 0.06) {
      const defect: SimulationDefect = {
        type: "WRINKLING",
        severity: "MEDIUM",
        reason: `low pressure zone with higher springback factor ${toNumber(springbackFactor, 4)}`,
      };
      stationDefects.push(defect);
      defects.push({ stationId: rollStation.stationId, pass: rollStation.pass, ...defect });
      pushUniqueStation(defectSummary.wrinklingStations, rollStation.stationId);
    }

    if (previousPassStrain > 0) {
      const unevenRatio = Math.abs(passStrain - previousPassStrain) / previousPassStrain;
      if (unevenRatio > 0.35) {
        const defect: SimulationDefect = {
          type: "DISTORTION",
          severity: unevenRatio > 0.6 ? "HIGH" : "MEDIUM",
          reason: `uneven strain jump ${toNumber(unevenRatio, 3)} between adjacent passes`,
        };
        stationDefects.push(defect);
        defects.push({ stationId: rollStation.stationId, pass: rollStation.pass, ...defect });
        pushUniqueStation(defectSummary.distortionStations, rollStation.stationId);
      }
    }
    previousPassStrain = passStrain;

    if (stressRatio > 0.96) {
      const defect: SimulationDefect = {
        type: "OVERSTRAIN",
        severity: stressRatio > 0.995 ? "HIGH" : "MEDIUM",
        reason: `stress ratio ${toNumber(stressRatio, 3)} approaches tensile limit`,
      };
      stationDefects.push(defect);
      defects.push({ stationId: rollStation.stationId, pass: rollStation.pass, ...defect });
      pushUniqueStation(defectSummary.overstrainStations, rollStation.stationId);
    }

    const riskScore = clamp(
      strainRatio * 0.35 +
      cumulativeRatio * 0.2 +
      stressRatio * 0.3 +
      clamp(springbackFactor * 3, 0, 1.2) * 0.15,
      0,
      1.5,
    );
    const riskLevel = inferRiskLevel(riskScore, stationDefects);

    strainMapRaw.push({
      stationId: rollStation.stationId,
      pass: rollStation.pass,
      strainPerPass: toNumber(passStrain, 6),
      cumulativeStrain: toNumber(cumulativeStrain, 6),
    });
    pressureZones.push({
      stationId: rollStation.stationId,
      pass: rollStation.pass,
      pressureMPa: toNumber(contactPressureMPa),
      zone: pressureZone,
      isHighPressure: pressureZone === "HIGH",
    });
    stressMapRaw.push({
      stationId: rollStation.stationId,
      pass: rollStation.pass,
      stressMPa: toNumber(stressState.stressMPa),
      plasticStrain: toNumber(stressState.plasticStrain, 6),
      regime: stressState.regime,
    });
    springbackPasses.push({
      stationId: rollStation.stationId,
      pass: rollStation.pass,
      inputAngle: toNumber(targetAngle),
      springbackFactor: toNumber(springbackFactor, 6),
      overbendTargetAngle: toNumber(commandedAngle),
      recoveredAngle: toNumber(residualSpringback),
      finalAngle: toNumber(effectiveBendAngle),
    });

    const geometry = findGeometry(rollStation.stationId, input.rollGeometryByStation);
    const progression = totalTargetAngle > 0 ? cumulativeEffectiveAngle / totalTargetAngle : 1;
    if (geometry) {
      const stationShape = mapShapeEvolution(geometry, progression, springbackFactor);
      shapeEvolution.push(stationShape);
      if (stripMesh) {
        const meshState = buildStationMeshState(
          stripMesh,
          stationShape.formedPath,
          stationShape.afterSpringbackPath,
          stationShape.stationId,
          stationShape.pass,
          passStrain,
          stressState.stressMPa,
        );
        meshStateHistory.push(meshState);
        contactHistory.push(evaluateStationContact(
          meshState,
          geometry,
          material,
          thickness,
        ));
      }
    }

    stationSimulation.push({
      stationId: rollStation.stationId,
      pass: rollStation.pass,
      phaseZone: rollStation.phaseZone,
      targetBendAngle: toNumber(targetAngle),
      commandedAngle: toNumber(commandedAngle),
      springbackFactor: toNumber(springbackFactor, 6),
      springbackAngle: toNumber(residualSpringback || classicSpringback.springbackAngle),
      residualSpringback: toNumber(residualSpringback),
      overbendTargetAngle: toNumber(commandedAngle),
      unloadingStiffnessMPa: toNumber(unloading.unloadingStiffnessMPa),
      effectiveBendAngle: toNumber(effectiveBendAngle),
      cumulativeEffectiveAngle: toNumber(cumulativeEffectiveAngle),
      passStrain: toNumber(passStrain, 6),
      cumulativeStrain: toNumber(cumulativeStrain, 6),
      passStressMPa: toNumber(stressState.stressMPa),
      tangentModulusMPa: toNumber(solver.tangentModulusMPa),
      contactPressureMPa: toNumber(contactPressureMPa),
      riskLevel,
      cumulativePlasticIndicator: toNumber(cumulativePlasticIndicator, 6),
      solverIterations: solver.iterations,
      solverResidual: solver.residual,
      solverConverged: solver.converged,
      defects: stationDefects,
    });
  }

  const peakStrain = strainMapRaw.reduce((max, point) => Math.max(max, point.strainPerPass), 0);
  const strainMap: StrainMapPoint[] = strainMapRaw.map(point => ({
    ...point,
    isPeak: Math.abs(point.strainPerPass - peakStrain) < 1e-9,
  }));
  const peakStress = stressMapRaw.reduce((max, point) => Math.max(max, point.stressMPa), 0);
  const stressMap: StressMapPoint[] = stressMapRaw.map(point => ({
    ...point,
    isPeak: Math.abs(point.stressMPa - peakStress) < 1e-9,
  }));

  const overallRisk: RollRiskLevel = stationSimulation.some(station => station.riskLevel === "HIGH")
    ? "HIGH"
    : stationSimulation.some(station => station.riskLevel === "MEDIUM")
    ? "MEDIUM"
    : "LOW";

  if (!input.rollGeometryByStation || input.rollGeometryByStation.length === 0) {
    warnings.push("Roll geometry missing - shape evolution reduced to scalar strain simulation");
  } else if (shapeEvolution.length !== stationSimulation.length) {
    warnings.push("Some stations are missing rollGeometry entries - shape evolution is partial");
  }
  if (contactHistory.length > 0 && !contactHistory.some((station) => station.highContactNodeIds.length > 0)) {
    warnings.push("Contact model found no near-contact nodes; verify roll gap and contour alignment");
  }
  if (!pressureZones.some(zone => zone.isHighPressure)) {
    warnings.push("No high-pressure zones detected; verify pressure scaling for this profile/material");
  }
  if (!defects.some(defect => defect.severity !== "LOW")) {
    warnings.push("No major defects detected in this run; validate with heavier profile/material combinations");
  }

  const finalShape = shapeEvolution[shapeEvolution.length - 1];
  const finalProfile: FinalProfileSummary | null = finalShape
    ? {
      stationId: finalShape.stationId,
      pass: finalShape.pass,
      points: finalShape.afterSpringbackPath,
    }
    : null;

  const materialModel: Phase3MaterialReport = {
    ...material,
    materialUsed: material.materialUsed,
  };

  return {
    model: "phase3_simulation_engine_v1",
    materialUsed: material.materialUsed,
    materialModel,
    materialCurveUsed: materialCurve,
    stripMesh,
    meshStateHistory,
    contactHistory,
    stationSimulation,
    shapeEvolution,
    defectSummary,
    overallRisk,
    validation: {
      isSimulationValid: warnings.length === 0,
      warnings,
    },
    passSimulation: stationSimulation,
    finalProfile,
    springbackAdjusted: { passes: springbackPasses },
    strainMap,
    stressMap,
    peakStressMPa: toNumber(peakStress),
    pressureZones,
    defects,
  };
}
