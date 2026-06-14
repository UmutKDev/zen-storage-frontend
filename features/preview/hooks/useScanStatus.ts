"use client";

import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/stores";
import { CloudScanStatusResponseModelStatusEnum } from "@/service/models";
import { getScanStatus, previewKeys } from "../api";

const POLL_PENDING_MS = 4000;

export type ScanGate = "clean" | "pending" | "infected" | "unknown";

/**
 * Antivirus gate for a file. Polls every 4s while the scan is `pending`, then
 * stops. Collapses the raw status into a coarse gate the modal acts on:
 * - `infected` → block body + download + share
 * - `pending`  → warn (allow with confirmation)
 * - `clean`/`skipped`/`null`/`error` → `clean`/`unknown` (don't block)
 */
export function useScanStatus(key: string): {
  gate: ScanGate;
  isLoading: boolean;
} {
  const ownerId = useWorkspaceStore((s) => s.ownerId);
  const enabled = Boolean(ownerId) && Boolean(key);

  const query = useQuery({
    queryKey: previewKeys.scan(ownerId ?? "anon", key),
    queryFn: ({ signal }) => getScanStatus(key, signal),
    enabled,
    refetchInterval: (q) =>
      q.state.data?.Status === CloudScanStatusResponseModelStatusEnum.Pending
        ? POLL_PENDING_MS
        : false,
  });

  const status = query.data?.Status;
  const gate: ScanGate =
    status === CloudScanStatusResponseModelStatusEnum.Infected
      ? "infected"
      : status === CloudScanStatusResponseModelStatusEnum.Pending
        ? "pending"
        : status === CloudScanStatusResponseModelStatusEnum.Error
          ? "unknown"
          : "clean";

  return { gate, isLoading: enabled && query.isPending };
}
