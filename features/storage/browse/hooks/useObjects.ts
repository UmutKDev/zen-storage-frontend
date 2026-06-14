"use client";

import { useQuery } from "@tanstack/react-query";
import { useResolvedToken } from "@/features/secure-folders";
import { useOwnerId } from "../../lib/useOwnerId";
import { getObjects, isSameFolderKey, storageKeys } from "../api";

/** File objects for a folder (single call, no pagination). */
export function useObjects(path: string) {
  const ownerId = useOwnerId();
  const { encrypted, hidden } = useResolvedToken(path);
  const secureToken =
    [encrypted, hidden].filter(Boolean).join("~") || undefined;
  // The token-less key for this exact owner+folder — used to tell a secure-token
  // change apart from a real navigation in `placeholderData` below.
  const baseKey = storageKeys.objects(ownerId ?? "anon", path);
  return useQuery({
    queryKey: storageKeys.objects(ownerId ?? "anon", path, secureToken),
    queryFn: ({ signal }) => getObjects(path, signal),
    enabled: Boolean(ownerId),
    // Keep the current listing on screen when ONLY the secure-folder token changed
    // for this same owner+folder (reveal/unlock/lock/conceal fold the token into
    // the key) — hidden/encrypted children then appear or vanish with no skeleton
    // flash. A real folder navigation (owner or path changed) still shows the
    // skeleton. See `isSameFolderKey`.
    placeholderData: (prev, prevQuery) =>
      isSameFolderKey(baseKey, prevQuery?.queryKey) ? prev : undefined,
  });
}
