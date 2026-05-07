import { getDisplayName } from "../displayName";

describe("getDisplayName", () => {
  it("returns name when both name and email are present", () => {
    expect(getDisplayName({ name: "Alice", email: "alice@example.com" })).toBe("Alice");
  });

  it("falls back to email when name is absent", () => {
    expect(getDisplayName({ email: "alice@example.com" })).toBe("alice@example.com");
  });

  it("falls back to email when name is null", () => {
    expect(getDisplayName({ name: null, email: "alice@example.com" })).toBe("alice@example.com");
  });

  it("falls back to email when name is empty string", () => {
    expect(getDisplayName({ name: "", email: "alice@example.com" })).toBe("alice@example.com");
  });

  it("falls back to email when name is only whitespace", () => {
    expect(getDisplayName({ name: "   ", email: "alice@example.com" })).toBe("alice@example.com");
  });

  it("returns '?' when both name and email are absent", () => {
    expect(getDisplayName({})).toBe("?");
  });

  it("returns '?' when both name and email are null", () => {
    expect(getDisplayName({ name: null, email: null })).toBe("?");
  });

  it("trims whitespace from name", () => {
    expect(getDisplayName({ name: "  Alice  " })).toBe("Alice");
  });

  it("trims whitespace from email when used as fallback", () => {
    expect(getDisplayName({ name: null, email: "  alice@example.com  " })).toBe("alice@example.com");
  });
});
