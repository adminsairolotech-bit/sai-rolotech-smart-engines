/**
 * Code Executor Module
 * Executes generated code
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

interface ExecResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
  runtime?: string;
}

export async function codeExecutor(command: string): Promise<ExecResult> {
  const lowerCmd = command.toLowerCase();

  try {
    // Extract code from command
    let code = "";
    let language = "";

    // Check for inline code
    if (lowerCmd.includes("```")) {
      const codeMatch = command.match(/```[\w]*\n?([\s\S]+?)```/);
      if (codeMatch) code = codeMatch[1];
    }

    // Get language
    if (lowerCmd.includes("python")) language = "py";
    else if (lowerCmd.includes("javascript") || lowerCmd.includes("js")) language = "js";
    else if (lowerCmd.includes("typescript") || lowerCmd.includes("ts")) language = "ts";
    else if (lowerCmd.includes("bash") || lowerCmd.includes("shell")) language = "sh";
    else if (lowerCmd.includes("powershell")) language = "ps1";

    // Save to temp file
    const tempDir = os.tmpdir();
    const ext = language === "py" ? ".py" : language === "js" ? ".js" : language === "ts" ? ".ts" : language === "sh" ? ".sh" : language === "ps1" ? ".ps1" : ".txt";
    const tempFile = path.join(tempDir, `master_exec_${Date.now()}${ext}`);

    fs.writeFileSync(tempFile, code);

    // Execute based on language
    let result: ExecResult;

    switch (language) {
      case "py":
        result = await executePython(tempFile);
        break;
      case "js":
        result = await executeNode(tempFile);
        break;
      case "sh":
        result = await executeBash(tempFile);
        break;
      case "ps1":
        result = await executePowerShell(tempFile);
        break;
      default:
        result = await executePython(tempFile);
    }

    // Cleanup
    try { fs.unlinkSync(tempFile); } catch {}

    return result;

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function executePython(filePath: string): Promise<ExecResult> {
  return new Promise((resolve) => {
    const proc = spawn("python", [filePath], {
      timeout: 30000,
      shell: true
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => { stdout += data.toString(); });
    proc.stderr?.on("data", (data) => { stderr += data.toString(); });

    proc.on("close", (code) => {
      resolve({
        success: code === 0,
        output: stdout || "Executed successfully",
        error: stderr || undefined,
        exitCode: code ?? undefined,
        runtime: "python"
      });
    });

    proc.on("error", (err) => {
      resolve({ success: false, error: err.message, runtime: "python" });
    });
  });
}

async function executeNode(filePath: string): Promise<ExecResult> {
  return new Promise((resolve) => {
    const proc = spawn("node", [filePath], {
      timeout: 30000
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => { stdout += data.toString(); });
    proc.stderr?.on("data", (data) => { stderr += data.toString(); });

    proc.on("close", (code) => {
      resolve({
        success: code === 0,
        output: stdout || "Executed successfully",
        error: stderr || undefined,
        exitCode: code ?? undefined,
        runtime: "node"
      });
    });

    proc.on("error", (err) => {
      resolve({ success: false, error: err.message, runtime: "node" });
    });
  });
}

async function executeBash(filePath: string): Promise<ExecResult> {
  return new Promise((resolve) => {
    const proc = spawn("bash", [filePath], {
      timeout: 30000
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => { stdout += data.toString(); });
    proc.stderr?.on("data", (data) => { stderr += data.toString(); });

    proc.on("close", (code) => {
      resolve({
        success: code === 0,
        output: stdout || "Executed successfully",
        error: stderr || undefined,
        exitCode: code ?? undefined,
        runtime: "bash"
      });
    });

    proc.on("error", (err) => {
      resolve({ success: false, error: err.message, runtime: "bash" });
    });
  });
}

async function executePowerShell(filePath: string): Promise<ExecResult> {
  return new Promise((resolve) => {
    const proc = spawn("powershell", ["-ExecutionPolicy", "Bypass", "-File", filePath], {
      timeout: 30000
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => { stdout += data.toString(); });
    proc.stderr?.on("data", (data) => { stderr += data.toString(); });

    proc.on("close", (code) => {
      resolve({
        success: code === 0,
        output: stdout || "Executed successfully",
        error: stderr || undefined,
        exitCode: code ?? undefined,
        runtime: "powershell"
      });
    });

    proc.on("error", (err) => {
      resolve({ success: false, error: err.message, runtime: "powershell" });
    });
  });
}

// Run any command directly
export async function runCommand(cmd: string): Promise<ExecResult> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, [], {
      timeout: 10000,
      shell: true
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => { stdout += data.toString(); });
    proc.stderr?.on("data", (data) => { stderr += data.toString(); });

    proc.on("close", (code) => {
      resolve({
        success: code === 0,
        output: stdout,
        error: stderr || undefined,
        exitCode: code ?? undefined
      });
    });

    proc.on("error", (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}
