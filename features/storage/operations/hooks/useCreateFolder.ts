"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isApiError, newIdempotencyKey } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useJobsStore } from "@/features/jobs";
import { useOwnerId } from "../../lib/useOwnerId";
import { createFolder, startDirectoryCreate } from "../api";
import { childFolderPath } from "../lib/paths";
import { invalidateFolder } from "../lib/invalidate";
import { usePendingOpsStore } from "../stores/pendingOps.store";
import { useConflictMutation } from "./useConflictMutation";

/** True when the async create-Start endpoint isn't reachable yet (client not
 *  regenerated → method shim throws TypeError, or backend route missing → 404),
 *  so the caller should fall back to the synchronous create. */
function isMissingEndpoint(err: unknown): boolean {
  return (
    err instanceof TypeError || (isApiError(err) && err.code === "NOT_FOUND")
  );
}

export function useCreateFolder(path: string, onDone: () => void) {
  const qc = useQueryClient();
  const ownerId = useOwnerId();
  return useConflictMutation<{ name: string; encrypt?: boolean; passphrase?: string }>({
    run: async ({ name, encrypt, passphrase }, strategy) => {
      const folderPath = childFolderPath(path, name);

      // Encrypted creation stays synchronous — its passphrase must never enter a
      // Redis job payload (it rides X-Folder-Passphrase). Toast on success here;
      // the async path is toasted by the FOLDER_CREATE_COMPLETE notification.
      if (encrypt) {
        await createFolder({
          Path: folderPath,
          ConflictStrategy: strategy,
          IsEncrypted: true,
          Passphrase: passphrase,
        });
        toast.success(t("storage.ops.create.createdFolder"));
        return;
      }

      // Plain → durable async job (refresh-survivable inline row). Conflict
      // detection still runs synchronously server-side, so a 409 propagates to the
      // conflict prompt. Fall back to the synchronous create when the endpoint
      // isn't available yet (client regen / backend rebuild pending).
      try {
        const res = await startDirectoryCreate({
          Path: folderPath,
          ConflictStrategy: strategy,
        });
        if (res.JobId) {
          useJobsStore.getState().track({
            id: res.JobId,
            kind: "folder-create",
            path,
            title: t("storage.pending.creatingFolder"),
          });
        }
        // No toast: the FOLDER_CREATE_COMPLETE notification surfaces completion.
      } catch (err) {
        if (isMissingEndpoint(err)) {
          await createFolder({ Path: folderPath, ConflictStrategy: strategy });
          toast.success(t("storage.ops.create.createdFolder"));
          return;
        }
        throw err;
      }
    },
    // Only the synchronous (encrypted / fallback) path needs an optimistic
    // placeholder; the async path renders the durable job row instead.
    optimistic: ({ name, encrypt }) => {
      if (!encrypt) return () => {};
      const id = newIdempotencyKey();
      usePendingOpsStore.getState().add({ id, path, name, kind: "create-folder" });
      return () => usePendingOpsStore.getState().remove(id);
    },
    onSuccess: async () => {
      onDone();
      if (ownerId) await invalidateFolder(qc, ownerId, path);
    },
  });
}
