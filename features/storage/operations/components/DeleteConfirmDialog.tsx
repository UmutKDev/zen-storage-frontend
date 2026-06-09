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
  entries,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  entries: ReadonlyArray<FolderEntry>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const bulk = entries.length > 1;
  const isDir = entries[0]?.kind === "dir";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {bulk
              ? `${t("storage.ops.bulk.deletePrefix")} ${entries.length} ${t("storage.ops.bulk.deleteTitleSuffix")}`
              : isDir
                ? t("storage.ops.delete.titleFolder")
                : t("storage.ops.delete.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {bulk
              ? t("storage.ops.bulk.deleteDescription")
              : isDir
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
