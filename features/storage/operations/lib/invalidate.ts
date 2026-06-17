import type { QueryClient } from "@tanstack/react-query";
import { invalidateKey } from "@/lib/api";
import { storageKeys } from "../../browse/api";

/**
 * Re-fetch a folder's directories + objects + the usage bar after a mutation.
 * Returns a promise that settles when the refetch lands, so a caller can hold an
 * optimistic placeholder on screen until the real entry arrives (no flash); most
 * callers fire-and-forget and ignore it.
 */
export function invalidateFolder(
  qc: QueryClient,
  ownerId: string,
  path: string,
): Promise<void> {
  return Promise.all([
    invalidateKey(qc, storageKeys.directories(ownerId, path)),
    invalidateKey(qc, storageKeys.objects(ownerId, path)),
    invalidateKey(qc, storageKeys.usage(ownerId)),
  ]).then(() => undefined);
}
