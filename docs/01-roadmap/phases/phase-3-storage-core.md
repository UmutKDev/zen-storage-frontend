# Phase 3 — Storage Core (Personal)

> **Status:** ✅ complete — **Stage A (browse) ✅** + **Stage B1 (single-item operations) ✅ 2026-06-07** +
> **Stage B2 (multi-select + bulk + DnD) ✅ 2026-06-10** + **Stage C (upload pipeline) ✅ 2026-06-11** +
> **Stage D (search + filter + ⌘K palette + touch sheet + server-seam) ✅ 2026-06-14**. **Staged in ~4 parts**
> (decided D-P3.1; B split B1→B2).
> · **Depends on:** [Phase 2](./phase-2-shell-account.md) · **Blocks:** Phases 4–6.
> **Feature specs:** [storage-browse](../../04-features/storage-browse.md) · [storage-upload](../../04-features/storage-upload.md)
> · [storage-operations](../../04-features/storage-operations.md) · [storage-search-filter](../../04-features/storage-search-filter.md)
> **Architecture:** [upload-pipeline](../../02-architecture/upload-pipeline.md) · [conflict-resolution](../../02-architecture/conflict-resolution.md)
> · [state-management](../../02-architecture/state-management.md) · **API:** [cloud-core](../../05-api/modules/cloud-core.md)

## Objective
The **storage browser, end to end** for Personal storage: browse (list + smart grid), navigate (breadcrumb +
deep‑linking), see usage, upload (the big lift), create/rename/move/delete (single + bulk + drag‑and‑drop), resolve
conflicts, and search/filter/sort. This is the product's core.

## Scope
**In:** list & smart grid; breadcrumb + folder deep‑linking; virtualization for large folders; usage bar; the full
**upload pipeline**; create folder / create file; rename; delete; move (dnd + dialog); multi‑select + bulk
(delete/move/download); the **conflict‑resolution dialog**; filter + sort; search (global vs current, default current);
quota pre‑flight block.
**Out:** preview/edit (Phase 4); encrypted/hidden folders (Phase 5 — but `IsEncrypted` create option may be stubbed);
duplicate scan / archive (Phase 6); team context UI (Phase 8).

## Task breakdown

### 3.1 — Browse & navigate ✅ (Stage A)
- [x] `StorageBrowser` with **list** and **smart grid** views (view toggle persists per session — `viewPrefs` sessionStorage).
- [x] Breadcrumb (derived client-side from the URL path — `Cloud/List/Breadcrumb` available if canonical names are later
      needed, D-P3.4); folder deep‑linking via `storage/[[...path]]`.
- [x] **Virtualization** (`@tanstack/react-virtual` via `components/patterns/virtual-list.tsx`, threshold 100) +
      infinite/paged query using envelope `Skip/Take/Count` (`listDirectories` + `listObjects`).
- [x] State‑matrix coverage: loading skeleton, empty folder, error+retry. (no‑search‑results lands with search in Stage D.)

### 3.2 — Usage bar ✅ (Stage A)
- [x] Always‑visible usage bar (`Cloud/User/StorageUsage`): %, near‑limit color **+ text cue**, warning/exceeded states.

### 3.3 — Upload pipeline (heaviest task) ✅ (Stage C) → see [upload-pipeline](../../02-architecture/upload-pipeline.md)
- [x] Persistent **upload queue/tray** (`features/storage/upload`: zustand `uploads.store` + engine singleton):
      per‑file state + progress, concurrency caps from `lib/upload/config.ts`, pause (drain)/cancel (server abort)/retry.
- [x] Flow (per **D-P3.2 proxy transport** — presign steps skipped, 100% factory): `CreateMultipartUpload` (pre‑flight
      size/quota; resolved-Key authoritative) → N × `UploadPart` proxy (8 MiB parts, base64 `content-md5`, body ETag)
      → `CompleteMultipartUpload` (persisted, reused `Idempotency-Key`) / `Abort` on cancel.
- [x] **Two distinct drops:** native HTML5 file‑drop (`FileDropZone`, dashed overlay) = upload; dnd-kit MouseSensor
      item‑drop = move — different event systems, structurally unambiguous.
- [x] **Folder upload** (drop traversal via `webkitGetAsEntry` + `webkitdirectory` picker, desktop-only; dirs created
      shallowest-first, existing dir 409 = merge).
- [x] **Quota / max‑size pre‑flight:** client mirror of the backend gates blocks BEFORE upload with message +
      upgrade hint; mid-batch quota 400 halts the batch's remaining files.

### 3.4 — Create / rename / move / delete — single-item ✅ (B1)
- [x] Create folder (`Cloud/Directory`; `IsEncrypted` stubbed for Phase 5); create file (`Cloud/Documents`).
- [x] Rename: `Cloud/Update` (file) / `Cloud/Directory/Rename` (dir).
- [x] Move: `Cloud/Move` (`Idempotency-Key`) via the **MoveDialog folder-picker** (single); dnd → B2. (invalidate-on-success.)
- [x] Delete: single via `Cloud/Delete` `Items[{Key,IsDirectory}]` (handles files + unencrypted dirs; `Idempotency-Key`);
      confirm (AlertDialog); **optimistic** removal + reconcile; **no trash**. Bulk → B2.

### 3.5 — Multi‑select & bulk ✅ (B2)
- [x] `useItemSelection` (plain-click file select, Shift‑range over the folders-first order, Ctrl/Cmd‑toggle,
      checkbox, mod+A select‑all, Esc clear; locked dirs excluded; survives list↔grid; clears on path change);
      `BulkActionBar` (count + aria-live, select-all, clear) + in-memory `selection.store` (`selectedKeys` = ⌘K contract).
- [x] Bulk delete / move / download — delete/move are **single calls** with `Items[]` (not loops; D-P3.9);
      download loops presigns over **files only** (staggered hidden-anchor clicks); **apply‑to‑all** conflict handling.
- [x] **Drag-and-drop move** (`DndMoveLayer`, MouseSensor desktop-only): drag selection or single entry onto
      folder rows/cards or breadcrumb ancestors; self/descendant guarded (`lib/dnd.ts`); post-drag click suppressed.

### 3.6 — Conflict resolution → see [conflict-resolution](../../02-architecture/conflict-resolution.md)
- [x] One reusable prompt/hook (`ConflictPrompt` + `useConflictMutation`) for `REPLACE/KEEP_BOTH/SKIP`; prompt by default,
      no silent overwrite (B1, single). **apply‑to‑all** for bulk batches ✅ B2: one batch call → one 409 with
      `ConflictCount/TotalItems` → one strategy retry covers the batch; partial-batch SKIP retries server-side (D-P3.9).

### 3.7 — Search / filter / sort ✅ (Stage D) → see [storage-search-filter](../../04-features/storage-search-filter.md)
- [x] Filter + sort (sort done in Stage A; **filter** added — by type folder/image/video/audio/doc/text/archive +
      extension, client-side over the loaded window; persists per session in `viewPrefs` sessionStorage).
- [x] Search with **scope toggle** (global vs current folder, **default current**) via `Cloud/Search` (Path +
      Extension); shareable URL (`?q=&scope=`); no‑results state (`SearchEmpty` + broaden/clear) + `FilteredEmpty`.

### 3.8 — Command palette (added scope) ✅ (Stage D)
- [x] **Command palette** (Cmd/Ctrl‑K) over a neutral `lib/command-palette` registry (mirrors `lib/shortcuts`):
      navigate (shell-owned) + actions/selection/search (storage-contributed) + a "search everywhere" query command.
      Central shortcut **dispatcher** built (`lib/shortcuts/useShortcutDispatcher`) + `?` help overlay; ⌘U migrated
      into the registry. See [keyboard-shortcuts](../../06-cross-cutting/keyboard-shortcuts.md).

> **Favorites / Recents / Tags / Storage insights are NOT in MVP** (decided): they require backend APIs first and are
> deferred to **[Phase 9](./phase-9-organization.md)** — no client‑side interim. See
> [backend-gaps](../../07-decisions/backend-gaps.md).

## Endpoints used
`Cloud/List`, `/List/Directories`, `/List/Objects`, `/List/Breadcrumb`, `/Search`, `/User/StorageUsage`, `/Move`,
`/Delete`, `/Update`, `/Find`, `/PresignedUrl` (download); `Cloud/Directory` (create/rename/delete);
`Cloud/Upload/*` (CreateMultipartUpload → GetMultipartPartUrls → UploadPart/S3 → CompleteMultipartUpload / Abort);
`Cloud/Documents` (create). Contracts: [cloud-core](../../05-api/modules/cloud-core.md),
[cloud-upload](../../05-api/modules/cloud-upload.md), [cloud-directory](../../05-api/modules/cloud-directory.md).

## Acceptance‑test checklist
- [ ] Browse in list and grid; breadcrumb + URL deep‑links resolve; large folders scroll smoothly (virtualized).
- [ ] Usage bar reflects real usage and changes color near the limit.
- [ ] Upload: small + large (multipart) files; progress, pause, cancel (aborts), retry; concurrency respected.
- [ ] File‑drop uploads; item‑drop onto a folder moves (no ambiguity).
- [ ] Folder upload recreates the tree and uploads contents.
- [ ] Quota/max‑size exceeded blocks **before** upload with a clear message + upgrade hint.
- [ ] Create folder/file, rename, move (dnd + dialog), delete — single and bulk — all work with optimistic rollback.
- [ ] Conflicts prompt; apply‑to‑all works on bulk; no silent overwrites.
- [ ] Search default = current folder; global toggle works; filter/sort persist; no‑results state shows.

## Stage A verification (2026-06-07)
- **Green:** `tsc`, `lint`, `build`; **48 Vitest** (incl. `entries` sort/merge, `virtual-list` threshold,
  `StorageBrowser` states + view toggle + ownerId-gating); **2 Playwright** (`/storage` + deep path → /login).
- **Built:** `features/storage/browse/*` (queries/keys/hooks, `viewPrefs` store, list+grid views, breadcrumb, view
  toggle, sort menu, usage bar, state components), `components/patterns/virtual-list.tsx`, `useOwnerId`, ownerId wiring
  in `SessionSync`, route wired in `[[...path]]/page.tsx`.
- **Reviewer sweep applied:** data-layer (AbortSignal threaded into the read GETs; retry-on-4xx policy fixed in
  `providers`; `userId`→`ownerIdFromSession`), design-system (clean; `text-[11px]`→`text-xs`), a11y/state (grid cards now
  carry `listitem` role via `virtual-list` `rowRole`; error-before-loading ordering; usage near-limit text cue).
- **Live backend contract smoke** (NestJS @ :8080): `Cloud/List(/Directories|/Objects|/Breadcrumb)`, `Cloud/Search`,
  `Cloud/User/StorageUsage` present; `Cloud/List/Objects` → 401 unauthenticated.
- **Deferred (tracked):** arrow-key roving grid/list navigation + live-region state announcements (a11y polish, later
  stage); no-search-results state (with search, Stage D); directories query-key hidden/folder-token segment (Phase 5);
  authenticated live walkthrough (needs user creds).

## Stage B1 verification (2026-06-07)
- **Green:** `tsc`, `lint`, `build`; **61 Vitest** (+ops: path/conflict helpers, create-folder path, conflict→REPLACE
  retry, rename via `update`, delete `Items[{Key,IsDirectory}]`, download presign, move→root via picker).
- **Built:** `features/storage/operations/*` — `operations.mutations` (create/rename/delete/move/download), `lib`
  (conflict/paths/invalidate/validation), hooks (`useConflictMutation` + per-op), components (`ConflictPrompt`,
  `NameDialog`, `DeleteConfirmDialog`, `MoveDialog` folder-picker, `EntryActionsMenu`, `CreateMenu`). Wired into
  `BrowseRow`/`BrowseCard` (actions menu) + `StorageBrowser` header (CreateMenu).
- **Reviewer sweep applied:** data-layer (`DeleteItem`→`CloudDeleteModel`/`CloudMoveItemModel`; `ConflictStrategy`→
  generated `ConflictResolutionModelStrategyEnum`), design-system (removed hand-rolled glass on the card menu; breadcrumb
  `rounded-sm`), a11y/state (move-picker error+retry state; `useDirectories(path, enabled)` so the closed picker doesn't
  fetch). Deferred/tracked: 403-secure-folder→unlock routing + `directories` key hidden-token slot (Phase 5);
  dialog-from-menu focus-return + delete-toast severity (manual SR/keyboard pass in the live walkthrough).
- **Live backend contract smoke** (NestJS @ :8080): `Cloud/Directory`, `Cloud/Documents`, `Cloud/Update`, `Cloud/Move`,
  `Cloud/Delete`, `Cloud/PresignedUrl` all present. Authenticated create→rename→move→delete + forced conflict + download
  pending user creds (checklist).

## Stage B2 verification (2026-06-10)
- **Green:** `tsc`, `lint`, `build`; **89 Vitest** (+selection: checkbox/replace/toggle/shift-range/select-all-skips-locked/
  Esc/view-toggle-survival/path-clear; +bulk: one-call delete (mixed dirs+files), optimistic bulk removal, one-call move,
  batch-conflict "N of M" → REPLACE retries same items, partial SKIP retries server-side, full-conflict SKIP cancels
  locally, files-only download + dirs-only disabled; +dnd-plan: `resolveDragSet`/`blockedPrefixes`/`canDropOn` matrices).
- **Built:** `operations/stores/selection.store.ts` (in-memory; `selectedKeys` = ⌘K contract) + `useItemSelection`;
  `BulkActionBar`; `DndMoveLayer` (MouseSensor 8px, DragOverlay chip +N badge, reduced-motion-gated drop animation,
  conflict dialog home, post-drag click suppression) + pure `lib/dnd.ts`; `Checkbox` primitive (shadcn, wrapped);
  generalized-to-arrays `useDelete`/`useMove`/`MoveDialog`/`DeleteConfirmDialog` (+`useDownload.downloadMany`);
  batch-aware `ConflictPrompt` ("N of M" + name sample + `*Many` hints) + `useConflictMutation` partial-SKIP semantics;
  rows/cards/breadcrumb wired as drag sources/drop targets; `storage.ops.{selection,bulk,dnd,conflict.*Many}` i18n.
- **Fixed (latent, found while generalizing):** `useDelete`'s optimistic update still used the pre-D-P3.7
  `InfiniteData` cache shape — it would throw on any populated plain-array cache live (mocked tests passed silently);
  rewritten to plain-array filters. (D-P3.9)
- **Reviewer sweep applied:** data-layer (403 pass-through no longer silent — `surfacePassthroughError` toast in the
  op hooks until the Phase 5 unlock prompt; move invalidation narrowed to `storageKeys.all(ownerId)`; failed bulk
  delete keeps the selection), design-system (DragOverlay drop animation composed from motion tokens; `shadow-e2/e3`
  elevation tiers; `ghost-destructive` Button variant instead of inline restyle), a11y/state (bulk-bar focus handed to
  the browse surface before unmount; Esc skips editable targets; checkbox hit target extended to ≥40px via `after:`
  inset; Download uses `aria-disabled` + sr description instead of mouse-only `title`; "Selection cleared" announced
  on the N→0 live-region transition).
- **Deferred/tracked:** keyboard DnD (no KeyboardSensor — MoveDialog is the accessible path; with Stage A a11y
  deferrals); touch long-press bottom sheet (Stage D); ⌘K bulk actions (Stage D, store contract ready);
  `downloadMany` presign loop is not abortable on unmount (short loop, low risk); ConflictPrompt/MoveDialog option
  rows are styled raw `<button>`s — extract a wrapped option-card primitive when a third consumer appears; live
  authenticated walkthrough incl. partial-409 strategies + multi-download prompt (needs user creds).

## Stage C verification (2026-06-11)
- **Green:** `tsc`, `lint`, `build`; **128 Vitest** (+39: plan/mime/traverse pure helpers; engine — happy path,
  zero-byte single-empty-part, multi-part slicing, resolved-Key (KEEP_BOTH rename), transient retry w/ backoff,
  retry-budget exhaustion + user retry, non-transient fail-fast, quota-400 batch halt, conflict gate REPLACE /
  apply-to-all / SKIP-local, cancel→server Abort, pause-drain→resume, file-concurrency cap, IndexedDB restore
  uploads-only-missing-parts with persisted idempotency key; persistence — round-trip/owner-filter/TTL-evict;
  UI — drop-zone highlight+enqueue, non-file drags ignored, tray rows/actions, conflict dialog + apply-to-all).
- **Built:** `features/storage/upload/*` — `core/engine.ts` (singleton: scheduler with 3-file/4-part/60MB gates,
  worker-pool parts, backoff retries honoring `Retry-After`, pause=drain/cancel=abort/retry, batch conflict radius,
  quota-batch halt, degraded refresh-resume, abort delivery budget) + `core/teardown.ts` (sign-out); `storage/`
  (raw-IndexedDB wrapper + owner-scoped persisted queue, TTL evict); `stores/uploads.store.ts` (in-memory tray state);
  `api/upload.mutations.ts` (factory wrappers, `suppressErrorToast`, AbortSignal + progress threading);
  `lib/{plan,md5,mime,traverse}` (+ `lib/upload/config.ts` caps); hooks `useUploadQueue`/`useUploadEngineBoot`/
  `useFileDrop`; UI `UploadTray` (progress rows, pause/resume/retry/cancel/dismiss, aria-live count, conflict gate
  w/ apply-to-all), `FileDropZone` (native HTML5, depth-counter highlight), `UploadMenu` (file + desktop-only folder
  pickers). Instance: `suppressErrorToast` config flag (envelope). `Progress` + spark-md5 (MIT) + fake-indexeddb (dev).
  Tray mounted in `(app)/layout`; teardown wired into `signOutAndCleanup`.
- **Reviewer sweep applied** (multi-dimension + adversarial verify): design-system (tray pane → the mandated
  `glass-overlay` tier incl. reduced-transparency fallback; Progress indicator tokenized — `transition-transform
  duration-200 ease-standard` via a new `--ease-standard` @theme token), a11y/state (per-file status transitions now
  announced — polite region for done/paused + explicit "All uploads complete." on the active→0 transition, assertive
  `role="alert"` for error/blocked since the central toast is suppressed; pause/resume/retry merged into ONE
  persistent action button so focus survives status flips; dismiss hands focus to the tray header / browse surface;
  tray buttons 32px + hit-slop = 40px effective targets), data-layer (engine slices on the PERSISTED `partSize` —
  resume survives config changes; `uploadPart` gets a 10-min timeout override — the Instance's 30s default would kill
  slow-link parts; `abortPending` persisted BEFORE abort delivery so a tab death mid-cancel doesn't resume a canceled
  upload on next load). **Gap:** the dedicated engine-concurrency reviewer + 3 finding-verifications hit the session
  limit; the three data-layer findings were verified manually against the code (all real, all fixed) and an inline
  self-audit covered budget-leak/pause-race/abort-sibling paths — a fresh engine review is queued for the Stage D round.
- **Deferred/tracked:** live multipart walkthrough vs the real backend (needs user creds — kill-tab resume, real 409,
  quota gate, Chrome/Safari folder drop); touch "Add files" bottom-sheet entry (Stage D); `ListParts` backend gap
  (D-P3.3) + `NoSuchUpload`→404 mapping gap; upload socket notification dedupe (Phase 6); re-run the engine-dimension
  review (session-limited this round).

## Stage D verification (2026-06-14)
- **Green:** `tsc`, `lint`, `build` (18 routes; `/storage/[[...path]]` dynamic → `useSearchParams` needs no Suspense),
  **148 Vitest** (+12: `filter`/`arrangeEntries` matrices, `command-palette/registry` register/snapshot/subscribe/
  stale-disposer, the **⌘K↔selection contract** end-to-end, `useLongPress` timing/move-cancel/click-suppress/disabled,
  the **server-seam** ESLint rule via the ESLint Node API).
- **Built:** **Search** — `search.queries.ts` (`getSearch` on the factory, envelope-unwrapped), `storageKeys.search`
  (ownerId + scope + path + query + extension), `useSearch` (≥2-char gate, AbortSignal, keepPrevious), `CommandSearch`
  (URL `?q=&scope=` as source of truth, debounced derive-on-render echo, scope toggle), search-mode switch +
  `SearchEmpty`/`FilteredEmpty` in `StorageBrowser`/`BrowserStates`. **Filter** — `filterEntries`/`arrangeEntries`
  (categories from `lib/utils/file-meta` `extensionCategory`), `viewPrefs` `filterType`/`filterExt` (v2), `FilterMenu`
  (mirrors `SortMenu`). **Palette** — neutral `lib/command-palette` registry (`useCommand`/`useCommands` via
  `useSyncExternalStore`), feature-local `storageUi` store (bulk/create/**sheet** triggers; `BulkActionBar`/`CreateMenu`
  lifted onto it), `useStorageCommands` (presence-gated selection commands + query commands), `features/shell/CommandPalette`
  (`shouldFilter`-off + manual filter; static nav). **Shortcuts** — `useShortcutDispatcher` (one keydown, text-input/
  overlay guard, generic `mod+<letter>`), `ShortcutProvider` (⌘K / ? / ⌘\), `ShortcutsHelp` overlay, ⌘U migrated off its
  self-listener. **Touch** — `useCoarsePointer` (`useSyncExternalStore`), `useLongPress` (touch-only, `consumeSuppressedClick`),
  `EntryActionsSheet` (bottom Sheet) wired into `BrowseRow`/`BrowseCard`. **Seam** — `eslint.config.mjs` ban + un-ban.
  Mounted in `(app)/layout`: `ShortcutProvider` + `CommandPalette` + `ShortcutsHelp`. Test harness: `renderWithProviders`
  now supplies app-router/pathname/searchParams contexts.
- **Reviewer sweep applied** (data-layer + design-system + a11y/state): data-layer clean (envelope unwrap honored,
  ownerId-scoped keys, abort + ≥2-char gate); design-system clean (semantic tokens, wrapped primitives, reduced-motion
  via shared Dialog/Sheet) — fixed the one NIT (`rounded-[5px]`→`rounded-sm`); a11y — added `SheetDescription` to
  `EntryActionsSheet` (HIGH), gated the search result-count live region on `!isFetching` to avoid a stale-count announce
  (MED), labeled the loading skeleton (LOW). **Deferred/tracked:** arrow-key roving list/grid nav + keyboard range-select
  (Stage A/B2 deferral, unchanged); per-file fuzzy results inside the palette (the inline search box + "search
  everywhere" cover in-context search); folder-token in the `search` query key (Phase 5, surface-wide); live
  authenticated walkthrough on a touch device (needs creds/device) — search default-current + global toggle + filter
  persist + no-results + long-press sheet.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| Multipart edge cases (abort/retry/idempotency) | Idempotency keys; explicit `Abort`; resumable queue; tests. |
| dnd file‑drop vs. move disambiguation | Separate drop targets/sensors; clear affordances. |
| Optimistic rollback correctness | Centralized invalidators; snapshot/rollback per mutation. |
| Large‑folder performance | Virtualization + paged/infinite query from day one. |

## Rollback / fallback
If S3 direct PUT is problematic, route parts through the `UploadPart` proxy. If virtualization destabilizes, fall back
to paged loading with a "load more" affordance (still using `Count`).

## Exit criteria
A user can fully manage Personal files — browse/upload/create/rename/move/delete/bulk/search/filter — with conflicts
handled, quotas enforced, and large folders smooth. Then begin [Phase 4](./phase-4-preview-share.md) and/or
[Phase 5](./phase-5-secure-folders.md).

## Acceptance additions (audit HIGH/MEDIUM)

Locked decisions surfaced by the HIGH/MEDIUM audit. These extend §3 acceptance with concrete, testable contracts.

### Upload pipeline hardening

> Rows below were AMENDED at Stage C: D-P3.2 (UploadPart **proxy**, no presigned PUTs) and D-P3.3 (**no `ListParts`**
> endpoint) override the original presigned/ListParts framing. Original intent kept, mechanism corrected (D-P3.10).

- [x] **Upload concurrency caps locked.** 4 chunks/file, 3 files concurrent, 60MB total in-flight (+ 8 MiB part size).
      Values live in `lib/upload/config.ts` and are the single source of truth — no per-call overrides.
- [x] **IndexedDB refresh resumability (degraded — D-P3.3).** Mid-upload refresh → on reload the persisted
      `partETags` record IS the resume state; parts missing from it are re-PUT (S3 is idempotent on
      `(UploadId, PartNumber)`). No `ListParts` reconcile exists; a lost local record re-uploads from part 1.
      Manual test: kill the tab at 50% on a multipart file; reopen; the upload completes without re-sending part 1.
- [x] **AbortMultipartUpload server cleanup.** User cancel aborts in-flight requests then `DELETE
      /Cloud/Upload/AbortMultipartUpload` (3-attempt budget; S3 `NoSuchUpload` surfaces as a generic 500 so any
      outcome is treated terminal — the backend's orphan sweep owns escapes; `abortPending` retried on next load).
- [x] **ETag persist.** Each part's body `ETag` is persisted to IndexedDB immediately on success (not batched).
      Lost-ETag `ListParts` recovery is impossible (D-P3.3) — a part with no recorded ETag is simply re-uploaded.
- [x] **Part error mapping (proxy transport).** Typed `ApiError`s replace raw presign statuses:
      - `SERVER_ERROR` / `NETWORK` / `RATE_LIMITED` (honors `Retry-After`) → backoff **1s/2s/4s × 3**, then file error (retryable).
      - non-transient (4xx) → immediate file error (retryable); tray owns messaging (`suppressErrorToast`).
      - 403/presign-refresh rows are obsolete — there are no presigned URLs to refresh.
- [x] **Zero-byte + MIME inference.** Empty file = `CreateMultipartUpload(TotalSize: 0)` + ONE empty part + Complete
      (no single-PUT path exists server-side; stays 100% factory). MIME derives in order: `File.type` → extension
      lookup (`lib/upload/mime.ts`) → `application/octet-stream`. (The doc's `MIME_MISMATCH` 409 does not exist in
      the backend — no handler shipped; docs flagged stale.)

### Conflict scope

- [x] **Conflict apply-to-batch scope.** (B2) "Apply to all" radius = **one user action** (one drag-drop or one bulk
      move). Implemented structurally: each user action is ONE batch call; its 409 is resolved by ONE strategy choice;
      the next action starts fresh (nothing is remembered). No cross-action memory by construction. (D-P3.9)

### Large-list performance

- [x] **TanStack Virtual locked.** (Stage A) File lists with more than 100 entries are virtualized through
      `components/patterns/virtual-list.tsx`. Below 100, rendering is direct. The threshold is a constant in the
      pattern, not a per-call prop (`VIRTUALIZE_THRESHOLD = 100`).

### Mobile / touch

- [x] **Touch DnD alternative.** (Stage D) Long-press on a row/card (coarse pointer) opens a bottom `Sheet` with
      **Move to / Add files / Delete** (`useLongPress` touch-only + `useCoarsePointer`; reuses MoveDialog /
      DeleteConfirmDialog / upload). Desktop DnD (MouseSensor) is unchanged — the two paths never overlap.

### Command palette ↔ selection contract

- [x] **⌘K reads `selectionStore.selectedKeys`.** (Stage D) The storage surface contributes "Delete selected" /
      "Move selected" to the palette only while a selection exists; running one calls `storageUi.openBulkDialog`, and
      `BulkActionBar` (which owns `selectedEntries`) runs the existing bulk path. Acceptance covered by a test (select
      2+, run the registered command → bulk delete over the resolved entries).

### OwnerId & query-key scope

- [x] **OwnerId derivation.** (Stage A) `workspaceStore.ownerId` is set **once** at session-ready in `SessionSync`
      from `session.user.id` (= `profile.Id`; teams swap it in Phase 8). Every storage `queryKey` reads it via
      `useOwnerId()` and guards with `enabled: Boolean(ownerId)`; sign-out resets it. See
      [team-readiness](../../02-architecture/team-readiness.md).

### Server-only seam enforcement

- [x] **Server-only seam ESLint.** (Stage D) `@/lib/auth/server` is banned by `no-restricted-imports` (path + pattern)
      across the client globs, with a narrow un-ban for `app/**/route.ts` + `lib/auth/**`. Verified by
      `tests/lint/server-seam.test.ts` (ESLint Node API: blocked from a feature/component file, allowed from a route
      handler / the auth lib).

| Cap | Value | Source |
|---|---|---|
| Part size | 8 MiB | `lib/upload/config.ts` |
| Chunks per file (parallel) | 4 | `lib/upload/config.ts` |
| Files concurrent (parallel) | 3 | `lib/upload/config.ts` |
| Total in-flight bytes | 60 MB | `lib/upload/config.ts` |
| Part retry schedule | 1s/2s/4s | `lib/upload/config.ts` |
| Persisted-entry TTL | 7 days | `lib/upload/config.ts` |
| Virtual-list threshold | 100 entries | `components/patterns/virtual-list.tsx` |
| Abort attempts | 3 | `lib/upload/config.ts` (used by `upload/core/engine.ts`) |
