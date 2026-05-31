# Phase 6 — Advanced

> **Status:** ⏳ not started · **Depends on:** [Phase 3](./phase-3-storage-core.md) (+ [4](./phase-4-preview-share.md) for gating).
> **Feature spec:** [advanced](../../04-features/advanced.md) · **Architecture:** [realtime-socket](../../02-architecture/realtime-socket.md)
> · **API:** [cloud-archive](../../05-api/modules/cloud-archive.md) · [notifications](../../05-api/modules/notifications.md)

## Objective
The advanced storage features that ride on **async jobs + realtime**: duplicate scan, archive (zip/extract), AV scan
status gating, and the notification inbox — all using **socket‑first + polling‑fallback** for live progress.

## Scope
**In:** duplicate scan (start/status/result/cancel) with group UI + resolve; archive create + extract (+ preview,
selective extract) with job progress; AV status gating on download/preview; notification inbox (history/unread/read/
read‑all) + toasts + quota warnings (80/90/100%).
**Out:** team notifications nuances (Phase 8); webhook/developer surfaces (post‑MVP).

## Task breakdown

### 6.1 — Job transport plumbing → see [realtime-socket](../../02-architecture/realtime-socket.md)
- [ ] Job stores fed by socket events with a **low‑frequency polling fallback** that reconciles missed events.
- [ ] Shared job‑progress UI (tray/toast) pattern for archive + duplicate.

### 6.2 — Duplicate scan
- [ ] Start/status/result/cancel (`Cloud/Scan/Duplicate/*`); progress (socket‑first + poll).
- [ ] Group UI: exact (SHA‑256) vs perceptual (dHash) + similarity + potential savings; resolve via delete.

### 6.3 — Archive (zip / extract)
- [ ] Create (zip) from bulk selection (`Archive/Create/Start`/`Cancel`); output appears in the folder.
- [ ] Extract (`Archive/Extract/Start`/`Cancel`, `/Preview`): preview entries, **selective extract**, conflict on
      output, cancel.
- [ ] Job progress via socket events (`ARCHIVE_*`) + poll.

### 6.4 — AV scan status
- [ ] Badge on items + preview/download gate (`Cloud/Scan/Status`): pending (gated/warn), infected (block/warn), clean.

### 6.5 — Notifications inbox & quota
- [ ] `NotificationInbox` (`Notification/History`, `/UnreadCount`, `/:Id/Read`, `/ReadAll`): unread badge, mark
      read/all, pagination, empty state.
- [ ] Toast fan‑out by `NotificationType` (progress types stay silent); quota warnings → banner/toast (80/90/100%).

## Endpoints used
`Cloud/Scan/Duplicate/Start`/`Status`/`Result`/`Cancel`; `Cloud/Archive/Create/*`, `/Extract/*`, `/Preview`;
`Cloud/Scan/Status`; `Notification/History`, `/UnreadCount`, `/:Id/Read`, `/ReadAll` + `/notifications` socket.
Contracts: [cloud-core](../../05-api/modules/cloud-core.md) (scan), [cloud-archive](../../05-api/modules/cloud-archive.md),
[notifications](../../05-api/modules/notifications.md).

## Acceptance‑test checklist
- [ ] Duplicate scan runs with live progress; groups render with similarity + savings; cancel works; resolve deletes.
- [ ] Archive create produces a file with live progress; cancel works.
- [ ] Archive extract previews entries; selective extract works; output conflicts are handled.
- [ ] **Killing the socket mid‑job** still completes via polling reconciliation.
- [ ] AV pending gates/ warns; infected blocks/warns on download; clean is unobstructed.
- [ ] Inbox lists history with unread badge; mark read / read‑all work; toasts fire per type; quota warnings show at
      80/90/100%.

## Acceptance additions (audit HIGH/MEDIUM)

Locked socket lifecycle obligations layered on top of the §6.1 plumbing — see [realtime-socket §4](../../02-architecture/realtime-socket.md) for the canonical spec.

- [ ] **Socket lifecycle locked.** Singleton `io(NEXT_PUBLIC_SOCKET_URL + "/notifications", { auth, autoConnect: false })` in `lib/socket/client.ts`. `NotificationProvider` mounts in `app/providers.tsx` **after** session hydrated; `socket.connect()` only when session valid.
- [ ] **Reconnect with exp backoff + jitter.** `reconnectionDelay: 1000`, `reconnectionDelayMax: 30000`, `randomizationFactor: 0.5`. Storm-pause: 3 disconnects in 10s → 30s pause before resuming.
- [ ] **401 handling.** Server `connect_error` with `data.code === "AUTH_INVALID"` → `socket.disconnect()` + `socket.io.opts.reconnection = false` → trigger `lib/auth/client.ts::handleAuthFailure()` (deduped with REST 401).
- [ ] **Sign-out teardown sequence (order asserted by spy).** `socket.disconnect()` → `queryClient.cancelMutations()` + `cancelQueries()` → `queryClient.clear()` + reset all stores → `signOut({redirect:false})` → `window.location.assign("/auth/login")`. Wrapped in `signOutAndCleanup()` with `signOutInFlight` boolean dedupe.
- [ ] **Reconciliation on reconnect.** Server sends `{ last_event_id, now }` on `connect`; client compares with `notifications.store.lastSeenEventId`; gap → invalidate list queries depending on socket-emitted state (jobs, notifications inbox).
- [ ] **Polling fallback.** If socket fails ≥ 5 times in 60s → `GET /Notifications/Recent` every 30s until socket recovers.
- [ ] **Kill-socket acceptance test.** Given: archive job started via UI. When: at t=2s, DevTools Network → WS → close socket. Then: within 30s, polling fallback fires; job progress continues via poll; job reaches terminal state without UI hang; on socket reconnect, no duplicate progress notifications (deduped by `jobId` + monotonic key).

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| Job lifecycle (cancel / missed events) | Socket‑first **+ polling reconciliation**; explicit cancel endpoints. |
| Socket reconnect correctness | Resubscribe on reconnect; poll covers the gap. |
| Large duplicate groups UI | Virtualize group lists; lazy thumbnails. |

## Rollback / fallback
If sockets are unreliable in an environment, **polling‑only** mode still drives all job UIs (slower updates, same
correctness).

## Exit criteria
Duplicate scan, archive, AV gating, and the notification inbox all work with resilient live progress. Then begin
[Phase 7](./phase-7-public-polish.md).
