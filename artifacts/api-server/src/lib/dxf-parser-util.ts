export interface Segment {
  type: "line" | "arc";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx?: number;
  cy?: number;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  sourceType?: string;
  sourceLayer?: string;
  sourceBulge?: number;
  length: number;
}

export interface BendInfo {
  angle: number;
  radius: number;
  segmentIndex: number;
  side: "left" | "right";
  direction: "up" | "down";
}

export interface ImportEntityDebug {
  entityType: string;
  layer: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  radius?: number;
  bulge?: number;
  angleDeg?: number;
  length: number;
}

export interface ImportDiagnostics {
  unitsCode: number;
  unitsName: string;
  unitsScaleToMm: number;
  totalEntities: number;
  entityCounts: Record<string, number>;
  layerCounts: Record<string, number>;
  segmentCountBeforeSelection: number;
  segmentCountAfterSelection: number;
  selectedLayers: string[];
  excludedByLayerHintCount: number;
  curvedSourceEntityCount: number;
  curvedSegmentCount: number;
  isLikelyStraightLineCollapse: boolean;
  selectedPathLength: number;
  notes: string[];
  segmentDebug: ImportEntityDebug[];
}

export interface ProfileGeometry {
  segments: Segment[];
  bends: BendInfo[];
  totalLength: number;
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
  symmetryAxis?: number;
  centroid?: { x: number; y: number };
  importDiagnostics?: ImportDiagnostics;
}

interface Point2 {
  x: number;
  y: number;
}

interface RawEntity {
  type: string;
  layer: string;
  data: Record<string, string[]>;
}

function parseNumber(s: string): number {
  const parsed = parseFloat(s);
  return Number.isFinite(parsed) ? parsed : 0;
}

function distanceBetween(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function pointDistance(a: Point2, b: Point2): number {
  return distanceBetween(a.x, a.y, b.x, b.y);
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

function unwrapArcDelta(startAngle: number, endAngle: number): number {
  let delta = normalizeAngle(endAngle) - normalizeAngle(startAngle);
  if (delta <= 0) delta += 360;
  return delta;
}

function arcLengthFromDelta(radius: number, deltaDegrees: number): number {
  return Math.abs((Math.PI * radius * deltaDegrees) / 180);
}

function reverseSegment(segment: Segment): Segment {
  return {
    ...segment,
    x1: segment.x2,
    y1: segment.y2,
    x2: segment.x1,
    y2: segment.y1,
    startAngle: segment.endAngle,
    endAngle: segment.startAngle,
  };
}

function lineAngleDegrees(segment: Segment): number {
  return toDegrees(Math.atan2(segment.y2 - segment.y1, segment.x2 - segment.x1));
}

function isConstructionLayerHint(layer: string): boolean {
  const upper = layer.toUpperCase();
  return [
    "DIM",
    "DIMS",
    "DIMENSION",
    "DEFPOINTS",
    "CONSTRUCTION",
    "CONST",
    "CENTER",
    "HIDDEN",
    "ANNOT",
    "TEXT",
    "REFERENCE",
    "REF",
    "AUX",
    "XLINE",
  ].some(token => upper.includes(token));
}

function parseInsUnits(lines: string[]): number {
  for (let i = 0; i < lines.length - 3; i += 1) {
    const code = lines[i]?.trim();
    const value = lines[i + 1]?.trim();
    if (code !== "9" || value !== "$INSUNITS") continue;

    for (let j = i + 2; j < Math.min(lines.length - 1, i + 40); j += 2) {
      const c = lines[j]?.trim();
      const v = lines[j + 1]?.trim() ?? "";
      if (c === "70") {
        const parsed = parseInt(v, 10);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      if (c === "9" || c === "0") break;
    }
    break;
  }
  return 0;
}

function mapUnits(code: number): { unitsName: string; unitsScaleToMm: number } {
  const map: Record<number, { unitsName: string; unitsScaleToMm: number }> = {
    0: { unitsName: "unitless", unitsScaleToMm: 1 },
    1: { unitsName: "inch", unitsScaleToMm: 25.4 },
    2: { unitsName: "foot", unitsScaleToMm: 304.8 },
    3: { unitsName: "mile", unitsScaleToMm: 1609344 },
    4: { unitsName: "mm", unitsScaleToMm: 1 },
    5: { unitsName: "cm", unitsScaleToMm: 10 },
    6: { unitsName: "m", unitsScaleToMm: 1000 },
    7: { unitsName: "km", unitsScaleToMm: 1000000 },
    8: { unitsName: "microinch", unitsScaleToMm: 0.0000254 },
    9: { unitsName: "mil", unitsScaleToMm: 0.0254 },
    10: { unitsName: "yard", unitsScaleToMm: 914.4 },
  };
  return map[code] ?? { unitsName: `code_${code}`, unitsScaleToMm: 1 };
}

function scaleToMm(value: number, scale: number): number {
  return value * scale;
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function sampleSplinePoints(points: Point2[]): Point2[] {
  if (points.length <= 2) return points;
  const sampled: Point2[] = [points[0]!];

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(points.length - 1, i + 2)]!;
    const spanLength = pointDistance(p1, p2);
    const steps = Math.max(8, Math.min(48, Math.ceil(spanLength / 5)));

    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      sampled.push({
        x: catmullRom(p0.x, p1.x, p2.x, p3.x, t),
        y: catmullRom(p0.y, p1.y, p2.y, p3.y, t),
      });
    }
  }

  const deduped: Point2[] = [];
  for (const p of sampled) {
    const prev = deduped[deduped.length - 1];
    if (!prev || pointDistance(prev, p) > 1e-6) deduped.push(p);
  }
  return deduped;
}

function parseRawEntities(lines: string[]): {
  entities: RawEntity[];
  entityCounts: Record<string, number>;
  layerCounts: Record<string, number>;
} {
  const entities: RawEntity[] = [];
  const entityCounts: Record<string, number> = {};
  const layerCounts: Record<string, number> = {};

  let i = 0;
  let inEntities = false;
  let currentEntity: RawEntity | null = null;

  while (i < lines.length) {
    const code = lines[i]?.trim();
    const value = lines[i + 1]?.trim() ?? "";
    i += 2;

    if (code === "2" && value === "ENTITIES") {
      inEntities = true;
      continue;
    }

    if (code === "0" && value === "ENDSEC" && inEntities) {
      if (currentEntity) entities.push(currentEntity);
      currentEntity = null;
      inEntities = false;
      continue;
    }

    if (!inEntities) continue;

    if (code === "0") {
      if (currentEntity) entities.push(currentEntity);
      if (["LINE", "ARC", "LWPOLYLINE", "POLYLINE", "CIRCLE", "SPLINE"].includes(value)) {
        currentEntity = { type: value, layer: "0", data: {} };
        entityCounts[value] = (entityCounts[value] ?? 0) + 1;
      } else {
        currentEntity = null;
      }
      continue;
    }

    if (!currentEntity || code === undefined) continue;
    if (!currentEntity.data[code]) currentEntity.data[code] = [];
    currentEntity.data[code].push(value);

    if (code === "8") {
      currentEntity.layer = value || "0";
      layerCounts[currentEntity.layer] = (layerCounts[currentEntity.layer] ?? 0) + 1;
    }
  }

  if (currentEntity) entities.push(currentEntity);

  return { entities, entityCounts, layerCounts };
}

function parseBulgeSegment(ax: number, ay: number, bx: number, by: number, bulge: number): Segment {
  const chord = distanceBetween(ax, ay, bx, by);
  if (chord < 1e-9 || Math.abs(bulge) < 1e-9) {
    return { type: "line", x1: ax, y1: ay, x2: bx, y2: by, length: chord };
  }

  const theta = 4 * Math.atan(bulge);
  const absTheta = Math.abs(theta);
  const radius = chord / (2 * Math.sin(absTheta / 2));
  const halfChord = chord / 2;
  const midX = (ax + bx) / 2;
  const midY = (ay + by) / 2;
  const ux = (bx - ax) / chord;
  const uy = (by - ay) / chord;
  const nx = -uy;
  const ny = ux;
  const centerOffset = Math.sqrt(Math.max(0, radius * radius - halfChord * halfChord));
  const side = bulge >= 0 ? 1 : -1;
  const cx = midX + nx * centerOffset * side;
  const cy = midY + ny * centerOffset * side;

  let startAngle = toDegrees(Math.atan2(ay - cy, ax - cx));
  let endAngle = toDegrees(Math.atan2(by - cy, bx - cx));
  if (bulge >= 0 && endAngle <= startAngle) endAngle += 360;
  if (bulge < 0 && endAngle >= startAngle) endAngle -= 360;

  return {
    type: "arc",
    x1: ax,
    y1: ay,
    x2: bx,
    y2: by,
    cx,
    cy,
    radius: Math.abs(radius),
    startAngle,
    endAngle,
    sourceBulge: bulge,
    length: Math.abs(theta) * Math.abs(radius),
  };
}

function segmentTouches(a: Segment, b: Segment, tolerance: number): boolean {
  const aPoints: Point2[] = [{ x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 }];
  const bPoints: Point2[] = [{ x: b.x1, y: b.y1 }, { x: b.x2, y: b.y2 }];
  for (const pa of aPoints) {
    for (const pb of bPoints) {
      if (pointDistance(pa, pb) <= tolerance) return true;
    }
  }
  return false;
}

function extractConnectedComponents(segments: Segment[], tolerance: number): number[][] {
  const components: number[][] = [];
  const visited = new Array<boolean>(segments.length).fill(false);

  for (let i = 0; i < segments.length; i += 1) {
    if (visited[i]) continue;
    const queue: number[] = [i];
    visited[i] = true;
    const component: number[] = [];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined) continue;
      component.push(current);

      for (let j = 0; j < segments.length; j += 1) {
        if (visited[j]) continue;
        if (segmentTouches(segments[current]!, segments[j]!, tolerance)) {
          visited[j] = true;
          queue.push(j);
        }
      }
    }

    components.push(component);
  }

  return components;
}

function orderSegmentChain(segments: Segment[]): Segment[] {
  if (segments.length <= 1) return segments;

  const used = new Array<boolean>(segments.length).fill(false);
  const startIndex = segments.reduce((bestIndex, segment, idx) => {
    const best = segments[bestIndex]!;
    const bestMinX = Math.min(best.x1, best.x2);
    const currentMinX = Math.min(segment.x1, segment.x2);
    if (currentMinX < bestMinX) return idx;
    if (currentMinX === bestMinX) {
      const bestMinY = Math.min(best.y1, best.y2);
      const currentMinY = Math.min(segment.y1, segment.y2);
      if (currentMinY < bestMinY) return idx;
    }
    return bestIndex;
  }, 0);

  const chain: Segment[] = [segments[startIndex]!];
  used[startIndex] = true;

  for (let step = 1; step < segments.length; step += 1) {
    const prev = chain[chain.length - 1]!;
    let bestIndex = -1;
    let bestReverse = false;
    let bestDistance = Infinity;

    for (let idx = 0; idx < segments.length; idx += 1) {
      if (used[idx]) continue;
      const candidate = segments[idx]!;
      const dForward = distanceBetween(prev.x2, prev.y2, candidate.x1, candidate.y1);
      if (dForward < bestDistance) {
        bestDistance = dForward;
        bestIndex = idx;
        bestReverse = false;
      }

      const dReverse = distanceBetween(prev.x2, prev.y2, candidate.x2, candidate.y2);
      if (dReverse < bestDistance) {
        bestDistance = dReverse;
        bestIndex = idx;
        bestReverse = true;
      }
    }

    if (bestIndex < 0) break;
    const nextSegment = bestReverse ? reverseSegment(segments[bestIndex]!) : segments[bestIndex]!;
    chain.push(nextSegment);
    used[bestIndex] = true;
  }

  return chain;
}

function computeBends(segments: Segment[]): BendInfo[] {
  const bends: BendInfo[] = [];

  for (let idx = 0; idx < segments.length - 1; idx += 1) {
    const current = segments[idx]!;
    const next = segments[idx + 1]!;

    if (current.type === "line" && next.type === "line") {
      const dx1 = current.x2 - current.x1;
      const dy1 = current.y2 - current.y1;
      const dx2 = next.x2 - next.x1;
      const dy2 = next.y2 - next.y1;
      const angle1 = Math.atan2(dy1, dx1);
      const angle2 = Math.atan2(dy2, dx2);
      let diff = toDegrees(angle2 - angle1);
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      if (Math.abs(diff) > 1) {
        const crossZ = dx1 * dy2 - dy1 * dx2;
        bends.push({
          angle: Math.abs(diff),
          radius: 1.5,
          segmentIndex: idx,
          side: crossZ >= 0 ? "left" : "right",
          direction: crossZ >= 0 ? "up" : "down",
        });
      }
      continue;
    }

    const arcSegment = current.type === "arc" ? current : next.type === "arc" ? next : null;
    if (!arcSegment) continue;

    const rawDelta = (arcSegment.endAngle ?? 0) - (arcSegment.startAngle ?? 0);
    const delta = Math.abs(rawDelta) > 1e-9
      ? Math.abs(rawDelta)
      : arcSegment.radius && arcSegment.radius > 0
      ? Math.abs(toDegrees((arcSegment.length ?? 0) / arcSegment.radius))
      : 0;

    bends.push({
      angle: delta || 45,
      radius: arcSegment.radius ?? 5,
      segmentIndex: idx,
      side: rawDelta >= 0 ? "left" : "right",
      direction: rawDelta >= 0 ? "up" : "down",
    });
  }

  return bends;
}

function buildSegmentDebug(segments: Segment[]): ImportEntityDebug[] {
  return segments.slice(0, 400).map((segment) => ({
    entityType: segment.sourceType ?? segment.type.toUpperCase(),
    layer: segment.sourceLayer ?? "0",
    start: { x: segment.x1, y: segment.y1 },
    end: { x: segment.x2, y: segment.y2 },
    radius: segment.radius,
    bulge: segment.sourceBulge,
    angleDeg: segment.type === "arc"
      ? Math.abs((segment.endAngle ?? 0) - (segment.startAngle ?? 0))
      : lineAngleDegrees(segment),
    length: segment.length,
  }));
}

export function parseDxfContent(content: string): ProfileGeometry {
  const lines = content.split(/\r?\n/);
  const unitsCode = parseInsUnits(lines);
  const { unitsName, unitsScaleToMm } = mapUnits(unitsCode);
  const { entities, entityCounts, layerCounts } = parseRawEntities(lines);

  const candidateSegments: Segment[] = [];
  let excludedByLayerHintCount = 0;

  for (const entity of entities) {
    const data = entity.data;
    const layer = entity.layer || "0";

    if (entity.type === "LINE") {
      const x1 = scaleToMm(parseNumber(data["10"]?.[0] ?? "0"), unitsScaleToMm);
      const y1 = scaleToMm(parseNumber(data["20"]?.[0] ?? "0"), unitsScaleToMm);
      const x2 = scaleToMm(parseNumber(data["11"]?.[0] ?? "0"), unitsScaleToMm);
      const y2 = scaleToMm(parseNumber(data["21"]?.[0] ?? "0"), unitsScaleToMm);
      candidateSegments.push({
        type: "line",
        x1,
        y1,
        x2,
        y2,
        length: distanceBetween(x1, y1, x2, y2),
        sourceType: entity.type,
        sourceLayer: layer,
      });
      if (isConstructionLayerHint(layer)) excludedByLayerHintCount += 1;
      continue;
    }

    if (entity.type === "ARC") {
      const cx = scaleToMm(parseNumber(data["10"]?.[0] ?? "0"), unitsScaleToMm);
      const cy = scaleToMm(parseNumber(data["20"]?.[0] ?? "0"), unitsScaleToMm);
      const radius = scaleToMm(parseNumber(data["40"]?.[0] ?? "1"), unitsScaleToMm);
      const startAngle = parseNumber(data["50"]?.[0] ?? "0");
      const endAngle = parseNumber(data["51"]?.[0] ?? "90");
      const x1 = cx + radius * Math.cos((startAngle * Math.PI) / 180);
      const y1 = cy + radius * Math.sin((startAngle * Math.PI) / 180);
      const x2 = cx + radius * Math.cos((endAngle * Math.PI) / 180);
      const y2 = cy + radius * Math.sin((endAngle * Math.PI) / 180);
      candidateSegments.push({
        type: "arc",
        x1,
        y1,
        x2,
        y2,
        cx,
        cy,
        radius,
        startAngle,
        endAngle,
        length: arcLengthFromDelta(radius, unwrapArcDelta(startAngle, endAngle)),
        sourceType: entity.type,
        sourceLayer: layer,
      });
      if (isConstructionLayerHint(layer)) excludedByLayerHintCount += 1;
      continue;
    }

    if (entity.type === "LWPOLYLINE" || entity.type === "POLYLINE") {
      const xs = (data["10"] ?? []).map(value => scaleToMm(parseNumber(value), unitsScaleToMm));
      const ys = (data["20"] ?? []).map(value => scaleToMm(parseNumber(value), unitsScaleToMm));
      const bulges = (data["42"] ?? []).map(parseNumber);
      const closed = (parseInt(data["70"]?.[0] ?? "0", 10) & 1) === 1;
      const nPoints = Math.min(xs.length, ys.length);

      for (let pi = 0; pi < nPoints - 1; pi += 1) {
        const ax = xs[pi]!;
        const ay = ys[pi]!;
        const bx = xs[pi + 1]!;
        const by = ys[pi + 1]!;
        const bulge = bulges[pi] ?? 0;
        const segment = Math.abs(bulge) < 1e-9
          ? { type: "line", x1: ax, y1: ay, x2: bx, y2: by, length: distanceBetween(ax, ay, bx, by) } satisfies Segment
          : parseBulgeSegment(ax, ay, bx, by, bulge);
        candidateSegments.push({
          ...segment,
          sourceType: entity.type,
          sourceLayer: layer,
          sourceBulge: bulge,
        });
      }

      if (closed && nPoints >= 2) {
        const ax = xs[nPoints - 1]!;
        const ay = ys[nPoints - 1]!;
        const bx = xs[0]!;
        const by = ys[0]!;
        const bulge = bulges[nPoints - 1] ?? 0;
        const segment = Math.abs(bulge) < 1e-9
          ? { type: "line", x1: ax, y1: ay, x2: bx, y2: by, length: distanceBetween(ax, ay, bx, by) } satisfies Segment
          : parseBulgeSegment(ax, ay, bx, by, bulge);
        candidateSegments.push({
          ...segment,
          sourceType: entity.type,
          sourceLayer: layer,
          sourceBulge: bulge,
        });
      }

      if (isConstructionLayerHint(layer)) excludedByLayerHintCount += 1;
      continue;
    }

    if (entity.type === "CIRCLE") {
      const cx = scaleToMm(parseNumber(data["10"]?.[0] ?? "0"), unitsScaleToMm);
      const cy = scaleToMm(parseNumber(data["20"]?.[0] ?? "0"), unitsScaleToMm);
      const radius = scaleToMm(parseNumber(data["40"]?.[0] ?? "1"), unitsScaleToMm);
      const x1 = cx + radius;
      const y1 = cy;
      candidateSegments.push({
        type: "arc",
        x1,
        y1,
        x2: x1,
        y2: y1,
        cx,
        cy,
        radius,
        startAngle: 0,
        endAngle: 360,
        length: 2 * Math.PI * radius,
        sourceType: entity.type,
        sourceLayer: layer,
      });
      if (isConstructionLayerHint(layer)) excludedByLayerHintCount += 1;
      continue;
    }

    if (entity.type === "SPLINE") {
      const fitXs = (data["11"] ?? []).map(value => scaleToMm(parseNumber(value), unitsScaleToMm));
      const fitYs = (data["21"] ?? []).map(value => scaleToMm(parseNumber(value), unitsScaleToMm));
      const ctrlXs = (data["10"] ?? []).map(value => scaleToMm(parseNumber(value), unitsScaleToMm));
      const ctrlYs = (data["20"] ?? []).map(value => scaleToMm(parseNumber(value), unitsScaleToMm));

      const fitPoints: Point2[] = [];
      for (let idx = 0; idx < Math.min(fitXs.length, fitYs.length); idx += 1) {
        fitPoints.push({ x: fitXs[idx]!, y: fitYs[idx]! });
      }

      const controlPoints: Point2[] = [];
      for (let idx = 0; idx < Math.min(ctrlXs.length, ctrlYs.length); idx += 1) {
        controlPoints.push({ x: ctrlXs[idx]!, y: ctrlYs[idx]! });
      }

      const sourcePoints = fitPoints.length >= 2 ? fitPoints : controlPoints;
      const sampled = sampleSplinePoints(sourcePoints);
      for (let pi = 0; pi < sampled.length - 1; pi += 1) {
        const a = sampled[pi]!;
        const b = sampled[pi + 1]!;
        candidateSegments.push({
          type: "line",
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          length: pointDistance(a, b),
          sourceType: entity.type,
          sourceLayer: layer,
        });
      }
      if (isConstructionLayerHint(layer)) excludedByLayerHintCount += 1;
    }
  }

  if (candidateSegments.length === 0) {
    const importDiagnostics: ImportDiagnostics = {
      unitsCode,
      unitsName,
      unitsScaleToMm,
      totalEntities: entities.length,
      entityCounts,
      layerCounts,
      segmentCountBeforeSelection: 0,
      segmentCountAfterSelection: 0,
      selectedLayers: [],
      excludedByLayerHintCount,
      curvedSourceEntityCount: (entityCounts["ARC"] ?? 0) + (entityCounts["SPLINE"] ?? 0),
      curvedSegmentCount: 0,
      isLikelyStraightLineCollapse: false,
      selectedPathLength: 0,
      notes: ["No supported geometry entities were reconstructed from DXF/DWG import."],
      segmentDebug: [],
    };

    return {
      segments: [],
      bends: [],
      totalLength: 0,
      boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
      importDiagnostics,
    };
  }

  const components = extractConnectedComponents(candidateSegments, 0.05);
  const scored = components.map((indices) => {
    const segments = indices.map(idx => candidateSegments[idx]!);
    const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
    const arcCount = segments.filter(segment => segment.type === "arc").length;
    const constructionCount = segments.filter(segment => isConstructionLayerHint(segment.sourceLayer ?? "0")).length;
    const allX = segments.flatMap(segment => [segment.x1, segment.x2]);
    const allY = segments.flatMap(segment => [segment.y1, segment.y2]);
    const width = Math.max(...allX) - Math.min(...allX);
    const height = Math.max(...allY) - Math.min(...allY);
    const span = Math.max(width, height);
    const constructionShare = constructionCount / Math.max(1, segments.length);
    const score = totalLength + arcCount * 40 + span * 0.3 - constructionShare * 120;
    return { indices, score, arcCount, constructionShare };
  });

  let candidates = scored;
  const nonConstruction = candidates.filter(candidate => candidate.constructionShare < 0.7);
  if (nonConstruction.length > 0) candidates = nonConstruction;
  const withArcs = candidates.filter(candidate => candidate.arcCount > 0);
  if (withArcs.length > 0) candidates = withArcs;

  const best = [...candidates].sort((a, b) => b.score - a.score)[0] ?? scored[0]!;
  const selectedSegments = orderSegmentChain(best.indices.map(index => candidateSegments[index]!));
  const bends = computeBends(selectedSegments);
  const totalLength = selectedSegments.reduce((sum, segment) => sum + segment.length, 0);

  const allX = selectedSegments.flatMap(segment => [segment.x1, segment.x2]);
  const allY = selectedSegments.flatMap(segment => [segment.y1, segment.y2]);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const width = maxX - minX;
  const height = maxY - minY;

  const curvedSourceEntityCount = (entityCounts["ARC"] ?? 0) + (entityCounts["SPLINE"] ?? 0) + (entityCounts["CIRCLE"] ?? 0);
  const curvedSegmentCount = selectedSegments.filter(segment => segment.type === "arc" || segment.sourceType === "SPLINE").length;
  const isLikelyStraightLineCollapse =
    selectedSegments.length >= 2 &&
    curvedSourceEntityCount > 0 &&
    selectedSegments.filter(segment => segment.type === "arc").length === 0 &&
    height <= Math.max(0.5, width * 0.01);

  const notes: string[] = [];
  if (components.length > 1) {
    notes.push(`Selected primary profile path from ${components.length} disconnected geometry component(s).`);
  }
  if (isLikelyStraightLineCollapse) {
    notes.push("Imported curved entities were reconstructed as a near-straight profile. Inspect spline/arc reconstruction.");
  }
  if (unitsScaleToMm !== 1) {
    notes.push(`Applied units conversion from ${unitsName} to mm (x${unitsScaleToMm}).`);
  }

  const importDiagnostics: ImportDiagnostics = {
    unitsCode,
    unitsName,
    unitsScaleToMm,
    totalEntities: entities.length,
    entityCounts,
    layerCounts,
    segmentCountBeforeSelection: candidateSegments.length,
    segmentCountAfterSelection: selectedSegments.length,
    selectedLayers: [...new Set(selectedSegments.map(segment => segment.sourceLayer ?? "0"))],
    excludedByLayerHintCount,
    curvedSourceEntityCount,
    curvedSegmentCount,
    isLikelyStraightLineCollapse,
    selectedPathLength: totalLength,
    notes,
    segmentDebug: buildSegmentDebug(selectedSegments),
  };

  return {
    segments: selectedSegments,
    bends,
    totalLength,
    boundingBox: { minX, minY, maxX, maxY, width, height },
    centroid: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    importDiagnostics,
  };
}
