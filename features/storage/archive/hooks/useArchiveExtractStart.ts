"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { useJobsStore } from "@/features/jobs";
import { surfacePassthroughError } from "../../operations/lib/feedback";
import {
  startArchiveExtract,
  type ArchiveConflictStrategy,
} from "../api/archive.api";

export interface ExtractStartOptions {
  /** The archive object's key (a file entry's `Path.Key`). */
  key: string;
  /** The archive's display name → the job title, so the inline row / jobs menu
   *  show WHICH archive is extracting. Falls back to a generic title if omitted. */
  name?: string;
  /** Omit to extract everything; a subset sends the chosen entry paths. */
  selectedEntries?: string[];
  strategy: ArchiveConflictStrategy;
  createFolder: boolean;
}

/**
 * The job-firing half of Extract, without a preview query — fire one
 * `archive-extract` job (REST → `track`) per call. Safe to loop for bulk extract
 * (the backend has no batch endpoint, so 2+ archives = N independent jobs). The
 * single-archive `useArchiveExtract` rebases its `start` onto `startOne` so the
 * track/error path has one source of truth.
 */
export function useArchiveExtractStart(path: string) {
  const [starting, setStarting] = useState(false);

  const startOne = async (opts: ExtractStartOptions): Promise<boolean> => {
    try {
      const res = await startArchiveExtract({
        Key: opts.key,
        SelectedEntries: opts.selectedEntries,
        Strategy: opts.strategy,
        CreateFolder: opts.createFolder,
      });
      useJobsStore.getState().track({
        id: res.JobId,
        kind: "archive-extract",
        title: opts.name ?? t("storage.archive.extract.jobTitle"),
        path,
      });
      return true;
    } catch (err) {
      // 403 (re-locked archive) passes through silently — surface it; other
      // errors are toasted centrally; a FAIL-strategy collision surfaces later
      // as an ARCHIVE_EXTRACT_FAILED toast from the job fan-out.
      surfacePassthroughError(err);
      return false;
    }
  };

  /**
   * Attempt every archive in order with one shared strategy/createFolder (no
   * per-archive entry selection — bulk extracts each archive whole). Don't stop
   * on the first failure: each surfaces its own error, and the caller keeps the
   * selection only when ALL failed (`ok === 0`), mirroring delete's retry path.
   */
  const startMany = async (
    archives: ReadonlyArray<{ key: string; name?: string }>,
    shared: { strategy: ArchiveConflictStrategy; createFolder: boolean },
  ): Promise<{ ok: number; failed: number }> => {
    setStarting(true);
    try {
      let ok = 0;
      for (const a of archives) {
        const success = await startOne({ key: a.key, name: a.name, ...shared });
        if (success) ok += 1;
      }
      return { ok, failed: archives.length - ok };
    } finally {
      setStarting(false);
    }
  };

  return { startOne, startMany, starting };
}
