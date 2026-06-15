import { cloudApiFactory, cloudArchiveApiFactory } from "@/service/factories";
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
