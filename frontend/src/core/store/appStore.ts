import { create } from "zustand";

export type AccountModalSection = "profile" | "settings";
export type SidebarSection = "activity" | "conversation" | "teams";

type AppState = {
  isSidebarOpen: boolean;
  isSidebarRailOpen: boolean;
  sidebarSection: SidebarSection;
  selectedServerId: number | null;
  accountModal: {
    isOpen: boolean;
    section: AccountModalSection;
  };
  profileMenu: {
    isOpen: boolean;
  };
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebarRail: () => void;
  openSidebarRail: () => void;
  closeSidebarRail: () => void;
  setSidebarSection: (section: SidebarSection) => void;
  setSelectedServerId: (serverId: number | null) => void;
  toggleMobileSidebars: () => void;
  closeMobileSidebars: () => void;
  openAccountModal: (section?: AccountModalSection) => void;
  closeAccountModal: () => void;
  setAccountModalSection: (section: AccountModalSection) => void;
  openProfileMenu: () => void;
  closeProfileMenu: () => void;
  toggleProfileMenu: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: false,
  isSidebarRailOpen: false,
  sidebarSection: "conversation",
  selectedServerId: null,
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
  openSidebar: () =>
    set({
      isSidebarOpen: true,
    }),
  closeSidebar: () =>
    set({
      isSidebarOpen: false,
    }),
  toggleSidebarRail: () =>
    set((state) => ({
      isSidebarRailOpen: !state.isSidebarRailOpen,
    })),
  openSidebarRail: () =>
    set({
      isSidebarRailOpen: true,
    }),
  closeSidebarRail: () =>
    set({
      isSidebarRailOpen: false,
    }),
  setSidebarSection: (section) =>
    set({
      sidebarSection: section,
    }),
  setSelectedServerId: (serverId) =>
    set({
      selectedServerId: serverId,
    }),
  toggleMobileSidebars: () =>
    set((state) => {
      const shouldOpen = !state.isSidebarRailOpen || !state.isSidebarOpen;

      return {
        isSidebarRailOpen: shouldOpen,
        isSidebarOpen: shouldOpen,
      };
    }),
  closeMobileSidebars: () =>
    set({
      isSidebarRailOpen: false,
      isSidebarOpen: false,
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

