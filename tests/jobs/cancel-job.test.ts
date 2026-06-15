import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/service/factories", () => ({
  cloudApiFactory: { duplicateScanCancel: vi.fn() },
  cloudArchiveApiFactory: {
    archiveCreateCancel: vi.fn(),
    archiveExtractCancel: vi.fn(),
  },
}));

import { cancelJob } from "@/features/jobs/api/jobs.mutations";
import { cloudApiFactory, cloudArchiveApiFactory } from "@/service/factories";
import type { Job, JobKind } from "@/features/jobs";

const dup = vi.mocked(cloudApiFactory.duplicateScanCancel);
const create = vi.mocked(cloudArchiveApiFactory.archiveCreateCancel);
const extract = vi.mocked(cloudArchiveApiFactory.archiveExtractCancel);

function job(kind: JobKind, id: string): Job {
  return {
    id,
    kind,
    status: "running",
    phaseRank: 0,
    percentage: 0,
    title: "",
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("cancelJob", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cancels a duplicate scan by ScanId and returns Cancelled", async () => {
    dup.mockResolvedValueOnce({ data: { Cancelled: true } } as never);
    const ok = await cancelJob(job("duplicate-scan", "s1"));
    expect(dup).toHaveBeenCalledWith(
      { cloudDuplicateScanIdRequestModel: { ScanId: "s1" } },
      { suppressErrorToast: true },
    );
    expect(ok).toBe(true);
  });

  it("cancels an archive-create by JobId", async () => {
    create.mockResolvedValueOnce({ data: { Cancelled: true } } as never);
    const ok = await cancelJob(job("archive-create", "j1"));
    expect(create).toHaveBeenCalledWith(
      { cloudArchiveCreateCancelRequestModel: { JobId: "j1" } },
      { suppressErrorToast: true },
    );
    expect(ok).toBe(true);
  });

  it("cancels an archive-extract by JobId", async () => {
    extract.mockResolvedValueOnce({ data: { Cancelled: false } } as never);
    const ok = await cancelJob(job("archive-extract", "j2"));
    expect(extract).toHaveBeenCalledWith(
      { cloudArchiveExtractCancelRequestModel: { JobId: "j2" } },
      { suppressErrorToast: true },
    );
    expect(ok).toBe(false);
  });

  it("returns false when the cancel call throws (job already gone)", async () => {
    dup.mockRejectedValueOnce(new Error("404"));
    expect(await cancelJob(job("duplicate-scan", "s9"))).toBe(false);
  });
});
