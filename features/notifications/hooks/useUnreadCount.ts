"use client";

import { useQuery } from "@tanstack/react-query";
import { getUnreadCount, notificationKeys } from "../api";

/** Notification unread count for the topbar badge. User-scoped; polled every 60s
 *  until the socket lands (P6). */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
  });
}
