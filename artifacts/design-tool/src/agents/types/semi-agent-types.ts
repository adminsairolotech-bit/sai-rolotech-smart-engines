/**
 * ROLL FORMING SEMI AGENTS - Base Types
 * ======================================
 * Central type definitions for all SEMI agents
 */

// ============================================
// BASE SEMI AGENT INTERFACE
// ============================================

export interface SemiAgentConfig {
  name: string;
  version: string;
  timeout?: number;
  retries?: number;
}

export interface SemiAgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

export interface SemiAgentContext {
  projectId: string;
  sessionId: string;
  userId?: string;
  timestamp: number;
  parentAgent?: string;
}

export interface SemiAgentInput {
  [key: string]: unknown;
}

// ============================================
// GEOMETRY TYPES (GROUP 1)
// ============================================

export interface DXFProfile {
  id: string;
  name: string;
  filename: string;
  layers: DXFLayer[];
  entities: DXFEntity[];
  bounds: BoundingBox;
  metadata: ProfileMetadata;
}

export interface DXFLayer {
  name: string;
  color: number;
  lineType: string;
  visible: boolean;
}

export interface DXFEntity {
  type: 'LINE' | 'ARC' | 'CIRCLE' | 'POLYLINE' | 'SPLINE';
  points: Point2D[];
  layer: string;
  closed?: boolean;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ProfileMetadata {
  area: number;
  perimeter: number;
  centroid: Point2D;
  momentsOfInertia: {
    ixx: number;
    iyy: number;
    ixy: number;
  };
}

export interface CenterlineResult {
  inner: Point2D[][];
  outer: Point2D[][];
  centerline: Point2D[][];
  thickness: number;
  kFactor: number;
}

export interface NormalizedGeometry {
  geometry: Point2D[];
  scale: number;
  rotation: number;
  offset: Point2D;
  mirrored: boolean;
}

// ============================================
// MATERIAL TYPES (GROUP 2)
// ============================================

export interface Material {
  id: string;
  name: string;
  grade: string;
  type: MaterialType;
  yieldStrength: number; // MPa
  tensileStrength: number; // MPa
  elasticity: number; // GPa
  density: number; // kg/m³
  thickness: MaterialThicknessRange;
  maxFormingSpeed: number; // m/min
  springbackFactor: number;
  kFactor: number;
  warnings?: MaterialWarning[];
}

export type MaterialType = 'MS' | 'HSS' | 'SS' | 'AL' | 'TI' | 'CU' | 'BR';

export interface MaterialThicknessRange {
  min: number;
  max: number;
  recommended: number;
}

export interface MaterialWarning {
  type: 'speed' | 'thickness' | 'cracking' | 'coolant';
  message: string;
  severity: 'warning' | 'critical';
}

export interface StripWidthResult {
  flatWidth: number;
  bendAllowances: BendAllowance[];
  totalWidth: number;
  kFactor: number;
  method: StripWidthMethod;
}

export type StripWidthMethod = 'tabular' | 'analytical' | 'empirical';

export interface BendAllowance {
  bendAngle: number;
  insideRadius: number;
  allowance: number;
}

export interface SpringbackResult {
  originalAngle: number;
  springbackAngle: number;
  overbendTarget: number;
  compensationFactor: number;
  material: string;
  thickness: number;
}

// ============================================
// FLOWER PATTERN TYPES (GROUP 3)
// ============================================

export interface FlowerPattern {
  id: string;
  profileId: string;
  totalAngle: number;
  stations: FlowerStation[];
  progressionType: 'linear' | 'progressive' | 'optimized';
  downhillAngle: number;
  formingCurves: FormingCurve[];
}

export interface FlowerStation {
  index: number;
  targetAngle: number;
  accumulatedAngle: number;
  radius: number;
  formLevel: number;
  status: 'planned' | 'active' | 'complete';
}

export interface FormingCurve {
  stationIndex: number;
  radius: number;
  slope: number;
  points: Point2D[];
}

export interface AngleProgressionResult {
  angles: number[];
  increments: number[];
  balanced: boolean;
  maxIncrement: number;
  minIncrement: number;
}

// ============================================
// ROLL TOOLING TYPES (GROUP 4)
// ============================================

export interface RollDesign {
  id: string;
  stationIndex: number;
  upperRoll: Roll;
  lowerRoll: Roll;
  shaft: Shaft;
  status: RollStatus;
}

export interface Roll {
  id: string;
  profile: RollProfile;
  diameter: number;
  faceWidth: number;
  material: string;
  boreDiameter: number;
  weight: number;
  centerOffset?: number;
}

export interface RollProfile {
  segments: RollProfileSegment[];
  totalLength: number;
  grooveDepth?: number;
}

export interface RollProfileSegment {
  type: 'flange' | 'web' | 'lip' | 'bend';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  radius: number;
  angle: number;
}

export interface Shaft {
  diameter: number;
  length: number;
  keywayWidth: number;
  keywayDepth: number;
  bearingSeats: BearingSeat[];
  material: string;
  maxTorque: number;
  maxDeflection: number;
}

export interface BearingSeat {
  position: number;
  diameter: number;
  width: number;
}

export type RollStatus = 'draft' | 'review' | 'approved' | 'finalized' | 'rejected';

export interface ConstraintCheckResult {
  passed: boolean;
  checks: ConstraintCheck[];
  overallScore: number;
}

export interface ConstraintCheck {
  name: string;
  passed: boolean;
  value: number;
  threshold: number;
  message: string;
}

// ============================================
// STATION TYPES (GROUP 5)
// ============================================

export interface StationDecomposition {
  totalStations: number;
  stations: Station[];
  spacing: number;
  layout: StationLayout;
  estimatedCost: number;
}

export interface Station {
  index: number;
  position: number;
  rollGap: number;
  formingAngle: number;
  materialState: MaterialState;
  tooling: string;
}

export interface MaterialState {
  thickness: number;
  strain: number;
  stress: number;
  temperature: number;
  hardening: 'none' | 'partial' | 'full';
}

export interface StationLayout {
  type: 'linear' | 'zigzag' | 'cluster';
  orientation: 'horizontal' | 'vertical';
  entryAngle: number;
  exitAngle: number;
}

export interface PassDesignResult {
  passes: Pass[];
  strainDistribution: number[];
  totalReduction: number;
  finalThickness: number;
}

export interface Pass {
  index: number;
  reduction: number;
  thickness: number;
  strain: number;
  formingForce: number;
}

// ============================================
// SIMULATION TYPES (GROUP 6)
// ============================================

export interface SimulationResult {
  type: 'dtm' | 'fea' | 'quick';
  timestamp: number;
  metrics: SimulationMetrics;
  warnings: string[];
  defects?: DefectPrediction[];
  convergence: boolean;
}

export interface SimulationMetrics {
  maxStrain: number;
  maxStress: number;
  maxDisplacement: number;
  springback: number;
  formingForce: number;
  powerRequired: number;
  elongation: number;
  thicknessReduction: number;
}

export interface DefectPrediction {
  type: 'edge_wave' | 'twist' | 'flare' | 'camber' | 'springback';
  probability: number;
  location: string;
  severity: 'low' | 'medium' | 'high';
  mitigation?: string;
}

export interface DTMPrecheckResult {
  deformationIndex: number;
  elongationRatio: number;
  rollDiameterRatio: number;
  defectRisk: DefectRiskLevel;
  recommendations: string[];
}

export type DefectRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface FEASolverResult {
  meshQuality: number;
  solverIterations: number;
  convergenceError: number;
  results: FEAResults;
}

export interface FEAResults {
  displacement: Point3D[];
  stress: number[];
  strain: number[];
  vonMises: number[];
}

export interface PowerEstimate {
  formingPower: number; // kW
  torque: number; // Nm
  speed: number; // rpm
  energyPerMeter: number; // kWh/m
}

// ============================================
// G-CODE TYPES (GROUP 7)
// ============================================

export interface GCodeResult {
  code: string;
  format: 'fanuc' | 'siemens' | 'heidenhain' | 'generic';
  safetyScore: number;
  validation: GCodeValidation;
  estimatedTime: number;
  tools: GCodeTool[];
}

export interface GCodeValidation {
  valid: boolean;
  errors: GCodeError[];
  warnings: GCodeWarning[];
  score: number;
}

export interface GCodeError {
  line: number;
  code: string;
  message: string;
}

export interface GCodeWarning {
  line: number;
  code: string;
  message: string;
  suggestion?: string;
}

export interface GCodeTool {
  number: number;
  type: string;
  diameter: number;
  feedRate: number;
  spindleSpeed: number;
}

export interface PathOptimizationResult {
  rapidMoves: number;
  feedMoves: number;
  totalDistance: number;
  cycleTimeReduction: number;
  optimizedPath: string;
}

// ============================================
// EXPORT TYPES (GROUP 8)
// ============================================

export interface ExportPackage {
  id: string;
  timestamp: number;
  projectId: string;
  files: ExportedFile[];
  reports: Report[];
  validation: ExportValidation;
}

export interface ExportedFile {
  type: 'zip' | 'csv' | 'xml' | 'dxf' | 'pdf' | 'gcode';
  filename: string;
  size: number;
  checksum: string;
  content: string | Blob;
}

export interface Report {
  type: 'summary' | 'tooling' | 'simulation' | 'gcode' | 'quality';
  title: string;
  sections: ReportSection[];
  generatedAt: number;
}

export interface ReportSection {
  title: string;
  content: string;
  data?: Record<string, unknown>;
  charts?: ChartData[];
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter';
  title: string;
  data: { label: string; value: number }[];
}

export interface ExportValidation {
  complete: boolean;
  blockedStations: BlockedStation[];
  warnings: string[];
}

export interface BlockedStation {
  stationIndex: number;
  reason: string;
  requiredAction: string;
}

// ============================================
// 3D VISUALIZATION TYPES (GROUP 10)
// ============================================

export interface Scene3D {
  id: string;
  name: string;
  type: SceneType;
  camera: Camera3D;
  lights: Light3D[];
  objects: SceneObject3D[];
  bounds: BoundingBox3D;
}

export type SceneType = 'preview' | 'simulation' | 'layout' | 'exploded';

export interface Camera3D {
  position: Point3D;
  target: Point3D;
  up: Vector3D;
  fov: number;
  near: number;
  far: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Light3D {
  type: 'ambient' | 'directional' | 'point' | 'spot';
  position?: Point3D;
  direction?: Vector3D;
  intensity: number;
  color: string;
  castShadow: boolean;
}

export interface SceneObject3D {
  id: string;
  type: ObjectType3D;
  mesh: Mesh3D;
  transform: Transform3D;
  material: Material3D;
  visible: boolean;
  selectable: boolean;
  children?: SceneObject3D[];
}

export type ObjectType3D =
  | 'profile_2d'
  | 'roll_upper'
  | 'roll_lower'
  | 'shaft'
  | 'station'
  | 'flower_curve'
  | 'forming_path'
  | 'strip'
  | 'workpiece'
  | 'tooling_assembly'
  | 'machine_frame'
  | 'gauge'
  | 'guide'
  | 'coil';

export interface Mesh3D {
  vertices: Float32Array;
  normals?: Float32Array;
  uvs?: Float32Array;
  indices: Uint32Array;
  geometryType: 'box' | 'cylinder' | 'extrusion' | 'lathe' | 'custom';
  boundingBox?: BoundingBox3D;
}

export interface BoundingBox3D {
  min: Point3D;
  max: Point3D;
  center: Point3D;
  size: Vector3D;
}

export interface Transform3D {
  position: Point3D;
  rotation: EulerAngles;
  scale: Vector3D;
}

export interface EulerAngles {
  x: number;
  y: number;
  z: number;
  order: 'XYZ' | 'YZX' | 'ZXY' | 'XZY' | 'YXZ' | 'ZYX';
}

export interface Material3D {
  type: Material3DType;
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;
  emissive?: string;
  map?: string;
  wireframe?: boolean;
}

export type Material3DType =
  | 'steel'
  | 'aluminum'
  | 'rubber'
  | 'plastic'
  | 'wood'
  | 'concrete'
  | 'glass'
  | 'copper';

export interface Profile3DVisualization {
  profile2D: Point2D[];
  extrusion: ExtrusionParams;
  segments: ProfileSegment3D[];
}

export interface ExtrusionParams {
  length: number;
  direction: Vector3D;
  twist: number;
  taper: number;
}

export interface ProfileSegment3D {
  id: string;
  type: 'flange' | 'web' | 'lip' | 'bend';
  points2D: Point2D[];
  centerline3D: Point3D[];
  surface: Mesh3D;
}

export interface RollAssembly3D {
  upperRoll: Roll3D;
  lowerRoll: Roll3D;
  shafts: Shaft3D[];
  stands: Stand3D[];
  gaps: RollGap3D[];
}

export interface Roll3D {
  id: string;
  profile: Point2D[];
  length: number;
  diameter: number;
  position: Point3D;
  rotation: EulerAngles;
  material: Material3D;
  groove?: Groove3D;
}

export interface Groove3D {
  depth: number;
  width: number;
  profile: Point2D[];
}

export interface Shaft3D {
  diameter: number;
  length: number;
  position: Point3D;
  bearingPositions: Point3D[];
  keyway: boolean;
}

export interface Stand3D {
  type: 'C' | 'O' | 'portal' | 'cantilever';
  height: number;
  width: number;
  position: Point3D;
  material: Material3D;
}

export interface RollGap3D {
  topGap: number;
  bottomGap: number;
  sideGuides: number;
}

export interface Flower3DVisualization {
  stations: Station3D[];
  formingPaths: FormingPath3D[];
  deformationCurves: DeformationCurve3D[];
  wireModel: WireModel3D;
}

export interface Station3D {
  index: number;
  position: Point3D;
  formingAngle: number;
  rollGap: number;
  visualization: 'simplified' | 'detailed' | 'transparent';
}

export interface FormingPath3D {
  stationIndex: number;
  startPoint: Point3D;
  endPoint: Point3D;
  controlPoints: Point3D[];
  radius: number;
  color: string;
}

export interface DeformationCurve3D {
  stationIndex: number;
  curvePoints: Point3D[];
  thicknessVariation: number[];
  strainValues: number[];
}

export interface WireModel3D {
  topWire: Point3D[];
  bottomWire: Point3D[];
  centerWire: Point3D[];
  bendLines: BendLine3D[];
}

export interface BendLine3D {
  stationIndex: number;
  position: Point3D;
  angle: number;
  radius: number;
}

export interface Layout3DVisualization {
  type: 'linear' | 'zigzag' | 'cluster' | 'custom';
  stations: LayoutStation3D[];
  entrySection: Section3D;
  exitSection: Section3D;
  totalLength: number;
  driveEnd: DriveEndConfig;
  operatorSide: SideConfig;
}

export interface LayoutStation3D {
  index: number;
  position: Point3D;
  rotation: EulerAngles;
  spacing: number;
  rollOrientation: 'horizontal' | 'vertical' | 'angled';
  sideAccess: SideAccess;
}

export interface Section3D {
  type: 'strip' | 'profile';
  width: number;
  height: number;
  material: string;
}

export interface DriveEndConfig {
  position: 'left' | 'right';
  motorPower: number;
  motorTorque: number;
  speedRange: number[];
}

export interface SideConfig {
  position: 'front' | 'back';
  walkwayWidth: number;
  safetyGuards: boolean;
}

export interface SideAccess {
  left: boolean;
  right: boolean;
  top: boolean;
  front: boolean;
}

export interface Simulation3DVisualization {
  type: 'deformation' | 'stress' | 'strain' | 'springback';
  frames: SimulationFrame3D[];
  colorScale: ColorScale3D;
  deformationScale: number;
}

export interface SimulationFrame3D {
  frameIndex: number;
  timestamp: number;
  stations: StationState3D[];
  strip: StripState3D;
}

export interface StationState3D {
  rollPositions: Point3D[];
  formingForce: number;
  torque: number;
  deflection: number;
}

export interface StripState3D {
  points: Point3D[];
  thickness: number;
  strain: number;
  stress: number;
  temperature?: number;
}

export interface ColorScale3D {
  type: 'rainbow' | 'thermal' | 'grayscale' | 'custom';
  minValue: number;
  maxValue: number;
  colors: string[];
}

export interface ToolingExplodedView3D {
  stations: ExplodedStation3D[];
  spacingMultiplier: number;
  labels: Label3D[];
  dimensions: Dimension3D[];
}

export interface ExplodedStation3D {
  index: number;
  originalPosition: Point3D;
  explodedPosition: Point3D;
  components: Component3D[];
}

export interface Component3D {
  type: 'upper_roll' | 'lower_roll' | 'shaft' | 'bushings' | 'keys' | 'spacers';
  position: Point3D;
  rotation: EulerAngles;
  mesh: Mesh3D;
  explodedOffset: Vector3D;
}

export interface Label3D {
  text: string;
  position: Point3D;
  anchor: 'center' | 'start' | 'end';
  fontSize: number;
  color: string;
}

export interface Dimension3D {
  type: 'linear' | 'angular' | 'diameter' | 'radius';
  points: Point3D[];
  value: number;
  label: string;
  tolerance?: string;
}

export interface CameraControls3D {
  mode: 'orbit' | 'pan' | 'zoom' | 'dolly';
  target: Point3D;
  autoRotate: boolean;
  autoRotateSpeed: number;
  enableDamping: boolean;
  dampingFactor: number;
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
}

export interface RenderingOptions3D {
  antialiasing: boolean;
  shadows: boolean;
  ambientOcclusion: boolean;
  bloom: boolean;
  outline: boolean;
  grid: boolean;
  axes: boolean;
  background: string;
  fog?: FogConfig;
}

export interface FogConfig {
  type: 'linear' | 'exponential';
  color: string;
  density: number;
  near: number;
  far: number;
}

export interface Measurement3D {
  type: 'distance' | 'angle' | 'radius' | 'diameter';
  points: Point3D[];
  value: number;
  unit: 'mm' | 'cm' | 'm' | 'deg';
  precision: number;
}

export interface Annotation3D {
  id: string;
  type: 'text' | 'arrow' | 'circle' | 'rectangle';
  position: Point3D;
  content: string;
  style: AnnotationStyle3D;
  visible: boolean;
}

export interface AnnotationStyle3D {
  color: string;
  fontSize: number;
  backgroundColor?: string;
  borderColor?: string;
  lineWidth?: number;
}

export interface ViewPreset3D {
  name: string;
  camera: Camera3D;
  controls: CameraControls3D;
  visibility: Record<ObjectType3D, boolean>;
  sectionPlane?: SectionPlane3D;
}

export interface SectionPlane3D {
  enabled: boolean;
  position: Point3D;
  normal: Vector3D;
  clipChildren: boolean;
}

// ============================================
// AUTH TYPES (GROUP 9)
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: number;
  lastLogin?: number;
}

export type UserRole = 'admin' | 'engineer' | 'operator' | 'viewer';

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: number;
  createdAt: number;
  ipAddress?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  token?: string;
  error?: string;
}

// ============================================
// ORCHESTRATOR TYPES
// ============================================

export interface RollFormingContext extends SemiAgentContext {
  geometry?: NormalizedGeometry;
  material?: Material;
  flowerPattern?: FlowerPattern;
  rollDesigns?: RollDesign[];
  stations?: Station[];
  simulation?: SimulationResult;
  gcode?: GCodeResult;
  export?: ExportPackage;
}

export interface OrchestratorConfig {
  parallelExecution: boolean;
  maxConcurrency: number;
  timeout: number;
  retryFailed: boolean;
}

export interface OrchestratorResult {
  success: boolean;
  results: Map<string, SemiAgentResult>;
  totalTime: number;
  errors: string[];
}
