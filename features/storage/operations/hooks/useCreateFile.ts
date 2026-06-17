"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { newIdempotencyKey } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useOwnerId } from "../../lib/useOwnerId";
import { createFile } from "../api";
import { invalidateFolder } from "../lib/invalidate";
import { usePendingOpsStore } from "../stores/pendingOps.store";
import { useConflictMutation } from "./useConflictMutation";

export function useCreateFile(path: string, onDone: () => void) {
  const qc = useQueryClient();
  const ownerId = useOwnerId();
  return useConflictMutation<{ name: string }>({
    run: ({ name }, strategy) =>
      createFile({
        Path: path.length === 0 ? "/" : path,
        Name: name,
        ConflictStrategy: strategy,
      }),
    // Instant pending row — held until the success refetch lands the real file.
    optimistic: ({ name }) => {
      const id = newIdempotencyKey();
      usePendingOpsStore.getState().add({ id, path, name, kind: "create-file" });
      return () => usePendingOpsStore.getState().remove(id);
    },
    onSuccess: async () => {
      toast.success(t("storage.ops.create.createdFile"));
      onDone();
      if (ownerId) await invalidateFolder(qc, ownerId, path);
    },
  });
}
