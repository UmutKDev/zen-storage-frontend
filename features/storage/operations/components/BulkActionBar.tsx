"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, FileArchive, FolderInput, Trash2, X } from "lucide-react";
import { t } from "@/lib/i18n";
import { toast as toastVariant } from "@/lib/motion";
import { Button, Separator } from "@/components/ui";
import type { ItemSelection } from "../hooks/useItemSelection";
import { useDelete } from "../hooks/useDelete";
import { useDownload } from "../hooks/useDownload";
import { focusBrowseContent } from "../lib/feedback";
import { useStorageUiStore } from "../stores/storageUi.store";
import { ArchiveCreateDialog } from "../../archive/components/ArchiveCreateDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { MoveDialog } from "./MoveDialog";

/**
 * Floating bar shown while a selection exists: count, select-all, then bulk
 * move / download / delete over the selected entries. Each bulk mutation is a
 * single backend call; download loops presigns over files only (dirs are
 * skipped, the button disables when the selection holds no files).
 *
 * The move/delete dialogs are driven by the `storageUi` store so the ⌘K palette
 * can open them too — but they always operate on THIS surface's resolved
 * `selection.selectedEntries`, so the bulk path is identical either way.
 */
export function BulkActionBar({
  path,
  selection,
}: {
  path: string;
  selection: ItemSelection;
}) {
  const dialog = useStorageUiStore((s) => s.bulkDialog);
  const setDialog = useStorageUiStore((s) => s.openBulkDialog);
  const closeDialog = useStorageUiStore((s) => s.closeBulkDialog);
  const del = useDelete(path, () => closeDialog());
  const { downloadMany, isPending: downloading } = useDownload();
  const files = selection.selectedEntries.filter((e) => e.kind === "file");
  const noFiles = files.length === 0;

  // A bulk dialog must never outlive its selection — otherwise an intent left
  // over from a prior selection would auto-reopen on the next one. Close it when
  // the selection empties (Esc, folder change, completion).
  useEffect(() => {
    if (selection.count === 0) closeDialog();
  }, [selection.count, closeDialog]);

  // Clearing unmounts this bar — hand focus to the browse surface first, so a
  // keyboard user (or Radix's dialog-close restore) doesn't land on <body>.
  const clearAndRefocus = () => {
    selection.clear();
    focusBrowseContent();
  };

  return (
    <>
      <AnimatePresence>
        {selection.count > 0 ? (
          <motion.div
            variants={toastVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-wrap items-center gap-1.5 self-center rounded-lg border border-border bg-surface-elevated px-3 py-1.5 shadow-e2"
          >
            <span className="px-1 text-sm font-medium tabular-nums text-foreground">
              {selection.count} {t("storage.ops.selection.selectedSuffix")}
            </span>
            {selection.allSelected ? null : (
              <Button variant="ghost" size="sm" onClick={selection.selectAll}>
                {t("storage.ops.selection.selectAll")}
              </Button>
            )}
            <Separator orientation="vertical" className="mx-1 h-5" />
            <Button variant="ghost" size="sm" onClick={() => setDialog("move")}>
              <FolderInput className="size-4" />
              {t("storage.ops.menu.move")}
            </Button>
            {/* aria-disabled (not disabled) keeps it focusable so keyboard/SR
                users can discover WHY it's unavailable via the description. */}
            <Button
              variant="ghost"
              size="sm"
              aria-disabled={noFiles || downloading}
              aria-describedby={noFiles ? "bulk-download-hint" : undefined}
              className="aria-disabled:pointer-events-auto aria-disabled:opacity-50"
              title={noFiles ? t("storage.ops.bulk.downloadNone") : undefined}
              onClick={() => {
                if (noFiles || downloading) return;
                void downloadMany(files.map((f) => f.key));
              }}
            >
              <Download className="size-4" />
              {t("storage.ops.menu.download")}
            </Button>
            {noFiles ? (
              <span id="bulk-download-hint" className="sr-only">
                {t("storage.ops.bulk.downloadNone")}
              </span>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDialog("archive")}
            >
              <FileArchive className="size-4" />
              {t("storage.ops.menu.archive")}
            </Button>
            <Button
              variant="ghost-destructive"
              size="sm"
              onClick={() => setDialog("delete")}
            >
              <Trash2 className="size-4" />
              {t("storage.ops.menu.delete")}
            </Button>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={t("storage.ops.selection.clear")}
              onClick={clearAndRefocus}
            >
              <X className="size-4" />
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {dialog === "move" && selection.count > 0 ? (
        <MoveDialog
          entries={selection.selectedEntries}
          currentPath={path}
          open
          onOpenChange={(o) => !o && closeDialog()}
          onMoved={clearAndRefocus}
        />
      ) : null}
      {dialog === "delete" && selection.count > 0 ? (
        <DeleteConfirmDialog
          entries={selection.selectedEntries}
          open
          onOpenChange={(o) => !o && closeDialog()}
          onConfirm={() => {
            // Keep the selection on failure so the user can retry.
            void del.remove(selection.selectedEntries).then((ok) => {
              if (ok) clearAndRefocus();
            });
          }}
          isPending={del.isPending}
        />
      ) : null}
      {dialog === "archive" && selection.count > 0 ? (
        <ArchiveCreateDialog
          entries={selection.selectedEntries}
          path={path}
          open
          onOpenChange={(o) => !o && closeDialog()}
          onArchived={clearAndRefocus}
        />
      ) : null}
    </>
  );
}
