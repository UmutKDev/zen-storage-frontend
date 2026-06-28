"use client";

import { useState } from "react";
import { File, Folder, FolderArchive, Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";
import { formatBytes } from "@/lib/utils";
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Label,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { VirtualList } from "@/components/patterns/virtual-list";
import type { CloudArchivePreviewEntryModel } from "@/service/models";
import type { ArchiveConflictStrategy } from "../api/archive.api";
import { archiveExtractFolderName } from "../lib/archive";
import { useArchiveExtract } from "../hooks/useArchiveExtract";

function PreviewRow({
  entry,
  checked,
  onToggle,
}: {
  entry: CloudArchivePreviewEntryModel;
  checked: boolean;
  onToggle: (path: string) => void;
}) {
  const isDir = entry.Type === "directory";
  const Icon = isDir ? Folder : File;
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/50">
      <Checkbox
        checked={checked}
        onCheckedChange={() => onToggle(entry.Path)}
        aria-label={entry.Path}
      />
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
        {entry.Path}
      </span>
      {!isDir ? (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatBytes(entry.Size)}
        </span>
      ) : null}
    </label>
  );
}

/**
 * Extract dialog (§6.3), launched from an archive file's row menu. Previews the
 * archive entries, lets the user pick a subset (default all) and how to handle an
 * existing output folder (Keep both / Skip / Replace — chosen up front, since a
 * batch job can't prompt mid-extract), Start → the dialog closes and progress
 * shows in the topbar `JobsMenu`; extracted files appear in the folder.
 */
export function ArchiveExtractDialog({
  archiveKey,
  archiveName,
  path,
  open,
  onOpenChange,
  onExtracted,
}: {
  archiveKey: string;
  archiveName: string;
  path: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful start (e.g. the bulk bar clears the selection). */
  onExtracted?: () => void;
}) {
  // Preview is OPT-IN: the dialog no longer auto-reads the archive (slow/huge
  // archives stalled or failed and blocked Extract). The user opens it to pick a
  // subset; otherwise Extract just takes the whole archive.
  const [previewRequested, setPreviewRequested] = useState(false);
  const { preview, start, starting } = useArchiveExtract(
    archiveKey,
    archiveName,
    path,
    previewRequested,
  );
  const [strategy, setStrategy] =
    useState<ArchiveConflictStrategy>("KEEP_BOTH");
  const [createFolder, setCreateFolder] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [seededKey, setSeededKey] = useState<string | null>(null);

  const entries = preview.data?.Entries ?? [];
  const folderName = archiveExtractFolderName(archiveName);

  // Render-time guarded seed (derive-on-change; an effect would cascade-render):
  // default-select every entry when the preview first arrives.
  if (preview.data && seededKey !== archiveKey) {
    setSeededKey(archiveKey);
    setSelected(new Set(preview.data.Entries.map((e) => e.Path)));
  }

  const allSelected = entries.length > 0 && selected.size === entries.length;
  const toggle = (p: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(entries.map((e) => e.Path)));

  const previewLoaded = previewRequested && Boolean(preview.data);

  // No in-dialog "started" announcement: the dialog closes on start, so a local
  // aria-live region would unmount before it could be read. The persistent topbar
  // JobsMenu surfaces the running job immediately and announces its outcome.
  const onExtract = async () => {
    const ok = await start({
      // Whole archive (omit the list) unless the user previewed AND deselected
      // some entries — so Extract works without ever loading the preview.
      selectedEntries:
        previewLoaded && !allSelected ? [...selected] : undefined,
      strategy,
      createFolder,
    });
    if (!ok) return;
    onOpenChange(false);
    onExtracted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        {/* Header */}
        <div className="shrink-0 border-b border-border/60 px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <FolderArchive
              className="size-5 text-muted-foreground"
              aria-hidden
            />
            <span className="truncate">{archiveName}</span>
            {preview.data ? (
              <Badge variant="info" className="ml-auto shrink-0 uppercase">
                {preview.data.Format}
              </Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription className="mt-1">
            {createFolder
              ? `${t("storage.archive.extract.into")} ${folderName}/`
              : t("storage.archive.extract.intoThisFolder")}
          </DialogDescription>
        </div>

        {/* Body */}
        {!previewRequested ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <p className="max-w-xs text-sm text-muted-foreground">
              {t("storage.archive.extract.previewHint")}
            </p>
            <Button variant="outline" onClick={() => setPreviewRequested(true)}>
              {t("storage.archive.extract.previewContents")}
            </Button>
          </div>
        ) : preview.isPending ? (
          <div className="flex min-h-0 flex-1 items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("storage.archive.extract.loading")}
          </div>
        ) : preview.isError ? (
          <div className="min-h-0 flex-1 space-y-4 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {t("storage.archive.extract.previewError")}
            </p>
            <Button variant="outline" onClick={() => void preview.refetch()}>
              {t("storage.archive.extract.retry")}
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="min-h-0 flex-1 px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">
              {t("storage.archive.extract.empty")}
            </p>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-6 py-2.5">
              <button
                type="button"
                onClick={toggleAll}
                className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-pressed={allSelected}
              >
                {allSelected
                  ? t("storage.archive.extract.selectNone")
                  : t("storage.archive.extract.selectAll")}
              </button>
              <span className="text-xs tabular-nums text-muted-foreground">
                {`${selected.size} / ${entries.length} ${t("storage.archive.extract.selectedSuffix")}`}
              </span>
            </div>
            <VirtualList
              rows={entries}
              estimateSize={36}
              getRowKey={(e) => e.Path}
              ariaLabel={t("storage.archive.extract.entriesLabel")}
              className="min-h-0 flex-1 px-4 py-2"
              renderRow={(e) => (
                <PreviewRow
                  entry={e}
                  checked={selected.has(e.Path)}
                  onToggle={toggle}
                />
              )}
            />
          </>
        )}

        {/* Footer */}
        <div className="shrink-0 space-y-3 border-t border-border/60 bg-muted/20 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Label
              htmlFor="archive-new-folder"
              className="flex flex-col gap-0.5 items-start"
            >
              <span className="text-sm font-medium">
                {t("storage.archive.extract.newFolder")}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {createFolder
                  ? `${folderName}/`
                  : t("storage.archive.extract.intoThisFolder")}
              </span>
            </Label>
            <Switch
              id="archive-new-folder"
              checked={createFolder}
              onCheckedChange={setCreateFolder}
            />
          </div>
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("storage.archive.extract.cancel")}
            </Button>
            <Button
              onClick={() => void onExtract()}
              disabled={starting || (previewLoaded && selected.size === 0)}
            >
              {starting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {t("storage.archive.extract.submit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
