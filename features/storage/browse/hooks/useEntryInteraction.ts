"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useFlag } from "@/lib/flags";
import { previewHref } from "@/lib/preview";
import { useSecureFolderUiStore } from "@/features/secure-folders";
import type { FolderEntry } from "../lib/entries";
import { folderHref, folderPathOf } from "../lib/href";
import {
  isSelectableEntry,
  useDndMove,
  useStorageUiStore,
  type ItemSelection,
} from "../../operations";
import { useCoarsePointer } from "./useCoarsePointer";
import { useLongPress } from "./useLongPress";
import { entryIsHidden } from "../components/EntryStatusChip";

/**
 * The shared interactivity for a browse entry — drag source + drop target,
 * navigation (folder Link / file preview / locked-folder unlock), modifier-click
 * selection, and touch long-press → action sheet. Extracted so the list row
 * (`BrowseRow`), the grid card (`BrowseCard`), and the smart-grid tile
 * (`TileCard`) share ONE implementation and only differ in layout.
 *
 * Returns **flat fields** (no nested handler objects): destructure them and
 * attach handlers DIRECTLY to event props — `onClick={linkOnClick}` etc. The
 * click handlers read a ref (`suppressClickRef`), which the React Compiler only
 * permits inside recognized event handlers; bundling them in an object the
 * caller member-accesses during render would taint the whole return.
 */
export function useEntryInteraction(
  entry: FolderEntry,
  path: string,
  selection: ItemSelection,
) {
  const locked =
    entry.kind === "dir" && (entry.dir.IsLocked || entry.dir.IsConcealed);
  const selectable = isSelectableEntry(entry);
  const selected = selection.isSelected(entry.key);
  const hidden = entryIsHidden(entry);
  const { blocked, suppressClickRef } = useDndMove();
  const childPath = path ? `${path}/${entry.name}` : entry.name;
  const router = useRouter();
  const previewEnabled = useFlag("preview");
  const opensPreview = entry.kind === "file" && previewEnabled;
  // A locked encrypted folder opens the unlock dialog on click (then enters it).
  const lockedEncrypted =
    entry.kind === "dir" && entry.dir.IsEncrypted && entry.dir.IsLocked;
  const interactive = opensPreview || lockedEncrypted;
  const navigable = entry.kind === "dir" && !locked;
  const openUnlock = () =>
    useSecureFolderUiStore.getState().open({
      kind: "unlock",
      path: folderPathOf(path, entry.name),
      mode: "folder",
      navigateTo: folderHref(path, entry.name),
    });

  // Touch long-press → action sheet (the accessible alternative to desktop DnD).
  const coarse = useCoarsePointer();
  const longPress = useLongPress({
    enabled: coarse && selectable,
    onLongPress: () => useStorageUiStore.getState().openSheet(entry),
  });

  const drag = useDraggable({ id: entry.key, data: { entry }, disabled: locked });
  const drop = useDroppable({
    id: entry.key,
    data: { type: "dir", path: childPath },
    disabled:
      entry.kind !== "dir" || locked || blocked.has(entry.dir.Prefix),
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

  // The folder Link's click: long-press / post-drag suppression, else a modifier
  // click is a selection gesture (prevent the navigation).
  const linkOnClick = (e: MouseEvent) => {
    if (longPress.consumeSuppressedClick()) {
      e.preventDefault();
      return;
    }
    if (suppressClickRef.current || selection.onItemClick(entry, e)) {
      e.preventDefault();
    }
  };

  // Files + locked folders: a plain click opens preview / the unlock dialog; a
  // modifier click selects.
  const onActivate = () => {
    if (opensPreview) router.push(previewHref(entry.key));
    else if (lockedEncrypted) openUnlock();
  };
  const buttonOnClick = (e: MouseEvent) => {
    if (longPress.consumeSuppressedClick() || suppressClickRef.current) return;
    if (!(e.shiftKey || e.metaKey || e.ctrlKey) && interactive) {
      onActivate();
      return;
    }
    void selection.onItemClick(entry, e);
  };
  const buttonOnKeyDown = interactive
    ? (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }
    : undefined;

  return {
    // Render-safe flags.
    navigable,
    href: folderHref(path, entry.name),
    selectable,
    selected,
    /** `count > 0` — keeps checkboxes visible while a selection exists. */
    selecting: selection.count > 0,
    locked,
    hidden,
    dropIsOver: drop.isOver,
    // Outer element (drag source + long-press); spread the handler bundles
    // directly in JSX.
    rootRef: setRefs,
    dragListeners: drag.listeners,
    longPressHandlers: longPress.handlers,
    onMouseDown,
    // Navigable folder `<Link onClick={linkOnClick}>`.
    linkOnClick,
    // File / locked-folder static `<div>` — attach each handler directly.
    buttonRole: interactive ? ("button" as const) : undefined,
    buttonTabIndex: interactive ? 0 : undefined,
    buttonOnClick,
    buttonOnKeyDown,
    onToggle: () => selection.onItemToggle(entry),
  };
}

export type EntryInteraction = ReturnType<typeof useEntryInteraction>;
