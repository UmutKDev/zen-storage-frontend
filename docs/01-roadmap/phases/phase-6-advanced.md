# Phase 6 — Advanced

> **Status:** ✅ done (closed 2026-06-17) · **Depends on:** [Phase 3](./phase-3-storage-core.md).
> **Feature spec:** [advanced](../../04-features/advanced.md) · **Architecture:** [realtime-socket](../../02-architecture/realtime-socket.md)
> · **API:** [cloud-archive](../../05-api/modules/cloud-archive.md) · [notifications](../../05-api/modules/notifications.md)
>
> **In progress (2026-06-15):** the **notification inbox shipped** (commit 40039d8, [D-P6.1](../../07-decisions/DECISIONS.md))
> — real-data Zen inbox: `Notification/History` (`useInfiniteQuery` + Load-more), `/UnreadCount` unread badge, `/:Id/Read`
> **optimistic mark-read** decrementing the badge, `/ReadAll`, tone-tinted icon tiles, relative time, loading/empty/error
> states. Backend endpoints typed (`NotificationHistoryItemModel`/`UnreadCountResponseModel`) + client regenerated.
>
> **Foundation landed (2026-06-16, [D-P6.2](../../07-decisions/DECISIONS.md)/D-P6.3):** the `/notifications` socket is
> now **live** (`NotificationProvider`) with §6.1 job-transport plumbing (`features/jobs`: idempotent store +
> `reconcileActiveJobs` + `JobIndicator`) and §6.4b (toast fan-out + quota banner). Backend strengthened: `Cloud/Archive/Status`
>
> - transient `DUPLICATE_SCAN_PROGRESS`. The **§6.2 duplicate-scan panel** then landed as the first consumer of the
>   plumbing (2026-06-16, D-P6.4), followed by the **§6.3 archive create/extract UI**.

## Objective

The advanced storage features that ride on **async jobs + realtime**: duplicate scan, archive (zip/extract), and the
notification inbox — all using **socket‑first + polling‑fallback** for live progress.

## Scope

**In:** duplicate scan (start/status/result/cancel) with group UI + resolve; archive create + extract (+ preview,
selective extract) with job progress; notification inbox (history/unread/read/read‑all) + toasts + quota warnings
(80/90/100%).
**Out:** team notifications nuances (Phase 8); webhook/developer surfaces (post‑MVP).

## Task breakdown

### 6.1 — Job transport plumbing → see [realtime-socket](../../02-architecture/realtime-socket.md)

- [x] Job stores fed by socket events with a **low‑frequency polling fallback** that reconciles missed events. _(D-P6.2 — `features/jobs` idempotent `jobs.store` + `reconcileActiveJobs`; `NotificationProvider` owns connect/storm-pause/reconnect-reconcile/poll-fallback; backend `Cloud/Archive/Status` added (D-P6.3) so archive poll is real.)_
- [x] Shared job‑progress UI (tray/toast) pattern for archive + duplicate. _(D-P6.2 — Zen `JobIndicator` tray driven by `useJobsStore`; the §6.2/§6.3 panels only `track()` a job.)_

### 6.2 — Duplicate scan

- [x] Start/status/result/cancel (`Cloud/Scan/Duplicate/*`); progress (socket‑first + poll). _(D-P6.4 — `features/storage/duplicates`: `useDuplicateScan` start→`track` the ScanId in the job store; progress reads from `useJobsStore` + the foundation's poll; cancel.)_
- [x] Group UI: exact (SHA‑256) vs perceptual (dHash) + similarity + potential savings; resolve via delete. _(D-P6.4 — wide-Dialog `DuplicateScanPanel` + virtualized `DuplicateGroupCard`s, default "keep largest / delete the rest", cross-folder `deleteEntries` + whole-scope invalidate + local prune; launched from the toolbar `ScanButton` + ⌘K command.)_

### 6.3 — Archive (zip / extract)

- [x] Create (zip) from bulk selection (`Archive/Create/Start`/`Cancel`); output appears in the folder. _(commit `cc2dc78` — `features/storage/archive`, `BulkActionBar` "Create zip"; backend create secure-scoping parity `62eded3`.)_
- [x] Extract (`Archive/Extract/Start`/`Cancel`, `/Preview`): preview entries, **selective extract**, conflict on
      output, cancel. _(commit `cc2dc78` — `ArchiveExtractDialog` (preview + select + new-folder toggle + conflict strategy); backend extract conflict strategy `62eded3`.)_
- [x] Job progress via socket events (`ARCHIVE_*`) + poll. _(reuses the §6.1 jobs foundation — dialogs close on start, the topbar `JobsMenu` owns progress/cancel.)_

### 6.4 — Notifications inbox & quota

- [x] `NotificationInbox` (`Notification/History`, `/UnreadCount`, `/:Id/Read`, `/ReadAll`): unread badge, mark
      read/all, pagination (Load-more), empty/loading/error states. _(commit 40039d8 — `NotificationPanel`/`NotificationItem`,
      `useNotifications`/`useNotificationActions`/`useUnreadCount`, `notificationMeta`; backend typed + client regenerated;
      [D-P6.1](../../07-decisions/DECISIONS.md).)_
- [x] Toast fan‑out by `NotificationType` (progress types stay silent); quota warnings → banner/toast (80/90/100%). _(D-P6.2 — `notificationFanout.routeNotification`: tone-mapped sonner toasts, transient progress stays silent; `QuotaBanner` reads `ui.store.quotaLevel` (pushed by `QUOTA_WARNING/EXCEEDED`) + `useStorageUsage`.)_

## Endpoints used

`Cloud/Scan/Duplicate/Start`/`Status`/`Result`/`Cancel`; `Cloud/Archive/Create/*`, `/Extract/*`, `/Preview`;
`Notification/History`, `/UnreadCount`, `/:Id/Read`, `/ReadAll` + `/notifications` socket.
Contracts: [cloud-core](../../05-api/modules/cloud-core.md) (duplicate scan), [cloud-archive](../../05-api/modules/cloud-archive.md),
[notifications](../../05-api/modules/notifications.md).

## Acceptance‑test checklist

- [x] Duplicate scan runs with live progress; groups render with similarity + savings; cancel works; resolve deletes. _(D-P6.4 — built + unit-tested (`tests/storage/duplicate-resolve`); live-backend walkthrough pending creds like the rest.)_
- [x] Archive create produces a file with live progress; cancel works. _(commit `cc2dc78`; backend `62eded3` — unit-tested, live-backend walkthrough pending creds.)_
- [x] Archive extract previews entries; selective extract works; output conflicts are handled. _(commit `cc2dc78`; backend extract conflict strategy `62eded3` + `cloud.archive.service.spec`.)_
- [x] **Killing the socket mid‑job** still completes via polling reconciliation. _(poll-reconciliation unit-tested — `tests/jobs/job-progress-poller` (polls while a job runs, stops once settled) + `tests/jobs/reconcile`; the literal close-the-WS-in-DevTools walkthrough is deferred — pending creds.)_
- [x] Inbox lists history with unread badge; mark read / read‑all work; toasts fire per type; quota warnings show at
      80/90/100%. _(inbox mark-read/read-all/badge — `tests/account/notifications`; per-type toasts — `tests/notifications/fanout`; quota 80/100% thresholds — `tests/storage/quota-banner`; live quota walkthrough deferred — pending creds.)_

## Acceptance additions (audit HIGH/MEDIUM)

Locked socket lifecycle obligations layered on top of the §6.1 plumbing — see [realtime-socket §4](../../02-architecture/realtime-socket.md) for the canonical spec.

- [x] **Socket lifecycle locked.** Singleton `getSocket(sessionId)` → `io(base + "/notifications", { auth: { SessionId }, autoConnect: false })` in `lib/socket/client.ts` (PascalCase handshake — D-P6.2). `NotificationProvider` mounts in `app/providers.tsx` **after** session hydrated; `socket.connect()` only when session valid.
- [x] **Reconnect with exp backoff + jitter.** `reconnectionDelay: 1000`, `reconnectionDelayMax: 30000`, `randomizationFactor: 0.5`. Storm-pause: 3 disconnects in 10s → 30s pause before resuming. _(tested: `tests/notifications/provider-lifecycle`)_
- [x] **401 handling.** Server `connect_error` with `data.code === "AUTH_INVALID"` → `socket.disconnect()` + `socket.io.opts.reconnection = false` → `handleAuthFailure()` (module-boolean deduped with the REST 401 via the `registerSignOut` seam). _(tested)_
- [x] **Sign-out teardown sequence (order asserted by spy).** `socket.disconnect()` (reconnect killed) → `cancelQueries()` → `clear()` → reset all stores (incl. `useJobsStore.reset()`) → `signOut({redirect:false})` → `window.location.assign("/login")`. _(`signOutAndCleanup`; no v5 `cancelMutations`; order spy-tested in `tests/smoke/signout`.)_
- [x] **Reconciliation on reconnect.** _Amended (D-P6.2):_ backend sends no `last_event_id` frame → reconciliation is **invalidation-based** — every re-connect invalidates inbox/unread/usage + `reconcileActiveJobs`. _(tested: reconcile only on the 2nd connect)_
- [x] **Polling fallback.** _Amended (D-P6.2):_ no `/Notifications/Recent` → 5 connect failures in 60s starts a 30s interval that re-invalidates the inbox + re-polls active jobs via `Cloud/Scan/Duplicate/Status` + `Cloud/Archive/Status`.
- [x] **Kill-socket acceptance test.** Transport behavior **unit-tested** (`tests/jobs/{jobs-store,reconcile,job-progress-poller}` — poll drives a job to terminal; replayed/late progress is deduped via the terminal-frozen, monotonic store). The §6.3 archive panel that `track()`s a job has landed; the literal end-to-end (start a real job, close the WS in DevTools) remains a deferred live-verify — pending creds.

## Risks & mitigations

| Risk                                   | Mitigation                                                            |
| -------------------------------------- | --------------------------------------------------------------------- |
| Job lifecycle (cancel / missed events) | Socket‑first **+ polling reconciliation**; explicit cancel endpoints. |
| Socket reconnect correctness           | Resubscribe on reconnect; poll covers the gap.                        |
| Large duplicate groups UI              | Virtualize group lists; lazy thumbnails.                              |

## Rollback / fallback

If sockets are unreliable in an environment, **polling‑only** mode still drives all job UIs (slower updates, same
correctness).

## Exit criteria

✅ **Met (closed 2026-06-17).** Duplicate scan, archive, and the notification inbox + quota all work with resilient
live progress (poll-reconciled, unit-tested). The only carried-forward item is the **live-backend E2E acceptance
walkthrough** (kill a real socket mid-job; drive live quota to 80/90/100%; live duplicate/archive runs) — deferred
pending login creds, tracked into [Phase 7](./phase-7-public-polish.md). **Next: Phase 7.**
