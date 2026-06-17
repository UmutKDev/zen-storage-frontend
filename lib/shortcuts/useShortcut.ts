"use client";

import { useEffect } from "react";
import { registerShortcut, type Shortcut } from "./registry";

/** Register a keyboard shortcut for the lifetime of the calling component. */
export function useShortcut(shortcut: Shortcut): void {
  useEffect(() => registerShortcut(shortcut), [shortcut]);
}
