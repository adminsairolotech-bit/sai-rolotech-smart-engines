import { test, expect } from "playwright/test";
import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const proofDir = path.join(repoRoot, "artifacts", "runtime-proof");
const dxfPath = path.join(repoRoot, ".codex", "reports", "runtime-proof-inch-u-channel.dxf");

test("partial engineering input is blocked visibly in the /python DXF flow", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.stack || error.message);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto("http://localhost:5000/python", { waitUntil: "networkidle" });

  const pinInputs = page.locator('input[type="password"]');
  await expect(pinInputs).toHaveCount(4);
  await pinInputs.nth(0).fill("1");
  await pinInputs.nth(1).fill("1");
  await pinInputs.nth(2).fill("6");
  await pinInputs.nth(3).fill("4");

  await expect(page.getByText("DXF Upload")).toBeVisible({ timeout: 30000 });
  await page.locator('input[type="file"]').setInputFiles(dxfPath);
  await page.getByRole("button", { name: "Preview DXF" }).click();
  await expect(page.getByText("Import Units")).toBeVisible({ timeout: 30000 });

  const thicknessInput = page.locator('input[type="number"]').first();
  await thicknessInput.fill("0");
  await page.getByRole("button", { name: "Run Full Engineering Analysis" }).click();

  await expect(page.getByText("Thickness must be a positive number")).toBeVisible({ timeout: 30000 });
  const bodyText = await page.locator("body").innerText();

  const proof = {
    route: "/python",
    dxfPath,
    invalidThicknessErrorVisible: bodyText.includes("Thickness must be a positive number"),
    pipelineStatusVisible: bodyText.includes("Pipeline Status"),
    finalDecisionVisible: bodyText.includes("ACCURACY CONTROL SYSTEM"),
    pageErrorCount: pageErrors.length,
    consoleErrorCount: consoleErrors.length,
  };

  fs.writeFileSync(path.join(proofDir, "browser-negative-proof.json"), JSON.stringify(proof, null, 2), "utf8");
  fs.writeFileSync(path.join(proofDir, "browser-negative-errors.json"), JSON.stringify({ pageErrors, consoleErrors }, null, 2), "utf8");
  fs.writeFileSync(path.join(proofDir, "browser-negative-body.txt"), bodyText, "utf8");
  await page.screenshot({ path: path.join(proofDir, "browser-negative-partial-input.png"), fullPage: true });
});
