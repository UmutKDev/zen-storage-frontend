"use client";

import { useQueryClient } from "@tanstack/react-query";
import { invalidateScope } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useWorkspaceStore } from "@/stores";
import { unhideFolder } from "../api";
import { usePassphraseMutation } from "../lib/usePassphraseMutation";

/** Remove the hidden mark from a folder (passphrase must match the one set on hide). */
export function useUnhide() {
  const qc = useQueryClient();
  const ownerId = useWorkspaceStore((s) => s.ownerId);

  return usePassphraseMutation<void>({
    run: unhideFolder,
    onDone: () => {
      if (ownerId) void invalidateScope(qc, ownerId);
    },
    wrongPassphraseMessage: t("storage.ops.secure.unlock.error"),
    genericMessage: t("storage.ops.secure.unhide.error"),
  });
}
