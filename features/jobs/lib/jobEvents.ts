import { NotificationType } from "@/service/models";
import type { JobKind, JobStatus } from "../stores/jobs.store";

export interface JobEvent {
  kind: JobKind;
  /** Terminal status for `*_COMPLETE/_FAILED/_CANCELLED`; undefined for progress. */
  terminal?: Exclude<JobStatus, "running">;
}

/** Maps a job-bearing `NotificationType` to its job kind + terminal status. */
const JOB_EVENTS: Partial<Record<string, JobEvent>> = {
  [NotificationType.ArchiveCreateProgress]: { kind: "archive-create" },
  [NotificationType.ArchiveCreateComplete]: {
    kind: "archive-create",
    terminal: "complete",
  },
  [NotificationType.ArchiveCreateFailed]: {
    kind: "archive-create",
    terminal: "failed",
  },
  [NotificationType.ArchiveExtractProgress]: { kind: "archive-extract" },
  [NotificationType.ArchiveExtractComplete]: {
    kind: "archive-extract",
    terminal: "complete",
  },
  [NotificationType.ArchiveExtractFailed]: {
    kind: "archive-extract",
    terminal: "failed",
  },
  [NotificationType.DuplicateScanProgress]: { kind: "duplicate-scan" },
  [NotificationType.DuplicateScanComplete]: {
    kind: "duplicate-scan",
    terminal: "complete",
  },
  [NotificationType.DuplicateScanFailed]: {
    kind: "duplicate-scan",
    terminal: "failed",
  },
  [NotificationType.DuplicateScanCancelled]: {
    kind: "duplicate-scan",
    terminal: "cancelled",
  },
  // Folder create (async). Raw string values until the client is regenerated and
  // `NotificationType.FolderCreate*` exists — the map + `jobEventFor` are
  // string-keyed, so these match the backend `FOLDER_CREATE_*` emit verbatim.
  FOLDER_CREATE_PROGRESS: { kind: "folder-create" },
  FOLDER_CREATE_COMPLETE: { kind: "folder-create", terminal: "complete" },
  FOLDER_CREATE_FAILED: { kind: "folder-create", terminal: "failed" },
};

/** The job-event descriptor for a notification type, or undefined if not a job. */
export function jobEventFor(type: string): JobEvent | undefined {
  return JOB_EVENTS[type];
}

/** Progress event types — these stay silent (no toast, no inbox row). */
const PROGRESS_TYPES = new Set<string>([
  NotificationType.ArchiveCreateProgress,
  NotificationType.ArchiveExtractProgress,
  NotificationType.DuplicateScanProgress,
  "FOLDER_CREATE_PROGRESS",
]);

/** True for high-frequency progress events (transient — never toasted/persisted). */
export function isProgressType(type: string): boolean {
  return PROGRESS_TYPES.has(type);
}
