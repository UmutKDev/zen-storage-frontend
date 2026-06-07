"use client";

import { useState } from "react";
import {
  Download,
  FolderInput,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { t } from "@/lib/i18n";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import type { FolderEntry } from "../../browse/lib/entries";
import { useRename } from "../hooks/useRename";
import { useDelete } from "../hooks/useDelete";
import { useDownload } from "../hooks/useDownload";
import { NameDialog } from "./NameDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { MoveDialog } from "./MoveDialog";

type OpenDialog = null | "rename" | "move" | "delete";

/** Per-row/card actions menu (rename / move / download / delete) + its dialogs. */
export function EntryActionsMenu({
  entry,
  path,
}: {
  entry: FolderEntry;
  path: string;
}) {
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const rename = useRename(entry, path, () => setDialog(null));
  const del = useDelete(path, () => setDialog(null));
  const { download } = useDownload();
  const close = () => setDialog(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={t("storage.ops.menu.actions")}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setDialog("rename")}>
            <Pencil className="size-4" />
            {t("storage.ops.menu.rename")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("move")}>
            <FolderInput className="size-4" />
            {t("storage.ops.menu.move")}
          </DropdownMenuItem>
          {entry.kind === "file" ? (
            <DropdownMenuItem onSelect={() => download(entry.file.Path.Key)}>
              <Download className="size-4" />
              {t("storage.ops.menu.download")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDialog("delete")}
          >
            <Trash2 className="size-4" />
            {t("storage.ops.menu.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {dialog === "rename" ? (
        <NameDialog
          open
          onOpenChange={(o) => !o && close()}
          title={t("storage.ops.rename.title")}
          label={t("storage.ops.rename.label")}
          submitLabel={t("storage.ops.rename.submit")}
          defaultValue={entry.name}
          isPending={rename.isPending}
          conflict={rename.conflict}
          onSubmit={(name) => rename.mutate({ name })}
          onResolve={rename.resolve}
          onCancelConflict={rename.cancelConflict}
        />
      ) : null}
      {dialog === "move" ? (
        <MoveDialog
          entry={entry}
          currentPath={path}
          open
          onOpenChange={(o) => !o && close()}
        />
      ) : null}
      {dialog === "delete" ? (
        <DeleteConfirmDialog
          entry={entry}
          open
          onOpenChange={(o) => !o && close()}
          onConfirm={() => del.remove(entry)}
          isPending={del.isPending}
        />
      ) : null}
    </>
  );
}
