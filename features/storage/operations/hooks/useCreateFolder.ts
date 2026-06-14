"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { useOwnerId } from "../../lib/useOwnerId";
import { createFolder } from "../api";
import { childFolderPath } from "../lib/paths";
import { invalidateFolder } from "../lib/invalidate";
import { useConflictMutation } from "./useConflictMutation";

export function useCreateFolder(path: string, onDone: () => void) {
  const qc = useQueryClient();
  const ownerId = useOwnerId();
  return useConflictMutation<{ name: string; encrypt?: boolean; passphrase?: string }>({
    run: ({ name, encrypt, passphrase }, strategy) =>
      createFolder({
        Path: childFolderPath(path, name),
        ConflictStrategy: strategy,
        IsEncrypted: encrypt,
        Passphrase: encrypt ? passphrase : undefined,
      }),
    onSuccess: () => {
      toast.success(t("storage.ops.create.createdFolder"));
      if (ownerId) invalidateFolder(qc, ownerId, path);
      onDone();
    },
  });
}
