"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { File as FileIcon, Folder } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Checkbox } from "@/components/ui";
import type { FolderEntry } from "../lib/entries";
import { folderHref } from "../lib/href";
import {
  EntryActionsMenu,
  isSelectableEntry,
  useDndMove,
  type ItemSelection,
} from "../../operations";
import { EntryBadges } from "./EntryBadges";

function CardInner({
  entry,
  selected,
}: {
  entry: FolderEntry;
  selected: boolean;
}) {
  const isDir = entry.kind === "dir";
  const Icon = isDir ? Folder : FileIcon;
  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface p-4 text-center transition-colors hover:bg-accent",
        selected && "border-ring bg-accent",
      )}
    >
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
 *  Checkbox top-left, actions menu top-right. The card is a drag source;
 *  unlocked folders are also drop targets for drag-move. */
export function BrowseCard({
  entry,
  path,
  selection,
}: {
  entry: FolderEntry;
  path: string;
  selection: ItemSelection;
}) {
  const locked =
    entry.kind === "dir" && (entry.dir.IsLocked || entry.dir.IsConcealed);
  const selectable = isSelectableEntry(entry);
  const selected = selection.isSelected(entry.key);
  const { blocked, suppressClickRef } = useDndMove();
  const childPath = path ? `${path}/${entry.name}` : entry.name;

  const drag = useDraggable({
    id: entry.key,
    data: { entry },
    disabled: locked,
  });
  const drop = useDroppable({
    id: entry.key,
    data: { type: "dir", path: childPath },
    disabled: entry.kind !== "dir" || locked || blocked.has(entry.dir.Prefix),
  });
  const setRefs = (el: HTMLElement | null) => {
    drag.setNodeRef(el);
    drop.setNodeRef(el);
  };

  const onMouseDown = (e: MouseEvent) => {
    if (e.shiftKey) e.preventDefault();
    drag.listeners?.onMouseDown?.(e);
  };

  return (
    <div
      ref={setRefs}
      {...drag.listeners}
      onMouseDown={onMouseDown}
      data-selected={selected}
      className={cn(
        "group relative h-full rounded-lg",
        drop.isOver && "ring-2 ring-ring",
        locked && "opacity-70",
      )}
    >
      {entry.kind === "dir" && !locked ? (
        <Link
          href={folderHref(path, entry.name)}
          onClick={(e) => {
            if (suppressClickRef.current || selection.onItemClick(entry, e)) {
              e.preventDefault();
            }
          }}
          className="block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CardInner entry={entry} selected={selected} />
        </Link>
      ) : (
        <div
          onClick={(e) => void selection.onItemClick(entry, e)}
          className="h-full"
        >
          <CardInner entry={entry} selected={selected} />
        </div>
      )}
      {selectable ? (
        <Checkbox
          checked={selected}
          onCheckedChange={() => selection.onItemToggle(entry)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`${t("storage.ops.selection.select")} ${entry.name}`}
          className={cn(
            // after: pseudo extends the 16px box to a ≥40px hit target
            "absolute left-2 top-2 bg-surface opacity-0 transition-opacity after:absolute after:-inset-3 after:content-[''] group-hover:opacity-100 focus-visible:opacity-100",
            (selected || selection.count > 0) && "opacity-100",
          )}
        />
      ) : null}
      {locked ? null : (
        <div className="absolute right-1 top-1">
          <EntryActionsMenu entry={entry} path={path} />
        </div>
      )}
    </div>
  );
}
