import { create } from "zustand";

type AuthStatus = "idle" | "authenticated" | "unauthenticated";

const AUTH_LOGOUT_FLAG_KEY = "auth.loggedOut";

function markLoggedOut() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_LOGOUT_FLAG_KEY, "1");
}

function clearLoggedOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_LOGOUT_FLAG_KEY);
}

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
  setAccessToken: (token) => {
    if (token) clearLoggedOut();

    set((state) => ({
      ...state,
      accessToken: token,
      status: token ? "authenticated" : "unauthenticated",
      user: token ? state.user : null,
    }));
  },
  setUser: (user) =>
    set((state) => ({
      ...state,
      user,
    })),
  logoutLocal: () => {
    markLoggedOut();
    set({
      accessToken: null,
      user: null,
      status: "unauthenticated",
    });
  },
}));

