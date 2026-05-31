# Phase 5 — Secure Folders

> **Status:** ⏳ not started · **Depends on:** [Phase 3](./phase-3-storage-core.md) · **Sibling:** [Phase 4](./phase-4-preview-share.md).
> **Feature spec:** [secure-folders](../../04-features/secure-folders.md) ·
> **Architecture:** [secure-folder-lifecycle](../../02-architecture/secure-folder-lifecycle.md) ·
> **API:** [cloud-directory](../../05-api/modules/cloud-directory.md)

## Objective
**Encrypted** and **hidden** folders, backed by a correct, secure **session‑token lifecycle** — tokens live in memory
only, are ancestor‑applicable, expire transparently, and are cleared on logout/tab‑close.

## Scope
**In:** encrypted folder create/convert/decrypt + unlock/lock + badge; hidden folder hide/unhide + `Shift Shift` reveal +
conceal; in‑memory token store (ancestor lookup, TTL re‑prompt, explicit lock, clear‑on‑logout/tab‑close); `Instance`
header injection (`X-Folder-Session` / `X-Hidden-Session`).
**Out:** team‑scoped secure folders (still Personal in MVP).

## Task breakdown

### 5.1 — Token store & lifecycle → see [secure-folder-lifecycle](../../02-architecture/secure-folder-lifecycle.md)
- [ ] `features/secure-folders/stores/secureFolders.store.ts` (zustand), **in‑memory only, never persisted** (no localStorage). Two namespaces:
      encrypted (`X-Folder-Session`) and hidden (`X-Hidden-Session`).
- [ ] The store lives inside the `features/secure-folders/` feature (not in the global `stores/`); ESLint guards ban `persist`, `localStorage`, `sessionStorage`, and `cookie` access in that exact file.
- [ ] Store `{ token, expiresAt }` keyed by the returned root folder path.
- [ ] **Ancestor‑aware lookup:** a request for `a/b/c` uses the nearest valid ancestor token.
- [ ] **TTL expiry → transparent re‑prompt** (passphrase dialog) on 403/expired.
- [ ] **Clear ALL** on sign‑out and `beforeunload` (tab close).
- [ ] Path‑*marks* (which folders are encrypted/hidden) may persist to `sessionStorage`; **tokens never do**.

### 5.2 — Instance header injection
- [ ] For `/Api/Cloud/*` calls, the secure-folder header (`X-Folder-Session` / `X-Hidden-Session`) is attached by `service/interceptors/secure-folder.ts`, which reads tokens via the seam `service/token-sources.ts.registerSecureFolderTokenSource(getter)` registered from `app/providers.tsx`. `service/` never imports `@/features/secure-folders`.
- [ ] Ancestor matching uses `lib/utils/paths.ts.isAncestor` (shared helper, unit-tested).

### 5.3 — Encrypted folders
- [ ] Create encrypted (`Cloud/Directory` with `IsEncrypted` + `X-Folder-Passphrase` ≥ 8) — finishes the Phase‑3 stub.
- [ ] Convert existing → encrypted (`/Encrypt`); decrypt (`/Decrypt`).
- [ ] Unlock (`/Unlock` → folder token) / lock (`/Lock` → invalidates tokens); **encrypted badge** in listings.

### 5.4 — Hidden folders
- [ ] Hide / unhide (`/Hide`, `/Unhide`).
- [ ] **Global `Shift Shift`** key handler → `RevealDialog` → `/Reveal` → hidden token; matches by passphrase; token
      folded into the `directories` query key.
- [ ] Conceal (`/Conceal` → invalidates hidden tokens).

## Endpoints used
`Cloud/Directory/Unlock`, `/Lock`, `/Encrypt`, `/Decrypt`, `/Hide`, `/Unhide`, `/Reveal`, `/Conceal` (+ create with
`IsEncrypted`). Contracts: [cloud-directory](../../05-api/modules/cloud-directory.md).

## Acceptance‑test checklist
- [ ] Create encrypted folder (passphrase ≥ 8); it shows the encrypted badge; contents require unlock.
- [ ] Unlock mints a token; an **ancestor's** token unlocks children without re‑prompt.
- [ ] Token **TTL expiry → transparent re‑prompt**; explicit **lock** clears it.
- [ ] Hide removes a folder from listings; **`Shift Shift`** + correct passphrase reveals matching hidden folders.
- [ ] Conceal re‑hides and invalidates the hidden token.
- [ ] **Sign‑out and tab close clear ALL tokens**; nothing is ever written to localStorage.
- [ ] Convert‑to‑encrypted and decrypt round‑trip correctly.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| Never‑persist guarantee | In‑memory store only; explicit `beforeunload` + sign‑out clear; audit for stray persistence. |
| Ancestor lookup correctness | Dedicated resolver with unit tests over nested paths. |
| 403 gating vs. re‑prompt loop | Distinguish "needs token" from "wrong passphrase"; cap re‑prompts; clear messaging. |

## Rollback / fallback
If ancestor reuse is unreliable, fall back to per‑folder unlock prompts (slightly more friction, still correct). Marks
in `sessionStorage` can be dropped (recompute from listings) without breaking security.

## Acceptance additions (audit HIGH/MEDIUM)

These items lock the audit findings into the phase exit gate. All checkboxes must be green before Phase 5 closes.

### A1 — `pagehide` + `event.persisted` clears tokens
- [ ] `secureFolders.store.ts` registers a `pagehide` listener (NOT `beforeunload` alone — Safari/iOS fire `pagehide`
      reliably).
- [ ] When `event.persisted === false` → clear ALL tokens (true tab close / nav away).
- [ ] When `event.persisted === true` → tokens are preserved (page entered bfcache); restoring from bfcache MUST leave
      the unlock state intact.
- [ ] Verified manually via **DevTools → Application → Back/Forward Cache**: trigger bfcache eviction vs restore and
      confirm token state matches each branch.

### A2 — Cross-tab UX (no shared token state)
- [ ] Tokens are tab-local — no `BroadcastChannel`, no `storage` event, no shared worker.
- [ ] Scenario test: **Tab A unlocks `/work` → Tab B requests a child of `/work` → Tab B receives 403 → Tab B re-prompts
      for passphrase.**
- [ ] State matrix in [secure-folders feature spec](../../04-features/secure-folders.md) includes the variant
      **"Locked (other tab unlocked)"** so designers/devs render the re-prompt affordance, not a generic error.

### A3 — Unlock `onSuccess` sequencing
- [ ] Order is fixed: **(1) write token to `secureFolders.store`** → **(2) `queryClient.invalidateQueries(...)`** for
      affected `directories` keys.
- [ ] Reversing the order causes a refetch that lacks the header and 403s — guarded by a unit test with a spy on both
      `store.setToken` and `queryClient.invalidateQueries` asserting call order.

### A4 — Conceal atomicity
| Failure mode | Local token state | UX |
|---|---|---|
| Network failure (offline, timeout, abort) | **Preserved** — folder is still effectively unlocked locally | Toast: `"Conceal failed"` |
| 5xx from backend | **Cleared locally** | Ambiguous toast: backend state unknown, treat as locked |
| 2xx | Cleared locally | Success toast |

- [ ] Mutation handler implements the matrix above explicitly (no "always clear" / "always preserve" shortcut).
- [ ] Unit tests cover each row.

### A5 — Encrypted folder socket events suppressed
- [ ] Backend contract: **NO `FILE_*` socket events are emitted for paths under a locked encrypted folder** for clients
      lacking the matching unlock token. (Server-side filter, not client-side drop.)
- [ ] Contract verified via socket spy: subscribe in a session with no token → perform server-side mutations under a
      locked path → assert zero `FILE_*` frames received.
- [ ] If the spec lands incomplete, file a backend issue and gate Phase 5 exit on it.

### A6 — `registerSecureFolderTokenSource` default no-op
- [ ] `service/token-sources.ts` ships a default getter that returns `undefined`.
- [ ] When `app/providers.tsx` has not (yet) called `registerSecureFolderTokenSource(...)`, the secure-folder
      interceptor MUST NOT attach `X-Folder-Session` / `X-Hidden-Session` headers.
- [ ] Unit test: import `service/Instance.ts` cold, fire a `/Api/Cloud/*` request, assert headers are absent.

### A7 — Path marks vs tokens separation
Two distinct stores, two distinct lifetimes:

| Store | File | Persistence | Contents |
|---|---|---|---|
| Path marks | `features/secure-folders/stores/pathMarksCache.store.ts` | **Persisted** (`sessionStorage`) | `{ path → { isEncrypted, isHidden } }` — "is this folder locked?" marks for UX hints |
| Tokens | `features/secure-folders/stores/secureFolders.store.ts` | **In-memory only** | `{ rootPath → { token, expiresAt } }` for both encrypted + hidden namespaces |

- [ ] ESLint guard on `secureFolders.store.ts` bans `persist`, `localStorage`, `sessionStorage`, and `cookie`.
- [ ] `pathMarksCache.store.ts` may persist freely — marks leak no secret material.
- [ ] Listings reconcile marks on fetch; a missing/stale mark never blocks a real request.

### A8 — DevTools introspection risk acknowledged
- [ ] Top-of-file comment in `secureFolders.store.ts` references the accepted-risk note in
      [secure-folder-lifecycle §12](../../02-architecture/secure-folder-lifecycle.md#12-accepted-risks) (tokens are
      readable from DevTools by a user who already controls the page — out of scope for the threat model).
- [ ] Comment is enforced by an ESLint `no-restricted-syntax` / file-header rule so it cannot silently disappear in a
      refactor.

## Exit criteria
Encrypted and hidden folders work end‑to‑end with a correct, never‑persisted token lifecycle, and **every checkbox in
"Acceptance additions (audit HIGH/MEDIUM)" above is green**. Then begin [Phase 6](./phase-6-advanced.md).
