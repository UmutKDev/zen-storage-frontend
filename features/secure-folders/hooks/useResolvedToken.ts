"use client";

import {
  resolveToken,
  useSecureFoldersStore,
} from "../stores/secureFolders.store";

/**
 * React read of the nearest ancestor token for `path`, per namespace. Storage
 * folds the `encrypted`/`hidden` value into its directory/object query keys — so
 * unlocking (token set) or locking (token cleared) changes the key and TanStack
 * refetches with/without the secure-folder header automatically. **Expiry is
 * intentionally ignored here** (no clock read in render — that's impure): TTL is
 * enforced by the interceptor getter, which won't send an expired token, so the
 * next fetch 403s into the locked state.
 */
export function useResolvedToken(path: string): {
  encrypted: string | null;
  hidden: string | null;
} {
  const tokens = useSecureFoldersStore((s) => s.tokens);
  return {
    encrypted: resolveToken(tokens.encrypted, path),
    hidden: resolveToken(tokens.hidden, path),
  };
}
