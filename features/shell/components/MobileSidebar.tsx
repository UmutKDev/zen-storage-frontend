"use client";

import {
  Logo,
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
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <WorkspaceSwitcher />
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
