"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  FolderArchive,
  FolderInput,
  KeyRound,
  Lock,
  Trash2,
  Unlock,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useFlag } from "@/lib/flags";
import { previewHref } from "@/lib/preview";
import {
  useSecureFolderUiStore,
  type SecureActionKind,
} from "@/features/secure-folders";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui";
import type { FolderEntry } from "../../browse/lib/entries";
import { folderHref, folderPathOf } from "../../browse/lib/href";
import { isExtractableArchive } from "../../archive/lib/archive";
import { ArchiveExtractDialog } from "../../archive/components/ArchiveExtractDialog";
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

  const [dialog, setDialog] = useState<null | "move" | "delete" | "extract">(
    null,
  );
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
  const onExtract = () => {
    closeSheet();
    setDialog("extract");
  };
  const onAddFiles = () => {
    closeSheet();
    if (shown?.kind === "dir") router.push(folderHref(path, shown.name));
    openUpload(true);
  };
  const onSecure = (kind: SecureActionKind) => {
    closeSheet();
    if (!shown || shown.kind !== "dir") return;
    useSecureFolderUiStore.getState().open({
      kind,
      path: folderPathOf(path, shown.name),
      ...(kind === "unlock"
        ? { mode: "folder", navigateTo: folderHref(path, shown.name) }
        : {}),
    });
  };
  const dir = shown?.kind === "dir" ? shown.dir : null;

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
            {dir && dir.IsEncrypted && dir.IsLocked ? (
              <SheetAction
                icon={Unlock}
                label={t("storage.ops.secure.lockedFolder.action")}
                onClick={() => onSecure("unlock")}
              />
            ) : null}
            {dir && !dir.IsEncrypted ? (
              <SheetAction
                icon={Lock}
                label={t("storage.ops.secure.encrypt.action")}
                onClick={() => onSecure("encrypt")}
              />
            ) : null}
            {dir && dir.IsEncrypted && !dir.IsLocked ? (
              <>
                <SheetAction
                  icon={Unlock}
                  label={t("storage.ops.secure.lock.action")}
                  onClick={() => onSecure("lock")}
                />
                <SheetAction
                  icon={KeyRound}
                  label={t("storage.ops.secure.decrypt.action")}
                  onClick={() => onSecure("decrypt")}
                />
              </>
            ) : null}
            {dir && !dir.IsHidden ? (
              <SheetAction
                icon={EyeOff}
                label={t("storage.ops.secure.hide.action")}
                onClick={() => onSecure("hide")}
              />
            ) : null}
            {dir && dir.IsHidden ? (
              <>
                <SheetAction
                  icon={Eye}
                  label={t("storage.ops.secure.unhide.action")}
                  onClick={() => onSecure("unhide")}
                />
                <SheetAction
                  icon={EyeOff}
                  label={t("storage.ops.secure.conceal.action")}
                  onClick={() => onSecure("conceal")}
                />
              </>
            ) : null}
            <SheetAction
              icon={FolderInput}
              label={t("storage.sheet.move")}
              onClick={onMove}
            />
            {shown?.kind === "file" && isExtractableArchive(shown.name) ? (
              <SheetAction
                icon={FolderArchive}
                label={t("storage.ops.menu.extract")}
                onClick={onExtract}
              />
            ) : null}
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
      {dialog === "extract" && shown?.kind === "file" ? (
        <ArchiveExtractDialog
          archiveKey={shown.file.Path.Key}
          archiveName={shown.name}
          path={path}
          open
          onOpenChange={(o) => !o && setDialog(null)}
        />
      ) : null}
    </>
  );
}
