/**
 * IMAGE GENERATION
 * DALL-E, Stable Diffusion, Fireworks AI
 */

import { OpenAI } from "openai";

export class ImageGenerator {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }

  async generate(prompt: string, size: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024") {
    // Try DALL-E 3 first
    try {
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size,
        response_format: "url",
      });
      return {
        url: response.data[0].url,
        revised_prompt: response.data[0].revised_prompt,
      };
    } catch {
      // Fallback to DALL-E 2
      try {
        const response = await this.openai.images.generate({
          model: "dall-e-2",
          prompt,
          n: 1,
          size,
          response_format: "url",
        });
        return { url: response.data[0].url };
      } catch {
        // Fallback to Fireworks AI
        return await this.fireworksGenerate(prompt);
      }
    }
  }

  async generateVariation(imageUrl: string) {
    try {
      const response = await this.openai.images.generate({
        model: "dall-e-2",
        prompt: "Create a variation of this image",
        n: 1,
        size: "1024x1024",
        response_format: "url",
      });
      return { url: response.data[0].url };
    } catch {
      return { error: "Variation generation failed" };
    }
  }

  async edit(imageUrl: string, mask: string, prompt: string) {
    try {
      const response = await this.openai.images.generate({
        model: "dall-e-2",
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "url",
      });
      return { url: response.data[0].url };
    } catch {
      return { error: "Image edit failed" };
    }
  }

  private async fireworksGenerate(prompt: string) {
    const apiKey = process.env.FIREWORKS_API_KEY;
    if (!apiKey) {
      return { error: "No image generation API available" };
    }

    try {
      const res = await fetch("https://api.fireworks.ai/inference/v1/images/text_to_image", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "accounts/fireworks/models/sdxl-turbo",
          prompt,
          num_images: 1,
        }),
      });
      const data = await res.json();
      return { url: data.images?.[0]?.url };
    } catch {
      return { error: "Fireworks generation failed" };
    }
  }
}
