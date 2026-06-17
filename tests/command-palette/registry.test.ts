import { describe, expect, it, vi } from "vitest";
import { getCommands, registerCommand, subscribe } from "@/lib/command-palette";

describe("command-palette registry", () => {
  it("registers, snapshots stably, and unregisters", () => {
    const dispose = registerCommand({
      id: "t:1",
      group: "actions",
      label: "One",
      run: () => {},
    });
    expect(getCommands().some((c) => c.id === "t:1")).toBe(true);
    // The snapshot reference is stable between mutations (useSyncExternalStore-safe).
    expect(getCommands()).toBe(getCommands());
    dispose();
    expect(getCommands().some((c) => c.id === "t:1")).toBe(false);
  });

  it("notifies subscribers on register and unregister", () => {
    const listener = vi.fn();
    const unsub = subscribe(listener);
    const dispose = registerCommand({
      id: "t:2",
      group: "actions",
      label: "Two",
      run: () => {},
    });
    expect(listener).toHaveBeenCalledTimes(1);
    dispose();
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
    registerCommand({
      id: "t:3",
      group: "actions",
      label: "Three",
      run: () => {},
    });
    expect(listener).toHaveBeenCalledTimes(2); // not notified after unsubscribe
  });

  it("a stale disposer never removes a replacement under the same id", () => {
    const disposeA = registerCommand({
      id: "dup",
      group: "actions",
      label: "A",
      run: () => {},
    });
    registerCommand({ id: "dup", group: "actions", label: "B", run: () => {} });
    disposeA(); // stale — must not evict the current "dup"
    const current = getCommands().filter((c) => c.id === "dup");
    expect(current).toHaveLength(1);
    expect(current[0]?.label).toBe("B");
  });
});
