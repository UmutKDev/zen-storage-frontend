"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateScope } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useWorkspaceStore } from "@/stores";
import { lockFolder } from "../api";
import { useSecureFoldersStore } from "../stores/secureFolders.store";

/** Re-lock an encrypted folder: invalidate the server session + drop the token.
 *  Drops the token only on confirmed success (a failed lock keeps you unlocked
 *  + toasts centrally — `lockFolder` doesn't suppress). */
export function useLock() {
  const qc = useQueryClient();
  const ownerId = useWorkspaceStore((s) => s.ownerId);
  const clearToken = useSecureFoldersStore((s) => s.clearToken);

  const mutation = useMutation({
    mutationFn: (path: string) => lockFolder(path),
    onSuccess: (_result, path) => {
      clearToken("encrypted", path);
      if (ownerId) void invalidateScope(qc, ownerId);
      toast.success(t("storage.ops.secure.lock.done"));
    },
  });

  return {
    submit: (path: string) => mutation.mutate(path),
    isPending: mutation.isPending,
  };
}
