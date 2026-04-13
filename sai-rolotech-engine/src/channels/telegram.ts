/**
 * TELEGRAM BOT INTEGRATION
 * Full-featured Telegram bot with AI responses
 */

import { Telegraf, Context } from "telegraf";

export class TelegramBot {
  private bot: Telegraf;
  private engine: any;

  constructor(token: string, engine: any) {
    this.bot = new Telegraf(token);
    this.engine = engine;
    this.setupHandlers();
  }

  private setupHandlers() {
    // Start command
    this.bot.start((ctx: Context) => {
      ctx.reply("🤖 SAI Rolotech Engine Online!\n\nI am your AI assistant. Ask me anything!");
    });

    // Help command
    this.bot.help((ctx: Context) => {
      ctx.reply(`
📚 SAI Rolotech Engine Commands:

/start - Start the bot
/help - Show this help
/code - Write code
/cad - AutoCAD assistance
/video - Video editing help
/search - Search the web
/image - Generate images
/voice - Text to speech

Just send any message to chat with me!
      `);
    });

    // Code command
    this.bot.command("code", async (ctx: Context) => {
      const task = ctx.message.text.replace("/code", "").trim();
      if (!task) {
        ctx.reply("Usage: /code [your coding task]");
        return;
      }
      ctx.reply("🔄 Processing your code request...");
      const result = await this.engine.processMessage(`Write code: ${task}`);
      ctx.reply(result?.content?.[0]?.text || "Done!");
    });

    // CAD command
    this.bot.command("cad", async (ctx: Context) => {
      const task = ctx.message.text.replace("/cad", "").trim();
      if (!task) {
        ctx.reply("Usage: /cad [AutoCAD task]\nExample: /cad Draw a 100x50 rectangle");
        return;
      }
      ctx.reply("🔄 Processing AutoCAD command...");
      const result = await this.engine.processMessage(`AutoCAD: ${task}`);
      ctx.reply(result?.content?.[0]?.text || "Done!");
    });

    // Video command
    this.bot.command("video", async (ctx: Context) => {
      const task = ctx.message.text.replace("/video", "").trim();
      ctx.reply("🎬 Processing video editing request...");
      const result = await this.engine.processMessage(`Video editing: ${task}`);
      ctx.reply(result?.content?.[0]?.text || "Done!");
    });

    // Search command
    this.bot.command("search", async (ctx: Context) => {
      const query = ctx.message.text.replace("/search", "").trim();
      if (!query) {
        ctx.reply("Usage: /search [your query]");
        return;
      }
      ctx.reply("🔍 Searching...");
      const result = await this.engine.webSearch.search(query);
      ctx.reply(result || "No results found.");
    });

    // Image command
    this.bot.command("image", async (ctx: Context) => {
      const prompt = ctx.message.text.replace("/image", "").trim();
      if (!prompt) {
        ctx.reply("Usage: /image [description]");
        return;
      }
      ctx.reply("🎨 Generating image...");
      const result = await this.engine.imageGen.generate(prompt);
      if (result?.url) {
        ctx.replyWithPhoto(result.url);
      } else {
        ctx.reply(result || "Image generation failed.");
      }
    });

    // Voice command
    this.bot.command("voice", async (ctx: Context) => {
      const text = ctx.message.text.replace("/voice", "").trim();
      if (!text) {
        ctx.reply("Usage: /voice [text to speak]");
        return;
      }
      ctx.reply("🔊 Generating speech...");
      const result = await this.engine.voice.synthesize(text);
      if (result?.path) {
        ctx.replyWithAudio({ source: result.path });
      } else {
        ctx.reply("Voice synthesis failed.");
      }
    });

    // Message handler
    this.bot.on("message", async (ctx: Context) => {
      const message = (ctx.message as any)?.text;
      if (!message || message.startsWith("/")) return;

      ctx.reply("🤖 Thinking...");
      const result = await this.engine.processMessage(message);
      ctx.reply(result?.content?.[0]?.text || "I'm not sure how to respond to that.");
    });
  }

  async start() {
    await this.bot.launch();
    console.log("Telegram bot started!");
  }

  async stop() {
    this.bot.stop();
  }
}
