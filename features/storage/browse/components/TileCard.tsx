"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Checkbox } from "@/components/ui";
import type { FolderEntry } from "../lib/entries";
import { EntryActionsMenu, type ItemSelection } from "../../operations";
import { useEntryInteraction } from "../hooks/useEntryInteraction";
import { FileTile } from "./FileTile";

/**
 * A smart-grid tile: the justified `.zs-tile` surface ({@link FileTile} visual)
 * plus the full browse interactivity via {@link useEntryInteraction} — drag
 * source + drop target, folder-link / preview / unlock navigation, modifier-click
 * selection, touch long-press, a reveal-on-hover checkbox + actions menu. Sits as
 * a direct flex child of `.zs-smartgrid` so its `--zs-ratio` drives the row.
 */
export function TileCard({
  entry,
  path,
  selection,
  thumbnailUrl,
  ratio,
}: {
  entry: FolderEntry;
  path: string;
  selection: ItemSelection;
  thumbnailUrl?: string;
  ratio: number;
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
  const isMedia = Boolean(thumbnailUrl);
  const content = <FileTile entry={entry} thumbnailUrl={thumbnailUrl} />;

  return (
    <div
      ref={rootRef}
      {...dragListeners}
      {...longPressHandlers}
      onMouseDown={onMouseDown}
      data-selected={selected}
      role="listitem"
      style={{ "--zs-ratio": isMedia ? ratio : 1 } as CSSProperties}
      className={cn(
        "zs-tile group",
        isMedia ? "zs-tile--thumb" : "zs-tile--plain",
        selected && "zs-tile--selected",
        locked && "zs-tile--locked",
        hidden && "zs-tile--hidden",
        dropIsOver && "ring-2 ring-ring",
      )}
    >
      {navigable ? (
        <Link
          href={href}
          onClick={linkOnClick}
          className="zs-tile__inner no-underline outline-none"
        >
          {content}
        </Link>
      ) : (
        <div
          role={buttonRole}
          tabIndex={buttonTabIndex}
          onClick={buttonOnClick}
          onKeyDown={buttonOnKeyDown}
          className="zs-tile__inner outline-none"
        >
          {content}
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
            "absolute left-2 top-2 z-[2] bg-surface opacity-0 transition-opacity after:absolute after:-inset-3 after:content-[''] group-hover:opacity-100 focus-visible:opacity-100",
            (selected || selecting) && "opacity-100",
          )}
        />
      ) : null}
      {locked ? null : (
        <div
          className={cn(
            "absolute right-1 top-1 z-[2] rounded-md opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100",
            // solid chip so the kebab reads over a photo (content tiles stay solid
            // — no hand-rolled glass over data)
            isMedia && "bg-surface shadow-e1",
          )}
        >
          <EntryActionsMenu entry={entry} path={path} />
        </div>
      )}
    </div>
  );
}
