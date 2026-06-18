"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ControlsApi } from "../components/player/PlayerContext";

const IDLE_MS = 2500;

/**
 * Auto-hide the control bar after inactivity **while playing**; always visible
 * when paused (`visible` is derived from `active`, so the paused-reveal needs no
 * state write — and the effect only *schedules* the hide via a timer, never sets
 * state synchronously). `show()` — called on pointer move / key activity — reveals
 * the bar and re-arms the idle timer. Pairs with a `cursor: none` CSS rule keyed
 * off `data-controls="false"` in fullscreen.
 */
export function useControlsVisibility({
  active,
}: {
  /** True when the controls should be allowed to auto-hide (i.e. playing). */
  active: boolean;
}): ControlsApi {
  const [idleHidden, setIdleHidden] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const show = useCallback(() => {
    clear();
    setIdleHidden(false);
    if (active) timer.current = setTimeout(() => setIdleHidden(true), IDLE_MS);
  }, [active, clear]);

  // Arm the idle countdown while playing; cancel it when paused / on unmount.
  // No synchronous setState — the hide fires from the timer callback, and the
  // reveal is handled by `show()` (user input) + the `active` derive below.
  useEffect(() => {
    clear();
    if (active) timer.current = setTimeout(() => setIdleHidden(true), IDLE_MS);
    return clear;
  }, [active, clear]);

  return { visible: active ? !idleHidden : true, show };
}
