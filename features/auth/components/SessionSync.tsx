"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { registerSessionSource, registerSignOut } from "@/service/token-sources";
import { useWorkspaceStore } from "@/stores";
import { handleAuthFailure } from "../lib/handleAuthFailure";

/**
 * Bridges the Auth.js session into the data layer's token-source seam (the
 * inverted-deps wiring deferred in P0). Keeps a ref to the latest session id so
 * the registered getter always returns the current value, and registers the
 * sign-out handler the Instance's 401 path invokes. Renders nothing.
 */
export function SessionSync() {
  const { data } = useSession();
  const queryClient = useQueryClient();
  const sessionIdRef = useRef<string | null>(null);

  // Keep the ref pointing at the latest session id (updated in an effect, not
  // during render) so the registered getter always returns the current value.
  useEffect(() => {
    sessionIdRef.current = data?.sessionId ?? null;
  }, [data?.sessionId]);

  // Derive the workspace `ownerId` from the session (auth `authorize` sets
  // `id: profile.Id`). This is the single source for query-key scope + the
  // future X-Team-Id; sign-out teardown resets it. (Phase 8 swaps it on team
  // switch.)
  const ownerIdFromSession = data?.user?.id ?? null;
  useEffect(() => {
    useWorkspaceStore.getState().setOwner(ownerIdFromSession);
  }, [ownerIdFromSession]);

  useEffect(() => {
    registerSessionSource(() => sessionIdRef.current);
    // Route the REST 401 path through the deduped handler so it can't race the
    // socket's AUTH_INVALID into a double sign-out.
    registerSignOut(() => handleAuthFailure(queryClient));
  }, [queryClient]);

  return null;
}
