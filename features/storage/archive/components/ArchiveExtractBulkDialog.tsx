"use client";

import { useState } from "react";
import { ArchiveRestore, FileArchive, Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import type { FolderEntry } from "../../browse/lib/entries";
import type { ArchiveConflictStrategy } from "../api/archive.api";
import { useArchiveExtractStart } from "../hooks/useArchiveExtractStart";

/**
 * Bulk extract dialog (§6.3 bulk mode), launched from the bulk-selection bar when
 * 2+ archives are selected. No per-archive preview — the backend extracts each
 * archive whole, so this shows only the extraction order plus ONE shared conflict
 * strategy + new-folder choice. Start → N `archive-extract` jobs (one per archive,
 * in order) appear in the topbar `JobsMenu`; the dialog closes. No in-dialog
 * progress (the job tray owns that).
 */
export function ArchiveExtractBulkDialog({
  archives,
  path,
  open,
  onOpenChange,
  onExtracted,
}: {
  archives: FolderEntry[];
  path: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExtracted?: () => void;
}) {
  const { startMany, starting } = useArchiveExtractStart(path);
  const [strategy, setStrategy] = useState<ArchiveConflictStrategy>("KEEP_BOTH");
  const [createFolder, setCreateFolder] = useState(true);

  const onExtract = async () => {
    const { ok } = await startMany(archives, { strategy, createFolder });
    // Keep the selection only if EVERY archive failed, so the user can retry;
    // each failure already surfaced its own error.
    if (ok === 0) return;
    onOpenChange(false);
    onExtracted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArchiveRestore
              className="size-5 text-muted-foreground"
              aria-hidden
            />
            {t("storage.archive.extract.bulkTitle")}
          </DialogTitle>
          <DialogDescription>
            {`${archives.length} ${t("storage.archive.extract.bulkCountSuffix")}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Extraction order — numbered, no preview (each archive extracts whole). */}
          <div className="space-y-2">
            <ol className="max-h-52 space-y-0.5 overflow-y-auto">
              {archives.map((a, i) => (
                <li
                  key={a.key}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm"
                >
                  <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <FileArchive
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {a.name}
                  </span>
                </li>
              ))}
            </ol>
            <p className="px-2 text-xs text-muted-foreground">
              {t("storage.archive.extract.bulkOrderNote")}
            </p>
          </div>

          {/* New folder (shared across all archives) */}
          <div className="flex items-center justify-between gap-4">
            <Label
              htmlFor="bulk-extract-new-folder"
              className="flex flex-col gap-0.5"
            >
              <span className="text-sm font-medium">
                {t("storage.archive.extract.newFolder")}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {createFolder
                  ? t("storage.archive.extract.bulkNewFolderHint")
                  : t("storage.archive.extract.intoThisFolder")}
              </span>
            </Label>
            <Switch
              id="bulk-extract-new-folder"
              checked={createFolder}
              onCheckedChange={setCreateFolder}
            />
          </div>

          {/* Conflict strategy (shared) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("storage.archive.extract.onConflict")}
            </Label>
            <Tabs
              value={strategy}
              onValueChange={(v) => setStrategy(v as ArchiveConflictStrategy)}
            >
              <TabsList className="w-full">
                <TabsTrigger value="KEEP_BOTH">
                  {t("storage.archive.extract.keepBoth")}
                </TabsTrigger>
                <TabsTrigger value="SKIP">
                  {t("storage.archive.extract.skip")}
                </TabsTrigger>
                <TabsTrigger value="REPLACE">
                  {t("storage.archive.extract.replace")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("storage.archive.extract.cancel")}
          </Button>
          <Button
            onClick={() => void onExtract()}
            disabled={starting || archives.length === 0}
          >
            {starting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {t("storage.archive.extract.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
