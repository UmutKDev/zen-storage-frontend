"use client";

import { useSyncExternalStore } from "react";

/**
 * @deprecated The Zen preview lightbox uses **layout fullscreen** (a local
 * `layoutFullscreen` flag in `FilePreviewModal` that expands the shell to
 * 100vw×100vh) rather than the native Fullscreen API. These hooks are no longer
 * wired into the modal; kept here until a dedicated cleanup.
 */

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
