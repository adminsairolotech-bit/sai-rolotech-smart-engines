/**
 * SEMI_SEQ_GENERATE - Roll Forming Semi Agent
 * ===========================================
 * Sequence generation agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  FlowerStation,
  Station,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_SEQ_GENERATE',
  version: '1.0.0',
  timeout: 15000,
  retries: 2,
};

export interface SeqGenerateInput {
  flowerStations: FlowerStation[];
  rollDesigns: { stationIndex: number; formingAngle: number }[];
  parallelism?: boolean;
}

export interface SeqGenerateOutput {
  sequence: SequenceItem[];
  parallelGroups: number[][];
  deadlockCheck: DeadlockResult;
  balanceScore: number;
}

export interface SequenceItem {
  step: number;
  stationIndex: number;
  action: string;
  dependencies: number[];
  duration: number;
}

export interface DeadlockResult {
  hasDeadlock: boolean;
  criticalPath: number[];
  totalDuration: number;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function generateSequence(
  input: SeqGenerateInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<SeqGenerateOutput>> {
  try {
    const sequence: SequenceItem[] = [];
    let step = 0;

    const sequence_3d = generate3DPath(input.flowerStations);
    sequence.push(...sequence_3d);
    step += sequence_3d.length;

    const profileCut = generateProfileCut(input.flowerStations);
    if (profileCut) {
      sequence.push(profileCut);
      step++;
    }

    const toolingInstall = generateToolingInstall(input.rollDesigns);
    sequence.push(...toolingInstall.map((item, i) => ({ ...item, step: step + i })));
    step += toolingInstall.length;

    const debug = generateDebugSequence(input.rollDesigns);
    sequence.push(...debug.map((item, i) => ({ ...item, step: step + i })));

    const parallelGroups = identifyParallelGroups(sequence, input.parallelism ?? false);
    const deadlockCheck = checkDeadlock(sequence);
    const balanceScore = calculateBalanceScore(sequence, parallelGroups);

    return {
      success: true,
      data: {
        sequence,
        parallelGroups,
        deadlockCheck,
        balanceScore,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Sequence generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function generate3DPath(stations: FlowerStation[]): SequenceItem[] {
  return stations.map((station, i) => ({
    step: i,
    stationIndex: station.index,
    action: '3D_PROFILE_GEN',
    dependencies: i === 0 ? [] : [i - 1],
    duration: 2,
  }));
}

function generateProfileCut(stations: FlowerStation[]): SequenceItem | null {
  if (stations.length === 0) return null;

  return {
    step: 0,
    stationIndex: -1,
    action: 'PROFILE_CUT',
    dependencies: [stations.length - 1],
    duration: 5,
  };
}

function generateToolingInstall(
  rollDesigns: { stationIndex: number; formingAngle: number }[]
): Omit<SequenceItem, 'step'>[] {
  return rollDesigns.map((roll, i) => ({
    stationIndex: roll.stationIndex,
    action: 'TOOLING_INSTALL',
    dependencies: i === 0 ? [] : [i - 1],
    duration: 3,
  }));
}

function generateDebugSequence(
  rollDesigns: { stationIndex: number; formingAngle: number }[]
): Omit<SequenceItem, 'step'>[] {
  return rollDesigns.map((roll, i) => ({
    stationIndex: roll.stationIndex,
    action: 'DEBUG_CHECK',
    dependencies: [i],
    duration: 1,
  }));
}

function identifyParallelGroups(sequence: SequenceItem[], enableParallelism: boolean): number[][] {
  if (!enableParallelism) {
    return sequence.map((_, i) => [i]);
  }

  const groups: number[][] = [];
  const maxParallel = 3;

  for (let i = 0; i < sequence.length; i += maxParallel) {
    const group = [];
    for (let j = 0; j < maxParallel && i + j < sequence.length; j++) {
      const item = sequence[i + j];
      const canParallel = item.dependencies.every(dep => {
        const depIndex = sequence.findIndex(s => s.step === dep);
        return depIndex < i;
      });

      if (canParallel || item.dependencies.length === 0) {
        group.push(i + j);
      } else {
        break;
      }
    }

    if (group.length > 0) {
      groups.push(group);
    }
  }

  return groups;
}

function checkDeadlock(sequence: SequenceItem[]): DeadlockResult {
  const visited = new Set<number>();
  const recursionStack = new Set<number>();
  const criticalPath: number[] = [];

  function dfs(index: number, path: number[]): boolean {
    if (recursionStack.has(index)) {
      return true;
    }

    if (visited.has(index)) {
      return false;
    }

    visited.add(index);
    recursionStack.add(index);
    path.push(index);

    const item = sequence[index];
    for (const dep of item.dependencies) {
      const depIndex = sequence.findIndex(s => s.step === dep);
      if (depIndex >= 0 && dfs(depIndex, path)) {
        return true;
      }
    }

    recursionStack.delete(index);
    if (path.length > criticalPath.length) {
      criticalPath.length = 0;
      criticalPath.push(...path);
    }
    path.pop();

    return false;
  }

  for (let i = 0; i < sequence.length; i++) {
    if (!visited.has(i)) {
      dfs(i, []);
    }
  }

  const totalDuration = sequence.reduce((sum, item) => sum + item.duration, 0);

  return {
    hasDeadlock: false,
    criticalPath,
    totalDuration,
  };
}

function calculateBalanceScore(sequence: SequenceItem[], parallelGroups: number[][]): number {
  if (parallelGroups.length === 0) return 0;

  const groupDurations = parallelGroups.map(group =>
    Math.max(...group.map(i => sequence[i]?.duration || 0))
  );

  const avgDuration = groupDurations.reduce((a, b) => a + b, 0) / groupDurations.length;
  const variance = groupDurations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / groupDurations.length;
  const stdDev = Math.sqrt(variance);

  const score = Math.max(0, 100 - (stdDev / avgDuration) * 50);
  return Math.round(score * 10) / 10;
}

// ============================================
// VALIDATION
// ============================================

export function validateSequence(output: SeqGenerateOutput): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (output.sequence.length === 0) {
    errors.push('Empty sequence generated');
  }

  if (output.deadlockCheck.hasDeadlock) {
    errors.push('Deadlock detected in sequence');
  }

  if (output.balanceScore < 70) {
    warnings.push(`Poor balance score: ${output.balanceScore.toFixed(0)}%`);
  }

  const circularDeps = findCircularDependencies(output.sequence);
  if (circularDeps.length > 0) {
    errors.push(`Circular dependencies: ${circularDeps.join(' -> ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function findCircularDependencies(sequence: SequenceItem[]): string[] {
  const visited = new Set<number>();
  const path: number[] = [];

  function dfs(index: number): string[] | null {
    if (path.includes(index)) {
      const cycleStart = path.indexOf(index);
      return path.slice(cycleStart).map(i => `S${sequence[i]?.stationIndex || i}`);
    }

    if (visited.has(index)) return null;

    visited.add(index);
    path.push(index);

    const item = sequence[index];
    for (const dep of item.dependencies) {
      const depIndex = sequence.findIndex(s => s.step === dep);
      if (depIndex >= 0) {
        const cycle = dfs(depIndex);
        if (cycle) return cycle;
      }
    }

    path.pop();
    return null;
  }

  for (let i = 0; i < sequence.length; i++) {
    const cycle = dfs(i);
    if (cycle) return cycle;
  }

  return [];
}

// ============================================
// EXPORT
// ============================================

export const SemiSeqGenerate = {
  config: CONFIG,
  generateSequence,
  validateSequence,
};

export default SemiSeqGenerate;
