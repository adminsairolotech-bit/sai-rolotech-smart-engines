import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 120000,
  workers: 1,
  reporter: "line",
  use: {
    browserName: "chromium",
    channel: "msedge",
    headless: true,
    viewport: { width: 1600, height: 1200 },
    screenshot: "off",
    video: "off",
    trace: "off",
  },
});
