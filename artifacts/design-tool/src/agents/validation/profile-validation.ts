/**
 * PROFILE VALIDATION TEST RUNNER
 * ==============================
 * Automated validation for 10 standard profiles
 * Compares software calculations with reference data
 */

import { STANDARD_PROFILES_REFERENCE, type ProfileReference } from './reference-data/standard-profiles-reference';
import type { SemiAgentContext } from '../types/semi-agent-types';

// ============================================
// VALIDATION RESULT TYPES
// ============================================

export interface ValidationResult {
  profileId: string;
  profileName: string;
  passed: boolean;
  accuracy: number;
  metrics: MetricComparison[];
  errors: string[];
  warnings: string[];
  timestamp: number;
}

export interface MetricComparison {
  metric: string;
  expected: number;
  actual: number;
  difference: number;
  differencePercent: number;
  tolerance: number;
  passed: boolean;
}

export interface BatchValidationResult {
  totalProfiles: number;
  passed: number;
  failed: number;
  accuracyScore: number;
  results: ValidationResult[];
  failedMetrics: string[];
  summary: ValidationSummary;
}

export interface ValidationSummary {
  stripWidthAccuracy: number;
  stationCountAccuracy: number;
  springbackAccuracy: number;
  gcodeAccuracy: number;
  overallPassRate: number;
  criticalFailures: string[];
}

// ============================================
// TOLERANCE SETTINGS
// ============================================

const TOLERANCES = {
  stripWidth: 3, // mm
  stationCount: 1, // stations
  springbackFactor: 0.01, // ratio
  kFactor: 0.02, // ratio
  bendAllowance: 0.5, // mm
  totalBendAngle: 5, // degrees
  gcodeLineCount: 20, // lines
  safetyScore: 5, // points
};

// ============================================
// MAIN VALIDATION FUNCTION
// ============================================

export async function runProfileValidation(
  calculatedResults: Map<string, CalculatedProfile>,
  context?: Partial<SemiAgentContext>
): Promise<BatchValidationResult> {
  const ctx: SemiAgentContext = {
    projectId: context?.projectId || 'validation_batch',
    sessionId: context?.sessionId || `validation_${Date.now()}`,
    timestamp: Date.now(),
  };

  const results: ValidationResult[] = [];
  const failedMetrics: string[] = [];

  for (const reference of STANDARD_PROFILES_REFERENCE) {
    const calculated = calculatedResults.get(reference.id);

    if (!calculated) {
      results.push({
        profileId: reference.id,
        profileName: reference.name,
        passed: false,
        accuracy: 0,
        metrics: [],
        errors: [`No calculated result found for ${reference.id}`],
        warnings: [],
        timestamp: Date.now(),
      });
      failedMetrics.push(reference.id);
      continue;
    }

    const validationResult = validateProfile(reference, calculated, ctx);
    results.push(validationResult);

    if (!validationResult.passed) {
      failedMetrics.push(reference.id);
    }

    for (const metric of validationResult.metrics) {
      if (!metric.passed) {
        if (!failedMetrics.includes(metric.metric)) {
          failedMetrics.push(metric.metric);
        }
      }
    }
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const accuracyScore = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;

  const summary = calculateSummary(results, failedMetrics);

  return {
    totalProfiles: STANDARD_PROFILES_REFERENCE.length,
    passed,
    failed,
    accuracyScore: Math.round(accuracyScore * 10) / 10,
    results,
    failedMetrics,
    summary,
  };
}

// ============================================
// INDIVIDUAL PROFILE VALIDATION
// ============================================

function validateProfile(
  reference: ProfileReference,
  calculated: CalculatedProfile,
  context: SemiAgentContext
): ValidationResult {
  const metrics: MetricComparison[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Strip Width Validation
  const stripWidthDiff = Math.abs(calculated.stripWidth - reference.expectedValues.stripWidth);
  const stripWidthDiffPercent = (stripWidthDiff / reference.expectedValues.stripWidth) * 100;
  metrics.push({
    metric: 'Strip Width',
    expected: reference.expectedValues.stripWidth,
    actual: calculated.stripWidth,
    difference: stripWidthDiff,
    differencePercent: Math.round(stripWidthDiffPercent * 100) / 100,
    tolerance: TOLERANCES.stripWidth,
    passed: stripWidthDiff <= TOLERANCES.stripWidth,
  });

  // 2. Station Count Validation
  const stationCountDiff = Math.abs(calculated.stationCount - reference.expectedValues.stationCount);
  metrics.push({
    metric: 'Station Count',
    expected: reference.expectedValues.stationCount,
    actual: calculated.stationCount,
    difference: stationCountDiff,
    differencePercent: Math.round((stationCountDiff / reference.expectedValues.stationCount) * 100 * 100) / 100,
    tolerance: TOLERANCES.stationCount,
    passed: stationCountDiff <= TOLERANCES.stationCount,
  });

  // 3. Springback Factor Validation
  const springbackDiff = Math.abs(calculated.springbackFactor - reference.expectedValues.springbackFactor);
  metrics.push({
    metric: 'Springback Factor',
    expected: reference.expectedValues.springbackFactor,
    actual: calculated.springbackFactor,
    difference: springbackDiff,
    differencePercent: Math.round((springbackDiff / reference.expectedValues.springbackFactor) * 100 * 100) / 100,
    tolerance: TOLERANCES.springbackFactor,
    passed: springbackDiff <= TOLERANCES.springbackFactor,
  });

  // 4. K-Factor Validation
  const kFactorDiff = Math.abs(calculated.kFactor - reference.expectedValues.kFactor);
  metrics.push({
    metric: 'K-Factor',
    expected: reference.expectedValues.kFactor,
    actual: calculated.kFactor,
    difference: kFactorDiff,
    differencePercent: Math.round((kFactorDiff / reference.expectedValues.kFactor) * 100 * 100) / 100,
    tolerance: TOLERANCES.kFactor,
    passed: kFactorDiff <= TOLERANCES.kFactor,
  });

  // 5. Bend Allowance Validation
  const bendAllowDiff = Math.abs(calculated.bendAllowance - reference.expectedValues.bendAllowance);
  metrics.push({
    metric: 'Bend Allowance',
    expected: reference.expectedValues.bendAllowance,
    actual: calculated.bendAllowance,
    difference: bendAllowDiff,
    differencePercent: Math.round((bendAllowDiff / reference.expectedValues.bendAllowance) * 100 * 100) / 100,
    tolerance: TOLERANCES.bendAllowance,
    passed: bendAllowDiff <= TOLERANCES.bendAllowance,
  });

  // 6. Total Bend Angle Validation
  const angleDiff = Math.abs(calculated.totalBendAngle - reference.expectedValues.totalBendAngle);
  metrics.push({
    metric: 'Total Bend Angle',
    expected: reference.expectedValues.totalBendAngle,
    actual: calculated.totalBendAngle,
    difference: angleDiff,
    differencePercent: Math.round((angleDiff / reference.expectedValues.totalBendAngle) * 100 * 100) / 100,
    tolerance: TOLERANCES.totalBendAngle,
    passed: angleDiff <= TOLERANCES.totalBendAngle,
  });

  // 7. G-Code Line Count Validation
  if (calculated.gcodeLineCount) {
    const gcodeDiff = Math.abs(calculated.gcodeLineCount - reference.gCodeMetrics.lineCount);
    metrics.push({
      metric: 'G-Code Line Count',
      expected: reference.gCodeMetrics.lineCount,
      actual: calculated.gcodeLineCount,
      difference: gcodeDiff,
      differencePercent: Math.round((gcodeDiff / reference.gCodeMetrics.lineCount) * 100 * 100) / 100,
      tolerance: TOLERANCES.gcodeLineCount,
      passed: gcodeDiff <= TOLERANCES.gcodeLineCount,
    });
  }

  // 8. Safety Score Validation
  if (calculated.safetyScore) {
    const safetyDiff = Math.abs(calculated.safetyScore - reference.gCodeMetrics.safetyScore);
    metrics.push({
      metric: 'Safety Score',
      expected: reference.gCodeMetrics.safetyScore,
      actual: calculated.safetyScore,
      difference: safetyDiff,
      differencePercent: safetyDiff,
      tolerance: TOLERANCES.safetyScore,
      passed: safetyDiff <= TOLERANCES.safetyScore,
    });
  }

  // Calculate overall accuracy
  const passedMetrics = metrics.filter(m => m.passed).length;
  const accuracy = (passedMetrics / metrics.length) * 100;

  // Check for errors
  for (const metric of metrics) {
    if (!metric.passed) {
      errors.push(`${metric.metric}: Expected ${metric.expected}, Got ${metric.actual} (${metric.differencePercent}% diff)`);
    }
  }

  // Check for warnings
  for (const metric of metrics) {
    if (metric.differencePercent > metric.tolerance * 2) {
      warnings.push(`${metric.metric} is significantly different from reference`);
    }
  }

  const passed = errors.length === 0;

  return {
    profileId: reference.id,
    profileName: reference.name,
    passed,
    accuracy: Math.round(accuracy * 10) / 10,
    metrics,
    errors,
    warnings,
    timestamp: Date.now(),
  };
}

// ============================================
// CALCULATED PROFILE TYPE
// ============================================

export interface CalculatedProfile {
  id: string;
  stripWidth: number;
  stationCount: number;
  springbackFactor: number;
  kFactor: number;
  bendAllowance: number;
  totalBendAngle: number;
  flowerAngles?: number[];
  gcodeLineCount?: number;
  safetyScore?: number;
}

// ============================================
// SUMMARY CALCULATION
// ============================================

function calculateSummary(results: ValidationResult[], failedMetrics: string[]): ValidationSummary {
  const stripWidthResults = results.map(r => r.metrics.find(m => m.metric === 'Strip Width')).filter(Boolean);
  const stationCountResults = results.map(r => r.metrics.find(m => m.metric === 'Station Count')).filter(Boolean);
  const springbackResults = results.map(r => r.metrics.find(m => m.metric === 'Springback Factor')).filter(Boolean);
  const gcodeResults = results.map(r => r.metrics.find(m => m.metric === 'G-Code Line Count')).filter(Boolean);

  const calcAccuracy = (arr: MetricComparison[]): number => {
    if (arr.length === 0) return 0;
    return Math.round((arr.filter(m => m.passed).length / arr.length) * 100 * 10) / 10;
  };

  const criticalFailures = failedMetrics.filter(id => {
    const result = results.find(r => r.profileId === id);
    return result && result.accuracy < 50;
  });

  return {
    stripWidthAccuracy: calcAccuracy(stripWidthResults as MetricComparison[]),
    stationCountAccuracy: calcAccuracy(stationCountResults as MetricComparison[]),
    springbackAccuracy: calcAccuracy(springbackResults as MetricComparison[]),
    gcodeAccuracy: calcAccuracy(gcodeResults as MetricComparison[]),
    overallPassRate: Math.round((results.filter(r => r.passed).length / results.length) * 100 * 10) / 10,
    criticalFailures,
  };
}

// ============================================
// DEMO CALCULATED RESULTS (FOR TESTING)
// ============================================

export function generateDemoCalculatedResults(): Map<string, CalculatedProfile> {
  const results = new Map<string, CalculatedProfile>();

  // Simulated results - some accurate, some with errors
  results.set('PROF_001', {
    id: 'PROF_001',
    stripWidth: 283, // +1mm
    stationCount: 8,
    springbackFactor: 1.026, // slightly off
    kFactor: 0.43,
    bendAllowance: 4.3,
    totalBendAngle: 181,
    flowerAngles: [15, 20, 25, 30, 30, 25, 20, 15],
    gcodeLineCount: 158,
    safetyScore: 94,
  });

  results.set('PROF_002', {
    id: 'PROF_002',
    stripWidth: 415, // +3mm
    stationCount: 10,
    springbackFactor: 1.030, // slightly off
    kFactor: 0.45,
    bendAllowance: 5.9,
    totalBendAngle: 272,
    flowerAngles: [20, 25, 30, 35, 35, 30, 25, 20, 15, 10],
    gcodeLineCount: 205,
    safetyScore: 90,
  });

  results.set('PROF_003', {
    id: 'PROF_003',
    stripWidth: 247, // +2mm
    stationCount: 7,
    springbackFactor: 1.023,
    kFactor: 0.41,
    bendAllowance: 3.6,
    totalBendAngle: 198,
    flowerAngles: [18, 22, 28, 32, 28, 22, 18],
    gcodeLineCount: 145,
    safetyScore: 93,
  });

  results.set('PROF_004', {
    id: 'PROF_004',
    stripWidth: 169, // +1mm
    stationCount: 6,
    springbackFactor: 1.021,
    kFactor: 0.39,
    bendAllowance: 2.9,
    totalBendAngle: 121,
    flowerAngles: [15, 20, 25, 25, 20, 15],
    gcodeLineCount: 120,
    safetyScore: 96,
  });

  results.set('PROF_005', {
    id: 'PROF_005',
    stripWidth: 358, // +3mm
    stationCount: 9,
    springbackFactor: 1.028,
    kFactor: 0.44,
    bendAllowance: 5.3,
    totalBendAngle: 262,
    flowerAngles: [20, 25, 30, 35, 35, 30, 25, 20, 15],
    gcodeLineCount: 178,
    safetyScore: 90,
  });

  results.set('PROF_006', {
    id: 'PROF_006',
    stripWidth: 110, // +2mm
    stationCount: 5,
    springbackFactor: 1.031,
    kFactor: 0.46,
    bendAllowance: 3.9,
    totalBendAngle: 91,
    flowerAngles: [18, 22, 25, 22, 18],
    gcodeLineCount: 105,
    safetyScore: 95,
  });

  results.set('PROF_007', {
    id: 'PROF_007',
    stripWidth: 535, // +7mm - ERROR
    stationCount: 12,
    springbackFactor: 1.055, // ERROR
    kFactor: 0.52,
    bendAllowance: 8.8,
    totalBendAngle: 285,
    gcodeLineCount: 240,
    safetyScore: 85,
  });

  results.set('PROF_008', {
    id: 'PROF_008',
    stripWidth: 290, // +2mm
    stationCount: 7,
    springbackFactor: 1.016,
    kFactor: 0.36,
    bendAllowance: 2.3,
    totalBendAngle: 150,
    flowerAngles: [15, 20, 25, 28, 25, 20, 15],
    gcodeLineCount: 140,
    safetyScore: 97,
  });

  results.set('PROF_009', {
    id: 'PROF_009',
    stripWidth: 450, // +5mm - ERROR
    stationCount: 11,
    springbackFactor: 1.032,
    kFactor: 0.45,
    bendAllowance: 7.0,
    totalBendAngle: 270,
    flowerAngles: [20, 22, 25, 28, 30, 30, 28, 25, 22, 20, 18],
    gcodeLineCount: 225,
    safetyScore: 87,
  });

  results.set('PROF_010', {
    id: 'PROF_010',
    stripWidth: 120, // +2mm
    stationCount: 5,
    springbackFactor: 1.019,
    kFactor: 0.37,
    bendAllowance: 1.9,
    totalBendAngle: 76,
    flowerAngles: [12, 16, 18, 16, 12],
    gcodeLineCount: 100,
    safetyScore: 98,
  });

  return results;
}

// ============================================
// EXPORTS
// ============================================

export const ProfileValidation = {
  runProfileValidation,
  generateDemoCalculatedResults,
  TOLERANCES,
};

export default ProfileValidation;
