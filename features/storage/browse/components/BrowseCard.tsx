"use client";

import Link from "next/link";
import { cn, fileMeta, formatBytes, toneClass } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Checkbox } from "@/components/ui";
import type { FolderEntry } from "../lib/entries";
import { EntryActionsMenu, type ItemSelection } from "../../operations";
import { useEntryInteraction } from "../hooks/useEntryInteraction";
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
        selected && "border-ring bg-accent/90",
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
  const {
    navigable,
    href,
    selectable,
    selected,
    selecting,
    locked,
    hidden,
    dropIsOver,
    rootRef,
    dragListeners,
    longPressHandlers,
    onMouseDown,
    linkOnClick,
    buttonRole,
    buttonTabIndex,
    buttonOnClick,
    buttonOnKeyDown,
    onToggle,
  } = useEntryInteraction(entry, path, selection);

  return (
    <div
      ref={rootRef}
      {...dragListeners}
      {...longPressHandlers}
      onMouseDown={onMouseDown}
      data-selected={selected}
      className={cn(
        "group relative h-full rounded-lg",
        dropIsOver && "ring-2 ring-ring",
        (locked || hidden) && "opacity-70",
      )}
    >
      {navigable ? (
        <Link
          href={href}
          onClick={linkOnClick}
          className="block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CardInner entry={entry} selected={selected} />
        </Link>
      ) : (
        <div
          role={buttonRole}
          tabIndex={buttonTabIndex}
          onClick={buttonOnClick}
          onKeyDown={buttonOnKeyDown}
          className="h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CardInner entry={entry} selected={selected} />
        </div>
      )}
      {selectable ? (
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          aria-label={`${t("storage.ops.selection.select")} ${entry.name}`}
          className={cn(
            // after: pseudo extends the 16px box to a ≥40px hit target
            "absolute left-2 top-2 bg-surface opacity-0 transition-opacity after:absolute after:-inset-3 after:content-[''] group-hover:opacity-100 focus-visible:opacity-100",
            (selected || selecting) && "opacity-100",
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
