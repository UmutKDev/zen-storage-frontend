"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { cn, fileMeta, formatBytes, formatDate, toneClass } from "@/lib/utils";
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

function RowContent({ entry }: { entry: FolderEntry }) {
  const isDir = entry.kind === "dir";
  const meta = fileMeta(entry.name, entry.kind);
  const Icon = meta.icon;
  const kind = isDir ? (entryStatus(entry)?.word ?? meta.label) : meta.label;
  return (
    <>
      <span
        className={cn(
          "zs-tile-icon size-9 shrink-0",
          isDir && "zs-tile-icon--folder",
          toneClass(meta.tone),
          entryIsHidden(entry) && "zs-tile-icon--ghost",
        )}
      >
        <Icon className="size-[18px]" />
        <EntryStatusChip entry={entry} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-sm font-medium tracking-[-0.01em] text-foreground">
          {entry.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">{kind}</span>
      </span>
      <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {entry.kind === "file" ? formatBytes(entry.file.Size) : ""}
      </span>
      <span className="hidden w-40 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block">
        {entry.kind === "file" ? formatDate(entry.file.LastModified) : ""}
      </span>
    </>
  );
}

/** A list row: navigable folders are links; files + locked folders are static.
 *  Leading checkbox (multi-select), trailing actions menu. The row is a drag
 *  source; unlocked folders are also drop targets for drag-move. */
export function BrowseRow({
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

  // Merge our shift-click guard (kills native text selection) with the drag
  // sensor's mousedown activator.
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
        "zs-file-row group flex items-center gap-1 border-b border-border/50 pl-2 pr-1 hover:bg-accent",
        selected && "bg-accent",
        drop.isOver && "ring-2 ring-ring",
        (locked || entryIsHidden(entry)) && "opacity-70",
      )}
    >
      {selectable ? (
        <Checkbox
          checked={selected}
          onCheckedChange={() => selection.onItemToggle(entry)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`${t("storage.ops.selection.select")} ${entry.name}`}
          className={cn(
            // after: pseudo extends the 16px box to a ≥40px hit target
            "relative opacity-0 transition-opacity after:absolute after:-inset-3 after:content-[''] group-hover:opacity-100 focus-visible:opacity-100",
            (selected || selection.count > 0) && "opacity-100",
          )}
        />
      ) : (
        <span aria-hidden className="size-4 shrink-0" />
      )}
      {entry.kind === "dir" && !locked ? (
        <Link
          href={folderHref(path, entry.name)}
          onClick={(e) => {
            if (suppressClickRef.current || selection.onItemClick(entry, e)) {
              e.preventDefault();
            }
          }}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RowContent entry={entry} />
        </Link>
      ) : (
        <div
          onClick={(e) => void selection.onItemClick(entry, e)}
          className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5"
        >
          <RowContent entry={entry} />
        </div>
      )}
      {locked ? null : <EntryActionsMenu entry={entry} path={path} />}
    </div>
  );
}
