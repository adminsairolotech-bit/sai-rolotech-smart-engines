/**
 * SEMI_DXF_LOADER - Roll Forming Semi Agent
 * ===========================================
 * DXF file loading and parsing agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  DXFProfile,
  DXFLayer,
  DXFEntity,
  BoundingBox,
  ProfileMetadata,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_DXF_LOADER',
  version: '1.0.0',
  timeout: 30000,
  retries: 3,
};

export interface DXFLoaderInput {
  fileData: string | ArrayBuffer;
  filename: string;
  encoding?: 'utf-8' | 'ascii';
  scale?: number;
}

export interface DXFLoaderOutput {
  profile: DXFProfile;
  parseTime: number;
  entityCount: number;
  layerCount: number;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function loadDXF(
  input: DXFLoaderInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<DXFLoaderOutput>> {
  const startTime = Date.now();

  try {
    const fileContent = typeof input.fileData === 'string'
      ? input.fileData
      : new TextDecoder(input.encoding || 'utf-8').decode(input.fileData);

    const layers = parseLayers(fileContent);
    const entities = parseEntities(fileContent);
    const bounds = calculateBounds(entities);
    const metadata = calculateMetadata(entities);

    const profile: DXFProfile = {
      id: `profile_${Date.now()}`,
      name: input.filename.replace(/\.[^.]+$/, ''),
      filename: input.filename,
      layers,
      entities,
      bounds,
      metadata,
    };

    const parseTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        profile,
        parseTime,
        entityCount: entities.length,
        layerCount: layers.length,
      },
      metadata: {
        parseTime,
        fileSize: fileContent.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `DXF loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function parseLayers(content: string): DXFLayer[] {
  const layers: DXFLayer[] = [];
  const layerPattern = /LAYER.*?NAME\s*\(?\s*["']?([^"'\)]+)["']?\s*\).*?COLOR\s*\(?\s*(\d+)\s*\)/gi;
  let match;

  while ((match = layerPattern.exec(content)) !== null) {
    layers.push({
      name: match[1].trim(),
      color: parseInt(match[2], 10),
      lineType: 'CONTINUOUS',
      visible: true,
    });
  }

  if (layers.length === 0) {
    layers.push({
      name: '0',
      color: 7,
      lineType: 'CONTINUOUS',
      visible: true,
    });
  }

  return layers;
}

function parseEntities(content: string): DXFEntity[] {
  const entities: DXFEntity[] = [];

  const polylineMatches = content.matchAll(/LWPOLYLINE.*?ENDBLK/gi);
  for (const match of polylineMatches) {
    const polylineContent = match[0];
    const points = parsePolylinePoints(polylineContent);
    if (points.length > 0) {
      entities.push({
        type: 'POLYLINE',
        points,
        layer: extractLayer(polylineContent) || '0',
        closed: polylineContent.includes('70') && parseInt(extractCodeValue(polylineContent, '70') || '0', 10) === 1,
      });
    }
  }

  const lineMatches = content.matchAll(/LINE\s+X1\s*\[?\s*([-\d.]+).*?Y1\s*\[?\s*([-\d.]+).*?X2\s*\[?\s*([-\d.]+).*?Y2\s*\[?\s*([-\d.]+)/gi);
  for (const match of lineMatches) {
    entities.push({
      type: 'LINE',
      points: [
        { x: parseFloat(match[1]), y: parseFloat(match[2]) },
        { x: parseFloat(match[3]), y: parseFloat(match[4]) },
      ],
      layer: extractLayer(match[0]) || '0',
    });
  }

  const arcMatches = content.matchAll(/ARC.*?R\s*\[?\s*([-\d.]+).*?X\d\s*\[?\s*([-\d.]+).*?Y\d\s*\[?\s*([-\d.]+)/gi);
  for (const match of arcMatches) {
    const radius = parseFloat(match[1]);
    const centerX = parseFloat(match[2]);
    const centerY = parseFloat(match[3]);
    const points = generateArcPoints(centerX, centerY, radius);
    entities.push({
      type: 'ARC',
      points,
      layer: extractLayer(match[0]) || '0',
    });
  }

  return entities;
}

function parsePolylinePoints(content: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const coordMatches = content.matchAll(/10\s*\[?\s*([-\d.]+).*?20\s*\[?\s*([-\d.]+)/gi);

  for (const match of coordMatches) {
    points.push({
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
    });
  }

  return points;
}

function generateArcPoints(cx: number, cy: number, radius: number, segments = 16): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (Math.PI * 2 * i) / segments;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return points;
}

function extractLayer(content: string): string | null {
  const layerMatch = content.match(/LAYER.*?NAME\s*\(?\s*["']?([^"'\)]+)["']?\s*\)/i);
  return layerMatch ? layerMatch[1] : null;
}

function extractCodeValue(content: string, code: string): string | null {
  const pattern = new RegExp(`${code}\\s*\\[?\\s*([-\\d.]+)`, 'i');
  const match = content.match(pattern);
  return match ? match[1] : null;
}

function calculateBounds(entities: DXFEntity[]): BoundingBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const entity of entities) {
    for (const point of entity.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }

  return { minX, minY, maxX, maxY };
}

function calculateMetadata(entities: DXFEntity[]): ProfileMetadata {
  let totalArea = 0;
  let perimeter = 0;

  for (const entity of entities) {
    if (entity.type === 'POLYLINE' && entity.closed) {
      totalArea += calculatePolygonArea(entity.points);
      perimeter += calculatePolygonPerimeter(entity.points);
    } else if (entity.type === 'LINE') {
      perimeter += calculateDistance(entity.points[0], entity.points[1]);
    }
  }

  const centroid = calculateCentroid(entities);

  return {
    area: totalArea,
    perimeter,
    centroid,
    momentsOfInertia: {
      ixx: 0,
      iyy: 0,
      ixy: 0,
    },
  };
}

function calculatePolygonArea(points: { x: number; y: number }[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

function calculatePolygonPerimeter(points: { x: number; y: number }[]): number {
  let perimeter = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += calculateDistance(points[i], points[j]);
  }
  return perimeter;
}

function calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function calculateCentroid(entities: DXFEntity[]): { x: number; y: number } {
  let sumX = 0, sumY = 0, count = 0;

  for (const entity of entities) {
    for (const point of entity.points) {
      sumX += point.x;
      sumY += point.y;
      count++;
    }
  }

  return count > 0
    ? { x: sumX / count, y: sumY / count }
    : { x: 0, y: 0 };
}

// ============================================
// VALIDATION
// ============================================

export function validateDXF(profile: DXFProfile): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (profile.entities.length === 0) {
    errors.push('No entities found in DXF file');
  }

  if (profile.bounds.maxX === -Infinity || profile.bounds.maxY === -Infinity) {
    errors.push('Invalid bounding box');
  }

  const validEntities = profile.entities.filter(e => e.points.length >= 2);
  if (validEntities.length === 0) {
    errors.push('No valid geometry found');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiDXFLoader = {
  config: CONFIG,
  loadDXF,
  validateDXF,
};

export default SemiDXFLoader;
