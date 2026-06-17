"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
} from "@/components/ui";
import { formatBytes, formatDateTime } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useVersions } from "../hooks/useVersions";
import { useVersionActions } from "../hooks/useVersionActions";

type Confirm = { kind: "restore" | "delete"; versionId: string };

/**
 * Object-version history for the details rail's Versions tab (non-editor files).
 * The rail tab is the disclosure, so this fetches immediately (no collapsible
 * header). The latest version shows a "current" badge; older ones can be
 * restored or deleted (each behind a confirm).
 */
export function VersionHistoryRail({ previewKey }: { previewKey: string }) {
  const { versions, isPending, isError, refetch } = useVersions(previewKey, true);
  const actions = useVersionActions(previewKey);
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
                {v.IsLatest ? (
                  <Badge variant="info">{t("preview.versions.current")}</Badge>
                ) : (
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
                )}
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
                : t("preview.versions.restoreConfirm")}
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
