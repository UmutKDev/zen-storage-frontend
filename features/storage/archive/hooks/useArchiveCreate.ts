"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { useJobsStore } from "@/features/jobs";
import type { CloudArchiveCreateStartRequestModelFormatEnum } from "@/service/models";
import type { FolderEntry } from "../../browse/lib/entries";
import { surfacePassthroughError } from "../../operations/lib/feedback";
import { startArchiveCreate } from "../api/archive.api";

export type ArchiveFormat = CloudArchiveCreateStartRequestModelFormatEnum;

/** Backend `Keys` for the selected entries — directories need a trailing slash
 *  (`ResolveCreateEntries` treats a trailing `/` as "expand this directory"). */
function toKeys(entries: ReadonlyArray<FolderEntry>): string[] {
  return entries.map((e) =>
    e.kind === "dir" && !e.key.endsWith("/") ? `${e.key}/` : e.key,
  );
}

/**
 * Drives Create-archive: start (REST) → `track` the JobId in the shared job
 * store (the socket fan-out + `reconcileActiveJobs` then drive progress; the
 * topbar `JobsMenu` surfaces it). The output `…-<uuid>.<ext>` appears in the
 * folder when the job completes (reconcile invalidates the listing).
 */
export function useArchiveCreate(path: string) {
  const [starting, setStarting] = useState(false);

  const start = async (
    entries: ReadonlyArray<FolderEntry>,
    opts: { format: ArchiveFormat; outputName?: string },
  ): Promise<boolean> => {
    if (entries.length === 0) return false;
    setStarting(true);
    try {
      const res = await startArchiveCreate({
        Keys: toKeys(entries),
        Format: opts.format,
        OutputName: opts.outputName?.trim() || undefined,
      });
      useJobsStore.getState().track({
        id: res.JobId,
        kind: "archive-create",
        title: t("storage.archive.create.jobTitle"),
        path,
      });
      return true;
    } catch (err) {
      // 403 passes through the Instance silently (e.g. a re-locked folder);
      // everything else is toasted centrally.
      surfacePassthroughError(err);
      return false;
    } finally {
      setStarting(false);
    }
  };

  return { start, starting };
}
