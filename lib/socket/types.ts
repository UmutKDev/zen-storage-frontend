import type { NotificationType } from "@/service/models";

/**
 * Socket handshake auth. **PascalCase `SessionId`** to match the backend gateway,
 * which reads `handshake.auth.SessionId` (the lowercase sample in the
 * realtime-socket doc is wrong — see DECISIONS D-P6.2).
 */
export interface SocketHandshake {
  SessionId: string;
}

/**
 * Wire payload for the single `notification` event (backend
 * `NotificationPayloadModel`). The backend emits ONE event name carrying a
 * `Type` discriminator; consumers narrow `Data` by `Type` to a `*EventData`
 * shape below. `Data` keys are PascalCase (the backend convention).
 */
export interface NotificationEnvelope<TData = Record<string, unknown>> {
  Type: NotificationType;
  Title: string;
  Message: string;
  Data?: TData | null;
  Timestamp: string;
}

/**
 * `Data` for `ARCHIVE_CREATE_*` / `ARCHIVE_EXTRACT_*` events. All fields are
 * optional — narrowing is defensive (an event missing `JobId` is untrackable and
 * falls through to inbox/toast only).
 */
export interface ArchiveJobEventData {
  JobId?: string;
  Phase?: string;
  EntriesProcessed?: number;
  TotalEntries?: number | null;
  Key?: string;
  OutputKey?: string;
  ExtractedPath?: string;
  Size?: number;
  Format?: string;
}

/** `Data` for `DUPLICATE_SCAN_*` events (progress + terminal). */
export interface DuplicateScanEventData {
  ScanId?: string;
  Phase?: string;
  Percentage?: number;
  TotalFiles?: number;
  ProcessedFiles?: number;
  TotalGroups?: number;
  TotalSavings?: number;
}

/**
 * `Data` for `QUOTA_WARNING` / `QUOTA_EXCEEDED`. The exact shape is
 * backend-defined and may vary, so it's loose — the banner reconciles from the
 * authoritative usage query (invalidated on the event) rather than trusting these.
 */
export interface QuotaEventData {
  UsagePercentage?: number;
  UsedBytes?: number;
  MaxBytes?: number;
  [key: string]: unknown;
}

export interface ServerToClientEvents {
  notification: (payload: NotificationEnvelope) => void;
  pong: () => void;
}

export interface ClientToServerEvents {
  ping: () => void;
}
