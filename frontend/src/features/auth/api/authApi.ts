import { fetchJson } from "@/lib/apiClient";
import { getCsrfToken } from "@/lib/csrf";
import type { AuthUser } from "@/src/core/store/auth/useAuthStore";

function buildCsrfHeaders(): HeadersInit {
  const token = getCsrfToken();

  return token ? { "x-csrf-token": token } : {};
}

export async function refreshApi(): Promise<{ accessToken: string }> {
  return fetchJson<{ accessToken: string }>("/auth/refresh", {
    method: "POST",
    headers: buildCsrfHeaders(),
  });
}

export async function logoutApi(): Promise<void> {
  await fetchJson<void>("/auth/logout", {
    method: "POST",
    headers: buildCsrfHeaders(),
  });
}

export async function getProfileApi(
  accessToken: string,
): Promise<AuthUser> {
  return fetchJson<AuthUser>("/auth/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

