"use client";

import { DropdownMenuItem } from "@/components/ui";
import { cn, formatRelativeTime, toneClass } from "@/lib/utils";
import type { NotificationHistoryItemModel } from "@/service/models";
import { notificationMeta } from "../lib/notificationMeta";

/**
 * One inbox row: a tone-tinted icon tile (reusing `.zs-tile-icon` + `toneClass`,
 * same as the upload tray) + title/time + a clamped message, with an unread
 * accent fill + trailing dot. It's a `DropdownMenuItem` so it stays in the menu's
 * keyboard model, but `onSelect` is prevented so a click marks it read **in
 * place** without closing the panel.
 */
export function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: NotificationHistoryItemModel;
  onMarkRead: (id: string) => void;
}) {
  const meta = notificationMeta(notification.Type);
  const Icon = meta.icon;
  const unread = !notification.IsRead;

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        if (unread) onMarkRead(notification.Id);
      }}
      className={cn(
        "items-start gap-3 rounded-md px-2 py-2",
        unread && "cursor-pointer bg-accent/60",
      )}
    >
      <span
        className={cn(
          "zs-tile-icon size-[30px] shrink-0 [&>svg]:size-4",
          toneClass(meta.tone),
        )}
        aria-hidden
      >
        {/* `text-current` opts the tile icon out of the menu-item's muted svg
            rule so it keeps its tone color (inherited from the tile). */}
        <Icon className="text-current" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm text-foreground",
              unread ? "font-semibold" : "font-medium",
            )}
          >
            {notification.Title}
          </span>
          <span className="shrink-0 text-[11px] whitespace-nowrap text-muted-foreground">
            {formatRelativeTime(notification.CreatedAt)}
          </span>
        </span>
        <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
          {notification.Message}
        </span>
      </span>
      {unread ? (
        <span
          aria-hidden
          className="mt-1 size-[7px] shrink-0 rounded-full bg-primary"
        />
      ) : null}
    </DropdownMenuItem>
  );
}
