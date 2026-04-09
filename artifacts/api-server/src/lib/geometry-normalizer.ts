/**
 * geometry-normalizer.ts - P0.A Geometry Normalization Layer
 *
 * Validates and normalizes parsed DXF geometry before downstream engines consume it.
 * Detects: gaps, duplicates, reversed segments, open contours, and winding order issues.
 */

import type { Segment, ProfileGeometry } from "./dxf-parser-util";

export type NormalizationSeverity = "ok" | "warning" | "error" | "blocked";

export interface GeometryIssue {
  code: string;
  severity: NormalizationSeverity;
  message: string;
  affectedIndices?: number[];
}

export interface GeometryHealth {
  isValid: boolean;
  overallSeverity: NormalizationSeverity;
  issues: GeometryIssue[];
  gapCount: number;
  duplicateCount: number;
  reversedCount: number;
  windingOrder: "CW" | "CCW" | "unknown" | "open";
  isClosedContour: boolean;
  contourBreaks: number[];
  dimensionBlocked: boolean;
  message: string;
}

const GAP_TOLERANCE = 1e-3;

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

function computeSignedArea(segments: Segment[]): number {
  let area = 0;
  for (const segment of segments) {
    area += segment.x1 * segment.y2 - segment.x2 * segment.y1;
  }
  return area / 2;
}

function areDuplicates(a: Segment, b: Segment): boolean {
  const tol = GAP_TOLERANCE;
  const forward = dist(a.x1, a.y1, b.x1, b.y1) < tol && dist(a.x2, a.y2, b.x2, b.y2) < tol;
  const reverse = dist(a.x1, a.y1, b.x2, b.y2) < tol && dist(a.x2, a.y2, b.x1, b.y1) < tol;
  return forward || reverse;
}

function detectGaps(segments: Segment[]): { indices: number[]; breaks: number[] } {
  const indices: number[] = [];
  const breaks: number[] = [];
  for (let i = 0; i < segments.length - 1; i += 1) {
    const a = segments[i]!;
    const b = segments[i + 1]!;
    const d = dist(a.x2, a.y2, b.x1, b.y1);
    if (d > GAP_TOLERANCE) {
      indices.push(i);
      breaks.push(i + 1);
    }
  }
  return { indices, breaks };
}

function detectDuplicates(segments: Segment[]): number[] {
  const duplicateIndices: number[] = [];
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      if (areDuplicates(segments[i]!, segments[j]!) && !duplicateIndices.includes(j)) {
        duplicateIndices.push(j);
      }
    }
  }
  return duplicateIndices;
}

function removeDuplicates(segments: Segment[]): { cleaned: Segment[]; removed: number } {
  const duplicateIndices = detectDuplicates(segments);
  const duplicateSet = new Set(duplicateIndices);
  return {
    cleaned: segments.filter((_, index) => !duplicateSet.has(index)),
    removed: duplicateIndices.length,
  };
}

function isContourClosed(segments: Segment[]): boolean {
  if (segments.length < 2) return false;
  const first = segments[0]!;
  const last = segments[segments.length - 1]!;
  return dist(last.x2, last.y2, first.x1, first.y1) < GAP_TOLERANCE;
}

function detectDegenerateSegments(segments: Segment[]): number[] {
  const minLength = 0.01;
  return segments
    .map((segment, index) => (segment.length < minLength ? index : -1))
    .filter(index => index >= 0);
}

function forceCounterClockwise(segments: Segment[]): { reordered: Segment[]; wasReversed: boolean } {
  const area = computeSignedArea(segments);
  if (area >= 0) return { reordered: segments, wasReversed: false };

  const reordered: Segment[] = [...segments].reverse().map(segment => ({
    ...segment,
    x1: segment.x2,
    y1: segment.y2,
    x2: segment.x1,
    y2: segment.y1,
    startAngle: segment.endAngle,
    endAngle: segment.startAngle,
  }));
  return { reordered, wasReversed: true };
}

function rechainSegments(segments: Segment[]): { chained: Segment[]; gapsRemaining: number } {
  if (segments.length === 0) return { chained: [], gapsRemaining: 0 };

  const used = new Array(segments.length).fill(false);
  const result: Segment[] = [segments[0]!];
  used[0] = true;
  let gapsRemaining = 0;

  for (let step = 1; step < segments.length; step += 1) {
    const last = result[result.length - 1]!;
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let j = 0; j < segments.length; j += 1) {
      if (used[j]) continue;
      const segment = segments[j]!;
      const dForward = dist(last.x2, last.y2, segment.x1, segment.y1);
      const dReverse = dist(last.x2, last.y2, segment.x2, segment.y2);

      if (dForward < bestDistance) {
        bestDistance = dForward;
        bestIndex = j;
      }
      if (dReverse < bestDistance) {
        bestDistance = dReverse;
        bestIndex = -(j + 1);
      }
    }

    if (bestIndex === 0 && !Number.isFinite(bestDistance)) break;

    if (bestIndex < 0) {
      const index = -(bestIndex + 1);
      const segment = segments[index]!;
      const reversed: Segment = {
        ...segment,
        x1: segment.x2,
        y1: segment.y2,
        x2: segment.x1,
        y2: segment.y1,
        startAngle: segment.endAngle,
        endAngle: segment.startAngle,
      };
      result.push(reversed);
      used[index] = true;
    } else {
      result.push(segments[bestIndex]!);
      used[bestIndex] = true;
    }

    if (bestDistance > GAP_TOLERANCE) gapsRemaining += 1;
  }

  return { chained: result, gapsRemaining };
}

export function normalizeGeometry(geometry: ProfileGeometry): {
  geometry: ProfileGeometry;
  health: GeometryHealth;
} {
  const issues: GeometryIssue[] = [];
  let segments = [...geometry.segments];

  if (segments.length === 0) {
    return {
      geometry,
      health: {
        isValid: false,
        overallSeverity: "error",
        issues: [{ code: "NO_SEGMENTS", severity: "error", message: "No segments found in geometry" }],
        gapCount: 0,
        duplicateCount: 0,
        reversedCount: 0,
        windingOrder: "unknown",
        isClosedContour: false,
        contourBreaks: [],
        dimensionBlocked: true,
        message: "Geometry is empty - cannot process",
      },
    };
  }

  const { cleaned: dedupedSegments, removed: duplicateCount } = removeDuplicates(segments);
  if (duplicateCount > 0) {
    issues.push({
      code: "DUPLICATE_SEGMENTS",
      severity: "warning",
      message: `Removed ${duplicateCount} duplicate segment(s)`,
    });
  }
  segments = dedupedSegments;

  const degenerateIndices = detectDegenerateSegments(segments);
  if (degenerateIndices.length > 0) {
    const degenerateSet = new Set(degenerateIndices);
    segments = segments.filter((_, index) => !degenerateSet.has(index));
    issues.push({
      code: "DEGENERATE_SEGMENTS",
      severity: "warning",
      message: `Removed ${degenerateIndices.length} degenerate/zero-length segment(s)`,
      affectedIndices: degenerateIndices,
    });
  }

  const { chained } = rechainSegments(segments);
  segments = chained;

  const { indices: gapIndices, breaks: contourBreaks } = detectGaps(segments);
  const gapCount = gapIndices.length;
  if (gapCount > 0) {
    issues.push({
      code: "OPEN_CONTOUR_GAPS",
      severity: gapCount > 2 ? "error" : "warning",
      message: `${gapCount} gap(s) detected between segments - open contour likely`,
      affectedIndices: gapIndices,
    });
  }

  const closed = isContourClosed(segments);
  if (!closed && gapCount === 0 && segments.length > 2) {
    issues.push({
      code: "OPEN_PROFILE",
      severity: "warning",
      message: "Profile is an open polyline (not closed). This is normal for roll forming profiles.",
    });
  }

  let windingOrder: GeometryHealth["windingOrder"] = "unknown";
  let reversedCount = 0;
  if (closed) {
    const area = computeSignedArea(segments);
    if (Math.abs(area) < 1e-6) {
      windingOrder = "unknown";
    } else if (area > 0) {
      windingOrder = "CCW";
    } else {
      windingOrder = "CW";
      const { reordered, wasReversed } = forceCounterClockwise(segments);
      if (wasReversed) {
        segments = reordered;
        reversedCount = segments.length;
        issues.push({
          code: "FORCED_CCW",
          severity: "warning",
          message: "Geometry was CW - reversed to CCW for consistent downstream processing",
        });
      }
    }
  } else {
    windingOrder = "open";
  }

  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  if (totalLength < 1.0) {
    issues.push({
      code: "TINY_GEOMETRY",
      severity: "error",
      message: `Total profile length is ${totalLength.toFixed(3)} mm - likely a scaling issue`,
    });
  }

  const allX = segments.flatMap(segment => [segment.x1, segment.x2]);
  const allY = segments.flatMap(segment => [segment.y1, segment.y2]);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const width = maxX - minX;
  const height = maxY - minY;

  if (width > 5000 || height > 5000) {
    issues.push({
      code: "OVERSIZED_GEOMETRY",
      severity: "warning",
      message: `Profile bounding box ${width.toFixed(1)}x${height.toFixed(1)} mm seems very large - check units`,
    });
  }

  const severityRank: Record<NormalizationSeverity, number> = { ok: 0, warning: 1, error: 2, blocked: 3 };
  let overallSeverity: NormalizationSeverity = "ok";
  for (const issue of issues) {
    if (severityRank[issue.severity] > severityRank[overallSeverity]) {
      overallSeverity = issue.severity;
    }
  }

  const isValid = overallSeverity !== "blocked" && overallSeverity !== "error";
  const dimensionBlocked = overallSeverity === "blocked" || overallSeverity === "error";

  const normalizedGeometry: ProfileGeometry = {
    ...geometry,
    segments,
    bends: geometry.bends,
    totalLength,
    boundingBox: { minX, minY, maxX, maxY, width, height },
  };

  const message = issues.length === 0
    ? "Geometry is clean - no issues found"
    : issues.map(issue => `[${issue.code}] ${issue.message}`).join("; ");

  return {
    geometry: normalizedGeometry,
    health: {
      isValid,
      overallSeverity,
      issues,
      gapCount,
      duplicateCount,
      reversedCount,
      windingOrder,
      isClosedContour: closed,
      contourBreaks,
      dimensionBlocked,
      message,
    },
  };
}
