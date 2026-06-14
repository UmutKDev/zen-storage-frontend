import type { QueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { disconnectSocket } from "@/lib/socket";
import { teardownUploads } from "@/features/storage";
import { clearAllSecureFolderTokens } from "@/features/secure-folders";
import { authenticationApiFactory } from "@/service/factories";
import { useUiStore, useWorkspaceStore } from "@/stores";

/**
 * Full sign-out teardown (auth-integration §4 + phase-1 acceptance). Revokes the
 * server session, then tears down client state in a strict order so no later
 * step observes in-flight requests or stale store state:
 *   socket → cancel(queries+mutations) → clear() → store.reset() (all) →
 *   Auth.js signOut() → hard redirect to /login.
 * Wired to the shell logout (P2) and the Instance 401 handler (registerSignOut).
 */
export async function signOutAndCleanup(queryClient: QueryClient): Promise<void> {
  // Best-effort server revoke while the session is still valid.
  try {
    await authenticationApiFactory.logout();
  } catch {
    // ignore — we tear down the client regardless.
  }

  disconnectSocket();
  // Abort in-flight uploads + clear the tray (persisted entries are
  // owner-scoped and stay for the same owner's next session).
  teardownUploads();
  // v5 QueryClient has no `cancelMutations`; cancel active query fetches, then
  // `clear()` purges both the query and mutation caches.
  await queryClient.cancelQueries();
  queryClient.clear();
  useWorkspaceStore.getState().reset();
  useUiStore.getState().reset();
  // Secure-folder session tokens are in-memory only (rule #5) — drop them all.
  clearAllSecureFolderTokens();

  await signOut({ redirect: false });

  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
}
