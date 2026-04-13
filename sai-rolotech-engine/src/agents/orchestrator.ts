/**
 * MULTI-AGENT ORCHESTRATOR
 * Routes tasks to specialized agents
 */

import { GeminiAgent } from "../lib/gemini-agent.js";
import chalk from "chalk";

interface Agent {
  name: string;
  specialty: string[];
  handle: (task: string, context?: any) => Promise<any>;
}

export class MultiAgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private client: any; // Anthropic or similar
  private gemini: GeminiAgent;

  constructor(client: any) {
    this.client = client;
    this.gemini = new GeminiAgent();
    this.registerDefaultAgents();
  }

  private registerDefaultAgents() {
    // Coding Agent
    this.register({
      name: "coder",
      specialty: ["code", "programming", "debug", "fix", "build", "test", "git"],
      handle: async (task: string) => {
        return await this.client.messages.create({
          model: "claude-opus-4-5",
          max_tokens: 4096,
          messages: [{ role: "user", content: task }],
        });
      },
    });

    // Roll Forming Expert
    this.register({
      name: "roll-forming-expert",
      specialty: ["roll", "forming", "c-channel", "z-purlin", "machine", "die", "roller"],
      handle: async (task: string) => {
        return await this.client.messages.create({
          model: "claude-opus-4-5",
          max_tokens: 2048,
          system: "You are a senior roll forming engineer with 50 years of experience.",
          messages: [{ role: "user", content: task }],
        });
      },
    });

    // AutoCAD Expert
    this.register({
      name: "autocad-expert",
      specialty: ["autocad", "cad", "drawing", "dwg", "dxf", "lisp", "script", "layer"],
      handle: async (task: string) => {
        return await this.client.messages.create({
          model: "claude-opus-4-5",
          max_tokens: 2048,
          system: "You are an AutoCAD expert with complete knowledge of all commands.",
          messages: [{ role: "user", content: task }],
        });
      },
    });

    // Video Editor
    this.register({
      name: "video-editor",
      specialty: ["video", "edit", "filmora", "cut", "trim", "transition", "effect", "render"],
      handle: async (task: string) => {
        return await this.client.messages.create({
          model: "claude-opus-4-5",
          max_tokens: 2048,
          system: "You are a professional video editor with expertise in Filmora and all editing tools.",
          messages: [{ role: "user", content: task }],
        });
      },
    });

    // Web Research Agent
    this.register({
      name: "researcher",
      specialty: ["search", "find", "research", "lookup", "browse", "web"],
      handle: async (task: string) => {
        return await this.client.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          system: "You are a research assistant. Search the web for accurate information.",
          messages: [{ role: "user", content: task }],
        });
      },
    });

    // Gemini Specialist (Rotated Keys)
    this.register({
      name: "gemini",
      specialty: ["fast", "gemini", "google", "free", "volume"],
      handle: async (task: string) => {
        return await this.gemini.generate(task);
      },
    });

    // General Assistant (with Gemini Fallback)
    this.register({
      name: "assistant",
      specialty: ["*"],
      handle: async (task: string) => {
        try {
          return await this.client.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 2048,
            messages: [{ role: "user", content: task }],
          });
        } catch (error) {
          console.log(chalk.yellow("[WARN] Claude failed, falling back to Gemini..."));
          return await this.gemini.generate(task);
        }
      },
    });
  }

  register(agent: Agent) {
    this.agents.set(agent.name, agent);
  }

  async route(task: string, context?: any): Promise<any> {
    // Route to appropriate agent based on keywords
    for (const [name, agent] of this.agents) {
      if (agent.specialty.includes("*")) continue; // Default agent

      for (const keyword of agent.specialty) {
        if (task.toLowerCase().includes(keyword.toLowerCase())) {
          return await agent.handle(task, context);
        }
      }
    }

    // Default to general assistant
    const defaultAgent = this.agents.get("assistant");
    return defaultAgent ? await defaultAgent.handle(task, context) : null;
  }
}
