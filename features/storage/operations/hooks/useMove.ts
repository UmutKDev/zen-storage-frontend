"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateScope } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useOwnerId } from "../../lib/useOwnerId";
import type { FolderEntry } from "../../browse/lib/entries";
import { moveEntries } from "../api";
import { entryItem } from "../lib/paths";
import { useConflictMutation } from "./useConflictMutation";

export function useMove(entry: FolderEntry, onDone: () => void) {
  const qc = useQueryClient();
  const ownerId = useOwnerId();
  return useConflictMutation<{ destinationKey: string }>({
    run: ({ destinationKey }, strategy) =>
      moveEntries({ items: [entryItem(entry)], destinationKey, strategy }),
    onSuccess: () => {
      toast.success(t("storage.ops.move.done"));
      // A move changes both source + destination folders — invalidate the whole
      // owner's storage scope.
      if (ownerId) void invalidateScope(qc, ownerId);
      onDone();
    },
  });
}
