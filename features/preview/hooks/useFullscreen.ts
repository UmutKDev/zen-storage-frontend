"use client";

import { useSyncExternalStore } from "react";

/** Whether the Fullscreen API is available (false on the server + iOS Safari). */
export function useFullscreenEnabled(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => Boolean(document.fullscreenEnabled),
    () => false,
  );
}

/** Whether a fullscreen element is currently active (tracks `fullscreenchange`). */
export function useIsFullscreen(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      document.addEventListener("fullscreenchange", onChange);
      return () => document.removeEventListener("fullscreenchange", onChange);
    },
    () => Boolean(document.fullscreenElement),
    () => false,
  );
}
