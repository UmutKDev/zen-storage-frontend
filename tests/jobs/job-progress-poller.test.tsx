import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the reconcile driver — the poller's job is to CALL it on a cadence; the
// status→store mapping itself is covered by reconcile.test.ts.
vi.mock("@/features/jobs/lib/reconcile", () => ({
  reconcileActiveJobs: vi.fn().mockResolvedValue(undefined),
}));

import { JobProgressPoller } from "@/features/jobs";
import { reconcileActiveJobs, useJobsStore } from "@/features/jobs";

const reconcileMock = vi.mocked(reconcileActiveJobs);

function renderPoller() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <JobProgressPoller />
    </QueryClientProvider>,
  );
}

describe("JobProgressPoller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    reconcileMock.mockClear();
    useJobsStore.getState().reset();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("does not poll when no job is running", () => {
    renderPoller();
    act(() => {
      vi.advanceTimersByTime(6_000);
    });
    expect(reconcileMock).not.toHaveBeenCalled();
  });

  it("polls immediately on mount and on each interval while a job runs", () => {
    useJobsStore
      .getState()
      .track({ id: "s1", kind: "duplicate-scan", title: "scan" });

    renderPoller();
    expect(reconcileMock).toHaveBeenCalledTimes(1); // immediate

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(reconcileMock).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(reconcileMock).toHaveBeenCalledTimes(3);
  });

  it("stops polling once the last job settles", () => {
    useJobsStore
      .getState()
      .track({ id: "s1", kind: "duplicate-scan", title: "scan" });
    renderPoller();
    expect(reconcileMock).toHaveBeenCalledTimes(1);

    act(() => {
      useJobsStore.getState().settle("s1", "complete");
    });
    reconcileMock.mockClear();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(reconcileMock).not.toHaveBeenCalled();
  });
});
