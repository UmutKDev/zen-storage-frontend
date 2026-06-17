"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { useOwnerId } from "../../lib/useOwnerId";
import type { FolderEntry } from "../../browse/lib/entries";
import { deleteEntries } from "../api";
import { entryItem } from "../lib/paths";
import { invalidateFolder } from "../lib/invalidate";
import { surfacePassthroughError } from "../lib/feedback";
import { usePendingOpsStore } from "../stores/pendingOps.store";

/**
 * Delete one or many entries (files + unencrypted dirs) in a single
 * `Cloud/Delete` call. The targeted rows get the in-place "busy" treatment
 * (dimmed + spinner) while the request runs — consistent with move/rename — then
 * the `invalidateFolder` on settle reconciles: on success the refetch drops them;
 * on failure they stay (the Instance toasts, 403 passes through). The busy state
 * is held until the refetch lands so a deleted row never flickers back before it
 * disappears.
 */
export function useDelete(path: string, onDone: () => void) {
  const qc = useQueryClient();
  const ownerId = useOwnerId();
  const [isPending, setIsPending] = useState(false);

  const remove = async (targets: ReadonlyArray<FolderEntry>): Promise<boolean> => {
    if (!ownerId || targets.length === 0) return false;
    setIsPending(true);
    const keys = targets.map((e) => e.key);
    usePendingOpsStore.getState().setBusy(keys);
    let ok = false;
    try {
      await deleteEntries(targets.map(entryItem));
      ok = true;
      toast.success(
        targets.length > 1
          ? `${targets.length} ${t("storage.ops.bulk.deletedSuffix")}`
          : t("storage.ops.delete.done"),
      );
    } catch (error) {
      // Generic errors toast centrally; 403 passes through → surface it.
      surfacePassthroughError(error);
    } finally {
      setIsPending(false);
      onDone();
      // Hold the dimmed rows until the refetch removes (success) or restores
      // (failure) them, then clear the busy marks.
      await invalidateFolder(qc, ownerId, path);
      usePendingOpsStore.getState().clearBusy(keys);
    }
    return ok;
  };

  return { remove, isPending };
}
