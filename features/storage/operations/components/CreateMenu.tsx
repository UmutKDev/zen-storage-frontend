"use client";

import { useState } from "react";
import { FilePlus, FolderPlus, Plus } from "lucide-react";
import { t } from "@/lib/i18n";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useCreateFolder } from "../hooks/useCreateFolder";
import { useCreateFile } from "../hooks/useCreateFile";
import { NameDialog } from "./NameDialog";

/** Header "New" menu → create folder / create file. */
export function CreateMenu({ path }: { path: string }) {
  const [dialog, setDialog] = useState<null | "folder" | "file">(null);
  const folder = useCreateFolder(path, () => setDialog(null));
  const file = useCreateFile(path, () => setDialog(null));
  const close = () => setDialog(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm">
            <Plus className="size-4" />
            {t("storage.ops.new")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setDialog("folder")}>
            <FolderPlus className="size-4" />
            {t("storage.ops.create.folder")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("file")}>
            <FilePlus className="size-4" />
            {t("storage.ops.create.file")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {dialog === "folder" ? (
        <NameDialog
          open
          onOpenChange={(o) => !o && close()}
          title={t("storage.ops.create.folderTitle")}
          label={t("storage.ops.create.folderName")}
          submitLabel={t("storage.ops.create.submit")}
          isPending={folder.isPending}
          conflict={folder.conflict}
          onSubmit={(name) => folder.mutate({ name })}
          onResolve={folder.resolve}
          onCancelConflict={folder.cancelConflict}
        />
      ) : null}
      {dialog === "file" ? (
        <NameDialog
          open
          onOpenChange={(o) => !o && close()}
          title={t("storage.ops.create.fileTitle")}
          label={t("storage.ops.create.fileName")}
          submitLabel={t("storage.ops.create.submit")}
          isPending={file.isPending}
          conflict={file.conflict}
          onSubmit={(name) => file.mutate({ name })}
          onResolve={file.resolve}
          onCancelConflict={file.cancelConflict}
        />
      ) : null}
    </>
  );
}
