"use client";

import { useQuery } from "@tanstack/react-query";
import { scopedKey } from "@/lib/api";
import { getUnreadCount } from "../api";

/** Notification unread count. User-scoped; polled until the socket lands (P6). */
export function useUnreadCount() {
  return useQuery({
    queryKey: scopedKey("account", "notifications", "unreadCount"),
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
  });
}
