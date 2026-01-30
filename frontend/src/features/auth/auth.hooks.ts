"use client";

import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { LoginFormData, RegisterFormData } from "@/src/lib/schemas";
import { loginSchema, registerSchema } from "@/src/lib/schemas";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";
import { authService } from "@/src/features/auth/auth.service";

export function useLoginMutation() {
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  return useMutation({
    mutationFn: async (payload: LoginFormData) => {
      const validated = loginSchema.parse(payload);
      return authService.login(validated);
    },
    onSuccess: ({ accessToken }) => {
      setAccessToken(accessToken);
    },
  });
}

export function useRegisterMutation() {
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  return useMutation({
    mutationFn: async (payload: RegisterFormData) => {
      const validated = registerSchema.parse(payload);
      const rest = {
        username: validated.username,
        email: validated.email,
        password: validated.password,
      };
      return authService.register(rest);
    },
    onSuccess: ({ accessToken }) => {
      setAccessToken(accessToken);
    },
  });
}

export function useLogoutMutation() {
  const logoutLocal = useAuthStore((state) => state.logoutLocal);

  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      logoutLocal();
    },
  });
}

export function useMeQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);

  const query = useQuery({
    queryKey: ["auth", "me", accessToken ?? ""] as const,
    queryFn: accessToken ? () => authService.getProfile(accessToken) : skipToken,
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);

  return query;
}

