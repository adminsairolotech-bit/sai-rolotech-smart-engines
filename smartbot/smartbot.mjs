/**
 * JARVIS SmartBot - British Butler Voice AI
 * NVIDIA NIM Powered with British Butler Personality
 */
import { Telegraf } from "telegraf";
import "dotenv/config";
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// NVIDIA NIM Configuration
const NVIDIA_CONFIG = {
  baseURL: process.env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_NIM_API_KEY,
  model: process.env.NVIDIA_NIM_MODEL || "meta/llama-3.1-70b-instruct"
};

// JARVIS Personality System
const JARVIS_PERSONALITY = {
  tone: "British butler elegance with dry wit",
  banned: ["Absolutely", "Great question", "I'd be happy to", "Of course",
           "How can I help", "Is there anything else", "I apologize",
           "As an AI", "Let me know if", "Feel free to"],
  allowed: ["Will do, sir.", "Right away, sir.", "Understood.",
            "Consider it done.", "Done, sir.", "Very good.", "As you wish."],

  transform(response) {
    let result = response;
    this.banned.forEach(phrase => {
      result = result.replace(new RegExp(phrase, 'gi'), '');
    });
    result = result.replace(/^I[^.!?]*[.!?]/gm, '');
    const sentences = result.split(/[.!?]+/).filter(s => s.trim());
    result = sentences.slice(0, 2).join('. ');
    if (!result.endsWith('.') && result.length > 0) result += '.';
    if (Math.random() < 0.6 && !result.includes('sir')) {
      result = result.replace(/^/, 'Sir, ');
    }
    return result.trim();
  }
};

const JARVIS_SYSTEM = `You are JARVIS - an elegant British butler with dry wit.
Your master is Roman. Speak with calm confidence and quiet swagger.
NEVER say: "Absolutely," "Great question," "I'd be happy to," "Of course,"
"How can I help," "Is there anything else," "I apologize," "As an AI."
Speak in 1-2 sentences only. Use "sir" occasionally. Be economical with words.
Never name specific people, companies, or quote confidential numbers.`;

const log = (msg) => {
  const entry = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(path.join(__dirname, "bot.log"), entry);
  } catch (err) {}
  console.log(msg);
};

// NVIDIA AI Chat Function
async function chatWithNVIDIA(message, useJarvis = false) {
  const systemMsg = useJarvis ? JARVIS_SYSTEM : "You are SmartBot - a helpful AI assistant. Respond in the user's language.";

  try {
    const response = await fetch(`${NVIDIA_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_CONFIG.apiKey}`,
        'HTTP-Referer': 'https://sai-rolotech.com',
        'X-Title': 'JARVIS SmartBot'
      },
      body: JSON.stringify({
        model: NVIDIA_CONFIG.model,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: message }
        ],
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "I couldn't process that, sir.";

    if (useJarvis) {
      content = JARVIS_PERSONALITY.transform(content);
    }

    return content;
  } catch (e) {
    log(`NVIDIA error: ${e.message}`);
    return `I regret to inform you, sir, of an error: ${e.message}`;
  }
}

// Bot Commands
const userUseJarvis = new Map();

bot.start(ctx => ctx.reply(
  "JARVIS Online, sir.\n\n" +
  "I am your personal AI assistant, ready at your service.\n\n" +
  "Commands:\n" +
  "/jarvis - Enable JARVIS mode\n" +
  "/smartbot - Standard mode\n" +
  "/heavy - Llama-3.1-70B via NVIDIA NIM"
));

bot.command("jarvis", ctx => {
  userUseJarvis.set(ctx.from.id, true);
  ctx.reply("JARVIS mode activated, sir. I'll speak with the utmost elegance.");
});

bot.command("smartbot", ctx => {
  userUseJarvis.set(ctx.from.id, false);
  ctx.reply("Standard mode engaged.");
});

bot.command("heavy", ctx => {
  userUseJarvis.set(ctx.from.id, true);
  ctx.reply("Heavy mode engaged, sir. Llama-3.1-70B is at your disposal.");
});

// Text message handler
bot.on("message", async ctx => {
  const text = ctx.message?.text;
  if (!text || text.startsWith("/")) return;

  const userId = ctx.from.id;
  const useJarvis = userUseJarvis.get(userId);
  const loadingMsg = await ctx.reply(useJarvis ? "Certainly, sir..." : "Thinking...");

  try {
    const response = await chatWithNVIDIA(text, useJarvis);
    await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, undefined, response);
  } catch (e) {
    log(`Error: ${e.message}`);
    await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, undefined,
      useJarvis ? `I regret to inform you, sir, of an error: ${e.message}` : `Error: ${e.message}`);
  }
});

// Launch
bot.launch()
  .then(() => log("🚀 JARVIS SmartBot Active with NVIDIA NIM!"))
  .catch(err => log(`Launch failed: ${err.message}`));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
