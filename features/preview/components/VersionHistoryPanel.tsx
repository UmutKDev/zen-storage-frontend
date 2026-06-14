"use client";

import { useState } from "react";
import { ChevronDown, History, RotateCcw, Trash2 } from "lucide-react";
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
import { cn, formatBytes, formatDateTime } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useVersions } from "../hooks/useVersions";
import { useVersionActions } from "../hooks/useVersionActions";

type Confirm = { kind: "restore" | "delete"; versionId: string };

/**
 * Collapsible object-version history in the modal footer. Lazy: versions are
 * fetched only once the panel is expanded. The latest version shows a "current"
 * badge and offers no actions; older versions can be restored or deleted (each
 * behind a confirm). Document versions + diff are Stage C.
 */
export function VersionHistoryPanel({ previewKey }: { previewKey: string }) {
  const [open, setOpen] = useState(false);
  const { versions, isPending, isError, refetch } = useVersions(previewKey, open);
  const actions = useVersionActions(previewKey);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left font-medium text-foreground outline-none transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <History className="size-4 text-muted-foreground" />
        <span className="flex-1">{t("preview.versions.title")}</span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="max-h-56 overflow-auto px-2 pb-2">
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
        </div>
      ) : null}

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
