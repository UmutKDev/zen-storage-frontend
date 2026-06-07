"use client";

import { t } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui";
import { useShellStore } from "../stores/shell.store";
import { SidebarNav } from "./SidebarNav";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

/** Mobile navigation drawer (glass-overlay Sheet). Controlled by the store; the
 *  Topbar menu button opens it. Closes on navigation; Radix restores focus. */
export function MobileSidebar() {
  const open = useShellStore((s) => s.mobileNavOpen);
  const setOpen = useShellStore((s) => s.setMobileNavOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-72 gap-4 p-4">
        <SheetHeader className="p-0">
          <SheetTitle className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground">
              S
            </span>
            {t("common.appName")}
          </SheetTitle>
        </SheetHeader>
        <WorkspaceSwitcher />
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
