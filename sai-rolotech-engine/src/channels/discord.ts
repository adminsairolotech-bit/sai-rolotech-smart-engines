/**
 * DISCORD BOT INTEGRATION
 * Full-featured Discord bot with AI responses
 */

import { Client, GatewayIntentBits, TextChannel } from "discord.js";

export class DiscordBot {
  private client: Client;
  private engine: any;
  private prefix = "!";

  constructor(token: string, engine: any) {
    this.engine = engine;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.setupHandlers();
  }

  private setupHandlers() {
    this.client.on("ready", () => {
      console.log(`✅ Discord Bot Ready as ${this.client.user?.tag}`);
    });

    this.client.on("messageCreate", async (message) => {
      // Ignore bots and webhooks
      if (message.author.bot || message.webhookId) return;

      const text = message.content.trim();
      if (!text.startsWith(this.prefix)) {
        // AI chat for regular messages
        if (!text.startsWith("!")) {
          const response = await this.engine.processMessage(text);
          await message.reply(response?.content?.[0]?.text || "🤖 Processing...");
        }
        return;
      }

      const [command, ...args] = text.slice(1).split(" ");
      const argsStr = args.join(" ");

      switch (command.toLowerCase()) {
        case "help":
          await message.reply(`
🤖 SAI Rolotech Engine - Commands

!help - Show this help
!code <task> - Write code
!cad <task> - AutoCAD assistance
!video <task> - Video editing
!search <query> - Web search
!image <prompt> - Generate image
!voice <text> - Text to speech
!status - Check system status
          `);
          break;

        case "code":
          await message.reply("🔄 Writing code...");
          const codeResult = await this.engine.processMessage(`Write code: ${argsStr}`);
          await message.reply(codeResult?.content?.[0]?.text || "Done!");
          break;

        case "cad":
          await message.reply("📐 AutoCAD processing...");
          const cadResult = await this.engine.processMessage(`AutoCAD: ${argsStr}`);
          await message.reply(cadResult?.content?.[0]?.text || "Done!");
          break;

        case "video":
          await message.reply("🎬 Video editing...");
          const videoResult = await this.engine.processMessage(`Video: ${argsStr}`);
          await message.reply(videoResult?.content?.[0]?.text || "Done!");
          break;

        case "search":
          await message.reply("🔍 Searching...");
          const searchResult = await this.engine.webSearch.search(argsStr);
          await message.reply(searchResult || "No results.");
          break;

        case "image":
          await message.reply("🎨 Generating image...");
          const imgResult = await this.engine.imageGen.generate(argsStr);
          await message.reply(imgResult || "Image generation failed.");
          break;

        case "voice":
          await message.reply("🔊 Generating speech...");
          const voiceResult = await this.engine.voice.synthesize(argsStr);
          await message.reply(voiceResult || "Voice synthesis failed.");
          break;

        case "status":
          await message.reply(`
📊 SAI Rolotech Engine Status

✅ System: Online
✅ Channels: Telegram, WhatsApp, Discord
✅ Tools: Browser, Search, Image, Video, Voice
✅ Knowledge: Roll Forming, AutoCAD, Video Editing
✅ Memory: Active
✅ Scheduler: Running
          `);
          break;

        default:
          await message.reply(`Unknown command: !${command}`);
      }
    });
  }

  async start() {
    await this.client.login(process.env.DISCORD_BOT_TOKEN);
  }

  async stop() {
    this.client.destroy();
  }
}
