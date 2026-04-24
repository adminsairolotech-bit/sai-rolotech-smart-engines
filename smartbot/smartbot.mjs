/**
 * SMARTBOT - AI Telegram Bot
 */
import { Telegraf } from "telegraf";
import { Anthropic } from "@anthropic-ai/sdk";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are SmartBot - a helpful, friendly AI assistant.
Be concise. Respond in the user's language (English/Hinglish/Hindi).`;

bot.start(ctx => ctx.reply("🤖 SmartBot Online!\n\nAsk me anything!"));
bot.help(ctx => ctx.reply("Commands:\n/start - Start\n/clear - Clear chat\n/search [query] - Search\nJust chat with me!"));

bot.command("clear", ctx => ctx.reply("✅ Chat history cleared!"));

bot.command("search", async ctx => {
  const query = ctx.message.text.replace("/search", "").trim();
  if (!query) { ctx.reply("Usage: /search [query]"); return; }
  await ctx.reply("🔍 Searching...");
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
    const data = await res.json();
    const answer = data.AbstractText || data.Answer || "No results.";
    ctx.reply(answer.substring(0, 4000));
  } catch { ctx.reply("Search failed."); }
});

bot.on("message", async ctx => {
  const text = ctx.message?.text;
  if (!text || text.startsWith("/")) return;

  await ctx.reply("🤔 Thinking...");
  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }]
    });
    await ctx.reply(msg.content[0].text);
  } catch (e) {
    await ctx.reply(`❌ Error: ${e.message}`);
  }
});

bot.launch();
console.log("🚀 SmartBot Active!");
