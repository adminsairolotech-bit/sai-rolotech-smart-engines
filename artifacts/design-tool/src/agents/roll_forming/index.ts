/**
 * ROLL FORMING AGENTS - Main Index
 * ================================
 * Central export for Roll Forming domain
 */

// Re-export semi agents
export * from './semi/index';

// Re-export orchestrator
export { RollFormingOrchestrator, createOrchestrator, FULL_ROLL_FORMING_WORKFLOW, QUICK_PREVIEW_WORKFLOW } from './orchestrator';

// Agent metadata
export const ROLL_FORMING_METADATA = {
  name: 'ROLL_FORMING',
  fullName: 'Roll Forming Engineering Suite',
  version: '2.3.0',
  description: 'Precision Roll Forming Engineering Suite with Semi Agents Architecture',
  totalSemiAgents: 32,
  groups: 9,
  created: '2026-04-22',
  auditBuckets: 8,
} as const;

// Priority agents for P0 release
export const P0_AGENTS = [
  'SEMI_DXF_LOADER',
  'SEMI_CENTER_CALC',
  'SEMI_FLOWER_DESIGN',
  'SEMI_ROLL_DRAFT',
  'SEMI_GCODE_GEN',
  'SEMI_SAFETY_VALIDATOR',
  'SEMI_DTM_PRECHECK',
  'SEMI_STRIP_WIDTH',
  'SEMI_SPRING_BACK',
];

export default ROLL_FORMING_METADATA;
