"use client";

import { Menu } from "lucide-react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui";
import { NotificationBell } from "@/features/notifications";
import { useShellStore } from "../stores/shell.store";
import { ProfileMenu } from "./ProfileMenu";
import { ThemeToggle } from "./ThemeToggle";

/** Top navigation bar (glass-chrome). Hosts the mobile menu, notifications,
 *  theme toggle, and profile menu. The breadcrumb/search slot fills in P3. */
export function Topbar() {
  const setMobileNavOpen = useShellStore((s) => s.setMobileNavOpen);

  return (
    <header className="glass-chrome sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label={t("account.shell.openMenu")}
      >
        <Menu className="size-5" />
      </Button>

      {/* Breadcrumb / command-search slot — filled in Phase 3. */}
      <div className="flex-1" />

      <NotificationBell />
      <ThemeToggle />
      <ProfileMenu />
    </header>
  );
}
