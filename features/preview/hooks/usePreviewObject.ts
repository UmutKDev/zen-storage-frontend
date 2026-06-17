"use client";

import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/stores";
import { findObject, previewKeys } from "../api";

/**
 * Resolve the previewed file by Key (`Cloud/Find`). Self-resolving (not via the
 * browse cache) so a cold deep-link works. ownerId-scoped + `enabled`-gated like
 * the browse queries.
 */
export function usePreviewObject(key: string) {
  const ownerId = useWorkspaceStore((s) => s.ownerId);
  const enabled = Boolean(ownerId) && Boolean(key);

  const query = useQuery({
    queryKey: previewKeys.object(ownerId ?? "anon", key),
    queryFn: ({ signal }) => findObject(key, signal),
    enabled,
    // Keep the current file on screen while the next one (←/→ nav) resolves —
    // no loading flash between files.
    placeholderData: (prev) => prev,
  });

  return {
    object: query.data,
    // `isPending` is `true` for a disabled query in TanStack v5; gate on enabled.
    isPending: enabled && query.isPending,
    // Fetching the next file while the previous stays on screen (placeholderData)
    // — drives the top load-bar so a ←/→ swap shows progress.
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
