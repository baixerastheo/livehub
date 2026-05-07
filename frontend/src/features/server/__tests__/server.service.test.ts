import {
  getUserServers,
  getServerMembers,
  createServer,
  updateServer,
  deleteServer,
  leaveServer,
  getServerById,
  addServerMember,
  kickMember,
  transferOwnership,
  listUserServers,
  updateMemberRole,
  getServerChannels,
  createChannel,
  banMember,
  unbanMember,
  getBans,
  uploadServerAvatar,
} from "../server.service";
import type { ServerBackendDto, UserServerBackendDto, ServerMemberBackendDto } from "../server.types";

jest.mock("@/src/lib/apiClient", () => ({
  fetchJson: jest.fn(),
  fetchFormData: jest.fn(),
}));

import { fetchJson, fetchFormData } from "@/src/lib/apiClient";
const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;
const mockFetchFormData = fetchFormData as jest.MockedFunction<typeof fetchFormData>;

const serverBackendDto: ServerBackendDto = {
  id: 1,
  nom: "Mon serveur",
  avatarUrl: "https://example.com/avatar.png",
  creeLe: "2024-01-01T00:00:00.000Z",
  modifieLe: "2024-01-02T00:00:00.000Z",
};

const userServerBackendDto: UserServerBackendDto = {
  id: 99,
  serveurId: 1,
  userId: "user-abc",
  role: "PROPRIETAIRE",
  rejointLe: "2024-01-01T00:00:00.000Z",
  serveur: serverBackendDto,
};

const memberBackendDto: ServerMemberBackendDto = {
  id: 5,
  serveurId: 1,
  userId: "user-xyz",
  role: "MEMBRE",
  rejointLe: "2024-02-01T00:00:00.000Z",
  user: {
    id: "user-xyz",
    name: "Alice",
    email: "alice@example.com",
    avatarUrl: "https://example.com/alice.png",
    statut: "EN_LIGNE",
  },
};

beforeEach(() => {
  mockFetchJson.mockReset();
  mockFetchFormData.mockReset();
});

describe("getUserServers — mapUserServer + mapServer", () => {
  it("maps French backend fields to English DTO", async () => {
    mockFetchJson.mockResolvedValue([userServerBackendDto]);
    const result = await getUserServers();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      membershipId: 99,
      role: "PROPRIETAIRE",
      joinedAtIso: "2024-01-01T00:00:00.000Z",
      server: {
        id: 1,
        name: "Mon serveur",
        avatarUrl: "https://example.com/avatar.png",
        createdAtIso: "2024-01-01T00:00:00.000Z",
        updatedAtIso: "2024-01-02T00:00:00.000Z",
      },
    });
  });

  it("maps null avatarUrl to null", async () => {
    const dto = { ...userServerBackendDto, serveur: { ...serverBackendDto, avatarUrl: null } };
    mockFetchJson.mockResolvedValue([dto]);
    const result = await getUserServers();
    expect(result[0].server.avatarUrl).toBeNull();
  });

  it("maps undefined avatarUrl to null", async () => {
    const dto = { ...userServerBackendDto, serveur: { ...serverBackendDto, avatarUrl: undefined } };
    mockFetchJson.mockResolvedValue([dto]);
    const result = await getUserServers();
    expect(result[0].server.avatarUrl).toBeNull();
  });

  it("returns empty array when no servers", async () => {
    mockFetchJson.mockResolvedValue([]);
    expect(await getUserServers()).toEqual([]);
  });
});

describe("getServerMembers — mapServerMember", () => {
  it("maps French backend fields to English DTO", async () => {
    mockFetchJson.mockResolvedValue([memberBackendDto]);
    const result = await getServerMembers(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 5,
      serverId: 1,
      userId: "user-xyz",
      role: "MEMBRE",
      joinedAtIso: "2024-02-01T00:00:00.000Z",
      user: {
        id: "user-xyz",
        name: "Alice",
        email: "alice@example.com",
        avatarUrl: "https://example.com/alice.png",
        statut: "EN_LIGNE",
      },
    });
  });

  it("maps null avatarUrl to null", async () => {
    const dto = { ...memberBackendDto, user: { ...memberBackendDto.user, avatarUrl: null } };
    mockFetchJson.mockResolvedValue([dto]);
    const result = await getServerMembers(1);
    expect(result[0].user.avatarUrl).toBeNull();
  });

  it("maps undefined statut to undefined", async () => {
    const dto = { ...memberBackendDto, user: { ...memberBackendDto.user, statut: undefined } };
    mockFetchJson.mockResolvedValue([dto]);
    const result = await getServerMembers(1);
    expect(result[0].user.statut).toBeUndefined();
  });

  it("calls the correct endpoint", async () => {
    mockFetchJson.mockResolvedValue([]);
    await getServerMembers(42);
    expect(mockFetchJson).toHaveBeenCalledWith("/servers/42/members", { method: "GET" });
  });

  it("handles all server roles", async () => {
    const roles = ["PROPRIETAIRE", "ADMINISTRATEUR", "MEMBRE"] as const;
    for (const role of roles) {
      const dto = { ...memberBackendDto, role };
      mockFetchJson.mockResolvedValue([dto]);
      const result = await getServerMembers(1);
      expect(result[0].role).toBe(role);
    }
  });
});

describe("createServer", () => {
  it("maps the backend response to ServerDto", async () => {
    mockFetchJson.mockResolvedValue(serverBackendDto);
    const result = await createServer({ name: "Mon serveur" });
    expect(result.name).toBe("Mon serveur");
    expect(result.id).toBe(1);
  });
});

describe("updateServer", () => {
  it("calls the correct endpoint and maps the response", async () => {
    mockFetchJson.mockResolvedValue({ ...serverBackendDto, nom: "Nouveau nom" });
    const result = await updateServer(1, { name: "Nouveau nom" });
    expect(result.name).toBe("Nouveau nom");
    expect(mockFetchJson).toHaveBeenCalledWith("/servers/1", expect.objectContaining({ method: "PUT" }));
  });
});

describe("getServerById", () => {
  it("maps a single server correctly", async () => {
    mockFetchJson.mockResolvedValue(serverBackendDto);
    const result = await getServerById(1);
    expect(result).toEqual({
      id: 1,
      name: "Mon serveur",
      avatarUrl: "https://example.com/avatar.png",
      createdAtIso: "2024-01-01T00:00:00.000Z",
      updatedAtIso: "2024-01-02T00:00:00.000Z",
    });
  });
});

describe("deleteServer", () => {
  it("calls DELETE on the correct endpoint", async () => {
    mockFetchJson.mockResolvedValue(undefined);
    await deleteServer(1);
    expect(mockFetchJson).toHaveBeenCalledWith("/servers/1", { method: "DELETE" });
  });
});

describe("leaveServer", () => {
  it("calls DELETE /servers/:id/leave", async () => {
    mockFetchJson.mockResolvedValue(undefined);
    await leaveServer(5);
    expect(mockFetchJson).toHaveBeenCalledWith("/servers/5/leave", { method: "DELETE" });
  });
});

describe("addServerMember", () => {
  it("maps the returned member", async () => {
    mockFetchJson.mockResolvedValue(memberBackendDto);
    const result = await addServerMember(1, "user-xyz");
    expect(result.userId).toBe("user-xyz");
    expect(mockFetchJson).toHaveBeenCalledWith(
      "/servers/1/members",
      expect.objectContaining({ method: "POST", body: { userId: "user-xyz" } }),
    );
  });
});

describe("kickMember", () => {
  it("calls DELETE on the member endpoint", async () => {
    mockFetchJson.mockResolvedValue(undefined);
    await kickMember(1, "user-xyz");
    expect(mockFetchJson).toHaveBeenCalledWith("/servers/1/members/user-xyz", { method: "DELETE" });
  });
});

describe("transferOwnership", () => {
  it("calls the correct endpoint and returns the response", async () => {
    const response = { newOwnerId: "new-owner", previousOwnerId: "old-owner" };
    mockFetchJson.mockResolvedValue(response);
    const result = await transferOwnership(1, "new-owner");
    expect(result).toEqual(response);
    expect(mockFetchJson).toHaveBeenCalledWith(
      "/servers/1/transfer-ownership/new-owner",
      { method: "POST" },
    );
  });
});

describe("listUserServers", () => {
  it("calls GET /servers and returns the raw response", async () => {
    const raw = [{ id: 1, nom: "My Server" }];
    mockFetchJson.mockResolvedValue(raw);
    const result = await listUserServers();
    expect(result).toEqual(raw);
    expect(mockFetchJson).toHaveBeenCalledWith("/servers", { method: "GET" });
  });
});

describe("updateMemberRole", () => {
  it("calls PUT on the member endpoint and maps the response", async () => {
    mockFetchJson.mockResolvedValue(memberBackendDto);
    const result = await updateMemberRole(1, "user-xyz", { role: "ADMINISTRATEUR" });
    expect(result.role).toBe("MEMBRE");
    expect(mockFetchJson).toHaveBeenCalledWith(
      "/servers/1/members/user-xyz",
      { method: "PUT", body: { role: "ADMINISTRATEUR" } },
    );
  });
});

describe("getServerChannels", () => {
  it("calls GET /servers/:id/channels", async () => {
    mockFetchJson.mockResolvedValue([]);
    await getServerChannels(3);
    expect(mockFetchJson).toHaveBeenCalledWith("/servers/3/channels", { method: "GET" });
  });

  it("returns the raw channel list", async () => {
    const channels = [{ id: 1, nom: "général" }];
    mockFetchJson.mockResolvedValue(channels);
    expect(await getServerChannels(3)).toEqual(channels);
  });
});

describe("createChannel", () => {
  it("calls POST /servers/:id/channels with payload", async () => {
    const channel = { id: 10, name: "dev", type: "TEXTE" };
    mockFetchJson.mockResolvedValue(channel);
    await createChannel(3, { name: "dev", type: "TEXTE" });
    expect(mockFetchJson).toHaveBeenCalledWith("/servers/3/channels", {
      method: "POST",
      body: { name: "dev", type: "TEXTE" },
    });
  });
});

describe("banMember", () => {
  it("calls POST /servers/:id/bans with body", async () => {
    const ban = { id: 1, userId: "user-xyz", serverId: 1 };
    mockFetchJson.mockResolvedValue(ban);
    await banMember(1, { userId: "user-xyz", raison: "spam" });
    expect(mockFetchJson).toHaveBeenCalledWith("/servers/1/bans", {
      method: "POST",
      body: { userId: "user-xyz", raison: "spam" },
    });
  });
});

describe("unbanMember", () => {
  it("calls DELETE /servers/:id/bans/:userId", async () => {
    mockFetchJson.mockResolvedValue(undefined);
    await unbanMember(1, "user-xyz");
    expect(mockFetchJson).toHaveBeenCalledWith("/servers/1/bans/user-xyz", { method: "DELETE" });
  });
});

describe("getBans", () => {
  it("calls GET /servers/:id/bans and returns the list", async () => {
    const bans = [{ id: 1, userId: "user-xyz" }];
    mockFetchJson.mockResolvedValue(bans);
    const result = await getBans(1);
    expect(result).toEqual(bans);
    expect(mockFetchJson).toHaveBeenCalledWith("/servers/1/bans", { method: "GET" });
  });
});

describe("uploadServerAvatar", () => {
  it("calls PATCH /servers/:id/avatar with form data", async () => {
    const response = { path: "servers/1/avatar.jpg", avatarUrl: "https://example.com/avatar.jpg" };
    mockFetchFormData.mockResolvedValue(response);
    const file = new File(["img"], "avatar.jpg", { type: "image/jpeg" });
    const result = await uploadServerAvatar(1, file);
    expect(result).toEqual(response);
    expect(mockFetchFormData).toHaveBeenCalledWith(
      "/servers/1/avatar",
      expect.any(FormData),
      "PATCH",
    );
  });

  it("appends the file under the 'file' field", async () => {
    mockFetchFormData.mockResolvedValue({ path: "x", avatarUrl: "https://x.com" });
    const file = new File(["img"], "avatar.png", { type: "image/png" });
    await uploadServerAvatar(2, file);
    const formData = mockFetchFormData.mock.calls[0][1] as FormData;
    expect(formData.get("file")).toBe(file);
  });
});
