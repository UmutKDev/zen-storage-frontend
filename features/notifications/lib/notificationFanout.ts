import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateKey, scopedKey } from "@/lib/api";
import {
  NotificationType,
  type UnreadCountResponseModel,
} from "@/service/models";
import type {
  ArchiveJobEventData,
  DuplicateScanEventData,
  NotificationEnvelope,
} from "@/lib/socket";
import {
  isProgressType,
  jobEventFor,
  scanPhaseRank,
  useJobsStore,
  type JobEvent,
} from "@/features/jobs";
import { useUiStore, useWorkspaceStore } from "@/stores";
import { notificationKeys } from "../api";
import { notificationMeta } from "./notificationMeta";

/** Map a notification tone to the matching sonner level. */
function toastByTone(payload: NotificationEnvelope): void {
  if (typeof window === "undefined") return; // SSR guard (sonner is client-only)
  const { tone } = notificationMeta(payload.Type as string);
  const body = payload.Message
    ? { description: payload.Message }
    : undefined;
  if (tone === "red") toast.error(payload.Title, body);
  else if (tone === "green") toast.success(payload.Title, body);
  else if (tone === "amber") toast.warning(payload.Title, body);
  else toast(payload.Title, body);
}

/** Refresh the affected folder listing + usage bar for the current workspace. */
function invalidateStorage(qc: QueryClient): void {
  const ownerId = useWorkspaceStore.getState().ownerId;
  if (ownerId) void invalidateKey(qc, scopedKey(ownerId, "storage"));
}

/** Drive the job store from an archive / duplicate-scan event. */
function applyJobEvent(
  qc: QueryClient,
  event: JobEvent,
  payload: NotificationEnvelope,
): void {
  const data = (payload.Data ?? {}) as ArchiveJobEventData &
    DuplicateScanEventData;
  const id = data.JobId ?? data.ScanId;
  if (!id) return; // untrackable — falls through to inbox/toast only

  if (event.terminal) {
    useJobsStore.getState().settle(id, event.terminal, {
      error: event.terminal === "failed" ? payload.Message : undefined,
    });
    invalidateStorage(qc);
    return;
  }

  if (event.kind === "duplicate-scan") {
    useJobsStore.getState().applyEvent(id, event.kind, {
      phase: data.Phase,
      phaseRank: scanPhaseRank(data.Phase),
      percentage: data.Percentage,
      entriesProcessed: data.ProcessedFiles,
      totalEntries: data.TotalFiles,
    });
    return;
  }

  // Archive progress carries entry counts but no percentage — derive it.
  const total = data.TotalEntries ?? undefined;
  const processed = data.EntriesProcessed;
  const percentage =
    total && total > 0 && processed != null
      ? Math.round((processed / total) * 100)
      : undefined;
  useJobsStore.getState().applyEvent(id, event.kind, {
    percentage,
    entriesProcessed: processed,
    totalEntries: total ?? undefined,
  });
}

/**
 * Fan a single `notification` event out to its consumers:
 *  - **job store** — archive / duplicate-scan progress + terminal;
 *  - **progress events stop here** (transient: no toast, no inbox row);
 *  - **inbox** — invalidate list + unread, optimistic unread bump;
 *  - **quota** — set the banner level + refresh usage;
 *  - **toast** — tone-mapped sonner toast (SSR-guarded).
 *
 * Pure-ish: takes the QueryClient, reads stores via `getState()` — unit-testable
 * without React.
 */
export function routeNotification(
  payload: NotificationEnvelope,
  qc: QueryClient,
): void {
  const type = payload.Type as string;

  const event = jobEventFor(type);
  if (event) applyJobEvent(qc, event, payload);

  // Progress events are transient (backend never persists them) — no inbox, no toast.
  if (isProgressType(type)) return;

  // Inbox: a new persisted notification → refresh list + badge (optimistic bump
  // for instant feedback, then invalidate for truth).
  qc.setQueryData<UnreadCountResponseModel>(
    notificationKeys.unreadCount(),
    (c) => (c ? { Count: c.Count + 1 } : c),
  );
  void invalidateKey(qc, notificationKeys.list());
  void invalidateKey(qc, notificationKeys.unreadCount());

  if (
    type === NotificationType.QuotaWarning ||
    type === NotificationType.QuotaExceeded
  ) {
    useUiStore
      .getState()
      .setQuotaLevel(
        type === NotificationType.QuotaExceeded ? "exceeded" : "warning",
      );
    invalidateStorage(qc);
  }

  toastByTone(payload);
}
