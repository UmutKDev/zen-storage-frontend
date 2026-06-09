"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import type { CloudDirectoryModel, CloudObjectModel } from "@/service/models";
import { useOwnerId } from "../../lib/useOwnerId";
import { storageKeys } from "../../browse/api";
import type { FolderEntry } from "../../browse/lib/entries";
import { deleteEntries } from "../api";
import { entryItem } from "../lib/paths";
import { invalidateFolder } from "../lib/invalidate";
import { surfacePassthroughError } from "../lib/feedback";

/**
 * Delete one or many entries (files + unencrypted dirs) in a single
 * `Cloud/Delete` call. Optimistically removes them from the folder's cached
 * arrays; the `invalidateFolder` on settle reconciles — on failure the refetch
 * restores the items (effective rollback), and the Instance toasts.
 */
export function useDelete(path: string, onDone: () => void) {
  const qc = useQueryClient();
  const ownerId = useOwnerId();
  const [isPending, setIsPending] = useState(false);

  const remove = async (targets: ReadonlyArray<FolderEntry>): Promise<boolean> => {
    if (!ownerId || targets.length === 0) return false;
    setIsPending(true);
    let ok = false;
    const dirPrefixes = new Set(
      targets.filter((e) => e.kind === "dir").map((e) => e.key),
    );
    const fileKeys = new Set(
      targets.filter((e) => e.kind === "file").map((e) => e.key),
    );
    const dirsKey = storageKeys.directories(ownerId, path);
    const objectsKey = storageKeys.objects(ownerId, path);
    await qc.cancelQueries({ queryKey: dirsKey });
    await qc.cancelQueries({ queryKey: objectsKey });
    if (dirPrefixes.size > 0) {
      qc.setQueryData<CloudDirectoryModel[]>(dirsKey, (old) =>
        old?.filter((d) => !dirPrefixes.has(d.Prefix)),
      );
    }
    if (fileKeys.size > 0) {
      qc.setQueryData<CloudObjectModel[]>(objectsKey, (old) =>
        old?.filter((f) => !fileKeys.has(f.Path.Key)),
      );
    }
    try {
      await deleteEntries(targets.map(entryItem));
      ok = true;
      toast.success(
        targets.length > 1
          ? `${targets.length} ${t("storage.ops.bulk.deletedSuffix")}`
          : t("storage.ops.delete.done"),
      );
    } catch (error) {
      // Generic errors toast centrally; 403 passes through → surface it. The
      // invalidate below refetches → items reappear (rollback).
      surfacePassthroughError(error);
    } finally {
      invalidateFolder(qc, ownerId, path);
      setIsPending(false);
      onDone();
    }
    return ok;
  };

  return { remove, isPending };
}
