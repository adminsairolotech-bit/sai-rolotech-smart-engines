/**
 * WHATSAPP BOT INTEGRATION
 * Full-featured WhatsApp bot with AI responses
 */

import { Client, LocalAuth, Message } from "whatsapp-web.js";

export class WhatsAppBot {
  private client: Client;
  private engine: any;
  private sessionPath: string;

  constructor(sessionPath: string, engine: any) {
    this.sessionPath = sessionPath;
    this.engine = engine;
    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: sessionPath }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });
    this.setupHandlers();
  }

  private setupHandlers() {
    this.client.on("qr", (qr: string) => {
      console.log("📱 WhatsApp QR Code:", qr);
    });

    this.client.on("ready", () => {
      console.log("✅ WhatsApp Bot Ready!");
    });

    this.client.on("message", async (message: Message) => {
      const text = message.body.toLowerCase().trim();

      // Ignore group messages unless mentioned
      if (message.from.includes("@g.us") && !text.includes("@")) return;

      // Handle commands
      if (text.startsWith("!")) {
        const command = text.slice(1).split(" ")[0];
        const args = text.slice(1).split(" ").slice(1).join(" ");
        await this.handleCommand(message, command, args);
        return;
      }

      // AI response
      await message.reply("🤖 Thinking...");
      const result = await this.engine.processMessage(message.body);
      await message.reply(result?.content?.[0]?.text || "I'm processing your request...");
    });

    this.client.on("disconnected", () => {
      console.log("⚠️ WhatsApp disconnected. Restarting...");
      this.client.initialize();
    });
  }

  private async handleCommand(message: Message, command: string, args: string) {
    switch (command) {
      case "code":
        await message.reply("🔄 Writing code...");
        const codeResult = await this.engine.processMessage(`Write code: ${args}`);
        await message.reply(codeResult?.content?.[0]?.text || "Done!");
        break;

      case "search":
        await message.reply("🔍 Searching...");
        const searchResult = await this.engine.webSearch.search(args);
        await message.reply(searchResult || "No results.");
        break;

      case "image":
        await message.reply("🎨 Generating image...");
        const imgResult = await this.engine.imageGen.generate(args);
        if (imgResult?.base64) {
          await message.reply(await this.engine.client.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 1024,
            messages: [{ role: "user", content: "Return this image to the user" }]
          }));
        } else {
          await message.reply(imgResult || "Image generation failed.");
        }
        break;

      case "cad":
        await message.reply("📐 Processing AutoCAD command...");
        const cadResult = await this.engine.processMessage(`AutoCAD: ${args}`);
        await message.reply(cadResult?.content?.[0]?.text || "Done!");
        break;

      case "video":
        await message.reply("🎬 Processing video edit...");
        const videoResult = await this.engine.processMessage(`Video: ${args}`);
        await message.reply(videoResult?.content?.[0]?.text || "Done!");
        break;

      default:
        await message.reply(`Unknown command: !${command}\nTry: !code, !search, !image, !cad, !video`);
    }
  }

  async start() {
    await this.client.initialize();
  }

  async stop() {
    await this.client.destroy();
  }
}
