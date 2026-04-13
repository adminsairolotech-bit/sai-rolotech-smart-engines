/**
 * BROWSER AUTOMATION (browser-use style)
 * AI-powered browser automation
 */

import puppeteer, { Browser, Page } from "puppeteer";

export class BrowserAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(headless = true) {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      this.page = await this.browser.newPage();
    }
    return this.page;
  }

  async open(url: string) {
    const page = await this.init();
    await page.goto(url, { waitUntil: "networkidle2" });
    return `Opened: ${url}`;
  }

  async screenshot(path = "screenshot.png") {
    const page = await this.init();
    await page.screenshot({ path });
    return `Screenshot saved: ${path}`;
  }

  async click(selector: string) {
    const page = await this.init();
    await page.click(selector);
    return `Clicked: ${selector}`;
  }

  async type(selector: string, text: string) {
    const page = await this.init();
    await page.type(selector, text);
    return `Typed "${text}" in ${selector}`;
  }

  async getState() {
    const page = await this.init();
    return await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("a, button, input, textarea, select"))
        .slice(0, 50)
        .map((el, i) => ({
          index: i,
          tag: el.tagName,
          text: el.innerText?.slice(0, 50) || "",
          id: el.id || "",
          class: el.className?.slice(0, 50) || "",
        }));
      return JSON.stringify(elements, null, 2);
    });
  }

  async execute(script: string) {
    const page = await this.init();
    return await page.evaluate(script);
  }

  async fillForm(data: Record<string, string>) {
    const page = await this.init();
    for (const [selector, value] of Object.entries(data)) {
      await page.type(selector, value);
    }
    return `Filled form with ${Object.keys(data).length} fields`;
  }

  async scrape(selector: string) {
    const page = await this.init();
    return await page.evaluate((sel: string) => {
      const elements = Array.from(document.querySelectorAll(sel));
      return elements.map(el => el.innerText).join("\n");
    }, selector);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
