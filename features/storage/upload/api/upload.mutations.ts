import { cloudUploadApiFactory } from "@/service/factories";
import type {
  CloudCompleteMultipartUploadResponseModel,
  CloudCreateMultipartUploadRequestModelConflictStrategyEnum,
  CloudCreateMultipartUploadResponseModel,
  CloudMultipartPartModel,
  CloudUploadPartResponseModel,
} from "@/service/models";

/**
 * Upload transport — 100% factory calls on the shared Instance (D-P3.2:
 * `UploadPart` proxy; the presigned-S3-PUT exception is never exercised).
 * Every call sets `suppressErrorToast`: the queue engine owns retries and the
 * tray owns error presentation, so the envelope's central toast would storm.
 */

export type UploadConflictStrategy =
  CloudCreateMultipartUploadRequestModelConflictStrategyEnum;

/** Structural slice of axios's progress event (the axios import is banned —
 *  only the shared Instance touches it). */
export interface UploadProgressEvent {
  loaded?: number;
  total?: number;
}

/** The Instance's default 30s timeout would spuriously kill a legitimate
 *  slow-link part transfer (8 MiB at ~2 Mbps ≈ 35s). Parts get their own
 *  generous ceiling; hangs still fail and re-enter the retry/backoff path. */
const PART_TIMEOUT_MS = 10 * 60_000;

export async function createUpload(
  input: {
    key: string;
    contentType: string;
    totalSize: number;
    strategy?: UploadConflictStrategy;
  },
  signal?: AbortSignal,
): Promise<CloudCreateMultipartUploadResponseModel> {
  const res = await cloudUploadApiFactory.uploadCreateMultipartUpload(
    {
      cloudCreateMultipartUploadRequestModel: {
        Key: input.key,
        ContentType: input.contentType,
        TotalSize: input.totalSize,
        ConflictStrategy: input.strategy,
      },
    },
    { suppressErrorToast: true, signal },
  );
  return res.data as unknown as CloudCreateMultipartUploadResponseModel;
}

export async function uploadPart(
  input: {
    key: string;
    uploadId: string;
    partNumber: number;
    part: Blob;
    contentMd5: string;
  },
  options?: {
    signal?: AbortSignal;
    onProgress?: (event: UploadProgressEvent) => void;
  },
): Promise<CloudUploadPartResponseModel> {
  const res = await cloudUploadApiFactory.uploadPart(
    {
      contentMd5: input.contentMd5,
      key: input.key,
      uploadId: input.uploadId,
      partNumber: input.partNumber,
      // The generated param is typed `File`; any Blob slice satisfies the wire
      // format (multipart/form-data `File` field).
      file: input.part as File,
    },
    {
      suppressErrorToast: true,
      timeout: PART_TIMEOUT_MS,
      signal: options?.signal,
      onUploadProgress: options?.onProgress,
    },
  );
  return res.data as unknown as CloudUploadPartResponseModel;
}

export async function completeUpload(
  input: {
    key: string;
    uploadId: string;
    parts: CloudMultipartPartModel[];
    /** Persisted per upload and REUSED on retry (data-layer §2.8). */
    idempotencyKey: string;
  },
  signal?: AbortSignal,
): Promise<CloudCompleteMultipartUploadResponseModel> {
  const res = await cloudUploadApiFactory.uploadCompleteMultipartUpload(
    {
      idempotencyKey: input.idempotencyKey,
      cloudCompleteMultipartUploadRequestModel: {
        Key: input.key,
        UploadId: input.uploadId,
        Parts: input.parts,
      },
    },
    { suppressErrorToast: true, signal },
  );
  return res.data as unknown as CloudCompleteMultipartUploadResponseModel;
}

/**
 * Server-side cleanup for a canceled upload. NOT idempotent server-side
 * (re-aborting an unknown UploadId surfaces S3 `NoSuchUpload` as a 500), so
 * callers treat any response as terminal and swallow failures after the
 * retry budget (upload-pipeline §6.3, degraded per D-P3.3 reality).
 */
export async function abortUpload(input: {
  key: string;
  uploadId: string;
}): Promise<void> {
  await cloudUploadApiFactory.uploadAbortMultipartUpload(
    {
      cloudAbortMultipartUploadRequestModel: {
        Key: input.key,
        UploadId: input.uploadId,
      },
    },
    { suppressErrorToast: true },
  );
}
