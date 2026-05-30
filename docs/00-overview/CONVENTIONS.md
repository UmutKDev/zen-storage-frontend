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
- Routes: App Router conventions under `app/` (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).
- Feature code: `features/<area>/…` (components, hooks, local stores for that area).
- Shared primitives: `components/ui/*` (shadcn intake + premium wrappers).
- Cross‑feature libs: `lib/<concern>/…` (`lib/api`, `lib/auth`, `lib/i18n`, `lib/motion`, `lib/utils`).
- Generated client: `service/generates/*` (**build artifact, never hand‑edit**) + `service/factories.ts`.
- Component files: PascalCase (`FilePreviewModal.tsx`). Hooks: `useThing.ts`. Stores: `thing.store.ts`.

> The full proposed tree is in [`../02-architecture/ARCHITECTURE.md`](../02-architecture/ARCHITECTURE.md#folder-structure).

## 2. Data access

- **Every** backend call goes through a generated **factory** built on the shared `Instance`
  (`service/factories.ts`). No raw `axios`/`fetch`, ever.
- **Every** request/response type is a generated **model** from `service/generates`. If a type is wrong, fix the spec/
  generation — never write a parallel DTO.
- The generated folder is **committed** and treated as build output. Regenerate with
  `npm run generate:service:test` (config in `openapitools.json`) whenever the API changes.
- Wrap factory calls in typed **hooks** (`features/*/hooks` or `hooks/*`), but the underlying call is always a factory.

## 3. TanStack Query keys

Keys are **arrays**, **namespaced**, and **team‑prefixed** so a future team switch invalidates cleanly:

```
[scope, resource, ...params]            // shape
['personal' | teamId, 'cloud', 'list', path, delimiter, flags]
['personal' | teamId, 'cloud', 'directories', path, hiddenToken]
['personal' | teamId, 'account', 'profile']
['personal' | teamId, 'notifications', 'unreadCount']
```

Rules: include **secure‑folder tokens** in keys for surfaces they affect (so unlock/reveal re‑fetches); long‑running
jobs (archive/duplicate) are **not** queries — they are job stores fed by sockets with a polling‑fallback query.
Details: [`../02-architecture/state-management.md`](../02-architecture/state-management.md).

## 4. Errors, toasts, envelope

- The `Instance` unwraps `Result`, maps `Status`/HTTP → a typed `ApiError { code, messages, httpStatus, raw }`, drives
  **sonner** toasts consistently, and handles **`401 → re-auth/sign-out`** centrally.
- `403` (secure‑folder gating) and `409` (conflict) **pass through** to feature handlers — they are not generic errors.
- Never handle the envelope per call; it is one layer. See [`../02-architecture/data-layer.md`](../02-architecture/data-layer.md).

## 5. Copy & i18n

- **No hardcoded user‑facing strings.** All copy goes through i18n keys, even though only English ships at MVP.
- Key naming: `area.screen.element` (e.g. `storage.upload.quotaExceeded`). Details:
  [`../06-cross-cutting/i18n.md`](../06-cross-cutting/i18n.md).

## 6. Styling & motion

- Tailwind v4 with semantic tokens in `globals.css` (`@theme inline`). Use **semantic** tokens
  (`bg-background`, `text-foreground`, surfaces, borders, accent, state colors) — not raw hex.
- Pull shadcn primitives via the **shadcn MCP**; wrap in `components/ui/*` for the premium look. Don't fork gratuitously.
- Animate via shared `lib/motion` variants/tokens; **every** animation respects `prefers-reduced-motion`.
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
