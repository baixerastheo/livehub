import { listNotifications, markAllNotificationsRead } from "../notification.service";

jest.mock("@/src/lib/apiClient", () => ({
  fetchJson: jest.fn(),
}));

import { fetchJson } from "@/src/lib/apiClient";
const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

beforeEach(() => {
  mockFetchJson.mockReset();
});

describe("listNotifications", () => {
  it("calls the correct endpoint", async () => {
    mockFetchJson.mockResolvedValue([]);
    await listNotifications();
    expect(mockFetchJson).toHaveBeenCalledWith("/notifications", { method: "GET" });
  });

  it("returns the notifications array", async () => {
    const notifs = [{ id: 1, type: "MENTION" }];
    mockFetchJson.mockResolvedValue(notifs);
    const result = await listNotifications();
    expect(result).toEqual(notifs);
  });
});

describe("markAllNotificationsRead", () => {
  it("calls the correct endpoint", async () => {
    mockFetchJson.mockResolvedValue(undefined);
    await markAllNotificationsRead();
    expect(mockFetchJson).toHaveBeenCalledWith("/notifications/read-all", { method: "PATCH" });
  });
});
