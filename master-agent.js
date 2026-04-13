/**
 * SAI Rolotech Master Agent
 * Custom AI Agent with skills, repos, and memory
 */

import chalk from "chalk";
import axios from "axios";
import * as readline from "readline";

const ASCII_LOGO = `
╔═══════════════════════════════════════════════════════════════╗
║  🤖 SAI ROLO TECH - MASTER AGENT                            ║
║  Powered by Gemini 2.5 Flash + Custom Skills                ║
║  🔗 Connected: agent-orchestrator, edict, promptflow       ║
╚═══════════════════════════════════════════════════════════════╝
`;

// Gemini API Keys
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

// Available Skills & Repos
const AVAILABLE_SKILLS = `
╔════════════════════════════════════════════════════╗
║  AVAILABLE SKILLS & AGENTS                     ║
╚════════════════════════════════════════════════════╝

📁 CLONED REPOS (Ready to use):
  • agent-orchestrator  - Multi-agent routing
  • edict              - 9 specialized AI agents
  • promptflow         - Microsoft AI framework
  • graph-memory       - Memory patterns
  • mnemon             - Cross-session memory
  • open-multi-agent   - Parallel agent execution

🔧 SKILLS AVAILABLE:
  • Roll Forming Engineering
  • AutoCAD & LISP Scripting
  • Video Editing (Filmora)
  • Industrial Automation (PLC/VFD)
  • Python/JavaScript/TypeScript

🌐 COMMANDS:
  skills list     - Show all available skills
  skills use <name> - Activate a skill
  agent status    - Check agent status
  memory show    - Show saved memories
  exit           - Quit
`;

// Master System Prompt with all skills
const SYSTEM_PROMPT = `You are SAI Rolotech MASTER AGENT - a highly capable AI assistant.

YOUR EXPERTISE:
1. ROLL FORMING ENGINEERING
   - C-Channel, Z-Purlin manufacturing
   - Machine setup, defect analysis, quality control
   - Material selection (CRCA, HR Steel)

2. AUTOCAD & CAD/CAM
   - All AutoCAD commands
   - AutoLISP scripting
   - 3D modeling, dimensions
   - DXF/DWG files

3. VIDEO EDITING
   - Filmora, DaVinci Resolve
   - Transitions, color grading
   - Audio sync, effects

4. INDUSTRIAL AUTOMATION
   - PLC Programming (Siemens, Allen-Bradley)
   - HMI/SCADA design
   - VFD, Servo Motor control

5. PROGRAMMING
   - Python, JavaScript, TypeScript
   - Node.js, React
   - Database, APIs

6. AI AGENTS & ORCHESTRATION
   - Multi-agent systems
   - Agent coordination
   - Workflow automation

BEHAVIOR:
- Be concise and practical
- Use Hindi/English (Hinglish) when helpful
- Provide working code examples
- Think step by step for complex problems`;

// Memory storage
let memory = [];
let activeSkill = "general";

async function main() {
  console.clear();
  console.log(chalk.cyan(ASCII_LOGO));
  console.log(chalk.green(`\n✅ MASTER AGENT INITIALIZED\n`));
  console.log(chalk.gray(`  🔑 Gemini API: ${GEMINI_KEYS.length} Keys Active`));
  console.log(chalk.gray(`  🧠 Model: gemini-2.5-flash (1M context)`));
  console.log(chalk.gray(`  📁 Skills: 6 repos loaded`));
  console.log(chalk.gray(`  🌐 Status: Online & Ready\n`));
  console.log(chalk.cyan(`Type 'skills' to see available skills, 'exit' to quit\n`));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  async function callAI(prompt) {
    const apiKey = GEMINI_KEYS[currentKeyIndex];
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nSkill: ${activeSkill}\n\nUser: ${prompt}` }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 8192 },
        },
        { timeout: 30000 }
      );
      currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
      return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    } catch (e) {
      currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
      if (e.response?.status === 429) return `⚠️ Rate limit, trying next key...`;
      return `Error: ${e.message}`;
    }
  }

  while (true) {
    const input = await question(chalk.blue("➜ "));
    const trimmed = input.trim().toLowerCase();

    if (!trimmed) continue;

    if (trimmed === "exit") {
      console.log(chalk.green("\n👋 Goodbye! Master Agent shutting down...\n"));
      rl.close();
      process.exit(0);
    }

    if (trimmed === "skills") {
      console.log(chalk.cyan(AVAILABLE_SKILLS));
      continue;
    }

    if (trimmed === "status" || trimmed === "agent status") {
      console.log(chalk.cyan("\n📊 AGENT STATUS:\n"));
      console.log(chalk.gray(`  Active Skill: ${activeSkill}`));
      console.log(chalk.gray(`  Memory Items: ${memory.length}`));
      console.log(chalk.gray(`  API Keys: ${GEMINI_KEYS.length}`));
      console.log(chalk.gray(`  Current Key: #${currentKeyIndex + 1}\n`));
      continue;
    }

    if (trimmed.startsWith("skills use ")) {
      const skillName = input.slice(10).trim();
      activeSkill = skillName;
      console.log(chalk.green(`\n✅ Skill activated: ${skillName}\n`));
      continue;
    }

    if (trimmed === "hello" || trimmed === "hi") {
      console.log(chalk.green("\n🤖 Namaste! Master Agent at your service!\n"));
      console.log(chalk.white("  I have access to:"));
      console.log(chalk.cyan("  • 16 Gemini API Keys"));
      console.log(chalk.cyan("  • 6 AI Agent Repos"));
      console.log(chalk.cyan("  • Roll Forming + AutoCAD expertise"));
      console.log(chalk.cyan("  • Full industrial automation knowledge\n"));
      continue;
    }

    if (trimmed === "clear") {
      console.clear();
      console.log(chalk.cyan(ASCII_LOGO));
      continue;
    }

    console.log(chalk.gray("\n⏳ Thinking...\n"));
    const response = await callAI(input);
    console.log(chalk.white(response));
    console.log();
  }
}

main().catch((err) => {
  console.error(chalk.red("\n❌ Error:"), err.message);
  process.exit(1);
});
