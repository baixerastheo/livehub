import {
  getChannelsByServer,
  getChannelById,
  deleteChannel,
  getChannelMessages,
  sendChannelMessage,
  deleteChannelMessage,
  editChannelMessage,
} from "../channel.service";
import type { ChannelBackendDto } from "../channel.types";

jest.mock("@/src/lib/apiClient", () => ({
  fetchJson: jest.fn(),
}));

import { fetchJson } from "@/src/lib/apiClient";
const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

const backendDto: ChannelBackendDto = {
  id: 1,
  serveurId: 10,
  nom: "général",
  type: "TEXTE",
  creeLe: "2024-01-01T00:00:00.000Z",
  modifieLe: "2024-01-02T00:00:00.000Z",
};

beforeEach(() => {
  mockFetchJson.mockReset();
});

describe("getChannelsByServer", () => {
  it("maps French backend fields to English DTO fields", async () => {
    mockFetchJson.mockResolvedValue([backendDto]);
    const result = await getChannelsByServer(10);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 1,
      serverId: 10,
      name: "général",
      type: "TEXTE",
      createdAtIso: "2024-01-01T00:00:00.000Z",
      updatedAtIso: "2024-01-02T00:00:00.000Z",
    });
  });

  it("returns an empty array when no channels", async () => {
    mockFetchJson.mockResolvedValue([]);
    const result = await getChannelsByServer(10);
    expect(result).toEqual([]);
  });

  it("maps multiple channels", async () => {
    const second = { ...backendDto, id: 2, nom: "annonces", type: "VOCAL" as const };
    mockFetchJson.mockResolvedValue([backendDto, second]);
    const result = await getChannelsByServer(10);
    expect(result).toHaveLength(2);
    expect(result[1].name).toBe("annonces");
    expect(result[1].type).toBe("VOCAL");
  });

  it("defaults type to TEXTE when missing", async () => {
    const dtoWithoutType = { ...backendDto, type: undefined as unknown as "TEXTE" };
    mockFetchJson.mockResolvedValue([dtoWithoutType]);
    const result = await getChannelsByServer(10);
    expect(result[0].type).toBe("TEXTE");
  });

  it("calls the correct endpoint", async () => {
    mockFetchJson.mockResolvedValue([]);
    await getChannelsByServer(42);
    expect(mockFetchJson).toHaveBeenCalledWith("/servers/42/channels", { method: "GET" });
  });
});

describe("getChannelById", () => {
  it("maps a single channel correctly", async () => {
    mockFetchJson.mockResolvedValue(backendDto);
    const result = await getChannelById(1);
    expect(result.id).toBe(1);
    expect(result.name).toBe("général");
    expect(result.serverId).toBe(10);
  });

  it("calls the correct endpoint", async () => {
    mockFetchJson.mockResolvedValue(backendDto);
    await getChannelById(7);
    expect(mockFetchJson).toHaveBeenCalledWith("/channels/7", { method: "GET" });
  });
});

describe("deleteChannel", () => {
  it("calls DELETE on the correct endpoint", async () => {
    mockFetchJson.mockResolvedValue(undefined);
    await deleteChannel(99);
    expect(mockFetchJson).toHaveBeenCalledWith("/channels/99", { method: "DELETE" });
  });
});

describe("getChannelMessages", () => {
  it("calls GET on the correct endpoint", async () => {
    mockFetchJson.mockResolvedValue([]);
    await getChannelMessages(5);
    expect(mockFetchJson).toHaveBeenCalledWith("/channels/5/messages", { method: "GET" });
  });

  it("returns the messages array", async () => {
    const msgs = [{ id: 1, contenu: "Hello", creeLe: "2024-01-01T00:00:00Z", auteurId: "u1", auteur: { id: "u1", name: "Alice", email: "a@a.com" } }];
    mockFetchJson.mockResolvedValue(msgs);
    expect(await getChannelMessages(5)).toEqual(msgs);
  });
});

describe("sendChannelMessage", () => {
  it("calls POST with the correct body", async () => {
    const msg = { id: 1, contenu: "Hello", creeLe: "2024-01-01T00:00:00Z", auteurId: "u1", auteur: { id: "u1", name: "Alice", email: "a@a.com" } };
    mockFetchJson.mockResolvedValue(msg);
    await sendChannelMessage(5, "Hello");
    expect(mockFetchJson).toHaveBeenCalledWith("/channels/5/messages", {
      method: "POST",
      body: { content: "Hello" },
    });
  });

  it("returns the created message", async () => {
    const msg = { id: 2, contenu: "Hi", creeLe: "2024-01-01T00:00:00Z", auteurId: "u1", auteur: { id: "u1", name: "Alice", email: "a@a.com" } };
    mockFetchJson.mockResolvedValue(msg);
    expect(await sendChannelMessage(5, "Hi")).toEqual(msg);
  });
});

describe("deleteChannelMessage", () => {
  it("calls DELETE on the correct endpoint", async () => {
    mockFetchJson.mockResolvedValue(undefined);
    await deleteChannelMessage(42);
    expect(mockFetchJson).toHaveBeenCalledWith("/messages/42", { method: "DELETE" });
  });
});

describe("editChannelMessage", () => {
  it("calls PATCH with the new content", async () => {
    mockFetchJson.mockResolvedValue({ id: "10", content: "Edited", editedAtIso: "2024-01-01T00:00:00Z" });
    await editChannelMessage(10, "Edited");
    expect(mockFetchJson).toHaveBeenCalledWith("/messages/channel/10", {
      method: "PATCH",
      body: { content: "Edited" },
    });
  });

  it("returns the updated message", async () => {
    const updated = { id: "10", content: "New text", editedAtIso: null };
    mockFetchJson.mockResolvedValue(updated);
    expect(await editChannelMessage(10, "New text")).toEqual(updated);
  });
});
