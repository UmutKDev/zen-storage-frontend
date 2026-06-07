"use client";

import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Button, Separator } from "@/components/ui";
import { useShellStore } from "../stores/shell.store";
import { SidebarNav } from "./SidebarNav";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

/** Persistent desktop sidebar (glass-chrome). Collapses to an icon rail. */
export function Sidebar() {
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
          "flex items-center gap-2 px-1 py-1",
          collapsed && "justify-center",
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground">
          S
        </span>
        {!collapsed && (
          <span className="font-semibold tracking-tight text-foreground">
            {t("common.appName")}
          </span>
        )}
      </div>

      <WorkspaceSwitcher collapsed={collapsed} />
      <Separator />
      <SidebarNav collapsed={collapsed} />

      <div className="mt-auto">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={toggle}
          aria-label={
            collapsed ? t("account.shell.expand") : t("account.shell.collapse")
          }
          className={cn("w-full", collapsed && "w-auto")}
        >
          <PanelLeft className="size-4" />
          {!collapsed && <span>{t("account.shell.collapse")}</span>}
        </Button>
      </div>
    </aside>
  );
}
