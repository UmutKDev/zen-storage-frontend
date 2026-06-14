"use client";

import { useQuery } from "@tanstack/react-query";
import { useResolvedToken } from "@/features/secure-folders";
import { useOwnerId } from "../../lib/useOwnerId";
import {
  BROWSE_REFETCH_INTERVAL_MS,
  getDirectories,
  isSameFolderKey,
  storageKeys,
} from "../api";

/** Combine the resolved secure-folder tokens into one query-key segment so any
 *  unlock/reveal (set) or lock/conceal (clear) refetches this listing. */
function secureTokenFor(encrypted: string | null, hidden: string | null) {
  return [encrypted, hidden].filter(Boolean).join("~") || undefined;
}

/** Directories for a folder (single call, no pagination). `enabled` lets the
 *  closed move-picker skip the fetch. */
export function useDirectories(path: string, enabled = true) {
  const ownerId = useOwnerId();
  const { encrypted, hidden } = useResolvedToken(path);
  // The token-less key for this exact owner+folder — used to tell a secure-token
  // change apart from a real navigation in `placeholderData` below.
  const baseKey = storageKeys.directories(ownerId ?? "anon", path);
  return useQuery({
    queryKey: storageKeys.directories(
      ownerId ?? "anon",
      path,
      secureTokenFor(encrypted, hidden),
    ),
    queryFn: ({ signal }) => getDirectories(path, signal),
    enabled: enabled && Boolean(ownerId),
    // Keep the current listing on screen when ONLY the secure-folder token changed
    // for this same owner+folder (reveal/unlock/lock/conceal fold the token into
    // the key) — hidden/encrypted children then appear or vanish with no skeleton
    // flash. A real folder navigation (owner or path changed) still shows the
    // skeleton. See `isSameFolderKey`.
    placeholderData: (prev, prevQuery) =>
      isSameFolderKey(baseKey, prevQuery?.queryKey) ? prev : undefined,
    // Keep the listing fresh against changes made elsewhere (uploads, new folders,
    // moves, deletes) — poll in the background (paused while the tab is hidden) and
    // refetch on window focus. The retained data + `placeholderData` mean these
    // refreshes swap entries in silently, with no skeleton/white flash.
    refetchInterval: BROWSE_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });
}
