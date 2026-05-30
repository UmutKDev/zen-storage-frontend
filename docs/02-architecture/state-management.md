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
Keys are arrays, **namespaced**, and **team‑prefixed** (`'personal'` or the team id) so a future team switch invalidates
cleanly with no refactor:

```
[scope, 'cloud', 'list', path, delimiter, flags]
[scope, 'cloud', 'objects', path, ...]
[scope, 'cloud', 'directories', path, hiddenToken]     // hidden token folded in
[scope, 'cloud', 'breadcrumb', path]
[scope, 'cloud', 'usage']
[scope, 'account', 'profile']
[scope, 'subscription', 'my']
[scope, 'notifications', 'unreadCount']
[scope, 'document', 'content', key]
[scope, 'cloud', 'versions', key]
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
  invalidate exactly the affected keys (list, breadcrumb, usage), not the world.
- **Never auto‑retry** mutations; idempotency keys make a *manual* retry safe for Move/Delete/CompleteUpload.
- **Conflicts (409)** and **secure‑folder gating (403)** propagate out of the mutation to feature handlers.

### Defaults
- Reasonable `staleTime` for lists (short) and profile/subscription (longer).
- Errors flow through the Instance's `ApiError`; the Query error boundary + toast layer handle display.

## 3. Zustand stores

| Store | Responsibility | Persistence |
|---|---|---|
| `workspace.store` | active context (Personal ↔ team), drives `X-Team-Id` + key scope | session‑safe id only; **MVP stays Personal** |
| `secureFolders` | encrypted/hidden **tokens** + path marks | **tokens in memory only, never persisted**; marks may use `sessionStorage` |
| `uploads` | upload queue/tray: per‑file state, progress, concurrency, pause/cancel/retry | in‑memory (optionally resumable metadata) |
| `selection` | multi‑select set + range/toggle/select‑all | in‑memory |
| `ui` | view mode (list/grid), filters/sort, open dialogs, theme bits not owned by next‑themes | `sessionStorage` for view/filter prefs |

Rules:
- Stores hold **UI truth only**; anything authoritative comes from the backend via Query.
- The `secureFolders` store's never‑persist guarantee is a **security requirement**, not a preference — see
  [secure-folder-lifecycle](./secure-folder-lifecycle.md).
- Sign‑out clears **all** stores (and the Query cache and socket).

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
