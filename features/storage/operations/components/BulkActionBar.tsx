"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArchiveRestore,
  CheckCheck,
  Download,
  FileArchive,
  FolderInput,
  Trash2,
  X,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { bulkBar as bulkBarVariant } from "@/lib/motion";
import {
  Button,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import type { ItemSelection } from "../hooks/useItemSelection";
import { useDelete } from "../hooks/useDelete";
import { useDownload } from "../hooks/useDownload";
import { focusBrowseContent } from "../lib/feedback";
import { useStorageUiStore } from "../stores/storageUi.store";
import { isExtractableArchive } from "../../archive/lib/archive";
import { ArchiveCreateDialog } from "../../archive/components/ArchiveCreateDialog";
import { ArchiveExtractDialog } from "../../archive/components/ArchiveExtractDialog";
import { ArchiveExtractBulkDialog } from "../../archive/components/ArchiveExtractBulkDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { MoveDialog } from "./MoveDialog";

/**
 * Floating bulk-selection bar shown while a selection exists: a glass pill with a
 * tinted count anchor, then select-all + bulk move / archive / extract / download
 * / delete over the selected entries. Each bulk mutation is a single backend call;
 * download loops presigns over files only, and Extract appears only when the
 * selection holds archives (acting on that archive subset, like download does for
 * files). 1 archive → the preview/subset dialog; 2+ → the ordered bulk dialog
 * (one `archive-extract` job each).
 *
 * The move/delete/archive/extract dialogs are driven by the `storageUi` store so
 * the ⌘K palette can open them too — but they always operate on THIS surface's
 * resolved `selection.selectedEntries`, so the bulk path is identical either way.
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
  const archives = files.filter((e) => isExtractableArchive(e.name));

  // A bulk dialog must never outlive its selection — otherwise an intent left
  // over from a prior selection would auto-reopen on the next one. Close it when
  // the selection empties (Esc, folder change, completion).
  useEffect(() => {
    if (selection.count === 0) closeDialog();
  }, [selection.count, closeDialog]);

  // Extract is archive-specific: if the user deselects the last archive (while
  // keeping other files), close the extract dialog so it can't render mismatched.
  useEffect(() => {
    if (dialog === "extract" && archives.length === 0) closeDialog();
  }, [dialog, archives.length, closeDialog]);

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
            variants={bulkBarVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-overlay flex flex-wrap items-center gap-1 self-center rounded-full px-2.5 py-1.5"
          >
            <span className="flex items-center gap-2 pl-1 pr-0.5">
              <span
                className="zs-tile-icon zs-tone-brand size-6 rounded-md"
                aria-hidden
              >
                <CheckCheck className="size-3.5" />
              </span>
              <span className="text-sm font-medium tabular-nums text-foreground">
                {selection.count} {t("storage.ops.selection.selectedSuffix")}
              </span>
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
            {archives.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDialog("extract")}
              >
                <ArchiveRestore className="size-4" />
                {t("storage.ops.menu.extract")}
              </Button>
            ) : null}
            <Button
              variant="ghost-destructive"
              size="sm"
              onClick={() => setDialog("delete")}
            >
              <Trash2 className="size-4" />
              {t("storage.ops.menu.delete")}
            </Button>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={t("storage.ops.selection.clear")}
                  onClick={clearAndRefocus}
                >
                  <X className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t("storage.ops.selection.clear")}
              </TooltipContent>
            </Tooltip>
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
      {dialog === "extract" && archives.length === 1 ? (
        <ArchiveExtractDialog
          archiveKey={archives[0].key}
          archiveName={archives[0].name}
          path={path}
          open
          onOpenChange={(o) => !o && closeDialog()}
          onExtracted={clearAndRefocus}
        />
      ) : null}
      {dialog === "extract" && archives.length >= 2 ? (
        <ArchiveExtractBulkDialog
          archives={archives}
          path={path}
          open
          onOpenChange={(o) => !o && closeDialog()}
          onExtracted={clearAndRefocus}
        />
      ) : null}
    </>
  );
}
