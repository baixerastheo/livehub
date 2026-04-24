import { useToastStore } from "../useToastStore";

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe("push", () => {
  it("adds a toast to the list", () => {
    useToastStore.getState().push({ type: "info", message: "Hello" });
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it("assigns a unique id to each toast", () => {
    useToastStore.getState().push({ type: "info", message: "First" });
    useToastStore.getState().push({ type: "info", message: "Second" });
    const { toasts } = useToastStore.getState();
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });

  it("preserves type and message", () => {
    useToastStore.getState().push({ type: "error", message: "Something went wrong" });
    const toast = useToastStore.getState().toasts[0];
    expect(toast.type).toBe("error");
    expect(toast.message).toBe("Something went wrong");
  });

  it("keeps only the last 4 toasts", () => {
    for (let i = 0; i < 6; i++) {
      useToastStore.getState().push({ type: "info", message: `Toast ${i}` });
    }
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(4);
    expect(toasts[3].message).toBe("Toast 5");
  });

  it("accepts all toast types", () => {
    useToastStore.getState().push({ type: "info", message: "Info" });
    useToastStore.getState().push({ type: "success", message: "Success" });
    useToastStore.getState().push({ type: "error", message: "Error" });
    const { toasts } = useToastStore.getState();
    expect(toasts.map((t) => t.type)).toEqual(["info", "success", "error"]);
  });
});

describe("dismiss", () => {
  it("removes the toast with the given id", () => {
    useToastStore.getState().push({ type: "info", message: "Hello" });
    const { toasts } = useToastStore.getState();
    const id = toasts[0].id;
    useToastStore.getState().dismiss(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("removes only the targeted toast", () => {
    useToastStore.getState().push({ type: "info", message: "First" });
    useToastStore.getState().push({ type: "info", message: "Second" });
    const { toasts } = useToastStore.getState();
    useToastStore.getState().dismiss(toasts[0].id);
    const remaining = useToastStore.getState().toasts;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe("Second");
  });

  it("does nothing if id does not exist", () => {
    useToastStore.getState().push({ type: "info", message: "Hello" });
    useToastStore.getState().dismiss("nonexistent-id");
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });
});
