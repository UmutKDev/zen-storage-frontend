"use client";

import { useState } from "react";
import {
  ChevronDown,
  FileDiff,
  History,
  RotateCcw,
  Trash2,
} from "lucide-react";
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
import { cn, formatBytes, formatDateTime } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useDocumentVersions } from "../hooks/useDocumentVersions";
import { useDocumentVersionActions } from "../hooks/useDocumentVersionActions";
import { useDocumentDiff } from "../hooks/useDocumentDiff";
import { useEditorStore } from "../stores/editor.store";
import { DiffView } from "./DiffView";

type Confirm = { kind: "restore" | "delete"; versionId: string };

/** A version's backend-computed diff vs current — lazily mounted on expand. */
function VersionDiff({ docKey, versionId }: { docKey: string; versionId: string }) {
  const { diff, isPending, isError, refetch } = useDocumentDiff(
    docKey,
    versionId,
    true,
  );
  if (isError) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground"
      >
        <span>{t("preview.diff.error")}</span>
        <Button variant="outline" size="xs" onClick={refetch}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }
  // Polite live region so the loading→loaded transition is announced (a bare
  // `aria-busy` on a non-live node says nothing) — mirrors the AvGate precedent.
  return (
    <div role="status" aria-busy={isPending}>
      {isPending || !diff ? (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          {t("preview.diff.loading")}
        </p>
      ) : (
        <DiffView diff={diff} />
      )}
    </div>
  );
}

/**
 * Collapsible **document** version history in the modal footer (editor files).
 * Lazy: versions load only once expanded. Each row can show a backend-computed
 * diff vs the current content (`view diff` toggle) and — when the editor holds
 * the lock — be restored or deleted (behind a confirm). A restore replaces the
 * current content and **reloads the open editor** (via the editor reload signal
 * in `useDocumentVersionActions`). When the doc is read-only (locked by another
 * user / lock lost), restore/delete are hidden but diffs stay viewable.
 */
export function DocumentVersionsPanel({ previewKey }: { previewKey: string }) {
  const [open, setOpen] = useState(false);
  const { versions, isPending, isError, refetch } = useDocumentVersions(
    previewKey,
    open,
  );
  const actions = useDocumentVersionActions(previewKey);
  const canEdit = useEditorStore((s) => s.canEdit);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [diffFor, setDiffFor] = useState<string | null>(null);

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
        <div className="max-h-72 overflow-auto px-2 pb-2">
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
                const showDiff = diffFor === v.VersionId;
                return (
                  <li
                    key={v.VersionId}
                    className="flex flex-col rounded-md px-2 py-1.5 hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-2">
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
                        aria-expanded={showDiff}
                        onClick={() =>
                          setDiffFor((cur) =>
                            cur === v.VersionId ? null : v.VersionId,
                          )
                        }
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
                            onClick={() =>
                              setConfirm({ kind: "restore", versionId: v.VersionId })
                            }
                          >
                            <RotateCcw className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${t("preview.versions.delete")} — ${when}`}
                            disabled={actions.isPending}
                            onClick={() =>
                              setConfirm({ kind: "delete", versionId: v.VersionId })
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </>
                      ) : null}
                    </div>
                    {showDiff ? (
                      <div className="mt-1.5">
                        <VersionDiff docKey={previewKey} versionId={v.VersionId} />
                      </div>
                    ) : null}
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
