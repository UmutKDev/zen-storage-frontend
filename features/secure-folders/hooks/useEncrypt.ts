"use client";

import { useQueryClient } from "@tanstack/react-query";
import { invalidateScope } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useWorkspaceStore } from "@/stores";
import { encryptFolder } from "../api";
import { usePassphraseMutation } from "../lib/usePassphraseMutation";

/** Convert a plain folder to encrypted; the new passphrase sets the cipher. */
export function useEncrypt() {
  const qc = useQueryClient();
  const ownerId = useWorkspaceStore((s) => s.ownerId);

  return usePassphraseMutation<void>({
    run: encryptFolder,
    onDone: () => {
      if (ownerId) void invalidateScope(qc, ownerId);
    },
    genericMessage: t("storage.ops.secure.encrypt.error"),
  });
}
