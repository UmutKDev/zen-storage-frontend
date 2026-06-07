"use client";

import { t } from "@/lib/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui";
import type { FolderEntry } from "../../browse/lib/entries";

export function DeleteConfirmDialog({
  entry,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  entry: FolderEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const isDir = entry.kind === "dir";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDir
              ? t("storage.ops.delete.titleFolder")
              : t("storage.ops.delete.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDir
              ? t("storage.ops.delete.descriptionFolder")
              : t("storage.ops.delete.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {t("storage.ops.delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
