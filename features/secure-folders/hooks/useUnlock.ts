"use client";

import { useQueryClient } from "@tanstack/react-query";
import { invalidateScope } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useWorkspaceStore } from "@/stores";
import type { DirectoryUnlockResponseModel } from "@/service/models";
import { unlockFolder } from "../api";
import { useSecureFoldersStore } from "../stores/secureFolders.store";
import { usePassphraseMutation } from "../lib/usePassphraseMutation";

/**
 * Unlock an encrypted folder → store the session token (ancestor-keyed) so its
 * subtree opens. **A3 ordering is load-bearing:** `setToken` runs BEFORE the
 * scope invalidation, so the refetch that follows already sees the token (else
 * it 403s and re-opens the prompt — an infinite loop). The query-key token fold
 * does the actual content refetch; the broad invalidate refreshes sibling/parent
 * metadata.
 */
export function useUnlock() {
  const qc = useQueryClient();
  const ownerId = useWorkspaceStore((s) => s.ownerId);
  const setToken = useSecureFoldersStore((s) => s.setToken);

  return usePassphraseMutation<DirectoryUnlockResponseModel>({
    run: unlockFolder,
    onDone: (data) => {
      setToken(
        "encrypted",
        data.EncryptedFolderPath,
        data.SessionToken,
        data.ExpiresAt,
      );
      if (ownerId) void invalidateScope(qc, ownerId);
    },
    wrongPassphraseMessage: t("storage.ops.secure.unlock.error"),
    // A non-403 failure (5xx / offline / rate-limited) is suppressed at the
    // Instance, so the dialog must surface it — else unlock silently "does nothing".
    genericMessage: t("common.errorGeneric"),
  });
}
