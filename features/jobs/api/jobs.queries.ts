import {
  cloudApiFactory,
  cloudArchiveApiFactory,
  cloudDirectoryApiFactory,
} from "@/service/factories";
import type {
  ArchiveStatusKindEnum,
  CloudArchiveStatusResponseModel,
  CloudDuplicateScanStatusResponseModel,
} from "@/service/models";

// Reconcile polls must not toast: a 404 for a finished/cancelled/evicted job is
// expected and handled by the caller (settle), not surfaced to the user.
const SUPPRESS = { suppressErrorToast: true } as const;

/** Poll an archive job's status (create/extract). Throws ApiError on 404/etc. */
export async function fetchArchiveStatus(
  jobId: string,
  kind: ArchiveStatusKindEnum,
): Promise<CloudArchiveStatusResponseModel> {
  const res = await cloudArchiveApiFactory.archiveStatus({ jobId, kind }, SUPPRESS);
  return res.data as unknown as CloudArchiveStatusResponseModel;
}

/** Poll a duplicate-scan's status (progress + terminal). */
export async function fetchDuplicateScanStatus(
  scanId: string,
): Promise<CloudDuplicateScanStatusResponseModel> {
  const res = await cloudApiFactory.duplicateScanStatus({ scanId }, SUPPRESS);
  return res.data as unknown as CloudDuplicateScanStatusResponseModel;
}

/** Shape of the backend `DirectoryCreateStatusResponseModel` (mirrors the archive
 *  status). Hand-typed until the client is regenerated. */
export interface DirectoryCreateStatus {
  JobId: string;
  Status: string;
  Percentage?: number;
  Path?: string;
  Error?: string;
}

/**
 * Poll an async folder-create job's status. The generated client doesn't yet
 * expose `directoryCreateStatus` (regen pending — `bun run generate:service:test`
 * against the rebuilt backend); call it via a typed shim. Throws a `TypeError`
 * when the method is absent so the reconcile loop leaves the job running rather
 * than mis-settling it.
 */
export async function fetchDirectoryCreateStatus(
  jobId: string,
): Promise<DirectoryCreateStatus> {
  const factory = cloudDirectoryApiFactory as unknown as {
    directoryCreateStatus?: (
      args: { jobId: string },
      opts?: unknown,
    ) => Promise<{ data: unknown }>;
  };
  if (typeof factory.directoryCreateStatus !== "function") {
    throw new TypeError("directoryCreateStatus unavailable (client regen pending)");
  }
  const res = await factory.directoryCreateStatus({ jobId }, SUPPRESS);
  return res.data as DirectoryCreateStatus;
}
