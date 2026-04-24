/**
 * SEMI_DATA_PERSIST - Roll Forming Semi Agent
 * ===========================================
 * Data persistence agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_DATA_PERSIST',
  version: '1.0.0',
  timeout: 15000,
  retries: 2,
};

export interface DataPersistInput {
  action: 'save' | 'load' | 'delete' | 'backup' | 'restore';
  projectId: string;
  data?: unknown;
  timestamp?: number;
}

export interface DataPersistOutput {
  success: boolean;
  savedAt?: number;
  loadedData?: unknown;
  backupId?: string;
}

const localStorage = new Map<string, { data: unknown; timestamp: number }>();
const backups = new Map<string, { data: unknown; timestamp: number }>();

// ============================================
// CORE FUNCTIONS
// ============================================

export async function persistData(
  input: DataPersistInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<DataPersistOutput>> {
  try {
    let output: DataPersistOutput;

    switch (input.action) {
      case 'save':
        output = await saveData(input.projectId, input.data);
        break;
      case 'load':
        output = await loadData(input.projectId);
        break;
      case 'delete':
        output = await deleteData(input.projectId);
        break;
      case 'backup':
        output = await createBackup(input.projectId);
        break;
      case 'restore':
        output = await restoreBackup(input.projectId, input.timestamp!);
        break;
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }

    return { success: true, data: output };
  } catch (error) {
    return {
      success: false,
      error: `Data persistence failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function saveData(projectId: string, data: unknown): Promise<DataPersistOutput> {
  if (data === undefined) {
    return { success: false };
  }

  const timestamp = Date.now();
  localStorage.set(projectId, { data, timestamp });

  return { success: true, savedAt: timestamp };
}

async function loadData(projectId: string): Promise<DataPersistOutput> {
  const entry = localStorage.get(projectId);

  if (!entry) {
    return { success: false };
  }

  return { success: true, loadedData: entry.data };
}

async function deleteData(projectId: string): Promise<DataPersistOutput> {
  localStorage.delete(projectId);
  return { success: true };
}

async function createBackup(projectId: string): Promise<DataPersistOutput> {
  const entry = localStorage.get(projectId);

  if (!entry) {
    return { success: false };
  }

  const backupId = `backup_${projectId}_${Date.now()}`;
  backups.set(backupId, { data: entry.data, timestamp: entry.timestamp });

  return { success: true, backupId };
}

async function restoreBackup(projectId: string, timestamp: number): Promise<DataPersistOutput> {
  let backup: { data: unknown; timestamp: number } | undefined;

  for (const b of backups.values()) {
    if (b.timestamp === timestamp) {
      backup = b;
      break;
    }
  }

  if (!backup) {
    return { success: false };
  }

  localStorage.set(projectId, backup);

  return { success: true, savedAt: backup.timestamp };
}

export const SemiDataPersist = { config: CONFIG, persistData };
export default SemiDataPersist;
