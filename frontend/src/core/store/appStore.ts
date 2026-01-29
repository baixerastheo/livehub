import { create } from "zustand";

export type AccountModalSection = "profile" | "friends" | "settings";

type AppState = {
  isSidebarOpen: boolean;
  authModal: {
    isOpen: boolean;
    mode: "login" | "register";
  };
  accountModal: {
    isOpen: boolean;
    section: AccountModalSection;
  };
  profileMenu: {
    isOpen: boolean;
  };
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openAuthModal: (mode: "login" | "register") => void;
  closeAuthModal: () => void;
  openAccountModal: (section?: AccountModalSection) => void;
  closeAccountModal: () => void;
  setAccountModalSection: (section: AccountModalSection) => void;
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
  accountModal: {
    isOpen: false,
    section: "profile",
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
  openAccountModal: (section = "profile") =>
    set({
      accountModal: {
        isOpen: true,
        section,
      },
    }),
  closeAccountModal: () =>
    set({
      accountModal: {
        isOpen: false,
        section: "profile",
      },
    }),
  setAccountModalSection: (section) =>
    set((state) => ({
      accountModal: {
        ...state.accountModal,
        section,
      },
    })),
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

