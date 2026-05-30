# Routing & Deep‑Linking

> App Router structure, folder deep‑linking, and how the preview opens as a deep‑linkable modal.

## 1. Route groups

```
app/
  (public)/            # public layout (marketing chrome)
    page.tsx                     landing
    features/page.tsx
    pricing/page.tsx
  (auth)/              # minimal auth layout
    login/page.tsx
    register/page.tsx
    reset/page.tsx
  (app)/               # authenticated shell (sidebar/topbar)
    layout.tsx                   shell + providers consumed here
    storage/[[...path]]/page.tsx folder browser (catch-all)
    account/
      profile/page.tsx
      security/page.tsx
      subscription/page.tsx
      api-keys/page.tsx          (scaffold, post-MVP)
  api/auth/[...nextauth]/route.ts  Auth.js handler
```

Each group has its own `layout.tsx`. `(app)` is protected (redirects unauthenticated users to `/login`, preserving the
intended path).

## 2. Folder deep‑linking

- `storage/[[...path]]` is a **catch‑all** mapping URL segments ↔ the API's `Path` / `Delimiter`.
  - `/storage` → root.
  - `/storage/Projects/2026` → `Path = Projects/2026`.
- The **breadcrumb** comes from `Cloud/List/Breadcrumb` for the current path.
- Search **scope** (global vs current folder) and **filters/sort** are query params (`?scope=current&sort=...`), so a
  view is shareable/bookmarkable. Default scope = current folder.

## 3. Preview as a deep‑linkable modal

- The preview opens as an **intercepting/parallel route** (or a modal keyed by the file `Key`), so:
  - it is **deep‑linkable** (`/storage/Projects?preview=<key>` or an intercepting segment),
  - **arrow‑key navigation** can step across the in‑memory list of previewable items,
  - closing returns to the underlying folder view without a full reload.
- See the feature spec: [preview](../04-features/preview.md).

## 4. Boundaries (states)

- Per‑segment `loading.tsx` (skeletons, motion‑aware) and `error.tsx` (typed‑error display + retry).
- These back the [state-matrix](./state-matrix.md): loading / error at the route level; empty / no‑results / locked /
  reveal‑required / quota / AV / permission inside the page.

## 5. Server vs client
- RSC where it helps (public pages, initial shells); client components for interactive storage surfaces.
- Auth/session is available on both sides; the [Instance](./data-layer.md) injects the session id appropriately.

## 6. Open items
- Final choice between **intercepting routes** vs a **client modal keyed by query param** for preview — decide in Phase 4
  based on Next 16.2 behavior (read the bundled docs). Both satisfy deep‑linking + arrow‑nav.
