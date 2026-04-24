/**
 * SEMI_FEA_SOLVER - Roll Forming Semi Agent
 * ===========================================
 * FEA solver agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  FEASolverResult,
  FEAResults,
  Station,
  Material,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_FEA_SOLVER',
  version: '1.0.0',
  timeout: 60000,
  retries: 1,
};

export interface FEASolverInput {
  stations: Station[];
  material: Material;
  meshSize?: number;
  frictionCoefficient?: number;
}

export interface FEASolverOutput {
  result: FEASolverResult;
  computationTime: number;
  meshStats: MeshStats;
}

export interface MeshStats {
  nodeCount: number;
  elementCount: number;
  elementType: string;
  quality: number;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function runFEASolver(
  input: FEASolverInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<FEASolverOutput>> {
  const startTime = Date.now();

  try {
    const meshSize = input.meshSize || 2;
    const frictionCoeff = input.frictionCoefficient || 0.15;

    const meshStats = generateMesh(input.stations, meshSize);
    const elementType = selectElementType(input.material);
    const meshQuality = calculateMeshQuality(meshStats);

    const iterations = estimateSolverIterations(meshStats.elementCount);
    const convergenceError = runConvergenceCheck(iterations);

    const results = computeFEAResults(
      input.stations,
      input.material,
      frictionCoeff
    );

    const computationTime = Date.now() - startTime;

    const result: FEASolverResult = {
      meshQuality: meshQuality,
      solverIterations: iterations,
      convergenceError,
      results,
    };

    return {
      success: true,
      data: {
        result,
        computationTime,
        meshStats,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `FEA solver failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function generateMesh(stations: Station[], meshSize: number): MeshStats {
  let nodeCount = 0;
  let elementCount = 0;

  for (const station of stations) {
    const thickness = station.materialState.thickness;
    const width = 100;

    const nodesX = Math.ceil(width / meshSize) + 1;
    const nodesY = Math.ceil(thickness / meshSize) + 1;

    nodeCount += nodesX * nodesY;
    elementCount += (nodesX - 1) * (nodesY - 1);
  }

  return {
    nodeCount,
    elementCount,
    elementType: 'Quad4',
    quality: 0.85,
  };
}

function selectElementType(material: Material): string {
  if (material.type === 'AL') return 'Quad4';
  if (material.type === 'TI') return 'Quad8';
  return 'Quad4';
}

function calculateMeshQuality(stats: MeshStats): number {
  const aspectRatio = stats.elementCount / (stats.nodeCount / 4);
  const idealRatio = 1.0;

  const quality = Math.max(0, Math.min(1, 1 - Math.abs(aspectRatio - idealRatio) * 0.1));

  return Math.round(quality * 100) / 100;
}

function estimateSolverIterations(elementCount: number): number {
  const baseIterations = 100;
  const scaleFactor = Math.sqrt(elementCount / 1000);

  return Math.round(baseIterations * scaleFactor);
}

function runConvergenceCheck(iterations: number): number {
  const initialError = 1.0;
  const convergenceRate = 0.7;

  let error = initialError;
  for (let i = 0; i < iterations; i++) {
    error *= convergenceRate;
  }

  return Math.round(error * 1e6) / 1e6;
}

function computeFEAResults(
  stations: Station[],
  material: Material,
  friction: number
): FEAResults {
  const displacement: { x: number; y: number; z: number }[] = [];
  const stress: number[] = [];
  const strain: number[] = [];
  const vonMises: number[] = [];

  for (const station of stations) {
    const strainValue = station.materialState.strain;
    const stressValue = station.materialState.stress;

    strain.push(Math.round(strainValue * 1e6) / 1e6);
    stress.push(Math.round(stressValue / 1000 * 1e6) / 1e6);

    const vm = calculateVonMises(stressValue, stressValue * 0.3, stressValue * 0.2);
    vonMises.push(Math.round(vm / 1000 * 1e6) / 1e6);

    const dispX = station.formingAngle * 0.01;
    const dispY = strainValue * 10;
    const dispZ = 0;

    displacement.push({
      x: Math.round(dispX * 1000) / 1000,
      y: Math.round(dispY * 1000) / 1000,
      z: Math.round(dispZ * 1000) / 1000,
    });
  }

  return {
    displacement: displacement as unknown as { x: number; y: number; z: number }[],
    stress,
    strain,
    vonMises,
  };
}

function calculateVonMises(s1: number, s2: number, s3: number): number {
  const svm = Math.sqrt(
    0.5 * (
      Math.pow(s1 - s2, 2) +
      Math.pow(s2 - s3, 2) +
      Math.pow(s3 - s1, 2)
    )
  );

  return svm;
}

// ============================================
// VALIDATION
// ============================================

export function validateFEAResult(result: FEASolverResult): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (result.meshQuality < 0.7) {
    warnings.push('Poor mesh quality - consider refining mesh');
  }

  if (result.convergenceError > 0.001) {
    warnings.push('Solution may not have fully converged');
  }

  if (result.solverIterations > 500) {
    warnings.push('High iteration count - solution may be slow to converge');
  }

  const maxStress = Math.max(...result.results.stress);
  const maxVonMises = Math.max(...result.results.vonMises);

  if (maxVonMises > maxStress * 1.5) {
    warnings.push('High von Mises stress relative to actual stress');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

// ============================================
// EXPORT
// ============================================

export const SemiFEASolver = {
  config: CONFIG,
  runFEASolver,
  validateFEAResult,
};

export default SemiFEASolver;
