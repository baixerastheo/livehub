"use client";

import { useMutation } from "@tanstack/react-query";
import type { LoginFormData } from "@/lib/schemas";

async function loginApi(data: LoginFormData): Promise<void> {
  // TODO: remplacer par l'appel réel quand le backend auth sera prêt
  // const res = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify(data), ... });
  // if (!res.ok) throw new Error(...);
  console.log("[login]", data);
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: loginApi,
  });
}
