# Feature — Storage: Browse & Navigate (Phase 3) 🟢

> List & smart grid, breadcrumb deep‑linking, usage bar, virtualization.
> API: [cloud-core](../05-api/modules/cloud-core.md) · Components: [patterns](../03-design-system/components/patterns.md).

## Screen — `(app)/storage/[[...path]]`

**Layout**
```
[breadcrumb ........................ view toggle | filter | sort | search]
[ ─────────────────────── content ─────────────────────── ]
  list view:  FileRow × n (virtualized)
  grid view:  FileCard × n (virtualized, responsive auto-fill)
[ usage bar (shell) ]   [ upload tray (global, floating) ]
```

**Components:** `StorageBrowser`, `FileRow`/`FileCard`, `FileIcon`, `Breadcrumb`, view toggle, `UsageBar`,
`StateBoundary`, `EmptyState`.

**Endpoints:** `Cloud/List` (combined) or `/List/Directories` + `/List/Objects`; `/List/Breadcrumb`;
`/User/StorageUsage`. Paged/infinite using envelope `Skip/Take/Count`.

**Views**
- **List:** dense rows (`sm`), columns name/size/modified/actions; sortable headers.
- **Smart grid:** responsive cards with thumbnail (images via CDN `?w=&h=`), name, meta; badges for encrypted/hidden/AV.
- View toggle persists per session (`ui` store).

**Navigation**
- Folder click → push URL segment (`/storage/a/b`); breadcrumb reflects path; back/forward work (deep‑linking,
  [routing](../02-architecture/routing-deep-linking.md)).
- Breadcrumb collapses with an overflow menu on small screens.

**States (matrix)**
loading (skeleton grid/list) · empty folder (illustration + upload/create CTAs) · no‑search‑results · network/server
error (retry) · locked (encrypted, needs unlock) · reveal‑required (hidden) · AV pending/infected badges · quota
warning/exceeded (usage bar color + banner). See [state-matrix](../02-architecture/state-matrix.md).

**Performance**
- Virtualize (`@tanstack/react-virtual`) both views; lazy thumbnails; don't stagger‑animate hundreds of rows
  ([variants](../03-design-system/motion/variants.md)).

**Keyboard/a11y**
- Arrow keys move focus across items; Enter opens (folder navigate / file preview); Space toggles selection; type‑ahead
  optional; rows/cards are buttons with labels.

**Usage bar**
- Always visible; shows %, turns `warning` at 80/90 and `danger` at 100; links to subscription/upgrade hint.
