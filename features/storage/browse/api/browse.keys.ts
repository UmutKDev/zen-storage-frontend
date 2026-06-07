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
} as const;
