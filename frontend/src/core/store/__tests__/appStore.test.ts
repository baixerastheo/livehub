import { useAppStore } from "../appStore";

const initialState = {
  isSidebarOpen: false,
  isSidebarRailOpen: false,
  isDetailPanelOpen: false,
  sidebarSection: "conversation" as const,
  selectedServerId: null,
  accountModal: { isOpen: false, section: "profile" as const },
  profileMenu: { isOpen: false },
};

beforeEach(() => {
  useAppStore.setState(initialState);
});

describe("sidebar", () => {
  it("toggleSidebar opens when closed", () => {
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().isSidebarOpen).toBe(true);
  });

  it("toggleSidebar closes when open", () => {
    useAppStore.setState({ isSidebarOpen: true });
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().isSidebarOpen).toBe(false);
  });

  it("openSidebar closes detail panel", () => {
    useAppStore.setState({ isDetailPanelOpen: true });
    useAppStore.getState().openSidebar();
    expect(useAppStore.getState().isSidebarOpen).toBe(true);
    expect(useAppStore.getState().isDetailPanelOpen).toBe(false);
  });

  it("closeSidebar sets isSidebarOpen to false", () => {
    useAppStore.setState({ isSidebarOpen: true });
    useAppStore.getState().closeSidebar();
    expect(useAppStore.getState().isSidebarOpen).toBe(false);
  });
});

describe("sidebarRail", () => {
  it("toggleSidebarRail toggles the value", () => {
    useAppStore.getState().toggleSidebarRail();
    expect(useAppStore.getState().isSidebarRailOpen).toBe(true);
    useAppStore.getState().toggleSidebarRail();
    expect(useAppStore.getState().isSidebarRailOpen).toBe(false);
  });

  it("openSidebarRail sets to true", () => {
    useAppStore.getState().openSidebarRail();
    expect(useAppStore.getState().isSidebarRailOpen).toBe(true);
  });

  it("closeSidebarRail sets to false", () => {
    useAppStore.setState({ isSidebarRailOpen: true });
    useAppStore.getState().closeSidebarRail();
    expect(useAppStore.getState().isSidebarRailOpen).toBe(false);
  });
});

describe("detail panel", () => {
  it("openDetailPanel opens panel and closes sidebars", () => {
    useAppStore.setState({ isSidebarOpen: true, isSidebarRailOpen: true });
    useAppStore.getState().openDetailPanel();
    const state = useAppStore.getState();
    expect(state.isDetailPanelOpen).toBe(true);
    expect(state.isSidebarOpen).toBe(false);
    expect(state.isSidebarRailOpen).toBe(false);
  });

  it("closeDetailPanel closes the panel", () => {
    useAppStore.setState({ isDetailPanelOpen: true });
    useAppStore.getState().closeDetailPanel();
    expect(useAppStore.getState().isDetailPanelOpen).toBe(false);
  });

  it("toggleDetailPanel opens when closed", () => {
    useAppStore.getState().toggleDetailPanel();
    expect(useAppStore.getState().isDetailPanelOpen).toBe(true);
  });

  it("toggleDetailPanel closes sidebar when opening panel", () => {
    useAppStore.setState({ isSidebarOpen: true });
    useAppStore.getState().toggleDetailPanel();
    expect(useAppStore.getState().isDetailPanelOpen).toBe(true);
    expect(useAppStore.getState().isSidebarOpen).toBe(false);
  });
});

describe("mobile sidebars", () => {
  it("toggleMobileSidebars opens both when closed", () => {
    useAppStore.getState().toggleMobileSidebars();
    const state = useAppStore.getState();
    expect(state.isSidebarOpen).toBe(true);
    expect(state.isSidebarRailOpen).toBe(true);
  });

  it("closeMobileSidebars closes both sidebars", () => {
    useAppStore.setState({ isSidebarOpen: true, isSidebarRailOpen: true });
    useAppStore.getState().closeMobileSidebars();
    const state = useAppStore.getState();
    expect(state.isSidebarOpen).toBe(false);
    expect(state.isSidebarRailOpen).toBe(false);
  });
});

describe("sidebar section", () => {
  it("setSidebarSection updates the section", () => {
    useAppStore.getState().setSidebarSection("teams");
    expect(useAppStore.getState().sidebarSection).toBe("teams");
  });

  it("setSidebarSection accepts all valid values", () => {
    useAppStore.getState().setSidebarSection("activity");
    expect(useAppStore.getState().sidebarSection).toBe("activity");
    useAppStore.getState().setSidebarSection("conversation");
    expect(useAppStore.getState().sidebarSection).toBe("conversation");
  });
});

describe("selected server", () => {
  it("setSelectedServerId updates the id", () => {
    useAppStore.getState().setSelectedServerId(42);
    expect(useAppStore.getState().selectedServerId).toBe(42);
  });

  it("setSelectedServerId accepts null", () => {
    useAppStore.setState({ selectedServerId: 42 });
    useAppStore.getState().setSelectedServerId(null);
    expect(useAppStore.getState().selectedServerId).toBeNull();
  });
});

describe("account modal", () => {
  it("openAccountModal opens with default profile section", () => {
    useAppStore.getState().openAccountModal();
    const { accountModal } = useAppStore.getState();
    expect(accountModal.isOpen).toBe(true);
    expect(accountModal.section).toBe("profile");
  });

  it("openAccountModal opens with specified section", () => {
    useAppStore.getState().openAccountModal("settings");
    expect(useAppStore.getState().accountModal.section).toBe("settings");
  });

  it("closeAccountModal closes and resets to profile section", () => {
    useAppStore.setState({ accountModal: { isOpen: true, section: "settings" } });
    useAppStore.getState().closeAccountModal();
    const { accountModal } = useAppStore.getState();
    expect(accountModal.isOpen).toBe(false);
    expect(accountModal.section).toBe("profile");
  });

  it("setAccountModalSection changes section without closing", () => {
    useAppStore.setState({ accountModal: { isOpen: true, section: "profile" } });
    useAppStore.getState().setAccountModalSection("settings");
    const { accountModal } = useAppStore.getState();
    expect(accountModal.isOpen).toBe(true);
    expect(accountModal.section).toBe("settings");
  });
});

describe("profile menu", () => {
  it("openProfileMenu opens it", () => {
    useAppStore.getState().openProfileMenu();
    expect(useAppStore.getState().profileMenu.isOpen).toBe(true);
  });

  it("closeProfileMenu closes it", () => {
    useAppStore.setState({ profileMenu: { isOpen: true } });
    useAppStore.getState().closeProfileMenu();
    expect(useAppStore.getState().profileMenu.isOpen).toBe(false);
  });

  it("toggleProfileMenu toggles the value", () => {
    useAppStore.getState().toggleProfileMenu();
    expect(useAppStore.getState().profileMenu.isOpen).toBe(true);
    useAppStore.getState().toggleProfileMenu();
    expect(useAppStore.getState().profileMenu.isOpen).toBe(false);
  });
});

describe("resetOnLogout", () => {
  it("resets all state to defaults", () => {
    useAppStore.setState({
      selectedServerId: 42,
      isSidebarOpen: true,
      isSidebarRailOpen: true,
      isDetailPanelOpen: true,
      sidebarSection: "teams",
      profileMenu: { isOpen: true },
      accountModal: { isOpen: true, section: "settings" },
    });
    useAppStore.getState().resetOnLogout();
    const state = useAppStore.getState();
    expect(state.selectedServerId).toBeNull();
    expect(state.isSidebarOpen).toBe(false);
    expect(state.isSidebarRailOpen).toBe(false);
    expect(state.isDetailPanelOpen).toBe(false);
    expect(state.sidebarSection).toBe("conversation");
    expect(state.profileMenu.isOpen).toBe(false);
    expect(state.accountModal.isOpen).toBe(false);
    expect(state.accountModal.section).toBe("profile");
  });
});
