# Folder Structure

> The authoritative folder plan for the v2 frontend. **Strict feature-sliced + hard barrels + one-way graph**, enforced
> by ESLint at P0. [`ARCHITECTURE.md`](./ARCHITECTURE.md#folder-structure) keeps a short summary that links here.
> Conventions: [`CONVENTIONS.md`](../00-overview/CONVENTIONS.md). Decisions: [`DECISIONS.md`](../07-decisions/DECISIONS.md).
>
> Path alias: **`@/*` → repo root** (tsconfig). No `src/`. Package manager: **bun**.

## 1. Principles

1. **Uniform feature anatomy.** Every `features/<f>/` (and every nested sub-feature) has the **same 9-line shape**.
   Muscle-memory navigation — you never hunt for where a thing lives.
2. **Hard barrels.** A feature is a black box. Outside code may import **only** its `index.(ts|tsx)`. Deep imports
   (`@/features/storage/upload/...`) are an ESLint error.
3. **One-way graph.** `app → features → (components, lib, service, stores, hooks, config, types)`. Lower never imports
   up. `service/` is a leaf — it never imports `@/features/*`.
4. **Co-location, then promotion.** A thing lives next to its single consumer. It only moves up a layer when a
   *second* consumer appears — never preemptively.
5. **Barrel boilerplate is the price.** We accept verbose `index.ts` re-export lists in exchange for enforced
   encapsulation. `export *` is banned (AST rule) — every public symbol is listed by name.

## 2. Top-level tree

```
nextjs-storage/
├── app/                                  # ROUTING LAYER ONLY — thin pages, layouts
│   ├── layout.tsx                        # root <html>, mounts <Providers/>
│   ├── globals.css                       # Tailwind v4 @theme — SINGLE token source
│   ├── providers.tsx                     # 'use client': Query/Session/Theme/Motion/Toaster + token-source registers
│   ├── not-found.tsx · error.tsx
│   ├── sitemap.ts · robots.ts · manifest.ts · opengraph-image.tsx   # delegate to lib/seo
│   ├── (public)/    # P7 marketing
│   ├── (auth)/      # P1
│   ├── (app)/       # P2+: layout.tsx (server) mounts <AppShellClient>
│   │   ├── storage/[[...path]]/  # P3 catch-all; @modal/(.)preview/[key]/page.tsx intercepting (P4)
│   │   ├── account/{profile,security,subscription}/page.tsx
│   │   └── notifications/page.tsx
│   └── api/auth/[...nextauth]/route.ts   # ONLY app/api at MVP
│
├── proxy.ts                              # ~5-line shim → lib/auth/proxy (Next 16.2 rename of middleware.ts; exports `proxy`)
├── instrumentation.ts                    # ~5-line shim → lib/observability/instrumentation
│
├── features/                             # DOMAIN FEATURES — flat root, black-box modules
│   ├── auth/account/shell/storage/command-palette/preview/document-editor/secure-folders/
│   ├── advanced/notifications/onboarding/marketing/teams/post-mvp/
│   # storage = nested sub-features: browse/upload/operations/search/shared/
│   # account = nested: profile/security/subscription/
│   # advanced = nested: duplicate-scan/archive/
│   # post-mvp = nested: quick-access/tags/insights/
│
├── components/
│   ├── ui/                               # shadcn primitives (via MCP) + premium wrappers + index.ts
│   ├── patterns/{empty-state,state-boundary,conflict-dialog,confirm-destructive,data-table}/
│   └── icons/                            # custom SVG only
│
├── lib/
│   ├── api/{ApiError,envelope,query-keys,invalidators,error-toast,idempotency,abort,pagination}.ts
│   ├── auth/{config,server,client,guards,proxy}.ts
│   ├── i18n/{config,t,dictionaries/en.json}
│   ├── motion/{tokens,variants,useReducedMotion}.ts
│   ├── flags/{registry,useFlag}.ts
│   ├── observability/{reporter,events,instrumentation}.ts
│   ├── socket/{client,types}.ts
│   ├── validation/primitives.ts          # GLOBAL zod primitives
│   ├── shortcuts/{registry,useShortcut}.ts
│   ├── seo/{metadata,sitemap,robots,manifest,og}.ts
│   └── utils/{cn,format-bytes,format-date,paths}.ts
│
├── service/                              # GENERATED CLIENT + Instance — LEAF
│   ├── Instance.ts                       # ~30 lines, composes interceptors
│   ├── factories.ts                      # XxxApiFactory(undefined, undefined, Instance)
│   ├── models.ts                         # curated re-exports of generated DTOs
│   ├── token-sources.ts                  # registerSecureFolderTokenSource / Session / Team — INVERTED-DEPS SEAM
│   ├── interceptors/{session,team,secure-folder,idempotency,envelope}.ts
│   └── generates/                        # GENERATED — never hand-edit, eslint-ignored
│
├── stores/{workspace,ui}.store.ts        # GLOBAL Zustand (only these qualify at MVP)
├── hooks/                                # cross-feature, promote on 2nd consumer
├── config/{env,constants,flags.defaults}.ts
├── types/{env,next-auth,global}.d.ts
├── public/{favicon.ico,images/}          # favicon BURAYA, app/ değil
│
├── tests/
│   ├── setup.ts · test-utils.tsx         # renderWithProviders
│   ├── fixtures/<resource>.fixtures.ts   # @/service/models tipli — hand-rolled DTO YOK
│   ├── msw/{server,handlers/}
│   └── e2e/
│
├── docs/07-decisions/<NNN>-<slug>.md     # ADR'ler — 3 haneli, kebab-case
├── .claude/
├── eslint.config.mjs                     # boundaries + entry-point + no-restricted-* rules
└── tsconfig.json · next.config.ts · components.json · openapitools.json · package.json · bun.lock
```

## 3. `app/` — routing layer

`app/` is **routing + composition only**. A `page.tsx` reads params, renders a feature `*Screen`, sets metadata. No
business logic, no data fetching outside the screen.

### Route groups
- **`(public)/`** — marketing (P7). Public layout.
- **`(auth)/`** — login / register / reset (P1). Minimal layout.
- **`(app)/`** — authenticated shell (P2+). `layout.tsx` is a Server Component that mounts `<AppShellClient/>` from
  `features/shell`.

### Catch-all + intercepting route
- **`(app)/storage/[[...path]]/page.tsx`** — folder deep-linking via catch-all (P3).
- **`(app)/storage/[[...path]]/@modal/(.)preview/[key]/page.tsx`** — intercepting route for the deep-linkable
  preview modal (P4). Driven by `features/preview`.

### `/api` at MVP
Exactly one route handler ships at MVP: **`app/api/auth/[...nextauth]/route.ts`** (Auth.js). All other backend traffic
goes through `service/factories.ts` on the shared `Instance` ([data-layer](./data-layer.md)).

### Layout policy
- `layout.tsx` and `page.tsx` are **Server Components** (exceptions: `error.tsx`, `providers.tsx`).
- `providers.tsx` is `'use client'` — mounts Query/Session/Theme/Motion/Toaster and **registers token-sources**
  into `service/token-sources.ts`.
- Root seams `sitemap.ts`, `robots.ts`, `manifest.ts`, `opengraph-image.tsx` are ~5-line shims that delegate to
  `lib/seo/*`. Same for `proxy.ts` (Next 16.2 rename of `middleware.ts`; exports `proxy`) → `lib/auth/proxy` and `instrumentation.ts` → `lib/observability/instrumentation`.

## 4. `features/<name>/` — fixed anatomy

Every feature (and every nested sub-feature) uses **the same 9-line shape**:

```
features/<feature>/
├── components/        # feature UI
├── screens/           # *Screen.tsx — route'un render ettiği container
├── hooks/             # UI logic + data hook wrapper'ları (public surface)
├── api/
│   ├── <feature>.queries.ts    # useQuery + prefetch<Resource>(qc, params)
│   ├── <feature>.mutations.ts  # useMutation (optimistic + targeted invalidate)
│   ├── queryKeys.ts            # scopedKey(scope, ...) via lib/api/query-keys
│   └── index.ts
├── stores/            # feature-LOCAL Zustand (uploads, selection, viewPrefs, secureFolders)
├── lib/               # feature-pure helpers + validation/ (zod)
├── types.ts           # feature-LOCAL UI types — NEVER DTO
├── constants.ts
└── index.ts           # PUBLIC BARREL — explicit named re-exports, NO export *
```

Not every folder is required — add one when it earns its place. When present, it goes **exactly here**, named like this.

### Worked example: `features/storage/` with nested sub-features

`storage` is the canonical nested feature — each sub-feature is itself a full feature with its own anatomy and
its own `index.ts`. The parent `features/storage/index.ts` re-exports from sub-barrels by name.

```
features/storage/
├── browse/                          # P3 — list + smart grid + virtualization
│   ├── components/{FileGrid,FileRow,Breadcrumb}.tsx
│   ├── screens/StorageBrowserScreen.tsx
│   ├── hooks/{useFolderContents,useBreadcrumb}.ts
│   ├── api/{browse.queries.ts,browse.mutations.ts,queryKeys.ts,index.ts}
│   ├── stores/viewPrefs.store.ts    # feature-local, sessionStorage
│   ├── lib/path.ts
│   ├── types.ts · constants.ts
│   └── index.ts
├── upload/                          # P3 — multipart pipeline + UploadTray
│   ├── components/{UploadTray,UploadRow}.tsx
│   ├── hooks/useUploader.ts
│   ├── api/
│   │   ├── upload.queries.ts
│   │   ├── upload.mutations.ts
│   │   ├── presigned-put.ts          # THE ONE allowlisted fetch — S3 PUT only
│   │   ├── queryKeys.ts · index.ts
│   ├── stores/uploads.store.ts       # feature-local
│   ├── lib/{chunking,checksum}.ts
│   └── index.ts
├── operations/                      # P3 — create/rename/move/delete + multi-select + bulk + dnd
│   ├── components/{ConfirmDeleteDialog,MoveDialog}.tsx
│   ├── hooks/{useSelection,useBulkOps}.ts
│   ├── api/{operations.mutations.ts,queryKeys.ts,index.ts}
│   ├── stores/selection.store.ts     # feature-local
│   └── index.ts
├── search/                          # P3 — scope + filter + sort
│   ├── components/SearchInput.tsx
│   ├── hooks/useSearch.ts
│   ├── api/{search.queries.ts,queryKeys.ts,index.ts}
│   └── index.ts
├── shared/                          # storage-internal primitives
│   ├── components/{FileIcon,UsageBar}.tsx
│   ├── lib/mime.ts
│   └── index.ts                      # NOT re-exported by parent — storage-internal
└── index.ts                          # parent barrel: named re-exports from browse/upload/operations/search
```

Same nested pattern for `account/{profile,security,subscription}`, `advanced/{duplicate-scan,archive}`,
and `post-mvp/{quick-access,tags,insights}`.

> **`shared/` is storage-internal.** The parent `features/storage/index.ts` deliberately does **not** re-export
> from `shared/` — its symbols are only for use by sibling sub-features. If a `shared/` symbol is needed across
> features, promote it to `components/patterns/` or `lib/` first.

## 5. Public surfaces & barrels

**Rule: explicit named re-exports only. `export *` is an AST-blocked ESLint error.**

This is the price we pay for hard encapsulation: every public symbol is listed by name in the feature's `index.ts`.
Adding a public symbol is a deliberate act, not an accident of a glob export.

### Template: `features/storage/index.ts`

```ts
// Screens (mounted by app/(app)/storage/[[...path]]/page.tsx)
export { StorageBrowserScreen } from './browse/screens/StorageBrowserScreen';

// Sub-feature public surfaces (named re-exports only — never `export *`)
export {
  UploadTray,
  useUploader,
} from './upload';

export {
  useSelection,
  useBulkOps,
  ConfirmDeleteDialog,
  MoveDialog,
} from './operations';

export {
  SearchInput,
  useSearch,
} from './search';

export {
  useFolderContents,
  useBreadcrumb,
  Breadcrumb,
} from './browse';

// NOTE: nothing from ./shared — storage-internal only.
```

Each sub-feature `index.ts` follows the same explicit pattern. The boundaries plugin enforces that no other code
may bypass these barrels — `@/features/storage/upload/stores/uploads.store` is a hard error.

## 6. Where does X go?

| You're adding… | Put it in | Notes |
|---|---|---|
| A route/page | `app/(group)/.../page.tsx` | thin; reads params, renders feature screen, sets metadata |
| A screen/container for a route | `features/<f>/screens/*Screen.tsx` | composes feature components |
| A component used by **one** feature | `features/<f>/components/` | co-locate |
| A component used by **many** features | `components/patterns/` | promote only on the 2nd consumer |
| A shadcn primitive / wrapper | `components/ui/` | via shadcn MCP, then wrapped — see [design-system](../03-design-system/DESIGN-SYSTEM.md) |
| App shell (Sidebar, Topbar, CommandBar slot) | `features/shell/components/` | shell IS a feature now (not `components/layout/`) |
| Workspace switcher | `features/shell/components/WorkspaceSwitcher.tsx` | inert until P8 |
| Custom SVG icon | `components/icons/` | custom only — shadcn/lucide stay in their packages |
| A hook that calls the backend | `features/<f>/api/<f>.queries.ts` / `*.mutations.ts` | wraps a **factory** on `Instance` |
| A query-key | `features/<f>/api/queryKeys.ts` | uses `scopedKey()` from `lib/api/query-keys` |
| A `prefetch<Resource>(qc, params)` helper | `features/<f>/api/<f>.queries.ts` | co-locates with the query |
| A hook with no backend, one feature | `features/<f>/hooks/` | UI logic |
| A hook reused across features | `hooks/` | e.g. `useMediaQuery` — promote on 2nd consumer |
| Cross-feature shortcut binding | `lib/shortcuts/` + `useShortcut` | registry + hook |
| **Global** cross-feature state | `stores/{workspace,ui}.store.ts` | **only these two qualify at MVP** |
| Feature-local state (uploads) | `features/storage/upload/stores/uploads.store.ts` | NOT global |
| Feature-local state (selection) | `features/storage/operations/stores/selection.store.ts` | NOT global |
| Feature-local state (viewPrefs) | `features/storage/browse/stores/viewPrefs.store.ts` | sessionStorage |
| Secure-folder token state | `features/secure-folders/stores/secureFolders.store.ts` | in-memory ONLY — see [secure-folder-lifecycle](./secure-folder-lifecycle.md) |
| An API call / DTO | **don't hand-write** | use `service/factories.ts` + `@/service/models` |
| New `ApiError` / envelope helper | `lib/api/{ApiError,envelope}.ts` | shared |
| Idempotency key | `lib/api/idempotency.ts` (`newIdempotencyKey`, UUID v7) | single source |
| AbortSignal composer / timeout | `lib/api/abort.ts` (`composeSignals`, `withTimeout`) | single source |
| Pagination helper | `lib/api/pagination.ts` | shared |
| Error → toast mapping | `lib/api/error-toast.ts` | wired by `Instance` |
| Query-key factory | `lib/api/query-keys.ts` (`scopedKey(scope, ...)`) | drives team scoping — see [team-readiness](./team-readiness.md) |
| Invalidation helpers | `lib/api/invalidators.ts` | named invalidators per resource |
| Interceptor (session/team/etc.) | `service/interceptors/<name>.ts` | composed in `service/Instance.ts` |
| Token-source registration seam | `service/token-sources.ts` | called from `app/providers.tsx` — service never imports features |
| Auth.js config / server / client | `lib/auth/{config,server,client,guards,proxy}.ts` | `server.ts` and `proxy.ts` are `import 'server-only'` |
| i18n key + EN copy | `lib/i18n/dictionaries/en.json` (+ `t()`) | no inline strings — see [i18n](../06-cross-cutting/i18n.md) |
| Motion variant / token | `lib/motion/{variants,tokens}.ts` | gate with `useReducedMotion` |
| Feature flag | `lib/flags/registry.ts` + `useFlag` | defaults in `config/flags.defaults.ts` |
| Telemetry event | `lib/observability/events.ts` | typed catalog |
| Socket client / types | `lib/socket/{client,types}.ts` | consumed by `features/notifications` |
| Global zod primitives | `lib/validation/primitives.ts` | feature-local zod stays in `features/<f>/lib/validation/` |
| SEO metadata / sitemap / og | `lib/seo/*` | app root files are shims |
| A generic helper (cn, formatBytes) | `lib/utils/` | pure |
| A feature-pure helper | `features/<f>/lib/` | pure, feature-scoped |
| Env / constants / flag defaults | `config/{env,constants,flags.defaults}.ts` | `env.ts` validates `NEXT_PUBLIC_*` |
| Global ambient TS type | `types/{env,next-auth,global}.d.ts` | API DTOs are generated |
| Favicon | `public/favicon.ico` | **not** `app/` |
| A unit/component test | next to source as `*.test.ts(x)` | shared setup in `tests/` — see [testing](../06-cross-cutting/testing.md) |
| Test fixtures | `tests/fixtures/<resource>.fixtures.ts` | typed via `@/service/models` — no hand-rolled DTOs |
| MSW handlers | `tests/msw/handlers/` | server in `tests/msw/server.ts` |
| E2E spec | `tests/e2e/` | |
| ADR | `docs/07-decisions/<NNN>-<slug>.md` | 3-digit, kebab-case |

## 7. Import boundaries

These are the **10 hard rules**, ESLint-pinned at P0 (full error, not warn).

1. **One-way graph.** `app → features → (components, lib, service, stores, hooks, config, types)`. Lower never
   imports up. Features may import sibling features only via their public barrel.
2. **Hard barrels.** A feature or sub-feature is entered **only** through its `index.(ts|tsx)`. Enforced by
   `boundaries/entry-point`.
3. **No deep cross-feature import.** `@/features/<x>` is allowed; `@/features/<x>/upload/...` is forbidden.
4. **No raw HTTP.** `axios` import banned. `fetch(` banned. **Sole exception:**
   `features/storage/upload/api/presigned-put.ts` (allowlisted by file override).
5. **No hand-rolled DTOs.** Type names matching `/.*(Dto|Request|Response)$/` are AST-blocked in
   `features/**/api/**` and `features/**/types.ts`. Direct import from `@/service/generates/*` is forbidden —
   re-export through `@/service/models`.
6. **`service/` is a leaf.** It never imports `@/features/*`. The secure-folder token is read via an inverted-deps
   seam: `service/token-sources.ts` exposes `registerSecureFolderTokenSource(getter)`, which `app/providers.tsx`
   calls with the real getter at app boot.
7. **No raw hex.** Literal `/^#[0-9a-fA-F]{3,8}$/` banned outside `app/globals.css`, `lib/motion/**`, and
   `components/ui/**`. Inline copy heuristic: any 3+ word JSX string must go through `t()`.
8. **Team UI inert before P8.** `features/teams/index.ts` exports no UI symbols pre-P8, but `stores/workspace.store.ts`
   has been wired to the `X-Team-Id` interceptor since P0 — see [team-readiness](./team-readiness.md).
9. **No `export *`.** AST rule. Every public symbol is listed by name in its barrel.
10. **Secure-folder store special rules.** In `features/secure-folders/stores/secureFolders.store.ts`:
    `zustand/middleware`'s `persist` is forbidden, and `localStorage` / `sessionStorage` / `document.cookie`
    references are AST-blocked. See [secure-folder-lifecycle](./secure-folder-lifecycle.md).

> **NOTE:** all 10 rules are enforced by `eslint.config.mjs` (see the appendix below). They are not stylistic
> guidance — CI fails on violation.

## 8. Naming conventions

- **Components & screens:** PascalCase files (`FileCard.tsx`, `StorageBrowserScreen.tsx`). Screens end in `Screen`.
- **Hooks:** `useThing.ts`.
- **Stores:** `thing.store.ts` (e.g. `uploads.store.ts`, `selection.store.ts`, `workspace.store.ts`).
- **Query keys file:** `queryKeys.ts`. Builders use `scopedKey(scope, ...)` from `lib/api/query-keys`.
- **Feature data files:** `<feature>.queries.ts`, `<feature>.mutations.ts`.
- **Barrels:** `index.ts` (or `index.tsx` when the public surface includes JSX).
- **Pure helpers:** `kebab-case.ts` in `lib/utils/` (e.g. `format-bytes.ts`, `format-date.ts`). Inside features,
  camelCase is fine.
- **API DTO fields:** PascalCase (generated). Local UI types use idiomatic TS — see
  [CONVENTIONS §1](../00-overview/CONVENTIONS.md#1-naming).
- **Test files:** `Thing.test.tsx` next to `Thing.tsx`.
- **ADRs:** `docs/07-decisions/<NNN>-<slug>.md` — 3-digit, kebab-case.

## 9. Build order

| Phase | New folders / files |
|---|---|
| **P0** | `service/Instance.ts` + `service/interceptors/*` + `service/token-sources.ts`, `lib/{api,auth,i18n,motion,flags,observability,socket,shortcuts,seo,utils}/*`, `lib/validation/primitives.ts`, `components/ui` (button/dialog/dropdown-menu/command/tooltip/input/sonner via shadcn MCP), `stores/{workspace,ui}.store.ts`, `config/*`, `types/*`, `app/providers.tsx`, route-group skeletons, `app/{sitemap,robots,manifest,opengraph-image}`, `proxy.ts` (Next 16.2 rename of `middleware.ts`; exports `proxy`), `instrumentation.ts`, `eslint.config.mjs` (FULL ENFORCE), `tests/*` |
| **P1** | `features/auth/`, `app/(auth)/*`, `app/api/auth/[...nextauth]/route.ts` |
| **P2** | `features/account/{profile,security,subscription}/`, `features/shell/`, `app/(app)/account/*` |
| **P3** | `features/storage/{browse,upload,operations,search,shared}/`, `features/command-palette/`, `components/patterns/*`, feature-local stores (uploads, selection, viewPrefs) |
| **P4** | `features/preview/viewers/*`, `features/document-editor/`, intercepting route `@modal/(.)preview/[key]` |
| **P5** | `features/secure-folders/` (in-memory store, ancestor-aware) — `registerSecureFolderTokenSource` wired to real getter |
| **P6** | `features/advanced/{duplicate-scan,archive}/`, `features/notifications/` |
| **P7** | `features/marketing/*`, `features/onboarding/`, `app/(public)/*` |
| **P8** | `features/teams/` activated; `WorkspaceSwitcher` exposed |
| **P9** | `features/post-mvp/{quick-access,tags,insights}/` |

## 10. Server vs client policy

1. `app/**/{layout,page}.tsx` are **Server Components**.
2. Exceptions: `error.tsx` (must be client) and `providers.tsx` (`'use client'`).
3. `features/<f>/screens/*Screen.tsx` are Server Components; they mount `<*Client>` children at the interactive boundary.
4. `'use client'` lives at the **feature component boundary**, not in the page.
5. `lib/auth/server.ts` and `lib/auth/proxy.ts` start with `import 'server-only'`.
6. `service/Instance.ts` is **isomorphic** — on the server it reads from the registered session source, on the client
   it reads from Auth.js session.
7. `proxy.ts` (Next 16.2 rename of `middleware.ts`; exports `proxy`) and `instrumentation.ts` at repo root are ≤10-line shims; real logic lives in `lib/`.
8. Root SEO files (`sitemap.ts`, `robots.ts`, `manifest.ts`, `opengraph-image.tsx`) are shims that delegate to `lib/seo/*`.
9. `(app)/layout.tsx` is a Server Component that mounts `<AppShellClient/>` from `features/shell`.
10. Data fetching inside a Server Component goes through `service/factories.ts` like any other call — the `Instance`
    works in RSC. See [data-layer](./data-layer.md).
11. Stores (`stores/*`, `features/*/stores/*`) are client-only by definition; never import them from a Server Component.

## 11. Anti-patterns prevented

- **Deep cross-feature imports** — `boundaries/entry-point` blocks any path other than a feature's `index.(ts|tsx)`.
- **A second HTTP client** — `axios` import banned via `no-restricted-imports`; raw `fetch(` banned via
  `no-restricted-syntax` (single allowlisted file for S3 PUT).
- **Hand-rolled DTOs** — `*Dto` / `*Request` / `*Response` type names blocked by AST rule in feature `api/` and `types.ts`.
- **Importing generated client directly** — `@/service/generates/*` blocked; must go through `@/service/models`.
- **`export *` barrels** — AST rule. Every public symbol is named.
- **Raw hex colors in components** — AST rule (with carved-out files for tokens + motion + ui primitives).
- **Inline user-facing copy** — convention + review; all copy via `t()`.
- **Second global store system** — only `stores/{workspace,ui}.store.ts` are global. Everything else is feature-local.
- **Persisted secure-folder tokens** — `persist`, `localStorage`, `sessionStorage`, `document.cookie` all blocked in
  the secure-folder store file.
- **`service/` reaching into features** — boundaries config disallows it; secure-folder token uses the inverted-deps seam.
- **Team UI shipping early** — `features/teams/index.ts` exports no UI pre-P8; the team scope plumbing is already live.
- **Business logic in `app/`** — `app/` may only import `feature/components/lib/service/stores/hooks/config/types` and
  pages are constrained to render screens.
- **Hidden shell ownership** — shell is a feature (`features/shell`), not a stray `components/layout/` folder.

## 12. Migration plan from current scaffold (P0 steps in order)

The current `v2` branch scaffold predates this plan. P0 brings it into compliance in this order:

1. **Add `eslint.config.mjs`** with the full rule set (appendix). Land it failing — the next steps fix the failures.
2. **Move `Instance` to `service/Instance.ts`** if it currently lives under `lib/api/`. Update `service/factories.ts`
   to import from the new location. (Decision logged in [DECISIONS.md](../07-decisions/DECISIONS.md).)
3. **Split interceptors** into `service/interceptors/{session,team,secure-folder,idempotency,envelope}.ts`. Compose
   them in `Instance.ts` (~30 lines).
4. **Create `service/token-sources.ts`** with `registerSessionSource`, `registerTeamSource`,
   `registerSecureFolderTokenSource`. Wire them from `app/providers.tsx`. Remove any direct `service/` → `features/` imports.
5. **Add `service/models.ts`** as the curated re-export surface for generated DTOs. Replace any
   `@/service/generates/*` import with `@/service/models`.
6. **Add `lib/api/{ApiError,envelope,query-keys,invalidators,error-toast,idempotency,abort,pagination}.ts`**. The
   query-key factory exports `scopedKey(scope, ...)`; idempotency uses UUID v7.
7. **Add `lib/{auth,i18n,motion,flags,observability,socket,shortcuts,seo,validation,utils}/`** per the tree.
8. **Replace `components/layout/`** with `features/shell/` (AppShell, Sidebar, Topbar, BreadcrumbSlot, CommandBarSlot,
   WorkspaceSwitcher). Delete the old folder.
9. **Promote stores to feature-local where appropriate.** `uploads`, `selection`, `viewPrefs`, `secureFolders` move
   out of `stores/` and into their owning features. Only `stores/workspace.store.ts` and `stores/ui.store.ts` remain
   global.
10. **Add `app/providers.tsx`** and rewrite `app/layout.tsx` to mount it. Move existing client-only setup into providers.
11. **Add root file shims**: `proxy.ts` (Next 16.2 rename of `middleware.ts`; exports `proxy`), `instrumentation.ts`, and `app/{sitemap,robots,manifest,opengraph-image}.tsx`,
    each delegating to `lib/`.
12. **Move favicon to `public/favicon.ico`** (out of `app/`).
13. **Add `tests/` scaffolding**: `setup.ts`, `test-utils.tsx` (renderWithProviders), `fixtures/`, `msw/{server,handlers}/`,
    `e2e/`. Wire scripts per [testing](../06-cross-cutting/testing.md).
14. **Resolve ESLint failures** from step 1. P0 closes only when CI is green with the full rule set.

After P0, every subsequent phase only adds folders under `features/` and `app/` — the cross-cutting layer is locked.

---

## Appendix: `eslint.config.mjs` (drop-in at P0)

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**','out/**','build/**','next-env.d.ts','service/generates/**']),

  {
    plugins: { boundaries, import: importPlugin },
    settings: {
      'boundaries/elements': [
        { type: 'app',        pattern: 'app/**' },
        { type: 'proxy',      pattern: '(proxy|instrumentation).ts' },
        { type: 'feature',    pattern: 'features/*',   mode: 'folder', capture: ['name'] },
        { type: 'subfeature', pattern: 'features/*/*', mode: 'folder', capture: ['parent','name'] },
        { type: 'components', pattern: 'components/**' },
        { type: 'lib',        pattern: 'lib/**' },
        { type: 'service',    pattern: 'service/**' },
        { type: 'stores',     pattern: 'stores/**' },
        { type: 'hooks',      pattern: 'hooks/**' },
        { type: 'config',     pattern: 'config/**' },
        { type: 'types',      pattern: 'types/**' },
        { type: 'tests',      pattern: 'tests/**' },
      ],
      'boundaries/include': ['app/**','proxy.ts','instrumentation.ts','features/**','components/**','lib/**','service/**','stores/**','hooks/**','config/**','types/**','tests/**'],
    },
    rules: {
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          { from: 'app',        allow: ['feature','components','lib','service','stores','hooks','config','types'] },
          { from: 'proxy',      allow: ['lib','config','types'] },
          { from: 'feature',    allow: ['feature','subfeature','components','lib','service','stores','hooks','config','types'] },
          { from: 'subfeature', allow: ['feature','subfeature','components','lib','service','stores','hooks','config','types'] },
          { from: 'components', allow: ['components','lib','hooks','config','types'] },
          { from: 'lib',        allow: ['lib','service','config','types'] },
          { from: 'service',    allow: ['service','config','types'] },
          { from: 'stores',     allow: ['lib','service','config','types'] },
          { from: 'hooks',      allow: ['lib','service','stores','config','types'] },
          { from: 'tests',      allow: ['app','feature','components','lib','service','stores','hooks','config','types'] },
        ],
      }],
      'boundaries/entry-point': ['error', {
        default: 'disallow',
        rules: [
          { target: 'feature',    allow: 'index.(ts|tsx)' },
          { target: 'subfeature', allow: 'index.(ts|tsx)' },
        ],
      }],
      'no-restricted-imports': ['error', {
        paths: [{ name: 'axios', message: 'Use @/service/factories on shared Instance.' }],
        patterns: [
          { group: ['axios/*'] },
          { group: ['@/service/generates/*'], message: 'Import via @/service/models.' },
          { group: ['@/features/*/!(index)','@/features/*/*/!(index)'], message: 'Feature barrel only.' },
        ],
      }],
      'no-restricted-syntax': ['error',
        { selector: "CallExpression[callee.name='fetch']", message: 'Use @/service/factories. Exception: features/storage/upload/api/presigned-put.ts.' },
        { selector: 'ExportAllDeclaration', message: 'Named re-exports only.' },
        { selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]", message: 'No raw hex. Use semantic tokens.' },
      ],
    },
  },
  { files: ['features/storage/upload/api/presigned-put.ts'], rules: { 'no-restricted-syntax': ['error', { selector: 'ExportAllDeclaration' }] } },
  { files: ['app/globals.css','lib/motion/**','components/ui/**'], rules: { 'no-restricted-syntax': ['error', { selector: 'ExportAllDeclaration' }] } },
  { files: ['service/generates/**'], rules: { 'boundaries/element-types': 'off', 'boundaries/entry-point': 'off' } },
  // service/models.ts is the SOLE allowlisted export * (D-F18); generates/ is generator output
  {
    files: ['service/models.ts', 'service/generates/**'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  { files: ['features/**/api/**','features/**/types.ts'], rules: {
      'no-restricted-syntax': ['error',
        { selector: "TSInterfaceDeclaration[id.name=/.*(Dto|Request|Response)$/]", message: 'DTOs are generated.' },
        { selector: "TSTypeAliasDeclaration[id.name=/.*(Dto|Request|Response)$/]", message: 'DTOs are generated.' },
      ],
    } },
  { files: ['features/secure-folders/stores/secureFolders.store.ts'], rules: {
      'no-restricted-imports': ['error', { paths: [{ name: 'zustand/middleware', importNames: ['persist'], message: 'In-memory only.' }] }],
      'no-restricted-syntax': ['error',
        { selector: "MemberExpression[object.name='localStorage']" },
        { selector: "MemberExpression[object.name='sessionStorage']" },
        { selector: "MemberExpression[object.property.name='cookie']" },
      ],
    } },
]);
```
