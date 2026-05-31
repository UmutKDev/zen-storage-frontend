# Folder Structure

> The authoritative, deep folder plan for the v2 frontend. **Feature‑sliced, layered, with enforced boundaries** — built
> for scale and readability. This is the canonical version; [ARCHITECTURE.md](./ARCHITECTURE.md#folder-structure) keeps a
> short summary that links here. Conventions: [CONVENTIONS.md](../00-overview/CONVENTIONS.md).
>
> Path alias: **`@/*` → repo root** (tsconfig). No `src/` dir — `app/` and `service/` live at the root (matches the
> committed scaffold). Package manager: **bun**.

## 1. Principles (why it's shaped this way)

1. **Feature‑first.** Domain code lives in `features/<name>/` and **owns** its UI, hooks, data access, and local state.
   You can understand (or delete) a feature by looking in one folder.
2. **Thin routing.** `app/` is *only* routing + composition — pages import a feature's screen and render it. **No business
   logic in `app/`.**
3. **Layered with a one‑way dependency rule.** `app → features → (components, lib, service, stores, hooks)`. Lower layers
   never import upward. Features don't reach into each other's internals — only their public barrel.
4. **Co‑location.** A thing lives next to what uses it; it only moves "up" a layer when a *second* consumer appears.
5. **One source of truth.** Generated client in `service/` (never hand‑edited); design tokens in `app/globals.css`;
   conventions in `docs/`. No parallel copies.
6. **Explicit public surfaces.** Each feature exposes a barrel `index.ts` — the only thing other code may import from it.
7. **Readable by convention.** Predictable names + a fixed per‑feature anatomy mean you never hunt for where something
   goes (see the "[where does X go?](#5-where-does-x-go)" table).

## 2. Top‑level tree

```
nextjs-storage/
├── app/                      # ROUTING LAYER ONLY (App Router) — thin pages + layouts + route boundaries
├── features/                 # DOMAIN FEATURES (the heart) — feature-sliced, self-contained
├── components/               # CROSS-FEATURE shared UI
│   ├── ui/                   #   shadcn primitives (via MCP) + premium wrappers  (the design-system layer)
│   ├── patterns/             #   composed, cross-feature components (EmptyState, StateBoundary, ConflictDialog…)
│   └── layout/               #   app shell chrome (AppShell, Sidebar, Topbar, CommandBar slot)
├── lib/                      # CROSS-CUTTING INFRASTRUCTURE (no UI, no feature imports)
│   ├── api/                  #   ApiError, envelope types, query-key factory, error→toast mapping
│   ├── auth/                 #   Auth.js config, session helpers, route guards
│   ├── i18n/                 #   t(), config, dictionaries/  (EN at MVP)
│   ├── motion/               #   tokens.ts, variants.ts, useReducedMotion gate
│   ├── flags/                #   typed feature-flag registry + useFlag
│   ├── observability/        #   error reporter + analytics init + typed event catalog
│   ├── socket/               #   socket.io client setup (consumed by notifications)
│   ├── validation/           #   shared zod schemas
│   └── utils/                #   generic helpers (cn, formatBytes, formatDate, paths…)
├── service/                  # GENERATED API CLIENT + Instance  (committed; never hand-edit generates/)
│   ├── Instance.ts           #   the single axios instance all factories are built on  (NEW in Phase 0)
│   ├── factories.ts          #   generated factories wired on Instance  (exists)
│   └── generates/            #   GENERATED output — api.ts + dto/ models  (build artifact, never edit)
├── stores/                   # GLOBAL zustand stores (cross-feature only)
├── hooks/                    # GLOBAL shared hooks (cross-feature only)
├── config/                   # env validation, app constants, flag defaults
├── types/                    # global/ambient TS types (NOT API DTOs — those are generated)
├── public/                   # static assets (icons, images, fonts if self-hosted)
├── tests/                    # test setup + e2e (unit/component tests co-locate next to source)
├── docs/                     # the planning docs (this hierarchy)
├── .claude/                  # CLAUDE.md setup: agents, commands, skills, settings
├── app/globals.css           # Tailwind v4 entry: tokens, glass utilities, theme scopes
├── openapitools.json · components.json · next.config.ts · tsconfig.json · eslint.config.mjs · package.json · bun.lock
```

## 3. `app/` — routing layer (thin)

```
app/
├── layout.tsx                        # root: <html>, fonts, ThemeProvider, global providers shell
├── globals.css                       # design tokens + glass utilities (Tailwind v4 @theme)
├── not-found.tsx · error.tsx         # root boundaries
├── (public)/                         # marketing — public layout
│   ├── layout.tsx
│   ├── page.tsx                      # landing
│   ├── features/page.tsx
│   └── pricing/page.tsx              # "coming soon"
├── (auth)/                           # auth — minimal layout
│   ├── layout.tsx
│   ├── login/page.tsx · register/page.tsx · reset/page.tsx
├── (app)/                            # authenticated — shell layout + providers
│   ├── layout.tsx                    # composes AppShell + Query/Session/Notification providers
│   ├── storage/
│   │   └── [[...path]]/              # folder deep-linking (catch-all)
│   │       ├── page.tsx              # renders <StorageBrowserScreen/> from features/storage
│   │       ├── loading.tsx · error.tsx
│   │       └── @modal/(.)preview/[key]/page.tsx   # intercepting route → deep-linkable preview modal
│   └── account/
│       ├── profile/page.tsx · security/page.tsx · subscription/page.tsx
│       └── api-keys/page.tsx         # scaffold (flagged, post-MVP)
└── api/
    └── auth/[...nextauth]/route.ts   # Auth.js handler
```

**Rule:** a `page.tsx` does three things at most — read route params, render the feature screen, set metadata. Anything
else belongs in a feature. Per‑segment `loading.tsx`/`error.tsx` back the [state matrix](./state-matrix.md).

## 4. `features/<name>/` — the per‑feature anatomy (fixed shape)

Every feature uses the **same internal structure**, so navigation is muscle‑memory:

```
features/<feature>/
├── components/        # feature UI, composed from components/ui + components/patterns
├── screens/           # top-level screen/container(s) a route renders (e.g. StorageBrowserScreen)
├── hooks/             # feature hooks (UI logic + data hooks that call the feature api/)
├── api/               # feature DATA LAYER
│   ├── <feature>.queries.ts     # useQuery hooks wrapping FACTORIES on Instance
│   ├── <feature>.mutations.ts   # useMutation hooks (optimistic + invalidation)
│   └── queryKeys.ts             # team-prefixed key builders for this feature
├── stores/            # feature-LOCAL zustand (only if state is truly feature-scoped)
├── lib/               # feature-pure helpers (no React)
├── types.ts           # feature-LOCAL UI types  (NEVER API DTOs — those come from service/generates)
├── constants.ts
└── index.ts           # PUBLIC BARREL — the only import surface for the rest of the app
```

> Not every feature needs every folder — add a folder when it earns its place. But when present, it goes **here**, named
> like this.

### Feature list (maps to phases)

```
features/
├── auth/                 # P1 — login (multi-step), register, reset, session glue
├── account/              # P2 — profile, security (password/2FA/passkey/sessions), subscription view
│   ├── profile/ · security/ · subscription/        # sub-areas (each with components/hooks)
├── storage/              # P3 — the browser (the core)
│   ├── browse/           #   list + smart grid, breadcrumb, navigation, virtualization
│   ├── upload/           #   multipart pipeline + UploadTray
│   ├── operations/       #   create/rename/move/delete + multi-select + bulk + dnd
│   ├── search/           #   search scope + filter + sort
│   ├── components/       #   FileCard, FileRow, FileIcon, UsageBar (storage-shared)
│   ├── stores/           #   storage-local UI (view mode, filters) if not global
│   └── index.ts
├── preview/              # P4 — FilePreviewModal + viewers (image/video/pdf/text/audio/office) + versions + share
│   └── viewers/          #   ImageViewer · VideoViewer · PdfViewer · AudioViewer · OfficePreview
├── document-editor/      # P4 — CodeMirror + lock/heartbeat/draft/diff
├── secure-folders/       # P5 — encrypted + hidden UI; PassphraseDialog; Shift-Shift reveal
├── advanced/             # P6 — duplicate scan, archive (zip/extract), AV status
│   ├── duplicate-scan/ · archive/ · av-status/
├── notifications/        # P6 — socket provider, toast fan-out, NotificationInbox
├── command-palette/      # P3 — Cmd/Ctrl-K (built on the shortcut system)
├── onboarding/           # P7 — first-run welcome + coachmarks
├── teams/                # P8 — scaffolded but inert until Phase 8
└── (post-MVP, backend-gated) quick-access/ · tags/ · insights/   # P9 placeholders (no MVP code)
```

## 5. Where does X go?

| You're adding… | Put it in | Notes |
|---|---|---|
| A route/page | `app/(group)/.../page.tsx` | thin; render a feature screen |
| A screen/container for a route | `features/<f>/screens/` | composes the feature's components |
| A component used by **one** feature | `features/<f>/components/` | co-locate |
| A component used by **many** features | `components/patterns/` | promote only on the 2nd consumer |
| A shadcn primitive / its wrapper | `components/ui/` | pulled via shadcn MCP, then wrapped |
| Shell chrome (sidebar/topbar) | `components/layout/` | app-wide |
| A hook that calls the backend | `features/<f>/api/*.queries.ts` / `*.mutations.ts` | wraps a **factory** on `Instance` |
| A query‑key | `features/<f>/api/queryKeys.ts` | team-prefixed ([state-management](./state-management.md)) |
| A hook with **no** backend, one feature | `features/<f>/hooks/` | UI logic |
| A hook reused across features | `hooks/` | e.g. `useMediaQuery`, `useKeyboardShortcut` |
| Global cross-feature state | `stores/*.store.ts` | workspace, secureFolders, uploads, selection, ui |
| Feature-only state | `features/<f>/stores/` | keep it local |
| An API call / DTO | **don't hand-write** | use `service/factories.ts` + generated models |
| Cross-cutting infra (auth, i18n, motion, flags, telemetry, socket) | `lib/<concern>/` | no UI, no feature imports |
| A generic helper (cn, formatBytes) | `lib/utils/` | pure |
| A feature-pure helper | `features/<f>/lib/` | pure, feature-scoped |
| Env / constants / flag defaults | `config/` | `env.ts` validates `NEXT_PUBLIC_*` |
| A global/ambient type | `types/` | API DTOs are **generated**, not here |
| A unit/component test | next to the source (`*.test.ts(x)`) | e2e + setup in `tests/` |

## 6. Dependency & import boundaries (the "advanced" part — enforce it)

**One‑way dependency graph:**

```
app/  ──▶  features/  ──▶  components/  ──▶  lib/  ──▶  service/  (leaf)
                       ╲              ╲────▶  stores/ , hooks/ , config/ , types/
                        ╲────────────────▶  lib/ , service/ , stores/ , hooks/
```

Hard rules (enforce with ESLint `import/no-restricted-paths` + `boundaries`):
- `components/**`, `lib/**`, `service/**`, `stores/**`, `hooks/**` **must not import** from `features/**` or `app/**`.
- `service/**` imports nothing from the app (it's the leaf); `generates/**` is never hand‑edited.
- A feature **must not deep‑import** another feature (`features/a` → `features/b/components/X` ❌). Use `features/b`
  (its barrel) and keep cross‑feature wiring at the `app/` or shell level.
- Only **presigned S3 PUTs** (in `features/storage/upload`) make a non‑factory network call ([data-layer](./data-layer.md)).
- Everything user‑facing imports copy via `lib/i18n`, colors via tokens, motion via `lib/motion` — never raw.

**Server vs client:** prefer Server Components in `app/` and read‑only feature screens; mark interactive trees with
`'use client'` at the **feature component boundary**, not at the page. The `Instance` supports both server (RSC/route
handlers) and client session sources ([data-layer](./data-layer.md)).

## 7. Naming conventions

- Components & screens: **PascalCase** files (`FileCard.tsx`, `StorageBrowserScreen.tsx`).
- Hooks: `useThing.ts`. Stores: `thing.store.ts`. Query keys: `queryKeys.ts`.
- Barrels: `index.ts` (feature public surface).
- Pure helpers: `kebab-or-camel.ts` (e.g. `format-bytes.ts` or `formatBytes.ts` — pick one; **camelCase** chosen here).
- API **DTO fields** are PascalCase (generated); local TS is idiomatic ([CONVENTIONS §1](../00-overview/CONVENTIONS.md#1-naming)).
- Test files: `Thing.test.tsx` next to `Thing.tsx`.

## 8. Build order (which folders appear when)

| Phase | New top‑level/feature folders |
|---|---|
| **0** | `service/Instance.ts`, `lib/{api,auth,i18n,motion,flags,observability,socket,utils}`, `components/ui`, `stores/`, `config/`, route‑group skeletons under `app/`, `app/globals.css` tokens+glass |
| **1** | `features/auth`, `app/(auth)/*`, `app/api/auth` |
| **2** | `features/account`, `components/layout` (shell), `app/(app)/account/*` |
| **3** | `features/storage/*`, `components/patterns` (EmptyState/StateBoundary/ConflictDialog), `stores/{uploads,selection,ui}`, `features/command-palette` |
| **4** | `features/preview` (+`viewers/`), `features/document-editor`, intercepting `@modal` route |
| **5** | `features/secure-folders`, `stores/secureFolders` |
| **6** | `features/advanced/*`, `features/notifications` |
| **7** | `app/(public)/*`, `features/onboarding`, metadata, perf passes |
| **8** | `features/teams`, activate `stores/workspace` switch UI |
| **9** | `features/{quick-access,tags,insights}` (backend‑gated) |

## 9. Anti‑patterns (don't)
- Business logic or data fetching inside `app/` pages.
- A `utils/` dumping ground per feature with unrelated junk — keep it pure + named.
- Hand‑rolled DTOs or a parallel HTTP client (use `service/`).
- Deep cross‑feature imports; circular feature deps.
- Putting feature‑specific UI in `components/` "just in case" (promote only on real reuse).
- A second global store system or persisting secure‑folder tokens (see [secure-folder-lifecycle](./secure-folder-lifecycle.md)).
