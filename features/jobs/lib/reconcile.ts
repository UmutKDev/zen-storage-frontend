import type { QueryClient } from "@tanstack/react-query";
import { invalidateKey, isApiError, scopedKey } from "@/lib/api";
import { useWorkspaceStore } from "@/stores";
import {
  ArchiveStatusKindEnum,
  CloudArchiveStatusResponseModelStatusEnum,
  CloudDuplicateScanStatusResponseModelStatusEnum,
} from "@/service/models";
import { useJobsStore, type Job, type JobStatus } from "../stores/jobs.store";
import {
  fetchArchiveStatus,
  fetchDirectoryCreateStatus,
  fetchDuplicateScanStatus,
} from "../api/jobs.queries";
import { scanPhaseRank } from "./scanPhaseRank";

function archiveStatusToJob(status: string): JobStatus {
  if (status === CloudArchiveStatusResponseModelStatusEnum.Completed)
    return "complete";
  if (status === CloudArchiveStatusResponseModelStatusEnum.Failed)
    return "failed";
  return "running";
}

function scanStatusToJob(status: string): JobStatus {
  if (status === CloudDuplicateScanStatusResponseModelStatusEnum.Completed)
    return "complete";
  if (status === CloudDuplicateScanStatusResponseModelStatusEnum.Failed)
    return "failed";
  if (status === CloudDuplicateScanStatusResponseModelStatusEnum.Cancelled)
    return "cancelled";
  return "running";
}

/** Refresh the affected folder listing + usage bar after a job settles. */
function invalidateAfterJob(qc: QueryClient): void {
  const ownerId = useWorkspaceStore.getState().ownerId;
  if (ownerId) void invalidateKey(qc, scopedKey(ownerId, "storage"));
}

async function reconcileArchive(qc: QueryClient, job: Job): Promise<void> {
  const kind =
    job.kind === "archive-create"
      ? ArchiveStatusKindEnum.Create
      : ArchiveStatusKindEnum.Extract;
  try {
    const res = await fetchArchiveStatus(job.id, kind);
    const status = archiveStatusToJob(res.Status);
    if (status === "running") {
      useJobsStore.getState().applyEvent(job.id, job.kind, {
        percentage: res.Percentage,
        entriesProcessed: res.EntriesProcessed,
        totalEntries: res.TotalEntries ?? undefined,
      });
      return;
    }
    useJobsStore
      .getState()
      .settle(job.id, status, { error: res.Error ?? undefined });
    invalidateAfterJob(qc);
  } catch (err) {
    // 404 = the job was cancelled while queued, or evicted — treat as cancelled.
    if (isApiError(err) && err.code === "NOT_FOUND") {
      useJobsStore.getState().settle(job.id, "cancelled");
      invalidateAfterJob(qc);
    }
    // Other errors: leave it running; the next tick / reconnect retries.
  }
}

async function reconcileScan(qc: QueryClient, job: Job): Promise<void> {
  try {
    const res = await fetchDuplicateScanStatus(job.id);
    if (!res || !res.Status) return;
    const status = scanStatusToJob(res.Status);
    if (status === "running") {
      const p = res.Progress;
      useJobsStore.getState().applyEvent(job.id, "duplicate-scan", {
        phase: p?.Phase,
        phaseRank: scanPhaseRank(p?.Phase),
        percentage: p?.Percentage,
        entriesProcessed: p?.ProcessedFiles,
        totalEntries: p?.TotalFiles,
      });
      return;
    }
    useJobsStore
      .getState()
      .settle(job.id, status, { error: res.Error ?? undefined });
    invalidateAfterJob(qc);
  } catch (err) {
    if (isApiError(err) && err.code === "NOT_FOUND") {
      useJobsStore.getState().settle(job.id, "cancelled");
    }
  }
}

async function reconcileDirectoryCreate(
  qc: QueryClient,
  job: Job,
): Promise<void> {
  try {
    const res = await fetchDirectoryCreateStatus(job.id);
    const status = archiveStatusToJob(res.Status);
    if (status === "running") {
      useJobsStore.getState().applyEvent(job.id, "folder-create", {
        percentage: res.Percentage,
      });
      return;
    }
    useJobsStore
      .getState()
      .settle(job.id, status, { error: res.Error ?? undefined });
    invalidateAfterJob(qc);
  } catch (err) {
    // 404 = job evicted/finished → cancelled. A TypeError (status endpoint not in
    // the client yet) leaves the job running for the socket events to settle.
    if (isApiError(err) && err.code === "NOT_FOUND") {
      useJobsStore.getState().settle(job.id, "cancelled");
      invalidateAfterJob(qc);
    }
  }
}

/**
 * Poll every active job's status and settle/advance the store accordingly.
 * Drives the polling fallback (socket down) and reconnect reconciliation — the
 * archive poll hits the new `Cloud/Archive/Status` endpoint; the scan poll hits
 * `Cloud/Scan/Duplicate/Status`. Idempotent: replayed progress can't regress a
 * job (see `jobs.store.applyEvent`).
 */
export async function reconcileActiveJobs(qc: QueryClient): Promise<void> {
  const active = Object.values(useJobsStore.getState().jobs).filter(
    (j) => j.status === "running",
  );
  await Promise.all(
    active.map((job) =>
      job.kind === "duplicate-scan"
        ? reconcileScan(qc, job)
        : job.kind === "folder-create"
          ? reconcileDirectoryCreate(qc, job)
          : reconcileArchive(qc, job),
    ),
  );
}
