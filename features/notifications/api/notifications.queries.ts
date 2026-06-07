import { notificationApiFactory } from "@/service/factories";

export interface UnreadCount {
  Count: number;
}

/**
 * The generated `unreadCount()` is typed `AxiosPromise<void>` (the spec has no
 * response DTO), but the envelope carries `{ Count }` — hence the cast.
 */
export async function getUnreadCount(): Promise<UnreadCount> {
  const res = await notificationApiFactory.unreadCount();
  return res.data as unknown as UnreadCount;
}
