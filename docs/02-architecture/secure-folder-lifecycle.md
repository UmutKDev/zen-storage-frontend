# Secure‑Folder Session‑Token Lifecycle

> How encrypted/hidden folders mint, store, reuse, expire, and clear short‑lived tokens. A **security‑critical** design.
> Feature spec: [secure-folders](../04-features/secure-folders.md) · API: [cloud-directory](../05-api/modules/cloud-directory.md)
> · built in [Phase 5](../01-roadmap/phases/phase-5-secure-folders.md).

## 1. The store (`stores/secureFolders`)

- **In‑memory only. Tokens are NEVER persisted** — no localStorage, no sessionStorage, no cookies. This is a hard
  requirement, not a preference.
- Two logical namespaces:
  - **Encrypted** → header `X-Folder-Session`, minted by `Directory/Unlock`.
  - **Hidden** → header `X-Hidden-Session`, minted by `Directory/Reveal`.
- Entry shape: `{ token, expiresAt }` keyed by the **returned root folder path** (`EncryptedFolderPath` /
  `HiddenFolderPath`).
- **Path marks** (which folders *are* encrypted/hidden, for badges) **may** persist to `sessionStorage` — marks are not
  secrets; **tokens are**.

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

```
resolveToken(path, namespace):
  walk path from itself up to root
  return the first stored, non-expired token whose key is an ancestor (or equal)
  else → null (needs prompt)
```

## 4. Injection (via the Instance)

For `/Api/Cloud/*` requests, the [Instance](./data-layer.md) calls `resolveToken(requestPath)` for each namespace and
attaches `X-Folder-Session` / `X-Hidden-Session` when present. (The hook point is reserved from Phase 0; the store is
implemented in Phase 5.)

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
- **Tab close / unload** (`beforeunload`).

## 8. Query‑key integration
Surfaces that depend on a token fold it into their query key (e.g. `[scope,'cloud','directories',path,hiddenToken]`) so
revealing/unlocking triggers a re‑fetch and locking/concealing invalidates cleanly. See
[state-management](./state-management.md).

## 9. Reveal UX (`Shift Shift`)
A **global double‑Shift** key handler opens the reveal passphrase dialog → `Directory/Reveal` → hidden folders matching
that passphrase appear (token folded into the directories query key). Conceal/lock hides them again.

## 10. Risks (see also the phase doc)
- Never‑persist guarantee — audit for stray persistence; the store must not be wrapped in any persistence middleware.
- Ancestor lookup correctness — dedicated unit tests over nested/sibling paths.
- 403 vs wrong‑passphrase disambiguation — explicit handling to prevent loops.
