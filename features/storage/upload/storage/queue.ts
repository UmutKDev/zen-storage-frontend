import { PERSISTED_ENTRY_TTL_MS } from "@/lib/upload/config";
import { idbDelete, idbGetAll, idbPut } from "./db";

/**
 * Refresh-resumable queue persistence (upload-pipeline §6.2, degraded per
 * D-P3.3 — no `ListParts`, so the locally persisted `partETags` record IS the
 * resume state; parts missing from it are re-PUT, which S3 accepts
 * idempotently on `(UploadId, PartNumber)`).
 *
 * Persistence rules:
 * - the entry is written when the multipart session is created;
 * - every part's ETag is written IMMEDIATELY on success (§6.4 — not batched);
 * - `idempotencyKey` is minted once and reused on Complete retries;
 * - entries older than 7 days are evicted on load (TTL);
 * - `done`/`canceled` entries are deleted, not kept.
 */
export type PersistedUploadStatus =
  | "queued"
  | "uploadInProgress"
  | "completing"
  | "done"
  | "error"
  | "abortPending";

export interface PersistedUploadEntry {
  id: string;
  /** Resume only the signed-in owner's entries (team-ready scope). */
  ownerId: string;
  file: Blob;
  fileName: string;
  contentType: string;
  totalSize: number;
  /** Destination folder path ("" = root) — for invalidation + display. */
  path: string;
  /** RESOLVED object key — from the Create response (KEEP_BOTH may rename). */
  key: string;
  uploadId: string;
  /** Part size the file was sliced with — resume re-slices on the SAME
   *  boundaries even if `lib/upload/config.ts` changes between sessions. */
  partSize: number;
  partETags: Record<number, string>;
  idempotencyKey: string;
  status: PersistedUploadStatus;
  createdAt: number;
}

export async function persistEntry(entry: PersistedUploadEntry): Promise<void> {
  await idbPut(entry);
}

export async function removeEntry(id: string): Promise<void> {
  await idbDelete(id);
}

/** Load this owner's resumable entries; evict expired ones (and other junk
 *  like finished entries that escaped deletion) as a side effect. */
export async function loadEntries(
  ownerId: string,
  now: number,
): Promise<PersistedUploadEntry[]> {
  const all = await idbGetAll<PersistedUploadEntry>();
  const alive: PersistedUploadEntry[] = [];
  for (const entry of all) {
    const expired = now - entry.createdAt > PERSISTED_ENTRY_TTL_MS;
    if (expired || entry.status === "done") {
      void idbDelete(entry.id);
      continue;
    }
    if (entry.ownerId === ownerId) alive.push(entry);
  }
  return alive;
}
