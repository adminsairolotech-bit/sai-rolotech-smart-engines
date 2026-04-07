import type { RollGeometryPoint } from "./phase2-roll-tooling-engine.js";

export interface StripMeshNode {
  id: string;
  s: number;
  x: number;
  y: number;
}

export interface StripMeshElement {
  id: string;
  startNodeId: string;
  endNodeId: string;
  restLength: number;
}

export interface StripMesh {
  nodes: StripMeshNode[];
  elements: StripMeshElement[];
  totalLength: number;
}

export interface StripNodeState {
  nodeId: string;
  x: number;
  y: number;
  afterSpringbackX: number;
  afterSpringbackY: number;
  localStrain: number;
  localStressMPa: number;
}

export interface StripElementState {
  elementId: string;
  startNodeId: string;
  endNodeId: string;
  currentLength: number;
  springbackLength: number;
  curvatureProxy: number;
}

export interface StationMeshState {
  stationId: string;
  pass: number;
  nodeStates: StripNodeState[];
  elementStates: StripElementState[];
}

function toNumber(value: number, precision = 6): number {
  return parseFloat(value.toFixed(precision));
}

function distance(a: RollGeometryPoint, b: RollGeometryPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cumulativeLengths(points: RollGeometryPoint[]): number[] {
  const result = [0];
  for (let index = 1; index < points.length; index += 1) {
    result.push(result[index - 1]! + distance(points[index - 1]!, points[index]!));
  }
  return result;
}

function samplePolylineAt(points: RollGeometryPoint[], lengths: number[], targetS: number): RollGeometryPoint {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0]!;
  const totalLength = lengths[lengths.length - 1] ?? 0;
  const s = clamp(targetS, 0, totalLength);

  for (let index = 1; index < lengths.length; index += 1) {
    const startLength = lengths[index - 1]!;
    const endLength = lengths[index]!;
    if (s > endLength && index < lengths.length - 1) continue;
    const start = points[index - 1]!;
    const end = points[index]!;
    const span = Math.max(1e-9, endLength - startLength);
    const t = (s - startLength) / span;
    return {
      x: toNumber(start.x + (end.x - start.x) * t),
      y: toNumber(start.y + (end.y - start.y) * t),
    };
  }

  return points[points.length - 1]!;
}

export function buildStripMeshFromPath(path: RollGeometryPoint[]): StripMesh | null {
  if (!Array.isArray(path) || path.length < 2) return null;
  const lengths = cumulativeLengths(path);
  const totalLength = lengths[lengths.length - 1] ?? 0;
  const segmentHint = Math.max(8, Math.min(48, Math.ceil(totalLength / 5)));
  const nodes: StripMeshNode[] = [];

  for (let index = 0; index <= segmentHint; index += 1) {
    const s = (totalLength * index) / segmentHint;
    const point = samplePolylineAt(path, lengths, s);
    nodes.push({
      id: `N${index + 1}`,
      s: toNumber(s),
      x: point.x,
      y: point.y,
    });
  }

  const elements: StripMeshElement[] = [];
  for (let index = 1; index < nodes.length; index += 1) {
    const start = nodes[index - 1]!;
    const end = nodes[index]!;
    elements.push({
      id: `E${index}`,
      startNodeId: start.id,
      endNodeId: end.id,
      restLength: toNumber(Math.hypot(end.x - start.x, end.y - start.y)),
    });
  }

  return {
    nodes,
    elements,
    totalLength: toNumber(totalLength),
  };
}

export function buildStationMeshState(
  mesh: StripMesh,
  formedPath: RollGeometryPoint[],
  afterSpringbackPath: RollGeometryPoint[],
  stationId: string,
  pass: number,
  passStrain: number,
  passStressMPa: number,
): StationMeshState {
  const formedLengths = cumulativeLengths(formedPath);
  const springbackLengths = cumulativeLengths(afterSpringbackPath);
  const nodeStates: StripNodeState[] = mesh.nodes.map((node, index) => {
    const formed = samplePolylineAt(formedPath, formedLengths, node.s);
    const springback = samplePolylineAt(afterSpringbackPath, springbackLengths, node.s);
    const normalizedIndex = mesh.nodes.length <= 1 ? 0 : index / (mesh.nodes.length - 1);
    const localMultiplier = 0.92 + Math.sin(normalizedIndex * Math.PI) * 0.16;
    return {
      nodeId: node.id,
      x: formed.x,
      y: formed.y,
      afterSpringbackX: springback.x,
      afterSpringbackY: springback.y,
      localStrain: toNumber(passStrain * localMultiplier, 6),
      localStressMPa: toNumber(passStressMPa * localMultiplier),
    };
  });

  const nodeById = new Map(nodeStates.map((node) => [node.nodeId, node]));
  const elementStates: StripElementState[] = mesh.elements.map((element) => {
    const start = nodeById.get(element.startNodeId)!;
    const end = nodeById.get(element.endNodeId)!;
    const currentLength = Math.hypot(end.x - start.x, end.y - start.y);
    const springbackLength = Math.hypot(end.afterSpringbackX - start.afterSpringbackX, end.afterSpringbackY - start.afterSpringbackY);
    const dy = end.y - start.y;
    const dx = end.x - start.x;
    return {
      elementId: element.id,
      startNodeId: element.startNodeId,
      endNodeId: element.endNodeId,
      currentLength: toNumber(currentLength),
      springbackLength: toNumber(springbackLength),
      curvatureProxy: toNumber(Math.abs(dy) / Math.max(1e-6, Math.abs(dx) + element.restLength)),
    };
  });

  return {
    stationId,
    pass,
    nodeStates,
    elementStates,
  };
}
