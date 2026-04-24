/**
 * SEMI_GEO_NORMALIZE - Roll Forming Semi Agent
 * ===========================================
 * Geometry normalization agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  NormalizedGeometry,
  DXFEntity,
  Point2D,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_GEO_NORMALIZE',
  version: '1.0.0',
  timeout: 10000,
  retries: 2,
};

export interface GeoNormalizeInput {
  entities: DXFEntity[];
  options: NormalizeOptions;
}

export interface NormalizeOptions {
  scale?: number;
  rotate?: number;
  mirror?: boolean;
  mirrorAxis?: 'x' | 'y';
  centerOrigin?: boolean;
  snapToGrid?: number;
  removeDuplicates?: boolean;
}

export interface GeoNormalizeOutput {
  geometry: Point2D[];
  scale: number;
  rotation: number;
  offset: Point2D;
  mirrored: boolean;
  stats: NormalizeStats;
}

export interface NormalizeStats {
  originalPoints: number;
  finalPoints: number;
  duplicatesRemoved: number;
  boundingBox: { width: number; height: number };
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function normalizeGeometry(
  input: GeoNormalizeInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<GeoNormalizeOutput>> {
  try {
    const allPoints = extractAllPoints(input.entities);
    const originalCount = allPoints.length;

    let points = [...allPoints];

    const bbox = calculateBoundingBox(points);
    const scale = input.options.scale || 1;
    points = scalePoints(points, scale);

    if (input.options.centerOrigin) {
      const center = calculateCentroid(points);
      points = translatePoints(points, { x: -center.x, y: -center.y });
    }

    if (input.options.rotate) {
      points = rotatePoints(points, input.options.rotate);
    }

    if (input.options.mirror) {
      points = mirrorPoints(points, input.options.mirrorAxis || 'x');
    }

    if (input.options.snapToGrid) {
      points = snapPoints(points, input.options.snapToGrid);
    }

    if (input.options.removeDuplicates !== false) {
      points = removeDuplicatePoints(points);
    }

    const finalBBox = calculateBoundingBox(points);

    const stats: NormalizeStats = {
      originalPoints: originalCount,
      finalPoints: points.length,
      duplicatesRemoved: originalCount - points.length,
      boundingBox: {
        width: finalBBox.maxX - finalBBox.minX,
        height: finalBBox.maxY - finalBBox.minY,
      },
    };

    return {
      success: true,
      data: {
        geometry: points,
        scale,
        rotation: input.options.rotate || 0,
        offset: input.options.centerOrigin ? { x: 0, y: 0 } : { x: bbox.minX, y: bbox.minY },
        mirrored: input.options.mirror || false,
        stats,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Geometry normalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function extractAllPoints(entities: DXFEntity[]): Point2D[] {
  const points: Point2D[] = [];

  for (const entity of entities) {
    for (const point of entity.points) {
      points.push({ ...point });
    }
  }

  return points;
}

function calculateBoundingBox(points: Point2D[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return { minX, minY, maxX, maxY };
}

function calculateCentroid(points: Point2D[]): Point2D {
  if (points.length === 0) return { x: 0, y: 0 };

  let sumX = 0, sumY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
  }

  return { x: sumX / points.length, y: sumY / points.length };
}

function scalePoints(points: Point2D[], scale: number): Point2D[] {
  return points.map(p => ({
    x: p.x * scale,
    y: p.y * scale,
  }));
}

function translatePoints(points: Point2D[], offset: Point2D): Point2D[] {
  return points.map(p => ({
    x: p.x + offset.x,
    y: p.y + offset.y,
  }));
}

function rotatePoints(points: Point2D[], angleDeg: number): Point2D[] {
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  return points.map(p => ({
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
  }));
}

function mirrorPoints(points: Point2D[], axis: 'x' | 'y'): Point2D[] {
  return points.map(p => ({
    x: axis === 'x' ? -p.x : p.x,
    y: axis === 'y' ? -p.y : p.y,
  }));
}

function snapPoints(points: Point2D[], grid: number): Point2D[] {
  return points.map(p => ({
    x: Math.round(p.x / grid) * grid,
    y: Math.round(p.y / grid) * grid,
  }));
}

function removeDuplicatePoints(points: Point2D[], tolerance = 0.001): Point2D[] {
  const unique: Point2D[] = [];

  for (const p of points) {
    const isDuplicate = unique.some(u =>
      Math.abs(u.x - p.x) < tolerance && Math.abs(u.y - p.y) < tolerance
    );
    if (!isDuplicate) {
      unique.push(p);
    }
  }

  return unique;
}

// ============================================
// VALIDATION
// ============================================

export function validateNormalized(result: GeoNormalizeOutput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (result.geometry.length === 0) {
    errors.push('No geometry points after normalization');
  }

  const hasNaN = result.geometry.some(p => isNaN(p.x) || isNaN(p.y));
  if (hasNaN) {
    errors.push('Contains invalid coordinates');
  }

  if (result.stats.boundingBox.width <= 0 || result.stats.boundingBox.height <= 0) {
    errors.push('Invalid bounding box dimensions');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiGeoNormalize = {
  config: CONFIG,
  normalizeGeometry,
  validateNormalized,
};

export default SemiGeoNormalize;
