import { scopedKey } from "@/lib/api";

/**
 * Storage query keys, **user-scoped** by `ownerId` (so a workspace switch swaps
 * the whole cache namespace — team-readiness). `path` is the folder path.
 */
export const storageKeys = {
  all: (ownerId: string) => scopedKey(ownerId, "storage"),
  // `secureToken` is the resolved secure-folder token(s) for the path — folded in
  // (only when present) so unlock/reveal (token set) and lock/conceal (cleared)
  // change the key and TanStack refetches. The token-less form a caller uses for
  // invalidation still prefix-matches the token-bearing query key.
  directories: (ownerId: string, path: string, secureToken?: string) =>
    scopedKey(
      ownerId,
      "storage",
      "directories",
      path,
      ...(secureToken ? [secureToken] : []),
    ),
  objects: (ownerId: string, path: string, secureToken?: string) =>
    scopedKey(
      ownerId,
      "storage",
      "objects",
      path,
      ...(secureToken ? [secureToken] : []),
    ),
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

/**
 * True when `baseKey` (a token-less `directories`/`objects` key) is a prefix of
 * `prevKey` — i.e. the previously-observed query was the **same owner + folder**
 * and only the trailing secure-folder token differs.
 *
 * The listing hooks use this for `placeholderData`: keep the current rows on
 * screen across a reveal/unlock/lock/conceal (which folds the token into the key)
 * so hidden/encrypted children appear or vanish with **no skeleton flash** — but
 * fall back to the skeleton on a real navigation (owner or path changed → not a
 * prefix). The token-less base is always a prefix of the token-bearing key by
 * construction (the token is appended last).
 */
export function isSameFolderKey(
  baseKey: readonly unknown[],
  prevKey: readonly unknown[] | undefined,
): boolean {
  return prevKey !== undefined && baseKey.every((seg, i) => seg === prevKey[i]);
}
