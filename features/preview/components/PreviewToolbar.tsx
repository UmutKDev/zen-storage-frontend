"use client";

import { useState } from "react";
import {
  Download,
  Maximize2,
  Minimize2,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";
import { t } from "@/lib/i18n";
import {
  DeleteConfirmDialog,
  useDelete,
  useDownload,
  type FolderEntry,
} from "@/features/storage";
import type { CloudObjectModel } from "@/service/models";
import { useShare } from "../hooks/useShare";

/**
 * Preview toolbar: title + download / share / delete / fullscreen / close.
 * Download + delete reuse storage's existing hooks (and its confirm dialog) so
 * the preview never re-implements cache invalidation. `blocked` (AV infected)
 * disables download + share. Deleting closes the modal via `onClose`.
 */
export function PreviewToolbar({
  object,
  folderPath,
  blocked,
  canFullscreen,
  isFullscreen,
  onToggleFullscreen,
  onClose,
}: {
  object: CloudObjectModel;
  folderPath: string;
  blocked: boolean;
  canFullscreen: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}) {
  const entry: FolderEntry = {
    kind: "file",
    key: object.Path.Key,
    name: object.Name,
    file: object,
  };
  const del = useDelete(folderPath, onClose);
  const { download } = useDownload();
  const { share, isPending: sharing } = useShare();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex items-center gap-1 border-b border-border/60 px-3 py-2">
      {/* The accessible dialog title lives (sr-only) in FilePreviewModal so it's
          present during loading too; this is just the visible label. */}
      <span className="min-w-0 flex-1 truncate px-1 text-sm font-medium text-foreground">
        {object.Name}
      </span>

      <Button
        variant="ghost"
        size="icon-sm"
        disabled={blocked}
        aria-label={t("preview.download")}
        onClick={() => download(object.Path.Key)}
      >
        <Download className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={blocked || sharing}
        aria-label={t("share.button")}
        onClick={() => void share(object.Path.Key, object.Name)}
      >
        <Share2 className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("storage.ops.menu.delete")}
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 className="size-4" />
      </Button>
      {canFullscreen ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={
            isFullscreen ? t("preview.exitFullscreen") : t("preview.fullscreen")
          }
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("preview.close")}
        onClick={onClose}
      >
        <X className="size-4" />
      </Button>

      {confirmDelete ? (
        <DeleteConfirmDialog
          entries={[entry]}
          open
          onOpenChange={(o) => !o && setConfirmDelete(false)}
          onConfirm={() => del.remove([entry])}
          isPending={del.isPending}
        />
      ) : null}
    </div>
  );
}
