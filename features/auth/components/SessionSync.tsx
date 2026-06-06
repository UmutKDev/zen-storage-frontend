"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { registerSessionSource, registerSignOut } from "@/service/token-sources";
import { signOutAndCleanup } from "../lib/signOutAndCleanup";

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

  useEffect(() => {
    registerSessionSource(() => sessionIdRef.current);
    registerSignOut(() => signOutAndCleanup(queryClient));
  }, [queryClient]);

  return null;
}
