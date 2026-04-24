import { test as base, type Page } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_EMAIL ?? "test@livehub.com";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "password123";

export async function login(page: Page) {
  await page.goto("/");
  await page.getByTestId("home-signin-btn").click();
  await page.getByTestId("login-email").fill(E2E_EMAIL);
  await page.getByTestId("login-password").fill(E2E_PASSWORD);
  await page.getByTestId("login-submit").click();
  await page.getByTestId("login-submit").waitFor({ state: "hidden", timeout: 15000 });
  await page.getByTestId("nav-add-server").waitFor({ state: "visible", timeout: 10000 });
}

export const test = base.extend<{ loggedInPage: Page }>({
  // eslint-disable-next-line react-hooks/rules-of-hooks
  loggedInPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
