# Phase 4 — Preview + Share

> **Status:** ⏳ not started · **Depends on:** [Phase 3](./phase-3-storage-core.md) · **Sibling:** [Phase 5](./phase-5-secure-folders.md).
> **Feature spec:** [preview](../../04-features/preview.md) · **API:** [cloud-core](../../05-api/modules/cloud-core.md) ·
> [documents](../../05-api/modules/documents.md)

## Objective
Open files in a rich **preview modal** (image / video / PDF / text), **edit text** safely (lock + draft + version
restore), browse **version history**, and **share** via presigned URL.

## Scope
**In:** preview modal + toolbar; arrow‑key navigation across previewable items; image CDN scaling + scaled‑vs‑original
download; video & PDF preview; text/code editor (CodeMirror) with lock + heartbeat + draft + unsaved‑changes guard;
version history + restore (files + documents with diff); Share (presigned URL).
**Out:** audio + office‑doc preview (post‑MVP, see open Q4); a real share backend (none exists).

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
- [ ] ⚠ CDN `?w=&h=` honoring is **`UNVERIFIED`** — confirm infra before relying; fall back to original.

### 4.3 — Video & PDF preview
- [ ] `LazyPreview` variants; presigned URL source; unsupported‑codec message; large‑PDF lazy load.

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
- [ ] All four preview types open (image/video/PDF/text); fullscreen + close work; deep‑link to a preview works.
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
| CDN `?w=&h=` `UNVERIFIED` | Infra check this phase; fallback to original URLs. |
| AV pending/infected gating | Centralize gate via `Cloud/Scan/Status` (shared with Phase 6). |

## Rollback / fallback
If CDN resizing isn't honored, serve originals (drop the scaled option, keep download). If document locking proves
fragile, degrade to read‑only preview for text until stabilized.

## Exit criteria
Users can preview and navigate all MVP file types, edit text safely with versioning, and share a link. Proceed to the
remaining of Phases 4/5, then [Phase 6](./phase-6-advanced.md).
