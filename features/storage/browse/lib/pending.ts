/**
 * A non-interactive "in progress" row in the listing — a fast optimistic create
 * (from `pendingOps`) or a durable job (from `useJobsStore`), rendered the same
 * way. Deliberately kept OUT of the `FolderEntry` union so selection, drag-and-
 * drop, preview, and the sort/filter pipeline never see it; it's merged into the
 * VirtualList rows for rendering only.
 */
export interface PendingEntry {
  /** Stable key — the optimistic op id or the job id. */
  id: string;
  /** Primary line: the item name (creates) or the job title (archives). */
  label: string;
  /** Secondary line: a localized status, e.g. "Creating folder…". */
  detail?: string;
  /** 0–100 when known (jobs with progress). */
  percentage?: number;
}
