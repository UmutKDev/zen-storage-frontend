"use client";

import {
  DropdownMenuItem,
  ScrollArea,
  ScrollBar,
  Separator,
  Skeleton,
} from "@/components/ui";
import { t } from "@/lib/i18n";
import { useNotifications } from "../hooks/useNotifications";
import { useNotificationActions } from "../hooks/useNotificationActions";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { NotificationItem } from "./NotificationItem";

/** Placeholder rows while the first page loads (no white flash, no spinner). */
function LoadingRows() {
  return (
    <div className="flex flex-col gap-0.5 p-1.5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 px-2 py-2">
          <Skeleton className="size-[30px] shrink-0 rounded-md" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The inbox content rendered inside the bell's `DropdownMenuContent`: a header
 * (title + "{n} new" + Mark all read), a divider, and the scrollable list with
 * loading / empty / error states + a "Load more" footer. Real data only — items
 * carry their own backend-localized Title/Message.
 */
export function NotificationPanel({ open }: { open: boolean }) {
  const { items, isLoading, isError, refetch, hasMore, loadMore } =
    useNotifications(open);
  const { markRead, markAll } = useNotificationActions();
  // Shares the badge's cached query (same key) — the true unread total.
  const { data: unreadData } = useUnreadCount();
  const unread = unreadData?.Count ?? 0;

  // One persistent (panel-open) polite live region announces the feed's resolved
  // state — error / empty / unread count — so a screen reader hears the
  // loading→loaded transition and mark-read decrements. Empty string at 0 unread
  // keeps it from announcing "0 …" on the last mark-read.
  const liveMessage = isError
    ? t("account.shell.notifications.error")
    : isLoading
      ? ""
      : items.length === 0
        ? t("account.shell.notifications.none")
        : unread > 0
          ? `${unread} ${t("account.shell.notifications.unreadSuffix")}`
          : "";

  return (
    <div className="flex flex-col">
      <span aria-live="polite" className="sr-only">
        {liveMessage}
      </span>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="text-sm font-semibold tracking-[-0.01em] text-foreground">
          {t("account.shell.notifications.label")}
        </span>
        {unread > 0 ? (
          // Visual only — the sr-only live region above carries it for AT.
          <span aria-hidden className="text-xs text-muted-foreground">
            {unread} {t("account.shell.notifications.newSuffix")}
          </span>
        ) : null}
        <DropdownMenuItem
          disabled={unread === 0}
          onSelect={(e) => {
            e.preventDefault();
            void markAll();
          }}
          className="ml-auto w-auto rounded-md px-2 py-1 text-xs font-medium text-primary focus:text-primary"
        >
          {t("account.shell.notifications.markAllRead")}
        </DropdownMenuItem>
      </div>
      <Separator />

      {isLoading ? (
        <LoadingRows />
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
          {/* Visual only — the live region above announces the error for AT. */}
          <p aria-hidden className="text-sm text-muted-foreground">
            {t("account.shell.notifications.error")}
          </p>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              void refetch();
            }}
            className="w-auto justify-center rounded-md px-3 py-1.5 text-xs font-medium"
          >
            {t("common.retry")}
          </DropdownMenuItem>
        </div>
      ) : items.length === 0 ? (
        <p
          aria-hidden
          className="px-3 py-10 text-center text-sm text-muted-foreground"
        >
          {t("account.shell.notifications.none")}
        </p>
      ) : (
        <ScrollArea className="max-h-[360px]">
          <div className="flex flex-col gap-0.5 p-1.5">
            {items.map((n) => (
              <NotificationItem
                key={n.Id}
                notification={n}
                onMarkRead={markRead}
              />
            ))}
            {hasMore ? (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  void loadMore();
                }}
                className="justify-center rounded-md py-2 text-xs font-medium text-muted-foreground"
              >
                {t("account.shell.notifications.loadMore")}
              </DropdownMenuItem>
            ) : null}
          </div>
          <ScrollBar />
        </ScrollArea>
      )}
    </div>
  );
}
