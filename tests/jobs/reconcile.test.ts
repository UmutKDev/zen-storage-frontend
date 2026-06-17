import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the status-poll queries; everything else (store, mapping) runs for real.
vi.mock("@/features/jobs/api/jobs.queries", () => ({
  fetchArchiveStatus: vi.fn(),
  fetchDuplicateScanStatus: vi.fn(),
  fetchDirectoryCreateStatus: vi.fn(),
}));

import { ApiError } from "@/lib/api";
import { reconcileActiveJobs, useJobsStore } from "@/features/jobs";
import {
  fetchArchiveStatus,
  fetchDirectoryCreateStatus,
  fetchDuplicateScanStatus,
} from "@/features/jobs/api/jobs.queries";
import { useWorkspaceStore } from "@/stores";

const archiveMock = vi.mocked(fetchArchiveStatus);
const scanMock = vi.mocked(fetchDuplicateScanStatus);
const folderCreateMock = vi.mocked(fetchDirectoryCreateStatus);

function makeQc() {
  return { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- stub QueryClient
const asQc = (qc: ReturnType<typeof makeQc>) => qc as any;

describe("reconcileActiveJobs — polling fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useJobsStore.getState().reset();
    useWorkspaceStore.getState().setOwner("u1");
  });

  it("advances a running archive job from a status poll", async () => {
    useJobsStore.getState().track({ id: "j1", kind: "archive-create", title: "x" });
    archiveMock.mockResolvedValueOnce({
      Status: "active",
      EntriesProcessed: 5,
      TotalEntries: 10,
      Percentage: 50,
    } as never);

    await reconcileActiveJobs(asQc(makeQc()));

    expect(archiveMock).toHaveBeenCalledWith("j1", "create");
    const job = useJobsStore.getState().jobs.j1;
    expect(job.status).toBe("running");
    expect(job.percentage).toBe(50);
  });

  it("settles a completed archive job and invalidates storage", async () => {
    useJobsStore.getState().track({ id: "j1", kind: "archive-create", title: "x" });
    archiveMock.mockResolvedValueOnce({ Status: "completed", Percentage: 100 } as never);

    const qc = makeQc();
    await reconcileActiveJobs(asQc(qc));

    expect(useJobsStore.getState().jobs.j1.status).toBe("complete");
    expect(qc.invalidateQueries).toHaveBeenCalled();
  });

  it("does not re-poll a settled job (kill-socket replay is a no-op)", async () => {
    useJobsStore.getState().track({ id: "j1", kind: "archive-extract", title: "x" });
    archiveMock.mockResolvedValueOnce({ Status: "completed" } as never);
    await reconcileActiveJobs(asQc(makeQc()));
    expect(useJobsStore.getState().jobs.j1.status).toBe("complete");

    archiveMock.mockClear();
    await reconcileActiveJobs(asQc(makeQc())); // job no longer running → skipped
    expect(archiveMock).not.toHaveBeenCalled();
  });

  it("advances a duplicate scan's phase + percentage from its status poll", async () => {
    useJobsStore.getState().track({ id: "s1", kind: "duplicate-scan", title: "scan" });
    scanMock.mockResolvedValueOnce({
      Status: "SCANNING",
      Progress: {
        Phase: "CONTENT_HASHING",
        Percentage: 40,
        ProcessedFiles: 4,
        TotalFiles: 10,
      },
    } as never);

    await reconcileActiveJobs(asQc(makeQc()));

    const job = useJobsStore.getState().jobs.s1;
    expect(job.phase).toBe("CONTENT_HASHING");
    expect(job.percentage).toBe(40);
  });

  it("settles a job as cancelled when its status 404s (removed/evicted)", async () => {
    useJobsStore.getState().track({ id: "j1", kind: "archive-create", title: "x" });
    archiveMock.mockRejectedValueOnce(
      new ApiError({ code: "NOT_FOUND", messages: ["gone"] }),
    );

    await reconcileActiveJobs(asQc(makeQc()));

    expect(useJobsStore.getState().jobs.j1.status).toBe("cancelled");
  });

  it("advances a running folder-create job from its status poll", async () => {
    useJobsStore.getState().track({ id: "f1", kind: "folder-create", title: "new" });
    folderCreateMock.mockResolvedValueOnce({
      JobId: "f1",
      Status: "active",
      Percentage: 30,
    } as never);

    await reconcileActiveJobs(asQc(makeQc()));

    expect(folderCreateMock).toHaveBeenCalledWith("f1");
    const job = useJobsStore.getState().jobs.f1;
    expect(job.status).toBe("running");
    expect(job.percentage).toBe(30);
  });

  it("settles a completed folder-create job and invalidates storage", async () => {
    useJobsStore.getState().track({ id: "f1", kind: "folder-create", title: "new" });
    folderCreateMock.mockResolvedValueOnce({
      JobId: "f1",
      Status: "completed",
      Percentage: 100,
    } as never);

    const qc = makeQc();
    await reconcileActiveJobs(asQc(qc));

    expect(useJobsStore.getState().jobs.f1.status).toBe("complete");
    expect(qc.invalidateQueries).toHaveBeenCalled();
  });

  it("settles a failed folder-create job, surfacing the error", async () => {
    useJobsStore.getState().track({ id: "f1", kind: "folder-create", title: "new" });
    folderCreateMock.mockResolvedValueOnce({
      JobId: "f1",
      Status: "failed",
      Error: "disk full",
    } as never);

    await reconcileActiveJobs(asQc(makeQc()));

    const job = useJobsStore.getState().jobs.f1;
    expect(job.status).toBe("failed");
    expect(job.error).toBe("disk full");
  });

  it("settles a folder-create job as cancelled when its status 404s", async () => {
    useJobsStore.getState().track({ id: "f1", kind: "folder-create", title: "new" });
    folderCreateMock.mockRejectedValueOnce(
      new ApiError({ code: "NOT_FOUND", messages: ["gone"] }),
    );

    await reconcileActiveJobs(asQc(makeQc()));

    expect(useJobsStore.getState().jobs.f1.status).toBe("cancelled");
  });
});
