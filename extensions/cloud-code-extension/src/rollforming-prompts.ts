/**
 * Roll Forming Engineering Prompts — context-aware AI prompts
 */

export function buildRollFormingPrompt(
  userQuery: string,
  context?: {
    material?: string;
    thickness?: number;
    profileType?: string;
    stationCount?: number;
    stripWidth?: number;
    bendAngles?: number[];
  }
): string {
  const ctx = `
**Current Roll Forming Job Context:**
${context?.material ? `- Material: ${context.material}` : '- Material: Not specified'}
${context?.thickness ? `- Thickness: ${context.thickness}mm` : '- Thickness: Not specified'}
${context?.profileType ? `- Profile Type: ${context.profileType}` : '- Profile Type: Not specified'}
${context?.stationCount ? `- Station Count: ${context.stationCount}` : '- Station Count: Not specified'}
${context?.stripWidth ? `- Strip Width: ${context.stripWidth}mm` : '- Strip Width: Not specified'}
${context?.bendAngles?.length ? `- Bend Angles: ${context.bendAngles.join(', ')}°` : ''}

**Sai Rolotech Smart Engines v2.3.0 — Roll Forming Engineering Expert**

You are a senior roll forming engineer at Sai Rolotech with 20+ years of experience in:
- Roll forming process design and optimization
- Flower pattern generation and station sequencing
- Springback compensation (S30/S50 COPRA methods)
- Roll tooling design, shaft/bearing selection
- Strip width calculation using DIN 6935 K-factor method
- CNC G-code programming for roll forming machines
- Material science for sheet metal forming (SS, GI, CR, HR, AL, HSLA)
- Defect diagnosis and quality control
- FEA simulation for forming analysis

**Response Guidelines:**
1. Be technically accurate and concise
2. Include formulas where relevant (with units)
3. Reference industry standards: COPRA, Shigley's, DIN 6935, ISO 281
4. Provide practical, manufacturable solutions
5. If uncertain, state clearly and suggest verification methods
6. Use Hindi/English mix when user communicates in Hindi
7. Always prioritize safety and quality

**User Question:**
${userQuery}

Please provide an expert engineering response:`;

  return ctx;
}

export function buildFlowerAnalysisPrompt(stations: Array<{
  station: number;
  angle: number;
  gap: number;
  stripWidth: number;
  formingForce: number;
  springback: number;
}>): string {
  return buildRollFormingPrompt(`Analyze this flower pattern for roll forming process:

${stations.map(s =>
  `Station ${s.station}: Angle=${s.angle}°, Gap=${s.gap}mm, Strip=${s.stripWidth}mm, Force=${s.formingForce}kN, Springback=${s.springback}°`
).join('\n')}

Please provide:
1. Overall forming quality assessment
2. Problem areas or risks (high force, tight gaps, etc.)
3. Optimization suggestions
4. Springback compensation recommendation
5. Any critical issues to address before production`);
}

export function buildRollToolingPrompt(tooling: {
  rollOD: number;
  shaftDiameter: number;
  bearingType: string;
  material: string;
  thickness: number;
  maxForce: number;
}): string {
  return buildRollFormingPrompt(`Analyze roll tooling design:

- Roll OD: ${tooling.rollOD}mm
- Shaft Diameter: ${tooling.shaftDiameter}mm
- Bearing Type: ${tooling.bearingType}
- Material: ${tooling.material}
- Thickness: ${tooling.thickness}mm
- Max Forming Force: ${tooling.maxForce}kN

Provide:
1. Tooling adequacy assessment
2. Potential interference issues
3. Manufacturing recommendations
4. Tool life expectations
5. Cost optimization suggestions`);
}

export function buildDefectDiagnosisPrompt(defect: string, context?: {
  material?: string;
  thickness?: number;
  stationCount?: number;
}): string {
  return buildRollFormingPrompt(`Diagnose roll forming defect: **${defect}**

${context?.material ? `Material: ${context.material}` : ''}
${context?.thickness ? `Thickness: ${context.thickness}mm` : ''}
${context?.stationCount ? `Station Count: ${context.stationCount}` : ''}

Please provide:
1. Root cause analysis
2. Immediate corrective actions (step-by-step)
3. Long-term prevention measures
4. Adjustments to process parameters
5. Quality verification after correction`);
}
