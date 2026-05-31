# Conventions

> Project‑wide rules. **Do not re-derive these per file** — link here. Anything code‑level that conflicts with a phase or
> feature doc is resolved in favor of this file (except API contract facts, where [`05-api`](../05-api/API-INVENTORY.md)
> wins).

## 1. Naming

### API models — **PascalCase, always**
Every property that comes from or goes to the backend is PascalCase: `Id`, `Email`, `FullName`, `Path`, `Key`,
`Size`, `CreatedAt`, `LastModified`, `Metadata`, `ConflictStrategy`. This is non‑standard for TypeScript but is
**project‑wide and deliberate** — it mirrors the backend exactly and keeps the generated client honest. Never rename to
camelCase at the boundary.

### Local/UI code — idiomatic TypeScript
Variables, function names, hooks, component props that are **purely client‑side** follow normal TS conventions
(camelCase functions/vars, PascalCase components/types). The PascalCase rule applies to **API DTO fields**, not to your
own local state.

### The `ownerId` rule (carried from the backend)
Any value produced from the storage‑owner concept (`user.Id` **or** `team/{TeamId}`) is named **`ownerId`**, never
`userId`. Treating it as a user UUID silently breaks team storage. This shows up client‑side in **query‑key prefixes**
and **`X-Team-Id` handling** — keep the naming consistent.

### Headers — canonical casing in docs
HTTP headers are case‑insensitive on the wire; the backend reads lowercase (`x-session-id`). In docs and TypeScript we
write the canonical form: `X-Session-Id`, `X-Team-Id`, `X-Folder-Passphrase`, `X-Folder-Session`, `X-Hidden-Session`,
`Idempotency-Key`.

### Files & folders (frontend)
- Routes: App Router conventions under `app/` (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`) — thin pages only.
- Feature code: `features/<area>/…` — flat root, black‑box modules. The shell (app chrome, sidebar, topbar,
  workspace‑switcher slot) lives at **`features/shell/`** — there is **no** `components/layout/`.
- **Feature anatomy** (fixed shape): `components/`, `screens/` (`*Screen.tsx` containers), `hooks/`, `api/`
  (`<feature>.queries.ts`, `<feature>.mutations.ts`, `queryKeys.ts`, `index.ts`), `stores/` (feature‑local Zustand),
  `lib/` (feature‑pure helpers + `validation/` zod), `types.ts` (UI types only — **never DTO**), `constants.ts`,
  `index.ts` (**public barrel — explicit named re‑exports, no `export *`**).
- Nested sub‑features (e.g. `features/storage/{browse,upload,operations,search,shared}/`) follow the same anatomy and
  expose their own `index.ts`; the parent barrel re‑exports from sub‑barrels (`shared/` is storage‑internal — not
  re‑exported).
- **Feature‑LOCAL stores** (only place they live): `features/storage/upload/stores/uploads.store.ts`,
  `features/storage/operations/stores/selection.store.ts`,
  `features/storage/browse/stores/viewPrefs.store.ts` (sessionStorage),
  `features/secure-folders/stores/secureFolders.store.ts` (in‑memory, ancestor‑aware).
- **GLOBAL `stores/`** holds only what genuinely crosses features at MVP: `stores/workspace.store.ts` (drives
  `X-Team-Id` + key scope) and `stores/ui.store.ts` (modal stack, theme bits). **Nothing else** qualifies.
- Shared primitives: `components/ui/*` (shadcn intake + premium wrappers) and `components/patterns/*` (empty‑state,
  state‑boundary, conflict‑dialog, confirm‑destructive, data‑table).
- Cross‑feature libs: `lib/<concern>/…` (`lib/api`, `lib/auth`, `lib/i18n`, `lib/motion`, `lib/flags`,
  `lib/observability`, `lib/socket`, `lib/validation`, `lib/shortcuts`, `lib/seo`, `lib/utils`).
- Generated client: `service/generates/*` (**build artifact, never hand‑edit**, eslint‑ignored) + `service/factories.ts`
  + `service/models.ts` (curated DTO re‑exports — the only sanctioned entry to generated types).
- Component files: PascalCase (`FilePreviewModal.tsx`). Hooks: `useThing.ts`. Stores: `thing.store.ts`.

> The full proposed tree is in [`../02-architecture/ARCHITECTURE.md`](../02-architecture/ARCHITECTURE.md#folder-structure).

## 2. Data access

- **Every** backend call goes through a generated **factory** built on the shared `Instance`
  (`service/factories.ts`, composed in `service/Instance.ts`). No raw `axios`/`fetch`, ever — the **only** allowlisted
  exception is the presigned S3 PUT at `features/storage/upload/api/presigned-put.ts`.
- **Every** request/response type is a generated **model** consumed via `service/models.ts` (curated re‑exports of
  `service/generates/*`). Direct imports from `service/generates/*` are banned; never write a parallel DTO. If a type
  is wrong, fix the spec/generation.
- The generated folder is **committed** and treated as build output. Regenerate with
  `bun run generate:service:test` (config in `openapitools.json`) whenever the API changes.
- Wrap factory calls in typed **hooks** under `features/<f>/api/` (`*.queries.ts`, `*.mutations.ts`) — the underlying
  call is always a factory.
- **Idempotency keys** come from `lib/api/idempotency.ts.newIdempotencyKey()` (UUID v7, single source). The dedicated
  `service/interceptors/idempotency.ts` attaches `Idempotency-Key` to mutating calls.
- **AbortSignal** is threaded via `lib/api/abort.ts.composeSignals` (with `withTimeout`) — compose the React Query
  signal with feature‑level aborts; never construct ad‑hoc `AbortController` chains.
- **Mutations invalidate** through `lib/api/invalidators.ts` (typed helpers over `scopedKey`) — no inline
  `queryClient.invalidateQueries([...])` literals in feature code.

## 3. TanStack Query keys

Keys are **arrays**, **namespaced**, and **team‑prefixed** so a future team switch invalidates cleanly. The **only**
sanctioned key builder is `lib/api/query-keys.ts.scopedKey(scope, ...parts)` — it reads `scope` from
`stores/workspace.store.ts` (`'personal' | teamId`) and prepends it. Each feature owns its key catalogue at
`features/<f>/api/queryKeys.ts` (composed on `scopedKey`); feature code imports keys from there, never inlines literals.

```
[scope, resource, ...params]            // shape — built by scopedKey
['personal' | teamId, 'cloud', 'list', path, delimiter, flags]
['personal' | teamId, 'cloud', 'directories', path, hiddenToken]
['personal' | teamId, 'account', 'profile']
['personal' | teamId, 'notifications', 'unreadCount']
```

Rules: include **secure‑folder tokens** in keys for surfaces they affect (so unlock/reveal re‑fetches); long‑running
jobs (archive/duplicate) are **not** queries — they are job stores fed by sockets with a polling‑fallback query.
Details: [`../02-architecture/state-management.md`](../02-architecture/state-management.md).

## 4. Errors, toasts, envelope

- Envelope unwrap and error mapping live in **`service/interceptors/envelope.ts`** (not in an `Instance` monolith) —
  `Instance.ts` is a ~30‑line composer over `service/interceptors/{session,team,secure-folder,idempotency,envelope}.ts`.
  The envelope interceptor unwraps `Result` and maps `Status`/HTTP → a typed `ApiError` from `lib/api/ApiError.ts`
  (`{ code, messages, httpStatus, raw }`).
- Toasts and **`401 → re‑auth/sign‑out`** are centralized in `lib/api/error-toast.ts` (sonner), wired once at the
  envelope boundary.
- `403` (secure‑folder gating) and `409` (conflict) **pass through** to feature handlers — they are not generic errors.
- Never handle the envelope per call; it is one layer. See [`../02-architecture/data-layer.md`](../02-architecture/data-layer.md).

## 5. Copy & i18n

- **No hardcoded user‑facing strings.** All copy goes through i18n keys, even though only English ships at MVP.
- Key naming: `area.screen.element` (e.g. `storage.upload.quotaExceeded`). Details:
  [`../06-cross-cutting/i18n.md`](../06-cross-cutting/i18n.md).

## 6. Styling & motion

- Tailwind v4 with semantic tokens. **Tokens live in `app/globals.css` `@theme` — SINGLE token source.** Use **semantic**
  tokens (`bg-background`, `text-foreground`, surfaces, borders, accent, state colors). **No raw hex literal anywhere
  else** in `.ts/.tsx` — ESLint blocks `/^#[0-9a-fA-F]{3,8}$/` (allowed only inside `app/globals.css` and `lib/motion/**`).
- Pull shadcn primitives via the **shadcn MCP**; wrap in `components/ui/*` for the premium look. Don't fork gratuitously.
- Animate via shared `lib/motion/{tokens,variants,useReducedMotion}.ts`; **every** animation respects
  `prefers-reduced-motion`.
- Full rules: [`../03-design-system/DESIGN-SYSTEM.md`](../03-design-system/DESIGN-SYSTEM.md).

## 7. Accessibility & responsiveness (baseline, enforced)

- Keyboard reachable, visible focus, correct roles/labels, dialogs trap focus, `aria-live` for async feedback.
- Mobile‑first; the storage grid/list, preview modal, and shell must all work on small screens.
- Details: [`../06-cross-cutting/accessibility.md`](../06-cross-cutting/accessibility.md).

## 8. Git & commits

- Branch: build on **`v2`**. `main` is the old frontend (read‑only reference).
- Commits: conventional style (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`) with a scope where useful
  (`feat(storage): multipart upload tray`).
- Keep the **generated client** changes in their own commit when regenerating (`chore(api): regenerate client`).
- Phase completion gets a commit that also updates `STATUS.md` + ROADMAP changelog.

## 9. Definition of "done" for a task

A checklist item is done when: the behavior works for the **happy path and its state‑matrix states**, copy is via i18n
keys, it is keyboard‑accessible, it uses the generated client + shared `Instance`, it respects reduced‑motion, and (where
applicable) it has the test coverage named in [`../06-cross-cutting/testing.md`](../06-cross-cutting/testing.md).

## 10. Import boundaries

The folder structure is enforced — not aspirational. Ten hard rules:

1. **One‑way deps**: `app → features → (components, lib, service, stores, hooks, config, types)`. Lower never imports up.
2. **Hard barrels**: every `features/<f>/` and `features/<f>/<sub>/` is enterable **only** through its `index.(ts|tsx)`.
3. **No deep cross‑feature imports**: `@/features/<x>` only — never `@/features/<x>/upload/...`.
4. **No raw HTTP**: `axios` is import‑banned and bare `fetch(` is AST‑blocked. The only allowlisted exception is
   `features/storage/upload/api/presigned-put.ts` (S3 presigned PUTs).
5. **No hand‑rolled DTOs**: type names matching `*Dto|*Request|*Response` are AST‑blocked in `features/**/api/**` and
   `features/**/types.ts`; direct `@/service/generates/*` imports are banned — go through `@/service/models`.
6. **`service/` is a leaf**: no `@/features/*` import. The secure‑folder token is read via a getter seam at
   `service/token-sources.ts` (registered from `app/providers.tsx`).
7. **No raw hex**: `/^#[0-9a-fA-F]{3,8}$/` literals are blocked in `.ts/.tsx` (allowed only in `app/globals.css` and
   `lib/motion/**`). Inline‑copy heuristic: 3+ word JSX strings must go through `t()`.
8. **Team UI inert before P8**: `features/teams/index.ts` exports no UI; `workspaceStore` is wired to the team
   interceptor from P0.
9. **No `export *`** anywhere — explicit named re‑exports only (AST‑blocked).
   > **Exception:** `service/models.ts` re-exports the entire generated client surface via `export * from "./generates"` (per-file ESLint override + D-F18). This is the only allowlisted instance outside generator output itself.
10. **Secure‑folder store special‑case**: `features/secure-folders/stores/secureFolders.store.ts` may not import
    `zustand/middleware`'s `persist`, and may not touch `localStorage`, `sessionStorage`, or `document.cookie`.

> Enforced by `eslint.config.mjs` via `eslint-plugin-boundaries` (`element-types` + `entry-point`) +
> `no-restricted-imports` + `no-restricted-syntax`. CI fails on any violation from P0 onward.
