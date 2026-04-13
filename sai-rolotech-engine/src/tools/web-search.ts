/**
 * WEB SEARCH - Multiple Providers
 * Tavily, Brave, DuckDuckGo, Perplexity
 */

import axios from "axios";

interface SearchProvider {
  name: string;
  search: (query: string) => Promise<string>;
}

export class WebSearch {
  private providers: SearchProvider[] = [];
  private activeProvider = 0;

  constructor() {
    this.initProviders();
  }

  private initProviders() {
    // Tavily Search
    this.providers.push({
      name: "Tavily",
      search: async (query: string) => {
        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) return "Tavily API key not set";

        try {
          const res = await axios.post(
            "https://api.tavily.com/search",
            { query, max_results: 5 },
            { headers: { Authorization: `Bearer ${apiKey}` } }
          );
          return res.data.results?.map((r: any) => r.content).join("\n\n") || "No results";
        } catch {
          return "Tavily search failed";
        }
      },
    });

    // Brave Search
    this.providers.push({
      name: "Brave",
      search: async (query: string) => {
        const apiKey = process.env.BRAVE_API_KEY;
        if (!apiKey) return "Brave API key not set";

        try {
          const res = await axios.get("https://api.search.brave.com/res/v1/search", {
            params: { q: query, count: 5 },
            headers: { "X-Subscription-Token": apiKey },
          });
          return res.data.results?.map((r: any) => r.snippet).join("\n\n") || "No results";
        } catch {
          return "Brave search failed";
        }
      },
    });

    // DuckDuckGo (via HTML scrape)
    this.providers.push({
      name: "DuckDuckGo",
      search: async (query: string) => {
        try {
          const res = await axios.get("https://html.duckduckgo.com/html/", {
            params: { q: query },
          });
          const cheerio = require("cheerio");
          const $ = cheerio.load(res.data);
          const results = $(".result__snippet")
            .map((_: any, el: any) => $(el).text())
            .get()
            .slice(0, 5);
          return results.join("\n\n") || "No results";
        } catch {
          return "DuckDuckGo search failed";
        }
      },
    });

    // Ollama Web Search (local)
    this.providers.push({
      name: "Ollama",
      search: async (query: string) => {
        const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
        try {
          const res = await axios.post(
            `${baseUrl}/api/search`,
            { query },
            { timeout: 10000 }
          );
          return res.data?.content || "No results";
        } catch {
          return "Ollama search not available";
        }
      },
    });
  }

  async search(query: string, provider?: string) {
    if (provider) {
      const p = this.providers.find(pr => pr.name.toLowerCase() === provider.toLowerCase());
      if (p) return await p.search(query);
      return `Provider ${provider} not found. Available: ${this.providers.map(p => p.name).join(", ")}`;
    }

    // Try next provider on failure
    for (let i = 0; i < this.providers.length; i++) {
      const result = await this.providers[this.activeProvider].search(query);
      if (!result.includes("not set") && !result.includes("failed") && !result.includes("not available")) {
        return result;
      }
      this.activeProvider = (this.activeProvider + 1) % this.providers.length;
    }

    return "All search providers failed";
  }

  async searchAll(query: string) {
    const results: Record<string, string> = {};
    for (const provider of this.providers) {
      results[provider.name] = await provider.search(query);
    }
    return JSON.stringify(results, null, 2);
  }
}
