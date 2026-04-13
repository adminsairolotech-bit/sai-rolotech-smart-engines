/**
 * MULTI-KEY GEMINI BALANCER
 * Rotates between multiple Gemini API keys to avoid rate limits.
 */

import chalk from "chalk";

export class GeminiKeyManager {
  private keys: string[] = [];
  private currentIndex: number = 0;

  constructor() {
    this.loadKeys();
  }

  private loadKeys() {
    const rawKeys = process.env.GEMINI_API_KEYS;
    if (rawKeys) {
      this.keys = rawKeys.split(",").map(k => k.trim()).filter(Boolean);
    } else {
      // Fallback to individual keys if list is missing
      for (let i = 1; i <= 10; i++) {
        const key = process.env[`GEMINI_KEY_${i}`];
        if (key) this.keys.push(key);
      }
    }

    if (this.keys.length === 0) {
      console.warn(chalk.yellow("[WARN] No Gemini API keys found in environment."));
    } else {
      console.log(chalk.green(`[INFO] Gemini Balancer loaded ${this.keys.length} keys.`));
    }
  }

  /**
   * Returns the next available API key in the rotation.
   */
  public getNextKey(): string {
    if (this.keys.length === 0) return "";
    
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    
    console.log(chalk.blue(`[BALANCER] Using Gemini Key #${this.currentIndex + 1} (Rotation)`));
    return key;
  }

  /**
   * Returns all keys as an array.
   */
  public getAllKeys(): string[] {
    return [...this.keys];
  }
}

export const geminiBalancer = new GeminiKeyManager();
