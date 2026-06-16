# Components — Composed Patterns

> Higher‑level, app‑specific components built **from primitives** + tokens + motion. These are reused across features so
> behavior and look stay consistent. Each maps to one or more [feature specs](../../04-features/FEATURE-MAP.md).

## 1. Catalog

| Pattern | Built from | Used by | Notes |
|---|---|---|---|
| **FileCard / FileRow** | card/row + avatar/icon + badge + menu | storage grid/list | encrypted/hidden badges; selectable; draggable |
| **FileIcon** | icon set (lucide) by extension/mime | everywhere files appear | consistent type → icon map |
| **Breadcrumb** | button + separator + overflow menu | storage header | deep‑link aware; collapses on small screens |
| **UsageBar** | progress + tooltip | shell | %, near‑limit color (warning/danger) |
| **UploadTray** | sheet/popover + progress list | global | per‑file state, pause/cancel/retry; persistent |
| **ConflictDialog** | alert‑dialog + radio + checkbox | upload/create/move/rename | FAIL/REPLACE/SKIP/KEEP_BOTH + apply‑to‑all |
| **PassphraseDialog** | dialog + input | secure folders | unlock / reveal; min‑8; error vs needs‑token |
| **PreviewModal** | dialog (intercepting route) + toolbar | preview | image/video/pdf/text; arrow‑nav; version panel |
| **VersionHistoryPanel** | scroll‑area + list + diff view | preview | restore/delete; doc diff |
| **BulkActionBar** | sticky bar + buttons | storage selection | delete/move/download; count; clear |
| **EmptyState** | illustration + copy + CTA | every list/surface | empty folder / no results variants |
| **StateBoundary** | skeleton / error / empty wrappers | route + feature surfaces | implements the [state matrix](../../02-architecture/state-matrix.md) |
| **NotificationInbox** | sheet/popover + list | shell bell | history/unread/read‑all; pagination |
| **CommandSearch** | command + scope toggle | storage search | global vs current; default current |
| **JobIndicator** | toast/tray + progress | duplicate/archive | socket‑first + poll; cancel |

## 2. Construction rules
- Patterns compose **wrapped primitives** ([primitives](./primitives.md)) — never raw HTML controls.
- Visuals come from tokens; animations from [variants](../motion/variants.md); states from the
  [state matrix](../../02-architecture/state-matrix.md).
- A pattern owns its **a11y** (roles, focus order, `aria-live` where async) and its **i18n** keys.
- If two features need the same UI, it becomes a pattern here — don't duplicate.
- **Glass on chrome/overlay patterns only:** `PreviewModal`, `UploadTray`, `NotificationInbox`, `CommandSearch`, and the
  shell topbar/sidebar use the `glass-overlay`/`glass-chrome` treatment ([glassmorphism](../foundations/glassmorphism.md));
  **content/data patterns (`FileCard`, `FileRow`, `BulkActionBar`, tables, `EmptyState`) stay solid.** Apply glass via
  the shared utility/wrapper, never raw `backdrop-blur` + arbitrary colors.

## 3. Cross‑links
Patterns are referenced by name in the feature specs. When a feature spec says "uses `ConflictDialog`", the contract for
that component lives **here**; the behavior/flow lives in the
[conflict-resolution architecture](../../02-architecture/conflict-resolution.md).

## 4. Realized "Zen" patterns

Concrete patterns added when the [Zen treatment](../zen-reference/ABOUT.md) landed. Their machined CSS
(`.zs-tile-icon`, `.zs-status-chip`, `.zs-file-panel`, `.zs-crumb-*`, `.zs-section-*`, `.zs-dropzone`,
`.zs-rail`, `.zs-smartgrid`/`.zs-tile`) lives in `app/globals.css`; semantic tokens only.

| Pattern | Where | What |
|---|---|---|
| **Type tile + tones** | `lib/utils/file-meta.ts` (`fileMeta` → `{icon, tone, label}`, `toneClass`) | Tinted gradient icon socket keyed by file type — 8 oklch tones (brand/red/blue/green/amber/teal/violet/slate). Folders are brand; color carries *type*, never decoration. Used by `BrowseRow`/`BrowseCard`/`FileTile`/upload rows. |
| **`EntryStatusChip`** | `features/storage/browse/components` | Protected state rides the icon tile as a corner chip (lock / eye‑off) + a plain status word on the kind line — **replaces name‑line badges**. Hidden dirs render ghosted (`.zs-tile-icon--ghost`, dashed + dimmed). `entryStatus`/`entryIsHidden` helpers. |
| **File‑list panel** | `ListView` | Rows in a contained `.zs-file-panel` (border + radius + inset highlight) under a sticky uppercase column header (`aria-hidden` over the virtualized list — NOT a real `<table>`). |
| **Pill `Breadcrumb`** | `BreadcrumbBar` | Ghost‑pill ancestors that fill on hover + a raised machined current chip with a brand glyph (drive at root, folder inside). Keeps the drop‑target + `aria-current`. |
| **`SectionedDialog`** | `features/storage/operations` | Reusable emblem‑head + body + recessed‑foot chrome, built ON the Radix `Dialog` (`glass-overlay`) so portal/focus‑trap/escape come free. Emblem tone `neutral`/`armed`. |
| **Upload (hero)** | `UploadButton` → `UploadDialog` | The `upload` Button opens a dropzone dialog (engraved disc, browse + drag‑drop + folder pick) over a **live mirror** of the existing engine; "Hide" hands off to the background `UploadTray`. ⌘U opens it. |
| **Create dialogs** | `NewFolderDialog` / `NewDocumentDialog` | Sectioned chrome over the existing `useCreateFolder`/`useCreateFile`. Document dialog has format chips + a live filename preview. NewFolder's encrypt option is **disabled (Phase 5)** — no encrypt field is sent. |
| **`UnlockDialog`** | `features/storage/operations` | Presentational password gate (lock/eye‑off emblem, show/hide, shake‑on‑error). Built as the DS primitive; **Phase 5 wires** the in‑memory secure‑folder token flow (rule #5). Not mounted yet. |
| **`SmartGrid` + `FileTile`** | `features/storage/browse/components` | Justified media grid (`--zs-ratio` flex trick): media full‑bleed thumb + scrim caption + play chip; folders/docs as tinted icon tiles. Built; the media‑grid view wires real thumbnails in its phase. |

The legacy `FileCard`/`FileRow`/`BulkActionBar`/`UploadTray` rows in §1 still apply — they just carry the
type tile + status chip now, and stay **solid** (never glass). `BulkActionBar` already matched the
solid‑pill spec.
