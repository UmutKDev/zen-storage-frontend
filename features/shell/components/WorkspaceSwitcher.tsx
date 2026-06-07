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
        "flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm",
        collapsed && "justify-center px-0",
      )}
      aria-label={t("account.shell.workspace.label")}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Folder className="size-3.5" />
      </span>
      {!collapsed && (
        <span className="truncate font-medium text-foreground">
          {t("account.shell.workspace.personal")}
        </span>
      )}
    </div>
  );
}
