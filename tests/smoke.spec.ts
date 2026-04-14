import { test, expect } from '@playwright/test';

/**
 * SAI ROLO TECH - SMOKE TESTS
 * Version: 1.0
 * Purpose: Verify CRM and Engine dashboards load correctly
 */

test.describe('SAI RoloTech CRM', () => {
  test('CRM loads at localhost:3000', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/SAI/i);
  });

  test('CRM has login form', async ({ page }) => {
    await page.goto('http://localhost:3000');
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("Log In")');
    await expect(loginButton.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('SAI RoloTech Engine', () => {
  test('Engine dashboard loads at localhost:3333', async ({ page }) => {
    await page.goto('http://localhost:3333');
    await expect(page).toHaveTitle(/SAI/i);
  });
});
