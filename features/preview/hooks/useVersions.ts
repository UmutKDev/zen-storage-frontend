"use client";

import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/stores";
import { listVersions, previewKeys } from "../api";

/**
 * Object version list (`Cloud/Versions`). Lazy: `enabled` only when the history
 * panel is `open`, so a normal preview open issues no version call.
 */
export function useVersions(key: string, open: boolean) {
  const ownerId = useWorkspaceStore((s) => s.ownerId);
  const enabled = Boolean(ownerId) && Boolean(key) && open;

  const query = useQuery({
    queryKey: previewKeys.versions(ownerId ?? "anon", key),
    queryFn: ({ signal }) => listVersions(key, signal),
    enabled,
  });

  return {
    versions: query.data?.Versions ?? [],
    isPending: enabled && query.isPending,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
