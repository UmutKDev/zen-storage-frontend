# API — Notifications

> REST `@Controller({path:'Notification',version:'1'})` → `/Api/v1/Notification/*` + socket gateway. Files:
> `notification.controller.ts`, `notification.gateway.ts`. Back to [API index](../API-INVENTORY.md). Lifecycle:
> [realtime-socket](../../02-architecture/realtime-socket.md).

| Transport | Endpoint / Event | Detail |
|---|---|---|
| REST | GET `/Api/v1/Notification/History` | paginated inbox (`PaginationRequestModel`) |
| REST | GET `/Api/v1/Notification/UnreadCount` | `{ Count }` |
| REST | PATCH `/Api/v1/Notification/:Id/Read` · PATCH `/ReadAll` | mark read |
| Socket | **namespace `/notifications`** | handshake auth `handshake.auth.SessionId` (+cookie/`x-session-id`/Bearer/query); room `user:{userId}` |
| Socket | event `notification` | payload typed by `NotificationType` enum |
| Socket | `ping`/`pong` | heartbeat |

## `NotificationType` (covers)
`UPLOAD_*`, `FILE_*`, `ARCHIVE_*`, `DUPLICATE_SCAN_*`, **`QUOTA_WARNING`/`QUOTA_EXCEEDED` (80/90/100%)**, `TEAM_*`,
`SUBSCRIPTION_*`, `DOCUMENT_*`, `WEBHOOK_*`, `API_*`.

## Client fan‑out
- **Toasts** (sonner) by type — **progress types stay silent**.
- **Inbox** store + `['notifications']` query invalidation.
- **Job stores** (archive/duplicate progress).
- **Quota** banners at 80/90/100%.

See [realtime-socket](../../02-architecture/realtime-socket.md) and [advanced](../../04-features/advanced.md).
