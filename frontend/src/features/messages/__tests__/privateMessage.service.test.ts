import {
  listPrivateConversations,
  getPrivateConversation,
  sendPrivateMessage,
  editPrivateMessage,
} from "../privateMessage.service";

jest.mock("@/src/lib/apiClient", () => ({
  fetchJson: jest.fn(),
}));

import { fetchJson } from "@/src/lib/apiClient";
const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

beforeEach(() => {
  mockFetchJson.mockReset();
});

describe("listPrivateConversations", () => {
  it("calls GET /conversations/private", async () => {
    mockFetchJson.mockResolvedValue([]);
    await listPrivateConversations();
    expect(mockFetchJson).toHaveBeenCalledWith("/conversations/private", { method: "GET" });
  });

  it("returns the conversations list", async () => {
    const convos = [{ id: 1, peer: { id: "u1", name: "Alice" } }];
    mockFetchJson.mockResolvedValue(convos);
    expect(await listPrivateConversations()).toEqual(convos);
  });
});

describe("getPrivateConversation", () => {
  it("calls the correct endpoint with encoded userId", async () => {
    mockFetchJson.mockResolvedValue({ messages: [] });
    await getPrivateConversation("user-abc");
    expect(mockFetchJson).toHaveBeenCalledWith("/messages/private/user-abc", { method: "GET" });
  });

  it("encodes special characters in userId", async () => {
    mockFetchJson.mockResolvedValue({ messages: [] });
    await getPrivateConversation("user@example.com");
    expect(mockFetchJson).toHaveBeenCalledWith(
      "/messages/private/user%40example.com",
      { method: "GET" },
    );
  });

  it("returns the conversation data", async () => {
    const data = { messages: [{ id: 1, content: "Hello" }] };
    mockFetchJson.mockResolvedValue(data);
    expect(await getPrivateConversation("u1")).toEqual(data);
  });
});

describe("sendPrivateMessage", () => {
  it("calls POST with the correct endpoint and body", async () => {
    mockFetchJson.mockResolvedValue({ id: 1, content: "Hello" });
    await sendPrivateMessage("user-abc", "Hello");
    expect(mockFetchJson).toHaveBeenCalledWith("/messages/private/user-abc", {
      method: "POST",
      body: { content: "Hello" },
    });
  });

  it("returns the sent message", async () => {
    const msg = { id: 5, content: "Hi" };
    mockFetchJson.mockResolvedValue(msg);
    expect(await sendPrivateMessage("u1", "Hi")).toEqual(msg);
  });
});

describe("editPrivateMessage", () => {
  it("calls PATCH on the correct endpoint with new content", async () => {
    mockFetchJson.mockResolvedValue({ id: "3", content: "Edited", editedAtIso: "2024-01-01T00:00:00Z" });
    await editPrivateMessage(3, "Edited");
    expect(mockFetchJson).toHaveBeenCalledWith("/messages/private/3", {
      method: "PATCH",
      body: { content: "Edited" },
    });
  });

  it("returns the updated message", async () => {
    const updated = { id: "7", content: "Updated text", editedAtIso: null };
    mockFetchJson.mockResolvedValue(updated);
    expect(await editPrivateMessage(7, "Updated text")).toEqual(updated);
  });
});
