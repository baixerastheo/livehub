import { test, expect } from "./fixtures";

test.describe("create server", () => {
  test("create server — appears in the server list", async ({
    loggedInPage: page,
  }) => {
    const serverName = `Test E2E ${Date.now()}`;

    await page.getByTestId("nav-add-server").click();
    await expect(page.getByTestId("create-server-name")).toBeVisible();

    await page.getByTestId("create-server-name").fill(serverName);
    await page.getByTestId("create-server-submit").click();

    await expect(page.getByRole("button", { name: serverName })).toBeVisible({
      timeout: 5000,
    });
  });

  test("create server — empty name shows an error", async ({
    loggedInPage: page,
  }) => {
    await page.getByTestId("nav-add-server").click();
    await page.getByTestId("create-server-submit").click();

    await expect(page.getByTestId("create-server-error")).toBeVisible();
  });
});
