"use client";

import { Bell } from "lucide-react";
import { t } from "@/lib/i18n";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useUnreadCount } from "../hooks/useUnreadCount";

/**
 * Topbar notification bell + unread-count badge. The inbox panel content lands
 * in Phase 6; for now the menu shows an empty state.
 */
export function NotificationBell() {
  const { data } = useUnreadCount();
  const count = data?.Count ?? 0;
  const label =
    count > 0
      ? `${t("account.shell.notifications.label")}, ${count} ${t("account.shell.notifications.unreadSuffix")}`
      : t("account.shell.notifications.label");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={label}
        >
          <Bell className="size-4" />
          {count > 0 && (
            <Badge
              variant="default"
              className="absolute -top-0.5 -right-0.5 size-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none shadow-[0_0_0_2px_var(--surface)]"
              aria-hidden
            >
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>
          {t("account.shell.notifications.label")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
          {t("account.shell.notifications.none")}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
