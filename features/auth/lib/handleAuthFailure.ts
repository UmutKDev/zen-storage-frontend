import type { QueryClient } from "@tanstack/react-query";
import { signOutAndCleanup } from "./signOutAndCleanup";

let inFlight = false;

/**
 * Single, deduped entry point for an invalid-auth teardown. Both the REST 401
 * path (the Instance interceptor, via the `registerSignOut` seam) and the socket
 * `connect_error` with `AUTH_INVALID` funnel through here, so a parallel
 * REST + socket failure produces ONE sign-out, not two. One invocation per page
 * life is sufficient — `signOutAndCleanup` hard-navigates to `/login`.
 */
export function handleAuthFailure(queryClient: QueryClient): void {
  if (inFlight) return;
  inFlight = true;
  void signOutAndCleanup(queryClient);
}
