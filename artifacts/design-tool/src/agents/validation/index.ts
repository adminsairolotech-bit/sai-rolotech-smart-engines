/**
 * VALIDATION - Main Export
 * ========================
 */

// Re-export all validation modules
export * from './profile-validation';
export * from './reference-data/standard-profiles-reference';

// Validation metadata
export const VALIDATION_METADATA = {
  name: 'Profile Accuracy Validation System',
  version: '1.0.0',
  profiles: 10,
  metrics: 8,
  tolerance: {
    stripWidth: '±3mm',
    stationCount: '±1',
    springbackFactor: '±0.01',
    kFactor: '±0.02',
    bendAllowance: '±0.5mm',
    totalBendAngle: '±5°',
    gcodeLineCount: '±20',
    safetyScore: '±5',
  },
  passCriteria: '≥80% accuracy required',
  created: '2026-04-22',
};
