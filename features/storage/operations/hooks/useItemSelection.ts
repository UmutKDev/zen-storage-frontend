"use client";

import { useEffect, useMemo } from "react";
import type { FolderEntry } from "../../browse/lib/entries";
import { useSelectionStore } from "../stores/selection.store";

/** Locked/concealed dirs can't be selected (their ops need Phase 5 tokens). */
export function isSelectableEntry(entry: FolderEntry): boolean {
  return !(
    entry.kind === "dir" &&
    (entry.dir.IsLocked || entry.dir.IsConcealed)
  );
}

export interface ItemSelection {
  selectedKeys: ReadonlySet<string>;
  /** Selection resolved against the CURRENT folder's entries (stale keys drop out). */
  selectedEntries: FolderEntry[];
  count: number;
  allSelected: boolean;
  isSelected: (key: string) => boolean;
  /**
   * Row/card click dispatch. Returns `true` when the click was consumed as a
   * selection gesture (caller must `preventDefault()` — folder links would
   * otherwise navigate); plain clicks on folders return `false` so navigation
   * proceeds.
   */
  onItemClick: (
    entry: FolderEntry,
    mods: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
  ) => boolean;
  /** Checkbox toggle. */
  onItemToggle: (entry: FolderEntry) => void;
  selectAll: () => void;
  clear: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest('input, textarea, [contenteditable="true"]'),
  );
}

function isInOverlay(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest('[role="dialog"], [role="alertdialog"], [role="menu"]'),
  );
}

/**
 * Multi-select over the current folder's sorted entries: plain click on a file
 * replace-selects, Ctrl/Cmd toggles, Shift extends a range from the anchor
 * (over the flat folders-first order — identical in list and grid), checkbox
 * toggles. Esc clears; mod+A selects all. Selection clears on folder change
 * and survives the list↔grid toggle.
 */
export function useItemSelection(
  entries: ReadonlyArray<FolderEntry>,
  path: string,
): ItemSelection {
  const selectedKeys = useSelectionStore((s) => s.selectedKeys);
  const anchorKey = useSelectionStore((s) => s.anchorKey);
  const { replaceWith, toggle, setRange, setAll, clear } =
    useSelectionStore.getState();

  // New folder, fresh selection (also on unmount).
  useEffect(() => {
    return () => useSelectionStore.getState().clear();
  }, [path]);

  const selectable = useMemo(
    () => entries.filter(isSelectableEntry),
    [entries],
  );
  const selectedEntries = useMemo(
    () => selectable.filter((e) => selectedKeys.has(e.key)),
    [selectable, selectedKeys],
  );
  const count = selectedEntries.length;
  const allSelected = count > 0 && count === selectable.length;

  const selectAll = () => setAll(selectable.map((e) => e.key));

  // Esc clears; mod+A selects all — skipped while a dialog/menu owns the
  // event or the user is typing.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (
        e.key === "Escape" &&
        !isInOverlay(e.target) &&
        !isEditableTarget(e.target)
      ) {
        if (useSelectionStore.getState().selectedKeys.size > 0) {
          useSelectionStore.getState().clear();
        }
        return;
      }
      if (
        e.key.toLowerCase() === "a" &&
        (e.metaKey || e.ctrlKey) &&
        !e.shiftKey &&
        !e.altKey &&
        !isEditableTarget(e.target) &&
        !isInOverlay(e.target)
      ) {
        e.preventDefault();
        useSelectionStore
          .getState()
          .setAll(
            entries.filter(isSelectableEntry).map((entry) => entry.key),
          );
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [entries]);

  const onItemClick: ItemSelection["onItemClick"] = (entry, mods) => {
    if (!isSelectableEntry(entry)) return false;
    if (mods.shiftKey) {
      const from = entries.findIndex((e) => e.key === anchorKey);
      const to = entries.findIndex((e) => e.key === entry.key);
      if (to === -1) return false;
      const start = from === -1 ? to : Math.min(from, to);
      const end = from === -1 ? to : Math.max(from, to);
      setRange(
        entries
          .slice(start, end + 1)
          .filter(isSelectableEntry)
          .map((e) => e.key),
      );
      return true;
    }
    if (mods.ctrlKey || mods.metaKey) {
      toggle(entry.key);
      return true;
    }
    if (entry.kind === "file") {
      replaceWith(entry.key);
      return true;
    }
    return false; // plain click on a folder → let the link navigate
  };

  return {
    selectedKeys,
    selectedEntries,
    count,
    allSelected,
    isSelected: (key) => selectedKeys.has(key),
    onItemClick,
    onItemToggle: (entry) => toggle(entry.key),
    selectAll,
    clear,
  };
}
