"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateKey } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useOwnerId } from "../../lib/useOwnerId";
import { storageKeys } from "../../browse/api";
import type { FolderEntry } from "../../browse/lib/entries";
import { moveEntries } from "../api";
import { entryItem } from "../lib/paths";
import { useConflictMutation } from "./useConflictMutation";

/** Move one or many entries in a single `Cloud/Move` call. The entries ride in
 *  the mutation vars (the DnD layer's drag set changes per drag). */
export function useMove(onDone: () => void) {
  const qc = useQueryClient();
  const ownerId = useOwnerId();
  return useConflictMutation<{
    entries: ReadonlyArray<FolderEntry>;
    destinationKey: string;
  }>({
    run: ({ entries, destinationKey }, strategy) =>
      moveEntries({ items: entries.map(entryItem), destinationKey, strategy }),
    onSuccess: ({ entries }) => {
      toast.success(
        entries.length > 1
          ? `${entries.length} ${t("storage.ops.bulk.movedSuffix")}`
          : t("storage.ops.move.done"),
      );
      // A move changes both source + destination folders — invalidate the
      // owner's storage namespace (folders + usage; not unrelated caches).
      if (ownerId) void invalidateKey(qc, storageKeys.all(ownerId));
      onDone();
    },
  });
}
