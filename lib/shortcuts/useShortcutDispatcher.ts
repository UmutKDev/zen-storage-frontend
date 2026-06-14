"use client";

import { useEffect } from "react";
import { getShortcuts } from "./registry";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('input, textarea, [contenteditable="true"]'));
}

function isInOverlay(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest('[role="dialog"], [role="alertdialog"], [role="menu"]'),
  );
}

/**
 * Map a keyboard event to a registry combo string (the `Shortcut.keys` grammar:
 * `mod+<key>`, `/`, `?`). Generic over `mod + letter` so any registered binding
 * (⌘K, ⌘U, …) resolves; the dispatcher only acts when a binding actually exists,
 * so unbound combos (⌘C/⌘V/⌘[) fall through to the browser untouched.
 */
function comboFor(e: KeyboardEvent): string | null {
  if (e.altKey) return null;
  const mod = e.metaKey || e.ctrlKey;
  if (e.key === "?") return "?"; // shift+/ on most layouts
  if (!mod) {
    return e.key === "/" ? "/" : null;
  }
  const key = e.key.toLowerCase();
  if (/^[a-z]$/.test(key)) return `mod+${key}`;
  if (e.key === "\\") return "mod+\\"; // sidebar (⌘[ / ⌘] left to the browser)
  return null;
}

/**
 * The single central keydown handler for the app's keyboard shortcuts — reads
 * the `lib/shortcuts` registry and fires the matching binding's `run()`. Scope
 * is handled by presence: a binding is registered only while its surface is
 * mounted (e.g. `/` focus-search lives on the storage screen). Bare keys (`/`,
 * `?`) never fire while typing or inside an overlay; modifier combos (⌘K, …) are
 * accelerators that work everywhere.
 */
/** Window for a `⇧⇧` double-tap (ms). */
const DOUBLE_SHIFT_MS = 400;

export function useShortcutDispatcher(): void {
  useEffect(() => {
    // Stateful `shift+shift` double-tap detection — a gesture `comboFor` can't
    // express. Only *bare* Shift taps count (no other modifier, not held, not
    // while typing / in an overlay), and any intervening non-Shift key breaks
    // the window — so typing capitals never triggers it.
    let lastShiftAt = 0;
    let brokenSinceShift = false;

    const run = (combo: string): boolean => {
      const match = getShortcuts().find((s) => s.keys === combo);
      if (!match) return false;
      match.run();
      return true;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;

      if (e.key === "Shift") {
        const bare =
          !e.metaKey &&
          !e.ctrlKey &&
          !e.altKey &&
          !e.repeat &&
          !isEditableTarget(e.target) &&
          !isInOverlay(e.target);
        if (!bare) {
          lastShiftAt = 0;
          return;
        }
        if (
          !brokenSinceShift &&
          lastShiftAt > 0 &&
          e.timeStamp - lastShiftAt < DOUBLE_SHIFT_MS
        ) {
          if (run("shift+shift")) e.preventDefault();
          lastShiftAt = 0;
        } else {
          lastShiftAt = e.timeStamp;
        }
        brokenSinceShift = false;
        return;
      }

      // Any non-Shift key breaks the double-tap window.
      brokenSinceShift = true;

      const combo = comboFor(e);
      if (!combo) return;

      const isModCombo = combo.startsWith("mod+");
      if (
        !isModCombo &&
        (isEditableTarget(e.target) || isInOverlay(e.target))
      ) {
        return;
      }

      const match = getShortcuts().find((s) => s.keys === combo);
      if (!match) return;
      e.preventDefault();
      match.run();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
