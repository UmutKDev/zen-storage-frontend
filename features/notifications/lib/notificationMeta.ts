import {
  Archive,
  ArchiveRestore,
  Ban,
  Bell,
  CircleAlert,
  CopyCheck,
  CreditCard,
  FilePen,
  FilePlus,
  FolderInput,
  Gauge,
  Lock,
  LockOpen,
  OctagonAlert,
  ScanSearch,
  TriangleAlert,
  UploadCloud,
  UserCheck,
  UserPlus,
  UserX,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import type { FileTone } from "@/lib/utils";
import { NotificationType } from "@/service/models";

/**
 * Icon + tone for a notification, by its `Type`. Reuses the storage `FileTone`
 * scale + `.zs-tone-*` tiles (via `toneClass`) — one tone system, no parallel.
 * Color carries meaning, never decoration: failures→red, completions→green,
 * in-flight→brand/teal, quota→amber/red, info→blue, neutral→slate.
 */
export interface NotificationMeta {
  icon: LucideIcon;
  tone: FileTone;
}

const META: Record<string, NotificationMeta> = {
  [NotificationType.UploadFailed]: { icon: UploadCloud, tone: "red" },
  [NotificationType.FileMoved]: { icon: FolderInput, tone: "brand" },
  [NotificationType.ArchiveCreateProgress]: { icon: Archive, tone: "brand" },
  [NotificationType.ArchiveCreateComplete]: { icon: Archive, tone: "green" },
  [NotificationType.ArchiveCreateFailed]: { icon: Archive, tone: "red" },
  [NotificationType.ArchiveExtractProgress]: { icon: ArchiveRestore, tone: "brand" },
  [NotificationType.ArchiveExtractComplete]: { icon: ArchiveRestore, tone: "green" },
  [NotificationType.ArchiveExtractFailed]: { icon: ArchiveRestore, tone: "red" },
  [NotificationType.QuotaWarning]: { icon: TriangleAlert, tone: "amber" },
  [NotificationType.QuotaExceeded]: { icon: OctagonAlert, tone: "red" },
  [NotificationType.TeamInvitationReceived]: { icon: UserPlus, tone: "brand" },
  [NotificationType.TeamInvitationAccepted]: { icon: UserCheck, tone: "green" },
  [NotificationType.TeamInvitationDeclined]: { icon: UserX, tone: "slate" },
  [NotificationType.SubscriptionChanged]: { icon: CreditCard, tone: "blue" },
  [NotificationType.SubscriptionCancelled]: { icon: CreditCard, tone: "amber" },
  [NotificationType.Error]: { icon: CircleAlert, tone: "red" },
  [NotificationType.RateLimit]: { icon: Gauge, tone: "red" },
  [NotificationType.DocumentCreated]: { icon: FilePlus, tone: "brand" },
  [NotificationType.DocumentUpdated]: { icon: FilePen, tone: "blue" },
  [NotificationType.DocumentLocked]: { icon: Lock, tone: "slate" },
  [NotificationType.DocumentUnlocked]: { icon: LockOpen, tone: "green" },
  [NotificationType.DuplicateScanProgress]: { icon: ScanSearch, tone: "teal" },
  [NotificationType.DuplicateScanComplete]: { icon: CopyCheck, tone: "green" },
  [NotificationType.DuplicateScanFailed]: { icon: ScanSearch, tone: "red" },
  [NotificationType.DuplicateScanCancelled]: { icon: Ban, tone: "slate" },
  [NotificationType.WebhookDeliveryFailed]: { icon: Webhook, tone: "red" },
  [NotificationType.ApiQuotaWarning]: { icon: TriangleAlert, tone: "amber" },
  [NotificationType.ApiQuotaExceeded]: { icon: OctagonAlert, tone: "red" },
};

/** A neutral fallback for any unknown / future type the backend may send. */
const FALLBACK: NotificationMeta = { icon: Bell, tone: "slate" };

export function notificationMeta(type: string): NotificationMeta {
  return META[type] ?? FALLBACK;
}
