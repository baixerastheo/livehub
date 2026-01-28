"use client";

import { useEffect } from "react";
import { refreshApi } from "../api/authApi";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";

export function useAuthBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const status = useAuthStore((state) => state.status);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (accessToken || status === "unauthenticated") return;

    let cancelled = false;

    (async () => {
      try {
        const { accessToken: newToken } = await refreshApi();
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

