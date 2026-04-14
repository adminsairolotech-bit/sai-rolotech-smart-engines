/**
 * AI Module - Ollama Integration
 * Uses local Ollama for offline AI
 */

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "sairolotech-expert";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export const aiChat = {
  async ask(prompt: string, context?: string, history: Message[] = []): Promise<string> {
    const systemPrompt = `You are "MASTER" - a universal AI agent for a laptop.
You can:
- Execute commands
- Write code
- Control system
- Manage files
- Answer questions

Always be helpful and concise.`;

    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: context ? `${context}\n\n${prompt}` : prompt }
    ];

    try {
      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const data = await response.json();
      return data.message?.content || "No response from AI";
    } catch (error: any) {
      // Fallback to simpler model
      try {
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama3.2:3b",
            messages,
            stream: false
          })
        });
        const data = await response.json();
        return data.message?.content || "AI error";
      } catch {
        return `AI Error: ${error.message}`;
      }
    }
  },

  async generate(prompt: string, history: Message[] = [], language?: string): Promise<string> {
    const codePrompt = language
      ? `Write ${language} code for: ${prompt}\n\nOnly output the code, no explanation.`
      : `Write code for: ${prompt}\n\nOnly output the code, no explanation.`;

    const messages: Message[] = [
      { role: "system", content: "You are a code generator. Only output code, no markdown, no explanation." },
      ...history,
      { role: "user", content: codePrompt }
    ];

    try {
      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "codellama:7b",
          messages,
          stream: false
        })
      });

      if (!response.ok) throw new Error("Code generation failed");
      const data = await response.json();

      let code = data.message?.content || "";
      // Remove markdown code blocks
      code = code.replace(/```[\w]*\n?/g, "").trim();
      return code;
    } catch (error: any) {
      return `Code generation error: ${error.message}`;
    }
  },

  async checkStatus() {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        return {
          available: true,
          models: data.models?.map((m: any) => m.name) || [],
          default: DEFAULT_MODEL
        };
      }
      return { available: false, models: [], default: DEFAULT_MODEL };
    } catch {
      return { available: false, models: [], default: DEFAULT_MODEL };
    }
  }
};
