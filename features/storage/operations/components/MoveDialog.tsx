"use client";

import { useState } from "react";
import { ChevronRight, Folder, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { toSegments } from "@/lib/utils";
import { isApiError } from "@/lib/api";
import {
  resolveToken,
  useSecureFoldersStore,
  useUnlock,
} from "@/features/secure-folders";
import type { CloudDirectoryModel } from "@/service/models";
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
import { applyOwnedUnlocks, type FolderEntry } from "../../browse/lib/entries";
import { folderPathOf } from "../../browse/lib/href";
import { FolderLocked } from "../../browse/components/BrowserStates";
import { useDirectories } from "../../browse/hooks/useDirectories";
import { useMove } from "../hooks/useMove";
import { destinationKey } from "../lib/paths";
import { ConflictPrompt } from "./ConflictPrompt";
import { UnlockDialog } from "./UnlockDialog";

export function MoveDialog({
  entries,
  currentPath,
  open,
  onOpenChange,
  onMoved,
}: {
  entries: ReadonlyArray<FolderEntry>;
  currentPath: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Extra success hook (e.g. the bulk bar clearing the selection). */
  onMoved?: () => void;
}) {
  // Start the picker in the folder the user is currently browsing, not at the
  // root — they most often move items into a nearby sibling/subfolder. The
  // dialog remounts on each open, so seeding the initial state is enough.
  const [pickerPath, setPickerPath] = useState(currentPath);
  // The locked encrypted folder we're about to enter — drives the unlock prompt.
  const [pendingUnlock, setPendingUnlock] = useState<string | null>(null);
  const move = useMove(() => {
    onMoved?.();
    onOpenChange(false);
  });
  const unlock = useUnlock();
  const encTokens = useSecureFoldersStore((s) => s.tokens.encrypted);
  const dirs = useDirectories(pickerPath, open);
  // Treat encrypted subfolders we already hold a session for as unlocked, so the
  // picker doesn't re-prompt for a passphrase entered elsewhere this tab.
  const subfolders = applyOwnedUnlocks(
    dirs.data ?? [],
    (d) => resolveToken(encTokens, folderPathOf(pickerPath, d.Name)) !== null,
  );
  // A 403 on the current listing = a locked encrypted folder reached without a
  // session (e.g. its token expired while open) → offer unlock, not an error.
  const lockedListing =
    isApiError(dirs.error) && dirs.error.code === "FORBIDDEN";
  // Moved dirs can't be picked (blocking the node blocks its subtree too).
  const sourcePrefixes = new Set(
    entries
      .filter((e) => e.kind === "dir")
      .map((e) => e.key.replace(/\/+$/, "")),
  );
  const crumbs = ["", ...accumulate(toSegments(pickerPath))];

  // Enter a subfolder — but a locked encrypted one opens the unlock prompt first
  // (navigating in without a session would 403 the listing).
  const enterFolder = (dir: CloudDirectoryModel) => {
    const childPath = folderPathOf(pickerPath, dir.Name);
    if (dir.IsEncrypted && dir.IsLocked) setPendingUnlock(childPath);
    else setPickerPath(childPath);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPickerPath(currentPath);
      setPendingUnlock(null);
      unlock.reset();
      move.cancelConflict();
    }
    onOpenChange(next);
  };

  // Disallow moving an item into the folder it already lives in.
  const sameFolder = pickerPath === currentPath;

  return (
    <>
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
                <DialogTitle>
                  {entries.length > 1
                    ? `${t("storage.ops.bulk.movePrefix")} ${entries.length} ${t("storage.ops.bulk.itemsSuffix")}`
                    : t("storage.ops.move.title")}
                </DialogTitle>
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
                ) : lockedListing ? (
                  <FolderLocked onUnlock={() => setPendingUnlock(pickerPath)} />
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
                      const isSource = sourcePrefixes.has(
                        dir.Prefix.replace(/\/+$/, ""),
                      );
                      const locked = dir.IsEncrypted && dir.IsLocked;
                      return (
                        <li key={dir.Prefix}>
                          <button
                            type="button"
                            disabled={isSource}
                            onClick={() => enterFolder(dir)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                          >
                            {locked ? (
                              <Lock className="size-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <Folder className="size-4 shrink-0 text-brand" />
                            )}
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
                    move.mutate({
                      entries,
                      destinationKey: destinationKey(pickerPath),
                    })
                  }
                >
                  {t("storage.ops.move.here")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <UnlockDialog
        open={pendingUnlock !== null}
        mode="folder"
        pending={unlock.isPending}
        error={unlock.error}
        onOpenChange={(o) => {
          if (!o) {
            setPendingUnlock(null);
            unlock.reset();
          }
        }}
        onSubmit={async (password) => {
          if (pendingUnlock === null) return;
          const ok = await unlock.submit(pendingUnlock, password);
          if (ok) {
            setPickerPath(pendingUnlock);
            setPendingUnlock(null);
          }
        }}
      />
    </>
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
