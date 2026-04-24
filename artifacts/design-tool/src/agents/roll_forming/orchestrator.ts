/**
 * ROLL FORMING ORCHESTRATOR
 * =========================
 * Main orchestrator for Roll Forming Semi Agents
 * Coordinates workflow between all Semi Agents
 */

import type { SemiAgentContext, SemiAgentResult, OrchestratorConfig, OrchestratorResult } from '../types/semi-agent-types';
import * as SemiAgents from './semi/index';

// ============================================
// ORCHESTRATOR CLASS
// ============================================

export class RollFormingOrchestrator {
  private config: OrchestratorConfig;
  private context: SemiAgentContext;
  private results: Map<string, SemiAgentResult>;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = {
      parallelExecution: config.parallelExecution ?? true,
      maxConcurrency: config.maxConcurrency ?? 5,
      timeout: config.timeout ?? 120000,
      retryFailed: config.retryFailed ?? true,
    };
    this.results = new Map();
    this.context = this.createDefaultContext();
  }

  private createDefaultContext(): SemiAgentContext {
    return {
      projectId: `project_${Date.now()}`,
      sessionId: `session_${Date.now()}`,
      timestamp: Date.now(),
    };
  }

  setContext(context: Partial<SemiAgentContext>): void {
    this.context = { ...this.context, ...context };
  }

  async runWorkflow(workflow: WorkflowStep[]): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      for (const step of workflow) {
        const result = await this.executeStep(step);
        if (!result.success) {
          errors.push(`${step.agent}: ${result.error}`);
          if (this.config.retryFailed) {
            const retryResult = await this.executeStep(step, true);
            if (!retryResult.success) {
              if (step.required) {
                throw new Error(`Required step ${step.agent} failed`);
              }
            }
          } else if (step.required) {
            throw new Error(`Required step ${step.agent} failed`);
          }
        }
        this.results.set(step.agent, result);
      }

      return {
        success: errors.length === 0,
        results: this.results,
        totalTime: Date.now() - startTime,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        results: this.results,
        totalTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async executeStep(step: WorkflowStep, isRetry = false): Promise<SemiAgentResult> {
    const agent = SemiAgents[step.agent as keyof typeof SemiAgents];
    if (!agent) {
      return { success: false, error: `Agent ${step.agent} not found` };
    }

    const handler = agent[step.action as keyof typeof agent] as
      | ((input: Record<string, unknown>, context: SemiAgentContext) => Promise<SemiAgentResult>)
      | undefined;
    if (!handler || typeof handler !== 'function') {
      return { success: false, error: `Action ${step.action} not found on ${step.agent}` };
    }

    try {
      const result = await handler(step.input, this.context);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `${isRetry ? 'Retry failed: ' : ''}${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  getResult(agentName: string): SemiAgentResult | undefined {
    return this.results.get(agentName);
  }

  getAllResults(): Map<string, SemiAgentResult> {
    return new Map(this.results);
  }

  getContext(): SemiAgentContext {
    return this.context;
  }
}

// ============================================
// WORKFLOW TYPES
// ============================================

export interface WorkflowStep {
  agent: string;
  action: string;
  input: Record<string, unknown>;
  required?: boolean;
  parallelWith?: string[];
}

// ============================================
// PREDEFINED WORKFLOWS
// ============================================

export const FULL_ROLL_FORMING_WORKFLOW: WorkflowStep[] = [
  { agent: 'SemiDXFLoader', action: 'loadDXF', input: {}, required: true },
  { agent: 'SemiCenterCalc', action: 'calculateCenterline', input: {}, required: true },
  { agent: 'SemiGeoNormalize', action: 'normalizeGeometry', input: {}, required: true },
  { agent: 'SemiMatSelect', action: 'selectMaterial', input: {}, required: true },
  { agent: 'SemiStripWidth', action: 'calculateStripWidth', input: {}, required: true },
  { agent: 'SemiSpringBack', action: 'calculateSpringback', input: {}, required: true },
  { agent: 'SemiFlowerDesign', action: 'designFlowerPattern', input: {}, required: true },
  { agent: 'SemiRollDraft', action: 'draftRoll', input: {}, required: true },
  { agent: 'SemiConstCheck', action: 'checkConstraints', input: {}, required: true },
  { agent: 'SemiStationDecomp', action: 'decomposeStations', input: {}, required: true },
  { agent: 'SemiDTMPrecheck', action: 'runDTMPrecheck', input: {}, required: true },
  { agent: 'SemiGCodeGen', action: 'generateGCode', input: {}, required: true },
  { agent: 'SemiSafetyValidator', action: 'validateSafety', input: {}, required: true },
  { agent: 'SemiExportPackage', action: 'createExportPackage', input: {}, required: true },
];

export const QUICK_PREVIEW_WORKFLOW: WorkflowStep[] = [
  { agent: 'SemiDXFLoader', action: 'loadDXF', input: {}, required: true },
  { agent: 'SemiFlowerDesign', action: 'designFlowerPattern', input: {}, required: true },
  { agent: 'SemiDTMPrecheck', action: 'runDTMPrecheck', input: {}, required: true },
];

// ============================================
// FACTORY FUNCTION
// ============================================

export function createOrchestrator(config?: Partial<OrchestratorConfig>): RollFormingOrchestrator {
  return new RollFormingOrchestrator(config);
}

export default RollFormingOrchestrator;
