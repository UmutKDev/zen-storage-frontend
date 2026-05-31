# Phase 3 — Storage Core (Personal)

> **Status:** ⏳ not started · **Depends on:** [Phase 2](./phase-2-shell-account.md) · **Blocks:** Phases 4–6.
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

### 3.1 — Browse & navigate
- [ ] `StorageBrowser` with **list** and **smart grid** views (view toggle persists per session).
- [ ] Breadcrumb (`Cloud/List/Breadcrumb`); folder deep‑linking via `storage/[[...path]]`.
- [ ] **Virtualization** (`@tanstack/react-virtual`) + infinite/paged query using envelope `Skip/Take/Count`.
- [ ] State‑matrix coverage: loading skeleton, empty folder, error, no‑search‑results.

### 3.2 — Usage bar
- [ ] Always‑visible usage bar (`Cloud/User/StorageUsage`): %, near‑limit color, warning/exceeded states.

### 3.3 — Upload pipeline (heaviest task) → see [upload-pipeline](../../02-architecture/upload-pipeline.md)
- [ ] Persistent **upload queue/tray** (zustand): per‑file state + progress, concurrency limit, pause/cancel/retry.
- [ ] Flow: `CreateMultipartUpload` (pre‑flight size/quota) → `GetMultipartPartUrls` (batch presign) → PUT parts to S3
      (or `UploadPart` proxy) → `CompleteMultipartUpload` (`Idempotency-Key`) / `Abort` on cancel.
- [ ] **Two distinct drops:** file‑drop onto the storage area = upload; item‑drop onto a folder = move (dnd‑kit).
- [ ] **Folder upload** (recurse: create dirs + upload files).
- [ ] **Quota / max‑size pre‑flight:** block with a clear message + upgrade hint (no silent failure).

### 3.4 — Create / rename / move / delete
- [ ] Create folder (`Cloud/Directory`; `IsEncrypted` option stubbed for Phase 5); create file (`Cloud/Documents`).
- [ ] Rename: `Cloud/Update` (file) / `Cloud/Directory/Rename` (dir).
- [ ] Move: `Cloud/Move` (`Idempotency-Key`) via dnd + dialog; optimistic + rollback.
- [ ] Delete: `Cloud/Delete` / `DELETE /Cloud/Directory` (`Idempotency-Key`); confirm; **no trash** (leave room).

### 3.5 — Multi‑select & bulk
- [ ] `useItemSelection` (range/toggle/select‑all); bulk action bar.
- [ ] Bulk delete / move / download (loop endpoints); **apply‑to‑all** conflict handling.

### 3.6 — Conflict resolution → see [conflict-resolution](../../02-architecture/conflict-resolution.md)
- [ ] One reusable dialog/hook for `FAIL/REPLACE/SKIP/KEEP_BOTH`; prompt by default; **apply‑to‑all** for bulk;
      remember the choice for the batch.

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

- [ ] **Conflict apply-to-batch scope.** "Apply to all" radius = **one user action** (one drag-drop or one bulk move).
      Starting a new batch resets the dialog's remembered choice. No cross-action memory.

### Large-list performance

- [ ] **TanStack Virtual locked.** File lists with more than 100 entries are virtualized through
      `components/patterns/virtual-list.tsx`. Below 100, rendering is direct. The threshold is a constant in the
      pattern, not a per-call prop.

### Mobile / touch

- [ ] **Touch DnD alternative.** Long-press on a row (mobile) opens a bottom sheet with **Move to / Add files /
      Delete**. Desktop DnD is unchanged; the sheet is the touch-only path.

### Command palette ↔ selection contract

- [ ] **⌘K reads `selectionStore.selectedKeys`.** Bulk actions exposed in the palette (e.g., "Delete selected", "Move
      selected") operate on whatever the selection store currently holds. Acceptance: select 5+ files, open ⌘K, run
      "Delete selected" → all 5 are deleted via the bulk path.

### OwnerId & query-key scope

- [ ] **OwnerId derivation.** `workspaceStore.scope` is computed **once** at session-ready as `user.Id` OR
      `team/{TeamId}`. Every `queryKey` and every `X-Team-Id` header reads from this single source. No ad-hoc
      derivation in features. See [team-readiness](../../02-architecture/team-readiness.md).

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
