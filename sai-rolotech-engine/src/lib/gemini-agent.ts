/**
 * GEMINI AGENT
 * Uses the Gemini API with rotated keys from the balancer.
 */

import axios from "axios";
import { geminiBalancer } from "./gemini-balancer.js";
import chalk from "chalk";

export class GeminiAgent {
  private model: string = "gemini-2.0-flash";

  /**
   * Generates a completion using Gemini with a rotated key.
   */
  async generate(prompt: string, systemInstruction?: string): Promise<string> {
    const apiKey = geminiBalancer.getNextKey();
    if (!apiKey) {
      throw new Error("No Gemini API keys available.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;

    const data = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      system_instruction: systemInstruction ? {
        parts: [{ text: systemInstruction }]
      } : undefined,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      }
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      const text = response.data.candidates[0].content.parts[0].text;
      return text;
    } catch (error: any) {
      console.error(chalk.red(`[ERROR] Gemini Key failed: ${error.message}`));

      // If rate limited, try one more time with a different key
      if (error.response?.status === 429) {
        console.log(chalk.yellow("[WARN] Rate limited. Retrying with next key..."));
        return this.generate(prompt, systemInstruction);
      }

      throw error;
    }
  }
}

export const geminiAgent = new GeminiAgent();
