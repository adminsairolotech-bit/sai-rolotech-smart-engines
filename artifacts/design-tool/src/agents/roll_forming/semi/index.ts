/**
 * ROLL FORMING SEMI AGENTS - Index
 * =================================
 * Main export file for all Semi Agents
 * Version: 1.0.0
 * Updated: 2026-04-22
 */

// ============================================
// GROUP 1: GEOMETRY SEMI AGENTS
// ============================================

export { SemiDXFLoader } from './geometry/semi_dxf_loader';
export { SemiCenterCalc } from './geometry/semi_center_calc';
export { SemiGeoNormalize } from './geometry/semi_geo_normalize';

// ============================================
// GROUP 2: MATERIAL SEMI AGENTS
// ============================================

export { SemiMatSelect } from './material/semi_mat_select';
export { SemiStripWidth } from './material/semi_strip_width';
export { SemiSpringBack } from './material/semi_spring_back';

// ============================================
// GROUP 3: FLOWER SEMI AGENTS
// ============================================

export { SemiFlowerDesign } from './flower/semi_flower_design';
export { SemiAngleProgress } from './flower/semi_angle_progress';
export { SemiFormCurve } from './flower/semi_form_curve';
export { SemiDownhillOpt } from './flower/semi_downhill_opt';

// ============================================
// GROUP 4: TOOLING SEMI AGENTS
// ============================================

export { SemiRollDraft } from './tooling/semi_roll_draft';
export { SemiUpperRoll } from './tooling/semi_upper_roll';
export { SemiLowerRoll } from './tooling/semi_lower_roll';
export { SemiShaftDesign } from './tooling/semi_shaft_design';
export { SemiBoreCalc } from './tooling/semi_bore_calc';
export { SemiConstCheck } from './tooling/semi_const_check';

// ============================================
// GROUP 5: STATION SEMI AGENTS
// ============================================

export { SemiStationDecomp } from './station/semi_station_decomp';
export { SemiPassDesign } from './station/semi_pass_design';
export { SemiSeqGenerate } from './station/semi_seq_generate';

// ============================================
// GROUP 6: SIMULATION SEMI AGENTS
// ============================================

export { SemiDTMPrecheck } from './simulation/semi_dtm_precheck';
export { SemiFEASolver } from './simulation/semi_fea_solver';
export { SemiDefAnalyzer } from './simulation/semi_def_analyzer';
export { SemiPowerEstimate } from './simulation/semi_power_estimate';
export { SemiDefectPrevent } from './simulation/semi_defect_prevent';

// ============================================
// GROUP 7: GCODE SEMI AGENTS
// ============================================

export { SemiGCodeGen } from './gcode/semi_gcode_gen';
export { SemiSafetyValidator } from './gcode/semi_safety_validator';
export { SemiPathOptimize } from './gcode/semi_path_optimize';

// ============================================
// GROUP 8: EXPORT SEMI AGENTS
// ============================================

export { SemiExportPackage } from './export/semi_export_package';
export { SemiReportGenerator } from './export/semi_report_generator';
export { SemiDocGenerator } from './export/semi_doc_generator';

// ============================================
// GROUP 9: AUTH SEMI AGENTS
// ============================================

export { SemiAuthManager } from './auth/semi_auth_manager';
export { SemiSessionHandler } from './auth/semi_session_handler';
export { SemiDataPersist } from './auth/semi_data_persist';

// ============================================
// AGENT REGISTRY
// ============================================

export const SEMI_AGENTS_REGISTRY = {
  // Group 1: Geometry
  'SEMI_DXF_LOADER': { group: 1, name: 'DXF Loader', category: 'geometry' },
  'SEMI_CENTER_CALC': { group: 1, name: 'Centerline Calculator', category: 'geometry' },
  'SEMI_GEO_NORMALIZE': { group: 1, name: 'Geometry Normalize', category: 'geometry' },

  // Group 2: Material
  'SEMI_MAT_SELECT': { group: 2, name: 'Material Selector', category: 'material' },
  'SEMI_STRIP_WIDTH': { group: 2, name: 'Strip Width Calculator', category: 'material' },
  'SEMI_SPRING_BACK': { group: 2, name: 'Springback Calculator', category: 'material' },

  // Group 3: Flower
  'SEMI_FLOWER_DESIGN': { group: 3, name: 'Flower Designer', category: 'flower' },
  'SEMI_ANGLE_PROGRESS': { group: 3, name: 'Angle Progression', category: 'flower' },
  'SEMI_FORM_CURVE': { group: 3, name: 'Forming Curve Generator', category: 'flower' },
  'SEMI_DOWNHILL_OPT': { group: 3, name: 'Downhill Optimizer', category: 'flower' },

  // Group 4: Tooling
  'SEMI_ROLL_DRAFT': { group: 4, name: 'Roll Drafter', category: 'tooling', priority: 'P0' },
  'SEMI_UPPER_ROLL': { group: 4, name: 'Upper Roll Designer', category: 'tooling' },
  'SEMI_LOWER_ROLL': { group: 4, name: 'Lower Roll Designer', category: 'tooling' },
  'SEMI_SHAFT_DESIGN': { group: 4, name: 'Shaft Designer', category: 'tooling' },
  'SEMI_BORE_CALC': { group: 4, name: 'Bore Calculator', category: 'tooling' },
  'SEMI_CONST_CHECK': { group: 4, name: 'Constraint Checker', category: 'tooling' },

  // Group 5: Station
  'SEMI_STATION_DECOMP': { group: 5, name: 'Station Decomposer', category: 'station' },
  'SEMI_PASS_DESIGN': { group: 5, name: 'Pass Designer', category: 'station' },
  'SEMI_SEQ_GENERATE': { group: 5, name: 'Sequence Generator', category: 'station' },

  // Group 6: Simulation
  'SEMI_DTM_PRECHECK': { group: 6, name: 'DTM Precheck', category: 'simulation' },
  'SEMI_FEA_SOLVER': { group: 6, name: 'FEA Solver', category: 'simulation' },
  'SEMI_DEF_ANALYZER': { group: 6, name: 'Deformation Analyzer', category: 'simulation' },
  'SEMI_POWER_ESTIMATE': { group: 6, name: 'Power Estimator', category: 'simulation' },
  'SEMI_DEFECT_PREVENT': { group: 6, name: 'Defect Preventer', category: 'simulation' },

  // Group 7: GCode
  'SEMI_GCODE_GEN': { group: 7, name: 'G-Code Generator', category: 'gcode', priority: 'P0' },
  'SEMI_SAFETY_VALIDATOR': { group: 7, name: 'Safety Validator', category: 'gcode', priority: 'P0' },
  'SEMI_PATH_OPTIMIZE': { group: 7, name: 'Path Optimizer', category: 'gcode' },

  // Group 8: Export
  'SEMI_EXPORT_PACKAGE': { group: 8, name: 'Export Packager', category: 'export', status: 'ready' },
  'SEMI_REPORT_GENERATOR': { group: 8, name: 'Report Generator', category: 'export' },
  'SEMI_DOC_GENERATOR': { group: 8, name: 'Document Generator', category: 'export' },

  // Group 9: Auth
  'SEMI_AUTH_MANAGER': { group: 9, name: 'Auth Manager', category: 'auth', status: 'ready' },
  'SEMI_SESSION_HANDLER': { group: 9, name: 'Session Handler', category: 'auth', status: 'ready' },
  'SEMI_DATA_PERSIST': { group: 9, name: 'Data Persister', category: 'auth', status: 'ready' },
} as const;

export type SemiAgentName = keyof typeof SEMI_AGENTS_REGISTRY;

export const TOTAL_SEMI_AGENTS = Object.keys(SEMI_AGENTS_REGISTRY).length;

export const P0_PRIORITY_AGENTS: SemiAgentName[] = [
  'SEMI_ROLL_DRAFT',
  'SEMI_GCODE_GEN',
  'SEMI_SAFETY_VALIDATOR',
];

export const READY_AGENTS = Object.entries(SEMI_AGENTS_REGISTRY)
  .filter(([, meta]) => (meta as { status?: string }).status === 'ready')
  .map(([name]) => name);

export default SEMI_AGENTS_REGISTRY;
