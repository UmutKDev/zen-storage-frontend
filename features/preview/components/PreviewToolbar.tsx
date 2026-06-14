"use client";

import { useState } from "react";
import {
  Download,
  History,
  Maximize2,
  Minimize2,
  MoreVertical,
  PanelRightClose,
  PanelRightOpen,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRichItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { fileMeta, formatBytes } from "@/lib/utils";
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
 * Preview header (Zen lightbox): a neutral icon tile + file name + meta line
 * (type · size), then the action strip — Share, version History (focuses the
 * rail's Versions tab), a More menu (Download / Delete), a details-rail toggle,
 * a layout-fullscreen toggle, and Close. `blocked` (AV infected) disables the
 * outward actions (share/download); deleting closes the modal via `onClose`.
 */
export function PreviewToolbar({
  object,
  folderPath,
  blocked,
  railOpen,
  layoutFullscreen,
  onToggleRail,
  onToggleFullscreen,
  onHistoryClick,
  onClose,
}: {
  object: CloudObjectModel;
  folderPath: string;
  blocked: boolean;
  railOpen: boolean;
  layoutFullscreen: boolean;
  onToggleRail: () => void;
  onToggleFullscreen: () => void;
  onHistoryClick: () => void;
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
  const meta = fileMeta(object.Name, "file");
  const FileIcon = meta.icon;

  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
      <div
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground"
      >
        <FileIcon className="size-[18px]" />
      </div>

      {/* The accessible dialog title lives (sr-only) in FilePreviewModal so it's
          present during loading too; this is the visible label + meta line. */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-base font-semibold text-foreground">
          {object.Name}
        </span>
        <span className="truncate text-xs tabular-nums text-muted-foreground">
          {meta.label} · {formatBytes(object.Size)}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
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
          aria-label={t("preview.versions.title")}
          onClick={onHistoryClick}
        >
          <History className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={t("preview.moreActions")}>
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuRichItem
              icon={Download}
              label={t("preview.download")}
              disabled={blocked}
              onSelect={() => download(object.Path.Key)}
            />
            <DropdownMenuRichItem
              icon={Trash2}
              label={t("storage.ops.menu.delete")}
              variant="destructive"
              onSelect={() => setConfirmDelete(true)}
            />
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-pressed={railOpen}
          aria-label={railOpen ? t("preview.hideDetails") : t("preview.showDetails")}
          onClick={onToggleRail}
        >
          {railOpen ? (
            <PanelRightClose className="size-4" />
          ) : (
            <PanelRightOpen className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-pressed={layoutFullscreen}
          aria-label={
            layoutFullscreen ? t("preview.exitFullscreen") : t("preview.fullscreen")
          }
          onClick={onToggleFullscreen}
        >
          {layoutFullscreen ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </Button>

        <span className="mx-1.5 h-5 w-px bg-border" aria-hidden />

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("preview.close")}
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

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
