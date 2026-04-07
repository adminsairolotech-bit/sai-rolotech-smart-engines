import type { ResolvedMaterialModel } from "./material-model.js";
import type { Phase2RollGeometry, RollGeometryPoint } from "./phase2-roll-tooling-engine.js";
import type { StationMeshState } from "./phase3-strip-mesh.js";

export interface ContactNodeState {
  nodeId: string;
  x: number;
  y: number;
  upperClearance: number;
  lowerClearance: number;
  minClearance: number;
  upperPenetration: number;
  lowerPenetration: number;
  contactPressureMPa: number;
  frictionCoefficient: number;
  frictionForceProxy: number;
  contactState: "FREE" | "NEAR_CONTACT" | "CONTACT";
}

export interface StationContactState {
  stationId: string;
  pass: number;
  nodeContacts: ContactNodeState[];
  averagePressureMPa: number;
  peakPressureMPa: number;
  averageMinClearance: number;
  maxPenetration: number;
  highContactNodeIds: string[];
}

function toNumber(value: number, precision = 6): number {
  return parseFloat(value.toFixed(precision));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cumulativeLengths(points: RollGeometryPoint[]): number[] {
  const lengths = [0];
  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1]!;
    const next = points[index]!;
    lengths.push(lengths[index - 1]! + Math.hypot(next.x - prev.x, next.y - prev.y));
  }
  return lengths;
}

function samplePolylineAt(points: RollGeometryPoint[], lengths: number[], xTarget: number): RollGeometryPoint {
  if (points.length === 0) return { x: xTarget, y: 0 };
  if (points.length === 1) return points[0]!;

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]!;
    const end = points[index]!;
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    if (xTarget < minX || xTarget > maxX) continue;

    const dx = end.x - start.x;
    if (Math.abs(dx) < 1e-9) {
      return { x: start.x, y: (start.y + end.y) / 2 };
    }

    const t = (xTarget - start.x) / dx;
    return {
      x: toNumber(xTarget),
      y: toNumber(start.y + (end.y - start.y) * t),
    };
  }

  const first = points[0]!;
  const last = points[points.length - 1]!;
  return Math.abs(xTarget - first.x) <= Math.abs(xTarget - last.x) ? first : last;
}

function frictionCoefficient(material: ResolvedMaterialModel): number {
  switch (material.code) {
    case "SS":
      return 0.18;
    case "TI":
      return 0.22;
    case "AL":
      return 0.12;
    case "HSLA":
      return 0.16;
    default:
      return 0.14;
  }
}

export function evaluateStationContact(
  meshState: StationMeshState,
  rollGeometry: Phase2RollGeometry,
  material: ResolvedMaterialModel,
  thickness: number,
): StationContactState {
  const upperLengths = cumulativeLengths(rollGeometry.upperRoll);
  const lowerLengths = cumulativeLengths(rollGeometry.lowerRoll);
  const halfThickness = thickness / 2;
  const mu = frictionCoefficient(material);
  const nodeContacts: ContactNodeState[] = meshState.nodeStates.map((node) => {
    const upper = samplePolylineAt(rollGeometry.upperRoll, upperLengths, node.x);
    const lower = samplePolylineAt(rollGeometry.lowerRoll, lowerLengths, node.x);
    const upperClearance = upper.y - (node.y + halfThickness);
    const lowerClearance = (node.y - halfThickness) - lower.y;
    const minClearance = Math.min(upperClearance, lowerClearance);
    const upperPenetration = Math.max(0, -upperClearance);
    const lowerPenetration = Math.max(0, -lowerClearance);
    const penetration = Math.max(upperPenetration, lowerPenetration);
    const nearContactBand = thickness * 0.08;
    const contactState =
      penetration > 0
        ? "CONTACT"
        : minClearance <= nearContactBand
        ? "NEAR_CONTACT"
        : "FREE";

    const pressureFactor = penetration > 0
      ? 1 + penetration / Math.max(0.01, thickness)
      : clamp((nearContactBand - minClearance) / Math.max(nearContactBand, 1e-6), 0, 1) * 0.55;
    const contactPressureMPa = node.localStressMPa * pressureFactor;
    const frictionForceProxy = contactPressureMPa * mu;

    return {
      nodeId: node.nodeId,
      x: node.x,
      y: node.y,
      upperClearance: toNumber(upperClearance),
      lowerClearance: toNumber(lowerClearance),
      minClearance: toNumber(minClearance),
      upperPenetration: toNumber(upperPenetration),
      lowerPenetration: toNumber(lowerPenetration),
      contactPressureMPa: toNumber(contactPressureMPa),
      frictionCoefficient: toNumber(mu, 4),
      frictionForceProxy: toNumber(frictionForceProxy),
      contactState,
    };
  });

  const peakPressureMPa = nodeContacts.reduce((max, node) => Math.max(max, node.contactPressureMPa), 0);
  const averagePressureMPa =
    nodeContacts.reduce((sum, node) => sum + node.contactPressureMPa, 0) / Math.max(1, nodeContacts.length);
  const averageMinClearance =
    nodeContacts.reduce((sum, node) => sum + node.minClearance, 0) / Math.max(1, nodeContacts.length);
  const maxPenetration = nodeContacts.reduce(
    (max, node) => Math.max(max, node.upperPenetration, node.lowerPenetration),
    0,
  );
  const highContactNodeIds = nodeContacts
    .filter((node) => node.contactState !== "FREE" || node.contactPressureMPa >= peakPressureMPa * 0.75)
    .map((node) => node.nodeId);

  return {
    stationId: meshState.stationId,
    pass: meshState.pass,
    nodeContacts,
    averagePressureMPa: toNumber(averagePressureMPa),
    peakPressureMPa: toNumber(peakPressureMPa),
    averageMinClearance: toNumber(averageMinClearance),
    maxPenetration: toNumber(maxPenetration),
    highContactNodeIds,
  };
}
