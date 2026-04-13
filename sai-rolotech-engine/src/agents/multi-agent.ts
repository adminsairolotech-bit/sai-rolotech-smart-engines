/**
 * MULTI-AGENT ORCHESTRATOR (Based on agent-orchestrator patterns)
 * Routes tasks to specialized agents with activity tracking
 */

// Agent Types
interface Agent {
  name: string;
  specialty: string[];
  status: 'idle' | 'active' | 'ready' | 'blocked';
  handle: (task: string, context?: any) => Promise<any>;
}

interface Task {
  id: string;
  type: string;
  status: 'pending' | 'working' | 'done' | 'failed';
  agent?: string;
  result?: any;
}

// Activity States (from agent-orchestrator)
type ActivityState = 'active' | 'ready' | 'idle' | 'blocked' | 'exited';

export class MultiAgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private gemini: any;

  constructor(gemini: any) {
    this.gemini = gemini;
    this.registerDefaultAgents();
  }

  // Register all domain agents
  private registerDefaultAgents() {
    // Roll Forming Expert
    this.register({
      name: "roll-forming",
      specialty: ["roll", "forming", "c-channel", "z-purlin", "machine", "die", "roller", "sheet"],
      status: 'idle',
      handle: async (task: string) => {
        return await this.gemini.generate(task, "You are a senior roll forming engineer with 50 years of experience.");
      },
    });

    // AutoCAD Expert
    this.register({
      name: "autocad",
      specialty: ["autocad", "cad", "drawing", "dwg", "lisp", "layer", "dimension"],
      status: 'idle',
      handle: async (task: string) => {
        return await this.gemini.generate(task, "You are an AutoCAD expert with complete knowledge of all commands.");
      },
    });

    // Video Editor
    this.register({
      name: "video-editor",
      specialty: ["video", "edit", "filmora", "cut", "trim", "transition", "effect", "render"],
      status: 'idle',
      handle: async (task: string) => {
        return await this.gemini.generate(task, "You are a professional video editor.");
      },
    });

    // Automation Expert
    this.register({
      name: "automation",
      specialty: ["plc", "hmi", "scada", "vfd", "servo", "automation", "motor"],
      status: 'idle',
      handle: async (task: string) => {
        return await this.gemini.generate(task, "You are an industrial automation expert.");
      },
    });

    // Coder
    this.register({
      name: "coder",
      specialty: ["code", "python", "javascript", "typescript", "debug", "build", "git"],
      status: 'idle',
      handle: async (task: string) => {
        return await this.gemini.generate(task, "You are an expert programmer.");
      },
    });

    // General Assistant (fallback)
    this.register({
      name: "general",
      specialty: ["*"],
      status: 'idle',
      handle: async (task: string) => {
        return await this.gemini.generate(task);
      },
    });
  }

  register(agent: Agent) {
    this.agents.set(agent.name, agent);
  }

  // Route task to appropriate agent based on keywords
  async route(task: string, context?: any): Promise<any> {
    // Find matching agent
    for (const [name, agent] of this.agents) {
      if (agent.specialty.includes("*")) continue; // Skip fallback

      for (const keyword of agent.specialty) {
        if (task.toLowerCase().includes(keyword.toLowerCase())) {
          agent.status = 'active';
          try {
            const result = await agent.handle(task, context);
            agent.status = 'ready';
            return result;
          } catch (error) {
            agent.status = 'blocked';
            throw error;
          }
        }
      }
    }

    // Default to general agent
    const general = this.agents.get("general");
    if (general) {
      general.status = 'active';
      try {
        const result = await general.handle(task, context);
        general.status = 'ready';
        return result;
      } catch (error) {
        general.status = 'blocked';
        throw error;
      }
    }

    return null;
  }

  // Create and track a task
  createTask(type: string): Task {
    const task: Task = {
      id: `task-${Date.now()}`,
      type,
      status: 'pending',
    };
    this.tasks.set(task.id, task);
    return task;
  }

  // Get all agents with their status
  getAgentsStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    for (const [name, agent] of this.agents) {
      status[name] = agent.status;
    }
    return status;
  }

  // Get agent by name
  getAgent(name: string): Agent | undefined {
    return this.agents.get(name);
  }
}

// Export singleton
export const orchestrator = new MultiAgentOrchestrator({});