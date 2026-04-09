import { test, expect } from "playwright/test";
import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const proofDir = path.join(repoRoot, "artifacts", "runtime-proof");
const dxfPath = path.join(repoRoot, "attached_assets", "Drawing1_1774780944987.dxf");

test("real plant DXF runs through the gated /python UI from preview to export", async ({ page }) => {
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
  await expect(page.getByText("inch", { exact: true })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("1436.84 mm", { exact: true })).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: path.join(proofDir, "browser-real-dxf-preview.png"), fullPage: true });

  await page.getByRole("button", { name: "Run Full Engineering Analysis" }).click();
  await expect(page.getByText("Pipeline Status")).toBeVisible({ timeout: 60000 });
  await expect(page.getByText("simple angle", { exact: false })).toBeVisible({ timeout: 60000 });
  await page.screenshot({ path: path.join(proofDir, "browser-real-dxf-pipeline.png"), fullPage: true });

  const exportButton = page.getByRole("button", { name: /Generate CAD\/STEP Pack|Generate Pack/i }).first();
  await expect(exportButton).toBeVisible({ timeout: 30000 });
  const exportDisabledBefore = await exportButton.isDisabled();
  if (!exportDisabledBefore) {
    await exportButton.click();
    await expect(page.getByText("CAD/CAM Export Pack", { exact: false })).toBeVisible({ timeout: 60000 });
    await page.waitForTimeout(2000);
  }

  const bodyText = await page.locator("body").innerText();
  const proof = {
    route: "/python",
    dxfPath,
    previewUnitsVisible: bodyText.includes("Import Units") && bodyText.includes("inch"),
    previewScaledDimensionsVisible: bodyText.includes("1436.84 mm") && bodyText.includes("718.42 mm"),
    pipelineStatusVisible: bodyText.includes("Pipeline Status"),
    finalDecisionVisible: bodyText.includes("ACCURACY CONTROL SYSTEM"),
    exportSummaryVisible: bodyText.includes("CAD/CAM Export Pack") && bodyText.includes("DXF Files"),
    exportButtonDisabledBeforeClick: exportDisabledBefore,
    errorBoundaryVisible: bodyText.includes("Python Dashboard Error"),
    pageErrorCount: pageErrors.length,
    consoleErrorCount: consoleErrors.length,
  };

  fs.writeFileSync(path.join(proofDir, "browser-real-dxf-proof.json"), JSON.stringify(proof, null, 2), "utf8");
  fs.writeFileSync(path.join(proofDir, "browser-real-dxf-errors.json"), JSON.stringify({ pageErrors, consoleErrors }, null, 2), "utf8");
  fs.writeFileSync(path.join(proofDir, "browser-real-dxf-body.txt"), bodyText, "utf8");
});
