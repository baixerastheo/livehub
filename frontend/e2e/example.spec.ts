import { test, expect } from "@playwright/test";

test("homepage loads correctly", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Create Next App/);
});

test("navigation works", async ({ page }) => {
  await page.goto("/");
  // Ajoutez vos tests ici
});

