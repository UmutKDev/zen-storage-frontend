"use client";

import { useState } from "react";
import { FileText, FolderPlus, Plus } from "lucide-react";
import { t } from "@/lib/i18n";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRichItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { NewDocumentDialog } from "./NewDocumentDialog";
import { NewFolderDialog } from "./NewFolderDialog";

/** Header "New" menu → Directory / Document, on the sectioned create dialogs.
 *  Outline (not filled) so the hero Upload stays the single orange action. */
export function CreateMenu({ path }: { path: string }) {
  const [dialog, setDialog] = useState<null | "folder" | "file">(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="size-4" />
            {t("storage.ops.new")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuRichItem
            icon={FolderPlus}
            label={t("storage.ops.create.directory")}
            description={t("storage.ops.create.directoryDesc")}
            onSelect={() => setDialog("folder")}
          />
          <DropdownMenuRichItem
            icon={FileText}
            label={t("storage.ops.create.document")}
            description={t("storage.ops.create.documentDesc")}
            onSelect={() => setDialog("file")}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      {dialog === "folder" ? (
        <NewFolderDialog
          path={path}
          open
          onOpenChange={(o) => !o && setDialog(null)}
        />
      ) : null}
      {dialog === "file" ? (
        <NewDocumentDialog
          path={path}
          open
          onOpenChange={(o) => !o && setDialog(null)}
        />
      ) : null}
    </>
  );
}
