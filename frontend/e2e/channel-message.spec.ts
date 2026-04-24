import { test, expect } from "./fixtures";

test.describe("channel message", () => {
  test("send message in channel visible in conversation", async ({
    loggedInPage: page,
  }) => {
    const serverName = `E2E Server ${Date.now()}`;
    await page.getByTestId("nav-add-server").click();
    await page.getByTestId("create-server-name").fill(serverName);
    await page.getByTestId("create-server-submit").click();

    await page.getByRole("button", { name: serverName }).click();
    await page.getByTestId("channel-item").first().click();

    const messageText = `Message E2E ${Date.now()}`;
    await page.getByTestId("message-input").fill(messageText);
    await page.getByTestId("message-input").press("Enter");

    await expect(
      page.getByTestId("message-bubble").getByText(messageText),
    ).toBeVisible({ timeout: 10000 });
  });

  test("send empty message does not add a new bubble", async ({
    loggedInPage: page,
  }) => {
    const serverName = `E2E Server ${Date.now()}`;
    await page.getByTestId("nav-add-server").click();
    await page.getByTestId("create-server-name").fill(serverName);
    await page.getByTestId("create-server-submit").click();

    await page.getByRole("button", { name: serverName }).click();
    await page.getByTestId("channel-item").first().click();

    const messagesBefore = await page.getByTestId("message-bubble").count();
    await page.getByTestId("message-input").fill("   ");
    await page.getByTestId("message-input").press("Enter");

    await expect(page.getByTestId("message-bubble")).toHaveCount(
      messagesBefore,
    );
  });
});
