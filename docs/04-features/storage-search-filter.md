# Feature — Storage: Search, Filter & Sort (Phase 3) 🟢

> Find and organize within storage. API: [cloud-core](../05-api/modules/cloud-core.md) (`Cloud/Search`).

## Search
**Component:** `CommandSearch` (search box + **scope toggle**).
**Scope:** **global (all folders)** vs **current folder** — the user chooses; **default = current folder** (D8).
**Endpoint:** `Cloud/Search` (Path + Extension filters + pagination).
**Behavior:** debounced; scope reflected in the URL query (`?scope=current|global&q=...`), so a search is shareable.
**States:** loading; **no‑results** (clear / broaden scope CTA); error.
**Keyboard/a11y:** `/` or Cmd/Ctrl‑K opens; Esc clears/closes; results keyboard‑navigable; `aria-live` result count.

## Filter
**Component:** filter control in the toolbar.
**Filters:** by type (folder/image/video/doc/text/archive…), by extension, (size/date ranges where useful).
**Where:** client‑side over the current list for cheap filters; server `Cloud/Search` Extension filter when crossing
folders or large sets.
**Persistence:** per session (`ui` store).

## Sort
**Fields:** name, size, modified date, type. Asc/desc. Default: name asc (folders first).
**Where:** client‑side for the loaded window; for very large folders rely on server ordering + paging.
**Persistence:** per session.

## Interaction notes
- Search scope and filters/sort compose: searching within "current folder" respects the active filter where sensible.
- Switching folders resets the no‑results state; keeps the global sort/filter preference.
- Default current‑folder scope keeps the common case fast; global is an explicit opt‑in.
