"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signIn, signUp, signOut } from "@/src/lib/auth-client";
import { disconnectSocket } from "@/src/lib/realtime/socketClient";
import { useAppStore } from "@/src/core/store/appStore";

interface Login { email: string; password: string }
interface Register { name: string; email: string; password: string }

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (credentials: Login) => {
      const result = await signIn.email({
        email: credentials.email,
        password: credentials.password,
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (credentials: Register  ) => {
      const result = await signUp.email({
        name: credentials.name,
        email: credentials.email,
        password: credentials.password,
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const resetOnLogout = useAppStore((s) => s.resetOnLogout);
  return useMutation({
    mutationFn: async () => {
      const result = await signOut();
      if (result.error) {
        throw new Error(result.error.message);
      }
      disconnectSocket();
      queryClient.clear();
      resetOnLogout();
      return result.data;
    },
  });
}
