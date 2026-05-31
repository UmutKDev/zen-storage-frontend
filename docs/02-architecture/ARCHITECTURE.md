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
| Client state | **Zustand** | workspace, secureFolders, uploads, selection, ui |
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
| i18n | lightweight dictionary (EN at MVP) | structure now, no hardcoded copy |
| 2FA / passkey | **qrcode.react**, **@simplewebauthn/browser** | |
| Theming | **next-themes**‑style | light/dark + system |

> Current scaffold only has `next`, `react`, `react-dom` + dev tooling installed. Everything else lands in **Phase 0**.

## 2. Folder structure {#folder-structure}

> **Summary below — the full, authoritative plan (feature‑sliced anatomy, import boundaries, "where does X go?", build
> order) is in [folder-structure.md](./folder-structure.md).**

```
app/                         # routes (App Router)
  (public)/                  # landing, features, pricing       — public layout
  (auth)/                    # login, register, reset           — auth layout
  (app)/                     # authenticated shell
    storage/[[...path]]/     # folder deep-linking (catch-all)
    account/                 # profile, security, sessions, subscription
  api/auth/[...nextauth]/    # Auth.js route handler
lib/
  api/                       # error mapping, envelope unwrap, query-keys (Instance: see note)
  auth/                      # session helpers, nextauth config
  i18n/                      # dictionaries + t()
  motion/                    # variants, tokens, reduced-motion
  utils/
service/
  Instance.ts                # the axios instance factories are built on  (NEW in Phase 0)
  factories.ts               # generated factories on Instance (exists; imports ./Instance)
  generates/                 # GENERATED — never hand-edit (exists, committed)
features/
  storage/                   # browser (list/grid), upload, conflict, secure-folders, duplicate, archive
  preview/                   # FilePreviewModal, version history, image CDN
  document-editor/           # CodeMirror + lock/draft/diff
  notifications/             # socket provider + inbox
  account/ auth/ teams/      # teams = last phase, scaffolded but inert
components/ui/               # shadcn primitives (via MCP) + premium wrappers
stores/                      # zustand: workspace, secureFolders, uploads, selection, ui
hooks/                       # useCloudList, useAccountProfile, …
```

> **Instance location note:** `service/factories.ts` already imports `./Instance` (i.e. `service/Instance.ts`), so the
> `Instance` is planned at `service/Instance.ts`. Earlier drafts said `lib/api/Instance.ts`; the **factory import wins** —
> keep the Instance next to the factories and put the error‑mapping/query‑key helpers in `lib/api`. Tracked as a resolved
> note in [open-questions](../07-decisions/open-questions.md).

## 3. How the pieces connect (request lifecycle)

```
component ── useQuery/useMutation ──> typed hook ──> factory(req, {signal}) ──> Instance
                                                                                  │  request:  +X-Session-Id +X-Team-Id +folder/hidden +Idempotency-Key
   plain typed Result  <───────────────────────────────────────────────────────┘  response: unwrap Result · map errors → ApiError → toast · 401→signOut · 403/409 passthrough
```

Everything else in this folder elaborates one stage of that line. Start with [data-layer.md](./data-layer.md).

## 4. Engineering hygiene
Testing (unit + component for the Instance/stores/hooks; happy‑path e2e), lint/format/commit + CI, SEO/metadata + route
error/suspense boundaries, performance budget. Details live in [`../06-cross-cutting/`](../06-cross-cutting/testing.md).
