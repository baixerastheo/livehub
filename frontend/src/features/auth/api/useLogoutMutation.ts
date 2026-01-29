"use client";

import { useMutation } from "@tanstack/react-query";
import { logoutApi } from "./authApi";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";

export function useLogoutMutation() {
  const logoutLocal = useAuthStore((state) => state.logoutLocal);

  return useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      logoutLocal();
    },
  });
}

