"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { t } from "@/lib/i18n";
import { scopedKey } from "@/lib/api";
import { useJobsStore } from "@/features/jobs";
import { useOwnerId } from "../../lib/useOwnerId";
import { surfacePassthroughError } from "../../operations/lib/feedback";
import {
  previewArchive,
  startArchiveExtract,
  type ArchiveConflictStrategy,
} from "../api/archive.api";

/**
 * Drives Extract: a `preview` query of the archive's entries (enabled while the
 * dialog is open) + `start` (REST → `track` an `archive-extract` job). The user
 * picks which entries to extract and how to handle output collisions up front;
 * progress shows in the topbar `JobsMenu` and extracted files appear in the
 * folder on completion (reconcile invalidates the listing).
 */
export function useArchiveExtract(
  archiveKey: string,
  path: string,
  enabled: boolean,
) {
  const ownerId = useOwnerId();
  const [starting, setStarting] = useState(false);

  const preview = useQuery({
    queryKey: scopedKey(ownerId ?? "anon", "archive-preview", archiveKey),
    queryFn: ({ signal }) => previewArchive(archiveKey, signal),
    enabled: enabled && Boolean(ownerId),
    staleTime: 5 * 60 * 1000,
  });

  const start = async (opts: {
    selectedEntries?: string[];
    strategy: ArchiveConflictStrategy;
    createFolder: boolean;
  }): Promise<boolean> => {
    setStarting(true);
    try {
      const res = await startArchiveExtract({
        Key: archiveKey,
        SelectedEntries: opts.selectedEntries,
        Strategy: opts.strategy,
        CreateFolder: opts.createFolder,
      });
      useJobsStore.getState().track({
        id: res.JobId,
        kind: "archive-extract",
        title: t("storage.archive.extract.jobTitle"),
        path,
      });
      return true;
    } catch (err) {
      // 403 (re-locked archive) passes through silently — surface it; other
      // errors are toasted centrally; a FAIL-strategy collision surfaces later
      // as an ARCHIVE_EXTRACT_FAILED toast from the job fan-out.
      surfacePassthroughError(err);
      return false;
    } finally {
      setStarting(false);
    }
  };

  return { preview, start, starting };
}
