import { scopedKey } from "@/lib/api";

/**
 * Notification query keys. Notifications are **user-level**, not team-scoped
 * storage — so they live under a fixed `"account"` scope (the session already
 * scopes to the user), unlike storage keys that fold in the `ownerId`.
 */
export const notificationKeys = {
  unreadCount: () => scopedKey("account", "notifications", "unreadCount"),
  list: () => scopedKey("account", "notifications", "list"),
} as const;
