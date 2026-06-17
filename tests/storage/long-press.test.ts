import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLongPress } from "@/features/storage/browse/hooks/useLongPress";

type Handler = (e: unknown) => void;
const pointer = (pointerType: "touch" | "mouse", clientX = 0, clientY = 0) =>
  ({ pointerType, clientX, clientY }) as unknown;

describe("useLongPress", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires after the duration on touch and suppresses the trailing click once", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, durationMs: 500 }),
    );

    act(() =>
      (result.current.handlers.onPointerDown as Handler)(pointer("touch")),
    );
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(500));
    expect(onLongPress).toHaveBeenCalledTimes(1);

    // The synthetic click is suppressed exactly once.
    expect(result.current.consumeSuppressedClick()).toBe(true);
    expect(result.current.consumeSuppressedClick()).toBe(false);
  });

  it("ignores mouse pointers so desktop drag-and-drop is untouched", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress }));

    act(() => {
      (result.current.handlers.onPointerDown as Handler)(pointer("mouse"));
      vi.advanceTimersByTime(1000);
    });
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("cancels when the finger moves beyond tolerance (a scroll)", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, durationMs: 500, moveTolerancePx: 10 }),
    );

    act(() => {
      (result.current.handlers.onPointerDown as Handler)(pointer("touch", 0, 0));
      (result.current.handlers.onPointerMove as Handler)(pointer("touch", 0, 40));
      vi.advanceTimersByTime(500);
    });
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("attaches no handlers when disabled", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ enabled: false, onLongPress }),
    );
    expect(result.current.handlers.onPointerDown).toBeUndefined();
    expect(result.current.consumeSuppressedClick()).toBe(false);
  });
});
