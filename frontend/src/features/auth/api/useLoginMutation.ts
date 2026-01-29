"use client";

import { useMutation } from "@tanstack/react-query";
import type { LoginFormData } from "@/src/lib/schemas";
import { fetchJson } from "@/src/lib/apiClient";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";

async function loginApi(data: LoginFormData): Promise<{ accessToken: string }> {
  return fetchJson<{ accessToken: string }>("/auth/login", {
    method: "POST",
    body: {
      login: data.login,
      password: data.password,
    },
  });
}

export function useLoginMutation() {
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  return useMutation({
    mutationFn: loginApi,
    onSuccess: ({ accessToken }) => {
      setAccessToken(accessToken);
      // TODO optionnel, déclencher un chargement de /auth/profile ici
    },
  });
}

