"use client";

import type { ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Button, Logo } from "@/components/ui";
import { useShellStore } from "../stores/shell.store";
import { SidebarNav } from "./SidebarNav";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

/**
 * Persistent desktop sidebar (glass-chrome). Collapses to an icon rail; the
 * collapse toggle rides in the header row beside the logo. The `footer` slot
 * pins app-wide chrome (the storage-usage card) to the bottom — injected from
 * the app layer so the shell stays ignorant of the storage feature.
 */
export function Sidebar({ footer }: { footer?: ReactNode }) {
  const collapsed = useShellStore((s) => s.sidebarCollapsed);
  const toggle = useShellStore((s) => s.toggleSidebar);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "glass-chrome sticky top-0 hidden h-dvh shrink-0 flex-col gap-4 border-r p-3 transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-1 pt-1",
          collapsed ? "flex-col justify-center" : "justify-between",
        )}
      >
        <Logo wordmark={!collapsed} />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          aria-label={
            collapsed ? t("account.shell.expand") : t("account.shell.collapse")
          }
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>

      <WorkspaceSwitcher collapsed={collapsed} />
      <SidebarNav collapsed={collapsed} />

      {footer ? <div className="mt-auto">{footer}</div> : null}
    </aside>
  );
}
