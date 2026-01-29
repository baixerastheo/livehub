"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getProfileApi } from "./authApi";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";

export function useMeQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);

  const query = useQuery({
    queryKey: ["me", accessToken],
    enabled: !!accessToken,
    queryFn: async () => {
      if (!accessToken) {
        throw new Error("No access token");
      }

      return getProfileApi(accessToken);
    },
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);

  return query;
}

