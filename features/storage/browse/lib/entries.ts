import type { CloudDirectoryModel, CloudObjectModel } from "@/service/models";
import type { SortDir, SortKey } from "../stores/viewPrefs.store";

/** A unified browse-list entry: either a directory or a file/object. */
export type FolderEntry =
  | { kind: "dir"; key: string; name: string; dir: CloudDirectoryModel }
  | { kind: "file"; key: string; name: string; file: CloudObjectModel };

export function toEntries(
  dirs: ReadonlyArray<CloudDirectoryModel>,
  files: ReadonlyArray<CloudObjectModel>,
): FolderEntry[] {
  return [
    ...dirs.map(
      (dir): FolderEntry => ({ kind: "dir", key: dir.Prefix, name: dir.Name, dir }),
    ),
    ...files.map(
      (file): FolderEntry => ({
        kind: "file",
        key: file.Path.Key,
        name: file.Name,
        file,
      }),
    ),
  ];
}

/**
 * Sort entries **folders-first**, then by the chosen key within each group.
 * Directories carry no size/date, so they always sort by name (honoring the
 * direction). Client-side over the loaded window (the API has no sort param).
 */
export function sortEntries(
  entries: ReadonlyArray<FolderEntry>,
  key: SortKey,
  dir: SortDir,
): FolderEntry[] {
  const factor = dir === "asc" ? 1 : -1;
  const byName = (a: FolderEntry, b: FolderEntry) =>
    a.name.localeCompare(b.name) * factor;

  const compare = (a: FolderEntry, b: FolderEntry): number => {
    if (a.kind !== "file" || b.kind !== "file") return byName(a, b);
    switch (key) {
      case "size":
        return (a.file.Size - b.file.Size) * factor || byName(a, b);
      case "modified":
        return (
          (Date.parse(a.file.LastModified) - Date.parse(b.file.LastModified)) *
            factor || byName(a, b)
        );
      case "type":
        return a.file.Extension.localeCompare(b.file.Extension) * factor || a.name.localeCompare(b.name);
      case "name":
      default:
        return byName(a, b);
    }
  };

  const dirs = entries.filter((e) => e.kind === "dir").sort(byName);
  const files = entries.filter((e) => e.kind === "file").sort(compare);
  return [...dirs, ...files];
}
