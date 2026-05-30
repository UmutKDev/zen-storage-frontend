# Components — Composed Patterns

> Higher‑level, app‑specific components built **from primitives** + tokens + motion. These are reused across features so
> behavior and look stay consistent. Each maps to one or more [feature specs](../../04-features/FEATURE-MAP.md).

## 1. Catalog

| Pattern | Built from | Used by | Notes |
|---|---|---|---|
| **FileCard / FileRow** | card/row + avatar/icon + badge + menu | storage grid/list | encrypted/hidden/AV badges; selectable; draggable |
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
