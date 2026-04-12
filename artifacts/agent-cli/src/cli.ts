/**
 * MASTER CLI - Command Line Interface
 * Universal AI Agent for Laptop
 */

import readline from "readline";
import { aiChat } from "./modules/ai.js";
import { fileManager } from "./modules/files.js";
import { systemControl } from "./modules/system.js";
import { appControl } from "./modules/apps.js";
import { codeExecutor } from "./modules/code.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "MASTER > "
});

console.log(`
╔════════════════════════════════════════════╗
║     MASTER - Universal AI Agent            ║
║     Your personal laptop assistant           ║
╚════════════════════════════════════════════╝

Type 'help' for commands
Type 'exit' to quit

`);

rl.prompt();

// Command history
const history: Array<{role: string; content: string}> = [];

rl.on("line", async (line) => {
  const command = line.trim().toLowerCase();

  if (!command) {
    rl.prompt();
    return;
  }

  // Built-in commands
  if (command === "exit" || command === "quit") {
    console.log("Goodbye!");
    process.exit(0);
  }

  if (command === "help") {
    printHelp();
    rl.prompt();
    return;
  }

  if (command === "history") {
    history.forEach((h, i) => {
      console.log(`${i + 1}. [${h.role}] ${h.content.substring(0, 80)}`);
    });
    rl.prompt();
    return;
  }

  if (command === "clear") {
    console.clear();
    rl.prompt();
    return;
  }

  // Execute command
  try {
    console.log("Processing...");
    const result = await executeCommand(line);
    console.log(result);
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
  }

  rl.prompt();
});

async function executeCommand(input: string): Promise<string> {
  const lower = input.toLowerCase();

  // File operations
  if (lower.startsWith("ls ") || lower === "ls") {
    const path = lower === "ls" ? process.cwd() : input.substring(3);
    const result = await fileManager("list", path);
    return result.output || result.error || "Done";
  }

  if (lower.startsWith("cat ") || lower.startsWith("read ")) {
    const file = input.substring(lower.startsWith("cat ") ? 4 : 5).trim();
    const result = await fileManager("read", file);
    return result.output || result.error || "Done";
  }

  if (lower.startsWith("mkdir ") || lower.startsWith("newfolder ")) {
    const folder = input.substring(lower.startsWith("mkdir ") ? 6 : 10).trim();
    const result = await fileManager("mkdir", folder);
    return result.output || result.error || "Done";
  }

  if (lower.startsWith("rm ") || lower.startsWith("delete ")) {
    const file = input.substring(lower.startsWith("rm ") ? 3 : 7).trim();
    const result = await fileManager("delete", file);
    return result.output || result.error || "Done";
  }

  // System info
  if (lower.includes("system") || lower.includes("info")) {
    const result = await systemControl(input);
    return result.output || result.error || "Done";
  }

  // App control
  if (lower.includes("open ") || lower.includes("notepad") || lower.includes("chrome")) {
    const result = await appControl(input);
    return result.output || result.error || "Done";
  }

  // Code execution
  if (lower.startsWith("run ") || lower.startsWith("exec ")) {
    const result = await codeExecutor(input);
    if (result.success) {
      return result.output || "Executed successfully";
    }
    return `Error: ${result.error}`;
  }

  // AI chat (default)
  const response = await aiChat.ask(input, undefined, history);
  history.push({ role: "user", content: input });
  history.push({ role: "assistant", content: response });
  return response;
}

function printHelp() {
  console.log(`
MASTER Commands:
════════════════════════════════════════════════

FILE OPERATIONS:
  ls [path]           - List files in directory
  cat <file>          - Read file contents
  mkdir <folder>      - Create folder
  rm <file>           - Delete file
  newfolder <name>    - Create new folder

SYSTEM:
  system info         - Show system information
  battery             - Show battery status
  memory              - Show memory usage
  wifi                - Show WiFi status

APPS:
  open notepad        - Open Notepad
  open chrome         - Open Chrome browser
  open calculator     - Open Calculator
  open explorer       - Open File Explorer

CODE:
  run <code>          - Execute code
  exec <command>      - Execute shell command

AI:
  <any question>      - Ask AI anything

OTHER:
  help                - Show this help
  history             - Show command history
  clear               - Clear screen
  exit                - Exit MASTER

════════════════════════════════════════════════
  `);
}

export default {};