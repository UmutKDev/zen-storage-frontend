"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(pointer: coarse)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.matchMedia) &&
    window.matchMedia(QUERY).matches
  );
}

/**
 * True when the primary pointer is coarse (touch). Subscribes via
 * `useSyncExternalStore` (SSR-safe — false on the server / first paint) so it's
 * lint-clean and re-renders on device changes. Gates the long-press →
 * bottom-sheet path so it attaches only on touch, leaving desktop DnD untouched.
 */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
