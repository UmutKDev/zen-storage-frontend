"use client";

import { useQueryClient } from "@tanstack/react-query";
import { invalidateScope } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useWorkspaceStore } from "@/stores";
import { hideFolder } from "../api";
import { usePassphraseMutation } from "../lib/usePassphraseMutation";

/** Mark a folder hidden (the passphrase is set here). It vanishes from listings. */
export function useHide() {
  const qc = useQueryClient();
  const ownerId = useWorkspaceStore((s) => s.ownerId);

  return usePassphraseMutation<void>({
    run: hideFolder,
    onDone: () => {
      if (ownerId) void invalidateScope(qc, ownerId);
    },
    genericMessage: t("storage.ops.secure.hide.error"),
  });
}
