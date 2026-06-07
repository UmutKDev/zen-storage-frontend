"use client";

import { useState } from "react";
import { ChevronRight, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { toSegments } from "@/lib/utils";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollArea,
  Skeleton,
} from "@/components/ui";
import type { FolderEntry } from "../../browse/lib/entries";
import { useDirectories } from "../../browse/hooks/useDirectories";
import { useMove } from "../hooks/useMove";
import { destinationKey } from "../lib/paths";
import { ConflictPrompt } from "./ConflictPrompt";

export function MoveDialog({
  entry,
  currentPath,
  open,
  onOpenChange,
}: {
  entry: FolderEntry;
  currentPath: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pickerPath, setPickerPath] = useState("");
  const move = useMove(entry, () => onOpenChange(false));
  const dirs = useDirectories(pickerPath, open);
  const subfolders = dirs.data ?? [];
  const sourcePrefix =
    entry.kind === "dir" ? entry.dir.Prefix.replace(/\/+$/, "") : null;
  const crumbs = ["", ...accumulate(toSegments(pickerPath))];

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPickerPath("");
      move.cancelConflict();
    }
    onOpenChange(next);
  };

  // Disallow moving an item into the folder it already lives in.
  const sameFolder = pickerPath === currentPath;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {move.conflict ? (
          <ConflictPrompt
            details={move.conflict}
            onResolve={move.resolve}
            onCancel={move.cancelConflict}
            pending={move.isPending}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("storage.ops.move.title")}</DialogTitle>
              <DialogDescription>
                {t("storage.ops.move.pickDestination")}
              </DialogDescription>
            </DialogHeader>

            <nav className="flex flex-wrap items-center gap-1 text-sm">
              {crumbs.map((crumbPath, index) => {
                const isLast = index === crumbs.length - 1;
                const label = crumbPath
                  ? toSegments(crumbPath).slice(-1)[0]
                  : t("storage.ops.move.root");
                return (
                  <span key={crumbPath} className="flex items-center gap-1">
                    {index > 0 ? (
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setPickerPath(crumbPath)}
                      className={cn(
                        "rounded-sm px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isLast
                          ? "font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  </span>
                );
              })}
            </nav>

            <ScrollArea className="h-56 rounded-md border border-border">
              {dirs.isPending ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
              ) : dirs.isError ? (
                <div
                  className="flex flex-col items-center gap-2 p-4 text-center"
                  role="alert"
                >
                  <p className="text-sm text-muted-foreground">
                    {t("storage.error.title")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void dirs.refetch()}
                  >
                    {t("common.retry")}
                  </Button>
                </div>
              ) : subfolders.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  {t("storage.ops.move.noSubfolders")}
                </p>
              ) : (
                <ul className="p-1">
                  {subfolders.map((dir) => {
                    const childPath = pickerPath
                      ? `${pickerPath}/${dir.Name}`
                      : dir.Name;
                    const isSource =
                      sourcePrefix !== null &&
                      dir.Prefix.replace(/\/+$/, "") === sourcePrefix;
                    return (
                      <li key={dir.Prefix}>
                        <button
                          type="button"
                          disabled={isSource}
                          onClick={() => setPickerPath(childPath)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                        >
                          <Folder className="size-4 shrink-0 text-brand" />
                          <span className="flex-1 truncate">{dir.Name}</span>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                disabled={move.isPending || sameFolder}
                onClick={() =>
                  move.mutate({ destinationKey: destinationKey(pickerPath) })
                }
              >
                {t("storage.ops.move.here")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Cumulative paths for breadcrumb segments: ["a","b"] → ["a","a/b"]. */
function accumulate(segments: string[]): string[] {
  const out: string[] = [];
  segments.forEach((seg, i) => {
    out.push(segments.slice(0, i + 1).join("/"));
  });
  return out;
}
