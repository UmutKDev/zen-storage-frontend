"use client";

import Link from "next/link";
import { File as FileIcon, Folder } from "lucide-react";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import type { FolderEntry } from "../lib/entries";
import { folderHref } from "../lib/href";
import { EntryActionsMenu } from "../../operations";
import { EntryBadges } from "./EntryBadges";

function RowContent({ entry }: { entry: FolderEntry }) {
  const isDir = entry.kind === "dir";
  const Icon = isDir ? Folder : FileIcon;
  return (
    <>
      <Icon
        className={cn(
          "size-5 shrink-0",
          isDir ? "text-brand" : "text-muted-foreground",
        )}
      />
      <span className="flex-1 truncate text-sm text-foreground">
        {entry.name}
      </span>
      <EntryBadges entry={entry} />
      <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {entry.kind === "file" ? formatBytes(entry.file.Size) : ""}
      </span>
      <span className="hidden w-40 shrink-0 text-right text-xs text-muted-foreground sm:block">
        {entry.kind === "file" ? formatDate(entry.file.LastModified) : ""}
      </span>
    </>
  );
}

/** A list row: navigable folders are links; files + locked folders are static.
 *  A trailing actions menu (sibling of the link) handles rename/move/delete/download. */
export function BrowseRow({ entry, path }: { entry: FolderEntry; path: string }) {
  const locked =
    entry.kind === "dir" && (entry.dir.IsLocked || entry.dir.IsConcealed);

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md pr-1 hover:bg-accent",
        locked && "opacity-70",
      )}
    >
      {entry.kind === "dir" && !locked ? (
        <Link
          href={folderHref(path, entry.name)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RowContent entry={entry} />
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5">
          <RowContent entry={entry} />
        </div>
      )}
      {locked ? null : <EntryActionsMenu entry={entry} path={path} />}
    </div>
  );
}
