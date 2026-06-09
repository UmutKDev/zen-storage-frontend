# Phase 3 — Storage Core (Personal)

> **Status:** 🚧 in progress — **Stage A (browse) ✅** + **Stage B1 (single-item operations) ✅ 2026-06-07** +
> **Stage B2 (multi-select + bulk + DnD) ✅ 2026-06-10**; C (upload), D (search + palette + touch) pending.
> **Staged in ~4 parts** (decided D-P3.1; B split B1→B2). · **Depends on:** [Phase 2](./phase-2-shell-account.md) · **Blocks:** Phases 4–6.
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

### 3.3 — Upload pipeline (heaviest task) → see [upload-pipeline](../../02-architecture/upload-pipeline.md)
- [ ] Persistent **upload queue/tray** (zustand): per‑file state + progress, concurrency limit, pause/cancel/retry.
- [ ] Flow: `CreateMultipartUpload` (pre‑flight size/quota) → `GetMultipartPartUrls` (batch presign) → PUT parts to S3
      (or `UploadPart` proxy) → `CompleteMultipartUpload` (`Idempotency-Key`) / `Abort` on cancel.
- [ ] **Two distinct drops:** file‑drop onto the storage area = upload; item‑drop onto a folder = move (dnd‑kit).
- [ ] **Folder upload** (recurse: create dirs + upload files).
- [ ] **Quota / max‑size pre‑flight:** block with a clear message + upgrade hint (no silent failure).

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

### 3.7 — Search / filter / sort → see [storage-search-filter](../../04-features/storage-search-filter.md)
- [ ] Filter + sort (by type/size/date/name; persists per session).
- [ ] Search with **scope toggle** (global vs current folder, **default current**) via `Cloud/Search` (Path +
      Extension); no‑results state.

### 3.8 — Command palette (added scope)
- [ ] **Command palette** (Cmd/Ctrl‑K) over the shortcut foundation from Phase 0: navigate + actions + fuzzy
      current‑folder search (+ "search everywhere"). See [keyboard-shortcuts](../../06-cross-cutting/keyboard-shortcuts.md).

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

- [ ] **Upload concurrency caps locked.** 4 chunks/file, 3 files concurrent, 60MB total in-flight. Values live in
      `lib/upload/config.ts` and are the single source of truth — no per-call overrides. See
      [upload-pipeline §4](../../02-architecture/upload-pipeline.md).
- [ ] **IndexedDB refresh resumability.** Mid-upload refresh → on reload `ListParts` reconciles → resume from the last
      good part. Manual test: kill the tab at 50% on a multipart file; reopen the app; the upload completes without
      restarting from part 1.
- [ ] **AbortMultipartUpload server cleanup.** User cancel mid-upload triggers `POST /Cloud/Upload/Abort/{uploadId}`;
      retried up to 3× with backoff if the network fails. No orphaned multipart uploads on S3.
- [ ] **ETag persist + lost-ETag recovery.** Each part PUT's `ETag` is persisted to IndexedDB as it completes. A missing
      `ETag` at `Complete` time triggers `ListParts` recovery to repopulate before `CompleteMultipartUpload` runs.
- [ ] **Presigned PUT error mapping.** Behavior matches
      [upload-pipeline §6.5](../../02-architecture/upload-pipeline.md):
      - `403` → re-presign and retry the part.
      - `404` → drop the queue entry (upload is gone server-side).
      - `5xx` → exponential backoff.
      - timeout → exponential backoff.
      UX messaging mirrors the table in §6.5 verbatim.
- [ ] **Zero-byte + MIME inference.** Empty file (`size === 0`) uses a single PUT — no `CreateMultipartUpload`. MIME
      derives in order: `File.type` → extension lookup → `application/octet-stream`.

### Conflict scope

- [x] **Conflict apply-to-batch scope.** (B2) "Apply to all" radius = **one user action** (one drag-drop or one bulk
      move). Implemented structurally: each user action is ONE batch call; its 409 is resolved by ONE strategy choice;
      the next action starts fresh (nothing is remembered). No cross-action memory by construction. (D-P3.9)

### Large-list performance

- [x] **TanStack Virtual locked.** (Stage A) File lists with more than 100 entries are virtualized through
      `components/patterns/virtual-list.tsx`. Below 100, rendering is direct. The threshold is a constant in the
      pattern, not a per-call prop (`VIRTUALIZE_THRESHOLD = 100`).

### Mobile / touch

- [ ] **Touch DnD alternative.** Long-press on a row (mobile) opens a bottom sheet with **Move to / Add files /
      Delete**. Desktop DnD is unchanged; the sheet is the touch-only path.

### Command palette ↔ selection contract

- [ ] **⌘K reads `selectionStore.selectedKeys`.** Bulk actions exposed in the palette (e.g., "Delete selected", "Move
      selected") operate on whatever the selection store currently holds. Acceptance: select 5+ files, open ⌘K, run
      "Delete selected" → all 5 are deleted via the bulk path.

### OwnerId & query-key scope

- [x] **OwnerId derivation.** (Stage A) `workspaceStore.ownerId` is set **once** at session-ready in `SessionSync`
      from `session.user.id` (= `profile.Id`; teams swap it in Phase 8). Every storage `queryKey` reads it via
      `useOwnerId()` and guards with `enabled: Boolean(ownerId)`; sign-out resets it. See
      [team-readiness](../../02-architecture/team-readiness.md).

### Server-only seam enforcement

- [ ] **Server-only seam ESLint.** `lib/auth/server.ts` cannot be imported from any file with `"use client"` at the
      top. ESLint (`no-restricted-imports` + `boundaries`) blocks the import at lint time with a clear error pointing
      at the seam.

| Cap | Value | Source |
|---|---|---|
| Chunks per file (parallel) | 4 | `lib/upload/config.ts` |
| Files concurrent (parallel) | 3 | `lib/upload/config.ts` |
| Total in-flight bytes | 60 MB | `lib/upload/config.ts` |
| Virtual-list threshold | 100 entries | `components/patterns/virtual-list.tsx` |
| Abort retries | 3 (backoff) | `features/storage/upload/abort.ts` |
