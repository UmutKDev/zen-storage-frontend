"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";

interface LongPressOptions {
  /** Attach the handlers only when true (e.g. coarse pointer + selectable). */
  enabled?: boolean;
  durationMs?: number;
  /** Cancel if the finger moves more than this (a scroll, not a press). */
  moveTolerancePx?: number;
  onLongPress: () => void;
}

interface LongPressResult {
  handlers: {
    onPointerDown?: (e: ReactPointerEvent) => void;
    onPointerMove?: (e: ReactPointerEvent) => void;
    onPointerUp?: () => void;
    onPointerCancel?: () => void;
  };
  /** True (once) for the synthetic click that immediately follows a fired
   *  long-press — reading it resets the flag. Callers use it to suppress the
   *  trailing tap (navigation/selection). Reset lives in the hook so the
   *  returned value is never mutated from component code. */
  consumeSuppressedClick: () => boolean;
}

/**
 * Touch long-press detector. Touch-only (ignores mouse so desktop DnD — which
 * uses a MouseSensor — is unaffected), fires after `durationMs`, cancels on
 * scroll/move, and flags the trailing synthetic click so the press doesn't also
 * navigate or select.
 */
export function useLongPress({
  enabled = true,
  durationMs = 500,
  moveTolerancePx = 10,
  onLongPress,
}: LongPressOptions): LongPressResult {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    start.current = null;
  };

  const consumeSuppressedClick = () => {
    const fired = firedRef.current;
    firedRef.current = false;
    return fired;
  };

  if (!enabled) return { handlers: {}, consumeSuppressedClick };

  return {
    handlers: {
      onPointerDown: (e) => {
        if (e.pointerType !== "touch") return;
        firedRef.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        timer.current = setTimeout(() => {
          firedRef.current = true;
          onLongPress();
          clear();
        }, durationMs);
      },
      onPointerMove: (e) => {
        if (!start.current) return;
        if (
          Math.abs(e.clientX - start.current.x) > moveTolerancePx ||
          Math.abs(e.clientY - start.current.y) > moveTolerancePx
        ) {
          clear();
        }
      },
      onPointerUp: clear,
      onPointerCancel: clear,
    },
    consumeSuppressedClick,
  };
}
