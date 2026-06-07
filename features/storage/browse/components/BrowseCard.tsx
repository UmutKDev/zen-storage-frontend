"use client";

import Link from "next/link";
import { File as FileIcon, Folder } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import type { FolderEntry } from "../lib/entries";
import { folderHref } from "../lib/href";
import { EntryActionsMenu } from "../../operations";
import { EntryBadges } from "./EntryBadges";

function CardInner({ entry }: { entry: FolderEntry }) {
  const isDir = entry.kind === "dir";
  const Icon = isDir ? Folder : FileIcon;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface p-4 text-center transition-colors hover:bg-accent">
      <Icon
        className={cn("size-10", isDir ? "text-brand" : "text-muted-foreground")}
      />
      <span className="line-clamp-2 w-full text-xs font-medium text-foreground">
        {entry.name}
      </span>
      <span className="text-xs text-muted-foreground">
        {entry.kind === "file" ? formatBytes(entry.file.Size) : ""}
      </span>
      <EntryBadges entry={entry} />
    </div>
  );
}

/** A grid card: navigable folders are links; files + locked folders are static.
 *  The actions menu sits in the top-right corner. */
export function BrowseCard({ entry, path }: { entry: FolderEntry; path: string }) {
  const locked =
    entry.kind === "dir" && (entry.dir.IsLocked || entry.dir.IsConcealed);

  return (
    <div className={cn("relative h-full", locked && "opacity-70")}>
      {entry.kind === "dir" && !locked ? (
        <Link
          href={folderHref(path, entry.name)}
          className="block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CardInner entry={entry} />
        </Link>
      ) : (
        <div className="h-full">
          <CardInner entry={entry} />
        </div>
      )}
      {locked ? null : (
        <div className="absolute right-1 top-1">
          <EntryActionsMenu entry={entry} path={path} />
        </div>
      )}
    </div>
  );
}
