# Feature — Preview, Edit & Share (Phase 4) 🟢

> Preview modal (image/video/PDF/text), text editing with locks/drafts/versions, and share.
> API: [cloud-core](../05-api/modules/cloud-core.md), [documents](../05-api/modules/documents.md) · Phase:
> [phase-4](../01-roadmap/phases/phase-4-preview-share.md).

## Preview modal — `PreviewModal` (deep‑linkable)
**Layout**
```
┌───────────────────────────────────────────────┐
│ name.ext                 [⬇][share][🗑][⛶][✕]   │  toolbar
├───────────────────────────────────────────────┤
│                                                 │
│              preview body (by type)             │
│                                                 │
├───────────────────────────────────────────────┤
│ ‹ prev    Version history ▾ (restore)    next › │  footer
└───────────────────────────────────────────────┘
```
**Routing:** intercepting/parallel route or modal keyed by file `Key` → deep‑linkable; closing returns to folder.
**Keyboard:** ←/→ navigate **previewable** items only; Esc closes; arrows/space scroll within PDF/large media; focus
trapped.
**State matrix:** loading; error; **AV pending** (gated/warn), **AV infected** (block/warn). 

## By type
| Type | Component | Source | Notes |
|---|---|---|---|
| Image | `LazyPreview` image | CDN `?w=&h=` from `Metadata.Width/Height` | thumb/preview/fullscreen targets; SVG/ICO unscaled; **download scaled vs original** (only if metadata). CDN resize **supported ✅** via `cdn.storage.umutk.me` → wsrv.nl ([Q5](../07-decisions/open-questions.md)); base URL is HMAC‑signed (rustfs) — treat as opaque, append resize query. |
| Video | `LazyPreview` video | presigned URL | unsupported‑codec message |
| PDF | `LazyPreview` pdf | presigned URL | large‑PDF lazy load |
| Text/code | `features/document-editor` (CodeMirror) | `Documents/Content` | see editing below |

## Text/code editing
**Endpoints:** `Documents/Content` (GET/PUT), `/Lock`(+`/Lock/Heartbeat`, DELETE), `/Draft`(POST/DELETE), `/Find`,
`/Versions(/Diff/Restore)`.
**Flow:** open → acquire **lock** (TTL 5 min) → edit with **heartbeat** (~3 min) → **draft** auto‑save (throttle 1/10s)
→ save (`PUT Content` with `ExpectedContentHash`) → release lock on close.
**Edge cases:** `423 locked‑by‑other` → read‑only banner; `409` hash mismatch → reconcile prompt; `429` draft throttle →
debounce; **unsaved‑changes guard** on close/navigate.

## Version history + restore
**Component:** `VersionHistoryPanel` (footer). **Endpoints:** `Cloud/Versions`,`/Versions/Restore`,`DELETE /Versions`;
docs `/Documents/Versions(/Diff/Restore)`. **States:** empty history; restore confirm; **diff view** for documents.

## Share (MVP)
**Toolbar Share** → `Cloud/PresignedUrl` → Web Share API / copy link. Note the **TTL**; no permission/expiry config
(future, [Q1](../07-decisions/open-questions.md)). Copy‑success toast. Full spec (presigned MVP + real‑link design that's
backend‑gated): **[sharing](./sharing.md)**.

## Out of MVP
Audio + office‑doc preview (open Q4) — design the type switch so they can slot in later.
