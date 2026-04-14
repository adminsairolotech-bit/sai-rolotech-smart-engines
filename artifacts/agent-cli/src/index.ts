#!/usr/bin/env node
/**
 * MASTER - Universal AI Agent for Laptop
 * ========================================
 * Full version with:
 * - AI Chat (Ollama/Gemini/OpenRouter)
 * - Screen capture
 * - Voice input
 * - System control
 * - File management
 * - App control
 * - Code execution
 */

import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { screenCapture } from "./modules/screen.js";
import { voiceInput } from "./modules/voice.js";
import { systemControl } from "./modules/system.js";
import { fileManager } from "./modules/files.js";
import { appControl } from "./modules/apps.js";
import { codeExecutor } from "./modules/code.js";
import { aiChat } from "./modules/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.AGENT_PORT || 4000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
}

interface TaskResult {
  task: string;
  status: "pending" | "running" | "done" | "failed";
  result?: CommandResult;
}

// Command Executor - maps natural language to actions
class CommandExecutor {
  private history: Array<{role: string; content: string}> = [];

  async execute(command: string, context?: string): Promise<TaskResult> {
    const task = command.toLowerCase().trim();
    console.log(`[MASTER] Executing: ${task}`);

    // Add to history
    this.history.push({ role: "user", content: command });

    try {
      // Route to appropriate handler
      if (task.includes("screenshot") || task.includes("screen capture") || task.includes("dekho")) {
        return await this.handleScreenCapture();
      }

      if (task.includes("voice") || task.includes("sun") || task.includes("listen")) {
        return await this.handleVoiceInput();
      }

      if (task.includes("file") || task.includes("folder") || task.includes("banao") || task.includes("delete")) {
        return await this.handleFileOp(task, command);
      }

      if (task.includes("app") || task.includes("notepad") || task.includes("chrome") || task.includes("khol") || task.includes("open")) {
        return await this.handleAppControl(command);
      }

      if (task.includes("code") || task.includes("program") || task.includes("likho") || task.includes("script")) {
        return await this.handleCodeGen(command);
      }

      if (task.includes("run") || task.includes("execute") || task.includes("chalana")) {
        return await this.handleCodeExec(command);
      }

      if (task.includes("system") || task.includes("control") || task.includes("shutdown") || task.includes("restart")) {
        return await this.handleSystemControl(command);
      }

      // Default: Use AI to understand and execute
      return await this.handleAICommand(command, context);

    } catch (error: any) {
      return {
        task: command,
        status: "failed",
        result: {
          success: false,
          output: "",
          error: error.message
        }
      };
    }
  }

  private async handleScreenCapture(): Promise<TaskResult> {
    const result = await screenCapture();
    return {
      task: "Screen Capture",
      status: result.success ? "done" : "failed",
      result
    };
  }

  private async handleVoiceInput(): Promise<TaskResult> {
    const result = await voiceInput();
    return {
      task: "Voice Input",
      status: result.success ? "done" : "failed",
      result
    };
  }

  private async handleFileOp(task: string, command: string): Promise<TaskResult> {
    const op = task.includes("banao") || task.includes("create") ? "create" :
               task.includes("delete") ? "delete" :
               task.includes("read") || task.includes("dekho") ? "read" :
               task.includes("write") || task.includes("likho") ? "write" : "list";

    const result = await fileManager(op, command);
    return {
      task: `File ${op}`,
      status: result.success ? "done" : "failed",
      result
    };
  }

  private async handleAppControl(command: string): Promise<TaskResult> {
    const result = await appControl(command);
    return {
      task: "App Control",
      status: result.success ? "done" : "failed",
      result
    };
  }

  private async handleCodeGen(command: string): Promise<TaskResult> {
    // Use AI to generate code
    const code = await aiChat.generate(command, this.history);

    // Save to temp file
    const filePath = await fileManager("write", `Generated code:\n${code}`);

    return {
      task: "Code Generation",
      status: "done",
      result: {
        success: true,
        output: `Code generated and saved!\n\n${code.substring(0, 500)}...\n\nFull code saved. Type "run" to execute.`
      }
    };
  }

  private async handleCodeExec(command: string): Promise<TaskResult> {
    const result = await codeExecutor(command);
    return {
      task: "Code Execution",
      status: result.success ? "done" : "failed",
      result
    };
  }

  private async handleSystemControl(command: string): Promise<TaskResult> {
    const result = await systemControl(command);
    return {
      task: "System Control",
      status: result.success ? "done" : "failed",
      result
    };
  }

  private async handleAICommand(command: string, context?: string): Promise<TaskResult> {
    const response = await aiChat.ask(command, context, this.history);
    this.history.push({ role: "assistant", content: response });

    return {
      task: "AI Response",
      status: "done",
      result: {
        success: true,
        output: response
      }
    };
  }

  getHistory() {
    return this.history;
  }
}

// Main Application
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const executor = new CommandExecutor();

// REST API Endpoints
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    name: "MASTER - Universal AI Agent",
    version: "1.0.0",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    features: [
      "ai-chat", "screen-capture", "voice-input",
      "file-management", "app-control", "code-execution", "system-control"
    ]
  });
});

// Command execution
app.post("/exec", async (req, res) => {
  const { command, context } = req.body;
  if (!command) {
    return res.status(400).json({ error: "command required" });
  }

  const result = await executor.execute(command, context);
  res.json(result);
});

// AI Chat only
app.post("/ask", async (req, res) => {
  const { message, history } = req.body;
  const response = await aiChat.ask(message, undefined, history);
  res.json({ response });
});

// Code generation
app.post("/code", async (req, res) => {
  const { prompt, language } = req.body;
  const code = await aiChat.generate(prompt, undefined, language);
  res.json({ code });
});

// File operations
app.post("/file", async (req, res) => {
  const { op, path: filePath, content } = req.body;
  const result = await fileManager(op, filePath, content);
  res.json(result);
});

// Screen capture
app.get("/screenshot", async (_req, res) => {
  const result = await screenCapture();
  res.json(result);
});

// Socket.IO for real-time
io.on("connection", (socket) => {
  console.log("[MASTER] Client connected:", socket.id);

  socket.on("command", async (command: string, callback) => {
    const result = await executor.execute(command);
    callback(result);
  });

  socket.on("ask", async (message: string, callback) => {
    const response = await aiChat.ask(message);
    callback({ response });
  });

  socket.on("disconnect", () => {
    console.log("[MASTER] Client disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔════════════════════════════════════════════╗
║     MASTER - Universal AI Agent             ║
╠════════════════════════════════════════════╣
║ URL: http://localhost:${PORT}                ║
║ Socket: ws://localhost:${PORT}               ║
║                                            ║
║ Commands:                                  ║
║   POST /exec  - Execute command           ║
║   POST /ask   - AI chat                   ║
║   POST /code  - Generate code             ║
║   POST /file  - File operations           ║
║   GET  /screenshot - Capture screen       ║
║   GET  /health - Server status            ║
║                                            ║
║ Features:                                   ║
║   ✓ AI Chat (Ollama local)                ║
║   ✓ Screen Capture                        ║
║   ✓ Voice Input                           ║
║   ✓ File Management                       ║
║   ✓ App Control                           ║
║   ✓ Code Execution                         ║
║   ✓ System Control                        ║
╚════════════════════════════════════════════╝
  `);
});

export default app;
