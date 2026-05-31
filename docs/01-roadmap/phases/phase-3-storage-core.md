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

### 3.8 — Command palette + Quick Access interim (added scope)
- [ ] **Command palette** (Cmd/Ctrl‑K) over the shortcut foundation from Phase 0: navigate + actions + fuzzy
      current‑folder search (+ "search everywhere"). See [keyboard-shortcuts](../../06-cross-cutting/keyboard-shortcuts.md).
- [ ] **Favorites + Recents — client‑side, per‑device interim** behind the `quickAccess` flag; validated via `Cloud/Find`
      so stale entries prune. **No backend API** — clearly labeled "on this device". See
      [quick-access](../../04-features/quick-access.md) + [backend-gaps](../../07-decisions/backend-gaps.md).
- [ ] **Storage insights (current folder, client‑side)**: type breakdown + largest files computed from the listing;
      global scope stays disabled (needs API). See [storage-insights](../../04-features/storage-insights.md).

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
