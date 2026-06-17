"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { invalidateKey, isApiError, scopedKey } from "@/lib/api";
import { useJobsStore } from "@/features/jobs";
import { useOwnerId } from "../../lib/useOwnerId";
import { deleteEntries } from "../../operations/api";
import { surfacePassthroughError } from "../../operations/lib/feedback";
import {
  cancelDuplicateScan,
  getDuplicateScanResult,
  startDuplicateScan,
} from "../api/duplicates.api";

export interface ScanOptions {
  recursive: boolean;
  threshold: number;
}

/**
 * Drives a duplicate scan: start (REST) → `track` the ScanId in the shared job
 * store (the socket fan-out + `reconcileActiveJobs` then drive progress) → on
 * completion fetch the grouped result → resolve by deleting selected files. The
 * panel reads live progress from the job store, not its own poll.
 */
export function useDuplicateScan(path: string) {
  const qc = useQueryClient();
  const ownerId = useOwnerId();
  const [scanId, setScanId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const job = useJobsStore((s) => (scanId ? s.jobs[scanId] : undefined));

  const result = useQuery({
    queryKey: scopedKey(ownerId ?? "anon", "duplicates", scanId ?? ""),
    queryFn: ({ signal }) => getDuplicateScanResult(scanId as string, signal),
    enabled: Boolean(scanId) && Boolean(ownerId) && job?.status === "complete",
    staleTime: Infinity,
  });

  const start = async (opts: ScanOptions): Promise<void> => {
    try {
      const res = await startDuplicateScan({
        // At the root, `path` is "" — the backend DTO rejects an empty Path
        // (@IsNotEmpty). Send "/" instead: KeyBuilder normalizes it to the
        // whole-drive prefix, so the root scan covers everything.
        Path: path || "/",
        Recursive: opts.recursive,
        SimilarityThreshold: opts.threshold,
      });
      setScanId(res.ScanId);
      useJobsStore.getState().track({
        id: res.ScanId,
        kind: "duplicate-scan",
        title: t("storage.duplicate.jobTitle"),
        path,
      });
    } catch (err) {
      // 409 passes through (the Instance doesn't toast it) — surface the
      // "already running" case; everything else is toasted centrally.
      if (isApiError(err) && err.code === "CONFLICT") {
        toast.warning(t("storage.duplicate.alreadyRunning"));
      }
    }
  };

  const cancel = async (): Promise<void> => {
    if (scanId) await cancelDuplicateScan(scanId);
  };

  /** Delete the selected duplicate files (cross-folder), then refresh storage. */
  const deleteFiles = async (keys: ReadonlyArray<string>): Promise<boolean> => {
    if (keys.length === 0) return false;
    setDeleting(true);
    let ok = false;
    try {
      await deleteEntries(keys.map((Key) => ({ Key, IsDirectory: false })));
      ok = true;
    } catch (err) {
      // 403/409 pass through the Instance silently — surface them (a duplicate
      // set can include a file under a re-locked folder); generic errors already
      // toasted centrally. The scope invalidation below reconciles either way.
      surfacePassthroughError(err);
    } finally {
      if (ownerId) void invalidateKey(qc, scopedKey(ownerId, "storage"));
      setDeleting(false);
    }
    return ok;
  };

  const reset = (): void => setScanId(null);

  return { scanId, job, result, start, cancel, deleteFiles, deleting, reset };
}
