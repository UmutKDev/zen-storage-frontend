"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, FolderInput, Trash2, Upload, type LucideIcon } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useFlag } from "@/lib/flags";
import { previewHref } from "@/lib/preview";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui";
import type { FolderEntry } from "../../browse/lib/entries";
import { folderHref } from "../../browse/lib/href";
import { useUploadsStore } from "../../upload/stores/uploads.store";
import { useDelete } from "../hooks/useDelete";
import { useStorageUiStore } from "../stores/storageUi.store";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { MoveDialog } from "./MoveDialog";

function SheetAction({
  icon: Icon,
  label,
  destructive,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        destructive ? "text-destructive" : "text-foreground",
      )}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}

/**
 * The touch-only action sheet (bottom `Sheet`, glass) opened by a long-press on
 * a row/card — the accessible alternative to desktop drag-and-drop. Move / Add
 * files / Delete reuse the same dialogs + hooks as the rest of storage; "Add
 * files" targets the pressed folder (a file row uploads into the current folder).
 * Mounted once per browse surface, driven by `storageUi.sheetEntry`.
 */
export function EntryActionsSheet({ path }: { path: string }) {
  const entry = useStorageUiStore((s) => s.sheetEntry);
  const closeSheet = useStorageUiStore((s) => s.closeSheet);
  const openUpload = useUploadsStore((s) => s.setDialogOpen);
  const router = useRouter();
  const previewEnabled = useFlag("preview");

  const [dialog, setDialog] = useState<null | "move" | "delete">(null);
  const del = useDelete(path, () => setDialog(null));

  // Keep the last entry while the sheet/dialog animates closed (the store clears
  // sheetEntry on close, but the dialogs still need the target).
  const [shown, setShown] = useState<FolderEntry | null>(entry);
  if (entry !== null && entry !== shown) setShown(entry);

  const onPreview = () => {
    closeSheet();
    if (shown?.kind === "file") router.push(previewHref(shown.file.Path.Key));
  };
  const onMove = () => {
    closeSheet();
    setDialog("move");
  };
  const onDelete = () => {
    closeSheet();
    setDialog("delete");
  };
  const onAddFiles = () => {
    closeSheet();
    if (shown?.kind === "dir") router.push(folderHref(path, shown.name));
    openUpload(true);
  };

  return (
    <>
      <Sheet open={entry !== null} onOpenChange={(o) => !o && closeSheet()}>
        <SheetContent side="bottom" className="pb-[max(env(safe-area-inset-bottom),1rem)]">
          <SheetHeader>
            <SheetTitle className="truncate">
              {shown?.name ?? t("storage.sheet.title")}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {t("storage.sheet.description")}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-2 pb-4">
            {shown?.kind === "file" && previewEnabled ? (
              <SheetAction
                icon={Eye}
                label={t("storage.ops.menu.preview")}
                onClick={onPreview}
              />
            ) : null}
            <SheetAction
              icon={FolderInput}
              label={t("storage.sheet.move")}
              onClick={onMove}
            />
            <SheetAction
              icon={Upload}
              label={t("storage.sheet.addFiles")}
              onClick={onAddFiles}
            />
            <SheetAction
              icon={Trash2}
              label={t("storage.sheet.delete")}
              destructive
              onClick={onDelete}
            />
          </div>
        </SheetContent>
      </Sheet>

      {dialog === "move" && shown ? (
        <MoveDialog
          entries={[shown]}
          currentPath={path}
          open
          onOpenChange={(o) => !o && setDialog(null)}
        />
      ) : null}
      {dialog === "delete" && shown ? (
        <DeleteConfirmDialog
          entries={[shown]}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          onConfirm={() => del.remove([shown])}
          isPending={del.isPending}
        />
      ) : null}
    </>
  );
}
