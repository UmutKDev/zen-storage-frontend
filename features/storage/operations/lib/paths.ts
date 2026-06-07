import type { FolderEntry } from "../../browse/lib/entries";

/** Current-folder prefix with a trailing slash (or "" at root). */
export function folderPrefix(path: string): string {
  return path ? `${path}/` : "";
}

/** Full path for a new child folder (trailing slash) — per the create contract. */
export function childFolderPath(path: string, name: string): string {
  return `${folderPrefix(path)}${name}/`;
}

/** Move/delete item key for an entry: file = object key; dir = prefix (trailing slash). */
export function entryItem(entry: FolderEntry): {
  Key: string;
  IsDirectory: boolean;
} {
  return entry.kind === "dir"
    ? { Key: entry.dir.Prefix, IsDirectory: true }
    : { Key: entry.file.Path.Key, IsDirectory: false };
}

/** Directory-rename Path: the prefix without its trailing slash. */
export function dirRenamePath(prefix: string): string {
  return prefix.replace(/\/+$/, "");
}

/** Move DestinationKey: root = "/", else "<path>/". */
export function destinationKey(path: string): string {
  return path ? `${path}/` : "/";
}
