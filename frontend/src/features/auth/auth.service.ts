import { fetchJson } from "@/src/lib/apiClient";
import { getCsrfToken } from "@/src/lib/csrf";
import type { AuthUser } from "@/src/core/store/auth/useAuthStore";
import type { LoginFormData, RegisterFormData } from "@/src/lib/schemas";

function buildCsrfHeaders(): HeadersInit {
  const token = getCsrfToken();
  return token ? { "x-csrf-token": token } : {};
}

export type AuthTokenResponse = { accessToken: string };

export async function login(
  data: LoginFormData,
): Promise<AuthTokenResponse> {
  return fetchJson<AuthTokenResponse>("/auth/login", {
    method: "POST",
    body: {
      login: data.login,
      password: data.password,
    },
  });
}

export async function register(
  data: Omit<RegisterFormData, "confirmPassword">,
): Promise<AuthTokenResponse> {
  return fetchJson<AuthTokenResponse>("/auth/register", {
    method: "POST",
    body: {
      username: data.username,
      email: data.email,
      password: data.password,
    },
  });
}

export async function refresh(): Promise<AuthTokenResponse> {
  return fetchJson<AuthTokenResponse>("/auth/refresh", {
    method: "POST",
    headers: buildCsrfHeaders(),
  });
}

export async function logout(): Promise<void> {
  await fetchJson<void>("/auth/logout", {
    method: "POST",
    headers: buildCsrfHeaders(),
  });
}

export async function getProfile(accessToken: string): Promise<AuthUser> {
  return fetchJson<AuthUser>("/auth/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export const authService = {
  getProfile,
  login,
  logout,
  refresh,
  register,
};

