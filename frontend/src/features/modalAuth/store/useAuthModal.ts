import { create } from "zustand";

type AuthModalState = {
  isOpen: boolean;
  mode: "login" | "register";
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
  toggleMode: () => void;
};

export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: "login",
  openLogin: () => set({ isOpen: true, mode: "login" }),
  openRegister: () => set({ isOpen: true, mode: "register" }),
  close: () => set({ isOpen: false }),
  toggleMode: () => set((state) => ({
    mode: state.mode === "login" ? "register" : "login"
  })),
}));
