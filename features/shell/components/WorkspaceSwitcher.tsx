"use client";

import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

/**
 * Workspace switcher SLOT. Inert at MVP — it shows the current (Personal)
 * workspace but offers no switching. Phase 8 activates the team switch here,
 * driven by `stores/workspace.store.ts`.
 */
export function WorkspaceSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-md border border-border bg-surface px-2.5 py-2 text-sm shadow-[inset_0_1px_0_0_var(--glass-highlight),var(--shadow-e1)]",
        collapsed && "justify-center px-0",
      )}
      aria-label={t("account.shell.workspace.label")}
    >
      <span className="zs-tile-icon zs-tone-brand size-7 shrink-0">
        <Folder className="size-4" />
      </span>
      {!collapsed && (
        <span className="truncate font-semibold tracking-[-0.01em] text-foreground">
          {t("account.shell.workspace.personal")}
        </span>
      )}
    </div>
  );
}
