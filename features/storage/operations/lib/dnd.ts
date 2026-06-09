import type { FolderEntry } from "../../browse/lib/entries";
import { folderPrefix } from "./paths";

/**
 * Pure drag-move planning (dnd-kit isn't drivable in jsdom, so every decision
 * lives here and is unit-tested; the DndMoveLayer just wires events to these).
 */

/** The set a drag moves: the whole selection when the dragged entry is part of
 *  it, otherwise just that entry. */
export function resolveDragSet(
  activeKey: string,
  selectedEntries: ReadonlyArray<FolderEntry>,
  allEntries: ReadonlyArray<FolderEntry>,
): FolderEntry[] {
  if (selectedEntries.some((e) => e.key === activeKey)) {
    return [...selectedEntries];
  }
  const active = allEntries.find((e) => e.key === activeKey);
  return active ? [active] : [];
}

/** Dir prefixes that are invalid drop targets for this drag set: each dragged
 *  directory (and, by prefix match, its whole subtree). */
export function blockedPrefixes(set: ReadonlyArray<FolderEntry>): Set<string> {
  return new Set(
    set.filter((e) => e.kind === "dir").map((e) => e.dir.Prefix),
  );
}

/** Whether the set may drop on `targetPath`: not a same-folder no-op, and not
 *  into a dragged dir or its subtree (the backend also rejects with 400). */
export function canDropOn(
  set: ReadonlyArray<FolderEntry>,
  targetPath: string,
  currentPath: string,
): boolean {
  if (set.length === 0) return false;
  if (targetPath === currentPath) return false;
  const target = folderPrefix(targetPath);
  for (const blocked of blockedPrefixes(set)) {
    if (target === blocked || target.startsWith(blocked)) return false;
  }
  return true;
}
