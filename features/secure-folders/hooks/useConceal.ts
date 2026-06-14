"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateScope, isApiError } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useWorkspaceStore } from "@/stores";
import { concealFolder } from "../api";

/**
 * Re-conceal a revealed hidden folder (drops its server session). **A4
 * atomicity** — the folder is only treated as re-hidden when the server
 * confirms:
 *   • 2xx → invalidate (it disappears on refetch) + success toast.
 *   • NETWORK (no response) → **don't** invalidate (the session is still live →
 *     the folder genuinely stays revealed) + "try again" toast.
 *   • other (5xx/ambiguous) → invalidate to show the server's truth + a warning.
 * The client token isn't touched (it's keyed at the reveal-root and may still
 * cover other revealed siblings; a stale token is harmless + clears on tab close
 * when sessionStorage is dropped, or on sign-out).
 */
export function useConceal() {
  const qc = useQueryClient();
  const ownerId = useWorkspaceStore((s) => s.ownerId);

  const mutation = useMutation({
    mutationFn: (path: string) => concealFolder(path),
    onSuccess: () => {
      if (ownerId) void invalidateScope(qc, ownerId);
      toast.success(t("storage.ops.secure.conceal.done"));
    },
    onError: (error) => {
      if (isApiError(error) && error.code === "NETWORK") {
        toast.error(t("storage.ops.secure.conceal.retry"));
        return;
      }
      if (ownerId) void invalidateScope(qc, ownerId);
      toast.error(t("storage.ops.secure.conceal.maybeIncomplete"));
    },
  });

  return {
    submit: (path: string) => mutation.mutate(path),
    isPending: mutation.isPending,
  };
}
