"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateScope, isApiError } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useWorkspaceStore } from "@/stores";
import { deleteDocumentVersion, restoreDocumentVersion } from "../api";
import { useEditorStore } from "../stores/editor.store";

/**
 * Restore / delete document versions. Like the object-version actions, settle
 * invalidates the **whole owner scope** (restore mints a new current version +
 * shifts the list; one invalidate covers list + folder + usage — versions are
 * an infrequent action). **Restore additionally reloads the open editor**: it
 * awaits the scope refetch, then bumps the editor reload signal so the editor
 * re-seeds in place with the restored content (keeping the lock). Generic
 * errors toast centrally; a passthrough 403 is surfaced here.
 */
export function useDocumentVersionActions(key: string) {
  const qc = useQueryClient();
  const ownerId = useWorkspaceStore((s) => s.ownerId);
  const requestReload = useEditorStore((s) => s.requestReload);
  const [isPending, setIsPending] = useState(false);

  const restore = async (versionId: string): Promise<boolean> => {
    if (!ownerId) return false;
    setIsPending(true);
    try {
      await restoreDocumentVersion({ Key: key, VersionId: versionId });
      // Refetch first so the cache holds the restored content, then reload the
      // editor (in-place re-seed via the reload signal).
      await invalidateScope(qc, ownerId);
      requestReload();
      toast.success(t("preview.versions.restored"));
      return true;
    } catch (error) {
      if (isApiError(error) && error.code === "FORBIDDEN") {
        toast.error(t("common.errorGeneric"));
      }
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const remove = async (versionId: string): Promise<boolean> => {
    if (!ownerId) return false;
    setIsPending(true);
    try {
      await deleteDocumentVersion({ Key: key, VersionId: versionId });
      toast.success(t("preview.versions.deleted"));
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

  return { isPending, restore, remove };
}
