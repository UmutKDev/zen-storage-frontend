"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { cn, fileMeta, formatBytes, toneClass } from "@/lib/utils";
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
import { EntryStatusChip, entryIsHidden, entryStatus } from "./EntryStatusChip";

function CardInner({
  entry,
  selected,
}: {
  entry: FolderEntry;
  selected: boolean;
}) {
  const isDir = entry.kind === "dir";
  const meta = fileMeta(entry.name, entry.kind);
  const Icon = meta.icon;
  const meta2 = isDir
    ? (entryStatus(entry)?.word ?? t("storage.fileType.folder"))
    : formatBytes(entry.file.Size);
  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface p-4 text-center shadow-[inset_0_1px_0_0_var(--glass-highlight),var(--shadow-e1)] transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-e2",
        selected && "border-ring bg-accent",
      )}
    >
      <span
        className={cn(
          "zs-tile-icon size-14 [&>svg]:size-[26px]",
          isDir && "zs-tile-icon--folder",
          toneClass(meta.tone),
          entryIsHidden(entry) && "zs-tile-icon--ghost",
        )}
      >
        <Icon />
        <EntryStatusChip entry={entry} />
      </span>
      <span className="line-clamp-2 w-full text-sm font-medium tracking-[-0.01em] text-foreground">
        {entry.name}
      </span>
      <span className="text-xs tabular-nums text-muted-foreground">{meta2}</span>
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
        (locked || entryIsHidden(entry)) && "opacity-70",
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
