"use client";

import { useMutation } from "@tanstack/react-query";
import type { RegisterFormData } from "@/src/lib/schemas";
import { fetchJson } from "@/src/lib/apiClient";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";

async function registerApi(
  data: Omit<RegisterFormData, "confirmPassword">,
): Promise<{ accessToken: string }> {
  return fetchJson<{ accessToken: string }>("/auth/register", {
    method: "POST",
    body: {
      username: data.username,
      email: data.email,
      password: data.password,
    },
  });
}

export function useRegisterMutation() {
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  return useMutation({
    mutationFn: registerApi,
    onSuccess: ({ accessToken }) => {
      setAccessToken(accessToken);
      // TODO: optionnel, déclencher un chargement de /auth/profile ici
    },
  });
}

