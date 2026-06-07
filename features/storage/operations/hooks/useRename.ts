"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { useOwnerId } from "../../lib/useOwnerId";
import type { FolderEntry } from "../../browse/lib/entries";
import { renameDirectory, renameFile } from "../api";
import { dirRenamePath } from "../lib/paths";
import { invalidateFolder } from "../lib/invalidate";
import { useConflictMutation } from "./useConflictMutation";

export function useRename(entry: FolderEntry, path: string, onDone: () => void) {
  const qc = useQueryClient();
  const ownerId = useOwnerId();
  return useConflictMutation<{ name: string }>({
    run: ({ name }, strategy) =>
      entry.kind === "file"
        ? renameFile({
            Key: entry.file.Path.Key,
            Name: name,
            ConflictStrategy: strategy,
          })
        : renameDirectory({
            Path: dirRenamePath(entry.dir.Prefix),
            Name: name,
            ConflictStrategy: strategy,
          }),
    onSuccess: () => {
      toast.success(t("storage.ops.rename.done"));
      if (ownerId) invalidateFolder(qc, ownerId, path);
      onDone();
    },
  });
}
