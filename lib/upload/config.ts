/**
 * Upload pipeline caps — DECISIONS, not guidance (upload-pipeline §6.1).
 * This file is the only place these values may be changed; features must not
 * hard-code their own limits.
 */

/**
 * Part size for multipart uploads. Bounds: ≥ 5 MiB (S3 minimum for non-last
 * parts, enforced at Complete) and ≤ 10 MB (the `UploadPart` proxy's
 * `CLOUD_UPLOAD_PART_MAX_BYTES` default). 8 MiB → max file ≈ 80 GiB at the
 * 10 000-part S3 ceiling.
 */
export const PART_SIZE_BYTES = 8 * 1024 * 1024;

/** Parts of one file uploading in parallel. */
export const MAX_PARALLEL_PARTS_PER_FILE = 4;

/** Files uploading concurrently across the queue. */
export const MAX_CONCURRENT_FILES = 3;

/**
 * Total bytes in flight across the queue (sum of the sizes of parts whose
 * upload request is currently open). This cap WINS when the per-file ×
 * per-queue chunk counts would exceed it.
 */
export const MAX_INFLIGHT_BYTES = 60 * 1024 * 1024;

/** Per-part retry schedule for transient failures (5xx / network / timeout). */
export const PART_RETRY_DELAYS_MS = [1_000, 2_000, 4_000] as const;

/** Attempts to deliver a server-side Abort for a canceled upload. */
export const ABORT_MAX_ATTEMPTS = 3;

/** Persisted queue entries older than this are evicted on load. */
export const PERSISTED_ENTRY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
