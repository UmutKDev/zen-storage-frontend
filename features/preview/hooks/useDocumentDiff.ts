"use client";

import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/stores";
import { diffDocumentVersions, previewKeys } from "../api";

/**
 * Backend-computed diff of a document version vs the current content. Lazy:
 * `enabled` only when a version row's diff is expanded, so collapsed rows issue
 * no diff call. The diff only changes when the current content changes (a
 * restore), which invalidates the owner scope — so `staleTime: Infinity`.
 */
export function useDocumentDiff(
  key: string,
  sourceVersionId: string,
  enabled: boolean,
) {
  const ownerId = useWorkspaceStore((s) => s.ownerId);
  const on =
    Boolean(ownerId) && Boolean(key) && Boolean(sourceVersionId) && enabled;

  const query = useQuery({
    queryKey: previewKeys.documentDiff(ownerId ?? "anon", key, sourceVersionId),
    queryFn: ({ signal }) => diffDocumentVersions(key, sourceVersionId, signal),
    enabled: on,
    staleTime: Infinity,
  });

  return {
    diff: query.data,
    isPending: on && query.isPending,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
