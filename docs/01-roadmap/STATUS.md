# STATUS — progress tracker

> Lightweight, **always‑current** tracker. The source of truth for phase *detail* is each
> [`phases/phase-N-*.md`](./phases/) file; this is the one‑screen "where are we" view.
>
> Legend: ⏳ not started · 🚧 in progress · ✅ done · 🚫 blocked.

**Updated:** 2026-06-11 · **Branch:** `v2` · **Round:** Phase 3 in progress — Stages A + B1 + B2 + C (upload pipeline) landed; only D (search + palette + touch) remains.

## Where we are
**Phase 3 Stage C (upload pipeline — the heaviest task) landed.** `features/storage/upload` ships the full multipart
pipeline on the **`UploadPart` proxy** (D-P3.2 — 100% factory calls, no presigned PUTs): a singleton queue **engine**
(3 files / 4 parts-per-file / 60 MB in-flight + 8 MiB parts from `lib/upload/config.ts`; per-part base64 MD5 via
spark-md5; backoff retries honoring `Retry-After`; pause=drain / cancel=server-Abort / retry; resolved-Key invariant),
**IndexedDB refresh-resume** (degraded per D-P3.3: immediately-persisted `partETags` = resume state, owner-scoped,
7-day TTL, persisted Complete idempotency key reused), **conflict gate** (Create 409 → shared ConflictPrompt; SKIP is
client-local — backend rejects it; apply-to-all checkbox remembers the strategy for one batch), **quota/max-size
pre-flight** (+ mid-batch quota halt), zero-byte = one empty part, **UploadTray** (progress rows, per-status actions,
aria-live), native **FileDropZone** (structurally unambiguous vs dnd-kit move), **folder upload** (webkitGetAsEntry +
desktop-only webkitdirectory picker; dir-create 409 = merge), header Upload menu, sign-out teardown. The Instance
gained a `suppressErrorToast` config flag (tray owns error display; no per-part toast storms). Green on
`build`/`tsc`/`lint` + **128 Vitest**. **Next:** Stage D (search/filter/sort + ⌘K palette + touch bottom-sheet) closes
Phase 3.

## Earlier rounds

**Phase 2 landed.** The authenticated **shell** (`features/shell`: glass-chrome sidebar/topbar, responsive Sheet drawer,
theme toggle, profile menu, notification bell + unread count, inert workspace slot) wraps every `(app)` screen, plus the
full **Account** area (`features/account`: profile view/edit with optimistic + rollback, read-only avatar behind the
`avatarUpload` flag, a tabbed Security screen — change-password, 2FA enable/disable + one-time backup codes, passkey
register/list/delete, sessions current-vs-others + revoke/others/all, read-only subscription, flagged API-keys stub) and
a minimal `features/notifications` (bell + unread count). 9 new shadcn primitives wrapped. Green on
`build`/`tsc`/`lint` + **32 Vitest** + **4 Playwright**; reviewer sweep (data-layer + design-system + a11y/state) applied;
live backend contract smoke passed. Authenticated end-to-end walkthrough pending user creds.

**Phase 0 + 1 (done earlier).** Runnable team-ready skeleton + design system; full session-based auth (multi-step login
+2FA +passkey, register, reset, route protection, legal pages + consent banner).

## Planning round checklist — ✅ complete
- [x] Explored 3 layers (API `nestjs-storage`, old frontend `main`, v2 scaffold) — read‑only
- [x] Verified contract (controllers, envelope, headers, secure‑folder tokens, gateway, **Share absent**)
- [x] Authored core planning docs (roadmap, architecture, feature map, API inventory, decisions)
- [x] Locked 4 decisions (Share, conflict, job transport, auth)
- [x] **Restructured** docs into category hierarchy; expanded every area to maximum detail
- [ ] **Awaiting user approval to begin Phase 0**

## Phase status
| Phase | Title | Status | Notes |
|---|---|---|---|
| 0 | Foundation + Design System | ✅ | All sub-tasks closed: data layer, design system, 0.0a CSP/headers, 0.4a privacy, 0.8a intercepting-routes (confirmed), 0.14a supply-chain CI |
| 1 | Auth | ✅ | Full: multi-step login (+2FA **+passkey**), register, reset, route protection, sign-out teardown, **legal pages + consent banner**. Verified live vs API + 16 tests |
| 2 | App Shell + Account | ✅ | Full: shell (sidebar/topbar/theme/profile/bell, inert workspace slot) + profile (optimistic, avatar read-only) + security (password, 2FA, passkeys, sessions) + read-only subscription + flagged API-keys stub. 32 vitest + 4 e2e; reviewers applied; live contract smoke |
| 3 | Storage Core | 🚧 | **Staged in 4 parts.** A (browse) ✅ · B1 (single-item ops) ✅ · B2 (multi-select + bulk + DnD) ✅ · C (upload pipeline: `UploadPart` proxy, IndexedDB resume, conflict gate, quota pre-flight, tray + drop zone + folder upload) ✅. Only D (search+palette+touch) pending |
| 4 | Preview + Share | ⏳ | Share = presigned URL ✓; CDN resize via wsrv.nl ✓ (both resolved) |
| 5 | Secure Folders | ⏳ | token never‑persist guarantee |
| 6 | Advanced | ⏳ | socket‑first + poll for jobs |
| 7 | Public & Polish | ⏳ | **MVP completes here** (+ onboarding, observability finish) |
| 8 | Teams (post‑MVP) | ⏳ | architect‑for now, build last |
| 9 | Organization & Discovery (post‑MVP) | ⏳ | **backend‑gated**: favorites/recents/tags/global‑insights/real‑share |

## Current scaffold state (v2)
- **Installed:** `next@16.2.6`, `react@19.2.4`, `react-dom@19.2.4`; dev: `@openapitools/openapi-generator-cli`,
  `shadcn@4`, `tailwindcss@4`, `eslint`, `typescript`.
- **Present:** `openapitools.json` (generator `typescript-axios` 7.17.0 → `service/generates`, `modelPackage:"dto"`,
  `useSingleRequestParameter`, `withInterfaces`), `service/factories.ts` (11 factories wired on `./Instance`),
  `service/generates/` (committed), Tailwind v4 `globals.css` (only `--background`/`--foreground` so far),
  `tsconfig.json` path alias `@/*`.
- **Note:** `service/factories.ts` imports `./Instance` (i.e. `service/Instance.ts`) which **does not exist yet** —
  Phase 0 creates it. Location locked at `service/Instance.ts` (factory import wins; see
  [folder structure](../02-architecture/folder-structure.md) + [decisions](../07-decisions/DECISIONS.md)).
- **Missing (Phase 0 builds):** all feature deps (TanStack Query, Zustand, Auth.js, socket.io‑client, framer‑motion,
  dnd‑kit, rhf+zod, sonner, react‑virtual, CodeMirror, qrcode.react, @simplewebauthn/browser, lucide), the `Instance`,
  shadcn init (`components.json`), motion/i18n/theme libs, providers, route groups.

## What's next
1. **User check:** authenticated end-to-end walkthrough against the live backend (needs login creds) — upload: small +
   large multipart file w/ progress, pause/resume, cancel (verify server Abort), kill-tab-at-50% → reopen → resume
   without re-sending part 1, forced 409 (REPLACE/KEEP_BOTH/SKIP + apply-to-all on a folder drop), quota/max-size
   pre-flight block, folder drop + folder picker, zero-byte file; plus the B1/B2 items (selection matrix, bulk ops w/
   partial 409, DnD move, bulk download).
2. **Phase 3 Stage D — search/filter/sort + ⌘K command palette + touch bottom-sheet** closes Phase 3. See the
   [Phase 3 checklist](./phases/phase-3-storage-core.md).

## Recent status entries
- **2026-06-11 (Phase 3 Stage C — upload pipeline)** — Full multipart upload on the **`UploadPart` proxy** (100%
  factory; presign path + ESLint carve-out intentionally unused). `features/storage/upload`: engine singleton
  (worker-pool parts, 3/4/60MB+8MiB caps from `lib/upload/config.ts`, spark-md5 `content-md5`, 1s/2s/4s backoff
  honoring `Retry-After`, pause=drain/cancel=abort/retry, resolved-Key invariant, quota-batch halt via message regex —
  backend has no typed quota code), IndexedDB persistence (immediate ETag writes, owner-scoped restore, 7-day TTL,
  persisted+reused Complete idempotency key; **degraded resume** per D-P3.3 — no ListParts; `NoSuchUpload` = generic
  500 so Abort is fire-once w/ 3-attempt budget), conflict gate (SKIP client-local — backend 400s it; apply-to-all =
  per-batch remembered strategy; `ConflictPrompt` grew the checkbox slot), zero-byte = one empty part,
  `UploadTray`/`FileDropZone`/`UploadMenu` (+ folder traversal, dir-409=merge), `(app)/layout` tray mount, sign-out
  teardown. Instance: `suppressErrorToast` flag. `MIME_MISMATCH` confirmed absent in backend (docs stale); stale
  ListParts/presign acceptance rows amended in the phase file. Green: tsc/lint/build + **128 vitest** (39 new incl.
  engine concurrency/conflict/resume matrices, fake-indexeddb persistence, tray/drop UI). Reviewer sweep applied
  (glass-overlay tray + tokenized Progress; per-file aria-live announcements, focus-stable tray actions, 40px targets;
  persisted-`partSize` resume, 10-min part timeout, `abortPending` persisted pre-delivery); the engine-dimension
  reviewer hit the session limit — its 3 flagged data-layer items were hand-verified + fixed, a fresh engine review is
  queued with Stage D. Decision D-P3.10. Stage D remains.
- **2026-06-10 (Phase 3 Stage B2 — multi-select + bulk + DnD)** — Full selection model (`useItemSelection` +
  in-memory `selection.store`; `selectedKeys` = ⌘K contract; locked dirs excluded; survives view toggle, clears on
  path change), `BulkActionBar` (move/download/delete + aria-live count), `DndMoveLayer` (MouseSensor 8px desktop-only,
  whole-selection drag, folder/breadcrumb drop targets, self/descendant guard in pure `lib/dnd.ts`, post-drag click
  suppression, reduced-motion-gated overlay). Bulk delete/move are **single `Items[]` calls** → one 409 + one strategy
  retry = apply-to-all (batch radius); **partial-batch SKIP retries server-side** (verified vs `cloud.object.service.Move`);
  `ConflictPrompt` shows “N of M” + name sample. Bulk download = sequential presigns, files only. Hooks/dialogs
  generalized to arrays (no `bulk*` duplicates); `Checkbox` primitive added (shadcn). **Latent fix:** `useDelete`
  optimistic update still used the pre-D-P3.7 `InfiniteData` cache shape (would throw live); now plain-array filters.
  Green: `tsc`/`lint`/`build` + **89 vitest** (26 new). Decision D-P3.9. Stage C/D pending.
- **2026-06-07 (fix: cancelled-request toasts)** — Folder entry showed 2–3 **"Something went wrong"** toasts. Root cause
  (found live): the threaded `AbortSignal` makes axios throw `CanceledError` on nav/refetch, and the Instance was toasting
  it. Fix: `service/interceptors/envelope.ts` now **rethrows cancellations silently** (never toasts/signs-out). Global bug
  (any aborted request); unit-tested (`tests/smoke/interceptor-cancel.test.ts`). Verified live: 0 toasts on entry/re-entry.
  Decision D-P3.8. Green: tsc/lint + 63 vitest + build.
- **2026-06-07 (Phase 3 live verification + fixes)** — Drove the running app against the live backend (Playwright + bundled
  Chromium, real login). **Confirmed end-to-end:** per-folder browse, create (renders once), conflict prompt (no silent
  overwrite), rename, delete; then folder-entry after the pagination change. **Fixed (caught only by running it, not the
  mocked unit tests):** (1) browse list calls were missing **`delimiter: true`** → backend listed recursively; (2) the
  paginated list path ignored `Take`, overlapped directory pages (duplicate folders), and **errored on folder entry**
  ("Something went wrong"). Resolution: **dropped Skip/Take entirely** → the backend's single-call non-paginated path
  (full folder in one request, no overlap, no error); browse is now single `useQuery`s. `browse.queries.ts` +
  `useDirectories`/`useObjects`/`useFolderEntries`. Verified live: requests are `…?Path=<folder>&Delimiter=true`, no
  Skip/Take, folder entry clean. Decision D-P3.7. Green: tsc/lint + 61 vitest + build.
- **2026-06-07 (Phase 3 Stage B1 — single-item operations)** — Storage is mutable for single items. New
  `features/storage/operations`: `operations.mutations` (createFolder/createFile/renameFile/renameDirectory/deleteEntries/
  moveEntries/getDownloadUrl on the cloud factories; Move+Delete carry `Idempotency-Key`); `lib`
  (conflict/paths/invalidate/validation); the shared `useConflictMutation` (first attempt FAIL → 409 → `ConflictPrompt`
  → retry with REPLACE/KEEP_BOTH, SKIP cancels) + per-op hooks; components `ConflictPrompt`, `NameDialog`,
  `DeleteConfirmDialog` (AlertDialog), `MoveDialog` (folder-picker reusing `useDirectories`), `EntryActionsMenu`,
  `CreateMenu`. Delete is optimistic (remove + reconcile); create/rename invalidate the folder; move invalidates the
  owner scope. Wired into `BrowseRow`/`BrowseCard` (actions menu) + `StorageBrowser` header. Conflict body parsed from
  `error.raw.Status.Messages[0]`. Green: build/tsc/lint + **61 vitest**; reviewer sweep applied (DTOs→generated models;
  card-menu glass removed; move-picker error state; `useDirectories(path, enabled)`); live contract smoke (all op
  endpoints present). Decision D-P3.6. Stage B2/C/D pending.
- **2026-06-07 (Phase 3 Stage A — browse foundation)** — Storage is navigable. `features/storage/browse`:
  `browse.queries` (`listDirectories`/`listObjects`/`userStorageUsage`, `itemsOf`-normalized, AbortSignal-threaded) +
  user-scoped `storageKeys` + infinite hooks (`useDirectories`/`useObjects`) merged by `useFolderEntries`
  (folders-first sort); `viewPrefs` store (list/grid + sort, sessionStorage); UI — `StorageBrowser`, `ListView`/`GridView`
  (both virtualized via `components/patterns/virtual-list.tsx`, threshold 100; grid chunks rows + `rowRole` keeps card
  `listitem` semantics), `BreadcrumbBar` (URL-derived deep-link), `ViewToggle`, `SortMenu`, `UsageBar` (color + text
  cue), `BrowseRow`/`BrowseCard`/`EntryBadges`, `BrowserStates`. `ownerId` wired in `SessionSync` (`session.user.id`);
  `useOwnerId` + `enabled` gating. Route wired (`[[...path]]/page.tsx` → `StorageScreen`). Fixed `providers` retry to
  skip 4xx (D-P3.5). Green: build/tsc/lint + **48 vitest** + **2 playwright**; reviewer sweep applied; live contract
  smoke (Cloud list/search/usage present, 401 unauth). Decisions D-P3.1–D-P3.5. Stages B/C/D pending.
- **2026-06-07 (Phase 2 — App Shell + Account)** — Authenticated **shell** as a feature (`features/shell`:
  AppShell/Sidebar/MobileSidebar(Sheet)/Topbar/ThemeToggle/ProfileMenu/SidebarNav + inert WorkspaceSwitcher;
  `shell.store` persists `sidebarCollapsed`) mounted in `(app)/layout`. **Account** area extended
  (`features/account`: profile optimistic edit+rollback, read-only avatar behind `avatarUpload` flag, Security tabs —
  change-password, 2FA wizard (lazy `qrcode.react`) + one-time backup codes, passkey register (reuses `startRegistration`)
  /list/delete, sessions current-vs-others + revoke/others/all → `logoutAll` runs `signOutAndCleanup`, read-only
  subscription, flagged API-keys stub). New `features/notifications` (bell + unread count, `void`-typed response cast).
  9 shadcn primitives wrapped (avatar/sheet/tabs/scroll-area/badge/switch/skeleton/table/alert-dialog). User-scoped
  query keys (`accountKeys` fixed `"account"` scope). Added `subscriptionApiFactory` + `notificationApiFactory`; flags
  `avatarUpload`/`apiKeys`; `account.*` i18n. Green: build/tsc/lint + **32 vitest** + **4 playwright**. Reviewer sweep
  applied: data-layer (hand-rolled DTOs → generated models), a11y (error states on Passkeys/Sessions/2FA via shared
  `SectionError`; OtpField aria-label → i18n), design-system (clean + minor focus-visible polish). Live backend contract
  smoke: all endpoints present (avatar upload absent → deferral confirmed; Profile → 401 unauth). Decisions D-P2.1–D-P2.3.
- **2026-06-06 (all deferrals closed)** — Cleared every deferred item. **0.8a** intercepting-routes confirmed live
  (`@modal` + `(.)preview/[key]` + `[[...path]]` coexist; build lists both). **0.14a** supply-chain CI: renovate +
  `supply-chain.yml` (prod audit clean, license allowlist clean — LGPL-3.0 for sharp/libvips + CC-BY-4.0 for
  caniuse-lite ADR'd, private root excluded; SBOM) + `perf-budget.yml` (size-limit 438/480 KB + Lighthouse). **1.2**
  passkey login (Begin/Finish + @simplewebauthn, bypasses 2FA, feature-detect). **1.6** legal pages
  (privacy/terms/cookies/data-processing) + cookie consent banner. Backend error-code→friendly mapping (D-P1.6).
  build/tsc/lint green, 16 vitest. Phase 0 + Phase 1 now ✅. (D-P0.7 closed; D-P0.9-spike, D-P0.10, D-P1.5/1.6.)
- **2026-06-06 (Phase 1 spine)** — **Auth implemented (spine).** Auth.js v5 (split config: edge-safe base + full
  node instance) + `app/api/auth/[...nextauth]` route handler; UI-driven multi-step login (email→password→2FA) +
  register + reset under `features/auth` (rhf+zod, shadcn form/input-otp/alert/card, motion step transitions, 429
  countdown, a11y); `SessionSync` wires the session token-source + sign-out handler; proxy route protection
  (`auth()` wrapper + redirects, composed with security headers); full `signOutAndCleanup` teardown. The P0 dev loop
  is gone (`/api/auth/session` → 200). Verified: build/tsc/lint green, 15 vitest (incl. multi-step login + 2FA handoff
  + teardown-order), browser render of login/register (light+dark) + `/storage`→`/login?from=` redirect. Decisions
  D-P1.0–D-P1.4. Deferred: passkey login (→P2), legal pages + consent banner (follow-up).
- **2026-06-06 (pass 2)** — **Closed P0 security + privacy foundation (0.0a + 0.4a).** Security headers + per-request
  CSP **nonce** emitted from the proxy via `lib/security/*` (Report-Only at P0 — enforcing flips in P7, D-P0.8); HSTS/CSP
  prod-gated. PII **scrubber** (`lib/observability/scrubber.ts`) wired into the reporter; **consent store**
  (`features/account/`, first feature barrel) + `legal.*` i18n; ESLint bans direct `localStorage.setItem`. Verified:
  curl + Playwright header spec (3/3), 12 vitest tests, `build`/`tsc`/`lint` green. Remaining P0: 0.14a CI, 0.8a spike.
- **2026-06-06** — **Phase 0 core implemented.** Deps installed (Next 16.2 / React 19 / next-auth@5 beta / Tailwind v4 /
  framer-motion / shadcn via MCP). Data layer (`Instance` + 5 interceptors + token-sources), full `lib/*`, stores,
  config/types, route groups + providers, design-token `globals.css` (semantic + shadcn bridge + glass + class-dark),
  wrapped shadcn primitives, ESLint boundaries (FULL ERROR, planted violations verified), test scaffold + 3 passing
  smoke tests. `build`/`tsc`/`lint`/`test` all green. Deviations + spike outcome logged in DECISIONS (D-A4 confirmed,
  D-P0.1–D-P0.7). Deferred blocks: 0.0a/0.4a/0.14a/0.8a.
- **2026-05-31** — Folder structure plan locked (Approach A + 4 grafts from B/C). Authoritative spec:
  [`docs/02-architecture/folder-structure.md`](../02-architecture/folder-structure.md). P0 checklist:
  [`docs/01-roadmap/phases/phase-0-foundation.md`](./phases/phase-0-foundation.md). ESLint enforce mode: **full at P0**.

## Blockers / waiting on
- **User approval** of the planning round.
- **API team** on the backend‑gated org features (Q10 favorites, Q11 recents, Q12 tags, Q13 insights) + Q2 (webhook HMAC)
  + activating the avatar endpoint (Q7) — all **non‑blocking for MVP**. (Q1 sharing + Q5 CDN resize are resolved.)
