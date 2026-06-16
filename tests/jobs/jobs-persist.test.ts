import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useJobsStore, type Job } from "@/features/jobs";

const STORAGE_KEY = "zen-jobs";

function runningJob(id: string): Job {
  return {
    id,
    kind: "archive-extract",
    status: "running",
    phaseRank: 0,
    percentage: 30,
    title: "Extracting archive",
    createdAt: 1,
    updatedAt: 1,
  };
}

describe("jobs store persistence (survive a refresh mid-job)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useJobsStore.getState().reset();
  });
  afterEach(() => {
    sessionStorage.clear();
    useJobsStore.getState().reset();
  });

  it("persists only running jobs — terminal jobs are not restorable", () => {
    useJobsStore
      .getState()
      .track({ id: "r1", kind: "archive-extract", title: "extracting" });
    useJobsStore
      .getState()
      .track({ id: "c1", kind: "archive-create", title: "zipping" });
    useJobsStore.getState().settle("c1", "complete");

    const raw = sessionStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const persisted = JSON.parse(raw as string).state.jobs as Record<
      string,
      Job
    >;
    expect(Object.keys(persisted)).toEqual(["r1"]);
  });

  it("rehydrates a running job left by a prior page load", async () => {
    // Simulate a refresh: in-memory store is empty, sessionStorage still holds the
    // running job written before the reload.
    useJobsStore.getState().reset();
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { jobs: { r9: runningJob("r9") } }, version: 0 }),
    );

    await useJobsStore.persist.rehydrate();

    expect(useJobsStore.getState().jobs.r9?.status).toBe("running");
  });
});
