import { create } from "zustand";

export type AccountModalSection = "profile" | "settings";
export type SidebarSection = "activity" | "conversation" | "teams";

type AppState = {
  isSidebarOpen: boolean;
  isSidebarRailOpen: boolean;
  isDetailPanelOpen: boolean;
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
  openDetailPanel: () => void;
  closeDetailPanel: () => void;
  toggleDetailPanel: () => void;
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
  resetOnLogout: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: false,
  isSidebarRailOpen: false,
  isDetailPanelOpen: typeof window !== "undefined" && window.innerWidth > 980,
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
      isDetailPanelOpen: state.isSidebarOpen ? state.isDetailPanelOpen : false,
    })),
  openSidebar: () =>
    set({ isSidebarOpen: true, isDetailPanelOpen: false }),
  closeSidebar: () =>
    set({ isSidebarOpen: false }),
  openDetailPanel: () =>
    set({ isDetailPanelOpen: true, isSidebarOpen: false, isSidebarRailOpen: false }),
  closeDetailPanel: () =>
    set({ isDetailPanelOpen: false }),
  toggleDetailPanel: () =>
    set((state) => ({
      isDetailPanelOpen: !state.isDetailPanelOpen,
      isSidebarOpen: state.isDetailPanelOpen ? state.isSidebarOpen : false,
      isSidebarRailOpen: state.isDetailPanelOpen ? state.isSidebarRailOpen : false,
    })),
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
        isDetailPanelOpen: shouldOpen ? false : state.isDetailPanelOpen,
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
  resetOnLogout: () =>
    set({
      selectedServerId: null,
      isSidebarOpen: false,
      isSidebarRailOpen: false,
      isDetailPanelOpen: false,
      sidebarSection: "conversation",
      profileMenu: { isOpen: false },
      accountModal: { isOpen: false, section: "profile" },
    }),
}));

