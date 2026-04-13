/**
 * SAI ROLOTECH SMART ENGINE - Main Entry Point
 * Complete AI Agent System with ALL Features
 */

import { Anthropic } from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { MultiAgentOrchestrator } from "./agents/orchestrator.js";
import { TelegramBot } from "./channels/telegram.js";
import { WhatsAppBot } from "./channels/whatsapp.js";
import { DiscordBot } from "./channels/discord.js";
import { BrowserAutomation } from "./tools/browser.js";
import { WebSearch } from "./tools/web-search.js";
import { ImageGenerator } from "./tools/image-gen.js";
import { VideoEditor } from "./video/editor.js";
import { VoiceSystem } from "./voice/tts.js";
import { AutoCADEngine } from "./autocad/engine.js";
import { PersistentMemory } from "./memory/persistent.js";
import { CronScheduler } from "./scheduler/cron.js";
import { SAIROLOTECH_KB } from "./knowledge/roll-forming.js";
import { AUTOCAD_KB } from "./knowledge/autocad.js";
import { VIDEO_KB } from "./knowledge/video-editing.js";
import chalk from "chalk";

dotenv.config();

// Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WHATSAPP_SESSION = process.env.WHATSAPP_SESSION_PATH;
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

class SAIROLOTECHEngine {
  public client: Anthropic;
  public orchestrator: MultiAgentOrchestrator;
  public telegram: TelegramBot | null = null;
  public whatsapp: WhatsAppBot | null = null;
  public discord: DiscordBot | null = null;
  public browser: BrowserAutomation;
  public webSearch: WebSearch;
  public imageGen: ImageGenerator;
  public videoEditor: VideoEditor;
  public voice: VoiceSystem;
  public autocad: AutoCADEngine;
  public memory: PersistentMemory;
  public scheduler: CronScheduler;

  constructor() {
    // Initialize Claude client
    this.client = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    // Initialize all systems
    this.orchestrator = new MultiAgentOrchestrator(this.client);
    this.browser = new BrowserAutomation();
    this.webSearch = new WebSearch();
    this.imageGen = new ImageGenerator();
    this.videoEditor = new VideoEditor();
    this.voice = new VoiceSystem();
    this.autocad = new AutoCADEngine();
    this.memory = new PersistentMemory();
    this.scheduler = new CronScheduler();

    this.log("SAI Rolotech Engine Initialized!", "success");
  }

  private log(message: string, type: "info" | "success" | "error" | "warn" = "info") {
    const prefix = {
      info: chalk.blue("[INFO]"),
      success: chalk.green("[SUCCESS]"),
      error: chalk.red("[ERROR]"),
      warn: chalk.yellow("[WARN]"),
    }[type];
    console.log(`${prefix} ${chalk.white(message)}`);
  }

  async start() {
    this.log("Starting SAI Rolotech Smart Engine...", "info");
    this.log("Loading Knowledge Bases...", "info");

    // Load knowledge bases
    await this.memory.loadKnowledge(SAIROLOTECH_KB);
    await this.memory.loadKnowledge(AUTOCAD_KB);
    await this.memory.loadKnowledge(VIDEO_KB);

    this.log("Knowledge Bases Loaded!", "success");

    // Initialize channels
    if (TELEGRAM_BOT_TOKEN) {
      this.telegram = new TelegramBot(TELEGRAM_BOT_TOKEN, this);
      await this.telegram.start();
      this.log("Telegram Bot Active!", "success");
    }

    if (WHATSAPP_SESSION) {
      this.whatsapp = new WhatsAppBot(WHATSAPP_SESSION, this);
      await this.whatsapp.start();
      this.log("WhatsApp Bot Active!", "success");
    }

    if (DISCORD_TOKEN) {
      this.discord = new DiscordBot(DISCORD_TOKEN, this);
      await this.discord.start();
      this.log("Discord Bot Active!", "success");
    }

    // Start scheduler
    await this.scheduler.start();

    this.log("=".repeat(50), "info");
    this.log("SAI ROLOTECH ENGINE - 100% OPERATIONAL", "success");
    this.log("=".repeat(50), "info");
    this.log("Available Channels: Telegram | WhatsApp | Discord | WebChat", "info");
    this.log("Available Tools: Browser | Search | Image | Video | Voice | AutoCAD", "info");
    this.log("Knowledge: Roll Forming | AutoCAD | Video Editing", "info");
    this.log("=".repeat(50), "info");
  }

  async processMessage(message: string, context?: any) {
    // Use multi-agent orchestrator
    return await this.orchestrator.route(message, context);
  }

  async shutdown() {
    this.log("Shutting down...", "warn");
    if (this.telegram) await this.telegram.stop();
    if (this.whatsapp) await this.whatsapp.stop();
    if (this.discord) await this.discord.stop();
    await this.scheduler.stop();
    this.log("Shutdown complete!", "success");
  }
}

// Start the engine
const engine = new SAIROLOTECHEngine();
engine.start().catch(console.error);

// Handle shutdown
process.on("SIGINT", async () => {
  await engine.shutdown();
  process.exit(0);
});

export { SAIROLOTECHEngine };
