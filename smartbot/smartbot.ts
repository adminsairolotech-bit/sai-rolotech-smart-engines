/**
 * SMARTBOT - AI-Powered Telegram Bot
 * Uses Claude API for intelligent responses
 */

import { Telegraf, Context, Composer } from "telegraf";
import { Anthropic } from "@anthropic-ai/sdk";
import "dotenv/config";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// System prompt
const SYSTEM = `You are SmartBot - a helpful AI assistant. Be concise, friendly, and helpful. 
Answer in the same language the user uses. If they write in Hinglish/Hindi, respond in Hinglish.`;

// Track conversation history per user
const conversations = new Map<number, { role: "user" | "assistant"; content: string }[]>();

bot.start((ctx) => ctx.reply("🤖 SmartBot Online!\n\nI'm your AI assistant. Ask me anything!"));

bot.help((ctx) => ctx.reply(`Commands:
/start - Start bot
/clear - Clear chat history
/image [prompt] - Generate image
/search [query] - Web search

Or just chat with me!`));

bot.command("clear", (ctx) => {
  conversations.delete(ctx.from.id);
  ctx.reply("🧹 Chat cleared!");
});

bot.command("image", async (ctx) => {
  const prompt = ctx.message.text.replace("/image", "").trim();
  if (!prompt) { ctx.reply("Usage: /image [description]"); return; }
  ctx.reply("🎨 Generating image...");
  try {
    const response = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768`);
    await ctx.replyWithPhoto(response.url);
  } catch { ctx.reply("Image generation failed."); }
});

bot.command("search", async (ctx) => {
  const query = ctx.message.text.replace("/search", "").trim();
  if (!query) { ctx.reply("Usage: /search [query]"); return; }
  ctx.reply("🔍 Searching...");
  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
    const data = await response.json();
    const answer = data.AbstractText || data.Answer || "No results found.";
    ctx.reply(answer.substring(0, 4000));
  } catch { ctx.reply("Search failed."); }
});

bot.on("message", async (ctx) => {
  const text = (ctx.message as any)?.text;
  if (!text || text.startsWith("/")) return;

  ctx.reply("🤔 Thinking...");
  
  try {
    let history = conversations.get(ctx.from.id) || [];
    history.push({ role: "user", content: text });
    
    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      system: SYSTEM,
      messages: history.slice(-10)
    });
    
    const reply = response.content[0].type === "text" ? response.content[0].text : "Error";
    history.push({ role: "assistant", content: reply });
    conversations.set(ctx.from.id, history.slice(-20));
    
    await ctx.reply(reply);
  } catch (e: any) {
    await ctx.reply(`Error: ${e.message}`);
  }
});

console.log("🚀 SmartBot starting...");
bot.launch();
console.log("✅ SmartBot active!");

process.on("SIGINT", () => { bot.stop("SIGINT"); process.exit(); });
