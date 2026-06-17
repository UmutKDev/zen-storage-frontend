"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJobsStore } from "../stores/jobs.store";
import { reconcileActiveJobs } from "../lib/reconcile";

/**
 * How often to poll a running job's status endpoint (ms). The socket still
 * delivers instant updates; this guarantees the progress bar advances when
 * progress events are sparse — the scan's LISTING phase emits no percentage and
 * the hashing phase only writes every N files — or simply missed.
 */
const POLL_INTERVAL_MS = 2_000;

/**
 * Polls every active job's status while any job is running, feeding progress
 * into the job store via `reconcileActiveJobs`. Mounted app-wide (providers) so
 * the topbar `JobsMenu` and any open panel both advance even with the dialog
 * closed. No interval runs when nothing is active. Idempotent: the store never
 * regresses (`jobs.store.applyEvent`), so the poll and the socket can't
 * double-count or fight each other.
 */
export function JobProgressPoller() {
  const qc = useQueryClient();
  const hasRunning = useJobsStore((s) =>
    Object.values(s.jobs).some((j) => j.status === "running"),
  );

  // Restore running jobs persisted (tab-scoped) before a refresh, so reloading
  // mid-extract doesn't drop the background-task indicator. Runs once on the
  // client after mount (the store uses skipHydration to avoid an SSR mismatch);
  // the poll effect below then reconciles their real status.
  useEffect(() => {
    void useJobsStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!hasRunning) return;
    // Poll once immediately so the bar moves without waiting a full interval.
    void reconcileActiveJobs(qc);
    const id = setInterval(() => void reconcileActiveJobs(qc), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasRunning, qc]);

  return null;
}
