import { test, expect } from "./fixtures";

const PEER_USER_ID =
  process.env.E2E_PEER_USER2_ID ?? process.env.E2E_PEER_USER_ID ?? "";

test.describe("private message", () => {
  test("send private message — visible in conversation", async ({
    loggedInPage: page,
  }) => {
    await page.goto(`/messages?with=${PEER_USER_ID}`);
    await page.getByTestId("message-input").waitFor({ state: "visible" });
    await page.waitForLoadState("networkidle");

    const messageText = `DM E2E ${Date.now()}`;
    await page.getByTestId("message-input").fill(messageText);
    await page.getByTestId("message-input").press("Enter");

    await expect(
      page.getByTestId("message-bubble").getByText(messageText).first(),
    ).toBeVisible({
      timeout: 15000,
    });
  });
});
