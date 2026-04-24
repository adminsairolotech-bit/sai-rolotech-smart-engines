/**
 * SEMI_DOC_GENERATOR - Roll Forming Semi Agent
 * ===========================================
 * Document generation agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_DOC_GENERATOR',
  version: '1.0.0',
  timeout: 25000,
  retries: 2,
};

export interface DocGeneratorInput {
  projectId: string;
  type: 'pdf' | 'dxf' | 'spec_sheet' | 'bom';
  data: Record<string, unknown>;
}

export interface DocGeneratorOutput {
  filename: string;
  content: string;
  format: string;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function generateDocument(
  input: DocGeneratorInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<DocGeneratorOutput>> {
  try {
    let filename = '';
    let content = '';
    const format = input.type.toUpperCase();

    switch (input.type) {
      case 'pdf':
        content = generatePDFContent(input.data);
        filename = `${input.projectId}_document.pdf`;
        break;
      case 'dxf':
        content = generateDXFContent(input.data);
        filename = `${input.projectId}_profile.dxf`;
        break;
      case 'spec_sheet':
        content = generateSpecSheet(input.data);
        filename = `${input.projectId}_spec_sheet.txt`;
        break;
      case 'bom':
        content = generateBOM(input.data);
        filename = `${input.projectId}_bom.txt`;
        break;
      default:
        throw new Error(`Unknown document type: ${input.type}`);
    }

    return {
      success: true,
      data: { filename, content, format },
    };
  } catch (error) {
    return {
      success: false,
      error: `Document generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function generatePDFContent(data: Record<string, unknown>): string {
  return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer
<< /Size 4 /Root 1 0 R >>
startxref
196
%%EOF`;
}

function generateDXFContent(data: Record<string, unknown>): string {
  return `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
10
0
20
0
30
0
11
100
21
0
31
0
0
ENDSEC
0
EOF`;
}

function generateSpecSheet(data: Record<string, unknown>): string {
  return `ROLL FORMING SPECIFICATION SHEET
=====================================
Project ID: ${data.projectId || 'N/A'}
Date: ${new Date().toLocaleString()}

MATERIAL SPECIFICATIONS
-----------------------
Material: ${data.material || 'N/A'}
Thickness: ${data.thickness || 'N/A'} mm
Yield Strength: ${data.yieldStrength || 'N/A'} MPa

GEOMETRY
--------
Profile Width: ${data.width || 'N/A'} mm
Profile Height: ${data.height || 'N/A'} mm

PROCESS PARAMETERS
------------------
Total Angle: ${data.totalAngle || 'N/A'}°
Number of Stations: ${data.stationCount || 'N/A'}
Strip Width: ${data.stripWidth || 'N/A'} mm

ROLL SPECIFICATIONS
-------------------
Roll Diameter: ${data.rollDiameter || 'N/A'} mm
Face Width: ${data.faceWidth || 'N/A'} mm
Shaft Diameter: ${data.shaftDiameter || 'N/A'} mm
`;
}

function generateBOM(data: Record<string, unknown>): string {
  const items = (data.items as { name: string; quantity: number; material: string }[]) || [];

  return `BILL OF MATERIALS
===================
Project ID: ${data.projectId || 'N/A'}
Date: ${new Date().toLocaleString()}

Item No. | Description | Quantity | Material
---------|-------------|----------|------------------
${items.map((item, i) => `${i + 1} | ${item.name} | ${item.quantity} | ${item.material}`).join('\n')}
-----------------------------------------
Total Items: ${items.length}
`;
}

export const SemiDocGenerator = { config: CONFIG, generateDocument };
export default SemiDocGenerator;
