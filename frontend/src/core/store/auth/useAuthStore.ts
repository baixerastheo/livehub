import { create } from "zustand";

type AuthStatus = "idle" | "authenticated" | "unauthenticated";

export interface AuthUser {
  id: number;
  email: string;
  username: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  logoutLocal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: "idle",
  setAccessToken: (token) =>
    set((state) => ({
      ...state,
      accessToken: token,
      status: token ? "authenticated" : "unauthenticated",
    })),
  setUser: (user) =>
    set((state) => ({
      ...state,
      user,
    })),
  logoutLocal: () =>
    set({
      accessToken: null,
      user: null,
      status: "unauthenticated",
    }),
}));

