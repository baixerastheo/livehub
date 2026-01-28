import { create } from "zustand";

type AppState = {
  isSidebarOpen: boolean;
  authModal: {
    isOpen: boolean;
    mode: "login" | "register";
  };
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openAuthModal: (mode: "login" | "register") => void;
  closeAuthModal: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: false,
  authModal: {
    isOpen: false,
    mode: "login",
  },
  toggleSidebar: () =>
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    })),
  closeSidebar: () =>
    set({
      isSidebarOpen: false,
    }),
  openAuthModal: (mode) =>
    set({
      authModal: {
        isOpen: true,
        mode,
      },
    }),
  closeAuthModal: () =>
    set({
      authModal: {
        isOpen: false,
        mode: "login",
      },
    }),
}));

