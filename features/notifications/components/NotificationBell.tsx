"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { t } from "@/lib/i18n";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { NotificationPanel } from "./NotificationPanel";

/**
 * Topbar notification bell + unread-count badge. Opening the dropdown reveals
 * the Zen inbox panel; the list only fetches while open (the panel gates its
 * query on `open`). The badge count polls every 60s via `useUnreadCount`.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useUnreadCount();
  const count = data?.Count ?? 0;
  const label =
    count > 0
      ? `${t("account.shell.notifications.label")}, ${count} ${t("account.shell.notifications.unreadSuffix")}`
      : t("account.shell.notifications.label");

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
      <DropdownMenuContent
        align="end"
        className="w-[348px] p-0 zs-overlay-solid"
      >
        <NotificationPanel open={open} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
