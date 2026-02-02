import { fetchJson } from "@/src/lib/apiClient";
import type { AuthUser } from "@/src/core/store/auth/useAuthStore";
import type { LoginFormData, RegisterFormData } from "@/src/lib/schemas";

/** Backend auth response (snake_case) */
type BackendAuthResponse = {
  user: { id: number; email: string; username: string; [k: string]: unknown };
  access_token: string;
};

/** Backend profile response */
type BackendProfileResponse = { user: AuthUser };

export type AuthTokenResponse = { accessToken: string; user?: AuthUser };

function mapAuthResponse(res: BackendAuthResponse): AuthTokenResponse {
  return {
    accessToken: res.access_token,
    user: res.user
      ? { id: res.user.id, email: res.user.email, username: res.user.username }
      : undefined,
  };
}

export async function login(
  data: LoginFormData,
): Promise<AuthTokenResponse> {
  const res = await fetchJson<BackendAuthResponse>("/auth/login", {
    method: "POST",
    body: {
      login: data.login,
      password: data.password,
    },
  });
  return mapAuthResponse(res);
}

export async function register(
  data: Omit<RegisterFormData, "confirmPassword">,
): Promise<AuthTokenResponse> {
  const res = await fetchJson<BackendAuthResponse>("/auth/register", {
    method: "POST",
    body: {
      username: data.username,
      email: data.email,
      password: data.password,
    },
  });
  return mapAuthResponse(res);
}

export async function refresh(): Promise<AuthTokenResponse> {
  const res = await fetchJson<{ access_token: string }>("/auth/refresh", {
    method: "POST",
  });
  return { accessToken: res.access_token };
}

export async function logout(): Promise<void> {
  await fetchJson<void>("/auth/logout", {
    method: "POST",
  });
}

export async function getProfile(accessToken: string): Promise<AuthUser> {
  const res = await fetchJson<BackendProfileResponse>("/auth/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.user;
}

export const authService = {
  getProfile,
  login,
  logout,
  refresh,
  register,
};

