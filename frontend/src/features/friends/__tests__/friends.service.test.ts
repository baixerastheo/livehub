import {
  listFriends,
  listRequests,
  sendRequest,
  acceptRequest,
  declineRequest,
} from "../friends.service";

jest.mock("@/src/lib/apiClient", () => ({
  fetchJson: jest.fn(),
}));

import { fetchJson } from "@/src/lib/apiClient";
const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

beforeEach(() => {
  mockFetchJson.mockReset();
});

describe("listFriends", () => {
  it("calls GET /friends", async () => {
    mockFetchJson.mockResolvedValue([]);
    await listFriends();
    expect(mockFetchJson).toHaveBeenCalledWith("/friends", { method: "GET" });
  });

  it("returns the friends list", async () => {
    const friends = [{ id: "u1", name: "Alice" }];
    mockFetchJson.mockResolvedValue(friends);
    expect(await listFriends()).toEqual(friends);
  });
});

describe("listRequests", () => {
  it("calls GET /friends/requests", async () => {
    mockFetchJson.mockResolvedValue([]);
    await listRequests();
    expect(mockFetchJson).toHaveBeenCalledWith("/friends/requests", { method: "GET" });
  });

  it("returns the requests list", async () => {
    const requests = [{ id: "req-1", status: "PENDING" }];
    mockFetchJson.mockResolvedValue(requests);
    expect(await listRequests()).toEqual(requests);
  });
});

describe("sendRequest", () => {
  it("calls POST /friends/requests with the target userId", async () => {
    mockFetchJson.mockResolvedValue(undefined);
    await sendRequest("user-xyz");
    expect(mockFetchJson).toHaveBeenCalledWith("/friends/requests", {
      method: "POST",
      body: { toUserId: "user-xyz" },
    });
  });
});

describe("acceptRequest", () => {
  it("calls POST /friends/requests/:id/accept", async () => {
    mockFetchJson.mockResolvedValue(undefined);
    await acceptRequest("req-42");
    expect(mockFetchJson).toHaveBeenCalledWith("/friends/requests/req-42/accept", {
      method: "POST",
    });
  });
});

describe("declineRequest", () => {
  it("calls POST /friends/requests/:id/decline", async () => {
    mockFetchJson.mockResolvedValue(undefined);
    await declineRequest("req-99");
    expect(mockFetchJson).toHaveBeenCalledWith("/friends/requests/req-99/decline", {
      method: "POST",
    });
  });
});
