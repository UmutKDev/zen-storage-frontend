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
- **`viewPrefs` vs theme asymmetry (intentional):** theme is OS‑level and persists globally via `next-themes` (user
  identity preference); `viewPrefs` (grid/list, sort column) persists per‑folder via `sessionStorage` and resets
  across browser sessions (working‑state per session).

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

### Worked example — `useRenameFile`

The full optimistic-mutation shape. Snapshot the **unwrapped** cache value, apply the optimistic edit,
restore the snapshot on error, invalidate on settle. The `Idempotency-Key` header is minted per call.

```ts
// features/storage/operations/api/useRenameFile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CloudFactory } from '@/service/factories';
import { newIdempotencyKey } from '@/lib/api/idempotency';
import { browseKeys } from '@/features/storage/browse/api/queryKeys';
import { useWorkspaceScope } from '@/stores/workspace.store';
import type { CloudListItem } from '@/service/generates';

type RenameInput = { path: string; key: string; newName: string };

export function useRenameFile() {
  const qc = useQueryClient();
  const scope = useWorkspaceScope();

  return useMutation({
    mutationFn: ({ path, key, newName }: RenameInput) =>
      CloudFactory.move(
        { Key: key, NewName: newName },
        { headers: { 'Idempotency-Key': newIdempotencyKey() } },
      ),

    onMutate: async ({ path, key, newName }) => {
      const listKey = browseKeys.list(scope, path);

      // 1. Stop in-flight refetches so they can't clobber our optimistic write.
      await qc.cancelQueries({ queryKey: listKey });

      // 2. Snapshot the UNWRAPPED cache value (Instance already stripped Result<T>).
      const previous = qc.getQueryData<CloudListItem[]>(listKey);

      // 3. Apply the optimistic edit against the inner type.
      qc.setQueryData<CloudListItem[]>(listKey, (curr) =>
        curr?.map((it) => (it.Key === key ? { ...it, Name: newName } : it)),
      );

      return { previous, listKey };
    },

    onError: (_err, _vars, ctx) => {
      // Restore exactly what we snapshotted; the error toast is raised by the Instance.
      if (ctx) qc.setQueryData(ctx.listKey, ctx.previous);
    },

    onSettled: (_data, _err, { path }) => {
      // Re-sync from the server on success AND error; never call invalidateQueries in onMutate.
      qc.invalidateQueries({ queryKey: browseKeys.list(scope, path) });
      qc.invalidateQueries({ queryKey: browseKeys.breadcrumb(scope, path) });
    },
  });
}
```

### Pitfalls

| Pitfall | Rule |
|---|---|
| Snapshotting the wrapped envelope | **NEVER** snapshot `Result<T>`. The cache stores the inner type — the Instance unwraps at the boundary. If you see `{ Success, Data, Errors }` in cache, the envelope unwrap is misconfigured: fix the interceptor, do not work around it in the hook. |
| Writing before cancelling | **NEVER** skip `cancelQueries` before `setQueryData`. An in-flight refetch will land after your optimistic write and overwrite it, producing a visible flicker back to stale data. |
| Invalidating in `onMutate` | **NEVER** call `invalidateQueries` in `onMutate` — it triggers an immediate refetch that races the optimistic update. Invalidation belongs in **`onSettled`** only (it fires for both success and error and re-syncs reality). |
| Missing `Idempotency-Key` | **ALWAYS** include `Idempotency-Key` (via `newIdempotencyKey()`) for **Move / Delete / Update / CompleteMultipart**. A manual retry of a write without the key can double-apply on the backend. |

## 5. Open items
- Exact mechanism to expose `Options.Count` to infinite queries (meta vs wrapper) — decide in Phase 3.
- Whether view/filter prefs are per‑folder or global (default: global per session) — confirm in Phase 3.
- ✅ **Resolved:** Instance location is `service/Instance.ts` (factory import wins).
