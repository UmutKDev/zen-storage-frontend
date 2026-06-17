import { scopedKey } from "@/lib/api";

/**
 * Query keys for account/security/subscription data.
 *
 * These resources are **user-scoped, not team-scoped** — they belong to the
 * signed-in user regardless of the active workspace. So we key them under a
 * fixed `"account"` scope (NOT `ownerId`, which swaps on team switch and would
 * wrongly drop these caches). `signOutAndCleanup`'s `queryClient.clear()` still
 * wipes everything on logout.
 */
const SCOPE = "account";

export const accountKeys = {
  all: () => scopedKey(SCOPE),
  profile: () => scopedKey(SCOPE, "profile"),
  subscription: () => scopedKey(SCOPE, "subscription"),
  twoFactorStatus: () => scopedKey(SCOPE, "security", "2fa", "status"),
  passkeys: () => scopedKey(SCOPE, "security", "passkeys"),
  sessions: () => scopedKey(SCOPE, "security", "sessions"),
} as const;
