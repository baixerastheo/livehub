import { useAuthModal } from "../useAuthModal";

beforeEach(() => {
  useAuthModal.setState({ isOpen: false, mode: "login" });
});

describe("openLogin", () => {
  it("opens the modal in login mode", () => {
    useAuthModal.getState().openLogin();
    const state = useAuthModal.getState();
    expect(state.isOpen).toBe(true);
    expect(state.mode).toBe("login");
  });

  it("switches to login mode even if register was active", () => {
    useAuthModal.setState({ isOpen: true, mode: "register" });
    useAuthModal.getState().openLogin();
    expect(useAuthModal.getState().mode).toBe("login");
  });
});

describe("openRegister", () => {
  it("opens the modal in register mode", () => {
    useAuthModal.getState().openRegister();
    const state = useAuthModal.getState();
    expect(state.isOpen).toBe(true);
    expect(state.mode).toBe("register");
  });
});

describe("close", () => {
  it("closes the modal", () => {
    useAuthModal.setState({ isOpen: true, mode: "login" });
    useAuthModal.getState().close();
    expect(useAuthModal.getState().isOpen).toBe(false);
  });

  it("does not change mode when closing", () => {
    useAuthModal.setState({ isOpen: true, mode: "register" });
    useAuthModal.getState().close();
    expect(useAuthModal.getState().mode).toBe("register");
  });
});

describe("toggleMode", () => {
  it("switches from login to register", () => {
    useAuthModal.setState({ mode: "login" });
    useAuthModal.getState().toggleMode();
    expect(useAuthModal.getState().mode).toBe("register");
  });

  it("switches from register to login", () => {
    useAuthModal.setState({ mode: "register" });
    useAuthModal.getState().toggleMode();
    expect(useAuthModal.getState().mode).toBe("login");
  });

  it("does not affect isOpen", () => {
    useAuthModal.setState({ isOpen: true, mode: "login" });
    useAuthModal.getState().toggleMode();
    expect(useAuthModal.getState().isOpen).toBe(true);
  });
});
