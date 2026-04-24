import { getVoiceToken } from "../voice.service";

jest.mock("@/src/lib/apiClient", () => ({
  fetchJson: jest.fn(),
}));

import { fetchJson } from "@/src/lib/apiClient";
const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

beforeEach(() => {
  mockFetchJson.mockReset();
});

describe("getVoiceToken", () => {
  it("calls POST /voice/token with the channelId", async () => {
    mockFetchJson.mockResolvedValue({ token: "lk-token", url: "wss://livekit.example.com" });
    await getVoiceToken(5);
    expect(mockFetchJson).toHaveBeenCalledWith("/voice/token", {
      method: "POST",
      body: { channelId: 5 },
    });
  });

  it("returns the token and url", async () => {
    const response = { token: "lk-token-abc", url: "wss://example.com" };
    mockFetchJson.mockResolvedValue(response);
    expect(await getVoiceToken(10)).toEqual(response);
  });
});
