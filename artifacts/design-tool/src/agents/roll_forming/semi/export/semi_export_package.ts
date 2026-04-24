/**
 * SEMI_EXPORT_PACKAGE - Roll Forming Semi Agent
 * ===========================================
 * Export package agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  ExportPackage,
  ExportValidation,
  BlockedStation,
  GCodeResult,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_EXPORT_PACKAGE',
  version: '1.0.0',
  timeout: 30000,
  retries: 2,
};

export interface ExportPackageInput {
  projectId: string;
  stations: { index: number; hasProfile: boolean; hasGCode: boolean }[];
  gcode?: GCodeResult;
  includeReports?: boolean;
  include3DFiles?: boolean;
}

export interface ExportPackageOutput {
  package: ExportPackage;
  fileCount: number;
  totalSize: number;
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function createExportPackage(
  input: ExportPackageInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<ExportPackageOutput>> {
  try {
    const files: ExportPackage['files'] = [];

    files.push({
      type: 'zip',
      filename: `${input.projectId}_package.zip`,
      size: 0,
      checksum: '',
      content: '',
    });

    files.push({
      type: 'csv',
      filename: `${input.projectId}_stations.csv`,
      size: 0,
      checksum: '',
      content: generateStationsCSV(input.stations),
    });

    files.push({
      type: 'xml',
      filename: `${input.projectId}_config.xml`,
      size: 0,
      checksum: '',
      content: generateConfigXML(input),
    });

    if (input.gcode) {
      files.push({
        type: 'gcode',
        filename: `${input.projectId}_gcode.nc`,
        size: input.gcode.code.length,
        checksum: '',
        content: input.gcode.code,
      });
    }

    const blockedStations = checkBlockedStations(input.stations);

    const validation: ExportValidation = {
      complete: blockedStations.length === 0,
      blockedStations,
      warnings: generateWarnings(blockedStations),
    };

    const package_2: ExportPackage = {
      id: `export_${Date.now()}`,
      timestamp: Date.now(),
      projectId: input.projectId,
      files,
      reports: [],
      validation,
    };

    const totalSize = files.reduce((sum, f) => sum + (typeof f.content === 'string' ? f.content.length : 0), 0);

    return {
      success: true,
      data: {
        package: package_2,
        fileCount: files.length,
        totalSize,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Export package failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function generateStationsCSV(stations: { index: number; hasProfile: boolean; hasGCode: boolean }[]): string {
  let csv = 'Station,Profile,GCode,Status\n';
  for (const station of stations) {
    const status = station.hasGCode ? 'Complete' : station.hasProfile ? 'Incomplete' : 'No Profile';
    csv += `${station.index},${station.hasProfile},${station.hasGCode},${status}\n`;
  }
  return csv;
}

function generateConfigXML(input: ExportPackageInput): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<RollFormingProject id="${input.projectId}" timestamp="${Date.now()}">
  <Settings>
    <IncludeReports>${input.includeReports ?? true}</IncludeReports>
    <Include3DFiles>${input.include3DFiles ?? false}</Include3DFiles>
  </Settings>
  <Stations count="${input.stations.length}">
${input.stations.map(s => `    <Station index="${s.index}"/>`).join('\n')}
  </Stations>
</RollFormingProject>`;
}

function checkBlockedStations(stations: { index: number; hasProfile: boolean; hasGCode: boolean }[]): BlockedStation[] {
  const blocked: BlockedStation[] = [];

  for (const station of stations) {
    if (!station.hasProfile) {
      blocked.push({
        stationIndex: station.index,
        reason: 'No roll profile',
        requiredAction: 'Generate roll profile for this station',
      });
    } else if (!station.hasGCode) {
      blocked.push({
        stationIndex: station.index,
        reason: 'No G-code generated',
        requiredAction: 'Generate G-code for this station',
      });
    }
  }

  return blocked;
}

function generateWarnings(blockedStations: BlockedStation[]): string[] {
  const warnings: string[] = [];

  if (blockedStations.length > 0) {
    warnings.push(`${blockedStations.length} station(s) are incomplete`);
  }

  return warnings;
}

export const SemiExportPackage = { config: CONFIG, createExportPackage };
export default SemiExportPackage;
