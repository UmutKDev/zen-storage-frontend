"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateScope, isApiError } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useWorkspaceStore } from "@/stores";
import { deleteVersion, restoreVersion } from "../api";

/**
 * Restore / delete object versions. On settle, invalidate the **whole owner
 * scope** — restore changes the object (size/ETag) + version list + folder
 * listing + usage, and one scope invalidate covers them all (versions are an
 * infrequent action, so the broad refetch is fine). Generic errors toast
 * centrally; a passthrough 403 is surfaced here.
 */
export function useVersionActions(key: string) {
  const qc = useQueryClient();
  const ownerId = useWorkspaceStore((s) => s.ownerId);
  const [isPending, setIsPending] = useState(false);

  const run = async (op: () => Promise<void>, successKey: string): Promise<boolean> => {
    if (!ownerId) return false;
    setIsPending(true);
    try {
      await op();
      toast.success(t(successKey));
      return true;
    } catch (error) {
      if (isApiError(error) && error.code === "FORBIDDEN") {
        toast.error(t("common.errorGeneric"));
      }
      return false;
    } finally {
      void invalidateScope(qc, ownerId);
      setIsPending(false);
    }
  };

  return {
    isPending,
    restore: (versionId: string) =>
      run(
        () => restoreVersion({ Key: key, VersionId: versionId }),
        "preview.versions.restored",
      ),
    remove: (versionId: string) =>
      run(
        () => deleteVersion({ Key: key, VersionId: versionId }),
        "preview.versions.deleted",
      ),
  };
}
