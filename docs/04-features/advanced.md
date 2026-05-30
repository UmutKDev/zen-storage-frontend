# Feature — Advanced (Phase 6) 🟢

> Duplicate scan, archive, AV status, notifications. Transport: socket‑first + poll
> ([realtime-socket](../02-architecture/realtime-socket.md)). API: [cloud-archive](../05-api/modules/cloud-archive.md),
> [notifications](../05-api/modules/notifications.md).

## Duplicate scan
**Component:** `DuplicateScanPanel` + `JobIndicator`.
**Endpoints:** `Cloud/Scan/Duplicate/Start`/`Status`/`Result`/`Cancel`.
**Flow:** start (Path, Recursive, SimilarityThreshold) → progress (socket + poll) → result groups.
**Result UI:** groups labeled **exact (SHA‑256)** vs **perceptual (dHash)** + similarity %; potential savings; resolve by
selecting which to delete.
**States:** scanning (progress + cancel); empty (no duplicates); error; canceled.

## Archive
| Action | Component | Endpoint | Notes |
|---|---|---|---|
| Create (zip) | bulk action → `JobIndicator` | `Archive/Create/Start`/`Cancel` | output file appears in folder; progress (socket+poll) |
| Extract | item menu → job | `Archive/Extract/Start`/`Cancel`, `/Preview` | **preview entries**; **selective extract**; output conflict (dialog); cancel |
**Formats:** ZIP / TAR / TAR_GZ / RAR. **Socket events:** `ARCHIVE_CREATE_*`, `ARCHIVE_EXTRACT_*`.

## AV scan status
**Where:** badge on items + preview/download gate. **Endpoint:** `Cloud/Scan/Status`.
**States:** pending (gated/warn), infected (block or warn‑on‑download), clean (unobstructed). Ties to
[state-matrix](../02-architecture/state-matrix.md).

## Notifications
| Surface | Component | Source | Notes |
|---|---|---|---|
| Toasts | `NotificationProvider` (sonner) | socket `/notifications` | typed by `NotificationType`; **progress types silent**; error/warn/success shown |
| Inbox | `NotificationInbox` (bell panel) | `Notification/History`,`/UnreadCount`,`/:Id/Read`,`/ReadAll` | unread badge; mark read/all; pagination; empty |
| Quota | banner/toast | socket `QUOTA_WARNING/EXCEEDED` | 80 / 90 / 100%; upgrade hint |

## Resilience
All jobs survive a socket drop via **polling reconciliation**; a socket‑hostile environment runs polling‑only with the
same correctness. Cancel endpoints are explicit. See [realtime-socket](../02-architecture/realtime-socket.md).
