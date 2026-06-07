"use client";

import { useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListResult } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { CloudDirectoryModel, CloudObjectModel } from "@/service/models";
import { useOwnerId } from "../../lib/useOwnerId";
import { storageKeys } from "../../browse/api";
import type { FolderEntry } from "../../browse/lib/entries";
import { deleteEntries } from "../api";
import { entryItem } from "../lib/paths";
import { invalidateFolder } from "../lib/invalidate";

/** Remove an item from the cached infinite pages (optimistic). */
function withoutItem<T>(
  data: InfiniteData<ListResult<T>> | undefined,
  matches: (item: T) => boolean,
): InfiniteData<ListResult<T>> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.filter((item) => !matches(item)),
    })),
  };
}

/**
 * Single delete (files + unencrypted dirs). Optimistically removes the entry
 * from the cache; the `invalidateFolder` on settle reconciles — on failure the
 * refetch restores the item (effective rollback), and the Instance toasts.
 */
export function useDelete(path: string, onDone: () => void) {
  const qc = useQueryClient();
  const ownerId = useOwnerId();
  const [isPending, setIsPending] = useState(false);

  const remove = async (entry: FolderEntry) => {
    if (!ownerId) return;
    setIsPending(true);
    const key =
      entry.kind === "dir"
        ? storageKeys.directories(ownerId, path)
        : storageKeys.objects(ownerId, path);
    await qc.cancelQueries({ queryKey: key });
    if (entry.kind === "dir") {
      qc.setQueryData<InfiniteData<ListResult<CloudDirectoryModel>>>(key, (old) =>
        withoutItem(old, (d) => d.Prefix === entry.dir.Prefix),
      );
    } else {
      qc.setQueryData<InfiniteData<ListResult<CloudObjectModel>>>(key, (old) =>
        withoutItem(old, (f) => f.Path.Key === entry.file.Path.Key),
      );
    }
    try {
      await deleteEntries([entryItem(entry)]);
      toast.success(t("storage.ops.delete.done"));
    } catch {
      // central toast; the invalidate below refetches → item reappears (rollback)
    } finally {
      invalidateFolder(qc, ownerId, path);
      setIsPending(false);
      onDone();
    }
  };

  return { remove, isPending };
}
