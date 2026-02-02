"use client";

import { useEffect } from "react";
import { authService } from "@/src/features/auth/auth.service";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";

const AUTH_LOGOUT_FLAG_KEY = "auth.loggedOut";

export function useAuthBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const status = useAuthStore((state) => state.status);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.localStorage.getItem(AUTH_LOGOUT_FLAG_KEY) === "1") {
      setAccessToken(null);
      return;
    }

    if (accessToken || status === "unauthenticated") return;

    let cancelled = false;

    (async () => {
      try {
        const { accessToken: newToken } = await authService.refresh();
        if (!cancelled) {
          setAccessToken(newToken);
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, status, setAccessToken]);
}

