import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Long-running async jobs (archive create/extract, duplicate scan, folder create). */
export type JobKind =
  | "archive-create"
  | "archive-extract"
  | "duplicate-scan"
  | "folder-create";
export type JobStatus = "running" | "complete" | "failed" | "cancelled";

export interface Job {
  /** BullMQ JobId (archives) or ScanId (duplicate scan). */
  id: string;
  kind: JobKind;
  status: JobStatus;
  phase?: string;
  /** Monotonic rank of `phase` (ordered scans); 0 for unranked/archive phases. */
  phaseRank: number;
  /** 0-100, monotonic while running. */
  percentage: number;
  entriesProcessed?: number;
  totalEntries?: number;
  title: string;
  /** Affected folder path, for terminal cache invalidation. */
  path?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TrackInput {
  id: string;
  kind: JobKind;
  title: string;
  path?: string;
}

export interface JobPatch {
  phase?: string;
  /** Rank of `phase`; an update with a lower rank than the current is ignored. */
  phaseRank?: number;
  percentage?: number;
  entriesProcessed?: number;
  totalEntries?: number;
  title?: string;
}

interface JobsState {
  jobs: Record<string, Job>;
  /** Register a job on REST start (before any progress event). */
  track: (input: TrackInput) => void;
  /**
   * Apply a progress patch. **Idempotent** (realtime-socket §4.7 / §7): a patch is
   * a no-op once the job is terminal; `percentage` only increases; `phase` only
   * advances by rank. Duplicate / replayed events (after a reconnect) never regress
   * the bar or double-render. Creates a running job if the event beats `track`.
   */
  applyEvent: (id: string, kind: JobKind, patch: JobPatch) => void;
  /** Settle a job to a terminal state (no-op if already terminal). */
  settle: (
    id: string,
    status: Exclude<JobStatus, "running">,
    opts?: { error?: string; path?: string },
  ) => void;
  remove: (id: string) => void;
  /** Drop every terminal job (keep the active ones). */
  clearFinished: () => void;
  reset: () => void;
}

export const useJobsStore = create<JobsState>()(
  persist(
    (set) => ({
  jobs: {},

  track: ({ id, kind, title, path }) =>
    set((state) => {
      if (state.jobs[id]) return state;
      const now = Date.now();
      return {
        jobs: {
          ...state.jobs,
          [id]: {
            id,
            kind,
            status: "running",
            phaseRank: 0,
            percentage: 0,
            title,
            path,
            createdAt: now,
            updatedAt: now,
          },
        },
      };
    }),

  applyEvent: (id, kind, patch) =>
    set((state) => {
      const prev = state.jobs[id];
      // Terminal jobs are frozen — a late/replayed progress event is a no-op.
      if (prev && prev.status !== "running") return state;

      const now = Date.now();
      const base: Job =
        prev ??
        {
          id,
          kind,
          status: "running",
          phaseRank: 0,
          percentage: 0,
          title: patch.title ?? "",
          createdAt: now,
          updatedAt: now,
        };

      const phaseAdvances =
        patch.phaseRank === undefined || patch.phaseRank >= base.phaseRank;

      const next: Job = {
        ...base,
        title: patch.title ?? base.title,
        phase: phaseAdvances && patch.phase !== undefined ? patch.phase : base.phase,
        phaseRank:
          patch.phaseRank !== undefined
            ? Math.max(base.phaseRank, patch.phaseRank)
            : base.phaseRank,
        percentage:
          patch.percentage !== undefined
            ? Math.max(base.percentage, patch.percentage)
            : base.percentage,
        entriesProcessed:
          patch.entriesProcessed !== undefined
            ? Math.max(base.entriesProcessed ?? 0, patch.entriesProcessed)
            : base.entriesProcessed,
        totalEntries: patch.totalEntries ?? base.totalEntries,
        updatedAt: now,
      };

      return { jobs: { ...state.jobs, [id]: next } };
    }),

  settle: (id, status, opts) =>
    set((state) => {
      const prev = state.jobs[id];
      if (prev && prev.status !== "running") return state;
      const now = Date.now();
      const base: Job =
        prev ??
        {
          id,
          kind: "archive-create",
          status: "running",
          phaseRank: 0,
          percentage: 0,
          title: "",
          createdAt: now,
          updatedAt: now,
        };
      return {
        jobs: {
          ...state.jobs,
          [id]: {
            ...base,
            status,
            percentage: status === "complete" ? 100 : base.percentage,
            error: opts?.error ?? base.error,
            path: opts?.path ?? base.path,
            updatedAt: now,
          },
        },
      };
    }),

  remove: (id) =>
    set((state) => {
      if (!state.jobs[id]) return state;
      const next = { ...state.jobs };
      delete next[id];
      return { jobs: next };
    }),

  clearFinished: () =>
    set((state) => ({
      jobs: Object.fromEntries(
        Object.entries(state.jobs).filter(([, j]) => j.status === "running"),
      ),
    })),

  reset: () => set({ jobs: {} }),
    }),
    {
      name: "zen-jobs",
      storage: createJSONStorage(() => sessionStorage),
      // Tab-scoped, RUNNING-only: a refresh mid-job keeps the background-task
      // indicator alive (the poller reconciles status on rehydrate); terminal
      // jobs aren't restored (they were already surfaced/toasted).
      partialize: (state) => ({
        jobs: Object.fromEntries(
          Object.entries(state.jobs).filter(([, j]) => j.status === "running"),
        ),
      }),
      // Rehydrate explicitly after mount (JobProgressPoller) so the SSR'd empty
      // state matches first paint — no hydration mismatch on the topbar badge.
      skipHydration: true,
    },
  ),
);
