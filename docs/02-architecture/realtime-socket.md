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

## 4. Socket lifecycle (locked)

Decisions in this section are **locked** — the implementation matches these specs verbatim; deviations require a
DECISIONS entry first.

### 4.1 Connection

- **Singleton** lives in `lib/socket/client.ts`:
  ```ts
  // lib/socket/client.ts
  import { io, type Socket } from "socket.io-client";

  let socket: Socket | null = null;

  export function getSocket(sessionId: string): Socket {
    if (socket) return socket;
    socket = io(`${base}/notifications`, {
      auth: { SessionId: sessionId },   // PascalCase — the gateway reads handshake.auth.SessionId (D-P6.2)
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket"],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    });
    return socket;
  }
  // base = NEXT_PUBLIC_SOCKET_URL ?? NEXT_PUBLIC_API_URL (sans /Api) — the var is OPTIONAL.
  ```
  > **Implemented (D-P6.2).** The handshake key is **PascalCase `SessionId`** (the lowercase sample originally
  > here was wrong — the gateway authenticates off `handshake.auth.SessionId`, so lowercase silently fails to
  > authenticate). `disconnectSocket()` sets `socket.io.opts.reconnection = false` then nulls the singleton, so the
  > next `getSocket()` rebuilds with a fresh handshake (re-handshake on session/team change).
- **Provider:** `NotificationProvider` in `features/notifications/index.tsx` is mounted in `app/providers.tsx`
  **after** the session has hydrated. It calls `socket.connect()` on mount **iff** the session is valid.
- **`sessionId` source = same as REST `X-Session-Id`:** resolved through `lib/auth/client.ts` from the Auth.js
  session. The socket and the REST `Instance` share one identity; they cannot diverge.

### 4.2 Reconnect — exponential backoff + jitter

| Option | Value |
|---|---|
| `reconnectionDelay` | `1000` ms |
| `reconnectionDelayMax` | `30000` ms |
| `randomizationFactor` | `0.5` |

**Storm avoidance:** if the client observes **3 disconnects within 10 s**, the provider pauses reconnection for
**30 s** before re-arming. This prevents tab swarms from hammering the gateway during regional flaps.

### 4.3 401 from socket (auth invalid)

- Server emits `connect_error` with `data.code === "AUTH_INVALID"`.
- Client handler:
  1. `socket.disconnect()`
  2. `socket.io.opts.reconnection = false` (kill the reconnect loop — the session is dead)
  3. Trigger auth sign-out via `lib/auth/client.ts → handleAuthFailure()`.
- **REST 401 uses the same handler.** The `Instance` 401 interceptor and the socket `connect_error` path both call
  `handleAuthFailure()`, which is **deduped** (one invocation per session id) so a parallel REST+socket failure
  produces a single sign-out, not two.

### 4.4 Sign-out teardown sequence (ORDER MATTERS)

Wrapped in `lib/auth/client.ts → signOutAndCleanup()`. A `signOutInFlight` boolean prevents re-entry while the
sequence runs (UI buttons / interceptors that fire mid-teardown are no-ops).

1. **Cut realtime** — `socket.disconnect()` and `socket.io.opts.reconnection = false`. No new events can land
   mid-teardown.
2. **Cancel in-flight work** — `queryClient.cancelMutations()` then `queryClient.cancelQueries()`. Stops anything
   that could repopulate caches after step 3.
3. **Wipe client state** — in this order:
   - `queryClient.clear()`
   - `workspaceStore.reset()`
   - `uiStore.reset()`
   - `secureFoldersStore.reset()` (drops in-memory secure-folder tokens)
   - `uploadsStore.reset()`
4. **Auth sign-out** — `await signOut({ redirect: false })`. We own the redirect.
5. **Hard navigate** — `window.location.assign("/auth/login")`. Full document reload guarantees no stale module
   state survives.

### 4.5 Reconciliation (missed events)

> **Implemented reality (D-P6.2).** The backend sends **no hello / `last_event_id` frame** (only `ping`/`pong`), and
> there is **no `GET /Notifications/Recent`**. Reconciliation is therefore **invalidation-based**, not gap-detection;
> the original last-event-id design below is retained only as the aspirational contract.

- On every successful **re**connect (not the first connect), the client invalidates the queries that depend on
  socket-emitted state — notifications inbox (`notificationKeys.list/unreadCount`), storage usage (quota), and the
  active jobs (`reconcileActiveJobs`, which re-polls each running job's Status). There is no `lastSeenEventId` /
  `notifications.store`.
- **Polling fallback:** if the socket fails to connect **5+ times within 60 s**, a **30 s** interval runs the same
  reconciliation (invalidate inbox + re-poll active jobs via their Status endpoints) until the next successful
  connect, then drops polling. The per-job Status endpoints are `Cloud/Scan/Duplicate/Status` (scans) and the new
  `Cloud/Archive/Status` (archives — added in D-P6.3); there is no `/Notifications/Recent`.
- _Aspirational (not implemented):_ a server hello frame with `last_event_id` + a `now` timestamp, compared against a
  client `lastSeenEventId`, would let the client detect a precise gap instead of invalidating broadly. Adopt it if/when
  the gateway emits it.

### 4.6 `NotificationProvider` mount order

Locked provider stack in `app/providers.tsx` (outer → inner):

```
ThemeProvider
  └─ QueryClientProvider
      └─ SessionProvider
          └─ WorkspaceProvider
              └─ MotionProvider
                  └─ NotificationProvider
                      └─ {children}
                      └─ <Toaster />
```

**Phase 0 task 0.8** acceptance asserts this order via a render snapshot — re-ordering providers fails CI.

### 4.7 Phase 6 acceptance: kill-socket test

| Step | Expectation |
|---|---|
| **Given** | An archive job has been started and is emitting progress events. |
| **When** | At `t = 2 s` the tester closes the WS in DevTools. |
| **Then** | Within **30 s** the polling fallback fires `GET /Notifications/Recent`. |
| **And** | Progress continues via poll; the job reaches its terminal state without hanging. |
| **And** | On socket reconnect, **no duplicate progress** is rendered — events are deduped by `jobId` + monotonic key (phase/percentage). |

## 5. Job transport — **socket‑first + polling fallback** (decided)

Long‑running jobs (archive create/extract, duplicate scan) are **not** TanStack Query resources. They are:

```
start job (REST)  → JobId
   subscribe to socket progress events for JobId   (primary)
   + low-frequency …/Status poll                   (fallback, reconciles missed events)
   → COMPLETE/FAILED event (or terminal poll)       → settle job store + invalidate affected lists
```

This guarantees correctness even if the socket drops or misses an event. In a socket‑hostile environment the app can run
**polling‑only** with the same correctness (slower updates). See [DECISIONS](../07-decisions/DECISIONS.md) D‑A3.

> **Implemented (D-P6.2 / D-P6.3).** The `…/Status` poll is real for both job families: `Cloud/Scan/Duplicate/Status`
> (scans — which is also the *only* progress source, since the backend emits no `DUPLICATE_SCAN_PROGRESS`… until
> D-P6.3 added throttled progress events) and the **new `Cloud/Archive/Status`** (archives — added in D-P6.3 so the
> archive kill-socket path can truly reconcile via poll, not just on the terminal listing refresh). Progress events are
> emitted **transiently** (socket only, never written to notification history) so they don't spam the inbox; terminal
> events (`*_COMPLETE/_FAILED/_CANCELLED`) are persisted. The §6.1 foundation (job store + `reconcileActiveJobs` +
> `JobIndicator`) consumes these; the duplicate-scan / archive *panels* that `track()` jobs land in §6.2/§6.3.

## 6. Heartbeat
`ping`/`pong` keep‑alive; if pongs stop, treat as a drop and reconnect.

## 7. Edge cases
- **Duplicate events:** make job‑store updates idempotent (keyed by JobId + phase/percentage monotonicity).
- **Reconnect storms:** backoff cap; don't thrash on flapping networks.
- **Auth/team switch mid‑job:** re‑handshake; the polling fallback covers the gap.
