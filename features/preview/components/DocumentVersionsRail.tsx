"use client";

import { useState } from "react";
import { FileDiff, RotateCcw, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "@/components/ui";
import { formatBytes, formatDateTime } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useDocumentVersions } from "../hooks/useDocumentVersions";
import { useDocumentVersionActions } from "../hooks/useDocumentVersionActions";
import { useEditorStore } from "../stores/editor.store";

type Confirm = { kind: "restore" | "delete"; versionId: string };

/**
 * Document-version history for the details rail's Versions tab (editor files).
 * Fetches immediately (the tab is the disclosure). Each row can open its diff —
 * **on the stage** (via `onViewDiff`), not inline, since the unified diff is too
 * wide for the rail. Restore/delete are gated by the editor lock (`canEdit`); a
 * restore replaces current content + reloads the open editor.
 */
export function DocumentVersionsRail({
  previewKey,
  onViewDiff,
}: {
  previewKey: string;
  onViewDiff: (docKey: string, versionId: string) => void;
}) {
  const { versions, isPending, isError, refetch } = useDocumentVersions(
    previewKey,
    true,
  );
  const actions = useDocumentVersionActions(previewKey);
  const canEdit = useEditorStore((s) => s.canEdit);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  return (
    <div className="h-full overflow-auto px-2 py-2 text-sm">
      {isError ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 px-2 py-3 text-muted-foreground"
        >
          <span>{t("preview.versions.error")}</span>
          <Button variant="outline" size="xs" onClick={refetch}>
            {t("common.retry")}
          </Button>
        </div>
      ) : isPending ? (
        <div className="px-2 py-3 text-muted-foreground" aria-busy>
          {t("common.loading")}
        </div>
      ) : versions.length === 0 ? (
        <div className="px-2 py-3 text-muted-foreground">
          {t("preview.versions.empty")}
        </div>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {versions.map((v) => {
            const when = formatDateTime(v.LastModified);
            return (
              <li
                key={v.VersionId}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-medium text-foreground">
                    {when}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatBytes(v.Size)}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${t("preview.diff.viewDiff")} — ${when}`}
                  onClick={() => onViewDiff(previewKey, v.VersionId)}
                >
                  <FileDiff className="size-3.5" />
                </Button>
                {canEdit ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${t("preview.versions.restore")} — ${when}`}
                      disabled={actions.isPending}
                      onClick={() => setConfirm({ kind: "restore", versionId: v.VersionId })}
                    >
                      <RotateCcw className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${t("preview.versions.delete")} — ${when}`}
                      disabled={actions.isPending}
                      onClick={() => setConfirm({ kind: "delete", versionId: v.VersionId })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "delete"
                ? t("preview.versions.deleteTitle")
                : t("preview.versions.restoreTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "delete"
                ? t("preview.versions.deleteConfirm")
                : t("preview.versions.restoreReplacesBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant={confirm?.kind === "delete" ? "destructive" : "default"}
              disabled={actions.isPending}
              onClick={() => {
                if (!confirm) return;
                const { kind, versionId } = confirm;
                void (kind === "delete"
                  ? actions.remove(versionId)
                  : actions.restore(versionId));
                setConfirm(null);
              }}
            >
              {confirm?.kind === "delete"
                ? t("preview.versions.delete")
                : t("preview.versions.restore")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
