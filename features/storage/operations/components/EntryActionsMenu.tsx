"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  EyeOff,
  FolderArchive,
  FolderInput,
  KeyRound,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
  Unlock,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { useFlag } from "@/lib/flags";
import { previewHref } from "@/lib/preview";
import { useSecureFolderUiStore } from "@/features/secure-folders";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import type { FolderEntry } from "../../browse/lib/entries";
import { folderPathOf } from "../../browse/lib/href";
import { isExtractableArchive } from "../../archive/lib/archive";
import { ArchiveExtractDialog } from "../../archive/components/ArchiveExtractDialog";
import { useRename } from "../hooks/useRename";
import { useDelete } from "../hooks/useDelete";
import { useDownload } from "../hooks/useDownload";
import { NameDialog } from "./NameDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { MoveDialog } from "./MoveDialog";

type OpenDialog = null | "rename" | "move" | "delete" | "extract";

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
  const router = useRouter();
  const previewEnabled = useFlag("preview");
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
          {entry.kind === "file" && previewEnabled ? (
            <DropdownMenuItem
              onSelect={() => router.push(previewHref(entry.file.Path.Key))}
            >
              <Eye className="size-4" />
              {t("storage.ops.menu.preview")}
            </DropdownMenuItem>
          ) : null}
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
          {entry.kind === "file" && isExtractableArchive(entry.name) ? (
            <DropdownMenuItem onSelect={() => setDialog("extract")}>
              <FolderArchive className="size-4" />
              {t("storage.ops.menu.extract")}
            </DropdownMenuItem>
          ) : null}
          {entry.kind === "dir" && !entry.dir.IsEncrypted ? (
            <DropdownMenuItem
              onSelect={() =>
                useSecureFolderUiStore.getState().open({
                  kind: "encrypt",
                  path: folderPathOf(path, entry.name),
                })
              }
            >
              <Lock className="size-4" />
              {t("storage.ops.secure.encrypt.action")}
            </DropdownMenuItem>
          ) : null}
          {entry.kind === "dir" && entry.dir.IsEncrypted && !entry.dir.IsLocked ? (
            <>
              <DropdownMenuItem
                onSelect={() =>
                  useSecureFolderUiStore.getState().open({
                    kind: "lock",
                    path: folderPathOf(path, entry.name),
                  })
                }
              >
                <Unlock className="size-4" />
                {t("storage.ops.secure.lock.action")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  useSecureFolderUiStore.getState().open({
                    kind: "decrypt",
                    path: folderPathOf(path, entry.name),
                  })
                }
              >
                <KeyRound className="size-4" />
                {t("storage.ops.secure.decrypt.action")}
              </DropdownMenuItem>
            </>
          ) : null}
          {entry.kind === "dir" && !entry.dir.IsHidden ? (
            <DropdownMenuItem
              onSelect={() =>
                useSecureFolderUiStore.getState().open({
                  kind: "hide",
                  path: folderPathOf(path, entry.name),
                })
              }
            >
              <EyeOff className="size-4" />
              {t("storage.ops.secure.hide.action")}
            </DropdownMenuItem>
          ) : null}
          {entry.kind === "dir" && entry.dir.IsHidden ? (
            <>
              <DropdownMenuItem
                onSelect={() =>
                  useSecureFolderUiStore.getState().open({
                    kind: "unhide",
                    path: folderPathOf(path, entry.name),
                  })
                }
              >
                <Eye className="size-4" />
                {t("storage.ops.secure.unhide.action")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  useSecureFolderUiStore.getState().open({
                    kind: "conceal",
                    path: folderPathOf(path, entry.name),
                  })
                }
              >
                <EyeOff className="size-4" />
                {t("storage.ops.secure.conceal.action")}
              </DropdownMenuItem>
            </>
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
          entries={[entry]}
          currentPath={path}
          open
          onOpenChange={(o) => !o && close()}
        />
      ) : null}
      {dialog === "delete" ? (
        <DeleteConfirmDialog
          entries={[entry]}
          open
          onOpenChange={(o) => !o && close()}
          onConfirm={() => del.remove([entry])}
          isPending={del.isPending}
        />
      ) : null}
      {dialog === "extract" && entry.kind === "file" ? (
        <ArchiveExtractDialog
          archiveKey={entry.file.Path.Key}
          archiveName={entry.name}
          path={path}
          open
          onOpenChange={(o) => !o && close()}
        />
      ) : null}
    </>
  );
}
