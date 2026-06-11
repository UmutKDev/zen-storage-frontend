import type { CloudUserStorageUsageResponseModel } from "@/service/models";

/**
 * Pure upload planning — sliced parts, destination keys, and the quota
 * pre-flight (upload-pipeline §5/§6.6). No I/O; unit-tested directly.
 *
 * `partSize` is always EXPLICIT (the persisted entry's value, not the live
 * config): a resumed upload must re-slice on its ORIGINAL boundaries even if
 * `lib/upload/config.ts` changed between sessions.
 */

/** Number of parts a file of `size` bytes splits into (zero-byte → 1: the
 *  empty object still uploads as a single empty part, D-P3.10). */
export function partCount(size: number, partSize: number): number {
  return size === 0 ? 1 : Math.ceil(size / partSize);
}

/** Byte range of a 1-based part. Zero-byte files get one empty range. */
export function partRange(
  size: number,
  partNumber: number,
  partSize: number,
): { start: number; end: number } {
  const start = (partNumber - 1) * partSize;
  return { start, end: Math.min(start + partSize, size) };
}

/** Destination object key: `<folder>/<name>` (no leading slash at root). */
export function destinationFileKey(path: string, name: string): string {
  return path ? `${path}/${name}` : name;
}

export type PreflightVerdict =
  | { ok: true }
  | { ok: false; reason: "maxSize"; fileName: string }
  | { ok: false; reason: "quota" };

/**
 * Pre-flight (client mirror of the backend's CreateMultipartUpload gates —
 * pre-empt for UX, the server still enforces): any single file over
 * `MaxUploadSizeBytes` or the batch total crossing the storage limit blocks
 * BEFORE anything starts. Quota math counts bytes already committed to the
 * queue (`pendingBytes`) so a second drop can't sneak past the limit.
 */
export function preflight(
  files: ReadonlyArray<{ name: string; size: number }>,
  usage: Pick<
    CloudUserStorageUsageResponseModel,
    "UsedStorageInBytes" | "MaxStorageInBytes" | "MaxUploadSizeBytes"
  >,
  pendingBytes = 0,
): PreflightVerdict {
  for (const file of files) {
    if (usage.MaxUploadSizeBytes > 0 && file.size > usage.MaxUploadSizeBytes) {
      return { ok: false, reason: "maxSize", fileName: file.name };
    }
  }
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (
    usage.MaxStorageInBytes > 0 &&
    usage.UsedStorageInBytes + pendingBytes + total > usage.MaxStorageInBytes
  ) {
    return { ok: false, reason: "quota" };
  }
  return { ok: true };
}
