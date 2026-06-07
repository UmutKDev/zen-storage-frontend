import type { QueryClient } from "@tanstack/react-query";
import { invalidateKey } from "@/lib/api";
import { storageKeys } from "../../browse/api";

/** Re-fetch a folder's directories + objects + the usage bar after a mutation. */
export function invalidateFolder(
  qc: QueryClient,
  ownerId: string,
  path: string,
): void {
  void invalidateKey(qc, storageKeys.directories(ownerId, path));
  void invalidateKey(qc, storageKeys.objects(ownerId, path));
  void invalidateKey(qc, storageKeys.usage(ownerId));
}
