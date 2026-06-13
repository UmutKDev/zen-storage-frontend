# Zen Storage Design System

**Zen Storage** is a premium cloud-storage SaaS (Google Drive / Yandex Disk style): file browsing, multipart upload, preview & in-browser editing, encrypted & hidden folders, and team workspaces. The product is a Next.js 16 / React 19 web app with a calm, glass-chrome interface.

**Design philosophy: "premium, not decorated."** Restraint over flash. A monochrome base (black/white/grays) carries all structure; color is reserved for actions and states only. The signature look is restrained glassmorphism — frosted translucent chrome floating over a calm solid base.

## Sources

This system is derived from real product code, not invention:

- **GitHub:** [`UmutKDev/nextjs-storage` @ `v2`](https://github.com/UmutKDev/nextjs-storage/tree/v2) — the v2 frontend. Key inputs: `app/globals.css` (the single token source), `docs/03-design-system/**` (foundations, motion, glassmorphism contracts), `components/ui/*` (shadcn new-york wrapped primitives), `features/shell/*` and `features/storage/*` (real screen composition).
- **Fonts:** [`vercel/geist-font`](https://github.com/vercel/geist-font) — real Geist Sans / Geist Mono woff2 binaries (SIL OFL), copied into `assets/fonts/`.

Readers with repo access should explore `docs/03-design-system/` in the repo for the full written contracts; a copy of those docs plus the imported source files lives in [`reference/`](reference/) in this project.

## Stack (production app)

Next.js 16 / React 19 · Tailwind v4 (`@theme` CSS variables, semantic tokens only — **no raw hex in components**) · shadcn/ui (new-york, neutral) wrapped primitives · framer-motion with tokenized durations (120/200/320ms) and easings · every animation respects `prefers-reduced-motion`.

---

## CONTENT FUNDAMENTALS

How Zen Storage writes:

- **Calm, precise, low-ego.** Copy is short and functional: "Move", "Download", "Delete", "Select all", "Clear selection". No exclamation marks, no marketing adjectives inside the app.
- **Sentence case everywhere** — buttons, menu items, titles ("Select all", not "Select All").
- **Verbs for actions, nouns for places.** Buttons are bare verbs ("Rename", "Upload"); nav items are nouns ("Storage", "Account", "API keys").
- **Counts read as `N selected`** — terse suffix patterns ("3 selected"), tabular numerals.
- **States are named plainly:** "Encrypted", "Hidden", "Near limit", "Limit exceeded", "Scan pending", "Infected". No euphemisms, no drama.
- **Second person, but rarely.** The UI mostly avoids pronouns entirely; when needed it addresses "you" ("You can retry…"). Never "we" inside product chrome.
- **No emoji.** Anywhere. Meaning comes from icons (Lucide) + state colors + text.
- **Quantities and tech metadata in mono/tabular:** file sizes ("4.2 MB"), hashes, keys, dates in tables.
- **Errors are actionable:** state what failed + a retry path ("Couldn't load this folder. Retry"). Destructive confirmations name the count and consequence ("Delete 3 items? This can't be undone.").
- **i18n-ready:** all strings are keys in production (EN at MVP); avoid aggressive truncation, allow wrap.

## VISUAL FOUNDATIONS

- **Color:** monochrome base — `#ffffff/#fafafa/#f4f4f5` surfaces, `#171717` text, `#e4e4e7` hairlines (dark: `#0a0a0a/#141414/#1a1a1a`, `#ededed`, `#262626`). ONE warm accent: Claude-style orange `#d97757` (`--brand`, used for focus ring, folder icons, accents) deepened to `#c2410c` (`--primary`) for filled controls to hit AA with white text. Dark theme lightens the accent to `#e0937a` with near-black text on it. State colors carry meaning only: success `#16a34a`, warning `#d97706`, danger `#dc2626`, info `#2563eb`. Never paint surfaces with color; never use color as decoration.
- **Type:** Geist Sans for everything; Geist Mono for code/hashes/keys only. 400 body · 500 labels/buttons · 600 headers · 700 hero-only. `-0.01em` tracking on 2xl+ headings. One 2xl page title per screen; dense tables drop to sm. Tabular numerals for all sizes/dates/counts.
- **Spacing:** strict 4px scale. Hit targets ≥40px (44px touch) — small controls extend hit area with pseudo-elements.
- **Backgrounds:** flat solid colors. No photos, no patterns, no gradients (at most a *very* subtle low-contrast ambient wash behind glass). No illustrations exist in the product.
- **Glass (the signature):** two tiers ONLY. `glass-chrome` (62% white / 55% dark fill, 12px blur, saturate 140%) for topbar + sidebar; `glass-overlay` (72%/66%, 16px blur) for modals, popovers, command palette, upload tray, toasts. Each gets a 1px top highlight rim (`--glass-border`) + soft shadow. Content, cards, tables, and data rows are ALWAYS solid. No nested glass. Never animate blur. Required solid fallback under `prefers-reduced-transparency` / `prefers-contrast: more`.
- **Elevation:** hairline borders + soft shadows (`--shadow-e1…e4`), never heavy drops. Dark theme leans on borders + the glass rim instead of shadows.
- **Radius:** sm 6 · md 8 · lg 12 · xl 16; pills (`9999px`) for badges only. Cards = `--radius-lg`, controls = `--radius-md`.
- **Cards:** solid `--surface`, 1px `--border`, radius-lg, shadow-e1/e2 at most. Selected state = `--accent` fill + `--ring` border.
- **Hover:** neutral fill shift to `--accent` (light gray / dark gray) — never color, never opacity fades on text. Ghost buttons gain `--accent` bg. Rows/cards: `hover:bg-accent`.
- **Press:** slightly stronger fill (e.g. 90% primary), no shrink/scale in core controls; spring press is reserved for drag/sheet interactions.
- **Focus:** ALWAYS visible — 2px `--ring` (orange) outline, offset 2px; inputs get a 3px ring at 50% alpha.
- **Disabled:** 50% opacity, pointer-events none (or `aria-disabled` + hint when discoverability matters).
- **Motion:** tokenized — 120ms micro / 200ms base / 320ms large. Easing `cubic-bezier(0.2,0,0,1)` standard, decelerate entrances, accelerate exits. Entrances rise 8px + fade. Quick and crisp, never lingering, no bounces (spring only for drag/snap). Everything respects `prefers-reduced-motion`.
- **Layout:** glass topbar (56px, sticky) + glass sidebar (256px, collapsible to 64px icon rail) over a solid content area. Breadcrumbs derive from the path — pill crumbs: ghost pills for ancestors, a raised machined chip with a brand-tinted glyph (drive at root, folder inside) for the current location. Storage usage lives in the sidebar card only — never duplicated in the browser view.
- **Upload (the hero action):** the single `upload` Button variant — a heavier premium treatment of primary (gradient stack, engraved icon well, ⌘U chip, hover sheen) — opens `UploadDialog` on the glass-overlay tier: machined emblem header, dashed dropzone with engraved disc (browse + drag-and-drop), per-file encrypt → upload queue on a thin brand rail, encrypted footer. Uploads run in the background ("Hide" while in flight, "Done" when complete); there is no blocking "start" step.
- **Creation ("New"):** one outline **New** split button (plus + chevron) next to Upload opens a `Menu` with two items — **Directory** and **Document**. Each lands on a `zs-create` surface (same sectioned chrome as the unlock gate): `NewFolderDialog` has an **Encrypted** checkbox that arms a password (emblem flips neutral disc → orange folder-lock, password field rises in, AES-256 cipher note in the foot); `NewDocumentDialog` creates text documents — name field with live mono extension suffix, format chips (.txt .md .html .csv .json), filename preview in the foot. Dropdowns in general are `Menu`: glass overlay tier, icon-tile + label/description rows, anchored inside a `position: relative` wrapper.
- **Archiving:** any entry (row ⋮ menu → "Archive…") or multi-selection (bulk bar → "Archive") compresses into a single archive via `ArchiveDialog` — the same `zs-create` surface: head summarizes what's being archived (`“photo.jpg”` or `5 items` + destination), name field with live mono suffix swapped by format chips (.zip / .tar / .tar.gz), filename + item count preview in the foot. Name pre-fills from the single item's base name (or destination slug) and is pre-selected so typing replaces it. The result lands as a file in the current folder. **Extracting** is the reverse: archive rows get an "Extract" ⋮ action, and the bulk bar gains "Extract" when the selection holds archives. Nothing is queued without confirmation — `ExtractDialog` is the gate: single mode shows the destination folder plus an optional "Preview contents" disclosure (select-all checklist of the archive's top-level entries, so only some can be extracted — single-only); bulk mode is a numbered order list, archives extract one at a time in that order. Extractions then run one at a time with **inline progress on the row itself** — `FileRow`'s `task` prop swaps the kind line for a label + tabular percent over a thin brand rail; queued rows read "Queued — extracts next / Nth in line" with a dimmed sweeping rail (static under reduced motion).
- **Selection model:** checkboxes fade in on hover; bulk action bar floats bottom-center as a solid elevated pill (Move / Archive / Download / Delete); drop targets show a 2px ring. Selected media tiles shrink inside an accent ring.
- **Protected content (encrypted / hidden):** state rides on the icon tile as a small corner **status chip** — lock = encrypted (open lock once unlocked), eye-off = hidden — never name-line badges; the kind/meta line gains a plain word ("Encrypted", "Unlocked", "Hidden"). Hidden items render ghosted (dashed tile, dimmed) and stay invisible until the **double-Shift (⇧⇧) gesture + password gate** reveals them; clicking an encrypted folder opens the same gate. `UnlockDialog` is that gate: machined emblem header (orange lock / neutral eye-off disc), password field with show/hide toggle, encrypted footer, panel shake + inline error on a wrong password. Locked rows/cards/tiles can't be selected but still fire `onOpen` so the app can prompt.
- **Grid view = justified "smart grid":** rows fill the container width at a uniform height while photos/videos keep their natural aspect ratio (`SmartGrid` + `FileTile`); folders and non-media files render as square icon tiles mixed into the same rows. Media tiles are full-bleed thumbnails with a bottom scrim caption; videos add a glass play chip + mono duration. Pure CSS justification (`--zs-ratio` flex-grow trick) — no measurement JS.
- **Imagery:** none in-product as decoration — the interface IS the brand: neutral surfaces, orange accent, glass chrome. The only imagery is user content (file/photo thumbnails); demo placeholder thumbs live in `assets/thumbs/`.

## ICONOGRAPHY

- **System: [Lucide](https://lucide.dev)** (`lucide-react` in production). 1.5px stroke, round caps/joins, 24px grid, rendered at 16px (`size-4`) in controls and 20px (`size-5`) in rows/buttons-lg.
- No icon font, no PNG icons, no emoji, no unicode-as-icon. SVG only, `currentColor` stroke.
- Common vocabulary: `folder` (tinted `--brand` for directories), `file`, `lock` (encrypted), `eye-off` (hidden), `hard-drive` (storage nav), `user`, `key-round`, `search`, `upload`, `download`, `trash-2`, `folder-input` (move), `more-vertical`, `chevron-right`, `archive` (create archive), `file-archive` (archive file), `grid`/`list` (view toggle), `panel-left` (collapse), `sun`/`moon` (theme), `bell`, `plus`, `x`, `check`, `command`.
- **In this design system:** load Lucide from CDN — `<script src="https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js"></script>` — and use the bundled `Icon` component (`window.ZenStorage.Icon`, e.g. `<Icon name="folder" size={16} />`), or `data-lucide` attributes + `lucide.createIcons()` in plain HTML. A few frequently-used glyphs are also copied as standalone SVGs in `assets/icons/`.
- **Logo:** the product has no drawn logo asset; the brand mark is a **lettermark tile** — an "S" (weight 600, white) centered in a `--primary` square with `--radius-md`. See `assets/logo.html` recipe + the `Logo` component. `assets/favicon.ico` is the repo favicon.

## INDEX

| Path | What |
|---|---|
| `styles.css` | Global CSS entry — `@import`s every token file below |
| `tokens/` | `colors` · `typography` · `spacing` · `elevation` · `glass` · `motion` · `fonts` · `base` |
| `assets/fonts/` | Geist + Geist Mono woff2 (real binaries) |
| `assets/icons/` | Frequently-used Lucide SVGs |
| `components/core/` | Button, IconButton, Badge, Input, Switch, Checkbox, Avatar, Skeleton, Logo, Icon |
| `components/surfaces/` | Card, GlassPanel, Dialog, Menu, Toast, Tabs |
| `components/storage/` | FileRow, FileCard, SmartGrid, FileTile, Breadcrumb, UsageBar, BulkActionBar, UploadDialog, UnlockDialog, NewFolderDialog, NewDocumentDialog, ArchiveDialog, ExtractDialog |
| `assets/thumbs/` | Generated placeholder photo/video thumbnails for smart-grid demos |
| `ui_kits/zen-storage-app/` | Interactive recreation of the app: login → storage browser (list/smart grid, selection, breadcrumbs, command palette, preview modal, dark mode, New → Directory/Document creation, archive to .zip/.tar/.tar.gz + queued extract with inline row progress, encrypted-folder unlock + ⇧⇧ hidden-items reveal — demo password "zen") |
| `guidelines/` | Foundation specimen cards (Design System tab) |
| `reference/` | Imported source from `nextjs-storage@v2` — docs + real component code |
| `SKILL.md` | Agent-skill entry point |

**Component usage (in this project's HTML):** link `styles.css`, load `_ds_bundle.js`, then `const { Button } = window.ZenStorage`. Production code should instead follow the conventions in `reference/docs/` (Tailwind semantic tokens + shadcn wrappers).

## Hard rules (the red-flag list)

1. No raw hex in components — semantic tokens only.
2. Color = meaning. One orange primary action per view; destructive uses danger, never the accent.
3. Glass on chrome/overlays only; content and data always solid; solid fallback required.
4. Every animation respects `prefers-reduced-motion`; never animate blur.
5. WCAG AA contrast; visible focus ring always; ≥40px hit targets (44px touch).
6. No emoji; sentence case; terse verb-first copy.
