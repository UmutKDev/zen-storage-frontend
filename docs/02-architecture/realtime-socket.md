# Realtime / Socket Lifecycle

> One socket.io connection drives notifications, quota warnings, and long‑job progress.
> API: [notifications](../05-api/modules/notifications.md) · used heavily by [Phase 6](../01-roadmap/phases/phase-6-advanced.md).

## 1. Connection

- One socket to namespace **`/notifications`**.
- Handshake auth: `{ SessionId }` (also accepts cookie / `x-session-id` / Bearer / query); `withCredentials`, websocket
  transport.
- The backend joins the client to room `user:{userId}`.
- **Reconnect with backoff** (cap ~30s).

## 2. Lifecycle (tied to auth + team)

```
authenticated session present ──► connect
auth change / team change      ──► disconnect → reconnect (new handshake)
sign-out                       ──► teardown (no reconnect)
network drop                   ──► auto-reconnect with backoff → resubscribe
```

A `NotificationProvider` (wired in Phase 0, fan‑out completed in later phases) owns the socket and exposes events to the
app.

## 3. Fan‑out (what listens)

The provider routes each `notification` event (typed by `NotificationType`) to:

| Target | What it does | Phase |
|---|---|---|
| **sonner toasts** | success/warning/error toasts by type; **progress types stay silent** | 6 (toasts), 0 (plumbing) |
| **notification inbox** | append + invalidate `['notifications']` queries; unread badge | 6 |
| **job stores** | archive/duplicate progress → drive tray/indicator UIs | 6 |
| **quota** | `QUOTA_WARNING` / `QUOTA_EXCEEDED` at 80/90/100% → banner/toast + upgrade hint | 6 |

`NotificationType` covers: `UPLOAD_*`, `FILE_*`, `ARCHIVE_*`, `DUPLICATE_SCAN_*`, `QUOTA_WARNING/EXCEEDED`, `TEAM_*`,
`SUBSCRIPTION_*`, `DOCUMENT_*`, `WEBHOOK_*`, `API_*`.

## 4. Job transport — **socket‑first + polling fallback** (decided)

Long‑running jobs (archive create/extract, duplicate scan) are **not** TanStack Query resources. They are:

```
start job (REST)  → JobId
   subscribe to socket progress events for JobId   (primary)
   + low-frequency …/Status poll                   (fallback, reconciles missed events)
   → COMPLETE/FAILED event (or terminal poll)       → settle job store + invalidate affected lists
```

This guarantees correctness even if the socket drops or misses an event. In a socket‑hostile environment the app can run
**polling‑only** with the same correctness (slower updates). See [DECISIONS](../07-decisions/DECISIONS.md) D‑A3.

## 5. Heartbeat
`ping`/`pong` keep‑alive; if pongs stop, treat as a drop and reconnect.

## 6. Edge cases
- **Duplicate events:** make job‑store updates idempotent (keyed by JobId + phase/percentage monotonicity).
- **Reconnect storms:** backoff cap; don't thrash on flapping networks.
- **Auth/team switch mid‑job:** re‑handshake; the polling fallback covers the gap.
