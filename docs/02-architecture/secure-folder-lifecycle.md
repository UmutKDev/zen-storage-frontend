# Secure‑Folder Session‑Token Lifecycle

> How encrypted/hidden folders mint, store, reuse, expire, and clear short‑lived tokens. A **security‑critical** design.
> Feature spec: [secure-folders](../04-features/secure-folders.md) · API: [cloud-directory](../05-api/modules/cloud-directory.md)
> · built in [Phase 5](../01-roadmap/phases/phase-5-secure-folders.md).

## 1. The store (`features/secure-folders/stores/secureFolders.store.ts`)

- **In‑memory only. Tokens are NEVER persisted** — no localStorage, no sessionStorage, no cookies. This is a hard
  requirement, not a preference.
- Feature‑local Zustand store (not in global `stores/`), per the [folder plan](./ARCHITECTURE.md#folder-structure).
- **Enforced mechanically, not by goodwill.** `eslint.config.mjs` carries a targeted override on this exact file that
  bans `zustand/middleware`'s `persist` and `MemberExpression` access to `localStorage`, `sessionStorage`, and
  `document.cookie`. Reviewers can rely on lint — if it compiles clean, the rule held.
- Two logical namespaces:
  - **Encrypted** → header `X-Folder-Session`, minted by `Directory/Unlock`.
  - **Hidden** → header `X-Hidden-Session`, minted by `Directory/Reveal`.
- Entry shape: `{ token, expiresAt }` keyed by the **returned root folder path** (`EncryptedFolderPath` /
  `HiddenFolderPath`).
- **Path marks** (which folders *are* encrypted/hidden, for badges) **may** persist to `sessionStorage` — marks are not
  secrets; **tokens are**. Marks live in a separate, non‑token store and are exempt from the lint override above.

## 2. Mint

```
Encrypted: Directory/Unlock(Path) + X-Folder-Passphrase(≥8)  → { SessionToken, ExpiresAt, TTL, EncryptedFolderPath }
Hidden:    Directory/Reveal(Path) + X-Folder-Passphrase(≥8)  → { SessionToken, ExpiresAt, TTL, HiddenFolderPath }
```

The passphrase header is sent **only** on the mint call; it is never stored. The returned token replays access for
subsequent calls within its TTL.

## 3. Lookup — ancestor‑aware

A request for `a/b/c` uses the **nearest valid ancestor's** token (mirrors the old `SessionManager`). So unlocking `a`
covers `a/b` and `a/b/c` without re‑prompting per subfolder.

Ancestor matching is delegated to `lib/utils/paths.ts.isAncestor` so the store, the interceptor, and any feature‑side
caller all agree on what "ancestor" means (trailing‑slash, normalization, root‑vs‑empty edge cases).

```
resolveToken(path, namespace):
  walk path from itself up to root
  return the first stored, non-expired token whose key isAncestor(key, path) (or equal)
  else → null (needs prompt)
```

## 4. Injection (via the secure‑folder interceptor)

Header injection lives in `service/interceptors/secure-folder.ts`, composed into the shared
[Instance](./data-layer.md) alongside the session / team / idempotency / envelope interceptors. The interceptor is
**not** part of an `Instance.ts` monolith — `Instance.ts` stays ~30 lines and just wires interceptors in order.

Because `service/` is a leaf and must not import `@/features/*`, the interceptor reads the current getter from a
**token‑source seam**: `service/token-sources.ts` exposes `registerSecureFolderTokenSource(getter)`. The real getter is
registered from `app/providers.tsx` once the secure‑folders store exists; before Phase 5 the seam returns `null` and
the interceptor is a no‑op. This is the same inverted‑deps pattern used for the session and team sources.

For `/Api/Cloud/*` requests the interceptor calls the registered getter (one resolve per namespace) and attaches
`X-Folder-Session` / `X-Hidden-Session` when a non‑expired ancestor token exists.

## 5. Expiry & re‑prompt

- On `403` (locked/hidden) **or** a missing/expired token, **transparently re‑prompt** with the passphrase dialog, mint
  a fresh token, and retry the original request.
- Distinguish **"needs token"** (re‑prompt) from **"wrong passphrase"** (error + retry) to avoid prompt loops; cap
  consecutive re‑prompts.

## 6. Explicit lock / conceal
- `Directory/Lock` (encrypted) and `Directory/Conceal` (hidden) invalidate server‑side sessions; the client **drops the
  corresponding token** immediately.

## 7. Clear‑all (mandatory)
Clear **all** tokens on:
- **Sign‑out** (part of the [auth teardown](./auth-integration.md#4-sign-out-full-teardown)).
- **Tab close** — see §11 for the exact event wiring (`pagehide` + `visibilitychange`, **never** `beforeunload`).

## 8. Query‑key integration
Surfaces that depend on a token fold it into their query key (e.g. `[scope,'cloud','directories',path,hiddenToken]`) so
revealing/unlocking triggers a re‑fetch and locking/concealing invalidates cleanly. See
[state-management](./state-management.md).

## 9. Reveal UX (`Shift Shift`)
A **global double‑Shift** key handler opens the reveal passphrase dialog → `Directory/Reveal` → hidden folders matching
that passphrase appear (token folded into the directories query key). Conceal/lock hides them again.

## 10. Risks (see also the phase doc)
- Never‑persist guarantee — the targeted lint rule on `features/secure-folders/stores/secureFolders.store.ts` is the
  primary guard; CI must fail on any new `persist` / `localStorage` / `sessionStorage` / `document.cookie` reference in
  that file.
- Ancestor lookup correctness — dedicated unit tests over nested/sibling paths against `lib/utils/paths.ts.isAncestor`.
- 403 vs wrong‑passphrase disambiguation — explicit handling to prevent loops.
- Token‑source seam wiring — if `registerSecureFolderTokenSource` is not called from `app/providers.tsx`, the
  interceptor silently no‑ops; provider boot must register the getter (and tests should assert it).

## 11. Tab close + bfcache
Listen for **`visibilitychange`** and **`pagehide`** — **never `beforeunload`** (it blocks bfcache and fires
unreliably on mobile Safari).

Implementation lives in `features/secure-folders/lifecycle/tab-close.ts` and is registered once from
`app/providers.tsx`.

| Event | Condition | Action |
|---|---|---|
| `pagehide` | `event.persisted === false` | Tab is closing for real → **clear ALL tokens** (encrypted + hidden). |
| `pagehide` | `event.persisted === true` | Page entering **bfcache** → **keep tokens**. A bfcache restore resurrects the in‑memory Zustand store intact, so the tokens are still valid (subject to TTL). |
| `visibilitychange` | `document.visibilityState === 'hidden'` | **No‑op.** Backgrounding a tab is not closing it; clearing here would force a re‑prompt every time the user switches tabs. |

```ts
// features/secure-folders/lifecycle/tab-close.ts (shape)
window.addEventListener('pagehide', (e) => {
  if (!e.persisted) clearAllSecureFolderTokens();
});
window.addEventListener('visibilitychange', () => {
  // intentionally empty — see table above
});
```

## 12. Cross‑tab behavior (intentional per‑tab)
Tokens are **per‑tab** at MVP. Unlocking `/work` in Tab A does **not** unlock it in Tab B; Tab B's next request to
that subtree gets a `403` and triggers a fresh passphrase prompt.

This is **intentional**, not a bug. **No `BroadcastChannel` at MVP** — cross‑tab token propagation expands the
exfiltration surface (any open tab in the origin can read the token) for a small UX win.

`state-matrix.md` adds a **"Locked (other tab unlocked)"** state row to make this visible to feature authors.

**Post‑MVP:** a `BroadcastChannel('secure-folders')` sync, gated behind a per‑user settings toggle ("Share unlocked
folders across tabs"). Default off.

## 13. Unlock `onSuccess` sequencing (no race)
The mutation's `onSuccess` MUST run in this order — reversing it produces an **infinite re‑prompt loop** because
the refetch fires before the token is in the store, gets `403`, and re‑opens the dialog the user just dismissed.

1. **Store update first (synchronous):** `setToken(namespace, path, token, expiresAt)`.
2. **Then** `queryClient.invalidateQueries(...)` for the affected scope.
3. **Then** apply any optimistic UI (badge flip, expand the now‑unlocked folder, etc.).

```ts
// features/secure-folders/hooks/useUnlock.ts (shape)
onSuccess: (data, vars) => {
  secureFolders.setToken('encrypted', data.EncryptedFolderPath, data.SessionToken, data.ExpiresAt); // 1
  queryClient.invalidateQueries({ queryKey: ['cloud', 'directories', vars.Path] });                  // 2
  ui.markUnlocked(data.EncryptedFolderPath);                                                         // 3
}
```

**Phase 5 acceptance test** asserts this order with a spy on `setToken` / `invalidateQueries` and fails if
invalidation is observed before the store write.

## 14. Conceal atomicity + rollback
Conceal/Lock is **not** a fire‑and‑forget client clear. The token only drops if the server confirms.

| Outcome | Client action | UX |
|---|---|---|
| `2xx` success | `clearToken(namespace, path)` + `invalidateQueries` for that subtree. | Silent. Folder re‑locks/conceals. |
| Network failure (no response) | **Leave the token in place.** | Toast: **"Conceal failed — try again."** Server session may still be live; clearing locally would desync. |
| `5xx` | **Clear the token locally** (defensive — server state ambiguous). | Toast: **"Conceal may not have completed. Re‑verify from another device if needed."** |
| `4xx` (other than auth) | Surface via feature handler (see §5 of [data-layer](./data-layer.md)). | Per‑error toast. |

`state-matrix.md` adds a **"Concealing"** transient state to model the in‑flight window.

## 15. Encrypted‑folder socket events (MVP)
Live updates and secure folders interact at the **socket auth boundary**.

**Backend contract (MVP):** the server **MUST NOT** emit `FILE_*` / `FOLDER_*` socket events whose payload path
falls under a secure‑folder root *unless* the receiving socket connection holds a valid session token for that
root. Otherwise the path itself leaks (filename, parent chain, mtime) to a connection that was never authorised
to see it.

**MVP simplification:** sockets don't carry per‑namespace tokens yet, so encrypted/hidden folders **do not emit
live events**. Changes inside a secure folder surface on the **next refetch** (manual refresh, navigation,
invalidation from a same‑tab mutation).

**Revisit in Phase 6:** per‑namespace socket auth (token attached on `subscribe` / sent via a separate auth frame)
so encrypted folders can join the live‑updates path without leaking metadata.

## 16. React DevTools introspection (accepted risk)
Zustand stores are introspectable via the React DevTools / Zustand DevTools extension. **Secure‑folder tokens are
visible there** while the extension is attached.

**Decision: accepted at MVP.** The threat is bounded:

- Tokens are **TTL‑bounded** (15 min default) — exfiltration window is short.
- **Trusted‑machine assumption.** A user with browser‑extension install rights on their own device is already
  inside the trust boundary; DevTools also exposes the session cookie, the team‑id header, and every in‑flight
  request body. Singling out secure‑folder tokens here would be theatre.
- DevTools attachment **requires an active session** on the machine — there is no remote read path.

**Post‑MVP hardening (tracked):**
1. Wrap the token field in a getter that returns `undefined` in `process.env.NODE_ENV === 'production'` **and**
   when the React DevTools global hook is detected (`window.__REACT_DEVTOOLS_GLOBAL_HOOK__`).
2. Store tokens in a module‑private `Map` outside the Zustand state tree; expose only `resolveToken(path)` to
   consumers, so DevTools sees the *existence* of an unlock but not the token bytes.

## 17. `registerSecureFolderTokenSource` no‑op assertion (Phase 0)
The token‑source seam ships in **Phase 0** with a default getter that returns `undefined`. This locks in the
"interceptor exists, no‑ops until Phase 5" contract before any feature code can drift it.

**Phase 0 task 0.5 acceptance** asserts, in order:

1. `registerSecureFolderTokenSource` is **importable and callable** from `service/token-sources.ts`.
2. With **no** registration call, the default getter returns `undefined` for any `(namespace, path)` query.
3. The composed `Instance` issues a `/Api/Cloud/*` request and the secure‑folder interceptor attaches **no
   `X-Folder-Session` and no `X-Hidden-Session` header**.

Test file: `tests/service/secure-folder-interceptor.test.ts`.

```ts
// tests/service/secure-folder-interceptor.test.ts (shape)
it('default getter returns undefined and interceptor adds no header', async () => {
  const { getSecureFolderToken } = await import('@/service/token-sources');
  expect(getSecureFolderToken('encrypted', '/anything')).toBeUndefined();

  const req = await captureRequest(() => instance.get('/Api/Cloud/Directory/List'));
  expect(req.headers).not.toHaveProperty('x-folder-session');
  expect(req.headers).not.toHaveProperty('x-hidden-session');
});
```

This test must keep passing through Phase 5 — once a real getter is registered in `app/providers.tsx`, the test
remounts the seam without the registration to verify the no‑op default is still intact.
