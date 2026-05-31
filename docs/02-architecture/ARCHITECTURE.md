# Architecture — index

> Proposed **v2 frontend** architecture for `nextjs-storage` (Next 16.2 / React 19). A plan, not code. It encodes the
> locked decisions ([DECISIONS](../07-decisions/DECISIONS.md)), grounded in the old frontend's working patterns and the
> API contract ([API-INVENTORY](../05-api/API-INVENTORY.md)).
>
> ⚠ **Before any Phase‑0 code, read `node_modules/next/dist/docs/01-app/`** — this Next version has breaking changes.

## Concern map (read the one you need)

| Concern | File | One‑liner |
|---|---|---|
| **Folder structure** | [folder-structure.md](./folder-structure.md) | Feature‑sliced, layered tree + import boundaries + "where does X go?" |
| **Data layer** | [data-layer.md](./data-layer.md) | Generated client + the single axios `Instance` + envelope/error layer |
| **Interceptors** | [data-layer.md](./data-layer.md) | `service/interceptors/{session,team,secure-folder,idempotency,envelope}.ts` composed by `Instance` |
| **State** | [state-management.md](./state-management.md) | TanStack Query keys + Zustand stores |
| **Routing** | [routing-deep-linking.md](./routing-deep-linking.md) | Route groups + folder deep‑linking + preview modal routing |
| **Auth** | [auth-integration.md](./auth-integration.md) | Auth.js v5 session‑id flow |
| **Realtime** | [realtime-socket.md](./realtime-socket.md) | socket.io lifecycle + job transport |
| **Upload** | [upload-pipeline.md](./upload-pipeline.md) | Multipart/presigned queue & tray |
| **Conflicts** | [conflict-resolution.md](./conflict-resolution.md) | Reusable FAIL/REPLACE/SKIP/KEEP_BOTH |
| **Secure folders** | [secure-folder-lifecycle.md](./secure-folder-lifecycle.md) | In‑memory token lifecycle |
| **States** | [state-matrix.md](./state-matrix.md) | Per‑surface state matrix |
| **Teams** | [team-readiness.md](./team-readiness.md) | Build‑for‑now, ship‑last |

## 1. Tech stack (target)

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next 16.2** (App Router), **React 19** | read bundled docs first |
| Data fetching | **TanStack Query v5** | server cache, query keys, cancellation |
| Client state | **Zustand** | workspace + ui global; uploads/selection/viewPrefs/secureFolders feature‑local |
| HTTP | **axios** + generated `typescript-axios` client | single `Instance` |
| Auth | **Auth.js v5 (NextAuth)** credentials | session‑id flow, no refresh token to client |
| Design | **shadcn/ui** (new‑york, neutral) via **shadcn MCP** + **Tailwind v4** | premium customization |
| Motion | **framer-motion** | shared variant/token system |
| Forms | **react-hook-form** + **zod** | |
| DnD | **dnd-kit** | move‑into‑folder + (distinct) file‑drop upload |
| Realtime | **socket.io-client** | `/notifications` namespace |
| Toasts | **sonner** | + notification inbox |
| Editor | **CodeMirror 6** | text/code editing |
| Virtualization | **@tanstack/react-virtual** | large folders/lists |
| Command palette | **cmdk** (via shadcn `command`) | global ⌘K palette |
| i18n | lightweight dictionary (EN at MVP) | structure now, no hardcoded copy |
| 2FA / passkey | **qrcode.react**, **@simplewebauthn/browser** | |
| Theming | **next-themes**‑style | light/dark + system |

> Current scaffold only has `next`, `react`, `react-dom` + dev tooling installed. Everything else lands in **Phase 0**.

## 2. Folder structure {#folder-structure}

> **Summary below — the full, authoritative plan (feature‑sliced anatomy, import boundaries, "where does X go?", build
> order) is in [folder-structure.md](./folder-structure.md).**

```
app/                                  # ROUTING LAYER ONLY — thin pages/layouts
  layout.tsx · globals.css · providers.tsx · not-found.tsx · error.tsx
  sitemap.ts · robots.ts · manifest.ts · opengraph-image.tsx   # delegate to lib/seo
  (public)/                           # P7 marketing
  (auth)/                             # P1
  (app)/                              # P2+: layout mounts <AppShellClient>
    storage/[[...path]]/              # P3 catch-all; @modal/(.)preview/[key] intercepting (P4)
    account/{profile,security,subscription}/
    notifications/
  api/auth/[...nextauth]/route.ts     # only app/api at MVP
proxy.ts · instrumentation.ts    # ~5-line shims → lib/{auth,observability}/
features/                             # DOMAIN FEATURES — flat root, black-box modules
  auth/ account/ shell/ storage/ command-palette/ preview/ document-editor/
  secure-folders/ advanced/ notifications/ onboarding/ marketing/ teams/ post-mvp/
  # storage   = browse/ upload/ operations/ search/ shared/
  # account   = profile/ security/ subscription/
  # advanced  = duplicate-scan/ archive/ av-status/
  # post-mvp  = quick-access/ tags/ insights/
components/
  ui/                                 # shadcn primitives (via MCP) + premium wrappers + index.ts
  patterns/                           # empty-state, state-boundary, conflict-dialog, confirm-destructive, data-table
  icons/                              # custom SVG only
lib/
  api/                                # ApiError, envelope, query-keys, invalidators, error-toast, idempotency, abort, pagination
  auth/                               # config, server, client, guards, proxy
  i18n/                               # config, t, dictionaries/en.json
  motion/                             # tokens, variants, useReducedMotion
  flags/ observability/ socket/ shortcuts/ seo/ validation/ utils/
service/                              # GENERATED CLIENT + Instance — LEAF
  Instance.ts                         # ~30 lines, composes interceptors
  factories.ts                        # XxxApiFactory(undefined, undefined, Instance)
  models.ts                           # curated re-exports of generated DTOs
  token-sources.ts                    # registerSecureFolder/Session/Team — INVERTED-DEPS SEAM
  interceptors/                       # session, team, secure-folder, idempotency, envelope
  generates/                          # GENERATED — never hand-edit, eslint-ignored
stores/                               # GLOBAL Zustand — only workspace + ui at MVP
  workspace.store.ts · ui.store.ts
hooks/                                # cross-feature; promote on 2nd consumer
config/{env,constants,flags.defaults}.ts
types/{env,next-auth,global}.d.ts
public/                               # favicon BURAYA, not app/
tests/                                # setup, test-utils, fixtures, msw/{server,handlers}, e2e
```

> **Instance location note:** `service/factories.ts` imports `./Instance` (i.e. `service/Instance.ts`), so the **Instance
> lives at `service/Instance.ts`** — the **factory import wins**. Earlier drafts said `lib/api/Instance.ts`; that's dead.
> The Instance is ~30 lines and just composes the interceptors in `service/interceptors/{session,team,secure-folder,idempotency,envelope}.ts`.
> Error‑mapping and query‑key helpers stay in `lib/api`. To keep `service/` a true leaf (no `@/features/*` imports), the
> secure‑folder token is read through an **inverted‑deps seam at `service/token-sources.ts`** — `registerSecureFolderTokenSource`
> (and Session/Team variants) are wired from `app/providers.tsx`. Recorded in [DECISIONS](../07-decisions/DECISIONS.md).

## 3. How the pieces connect (request lifecycle)

```
component ── useQuery/useMutation ──> typed hook ──> factory(req, {signal}) ──> Instance
                                                                                  │  request pipeline (interceptor split):
                                                                                  │    session → team → secure-folder → idempotency → envelope
                                                                                  │    (+X-Session-Id, +X-Team-Id, +folder/hidden, +Idempotency-Key (UUID v7))
   plain typed Result  <───────────────────────────────────────────────────────┘  response: unwrap Result · map errors → ApiError → toast
                                                                                              · 401 → signOut · 403 / 409 passthrough to feature handlers
```

Each request interceptor is its own file under `service/interceptors/` — never a 200‑line monolith. The `Instance` just
composes them in order. Everything else in this folder elaborates one stage of that line. Start with
[data-layer.md](./data-layer.md).

## 4. Engineering hygiene
Testing (unit + component for the Instance/stores/hooks; happy‑path e2e), lint/format/commit + CI, SEO/metadata + route
error/suspense boundaries, performance budget. Details live in [`../06-cross-cutting/`](../06-cross-cutting/testing.md).
