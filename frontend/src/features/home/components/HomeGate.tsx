"use client";

import { useAuthStore } from "@/src/core/store/auth/useAuthStore";
import { HomeEmptyState } from "@/src/features/home/components/HomeEmptyState";

export function HomeGate() {
  const status = useAuthStore((state) => state.status);

  if (status === "authenticated") return null;

  return <HomeEmptyState />;
}

