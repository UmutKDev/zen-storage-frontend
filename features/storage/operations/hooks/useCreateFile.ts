"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { useOwnerId } from "../../lib/useOwnerId";
import { createFile } from "../api";
import { invalidateFolder } from "../lib/invalidate";
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
    onSuccess: () => {
      toast.success(t("storage.ops.create.createdFile"));
      if (ownerId) invalidateFolder(qc, ownerId, path);
      onDone();
    },
  });
}
