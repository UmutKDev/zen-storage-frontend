import { beforeEach, describe, expect, it } from "vitest";
import { useJobsStore } from "@/features/jobs";

const reset = () => useJobsStore.getState().reset();

describe("jobs store — idempotent updates", () => {
  beforeEach(reset);

  it("tracks a job as running at 0%", () => {
    useJobsStore.getState().track({ id: "j1", kind: "archive-create", title: "x" });
    const job = useJobsStore.getState().jobs.j1;
    expect(job.status).toBe("running");
    expect(job.percentage).toBe(0);
  });

  it("advances percentage but never regresses it (monotonic)", () => {
    const { track, applyEvent } = useJobsStore.getState();
    track({ id: "j1", kind: "archive-create", title: "x" });
    applyEvent("j1", "archive-create", { percentage: 40 });
    applyEvent("j1", "archive-create", { percentage: 20 }); // stale / replayed
    expect(useJobsStore.getState().jobs.j1.percentage).toBe(40);
    applyEvent("j1", "archive-create", { percentage: 75 });
    expect(useJobsStore.getState().jobs.j1.percentage).toBe(75);
  });

  it("advances phase only by rank (a lower-rank patch keeps the current phase)", () => {
    const { track, applyEvent } = useJobsStore.getState();
    track({ id: "s1", kind: "duplicate-scan", title: "scan" });
    applyEvent("s1", "duplicate-scan", { phase: "CONTENT_HASHING", phaseRank: 2 });
    applyEvent("s1", "duplicate-scan", { phase: "LISTING", phaseRank: 0 }); // out-of-order replay
    expect(useJobsStore.getState().jobs.s1.phase).toBe("CONTENT_HASHING");
    applyEvent("s1", "duplicate-scan", { phase: "FINALIZING", phaseRank: 4 });
    expect(useJobsStore.getState().jobs.s1.phase).toBe("FINALIZING");
  });

  it("freezes a terminal job — late/replayed progress is a no-op", () => {
    const { track, applyEvent, settle } = useJobsStore.getState();
    track({ id: "j1", kind: "archive-extract", title: "x" });
    applyEvent("j1", "archive-extract", { percentage: 60 });
    settle("j1", "complete");
    expect(useJobsStore.getState().jobs.j1.percentage).toBe(100);
    // A replayed progress event after the COMPLETE must not resurrect the job.
    applyEvent("j1", "archive-extract", { percentage: 30 });
    settle("j1", "failed", { error: "boom" });
    const job = useJobsStore.getState().jobs.j1;
    expect(job.status).toBe("complete");
    expect(job.percentage).toBe(100);
    expect(job.error).toBeUndefined();
  });

  it("creates a running job if a progress event beats track()", () => {
    useJobsStore.getState().applyEvent("j9", "archive-create", { percentage: 10 });
    const job = useJobsStore.getState().jobs.j9;
    expect(job.status).toBe("running");
    expect(job.percentage).toBe(10);
  });

  it("clearFinished keeps active jobs and drops terminal ones", () => {
    const { track, settle, clearFinished } = useJobsStore.getState();
    track({ id: "a", kind: "archive-create", title: "a" });
    track({ id: "b", kind: "archive-create", title: "b" });
    settle("b", "complete");
    clearFinished();
    const jobs = useJobsStore.getState().jobs;
    expect(jobs.a).toBeDefined();
    expect(jobs.b).toBeUndefined();
  });
});
