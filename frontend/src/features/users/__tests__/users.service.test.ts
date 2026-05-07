import { listUsers, getUserById } from "../users.service";

jest.mock("@/src/lib/apiClient", () => ({
  fetchJson: jest.fn(),
}));

import { fetchJson } from "@/src/lib/apiClient";
const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

beforeEach(() => {
  mockFetchJson.mockReset();
});

describe("listUsers", () => {
  it("calls GET /users", async () => {
    mockFetchJson.mockResolvedValue([]);
    await listUsers();
    expect(mockFetchJson).toHaveBeenCalledWith("/users", { method: "GET" });
  });

  it("returns the users list", async () => {
    const users = [{ id: "u1", name: "Alice", email: "alice@example.com" }];
    mockFetchJson.mockResolvedValue(users);
    expect(await listUsers()).toEqual(users);
  });

  it("ignores the q param (filtered client-side)", async () => {
    mockFetchJson.mockResolvedValue([]);
    await listUsers({ q: "alice" });
    expect(mockFetchJson).toHaveBeenCalledWith("/users", { method: "GET" });
  });
});

describe("getUserById", () => {
  it("calls the correct endpoint with the user id", async () => {
    mockFetchJson.mockResolvedValue({ id: "u1", name: "Alice" });
    await getUserById("u1");
    expect(mockFetchJson).toHaveBeenCalledWith("/users/u1", { method: "GET" });
  });

  it("returns the user object", async () => {
    const user = { id: "u1", name: "Alice", email: "alice@example.com" };
    mockFetchJson.mockResolvedValue(user);
    expect(await getUserById("u1")).toEqual(user);
  });
});
