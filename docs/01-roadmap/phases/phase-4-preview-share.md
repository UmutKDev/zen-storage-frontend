# Phase 4 — Preview + Share

> **Status:** ⏳ not started · **Depends on:** [Phase 3](./phase-3-storage-core.md) · **Sibling:** [Phase 5](./phase-5-secure-folders.md).
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

### 4.1 — Preview modal shell
- [ ] `FilePreviewModal` as an intercepting/parallel route or modal **keyed by file key** (deep‑linkable).
- [ ] Toolbar: download, **share**, delete, fullscreen, close.
- [ ] **Arrow‑key navigation** (←/→) across previewable items only (list held in memory).
- [ ] State‑matrix: loading, error, **AV pending/infected** gate (see [state-matrix](../../02-architecture/state-matrix.md)).

### 4.2 — Image preview + scaling
- [ ] `imageCdn.ts` `getImageCdnUrl` → CDN `?w=&h=` from `Metadata.Width/Height` (thumb / preview / fullscreen targets).
- [ ] SVG/ICO unscaled.
- [ ] **Download: scaled vs original** — offered **only** when the image has width/height metadata.
- [ ] CDN `?w=&h=` is **supported ✅** (`cdn.storage.umutk.me` → wsrv.nl reverse proxy; base URL HMAC‑signed via rustfs).
      Build resize URLs by appending the query to the opaque signed URL. ([Q5](../../07-decisions/open-questions.md) resolved.)

### 4.3 — Video, PDF, audio & office preview
- [ ] `LazyPreview` variants (video / PDF / **audio** player); presigned URL source; unsupported‑codec message;
      large‑PDF lazy load.
- [ ] **Office** (`OfficePreview`): best‑effort **client render** — docx via a converter (mammoth→HTML), xlsx via
      SheetJS→table, pptx limited; **graceful "download to view" fallback** when unsupported. Server‑side
      convert‑to‑PDF is the future robust path (backend is ours). See [preview](../../04-features/preview.md).

### 4.4 — Text/code editor → see [documents](../../05-api/modules/documents.md)
- [ ] CodeMirror editor; load `Cloud/Documents/Content` (+ draft).
- [ ] **Lock** on open (`/Lock`, TTL 5 min) + **heartbeat** (`/Lock/Heartbeat` ~every 3 min); `423 locked‑by‑other` →
      read‑only.
- [ ] **Draft** auto‑save (`/Draft`, throttle 1/10s); `409` hash mismatch handling; unsaved‑changes guard; **release
      lock on close**.

### 4.5 — Version history + restore
- [ ] `VersionHistoryPanel` at the bottom of the preview: `Cloud/Versions`, `/Versions/Restore`, `DELETE /Versions`;
      documents `/Documents/Versions(/Diff/Restore)` with a diff view.

### 4.6 — Share (MVP)
- [ ] Share button → `Cloud/PresignedUrl` → Web Share API / copy link; note the TTL; no permission/expiry config yet.

## Endpoints used
`Cloud/Find`, `/PresignedUrl`, `/Download`, `/Versions`, `/Versions/Restore`, `DELETE /Versions`; `Cloud/Documents/Content`
(GET/PUT), `/Lock` (+ `/Lock/Heartbeat`, DELETE), `/Draft` (POST/DELETE), `/Find`, `/Versions`, `/Versions/Diff`,
`/Versions/Restore`. Contracts: [cloud-core](../../05-api/modules/cloud-core.md), [documents](../../05-api/modules/documents.md).

## Acceptance‑test checklist
- [ ] All preview types open (image/video/PDF/text/**audio**/**office**); fullscreen + close work; deep‑link works.
- [ ] Audio plays (play/pause/seek/volume). Office: docx + xlsx render best‑effort; pptx renders or shows the **download
      fallback**; unsupported office files always offer download.
- [ ] Arrow keys navigate previewable items only.
- [ ] Images render scaled; scaled‑vs‑original download appears only with metadata; original always works.
- [ ] Editing acquires a lock; a second user is read‑only (423); heartbeat keeps the lock; draft auto‑saves (throttled);
      hash mismatch (409) is handled; closing releases the lock; unsaved‑changes guard fires.
- [ ] Version history lists versions; restore works; document diff renders.
- [ ] Share copies a working presigned URL (and uses Web Share where available).

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| Lock contention (423) UX | Clear read‑only banner + retry/lock‑status display. |
| Draft throttle (429) | Debounce to the 1/10s window; queue the latest. |
| CDN resize quirks (wsrv.nl params/limits) | Resize is supported; just validate the exact wsrv param mapping + signed‑URL passthrough. |
| AV pending/infected gating | Centralize gate via `Cloud/Scan/Status` (shared with Phase 6). |
| **Office preview fidelity** (esp. pptx) | Best‑effort client render + **download fallback**; plan a server convert‑to‑PDF later (backend is ours). Don't block the phase on perfect office rendering. |

## Rollback / fallback
If a specific wsrv resize param misbehaves, serve originals for that case (keep download). If document locking proves
fragile, degrade to read‑only preview for text until stabilized.

## Exit criteria
Users can preview and navigate all MVP file types, edit text safely with versioning, and share a link. Proceed to the
remaining of Phases 4/5, then [Phase 6](./phase-6-advanced.md).
