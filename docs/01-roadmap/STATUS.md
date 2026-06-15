# STATUS — progress tracker

> Lightweight, **always‑current** tracker. The source of truth for phase *detail* is each
> [`phases/phase-N-*.md`](./phases/) file; this is the one‑screen "where are we" view.
>
> Legend: ⏳ not started · 🚧 in progress · ✅ done · 🚫 blocked.

**Updated:** 2026-06-16 · **Branch:** `v2` · **Round:** **Phase 6 in progress — realtime/job-transport foundation landed (socket now live: `NotificationProvider` + `features/jobs` + toasts/quota; backend strengthened, D-P6.2/D-P6.3). Notifications inbox + Phases 4/5 complete.**

## Where we are
**Phase 6 has started — the notifications inbox landed (real-data Zen).** The count-only bell stub is replaced by a full
inbox panel (`features/notifications`: `NotificationPanel`/`NotificationItem`, `useNotifications`/`useNotificationActions`,
`notificationMeta`, `notifications.keys`): a `useInfiniteQuery` history list + Load-more, **optimistic mark-read** that
decrements the unread badge, mark-all, tone-tinted icon tiles (reusing `FileTone`/`.zs-tile-icon`), native-`Intl` relative
time (`lib/utils/format-relative-time.ts`), a persistent `sr-only` `aria-live` region, and loading/empty/error states. Done
the **proper** way (rule #2 — no hand-rolled DTOs): the backend `Notification/History` + `UnreadCount` were **typed**
(`NotificationHistoryItemModel`/`UnreadCountResponseModel`) and the committed client **regenerated**, so the inbox consumes
generated models. **Decision [D-P6.1](../07-decisions/DECISIONS.md).** Alongside it, two follow-ups shipped: **browse
auto-refresh + secure-folder TTL re-lock** (60s `refetchInterval` + `refetchOnWindowFocus`; `useSecureFolderExpiry`
re-prompts the passphrase when an encrypted token expires in-place and conceals + toasts when a hidden one does —
**[D-P5.8]**) and the **office-iframe Escape fix** (the embedded viewer no longer swallows Escape, so the preview closes on
one press). Green: `tsc`+`lint`+`build` + **~296 Vitest** + `size-limit` **~804.51/820 KB** (no new deps); reviewers clean.
**Phase 4 + Phase 5 are complete.**

**Realtime/job-transport foundation landed (2026-06-16, D-P6.2/D-P6.3).** The `/notifications` socket is now **live** — a
real `getSocket(sessionId)` singleton + `NotificationProvider` (mounted after the session) owning connect / storm-pause /
reconnect-reconciliation / polling-fallback, an event **fan-out** (toasts — tone-mapped, progress silent — / inbox refresh /
job store / quota), the §6.1 job-transport plumbing (new `features/jobs`: an **idempotent** `jobs.store` keyed by JobId/ScanId +
`reconcileActiveJobs` poll + a shared Zen `JobIndicator` tray), and §6.5b (the `QuotaBanner` at 80/90/100%). The **backend was
strengthened** so the resilience promise is real (rule D-S8): a new `Cloud/Archive/Status` poll endpoint + transient
`DUPLICATE_SCAN_PROGRESS` socket events (progress = socket-only/never-persisted; terminal = persisted), then the client was
regenerated (clean: 151 insertions, 0 deletions). Green: backend `build`; frontend `tsc` + `lint` + **319 Vitest** (66 files;
+6 suites incl. idempotent-store / fan-out / provider-lifecycle / reconcile / auth-dedupe). **Next: the job-starting surfaces**
— §6.2 duplicate-scan panel, §6.3 archive create/extract UI, §6.4 AV-status gating — plus the deferred Phase 3/4/5 live-backend
walkthroughs (pending creds).

## Earlier — Phase 5 (secure folders)
**Phase 5 is complete — secure folders.** A new leaf feature `features/secure-folders/` owns a **`sessionStorage`-scoped,
TTL-pruned** session-token lifecycle (CLAUDE rule #5, amended by **[D-P5.7]**) consumed one-way by storage. **Stage A (token
spine):** the 2-namespace zustand token store (`isAncestor`/`resolveToken` ancestor lookup; persists to `sessionStorage`
**only** — so an unlock/reveal survives a page refresh in the same tab; the passphrase is never stored, no
`localStorage`/cookie/cross-tab; ESLint still hard-bans `localStorage`/cookie on the file), the real
`registerSecureFolderTokenSource` getter, the `/Cloud/*` interceptor that extracts the target path from the query **+ the
JSON-stringified body** and injects `X-Folder-Session`/`X-Hidden-Session`, and clear-all on **sign-out** (tab close handled
natively by `sessionStorage` — the `pagehide`/`visibilitychange` handler was removed, D-P5.7). **Stage B (encrypted):**
create-encrypted (NewFolderDialog toggle + passphrase), convert/decrypt + unlock/lock (passphrase via the `xFolderPassphrase`
header; the `SecureFolderDialogs` controller + `PassphraseDialog`); a locked-row click → unlock + navigate in; a `403`
listing → in-place `FolderLocked`; the resolved token folds into the storage query keys so unlock/lock refetch. **Stage C
(hidden):** hide/unhide + **`⇧⇧` (double-tap-Shift) reveal** (+ an accessible ⌘K command) + conceal; the hidden token is keyed
by the **reveal-request path** (so the parent listing surfaces hidden children); conceal is A4-atomic (network-fail leaves the
folder revealed). Reviewers clean (data-layer / a11y-state / design-system / casl-on-the-backend-fix / silent-failure-hunter —
the last prompted a `genericMessage` so a non-403 unlock/reveal failure isn't a silent dead dialog). **Decisions:**
[D-P5.1–D-P5.8](../07-decisions/DECISIONS.md).

## Earlier — Phase 4 (Preview + Share)
**Phase 4 Stage C2 landed — Phase 4 is complete.** Editor files now get a **document version history** panel in the
preview footer (sibling of the Stage-B object-version panel): lazy-fetched on expand, each row shows a **backend-computed
diff** vs the current content (`DiffView` renders the server's unified-diff hunks — colored add/remove/context lines +
stats — **no diff library**), and — when the editor holds the lock — **restore**/delete behind a confirm. A **restore**
replaces the current content and **reloads the open editor in place** (reusing the editor's 409-reload path via a new
`editor.store` reload signal, so the edit lock is kept); the panel reads the editor's `canEdit` from the store to hide
restore/delete on a read-only (locked-by-other / lock-lost) doc while keeping diffs viewable. **Backend gap fixed first:**
`GET Cloud/Documents/Versions` was untyped (`void`) in the generated client — it lacked the `@ApiSuccessResponse`
decorator its siblings have; mirrored the object endpoint in `nestjs-storage` (reusing `CloudVersionListResponseModel`)
and regenerated the committed client (only `listVersions`'s return type changed). Green: `tsc`+`lint`+`build` +
**193 Vitest** (+8) + `size-limit` **790.8 / 820 KB** (no new deps); reviewer sweep clean (casl/data-layer/design-system;
a11y added a `role="status"` diff live region + a diff-error Retry). **Decision:** [D-P4.8](../07-decisions/DECISIONS.md).
**Next: Phase 5 (secure folders) — Phase 4 live walkthrough against the backend pending creds.**

## Earlier — Phase 4 Stage C1 (CodeMirror document editor)
**Phase 4 Stage C1 landed**: text/code files (`EDITOR_EXT`) open in a **CodeMirror 6 editor** with the full
collaborative-safety lifecycle. The editor is **lazy-loaded** (`next/dynamic`, +11 MIT packages in a ~233 KB chunk —
zero initial-load cost). On open it `readContent` (with draft) + `acquireLock` (5-min TTL; `423` → read-only "Locked by
{name}" banner); a ~3-min **heartbeat** (`extendLock`) keeps the lock (loss → "lock expired" read-only). Edits **auto-save
a draft** (throttled ≤1/10s); explicit **Save/⌘S commits** via `updateContent` with `ExpectedContentHash` — a **409**
shows a "changed elsewhere — Reload" banner and keeps the text as a draft. An **unsaved-changes guard** (a feature-local
`editor.store` the modal consults) prompts Save/Discard/Cancel on close; the **lock releases** on close/unmount;
`pagehide`/`visibilitychange` flush a best-effort draft (never `beforeunload`). Syntax highlighting via a curated lang set
(js/ts/json/md/html/css/python/yaml → plain). Green: `tsc`+`lint`+`build`+`size-limit` + **185 Vitest** (+11); reviewer
sweep clean (a11y added a `role="status"` live region + a distinct lock-expired copy). **Decisions:**
[D-P4.5](../07-decisions/DECISIONS.md) (CodeMirror set + lazy chunk + lifecycle; size gate 480→820 KB).

## Earlier — Phase 4 Stage B (office + object versions)
**Phase 4 Stage B landed**: the preview modal handles **office files** + **object version history**.
**Office** (docx/xlsx/pptx) renders via the **Microsoft Office Online viewer** — a sandboxed `<iframe>` to
`view.officeapps.live.com` (CSP `frame-src` gained it, [D-P4.3](../07-decisions/DECISIONS.md)), `src` = a fresh presigned
URL; **zero new deps, no XSS surface**, with a download-to-view fallback + an in-viewer disclosure (office content egresses
to Microsoft — [privacy §9b](../06-cross-cutting/privacy-compliance.md)). **Object version history** is a collapsible modal
footer (`VersionHistoryPanel`, lazy on expand): list `Cloud/Versions`, restore + delete (each behind a confirm; latest
can't be deleted); `invalidateScope` refetches object+versions+folder+usage ([D-P4.4](../07-decisions/DECISIONS.md)).

## Earlier — Phase 4 Stage A (preview core + share)
**Phase 4 Stage A landed** (first of 3 stages — [D-P4.0](../07-decisions/DECISIONS.md)): files now **open in a deep-linkable
preview modal**. A new `features/preview` feature mounts into the existing `@modal/(.)preview/[key]` interceptor (with a
non-intercepted `preview/[key]` route backing refresh / shared links; `[key]` is percent-encoded). Viewers: **image** (CDN-scaled
via `getImageCdnUrl` from `Metadata.Width/Height`, SVG/ICO unscaled), **video** + **audio** (native players, unsupported-codec
fallback), **PDF** (sandboxed `<iframe>` streaming the signed CDN URL — CSP `frame-src` gained the CDN, [D-P4.1](../07-decisions/DECISIONS.md)),
and a graceful **download-to-view** `UnsupportedViewer` for everything else. The toolbar (download/share/delete/fullscreen/close)
**reuses storage's `useDelete`/`useDownload` + confirm dialog**; **share** mints a `Cloud/PresignedUrl` → Web Share API or
clipboard + a TTL note; an **`AvGate`** blocks infected files (body+download+share) and warns (`role=status`) while a scan is
pending (polls `Cloud/Scan/Status`). **←/→ arrow nav** walks the previewable files of the current view (the browser publishes the
ordered key list to a storage-owned store the preview reads — keeping the two features acyclic, [D-P4.2](../07-decisions/DECISIONS.md));
**a plain click on a file now opens preview** (selection moved fully to the checkbox / modifier-click). Behind the `preview` flag
(default on). Green: `tsc` + `lint` + `build` (both preview routes split; `[[...path]]` unaffected) + **166 Vitest**; reviewer
sweep applied (data-layer clean; design-system + a11y each 1 finding, fixed). **Deferred:** scaled-vs-original *download* (view is
scaled, original download works), office preview (Stage B), the document editor + version history (Stage B/C). **Next: Phase 4
Stage B (office + object version history), then Stage C (document editor + doc versions/diff) — or Phase 5.**

## Earlier — Phase 3 Stage D (closed Phase 3)
**Phase 3 Stage D closed Phase 3 (Storage Core ✅).** Storage is fully searchable, filterable, and command-driven. **Search**
(`Cloud/Search`, scope toggle current↔global default current, shareable `?q=&scope=` URL, debounced, `SearchEmpty`/`FilteredEmpty`
states) + **type/extension filter** (client-side over the loaded window, persisted in `viewPrefs`) feed the same
`ListView`/`GridView` via a shared `arrangeEntries`. The **⌘K command palette** rides a neutral `lib/command-palette` registry
(inverted deps — shell contributes navigation, storage contributes actions/selection/search; the locked ⌘K↔selection contract opens
the bulk dialog over the surface's resolved `selectedEntries`), backed by a real **central shortcut dispatcher**
(`lib/shortcuts/useShortcutDispatcher` — one keydown handler, text-input/overlay guarded; ⌘U migrated off its self-listener) and a
`?` **help overlay**. **Touch**: a coarse-pointer long-press opens a bottom `Sheet` (Move / Add files / Delete) — the accessible
alternative to the desktop MouseSensor DnD, which is untouched. The **server-only seam** is ESLint-policed (`@/lib/auth/server`
banned from client globs, un-banned for route handlers + `lib/auth`).

## Earlier — Zen design treatment
**The "Zen" premium design treatment landed across every built surface** (a cross‑cutting refinement on top of
Phases 0–3C, not a new phase). The flat shadcn wrappers gained the refined look the design docs always specified —
realized as cva variants + a disciplined `.zs-*` machined CSS layer in `app/globals.css` (semantic tokens only;
reduced‑motion + reduced‑transparency honored). Highlights: gradient/`upload` buttons + the micro‑glass third tier
(primitives); gradient `Logo`, tinted active nav, machined inert workspace chip, ⌘K search affordance, rich glass
menus (shell); tinted type tiles + corner status chips + contained file‑list panel + pill breadcrumbs +
`SmartGrid`/`FileTile` (browse); the hero Upload **dropzone dialog** over the existing engine + sectioned
create/unlock dialogs (`SectionedDialog`). The Zen bundle is vendored at
[`docs/03-design-system/zen-reference`](../03-design-system/zen-reference/ABOUT.md); contracts updated in
[primitives §5](../03-design-system/components/primitives.md) + [patterns §4](../03-design-system/components/patterns.md).
**Data layer untouched** (data‑layer‑reviewer: no findings); green on `tsc` + `lint` + `build`. Deferred to their
phases: command palette (⌘K trigger only), secure‑folder reveal (`UnlockDialog` presentational), media thumbnails
(`FileTile` unfed), archive/extract, teams. Next product task is still **Phase 3 Stage D**.

## Earlier — Phase 3 Stage C
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
- [x] **User approval received; Phase 0 begun (2026-06-06). Phases 0–5 complete; Phase 6 in progress.**

## Phase status
| Phase | Title | Status | Notes |
|---|---|---|---|
| 0 | Foundation + Design System | ✅ | All sub-tasks closed: data layer, design system, 0.0a CSP/headers, 0.4a privacy, 0.8a intercepting-routes (confirmed), 0.14a supply-chain CI |
| 1 | Auth | ✅ | Full: multi-step login (+2FA **+passkey**), register, reset, route protection, sign-out teardown, **legal pages + consent banner**. Verified live vs API + 16 tests |
| 2 | App Shell + Account | ✅ | Full: shell (sidebar/topbar/theme/profile/bell, inert workspace slot) + profile (optimistic, avatar read-only) + security (password, 2FA, passkeys, sessions) + read-only subscription + flagged API-keys stub. 32 vitest + 4 e2e; reviewers applied; live contract smoke |
| 3 | Storage Core | ✅ | **Staged in 4 parts, all done.** A (browse) ✅ · B1 (single-item ops) ✅ · B2 (multi-select + bulk + DnD) ✅ · C (upload pipeline) ✅ · D (search + filter + ⌘K palette + central shortcut dispatcher + help overlay + touch bottom-sheet + server-seam ESLint) ✅ 2026-06-14 |
| 4 | Preview + Share | ✅ | Full: preview modal (image/video/PDF/audio/office) + share (presigned URL) + CDN resize + CodeMirror editor + object & document versions/diff/restore; Zen lightbox redesign + office-Escape fix. Done 2026-06-14/15 (D-P4.0–D-P4.9) |
| 5 | Secure Folders | ✅ | Full: token spine + encrypted + hidden (unlock/reveal/hide/conceal, ⇧⇧) + auto-refresh/TTL re-lock; session token `sessionStorage`-scoped (D-P5.7 amends the never-persist guarantee). Done 2026-06-14/15 (D-P5.1–D-P5.8) |
| 6 | Advanced | 🚧 | **In progress** — notifications inbox (D-P6.1) + **realtime/job-transport foundation** (D-P6.2/D-P6.3: socket live, `features/jobs` plumbing, toasts/quota, backend `Cloud/Archive/Status` + dup-scan progress) done. Still pending: duplicate-scan panel, archive create/extract UI, AV gating |
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
1. **Finish Phase 6 (Advanced):** the foundation is done (inbox §6.5; live socket + §6.1 job transport + §6.5b toasts/quota,
   D-P6.2/D-P6.3). Remaining = the **job-starting surfaces** that drive the now-built plumbing: §6.2 duplicate-scan panel
   (poll-progress group UI + resolve-by-delete), §6.3 archive create/extract UI (+ preview + selective extract + conflict),
   and §6.4 AV-status gating. See [Phase 6](./phases/phase-6-advanced.md).
2. **Deferred live-backend walkthroughs (need login creds):** the Phase 3 upload matrix (small + large multipart w/
   progress, pause/resume, cancel→server Abort, kill-tab-at-50%→resume without re-sending part 1, forced 409
   REPLACE/KEEP_BOTH/SKIP + apply-to-all, quota/max-size pre-flight, folder drop/picker, zero-byte) + the B1/B2 ops matrix;
   the Phase 4 viewers/share/AV/editor round-trip; the Phase 5 unlock/reveal/conceal + bfcache/cross-tab + TTL re-lock.

## Recent status entries
- **2026-06-16 (Phase 6 — realtime / job-transport foundation, D-P6.2/D-P6.3)** — Made the `/notifications` socket
  **actually connect** (it was REST-only until now) and laid the §6.1 plumbing + §6.5b. **Frontend:** real
  `getSocket(sessionId)` singleton + typed `notification` envelope (`lib/socket`); `NotificationProvider` (mounted after
  the session in `app/providers.tsx`) owning connect / **storm-pause** (3 disconnects/10s → 30s) / **invalidation-based
  reconnect reconcile** / **polling fallback**; an event **fan-out** (`notificationFanout`) → toasts (tone-mapped,
  **progress silent**), inbox refresh + optimistic unread bump, job store, quota; a new leaf feature **`features/jobs`**
  (idempotent `jobs.store` keyed by JobId/ScanId — percentage-up-only / phase-by-rank / terminal-frozen = the kill-socket
  dedup guarantee; `reconcileActiveJobs` poll; shared Zen **`JobIndicator`** tray); a **`QuotaBanner`** (80/90/100%); a
  deduped **`handleAuthFailure`** funneling REST-401 + socket-`AUTH_INVALID` into one sign-out; `useJobsStore.reset()` in
  the teardown; optional `NEXT_PUBLIC_SOCKET_URL`. **Backend (`nestjs-storage`, D-P6.3):** new `GET Cloud/Archive/Status`
  (BullMQ job state → progress) + transient `DUPLICATE_SCAN_PROGRESS` emits + `NotificationService.EmitTransientToUser`
  (socket-only, no history — so progress doesn't spam the inbox); client **regenerated** (clean: 151 insertions, 0
  deletions). **Deviations from the "locked" `realtime-socket §4`** (backend reality): PascalCase `SessionId` handshake;
  invalidation-based reconcile (no `last_event_id` frame); poll fallback reuses History + per-job Status (no
  `/Notifications/Recent`). Green: backend `build`; frontend `tsc` + `lint` + **319 Vitest** (+6 suites). **D-P6.2 /
  D-P6.3.** Out of scope (next): §6.2/§6.3/§6.4 panels.
- **2026-06-15 (Phase 6 — real-data notifications inbox)** — Opens Phase 6. The count-only bell stub becomes a real-data
  **Zen inbox**: backend `Notification/History` + `UnreadCount` were **typed** (`NotificationHistoryItemModel`,
  `UnreadCountResponseModel`) and the committed client **regenerated** (rule #2 — no hand-rolled DTOs; the D-P4.8 idiom). New
  `features/notifications`: `NotificationPanel`/`NotificationItem`, `useNotifications` (`useInfiniteQuery` + Load-more) /
  `useNotificationActions` (**optimistic mark-read** decrementing the unread badge + mark-all, invalidate on settle),
  `notificationMeta` tone map (`NotificationType` → tone-tinted `.zs-tile-icon`), `notifications.keys`;
  `lib/utils/format-relative-time.ts` (native `Intl`); `account.shell.notifications.*` i18n. Persistent `sr-only`
  `aria-live` region + loading/empty/error states. Green: tsc/lint/build + **~296 vitest** + size-limit ~804.51/820 KB.
  **D-P6.1.** Remaining Phase 6: toast fan-out + quota warnings, jobs socket/poll transport, archive/extract,
  duplicate-scan, AV gating. (commit 40039d8)
- **2026-06-15 (Storage auto-refresh + secure-folder TTL re-lock — D-P5.8)** — Browse listings now refetch on a 60s
  interval (`BROWSE_REFETCH_INTERVAL_MS`) + `refetchOnWindowFocus`, so out-of-band changes (a new upload, a moved folder)
  surface without a manual reload. New `features/secure-folders/hooks/useSecureFolderExpiry.ts` watches the TTL of the token
  covering the current folder: an expired **encrypted** token re-opens the unlock (passphrase) dialog in-place; an expired
  **hidden** token toasts + conceals. Complements **D-P5.7** (the token is `sessionStorage`-persisted but still TTL-bounded).
  Touches `secure-folder-lifecycle.md` §5 + §15 + `resolveTokenEntry` in `secureFolders.store.ts`. (commit 0761af6)
- **2026-06-15 (fix: preview office-iframe Escape)** — The embedded `view.officeapps.live.com` iframe captured keyboard
  focus, so Escape no longer closed the preview (the "press it ~3 times" bug). `OfficeViewer` now releases iframe focus the
  instant the cross-origin embed steals it, restoring Radix's Escape-to-close. Covered by `tests/preview/office-viewer.test.tsx`.
  Phase 4 polish. (commit 880a1dd)
- **2026-06-15 (fix: createFile empty path)** — Handle an empty path in the `createFile` path (`useCreateFile.ts`) so file
  creation at the storage root works. Phase 3 polish. (commit 110fce5)
- **2026-06-14 (Phase 5 — Secure Folders → Phase 5 ✅)** — Closed Phase 5. Encrypted + hidden folders: create-encrypted,
  convert/decrypt, unlock/lock (passphrase via `X-Folder-Passphrase`), hide/unhide + `⇧⇧` double-Shift reveal + conceal;
  token spine (`registerSecureFolderTokenSource` + the `/Cloud/*` interceptor injecting `X-Folder-Session`/`X-Hidden-Session`,
  ancestor lookup). Reviewers clean (data-layer/a11y/design/casl/silent-failure). **D-P5.1–D-P5.6** (token-persistence
  amendment D-P5.7 + TTL re-lock D-P5.8 followed on 2026-06-15). (commit 9dea78c)
- **2026-06-14 (Zen preview lightbox)** — Rebuilt the file preview as a **Zen lightbox**: a dark `PreviewStage` (zoom + diff
  overlay) + a persistent `PreviewDetailsRail` (tabbed metadata + versions); `VersionHistoryPanel` → `VersionHistoryRail`
  and `DocumentVersionsPanel` → `DocumentVersionsRail` (moved out of the collapsible/editor footer into the rail). Design
  refinement, no contract change. Green: tsc/lint/build. (commit 9e6040e)
- **2026-06-14 (fix: catch-all route decode)** — Decode catch-all route segments so folders with spaces in their names load
  (`[[...path]]`). Phase 3 polish. (commit abaad85)
- **2026-06-14 (Phase 4 — Preview + Share → Phase 4 ✅)** — Closed Phase 4. Deep-linkable preview modal
  (image/video/audio/PDF/office via the Office Online iframe), share via `Cloud/PresignedUrl` + `AvGate` scan gate, CDN
  image resize, ←/→ nav; CodeMirror 6 document editor (lazy chunk, lock/heartbeat/draft/409-reload lifecycle); object &
  document version history + backend-computed diff (`DiffView`, no diff lib) + restore/delete. Backend gap fixed: `GET
  Cloud/Documents/Versions` was `void` → added `@ApiSuccessResponse` + regenerated client. size-limit gate 480→820 KB for
  the lazy editor chunk. **D-P4.0–D-P4.8.** (commit c0f6484)
- **2026-06-14 (Phase 3 Stage D — search + filter + ⌘K palette + touch + server-seam → Phase 3 ✅)** — Closed Phase 3.
  **Search:** `getSearch` on `cloudApiFactory.search` (envelope-unwrapped), `storageKeys.search` (ownerId + scope + path
  + query + extension), `useSearch` (≥2-char `enabled` gate, AbortSignal, keepPrevious), `CommandSearch` (URL `?q=&scope=`
  source of truth via debounced derive-on-render + scope toggle), search-mode switch + `SearchEmpty`/`FilteredEmpty`.
  **Filter:** `filterEntries`/`arrangeEntries` (categories from `lib/utils/file-meta` `extensionCategory`), `viewPrefs`
  `filterType`/`filterExt` (v2), `FilterMenu` (mirrors `SortMenu`). **Palette + shortcuts:** neutral
  `lib/command-palette` registry (`useCommand`/`useCommands` via `useSyncExternalStore`) — shell contributes nav, storage
  contributes actions/selection/search via `useStorageCommands`; feature-local `storageUi` store lifts the bulk/create/
  **sheet** triggers out of component state so the palette can fire them while `BulkActionBar` runs the bulk path over
  `selectedEntries` (the **locked ⌘K↔selection contract**, test-covered); `features/shell/CommandPalette` (`shouldFilter`
  off + manual filter); real central `useShortcutDispatcher` (one keydown, text-input/overlay guard, generic
  `mod+<letter>`) + `ShortcutProvider` (⌘K/?/⌘\) + `ShortcutsHelp`; ⌘U migrated off its self-listener. **Touch:**
  `useCoarsePointer` + `useLongPress` (touch-only, `consumeSuppressedClick`) → bottom `Sheet` `EntryActionsSheet`
  (Move/Add files/Delete) on `BrowseRow`/`BrowseCard`; desktop MouseSensor DnD untouched. **Seam:** `eslint.config.mjs`
  bans `@/lib/auth/server` from client globs (un-banned for `app/**/route.ts` + `lib/auth/**`), verified by
  `tests/lint/server-seam.test.ts` (ESLint Node API). Mounted provider + palette + help in `(app)/layout`;
  `renderWithProviders` now supplies router/pathname/searchParams contexts (also fixed 3 stale post-Zen test assertions).
  Green: `tsc`/`lint`/`build` + **148 vitest** (+12). Reviewer sweep applied: design NIT (`rounded-[5px]`→`rounded-sm`);
  a11y — `SheetDescription` added, search live region gated on `!isFetching`, loading skeleton labeled. Phase 3 ✅.
- **2026-06-14 (Zen alignment — sidebar + usage)** — Closed the remaining gaps vs the Zen app‑chrome reference.
  **Storage‑usage now lives in the sidebar only** (per the design — chat6 "kullanım bilgisi artık yalnızca
  sidebar'da"): new bottom‑pinned `SidebarUsageCard` (solid card, gradient fill, collapses to a `{pct}%` chip),
  injected via a new `AppShell` `sidebarFooter` slot composed at the app layer (`SidebarUsageCard` reads `collapsed`
  from the shell store via the barrel — one clean `storage → shell` UI dependency, no boundary break); the old
  `UsageBar` in `StorageBrowser` was removed/deleted. **Sidebar chrome** matched: collapse toggle moved into the
  header row beside the `Logo` (`PanelLeftClose`/`Open`), an `aria-hidden` "Workspace" section label above the nav,
  and `MobileSidebar` now uses `<Logo>`. **Browse tints** made translucent to match the prototype (`accent/60` hover,
  `accent/90` selected + highlight rim on rows/cards). New `.zs-usage-*` CSS (semantic tokens). Reviewer sweep clean
  (design‑system + data‑layer: no findings; a11y: 1 NIT — usage card hides on query error, same as the old `UsageBar`,
  acceptable for secondary chrome). Green: `tsc` + `lint` + `build` (18 routes).
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
- **Login creds** for the deferred live-backend walkthroughs (Phases 3/4/5 — non‑blocking; code is unit-verified).
- **API team** on the backend‑gated org features (Q10 favorites, Q11 recents, Q12 tags, Q13 insights) + Q2 (webhook HMAC)
  + activating the avatar endpoint (Q7) — all **non‑blocking for MVP**. (Q1 sharing + Q5 CDN resize are resolved.)
