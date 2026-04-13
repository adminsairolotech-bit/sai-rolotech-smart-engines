#!/usr/bin/env node
/**
 * SAI Rolotech AI Agent
 * Professional AI Agent powered by Gemini with Pinokio & OpenClaw integration
 */

import chalk from "chalk";
import axios from "axios";
import * as readline from "readline";

const ASCII_LOGO = `
╔═══════════════════════════════════════════════════════════════╗
║  ██████╗ ██████╗ ███╗   ███╗███████╗██╗ ██████╗            ║
║  ██╔════╝██╔═══██╗████╗ ████║██╔════╝██║██╔════╝            ║
║  ██║     ██║   ██║██╔████╔██║███████╗██║██║  ███╗           ║
║  ██║     ██║   ██║██║╚██╔╝██║╚════██║██║██║   ██║           ║
║  ╚██████╗╚██████╔╝██║ ╚═╝ ██║███████║██║╚██████╔╝           ║
║   ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝ ╚═════╝           ║
║                                                              ║
║  🤖 PRO AI AGENT - Powered by Gemini 2.5 Flash               ║
║  🔗 Pinokio & OpenClaw Integration                           ║
╚═══════════════════════════════════════════════════════════════╝
`;

// Gemini API Keys (16 paid tier)
const GEMINI_KEYS = [
  "AIzaSyCIoT8GOSCBgDJAVhsdCgGrIciFF8rFvwM",
  "AIzaSyBHOM5z1ilVBRI3O0GKYUpWeiafYGuXIFs",
  "AIzaSyBAwO893tS045H5fLZ_wj4oOLZfPLaHfDM",
  "AIzaSyASiS8WrJLXwi7IyHkEErEbQPLM5VC82ow",
  "AIzaSyDQ9dFgmCBxjxiR3H44FYbSnrsVXEoHtFY",
  "AIzaSyBSOvHwVvV090ewQhDXr4x0M_eoVvoE99I",
  "AIzaSyCmCtYXr65CkwszCzJ_y9N3R4UaHVQlCKE",
  "AIzaSyCkMS3Bk3SIC5EXfHAoyzAMcuazhWe7T9s",
  "AIzaSyCQ-n5LvFZXNOeT4rgMyp02yc-FeUkYsJ4",
  "AIzaSyB1Z4XLzGVI3Fs4WAXsCknkkQnl-xXATzs",
  "AIzaSyBA9YbUJlXjOf5nMGbHpk4-lw2CQTWx5fk",
  "AIzaSyDZkgUnz-l6iBnvxOJVK32RUixV6dX3T5Y",
  "AIzaSyBO6RdVDYDmrvgqorUWL0P_9ZEpPDsaYb0",
  "AIzaSyDob7hfneEmX36BlnUDBNB2N3wrcSSXIMw",
  "AIzaSyBBXYbpAVLYyaPDmrDakMQ2aNIfONo8mgc",
  "AIzaSyDqTDVsRGkumerwWGnkmQT-541ls5-58fs"
];
let currentKeyIndex = 0;

// Pinokio API
const PINOKIO_API = "http://localhost:42000";

// OpenClaw Gateway
const OPENCLAW_URL = "http://localhost:18789";
const OPENCLAW_TOKEN = "52bbe429ae4d8d617d3529dc114b9edae57e9bdfe89ffb4b";

const COMMANDS = `
╔════════════════════════════════════════════════════╗
║        SAI ROLO TECH PRO AGENT COMMANDS        ║
╚════════════════════════════════════════════════════╝

  💬 CHAT:
    ask <question>     - Ask anything AI se
    hello               - Greeting

  💻 CODING:
    code <task>         - Code likho
    fix <error>         - Error fix karo
    test <code>         - Code test karo

  🎨 CAD:
    cad <command>       - AutoCAD help
    lisp <task>         - AutoLISP code

  🎬 VIDEO:
    edit <task>         - Video editing help

  🤖 SYSTEM:
    pinokio status      - Pinokio system check
    pinokio install <app> - Install app via Pinokio
    pinokio list        - List installed apps
    openclaw status     - OpenClaw gateway check
    status              - Full system status

  🎯 AGENTS:
    agent list          - List available agents
    agent use <name>    - Switch agent

  🛠️ UTILITIES:
    clear               - Screen clear
    help                - This help
    exit                - Exit

  EXAMPLES:
    ask Roll forming me C-channel kya hota hai?
    code Write a Python factorial function
    cad How to draw a circle?
    pinokio status
`;

// System prompt
const SYSTEM_PROMPT = `You are SAI Rolotech Pro AI Agent - an expert assistant specializing in:

1. ROLL FORMING ENGINEERING - C-Channel, Z-Purlin, machine setup, defects, quality control
2. AUTOCAD - Commands, LISP scripting, 3D modeling, dimensions
3. VIDEO EDITING - Filmora techniques, transitions, color grading, audio
4. INDUSTRIAL AUTOMATION - PLC, HMI, SCADA, VFD, Servo Motors
5. GENERAL PROGRAMMING - Python, JavaScript, TypeScript, C++, etc.

Be concise, practical, and domain-expert level. Use Hindi/English (Hinglish) when appropriate.
Provide working code examples with proper syntax highlighting.`;

// Check Pinokio status
async function checkPinokioStatus() {
  try {
    const response = await axios.get(`${PINOKIO_API}/`, { timeout: 3000 });
    return `✅ Pinokio: RUNNING on port 42000`;
  } catch (e) {
    return `⚠️ Pinokio: NOT RUNNING (Start from Desktop)`;
  }
}

// Check OpenClaw status
async function checkOpenClawStatus() {
  try {
    const response = await axios.get(`${OPENCLAW_URL}/`, { timeout: 3000 });
    return `✅ OpenClaw Gateway: RUNNING on port 18789`;
  } catch (e) {
    return `⚠️ OpenClaw Gateway: NOT RUNNING (Run: openclaw gateway)`;
  }
}

// Main function
async function main() {
  console.clear();
  console.log(chalk.cyan(ASCII_LOGO));

  // Check system status
  const [pinokioStatus, openclawStatus] = await Promise.all([
    checkPinokioStatus(),
    checkOpenClawStatus()
  ]);

  console.log(chalk.green(`\n✅ SAI Rolotech Pro Agent Initialized\n`));
  console.log(chalk.gray(`  ${pinokioStatus}`));
  console.log(chalk.gray(`  ${openclawStatus}`));
  console.log(chalk.gray(`  🔑 Gemini API: 16 Keys Active`));
  console.log(chalk.gray(`  🧠 Model: gemini-2.5-flash\n`));
  console.log(chalk.cyan(`Type 'help' for commands, 'exit' to quit\n`));

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  // Call Gemini API
  async function callAI(prompt) {
    const apiKey = GEMINI_KEYS[currentKeyIndex];
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${prompt}` }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 8192 },
        },
        { timeout: 30000 }
      );

      currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
      return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    } catch (e) {
      currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
      if (e.response?.status === 429 || e.response?.status === 503) {
        return `⚠️ Rate limit, trying next key...`;
      }
      return `Error: ${e.message}`;
    }
  }

  // Main loop
  while (true) {
    const input = await question(chalk.blue("➜ "));
    const trimmed = input.trim();

    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();

    if (lower === "exit") {
      console.log(chalk.green("\n👋 Goodbye! SAI Rolotech Agent shutting down...\n"));
      rl.close();
      process.exit(0);
    }

    if (lower === "help") {
      console.log(chalk.cyan(COMMANDS));
      continue;
    }

    if (lower === "clear") {
      console.clear();
      console.log(chalk.cyan(ASCII_LOGO));
      continue;
    }

    if (lower === "status") {
      console.log(chalk.cyan("\n📊 SYSTEM STATUS:\n"));
      console.log(chalk.gray(await checkPinokioStatus()));
      console.log(chalk.gray(await checkOpenClawStatus()));
      console.log(chalk.gray(`  🔑 Gemini API: ${GEMINI_KEYS.length} Keys`));
      console.log(chalk.gray(`  🧠 Model: gemini-2.5-flash\n`));
      continue;
    }

    if (lower === "pinokio status") {
      console.log(chalk.cyan("\n🔧 PINOKIO STATUS:\n"));
      console.log(chalk.gray(await checkPinokioStatus()));
      console.log(chalk.gray(`  🌐 UI: http://localhost:42000\n`));
      continue;
    }

    if (lower === "openclaw status") {
      console.log(chalk.cyan("\n🦞 OPENCLOW STATUS:\n"));
      console.log(chalk.gray(await checkOpenClawStatus()));
      console.log(chalk.gray(`  🌐 Dashboard: http://localhost:18789\n`));
      continue;
    }

    if (lower === "hello" || lower === "hi") {
      console.log(chalk.green("\n🤖 Namaste! SAI Rolotech Pro Agent!\n"));
      console.log(chalk.white("  I'm powered by:"));
      console.log(chalk.cyan("  • Gemini 2.5 Flash AI (16 API Keys)"));
      console.log(chalk.cyan("  • Pinokio AI Launcher"));
      console.log(chalk.cyan("  • OpenClaw Gateway"));
      console.log(chalk.cyan("  • SAI Rolotech Engine\n"));
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
      prompt = `Fix error: ${args}`;
    } else if (cmd === "cad") {
      prompt = `AutoCAD help - ${args}. Include LISP examples.`;
    } else if (cmd === "lisp") {
      prompt = `Write AutoLISP code: ${args}`;
    } else if (cmd === "edit") {
      prompt = `Video editing help: ${args}`;
    }

    console.log(chalk.gray("\n⏳ Thinking...\n"));

    const response = await callAI(prompt);
    console.log(chalk.white(response));
    console.log();
  }
}

main().catch((err) => {
  console.error(chalk.red("\n❌ Fatal Error:"), err.message);
  process.exit(1);
});
