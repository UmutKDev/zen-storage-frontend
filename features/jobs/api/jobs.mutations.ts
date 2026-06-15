import { cloudApiFactory, cloudArchiveApiFactory } from "@/service/factories";
import type {
  CloudArchiveCreateCancelResponseModel,
  CloudArchiveExtractCancelResponseModel,
  CloudDuplicateScanCancelResponseModel,
} from "@/service/models";
import type { Job } from "../stores/jobs.store";

// Cancelling a job that already finished/was evicted 404s — that's expected, not
// an error to toast; the caller treats it as "not cancelled" and the terminal
// event / reconcile settles the job.
const SUPPRESS = { suppressErrorToast: true } as const;

/**
 * Cancel a running job via its kind's cancel endpoint (`Cloud/Scan/Duplicate/Cancel`
 * or `Cloud/Archive/{Create,Extract}/Cancel`). Returns whether the backend reports
 * it as cancelled (false if it had already finished). The job store is settled by
 * the caller on a true result.
 */
export async function cancelJob(job: Job): Promise<boolean> {
  try {
    if (job.kind === "duplicate-scan") {
      const res = await cloudApiFactory.duplicateScanCancel(
        { cloudDuplicateScanIdRequestModel: { ScanId: job.id } },
        SUPPRESS,
      );
      return (res.data as unknown as CloudDuplicateScanCancelResponseModel)
        .Cancelled;
    }
    if (job.kind === "archive-create") {
      const res = await cloudArchiveApiFactory.archiveCreateCancel(
        { cloudArchiveCreateCancelRequestModel: { JobId: job.id } },
        SUPPRESS,
      );
      return (res.data as unknown as CloudArchiveCreateCancelResponseModel)
        .Cancelled;
    }
    const res = await cloudArchiveApiFactory.archiveExtractCancel(
      { cloudArchiveExtractCancelRequestModel: { JobId: job.id } },
      SUPPRESS,
    );
    return (res.data as unknown as CloudArchiveExtractCancelResponseModel)
      .Cancelled;
  } catch {
    return false;
  }
}
