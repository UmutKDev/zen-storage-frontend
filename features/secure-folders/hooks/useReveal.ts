"use client";

import { useQueryClient } from "@tanstack/react-query";
import { invalidateScope } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useWorkspaceStore } from "@/stores";
import type { DirectoryRevealResponseModel } from "@/service/models";
import { revealFolder } from "../api";
import { useSecureFoldersStore } from "../stores/secureFolders.store";
import { usePassphraseMutation } from "../lib/usePassphraseMutation";

/**
 * Reveal hidden folders under `path` (the current browse folder). **The hidden
 * token is keyed by the REQUEST `path`, NOT the returned `HiddenFolderPath`** —
 * the backend validates `X-Hidden-Session` (sent on the *parent* listing)
 * against each hidden *child*, and ancestor-resolution only attaches a token to
 * its keyed path + descendants, so keying at the current folder surfaces the
 * hidden children there (and on entering a revealed child). (Contrast Stage B
 * unlock, which keys by the returned `EncryptedFolderPath`.) A3 order:
 * `setToken` before `invalidateScope`.
 */
export function useReveal() {
  const qc = useQueryClient();
  const ownerId = useWorkspaceStore((s) => s.ownerId);
  const setToken = useSecureFoldersStore((s) => s.setToken);

  return usePassphraseMutation<DirectoryRevealResponseModel>({
    run: revealFolder,
    onDone: (data, path) => {
      setToken("hidden", path, data.SessionToken, data.ExpiresAt);
      if (ownerId) void invalidateScope(qc, ownerId);
    },
    wrongPassphraseMessage: t("storage.ops.secure.unlock.error"),
    // A non-403 failure (5xx / offline / rate-limited) is suppressed at the
    // Instance, so the dialog must surface it — else reveal silently "does nothing".
    genericMessage: t("common.errorGeneric"),
  });
}
