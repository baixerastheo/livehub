import { loginSchema, registerSchema } from "../schemas";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse({ login: "john", password: "secret123" }).success).toBe(true);
  });

  it("rejects empty login", () => {
    const result = loginSchema.safeParse({ login: "", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 6 characters", () => {
    const result = loginSchema.safeParse({ login: "john", password: "abc" });
    expect(result.success).toBe(false);
  });

  it("accepts password of exactly 6 characters", () => {
    const result = loginSchema.safeParse({ login: "john", password: "abc123" });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from login", () => {
    const result = loginSchema.safeParse({ login: "  john  ", password: "secret123" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.login).toBe("john");
  });
});

describe("registerSchema", () => {
  const valid = {
    username: "john_doe",
    email: "john@example.com",
    password: "password123",
    confirmPassword: "password123",
  };

  it("accepts valid registration data", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects username shorter than 3 characters", () => {
    expect(registerSchema.safeParse({ ...valid, username: "ab" }).success).toBe(false);
  });

  it("rejects username longer than 50 characters", () => {
    expect(registerSchema.safeParse({ ...valid, username: "a".repeat(51) }).success).toBe(false);
  });

  it("rejects username with special characters", () => {
    expect(registerSchema.safeParse({ ...valid, username: "john doe" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, username: "john@doe" }).success).toBe(false);
  });

  it("accepts username with letters, numbers and underscores", () => {
    expect(registerSchema.safeParse({ ...valid, username: "john_42" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, email: "missing@" }).success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    expect(registerSchema.safeParse({ ...valid, password: "abc123", confirmPassword: "abc123" }).success).toBe(false);
  });

  it("rejects password longer than 255 characters", () => {
    const long = "a".repeat(256);
    expect(registerSchema.safeParse({ ...valid, password: long, confirmPassword: long }).success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "different" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("confirmPassword");
    }
  });
});
