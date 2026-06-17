"use client";

import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/stores";
import { listDocumentVersions, previewKeys } from "../api";

/**
 * Document version list (`Cloud/Documents/Versions`). Lazy: `enabled` only when
 * the history panel is `open`, so editing a doc issues no version call until the
 * panel expands. Reuses the object `CloudVersionModel` rows.
 */
export function useDocumentVersions(key: string, open: boolean) {
  const ownerId = useWorkspaceStore((s) => s.ownerId);
  const enabled = Boolean(ownerId) && Boolean(key) && open;

  const query = useQuery({
    queryKey: previewKeys.documentVersions(ownerId ?? "anon", key),
    queryFn: ({ signal }) => listDocumentVersions(key, signal),
    enabled,
  });

  return {
    versions: query.data?.Versions ?? [],
    isPending: enabled && query.isPending,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
