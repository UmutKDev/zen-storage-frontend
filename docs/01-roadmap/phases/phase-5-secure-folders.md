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

## Exit criteria
Encrypted and hidden folders work end‑to‑end with a correct, never‑persisted token lifecycle. Then begin
[Phase 6](./phase-6-advanced.md).
