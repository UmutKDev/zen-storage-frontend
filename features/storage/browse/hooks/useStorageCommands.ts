"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  FolderInput,
  FolderPlus,
  Globe,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { useCommand } from "@/lib/command-palette";
import { useStorageUiStore, type ItemSelection } from "../../operations";
import { useUploadsStore } from "../../upload/stores/uploads.store";
import type { SearchScope } from "./useSearch";

/**
 * Contributes the storage surface's commands to the global ⌘K palette while the
 * browser is mounted (so they vanish off-route). Selection commands appear only
 * while a selection exists (presence model). All run handlers route through the
 * `storageUi` store / uploads store — the dialogs they open live in the storage
 * surface and operate on the real `selectedEntries`, satisfying the locked
 * ⌘K↔selection bulk contract without the palette ever touching selection.
 */
export function useStorageCommands(opts: {
  path: string;
  selection: ItemSelection;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hasSelection = opts.selection.count > 0;

  const openCreate = useStorageUiStore((s) => s.openCreateDialog);
  const openBulk = useStorageUiStore((s) => s.openBulkDialog);
  const openUpload = useUploadsStore((s) => s.setDialogOpen);

  const runSearch = (scope: SearchScope, query: string) => {
    const q = query.trim();
    if (!q) return;
    router.replace(
      `${pathname}?${new URLSearchParams({ q, scope }).toString()}`,
      { scroll: false },
    );
  };

  useCommand({
    id: "storage:upload",
    group: "actions",
    label: t("command.actions.uploadHere"),
    icon: Upload,
    shortcutHint: "⌘U",
    keywords: ["add"],
    run: () => openUpload(true),
  });
  useCommand({
    id: "storage:new-folder",
    group: "actions",
    label: t("command.actions.newFolder"),
    icon: FolderPlus,
    keywords: ["create", "directory"],
    run: () => openCreate("folder"),
  });
  useCommand({
    id: "storage:new-file",
    group: "actions",
    label: t("command.actions.newFile"),
    icon: FileText,
    keywords: ["create", "document"],
    run: () => openCreate("file"),
  });

  useCommand(
    hasSelection
      ? {
          id: "storage:delete-selected",
          group: "selection",
          label: t("command.selection.deleteSelected"),
          icon: Trash2,
          keywords: ["bulk", "remove"],
          run: () => openBulk("delete"),
        }
      : null,
  );
  useCommand(
    hasSelection
      ? {
          id: "storage:move-selected",
          group: "selection",
          label: t("command.selection.moveSelected"),
          icon: FolderInput,
          keywords: ["bulk"],
          run: () => openBulk("move"),
        }
      : null,
  );

  useCommand({
    id: "storage:search-folder",
    group: "search",
    label: t("command.actions.searchInFolder"),
    icon: Search,
    runWithQuery: (q) => runSearch("current", q),
  });
  useCommand({
    id: "storage:search-everywhere",
    group: "search",
    label: t("command.actions.searchEverywhere"),
    icon: Globe,
    runWithQuery: (q) => runSearch("global", q),
  });
}
