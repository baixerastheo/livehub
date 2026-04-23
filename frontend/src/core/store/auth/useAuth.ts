"use client";

import { useSession } from "@/src/lib/auth-client";

export function useAuth() {
  const { data: session, isPending, error, refetch } = useSession();

  return {
    user: session?.user ?? null,
    session: session?.session ?? null,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    error,
    refetch,
  };
}
