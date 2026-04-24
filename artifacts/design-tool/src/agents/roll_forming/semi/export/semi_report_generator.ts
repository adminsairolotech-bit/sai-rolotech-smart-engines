/**
 * SEMI_REPORT_GENERATOR - Roll Forming Semi Agent
 * ===========================================
 * Report generation agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  Report,
  ReportSection,
  ChartData,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_REPORT_GENERATOR',
  version: '1.0.0',
  timeout: 20000,
  retries: 2,
};

export interface ReportGeneratorInput {
  projectId: string;
  type: 'summary' | 'tooling' | 'simulation' | 'gcode' | 'quality';
  data: Record<string, unknown>;
}

export interface ReportGeneratorOutput {
  report: Report;
  htmlContent: string;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function generateReport(
  input: ReportGeneratorInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<ReportGeneratorOutput>> {
  try {
    const sections: ReportSection[] = generateSections(input.type, input.data);
    const charts: ChartData[] = generateCharts(input.type, input.data);

    const report: Report = {
      type: input.type,
      title: getReportTitle(input.type),
      sections,
      generatedAt: Date.now(),
    };

    if (charts.length > 0) {
      report.sections[0].charts = charts;
    }

    const htmlContent = generateHTML(report);

    return {
      success: true,
      data: { report, htmlContent },
    };
  } catch (error) {
    return {
      success: false,
      error: `Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function getReportTitle(type: string): string {
  const titles: Record<string, string> = {
    summary: 'Roll Forming Project Summary',
    tooling: 'Roll Tooling Report',
    simulation: 'Simulation Report',
    gcode: 'G-Code Report',
    quality: 'Quality Assurance Report',
  };
  return titles[type] || 'Report';
}

function generateSections(type: string, data: Record<string, unknown>): ReportSection[] {
  const sections: ReportSection[] = [
    {
      title: 'Overview',
      content: `Generated at: ${new Date().toLocaleString()}`,
      data,
    },
  ];

  switch (type) {
    case 'summary':
      sections.push({
        title: 'Project Statistics',
        content: `Total Stations: ${data.stationCount || 0}`,
        data,
      });
      break;
    case 'tooling':
      sections.push({
        title: 'Roll Specifications',
        content: `Roll Diameter: ${data.rollDiameter || 'N/A'}mm`,
        data,
      });
      break;
    case 'simulation':
      sections.push({
        title: 'Simulation Results',
        content: `Max Strain: ${data.maxStrain || 0}`,
        data,
      });
      break;
    case 'gcode':
      sections.push({
        title: 'G-Code Details',
        content: `Line Count: ${data.lineCount || 0}`,
        data,
      });
      break;
    case 'quality':
      sections.push({
        title: 'Quality Metrics',
        content: `Safety Score: ${data.safetyScore || 0}%`,
        data,
      });
      break;
  }

  return sections;
}

function generateCharts(type: string, data: Record<string, unknown>): ChartData[] {
  const charts: ChartData[] = [];

  if (data.stationData) {
    charts.push({
      type: 'bar',
      title: 'Stations Overview',
      data: (data.stationData as { label: string; value: number }[]) || [],
    });
  }

  return charts;
}

function generateHTML(report: Report): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; border-bottom: 2px solid #0066cc; }
    h2 { color: #666; margin-top: 20px; }
    .section { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #0066cc; color: white; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  ${report.sections.map(section => `
    <div class="section">
      <h2>${section.title}</h2>
      <p>${section.content}</p>
    </div>
  `).join('')}
  <footer>
    <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
  </footer>
</body>
</html>`;
}

export const SemiReportGenerator = { config: CONFIG, generateReport };
export default SemiReportGenerator;
