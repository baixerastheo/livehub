"use client";

import { useQuery } from "@tanstack/react-query";
import { getProfileApi } from "./authApi";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";

export function useMeQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: ["me"],
    enabled: !!accessToken,
    queryFn: async () => {
      if (!accessToken) {
        throw new Error("No access token");
      }

      const user = await getProfileApi(accessToken);
      setUser(user);
      return user;
    },
  });
}

