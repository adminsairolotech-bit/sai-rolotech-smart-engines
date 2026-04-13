#!/usr/bin/env node
/**
 * SAI Rolotech Engine - Interactive Command Box
 * Powered by OpenRouter (Gemini + Claude)
 */

import chalk from "chalk";
import OpenAI from "openai";
import * as readline from "readline";
import { readFileSync } from "fs";

const ASCII_LOGO = `
╔═══════════════════════════════════════════════════════════╗
║  ██████╗ ██████╗ ███╗   ███╗███████╗██╗ ██████╗          ║
║  ██╔════╝██╔═══██╗████╗ ████║██╔════╝██║██╔════╝          ║
║  ██║     ██║   ██║██╔████╔██║███████╗██║██║  ███╗         ║
║  ██║     ██║   ██║██║╚██╔╝██║╚════██║██║██║   ██║         ║
║  ╚██████╗╚██████╔╝██║ ╚═╝ ██║███████║██║╚██████╔╝         ║
║   ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝ ╚═════╝          ║
║                                                           ║
║  🤖 SMART ENGINE v1.0 - OpenRouter Powered               ║
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

async function main() {
  console.clear();
  console.log(chalk.cyan(ASCII_LOGO));

  // Load environment
  let envVars = {};
  try {
    const content = readFileSync(".env", "utf8");
    for (const line of content.split("\n")) {
      const [key, ...valueParts] = line.split("=");
      if (key && !key.startsWith("#") && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join("=").trim();
      }
    }
  } catch (e) {
    // .env not found, try process.env
  }

  // Get API key - check multiple sources
  const apiKey =
    process.env.OPENROUTER_API_KEY ||
    envVars.OPENROUTER_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    envVars.CLAUDE_API_KEY ||
    process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log(chalk.red("\n❌ ERROR: No API key found!"));
    console.log(chalk.yellow("\nAdd to .env file:"));
    console.log(chalk.gray("OPENROUTER_API_KEY=sk-or-v1-...\n"));
    console.log(chalk.cyan("Get key from: https://openrouter.ai/keys\n"));
    process.exit(1);
  }

  // Initialize OpenRouter client
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    dangerouslyAllowBrowser: true,
  });

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

  console.log(chalk.green("\n✅ Connected to OpenRouter AI\n"));
  console.log(chalk.gray("Type 'help' for commands, 'exit' to quit\n"));

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  // Chat history
  const messages = [];

  // Main loop
  while (true) {
    const input = await question(chalk.blue("➜ "));
    const trimmed = input.trim();

    if (!trimmed) continue;

    // Handle commands
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

    // Send to AI
    console.log(chalk.gray("\n⏳ Thinking...\n"));

    try {
      messages.push({ role: "user", content: prompt });

      const response = await client.chat.completions.create({
        model: "google/gemini-2.5-flash",
        max_tokens: 2048,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      });

      const text = response.choices[0]?.message?.content || "Response generated.";

      messages.push({ role: "assistant", content: text });

      console.log(chalk.white(text));
      console.log();
    } catch (err) {
      console.log(chalk.red(`\n❌ Error: ${err.message}\n`));
      messages.pop(); // Remove failed message
    }
  }
}

main().catch((err) => {
  console.error(chalk.red("\n❌ Fatal Error:"), err.message);
  process.exit(1);
});