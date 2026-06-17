import { itemsOf, type ListResult, type PageParams } from "@/lib/api";
import { notificationApiFactory } from "@/service/factories";
import type {
  NotificationHistoryItemModel,
  UnreadCountResponseModel,
} from "@/service/models";

/**
 * One page of notification history (newest first). The generated `history()` is
 * typed as the wire envelope, but the Instance interceptor unwraps a paginated
 * `Result` to `{ items, count }` — so `itemsOf` pulls the array and `count` (the
 * true total, for "load more") rides alongside.
 */
export async function getNotifications(
  { skip, take }: PageParams,
  signal?: AbortSignal,
): Promise<ListResult<NotificationHistoryItemModel>> {
  const res = await notificationApiFactory.history({ skip, take }, { signal });
  return {
    items: itemsOf<NotificationHistoryItemModel>(res.data),
    count: (res.data as unknown as ListResult<unknown>).count ?? 0,
  };
}

/** Unread badge count. `res.data` is the unwrapped `Result` (`{ Count }`). */
export async function getUnreadCount(): Promise<UnreadCountResponseModel> {
  const res = await notificationApiFactory.unreadCount();
  return res.data as unknown as UnreadCountResponseModel;
}

/** Mark one notification read (no response body). */
export async function markAsRead(id: string): Promise<void> {
  await notificationApiFactory.markAsRead({ id });
}

/** Mark every notification read (no response body). */
export async function markAllAsRead(): Promise<void> {
  await notificationApiFactory.markAllAsRead();
}
