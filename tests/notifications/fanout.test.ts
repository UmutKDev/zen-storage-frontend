import { beforeEach, describe, expect, it, vi } from "vitest";

// Only sonner is mocked; stores + fan-out logic run for real against a stub qc.
vi.mock("sonner", () => {
  const toast = Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  });
  return { toast };
});

import { toast } from "sonner";
import { NotificationType, type NotificationType as NType } from "@/service/models";
import type { NotificationEnvelope } from "@/lib/socket";
import { routeNotification } from "@/features/notifications";
import { useJobsStore } from "@/features/jobs";
import { useUiStore } from "@/stores";

function makeQc() {
  return { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
}

function envelope(type: NType, Data?: Record<string, unknown>, Message = ""): NotificationEnvelope {
  return { Type: type, Title: "T", Message, Data, Timestamp: "2026-06-16T00:00:00Z" };
}

describe("notification fan-out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useJobsStore.getState().reset();
    useUiStore.getState().reset();
  });

  it("progress events stay silent (no toast, no inbox) but drive the job store", () => {
    const qc = makeQc();
    routeNotification(
      envelope(NotificationType.ArchiveCreateProgress, {
        JobId: "j1",
        EntriesProcessed: 5,
        TotalEntries: 10,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      qc as any,
    );
    expect(toast).not.toHaveBeenCalled();
    expect(qc.invalidateQueries).not.toHaveBeenCalled();
    expect(useJobsStore.getState().jobs.j1.percentage).toBe(50);
  });

  it("a COMPLETE event toasts success, settles the job, and refreshes the inbox", () => {
    const qc = makeQc();
    routeNotification(
      envelope(NotificationType.ArchiveCreateComplete, { JobId: "j1" }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      qc as any,
    );
    expect((toast as unknown as { success: ReturnType<typeof vi.fn> }).success).toHaveBeenCalled();
    expect(qc.invalidateQueries).toHaveBeenCalled();
    expect(qc.setQueryData).toHaveBeenCalled(); // optimistic unread bump
    expect(useJobsStore.getState().jobs.j1.status).toBe("complete");
  });

  it("a FAILED event toasts error and settles the job with the message", () => {
    const qc = makeQc();
    routeNotification(
      envelope(NotificationType.DuplicateScanFailed, { ScanId: "s1" }, "disk full"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      qc as any,
    );
    expect((toast as unknown as { error: ReturnType<typeof vi.fn> }).error).toHaveBeenCalled();
    const job = useJobsStore.getState().jobs.s1;
    expect(job.status).toBe("failed");
    expect(job.error).toBe("disk full");
  });

  it("QUOTA_WARNING sets the banner level and toasts a warning", () => {
    const qc = makeQc();
    routeNotification(envelope(NotificationType.QuotaWarning), qc as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(useUiStore.getState().quotaLevel).toBe("warning");
    expect((toast as unknown as { warning: ReturnType<typeof vi.fn> }).warning).toHaveBeenCalled();
  });

  it("QUOTA_EXCEEDED sets the exceeded level", () => {
    const qc = makeQc();
    routeNotification(envelope(NotificationType.QuotaExceeded), qc as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(useUiStore.getState().quotaLevel).toBe("exceeded");
  });

  it("a non-job notification refreshes the inbox and toasts, touching no job", () => {
    const qc = makeQc();
    routeNotification(envelope(NotificationType.SubscriptionChanged), qc as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(qc.invalidateQueries).toHaveBeenCalled();
    expect(toast).toHaveBeenCalled();
    expect(Object.keys(useJobsStore.getState().jobs)).toHaveLength(0);
  });
});
