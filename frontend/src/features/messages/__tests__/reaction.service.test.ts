import { toggleChannelReaction, togglePrivateReaction } from "../reaction.service";

jest.mock("@/src/lib/apiClient", () => ({
  fetchJson: jest.fn(),
}));

import { fetchJson } from "@/src/lib/apiClient";
const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

beforeEach(() => {
  mockFetchJson.mockReset();
});

describe("toggleChannelReaction", () => {
  it("calls POST on the channel reactions endpoint", async () => {
    mockFetchJson.mockResolvedValue([]);
    await toggleChannelReaction(42, "👍");
    expect(mockFetchJson).toHaveBeenCalledWith("/messages/channel/42/reactions", {
      method: "POST",
      body: { emoji: "👍" },
    });
  });

  it("returns the updated reactions array", async () => {
    const reactions = [{ emoji: "👍", count: 3, userIds: ["u1", "u2", "u3"] }];
    mockFetchJson.mockResolvedValue(reactions);
    expect(await toggleChannelReaction(1, "👍")).toEqual(reactions);
  });

  it("handles different emoji characters", async () => {
    mockFetchJson.mockResolvedValue([]);
    await toggleChannelReaction(10, "❤️");
    expect(mockFetchJson).toHaveBeenCalledWith("/messages/channel/10/reactions", {
      method: "POST",
      body: { emoji: "❤️" },
    });
  });
});

describe("togglePrivateReaction", () => {
  it("calls POST on the private reactions endpoint", async () => {
    mockFetchJson.mockResolvedValue([]);
    await togglePrivateReaction(7, "😂");
    expect(mockFetchJson).toHaveBeenCalledWith("/messages/private/7/reactions", {
      method: "POST",
      body: { emoji: "😂" },
    });
  });

  it("returns the updated reactions array", async () => {
    const reactions = [{ emoji: "😂", count: 1, userIds: ["u1"] }];
    mockFetchJson.mockResolvedValue(reactions);
    expect(await togglePrivateReaction(7, "😂")).toEqual(reactions);
  });
});
