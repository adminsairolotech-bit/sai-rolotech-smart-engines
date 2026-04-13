#!/usr/bin/env node
/**
 * SAI Rolotech Engine - Interactive Command Box
 * Powered by OpenClaw Gateway (port 18789)
 */

import chalk from "chalk";
import axios from "axios";
import * as readline from "readline";

const ASCII_LOGO = `
╔═══════════════════════════════════════════════════════════╗
║  ██████╗ ██████╗ ███╗   ███╗███████╗██╗ ██████╗          ║
║  ██╔════╝██╔═══██╗████╗ ████║██╔════╝██║██╔════╝          ║
║  ██║     ██║   ██║██╔████╔██║███████╗██║██║  ███╗         ║
║  ██║     ██║   ██║██║╚██╔╝██║╚════██║██║██║   ██║         ║
║  ╚██████╗╚██████╔╝██║ ╚═╝ ██║███████║██║╚██████╔╝         ║
║   ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝ ╚═════╝          ║
║                                                           ║
║  🤖 SMART ENGINE v1.0 - OpenClaw Powered                 ║
╚═══════════════════════════════════════════════════════════╝
`;

const COMMANDS = `
╔════════════════════════════════════════╗
║        AVAILABLE COMMANDS            ║
╚════════════════════════════════════════╝

  BASIC:
    ask <question>     - Ask anything
    hello              - Greet the AI
    help               - Show this help

  CODING:
    code <task>        - Write code
    fix <error>        - Fix code error
    test <code>        - Test code

  CAD:
    cad <command>       - AutoCAD help
    lisp <task>         - AutoLISP code
    draw <shape>       - Draw shape guide

  VIDEO:
    edit <task>         - Video editing help
    cut <instruction>   - Cutting guide
    effect <name>       - Effect info

  UTILITIES:
    search <query>      - Web search
    image <prompt>      - Image prompt
    voice <text>       - TTS preview

  SYSTEM:
    clear              - Clear screen
    exit               - Quit

  EXAMPLES:
    ask What is roll forming?
    code Write a hello world in Python
    cad How to draw a circle?
    edit How to add fade transition?
`;

// OpenClaw Gateway Configuration
const OPENCLAW_URL = "http://localhost:18789";
const OPENCLAW_TOKEN = "52bbe429ae4d8d617d3529dc114b9edae57e9bdfe89ffb4b";

async function main() {
  console.clear();
  console.log(chalk.cyan(ASCII_LOGO));

  // Check OpenClaw status
  let openClawAvailable = false;
  try {
    const response = await axios.get(`${OPENCLAW_URL}/api/v1/status`, {
      headers: { Authorization: `Bearer ${OPENCLAW_TOKEN}` },
      timeout: 3000,
    });
    openClawAvailable = response.status === 200;
    console.log(chalk.green("\n✅ Connected to OpenClaw Gateway\n"));
  } catch (e) {
    console.log(chalk.yellow("\n⚠️  OpenClaw Gateway not detected"));
    console.log(chalk.gray("   Start with: openclaw gateway\n"));
    console.log(chalk.cyan("   Running in standalone mode with Gemini Direct\n"));
  }

  console.log(chalk.gray("Type 'help' for commands, 'exit' to quit\n"));

  // System prompt with knowledge
  const systemPrompt = `You are SAI Rolotech Engine - an expert AI assistant specializing in:

1. ROLL FORMING ENGINEERING - C-Channel, Z-Purlin, machine setup, defects, quality control
2. AUTOCAD - All commands, LISP scripting, 3D modeling, dimensions
3. VIDEO EDITING - Filmora-level techniques, transitions, color grading, audio
4. INDUSTRIAL AUTOMATION - PLC, HMI, SCADA, VFD, Servo Motors
5. GENERAL PROGRAMMING - Python, JavaScript, TypeScript, and more

Be concise, practical, and domain-expert level in your responses.
Use Hindi/English mix (Hinglish) when appropriate.
Format code properly with syntax highlighting.
For CAD commands, include LISP examples when relevant.`;

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  // Helper function to call OpenClaw Gateway
  async function sendToAI(prompt) {
    if (openClawAvailable) {
      try {
        const response = await axios.post(
          `${OPENCLAW_URL}/api/v1/chat`,
          { prompt, system: systemPrompt },
          { headers: { Authorization: `Bearer ${OPENCLAW_TOKEN}` }, timeout: 30000 }
        );
        return response.data?.text || "No response";
      } catch (e) {
        console.log(chalk.yellow(`OpenClaw error: ${e.message}`));
      }
    }

    // Demo mode when OpenClaw not running
    return `🤖 SAI Rolotech Engine - Demo Mode

Open OpenClaw Gateway for full AI:
1. Open new terminal
2. Run: openclaw gateway
3. Come back here and try again

Available Commands:
- ask <question> - Ask anything
- cad <task> - AutoCAD help
- edit <task> - Video editing
- code <task> - Programming help
- lisp <task> - AutoLISP code

Roll Forming: C-Channel, Z-Purlin, Machine Setup
AutoCAD: Commands, LISP, 3D Modeling
Video: Filmora, Transitions, Effects`;
  }

  // Main loop
  while (true) {
    const input = await question(chalk.blue("➜ "));
    const trimmed = input.trim();

    if (!trimmed) continue;

    if (trimmed.toLowerCase() === "exit") {
      console.log(chalk.green("\n👋 Goodbye! SAI Rolotech Engine shutting down...\n"));
      rl.close();
      process.exit(0);
    }

    if (trimmed.toLowerCase() === "help") {
      console.log(chalk.cyan(COMMANDS));
      continue;
    }

    if (trimmed.toLowerCase() === "clear") {
      console.clear();
      console.log(chalk.cyan(ASCII_LOGO));
      continue;
    }

    if (trimmed.toLowerCase() === "hello" || trimmed.toLowerCase() === "hi") {
      console.log(chalk.green("\n🤖 Namaste! I'm SAI Rolotech Engine."));
      console.log(chalk.white("  I'm your AI assistant for:"));
      console.log(chalk.cyan("  • Roll Forming Engineering"));
      console.log(chalk.cyan("  • AutoCAD & CAD/CAM"));
      console.log(chalk.cyan("  • Video Editing"));
      console.log(chalk.cyan("  • Industrial Automation"));
      console.log(chalk.cyan("  • Programming\n"));
      continue;
    }

    // Parse command
    const parts = trimmed.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(" ");

    let prompt = trimmed;

    if (cmd === "ask" || cmd === "q") {
      prompt = args;
    } else if (cmd === "code") {
      prompt = `Write code: ${args}`;
    } else if (cmd === "fix") {
      prompt = `Fix this error: ${args}`;
    } else if (cmd === "test") {
      prompt = `Test this code: ${args}`;
    } else if (cmd === "cad") {
      prompt = `AutoCAD help - ${args}. Include LISP examples if relevant.`;
    } else if (cmd === "lisp") {
      prompt = `Write AutoLISP code: ${args}`;
    } else if (cmd === "draw") {
      prompt = `Explain how to draw ${args} in AutoCAD with steps and commands.`;
    } else if (cmd === "edit") {
      prompt = `Video editing help - ${args}. Be specific with Filmora techniques.`;
    } else if (cmd === "cut") {
      prompt = `Video cutting guide for: ${args}`;
    } else if (cmd === "effect") {
      prompt = `Explain video effect "${args}" with settings and usage.`;
    } else if (cmd === "search") {
      prompt = `Search the web for: ${args}. Provide a summary.`;
    } else if (cmd === "image") {
      prompt = `Create an image prompt for: ${args}. Be descriptive.`;
    } else if (cmd === "voice") {
      prompt = `Text to speech preview for: ${args}. Explain voice settings.`;
    }

    console.log(chalk.gray("\n⏳ Thinking...\n"));

    const response = await sendToAI(prompt);
    console.log(chalk.white(response));
    console.log();
  }
}

main().catch((err) => {
  console.error(chalk.red("\n❌ Fatal Error:"), err.message);
  process.exit(1);
});