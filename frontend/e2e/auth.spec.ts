import { test, expect } from "./fixtures";

test.describe("auth", () => {
  test("redirects to app after successful authentication", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("home-signin-btn").click();

    await expect(page.getByTestId("login-email")).toBeVisible();
    await expect(page.getByTestId("login-password")).toBeVisible();

    await page
      .getByTestId("login-email")
      .fill(process.env.E2E_EMAIL ?? "test@livehub.com");
    await page
      .getByTestId("login-password")
      .fill(process.env.E2E_PASSWORD ?? "password123");
    await page.getByTestId("login-submit").click();

    await expect(page.getByTestId("nav-add-server")).toBeVisible({
      timeout: 15000,
    });
  });

  test("shows error with wrong credentials", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("home-signin-btn").click();
    await page.getByTestId("login-email").fill("wrong@email.com");
    await page.getByTestId("login-password").fill("wrongpassword");
    await page.getByTestId("login-submit").click();

    await expect(page.getByTestId("login-error")).toBeVisible();
  });

  test("creates account and grants access to app", async ({ page }) => {
    const unique = Date.now();
    await page.goto("/");
    await page.getByTestId("home-signup-btn").click();

    await page.getByTestId("register-username").fill(`testuser${unique}`);
    await page.getByTestId("register-email").fill(`testuser${unique}@e2e.com`);
    await page.getByTestId("register-password").fill("Password123!");
    await page.getByTestId("register-confirm-password").fill("Password123!");
    await page.getByTestId("register-submit").click();

    await page
      .getByTestId("login-submit")
      .waitFor({ state: "hidden", timeout: 15000 });
    await expect(page.getByTestId("nav-add-server")).toBeVisible({
      timeout: 10000,
    });
  });
});
