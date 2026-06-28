"use client";

import { useQuery } from "@tanstack/react-query";
import { scopedKey } from "@/lib/api";
import { useOwnerId } from "../../lib/useOwnerId";
import { previewArchive, type ArchiveConflictStrategy } from "../api/archive.api";
import { useArchiveExtractStart } from "./useArchiveExtractStart";

/**
 * Drives Extract: a `preview` query of the archive's entries (enabled while the
 * dialog is open) + `start` (delegated to {@link useArchiveExtractStart} so the
 * REST → `track` path is shared with bulk extract). The user picks which entries
 * to extract and how to handle output collisions up front; progress shows in the
 * topbar `JobsMenu` and extracted files appear in the folder on completion
 * (reconcile invalidates the listing).
 */
export function useArchiveExtract(
  archiveKey: string,
  archiveName: string,
  path: string,
  enabled: boolean,
) {
  const ownerId = useOwnerId();
  const { startOne, starting } = useArchiveExtractStart(path);

  const preview = useQuery({
    queryKey: scopedKey(ownerId ?? "anon", "archive-preview", archiveKey),
    queryFn: ({ signal }) => previewArchive(archiveKey, signal),
    enabled: enabled && Boolean(ownerId),
    staleTime: 5 * 60 * 1000,
  });

  const start = (opts: {
    selectedEntries?: string[];
    strategy: ArchiveConflictStrategy;
    createFolder: boolean;
  }): Promise<boolean> =>
    startOne({ key: archiveKey, name: archiveName, ...opts });

  return { preview, start, starting };
}
