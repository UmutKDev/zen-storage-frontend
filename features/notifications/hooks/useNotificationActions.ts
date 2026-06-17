"use client";

import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { ListResult } from "@/lib/api";
import type {
  NotificationHistoryItemModel,
  UnreadCountResponseModel,
} from "@/service/models";
import { markAllAsRead, markAsRead, notificationKeys } from "../api";

type ListPage = ListResult<NotificationHistoryItemModel>;

/**
 * Mark-read actions with optimistic updates (mirrors the storage `useDelete`
 * shape): flip `IsRead` + decrement the badge in the cache immediately, fire the
 * PATCH, then invalidate both the list and the unread count on settle — a failure
 * (toasted centrally by the Instance) is rolled back by that refetch. Only call
 * `markRead` for an item that is currently unread (the count decrement assumes it).
 */
export function useNotificationActions() {
  const qc = useQueryClient();
  const listKey = notificationKeys.list();
  const countKey = notificationKeys.unreadCount();

  const flipRead = (shouldFlip: (n: NotificationHistoryItemModel) => boolean) => {
    qc.setQueryData<InfiniteData<ListPage>>(listKey, (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((n) =>
                shouldFlip(n) ? { ...n, IsRead: true } : n,
              ),
            })),
          }
        : old,
    );
  };

  const settle = () => {
    void qc.invalidateQueries({ queryKey: listKey });
    void qc.invalidateQueries({ queryKey: countKey });
  };

  const markRead = async (id: string) => {
    flipRead((n) => n.Id === id);
    qc.setQueryData<UnreadCountResponseModel>(countKey, (c) =>
      c ? { Count: Math.max(0, c.Count - 1) } : c,
    );
    try {
      await markAsRead(id);
    } catch {
      // The Instance already toasted; the settle refetch restores truth.
    } finally {
      settle();
    }
  };

  const markAll = async () => {
    flipRead(() => true);
    qc.setQueryData<UnreadCountResponseModel>(countKey, () => ({ Count: 0 }));
    try {
      await markAllAsRead();
    } catch {
      // Toasted centrally; the settle refetch rolls back on failure.
    } finally {
      settle();
    }
  };

  return { markRead, markAll };
}
