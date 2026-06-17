"use client";

import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/stores";
import { previewKeys, readDocument } from "../api";

/**
 * Load a document's editable text (+draft) for the editor. `staleTime: Infinity`
 * so a background refetch never clobbers in-progress edits — the editor seeds
 * CodeMirror once from this; a 409 reload calls `refetch()` explicitly.
 */
export function useDocumentContent(key: string) {
  const ownerId = useWorkspaceStore((s) => s.ownerId);
  const enabled = Boolean(ownerId) && Boolean(key);

  const query = useQuery({
    queryKey: previewKeys.document(ownerId ?? "anon", key),
    queryFn: ({ signal }) => readDocument(key, true, signal),
    enabled,
    staleTime: Infinity,
  });

  return {
    data: query.data,
    isPending: enabled && query.isPending,
    isError: query.isError,
    refetch: () => query.refetch(),
  };
}
