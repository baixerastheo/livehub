import { create } from "zustand";

type AppState = {
  isSidebarOpen: boolean;
  authModal: {
    isOpen: boolean;
    mode: "login" | "register";
  };
  profileMenu: {
    isOpen: boolean;
  };
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openAuthModal: (mode: "login" | "register") => void;
  closeAuthModal: () => void;
  openProfileMenu: () => void;
  closeProfileMenu: () => void;
  toggleProfileMenu: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: false,
  authModal: {
    isOpen: false,
    mode: "login",
  },
  profileMenu: {
    isOpen: false,
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
  openProfileMenu: () =>
    set({
      profileMenu: {
        isOpen: true,
      },
    }),
  closeProfileMenu: () =>
    set({
      profileMenu: {
        isOpen: false,
      },
    }),
  toggleProfileMenu: () =>
    set((state) => ({
      profileMenu: {
        isOpen: !state.profileMenu.isOpen,
      },
    })),
}));

