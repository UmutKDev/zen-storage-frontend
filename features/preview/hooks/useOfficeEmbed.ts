"use client";

import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/stores";
import { officeEmbedUrl } from "@/lib/preview";
import { getPresignedSrc, previewKeys } from "../api";

/**
 * The Microsoft Office Online embed URL for an office file: fetches a fresh
 * presigned (publicly-fetchable) URL, then wraps it in the embed viewer URL.
 * ownerId-scoped + `enabled`-gated like the other preview queries.
 */
export function useOfficeEmbed(key: string) {
  const ownerId = useWorkspaceStore((s) => s.ownerId);
  const enabled = Boolean(ownerId) && Boolean(key);

  const query = useQuery({
    queryKey: previewKeys.officeSrc(ownerId ?? "anon", key),
    queryFn: ({ signal }) => getPresignedSrc(key, signal),
    enabled,
  });

  return {
    embedUrl: query.data ? officeEmbedUrl(query.data) : undefined,
    isPending: enabled && query.isPending,
    isError: query.isError,
  };
}
