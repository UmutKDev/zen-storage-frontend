# State Management — TanStack Query + Zustand

> Two state systems with a clean split: **server state** (TanStack Query) vs **client/UI state** (Zustand). Don't mix.

## 1. The split

| Kind | Tool | Examples |
|---|---|---|
| **Server state** (lives on the backend, cached client‑side) | **TanStack Query** | file lists, profile, subscription, versions, document content, unread count |
| **Client/UI state** (only meaningful in the browser) | **Zustand** | active workspace, secure‑folder tokens, upload queue, selection, view mode, dialogs |
| **Transient job state** (socket‑fed) | **Zustand job store + polling fallback query** | archive/duplicate progress |

## 2. TanStack Query

### Query‑key conventions
All query keys are built via `lib/api/query-keys.ts.scopedKey(scope, ...)` — a single factory that emits
team‑prefixed arrays of shape `[scope, resource, ...params]` where `scope = 'personal' | teamId`. This is the
**single source** for the team prefix; nothing else assembles keys by hand.

Per‑feature key namespaces live at `features/<f>/api/queryKeys.ts` exporting a `<feature>Keys` object — e.g.
`browseKeys.list(path, flags)`, `accountKeys.profile()`, `previewKeys.versions(key)`. Each helper composes its
key through `scopedKey`, so a future team switch invalidates cleanly with no refactor.

Examples (what the factory emits):

```
scopedKey(scope, 'cloud', 'list', path, delimiter, flags)   → ['personal', 'cloud', 'list', '/foo', '/', flags]
scopedKey(scope, 'cloud', 'objects', path, ...)             → ['personal', 'cloud', 'objects', '/foo', ...]
scopedKey(scope, 'cloud', 'directories', path, hiddenToken) → ['personal', 'cloud', 'directories', '/foo', hiddenToken]
scopedKey(scope, 'cloud', 'breadcrumb', path)               → ['personal', 'cloud', 'breadcrumb', '/foo']
scopedKey(scope, 'cloud', 'usage')                          → ['personal', 'cloud', 'usage']
scopedKey(scope, 'account', 'profile')                      → ['personal', 'account', 'profile']
scopedKey(scope, 'subscription', 'my')                      → ['personal', 'subscription', 'my']
scopedKey(scope, 'notifications', 'unreadCount')            → ['personal', 'notifications', 'unreadCount']
scopedKey(scope, 'document', 'content', key)                → ['personal', 'document', 'content', key]
scopedKey(scope, 'cloud', 'versions', key)                  → ['personal', 'cloud', 'versions', key]
   where scope = 'personal' | teamId
```

Rules:
- **Secure‑folder tokens in keys:** include the hidden/folder token on affected surfaces so revealing/unlocking
  re‑fetches. (See [secure-folder-lifecycle](./secure-folder-lifecycle.md).)
- **Pagination/virtualization:** list queries are paged/infinite, reading `Options.Count` from the envelope (surfaced by
  the [data layer](./data-layer.md)).
- **Unwrap boundary is the Instance** — queries cache plain typed `Result`.

### Mutations
- **Optimistic** for delete/move/rename with snapshot + rollback on error.
- **Targeted invalidators** per surface (mirror the old `useCloudList` invalidator pattern): after a successful op,
  invalidate exactly the affected keys (list, breadcrumb, usage), not the world. Cross‑feature fan‑out lives in
  `lib/api/invalidators.ts`; per‑feature invalidators live in the feature's `<feature>.mutations.ts`.
- **Never auto‑retry** mutations; idempotency keys make a *manual* retry safe for Move/Delete/CompleteUpload.
- **Idempotency keys:** minted via `lib/api/idempotency.ts.newIdempotencyKey()` (UUID v7) and **required** for
  Move / Delete / CompleteMultipartUpload. The interceptor at `service/interceptors/idempotency.ts` attaches the
  value to the `Idempotency-Key` header.
- **AbortSignal:** composed via `lib/api/abort.ts.composeSignals(...)` (TanStack Query's `signal` + user‑cancel +
  timeout via `withTimeout`).
- **Conflicts (409)** and **secure‑folder gating (403)** propagate out of the mutation to feature handlers.

### Defaults
- Reasonable `staleTime` for lists (short) and profile/subscription (longer).
- Errors flow through the Instance's `ApiError`; the Query error boundary + toast layer handle display.

## 3. Zustand stores

Stores split into **GLOBAL** (the only two at MVP, in the top‑level `stores/` directory) and **FEATURE‑LOCAL**
(co‑located with the feature that owns them — **not** in global `stores/`).

**GLOBAL** (`stores/` — MVP allows only these two):

| Store | Responsibility | Where it lives | Persistence |
|---|---|---|---|
| `workspace.store` | active context (Personal ↔ team), drives `X-Team-Id` + key scope via `registerTeamSource` | `stores/workspace.store.ts` | session‑safe id only |
| `ui.store` | cross‑feature UI (theme bits, modal stack) | `stores/ui.store.ts` | `sessionStorage` where opt‑in |

**FEATURE‑LOCAL** (NOT in global `stores/`):

| Store | Responsibility | Where it lives | Persistence |
|---|---|---|---|
| `secureFolders` | encrypted/hidden **tokens** + path marks | `features/secure-folders/stores/secureFolders.store.ts` | **IN‑MEMORY ONLY** (lint blocks `persist`/`localStorage`/`sessionStorage`/`cookie` in that file) |
| `uploads` | upload queue/tray: per‑file state, progress, concurrency, pause/cancel/retry | `features/storage/upload/stores/uploads.store.ts` | in‑memory |
| `selection` | multi‑select set + range/toggle/select‑all | `features/storage/operations/stores/selection.store.ts` | in‑memory |
| `viewPrefs` | view mode (list/grid), sort | `features/storage/browse/stores/viewPrefs.store.ts` | `sessionStorage` |

Rules:
- Stores hold **UI truth only**; anything authoritative comes from the backend via Query.
- The `secureFolders` store's never‑persist guarantee is a **security requirement**, not a preference — it lives at
  `features/secure-folders/stores/secureFolders.store.ts` and is lint‑enforced. See
  [secure-folder-lifecycle](./secure-folder-lifecycle.md).
- Only `stores/workspace.store.ts` and `stores/ui.store.ts` belong in the global `stores/` directory at MVP; everything
  else is feature‑local under `features/<f>/.../stores/`.
- Sign‑out clears **all** stores (global + feature‑local) along with the Query cache and socket.

## 4. Interaction example — delete a file (optimistic)

```
user clicks delete
  → selection store provides target(s)
  → useMutation(delete) snapshots ['personal','cloud','list',path]
  → optimistic: remove item from cached list
  → factory Cloud/Delete (Idempotency-Key via Instance)
       success → invalidate list + breadcrumb + usage keys
       error   → rollback snapshot + toast (from ApiError)
       409     → open conflict dialog (rare for delete; relevant to move/upload)
```

## 5. Open items
- Exact mechanism to expose `Options.Count` to infinite queries (meta vs wrapper) — decide in Phase 3.
- Whether view/filter prefs are per‑folder or global (default: global per session) — confirm in Phase 3.
- ✅ **Resolved:** Instance location is `service/Instance.ts` (factory import wins).
