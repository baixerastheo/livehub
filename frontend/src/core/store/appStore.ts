import { create } from "zustand";

type AppState = {
  isSidebarOpen: boolean;
  isLoginModalOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: false,
  isLoginModalOpen: false,
  toggleSidebar: () =>
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    })),
  closeSidebar: () =>
    set({
      isSidebarOpen: false,
    }),
  openLoginModal: () =>
    set({
      isLoginModalOpen: true,
    }),
  closeLoginModal: () =>
    set({
      isLoginModalOpen: false,
    }),
}));

