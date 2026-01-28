"use client";

import { useMutation } from "@tanstack/react-query";
import type { RegisterFormData } from "@/lib/schemas";

async function registerApi(data: Omit<RegisterFormData, "confirmPassword">): Promise<void> {
  // TODO: remplacer par l'appel réel quand le backend auth sera prêt
  // const res = await fetch("/api/auth/register", { method: "POST", body: JSON.stringify(data), ... });
  // if (!res.ok) throw new Error(...);
  console.log("[register]", data);
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: registerApi,
  });
}
