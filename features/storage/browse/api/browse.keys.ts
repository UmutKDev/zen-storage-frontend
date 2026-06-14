import { scopedKey } from "@/lib/api";

/**
 * Storage query keys, **user-scoped** by `ownerId` (so a workspace switch swaps
 * the whole cache namespace — team-readiness). `path` is the folder path.
 */
export const storageKeys = {
  all: (ownerId: string) => scopedKey(ownerId, "storage"),
  directories: (ownerId: string, path: string) =>
    scopedKey(ownerId, "storage", "directories", path),
  objects: (ownerId: string, path: string) =>
    scopedKey(ownerId, "storage", "objects", path),
  usage: (ownerId: string) => scopedKey(ownerId, "storage", "usage"),
  /** Search results. Scope is part of the key (and global drops the path to "*")
   *  so current↔global never collide; query + extension complete the cache id. */
  search: (
    ownerId: string,
    scope: "current" | "global",
    path: string,
    query: string,
    extension: string,
  ) =>
    scopedKey(
      ownerId,
      "storage",
      "search",
      scope,
      scope === "global" ? "*" : path,
      query,
      extension,
    ),
} as const;
