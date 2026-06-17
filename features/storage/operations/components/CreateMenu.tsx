"use client";

import { ChevronDown, FileText, FolderPlus, Plus } from "lucide-react";
import { t } from "@/lib/i18n";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRichItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useStorageUiStore } from "../stores/storageUi.store";
import { NewDocumentDialog } from "./NewDocumentDialog";
import { NewFolderDialog } from "./NewFolderDialog";

/** Header "New" menu → Directory / Document, on the sectioned create dialogs.
 *  Outline (not filled) so the hero Upload stays the single orange action.
 *  The open/close intent lives in `storageUi` so the ⌘K palette can open these
 *  dialogs too. */
export function CreateMenu({ path }: { path: string }) {
  const dialog = useStorageUiStore((s) => s.createDialog);
  const openDialog = useStorageUiStore((s) => s.openCreateDialog);
  const closeDialog = useStorageUiStore((s) => s.closeCreateDialog);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="size-4" />
            {t("storage.ops.new")}
            <ChevronDown className="-ml-0.5 size-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuRichItem
            icon={FolderPlus}
            label={t("storage.ops.create.directory")}
            description={t("storage.ops.create.directoryDesc")}
            onSelect={() => openDialog("folder")}
          />
          <DropdownMenuRichItem
            icon={FileText}
            label={t("storage.ops.create.document")}
            description={t("storage.ops.create.documentDesc")}
            onSelect={() => openDialog("file")}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      {dialog === "folder" ? (
        <NewFolderDialog
          path={path}
          open
          onOpenChange={(o) => !o && closeDialog()}
        />
      ) : null}
      {dialog === "file" ? (
        <NewDocumentDialog
          path={path}
          open
          onOpenChange={(o) => !o && closeDialog()}
        />
      ) : null}
    </>
  );
}
