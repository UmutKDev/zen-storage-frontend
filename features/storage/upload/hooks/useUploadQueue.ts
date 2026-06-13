"use client";

import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isApiError } from "@/lib/api";
import { t } from "@/lib/i18n";
import { formatBytes } from "@/lib/utils";
import { useOwnerId } from "../../lib/useOwnerId";
import { useStorageUsage } from "../../browse/hooks/useStorageUsage";
import { createFolder } from "../../operations/api";
import { childFolderPath } from "../../operations/lib/paths";
import { invalidateFolder } from "../../operations/lib/invalidate";
import { uploadEngine, type EnqueueFile } from "../core/engine";
import { preflight } from "../lib/plan";
import {
  directoriesToCreate,
  type TraversedFile,
} from "../lib/traverse";
import { useUploadsStore } from "../stores/uploads.store";

/**
 * Engine lifecycle — called from EXACTLY ONE always-mounted component (the
 * tray in the app layout): restores the persisted queue when the owner is
 * known and wires completion → folder invalidation. Kept out of
 * `useUploadQueue` so drop zones/menus don't fight over the registration.
 */
export function useUploadEngineBoot(): void {
  const ownerId = useOwnerId();
  const qc = useQueryClient();

  useEffect(() => {
    if (!ownerId) return;
    uploadEngine.setOnCompleted((path) => {
      invalidateFolder(qc, ownerId, path);
    });
    void uploadEngine.restore(ownerId);
    return () => uploadEngine.setOnCompleted(null);
  }, [ownerId, qc]);
}

/**
 * React seam over the upload engine: queue items + commands, and `enqueue`
 * with the quota/max-size pre-flight (block BEFORE starting, clear message +
 * upgrade hint — upload-pipeline §5) and folder-tree creation (existing dirs
 * merge: a create 409 counts as success).
 */
export function useUploadQueue() {
  const ownerId = useOwnerId();
  const usage = useStorageUsage();
  const items = useUploadsStore((s) => s.items);

  const enqueue = useCallback(
    async (files: ReadonlyArray<TraversedFile>, basePath: string) => {
      if (!ownerId || files.length === 0) return;

      if (usage.data) {
        const pendingBytes = useUploadsStore
          .getState()
          .items.filter(
            (i) =>
              i.status !== "done" &&
              i.status !== "error" &&
              i.status !== "canceled" &&
              i.status !== "blocked",
          )
          .reduce((sum, i) => sum + (i.totalSize - i.uploadedBytes), 0);
        const verdict = preflight(
          files.map(({ file }) => ({ name: file.name, size: file.size })),
          usage.data,
          pendingBytes,
        );
        if (!verdict.ok) {
          toast.error(
            verdict.reason === "maxSize"
              ? `${verdict.fileName}: ${t("storage.upload.errors.maxSize")} ${formatBytes(usage.data.MaxUploadSizeBytes)}.`
              : `${t("storage.upload.errors.quota")} ${t("storage.upload.errors.upgradeHint")}`,
          );
          return;
        }
      }

      // Recreate the dropped tree first (§4); an existing dir is a merge.
      for (const dir of directoriesToCreate(files)) {
        try {
          await createFolder({ Path: childFolderPath(basePath, dir) });
        } catch (error) {
          // 409 = the folder already exists → merge into it. Anything else
          // already toasted centrally; stop without enqueueing the batch.
          if (!(isApiError(error) && error.code === "CONFLICT")) return;
        }
      }

      const entries: EnqueueFile[] = files.map(({ file, relativeDir }) => ({
        file,
        path: relativeDir
          ? basePath
            ? `${basePath}/${relativeDir}`
            : relativeDir
          : basePath,
        // Files from a picked/dropped folder collapse to one queue row keyed by
        // their top-level folder; loose files (no relativeDir) stay per-file.
        folderName: relativeDir ? relativeDir.split("/")[0] : undefined,
      }));
      uploadEngine.enqueue(entries, ownerId);
    },
    [ownerId, usage.data],
  );

  return {
    items,
    enqueue,
    pause: uploadEngine.pause.bind(uploadEngine),
    resume: uploadEngine.resume.bind(uploadEngine),
    retry: uploadEngine.retry.bind(uploadEngine),
    cancel: uploadEngine.cancel.bind(uploadEngine),
    dismiss: uploadEngine.dismiss.bind(uploadEngine),
  };
}
