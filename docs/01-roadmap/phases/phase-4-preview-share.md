# Phase 4 — Preview + Share

> **Status:** ✅ complete — **Stage A ✅** (preview core + share), **Stage B ✅** (office + object versions),
> **Stage C1 ✅** (document editor), **Stage C2 ✅** (document versions + diff + restore) · **Depends on:**
> [Phase 3](./phase-3-storage-core.md) · **Sibling:** [Phase 5](./phase-5-secure-folders.md). Staged per
> [D-P4.0](../../07-decisions/DECISIONS.md). Live walkthrough against the backend pending creds.
> **Feature spec:** [preview](../../04-features/preview.md) · **API:** [cloud-core](../../05-api/modules/cloud-core.md) ·
> [documents](../../05-api/modules/documents.md)

## Objective
Open files in a rich **preview modal** (image / video / PDF / text), **edit text** safely (lock + draft + version
restore), browse **version history**, and **share** via presigned URL.

## Scope
**In:** preview modal + toolbar; arrow‑key navigation across previewable items; image CDN scaling + scaled‑vs‑original
download; video, PDF, **audio**, and **office (docx/xlsx/pptx)** preview ([Q4 resolved](../../07-decisions/open-questions.md));
text/code editor (CodeMirror) with lock + heartbeat + draft + unsaved‑changes guard; version history + restore (files +
documents with diff); Share (presigned URL).
**Out:** nothing major. Office is **best‑effort** (client render + download fallback). Sharing = presigned URL
(**resolved**, no managed share backend planned — [sharing](../../04-features/sharing.md)).

## Task breakdown

### 4.1 — Preview modal shell — ✅ Stage A
- [x] `FilePreviewModal` as an intercepting/parallel route or modal **keyed by file key** (deep‑linkable). *(both the
      `@modal/(.)preview/[key]` interceptor and the non-intercepted `preview/[key]` route render it; `[key]` is
      percent-encoded.)*
- [x] Toolbar: download, **share**, delete, fullscreen, close. *(download/delete reuse storage's hooks; fullscreen is
      the native Fullscreen API, hidden when unavailable.)*
- [x] **Arrow‑key navigation** (←/→) across previewable items only (list held in memory). *(the browser publishes the
      ordered previewable-key list to a neutral store; `router.replace` so Back closes the modal.)*
- [x] State‑matrix: loading, error (see [state-matrix](../../02-architecture/state-matrix.md)).

### 4.2 — Image preview + scaling — ✅ Stage A (scaled-download deferred)
- [x] `imageCdn.ts` `getImageCdnUrl` → CDN `?w=&h=` from `Metadata.Width/Height` (thumb / preview / fullscreen targets).
- [x] SVG/ICO unscaled.
- [ ] **Download: scaled vs original** — offered **only** when the image has width/height metadata. *(DEFERRED within
      Stage A: the in-modal **view** is CDN-scaled and the **original** download works (presigned, content-disposition),
      but forcing a *download* of a wsrv-resized image needs a verified content-disposition/`download` param — pulled
      into a follow-up rather than shipping a "download" that only opens the image.)*
- [x] CDN `?w=&h=` is **supported ✅** (`cdn.storage.umutk.me` → wsrv.nl reverse proxy; base URL HMAC‑signed via rustfs).
      Build resize URLs by appending the query to the opaque signed URL. ([Q5](../../07-decisions/open-questions.md) resolved.)
      *(append is byte-preserving — `?`/`&` separator chosen at runtime — so any signature stays intact.)*

### 4.3 — Video, PDF, audio & office preview — ✅ (video/PDF/audio Stage A · office Stage B)
- [x] `LazyPreview` variants (video / PDF / **audio** player); ~~presigned URL source~~ **signed CDN `Path.Url` source**;
      unsupported‑codec message; large‑PDF handling. *(native `<video>`/`<audio>` with text fallback; **PDF = same-origin
      `blob:`** — bytes via the factory `Cloud/Download` (`responseType: blob`) → rendered as a blob, because a direct
      cross-origin iframe was blocked browser-side (Edge/SmartScreen, Chrome COEP); factory-only, no raw fetch —
      [D-P4.7](../../07-decisions/DECISIONS.md); >50 MiB or load failure → open-in-new-tab + download.)*
- [x] **Office** ~~client render (mammoth/SheetJS)~~ **= Microsoft Office Online embed viewer** (user choice,
      [D-P4.3](../../07-decisions/DECISIONS.md)): `OfficeViewer` renders docx/xlsx/pptx in a sandboxed `<iframe>` to
      `view.officeapps.live.com` (CSP `frame-src` += it), src = a fresh **presigned** URL; **graceful "download to view"
      fallback** on error/too‑large + a disclosure footer. **No new deps, no XSS surface.** Trade-off: file content
      egresses to Microsoft (privacy note + sign-off — see [privacy-compliance §9b](../../06-cross-cutting/privacy-compliance.md)).
      csv excluded (download). Server‑side convert‑to‑PDF stays the future robust path.

### 4.4 — Text/code editor — ✅ Stage C1 → see [documents](../../05-api/modules/documents.md)
- [x] **CodeMirror 6** editor (lazy chunk, `EDITOR_EXT`); load `Cloud/Documents/Content` (`includeDraft`). *(11 MIT
      packages, `next/dynamic`; [D-P4.5](../../07-decisions/DECISIONS.md).)*
- [x] **Lock** on open (`acquireLock`, TTL 5 min) + **heartbeat** (`extendLock` ~every 3 min); `423 locked‑by‑other` →
      read‑only banner; heartbeat-loss → read-only ("lock expired").
- [x] **Draft** auto‑save (`saveDraft`, throttled ≤1/10s); `409` hash mismatch → "changed elsewhere — Reload" banner
      (text kept as a draft); unsaved‑changes guard (Save/Discard/Cancel via the modal `editor.store` seam); **release
      lock on close/unmount**; `pagehide`/`visibilitychange` best-effort draft (never `beforeunload`).

### 4.5 — Version history + restore — ✅ object versions (Stage B) · document versions + diff (Stage C2)
- [x] `VersionHistoryRail` in the lightbox details rail: `Cloud/Versions`, `/Versions/Restore`, `DELETE /Versions`.
      *(lives in `PreviewDetailsRail`, lazy-fetch on expand; latest = "current" badge, no actions; restore/delete behind
      confirm; `invalidateScope` refetches object+versions+folder+usage — [D-P4.4](../../07-decisions/DECISIONS.md). Was a
      collapsible footer `VersionHistoryPanel` until the Zen-lightbox redesign — 9e6040e.)*
- [x] Documents `/Documents/Versions(/Diff/Restore)` with a diff view. *(Stage C2 — `DocumentVersionsRail` in the
      details rail; per-row backend-computed diff (`DiffView` hunk renderer, no diff lib); restore reloads the open
      editor in place; backend `ListVersions` was untyped (`void`) and got the `@ApiSuccessResponse` fix +
      regenerate — [D-P4.8](../../07-decisions/DECISIONS.md). Was `DocumentVersionsPanel` in the editor footer until the
      Zen-lightbox redesign — 9e6040e.)*

### 4.6 — Share (MVP) — ✅ Stage A
- [x] Share button → `Cloud/PresignedUrl` → Web Share API / copy link; note the TTL; no permission/expiry config yet.
      *(`useShare`: Web Share where available, else clipboard + a "valid for a limited time" toast.)*

## Endpoints used
`Cloud/Find`, `/PresignedUrl`, `/Download`, `/Versions`, `/Versions/Restore`, `DELETE /Versions`; `Cloud/Documents/Content`
(GET/PUT), `/Lock` (+ `/Lock/Heartbeat`, DELETE), `/Draft` (POST/DELETE), `/Find`, `/Versions`, `/Versions/Diff`,
`/Versions/Restore`. Contracts: [cloud-core](../../05-api/modules/cloud-core.md), [documents](../../05-api/modules/documents.md).

## Acceptance‑test checklist
- [x] All preview types open (image/video/PDF/text/**audio**/**office**); fullscreen + close work; deep‑link works.
      *(image/video/PDF/audio Stage A + office Stage B + text/code editor Stage C1 + fullscreen/close/deep-link ✅.)*
- [x] Audio plays (play/pause/seek/volume). Office: docx + xlsx render best‑effort; pptx renders or shows the **download
      fallback**; unsupported office files always offer download. *(audio Stage A; office Stage B via the Microsoft
      viewer — all three formats render in it, any failure → download fallback.)*
- [x] Arrow keys navigate previewable items only.
- [~] Images render scaled; scaled‑vs‑original download appears only with metadata; original always works. *(Stage A:
      scaled view ✅ + original download ✅; the scaled-vs-original **download** choice is deferred — see §4.2.)*
- [x] Editing acquires a lock; a second user is read‑only (423); heartbeat keeps the lock; draft auto‑saves (throttled);
      hash mismatch (409) is handled; closing releases the lock; unsaved‑changes guard fires. *(Stage C1 ✅; live
      lock/heartbeat/409 walkthrough pending creds.)*
- [x] Version history lists versions; restore works; document diff renders. *(Stage B: object versions list + restore +
      delete ✅; Stage C2: document versions list + per-row backend-computed diff + restore (reloads the editor) +
      delete ✅, lock-gated read-only.)*
- [x] Share copies a working presigned URL (and uses Web Share where available).

## Stage A verification (2026-06-14)
Preview core + share — **green**: `bunx tsc --noEmit`, `bun run lint`, `bun run build` (the `@modal/(.)preview/[key]`
interceptor + the non-intercepted `preview/[key]` route both build; the `[[...path]]` catch-all is unaffected),
**166 vitest pass** incl. the new `tests/preview/{preview-key,previewable-types,image-cdn,file-preview-modal}` and the
updated `tests/storage/selection` (plain file click now opens preview, not select).
- **Built:** the neutral `lib/preview` (key/encode + `viewerKindForName`/`isPreviewableName` + `getImageCdnUrl`), the
  `features/preview` feature (api/hooks/components/viewers/states + barrel), the storage-owned `previewNav.store`, and the
  wiring: file-row/card click + the `Eye` menu/sheet item open the modal; `StorageBrowser` publishes the previewable-key
  list; CSP `frame-src` += CDN; `preview` flag (default on).
- **Reviewer sweep:** data-layer (clean), design-system (1 fixed — PDF iframe `bg-white`→`bg-background`), a11y-state
  (clean).
- **Deviations:** scaled-vs-original **download** deferred (§4.2); inline viewers use the signed CDN `Path.Url` rather
  than a separately-minted presigned URL (§4.3); the arrow-nav previewable list lives in a storage-owned store, not a
  preview-local one, to keep the two features acyclic ([D-P4.2](../../07-decisions/DECISIONS.md)).
- **Live walkthrough pending creds** (each viewer against the real CDN, share copy, deep-link refresh, touch
  sheet) — per the Stage A/B/C convention.

## Stage B verification (2026-06-14)
Office preview (Microsoft embed) + object version history — **green**: `bunx tsc --noEmit`, `bun run lint`,
`bun run build`, **174 vitest pass** (+8) incl. the new `tests/preview/{office-embed,office-viewer,version-history}` and
the extended `previewable-types` (office promotion).
- **Built:** office = `OfficeViewer` (sandboxed `<iframe>` → `view.officeapps.live.com`, src = presigned URL, download
  fallback + disclosure), `useOfficeEmbed`, `officeEmbedUrl` + `OFFICE_EMBED_EXT` + `"office"` `ViewerKind`; object
  versions = `VersionHistoryPanel` (collapsible footer, lazy on expand) + `useVersions`/`useVersionActions`
  (`invalidateScope`), `listVersions`/`restoreVersion`/`deleteVersion` + keys. CSP `frame-src` += `view.officeapps.live.com`.
- **No new dependencies** (the MS viewer replaces mammoth/SheetJS/DOMPurify).
- **Reviewer sweep:** data-layer (clean — confirmed restore/delete-version correctly carry no Idempotency-Key: not in the
  Move/Delete/Complete set, factory exposes none, backend reads none), design-system (clean), a11y-state (clean; restore/
  delete bumped `icon-xs`→`icon-sm` per the target-size note).
- **Privacy/KVKK:** office file content egresses to Microsoft — disclosed in-viewer + documented
  ([privacy-compliance §9b](../../06-cross-cutting/privacy-compliance.md), [D-P4.3](../../07-decisions/DECISIONS.md));
  consent-gating-vs-disclose decision flagged for P7.
- **Live walkthrough pending creds** (real office render via Microsoft; restore/delete against the backend).

## Stage C1 verification (2026-06-14)
CodeMirror document editor — **green**: `bunx tsc --noEmit`, `bun run lint`, `bun run build`, **185 vitest pass** (+11)
incl. the new `tests/preview/{editor-language,document-editing,document-lock,editor-close-guard}` + extended
`previewable-types` (editor promotion). `size-limit` passes at the raised gate.
- **Built:** `"editor"` `ViewerKind` + `EDITOR_EXT` + `editorLanguageForName` (`lib/preview`); the data layer
  (`readDocument` + `acquireLock`/`extendLock`/`releaseLock`/`saveDraft`/`discardDraft`/`updateDocument`, `previewKeys.document`);
  hooks `useDocumentContent` / `useDocumentLock` (acquire+heartbeat+release; `423`→read-only, heartbeat-loss→"lock expired")
  / `useDocumentEditing` (throttled draft + commit w/ `ExpectedContentHash` + 409 conflict); the `editor.store` modal↔editor
  unsaved guard; `DocumentEditor` (CodeMirror, lazy via `DocumentEditorLazy`) + the `PreviewBody` editor case + the modal
  Save/Discard/Cancel close-guard (object version footer suppressed for editor files).
- **Dependencies:** +11 CodeMirror MIT packages, lazy-loaded; the editor chunk is ~233 KB gzip (all-chunks gate
  480→820 KB; [D-P4.5](../../07-decisions/DECISIONS.md) + [performance.md §2](../../06-cross-cutting/performance.md)).
- **Reviewer sweep:** data-layer (clean — Documents mutations correctly carry no Idempotency-Key; `suppressErrorToast`
  on lock/draft correct), design-system (clean), a11y-state (3 fixed — `role="status"` live region on the header status,
  a distinct "lock expired" copy for heartbeat-loss, name-guarded "Locked by").
- **Live walkthrough pending creds** (real lock/heartbeat/draft/409 against the backend; second-user 423; whether the
  Documents endpoints accept arbitrary uploaded text files vs only `Documents/Create` docs).

## Stage C2 verification (2026-06-14)
Document version history + diff + restore — **green**: `bunx tsc --noEmit`, `bun run lint`, `bun run build`,
**193 vitest pass** (+8 since Stage C1: new `tests/preview/{diff-view,document-versions}`), `size-limit` **790.8 / 820 KB**
(no new deps).
- **Backend gap fixed first ([D-P4.8](../../07-decisions/DECISIONS.md)):** `GET Cloud/Documents/Versions` emitted `void`
  in the generated client — its controller handler lacked the `@ApiSuccessResponse(...)` decorator + return type every
  sibling has. Mirrored the object endpoint in `nestjs-storage` (`@ApiSuccessResponse(CloudVersionListResponseModel)` +
  service wraps the bare `CloudVersionModel[]` → `{ Versions, Key }`); regenerated the committed client — the **only**
  diff was `CloudDocumentsApi.listVersions` `void → CloudVersionListResponseBaseModel`.
- **Built:** the data layer (`listDocumentVersions`/`diffDocumentVersions` queries, `restoreDocumentVersion`/
  `deleteDocumentVersion` mutations, `previewKeys.documentVersions`/`documentDiff`); hooks `useDocumentVersions` (lazy on
  expand) / `useDocumentDiff` (lazy per row, `refetch` for retry) / `useDocumentVersionActions` (restore awaits
  `invalidateScope` then bumps the editor reload signal; delete invalidates); `DiffView` (backend hunk renderer, semantic
  add/remove/context tokens, **no diff library**) + `DocumentVersionsPanel` (footer for editor files, per-row view-diff
  toggle, lock-gated restore/delete); the `editor.store` `reloadNonce`/`requestReload` + `canEdit` bridge; `DocumentEditor`
  re-seeds in place on the reload signal (reusing its 409 `onReload`, keeping the lock) + publishes `canEdit`.
- **Reviewer sweep:** casl-permission (clean — `ListVersions` inherits class-level Read/Document, no policy regression),
  data-layer (clean — factory-only, envelope casts, ownerId scope; note: `deleteDocumentVersion` gets an Idempotency-Key
  via the catch-all-`DELETE` interceptor rule, restore (PUT) correctly none), design-system (clean — semantic tokens,
  wrapped primitives, visible focus), a11y-state (2 fixed — `role="status"` live region on the per-row diff loading;
  Retry affordance on the diff error to match the state-matrix).
- **Live walkthrough pending creds** (real version list/diff/restore against the backend; restore-reloads-editor with a
  live lock; same open question as C1 on arbitrary uploaded text files).

## Zen-lightbox redesign (2026-06-14, commit 9e6040e) + office-Escape fix (2026-06-15, commit 880a1dd)
Post-C2 design refinement (no contract change) — **green**: `bunx tsc --noEmit`, `bun run lint`, `bun run build`, full
Vitest suite (~296 after the redesign + office-viewer tests), `size-limit` ~804.51 / 820 KB.
- **Restructured:** `FilePreviewModal` split into a dark `PreviewStage` (zoom + diff overlay) + a persistent
  `PreviewDetailsRail` (tabbed metadata + versions). `VersionHistoryPanel` → **`VersionHistoryRail`** and
  `DocumentVersionsPanel` → **`DocumentVersionsRail`** — both moved out of the collapsible/editor footer into the rail
  (`features/preview/components/{VersionHistoryPanel,DocumentVersionsPanel}.tsx` no longer exist). `ImageViewer` gained
  zoom; a `.zs-*` lightbox layer was added to `app/globals.css`; +preview i18n keys.
- **Office Escape fix (880a1dd):** the cross-origin `view.officeapps.live.com` embed stole keyboard focus, so Radix's
  Escape-to-close silently failed until focus left the frame (the "press Escape a few times" bug). `OfficeViewer` now uses
  a `useReleaseIframeFocus` hook that hands focus back to the document the instant the embed steals it; the embed is
  read-only so mouse scroll/click still work and the modal stays reliably closable (`tests/preview/office-viewer.test.tsx`).
- **Reviewer sweep:** design-system + a11y-state clean (visible focus, reduced-motion, `role` live regions retained).

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| Lock contention (423) UX | Clear read‑only banner + retry/lock‑status display. |
| Draft throttle (429) | Debounce to the 1/10s window; queue the latest. |
| CDN resize quirks (wsrv.nl params/limits) | Resize is supported; just validate the exact wsrv param mapping + signed‑URL passthrough. |
| **Office preview fidelity** (esp. pptx) | Best‑effort client render + **download fallback**; plan a server convert‑to‑PDF later (backend is ours). Don't block the phase on perfect office rendering. |

## Rollback / fallback
If a specific wsrv resize param misbehaves, serve originals for that case (keep download). If document locking proves
fragile, degrade to read‑only preview for text until stabilized.

## Exit criteria
Users can preview and navigate all MVP file types, edit text safely with versioning, and share a link. Proceed to the
remaining of Phases 4/5, then [Phase 6](./phase-6-advanced.md).
