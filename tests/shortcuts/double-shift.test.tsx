import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useShortcutDispatcher } from "@/lib/shortcuts/useShortcutDispatcher";
import { registerShortcut } from "@/lib/shortcuts/registry";

const run = vi.fn();
let dispose: () => void;

beforeEach(() => {
  run.mockClear();
  dispose = registerShortcut({
    id: "test.reveal",
    keys: "shift+shift",
    scope: "storage",
    description: "Reveal",
    run,
  });
  renderHook(() => useShortcutDispatcher());
});
afterEach(() => dispose());

function dispatchKey(
  target: EventTarget,
  key: string,
  timeStamp: number,
  opts: KeyboardEventInit = {},
) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, ...opts });
  Object.defineProperty(event, "timeStamp", { value: timeStamp, configurable: true });
  target.dispatchEvent(event);
}

describe("double-tap Shift → shift+shift", () => {
  it("fires on two quick bare Shift taps", () => {
    dispatchKey(document.body, "Shift", 100);
    dispatchKey(document.body, "Shift", 300);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("does not fire when the taps are too far apart (>400ms)", () => {
    dispatchKey(document.body, "Shift", 100);
    dispatchKey(document.body, "Shift", 900);
    expect(run).not.toHaveBeenCalled();
  });

  it("does not fire when another key intervenes", () => {
    dispatchKey(document.body, "Shift", 100);
    dispatchKey(document.body, "a", 150);
    dispatchKey(document.body, "Shift", 200);
    expect(run).not.toHaveBeenCalled();
  });

  it("does not fire while typing in an input (Shift = capitals)", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    dispatchKey(input, "Shift", 100);
    dispatchKey(input, "Shift", 200);
    expect(run).not.toHaveBeenCalled();
    input.remove();
  });

  it("does not fire on a held Shift (repeat)", () => {
    dispatchKey(document.body, "Shift", 100, { repeat: true });
    dispatchKey(document.body, "Shift", 200, { repeat: true });
    expect(run).not.toHaveBeenCalled();
  });
});
