"use client";

import { useQueryClient } from "@tanstack/react-query";
import { invalidateScope } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useWorkspaceStore } from "@/stores";
import { decryptFolder } from "../api";
import { useSecureFoldersStore } from "../stores/secureFolders.store";
import { usePassphraseMutation } from "../lib/usePassphraseMutation";

/** Remove encryption from a folder (passphrase required); drops any held token. */
export function useDecrypt() {
  const qc = useQueryClient();
  const ownerId = useWorkspaceStore((s) => s.ownerId);
  const clearToken = useSecureFoldersStore((s) => s.clearToken);

  return usePassphraseMutation<void>({
    run: decryptFolder,
    onDone: (_result, path) => {
      clearToken("encrypted", path);
      if (ownerId) void invalidateScope(qc, ownerId);
    },
    wrongPassphraseMessage: t("storage.ops.secure.unlock.error"),
    genericMessage: t("storage.ops.secure.decrypt.error"),
  });
}
