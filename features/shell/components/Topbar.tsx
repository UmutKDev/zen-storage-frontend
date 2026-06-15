"use client";

import { Menu, Search } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui";
import { NotificationBell } from "@/features/notifications";
import { JobsMenu } from "@/features/jobs";
import { useShellStore } from "../stores/shell.store";
import { ProfileMenu } from "./ProfileMenu";
import { ThemeToggle } from "./ThemeToggle";

/** Top navigation bar (glass-chrome). Hosts the mobile menu, the ⌘K search
 *  trigger, notifications, theme toggle, and profile menu. */
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

      {/* Search trigger — visual affordance; the command palette lands in its
          own phase (the click + ⌘K binding wire up there). */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => toast(t("storage.search.comingSoon"))}
        aria-label={t("storage.search.placeholder")}
        className="hidden w-64 justify-start gap-2 font-normal text-muted-foreground md:flex"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">{t("storage.search.placeholder")}</span>
        <kbd className="zs-menu-kbd">{t("storage.search.shortcut")}</kbd>
      </Button>

      <div className="flex-1" />

      <JobsMenu />
      <NotificationBell />
      <ThemeToggle />
      <ProfileMenu />
    </header>
  );
}
