import type { CloudDuplicateGroupModel } from "@/service/models";

/**
 * Pure helpers for the duplicate-scan resolution UI. The backend sorts each
 * group's `Files` largest-first, so "keep the first, delete the rest" is the
 * natural default and `Files[0]` is the one to keep.
 */

/** Default deletion set: every file EXCEPT the first (largest) in each group. */
export function defaultSelectedKeys(
  groups: ReadonlyArray<CloudDuplicateGroupModel>,
): Set<string> {
  const keys = new Set<string>();
  for (const g of groups) for (const f of g.Files.slice(1)) keys.add(f.Key);
  return keys;
}

/** Bytes reclaimed by deleting the currently-selected files. */
export function selectedBytes(
  groups: ReadonlyArray<CloudDuplicateGroupModel>,
  selected: ReadonlySet<string>,
): number {
  let total = 0;
  for (const g of groups)
    for (const f of g.Files) if (selected.has(f.Key)) total += f.Size;
  return total;
}

/** Count of currently-selected files. */
export function selectedCount(
  groups: ReadonlyArray<CloudDuplicateGroupModel>,
  selected: ReadonlySet<string>,
): number {
  let n = 0;
  for (const g of groups)
    for (const f of g.Files) if (selected.has(f.Key)) n += 1;
  return n;
}

/**
 * Remove the deleted keys from each group, drop groups left with fewer than two
 * files (no longer a duplicate set), and recompute each group's potential
 * savings (sum of all but the largest remaining file). Used to update the view
 * after a delete without re-scanning (the server result is a cached snapshot).
 */
export function pruneGroups(
  groups: ReadonlyArray<CloudDuplicateGroupModel>,
  deleted: ReadonlySet<string>,
): CloudDuplicateGroupModel[] {
  return groups
    .map((g) => ({
      ...g,
      Files: g.Files.filter((f) => !deleted.has(f.Key)),
    }))
    .filter((g) => g.Files.length >= 2)
    .map((g) => ({
      ...g,
      PotentialSavingsBytes: g.Files.slice(1).reduce((s, f) => s + f.Size, 0),
    }));
}
