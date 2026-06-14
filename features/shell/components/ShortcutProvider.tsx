"use client";

import { useMemo } from "react";
import { t } from "@/lib/i18n";
import { useShortcut, useShortcutDispatcher, type Shortcut } from "@/lib/shortcuts";
import { useUiStore } from "@/stores";
import { useShellStore } from "../stores/shell.store";

/**
 * Mounts the single central keyboard dispatcher and registers the app-wide
 * (global-scope) shortcuts. Surface-specific bindings (e.g. `/` on storage)
 * register themselves where they live. Renders nothing — the help overlay and
 * palette are separate components. `run` reads stores via `getState()` so the
 * bindings stay stable (no re-registration churn).
 */
export function ShortcutProvider() {
  useShortcutDispatcher();

  useShortcut(
    useMemo<Shortcut>(
      () => ({
        id: "global.command-palette",
        keys: "mod+k",
        scope: "global",
        description: t("shortcuts.openPalette"),
        run: () => useUiStore.getState().toggleCommandPalette(),
      }),
      [],
    ),
  );
  useShortcut(
    useMemo<Shortcut>(
      () => ({
        id: "global.help",
        keys: "?",
        scope: "global",
        description: t("shortcuts.showHelp"),
        run: () => useUiStore.getState().openHelp(),
      }),
      [],
    ),
  );
  useShortcut(
    useMemo<Shortcut>(
      () => ({
        id: "global.toggle-sidebar",
        keys: "mod+\\",
        scope: "global",
        description: t("shortcuts.toggleSidebar"),
        run: () => useShellStore.getState().toggleSidebar(),
      }),
      [],
    ),
  );

  return null;
}
