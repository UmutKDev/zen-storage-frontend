# Phase 5 — Secure Folders

> **Status:** ✅ complete (frontend code + unit-verified; live backend walkthrough pending creds) — **Stage A** token
> spine, **Stage B** encrypted folders, **Stage C** hidden folders. Staged per the secure-folder lifecycle. · **Depends
> on:** [Phase 3](./phase-3-storage-core.md) · **Sibling:** [Phase 4](./phase-4-preview-share.md).
> **Feature spec:** [secure-folders](../../04-features/secure-folders.md) ·
> **Architecture:** [secure-folder-lifecycle](../../02-architecture/secure-folder-lifecycle.md) ·
> **API:** [cloud-directory](../../05-api/modules/cloud-directory.md) · **Decisions:** D-P5.1–D-P5.8.

## Objective
**Encrypted** and **hidden** folders, backed by a correct, secure **session‑token lifecycle** — tokens live in
**`sessionStorage` only** (tab‑scoped, TTL‑pruned on rehydrate — D-P5.7; the **passphrase is never stored**), are
ancestor‑applicable, expire transparently, and are cleared on sign‑out (tab close handled natively by `sessionStorage`).

## Scope
**In:** encrypted folder create/convert/decrypt + unlock/lock + badge; hidden folder hide/unhide + `Shift Shift` reveal +
conceal; `sessionStorage`‑persisted token store (ancestor lookup, TTL re‑prompt + proactive re‑lock, explicit lock,
clear‑on‑logout); `Instance` header injection (`X-Folder-Session` / `X-Hidden-Session`).
**Out:** team‑scoped secure folders (still Personal in MVP).

## Task breakdown

### 5.1 — Token store & lifecycle → see [secure-folder-lifecycle](../../02-architecture/secure-folder-lifecycle.md)
- [x] `features/secure-folders/stores/secureFolders.store.ts` (zustand), persisted to **`sessionStorage` only** (D-P5.7 —
      tab-scoped, TTL-pruned on rehydrate; the passphrase is never stored; no `localStorage`/cookie/cross-tab). Two
      namespaces: encrypted (`X-Folder-Session`) and hidden (`X-Hidden-Session`).
- [x] The store lives inside the `features/secure-folders/` feature (not in the global `stores/`); the ESLint override on
      that exact file **hard-bans `localStorage` + `document.cookie`** (`persist` + `sessionStorage` are permitted only here
      — D-P5.7). *(Verified firing via a temp violation.)*
- [x] Store `{ token, expiresAt }` keyed by the returned root folder path. *(Encrypted: `EncryptedFolderPath`; hidden: the **reveal-request path** — D-P5.5.)*
- [x] **Ancestor‑aware lookup:** a request for `a/b/c` uses the nearest valid ancestor token. *(`isAncestor` + `resolveToken`/`resolveTokenEntry`.)*
- [x] **TTL expiry → re‑prompt.** Reactively: the interceptor getter drops the expired token → the listing 403s → the
      in-place `FolderLocked`/unlock dialog. Proactively (D-P5.8, commit 0761af6): `useSecureFolderExpiry(path)` watches the
      TTL of the token covering the current folder and re-opens the unlock dialog (encrypted) / toasts + conceals (hidden)
      the moment it lapses while you are inside the folder.
- [x] **Clear ALL** on sign‑out (`signOutAndCleanup` → `clearAll()`). Tab close is handled **natively by `sessionStorage`** —
      the `pagehide`/`visibilitychange` handler was **removed** (D-P5.7; `pagehide` fires on refresh too and would defeat
      refresh-survival). **Never `beforeunload`.**
- [x] **Token persistence (D-P5.7):** the token map persists to `sessionStorage` via zustand `persist` +
      `createJSONStorage(() => sessionStorage)`, `partialize`d to tokens, with a `merge` that prunes expired entries on
      rehydrate — an unlock/reveal survives a page refresh in the same tab. *(Tests: `tests/secure-folders/persistence.test.ts`.)*
- [~] Path‑*marks* are not persisted at all; the only `sessionStorage` use is the token store above. *(No marks store built —
      backend `CloudDirectoryModel` flags drive the badges; A7's separation holds trivially — D-P5.6.)*

### 5.2 — Instance header injection
- [x] For `/Api/Cloud/*` calls, the secure-folder header (`X-Folder-Session` / `X-Hidden-Session`) is attached by `service/interceptors/secure-folder.ts`, which reads tokens via the seam `service/token-sources.ts.registerSecureFolderTokenSource(getter)` registered from `app/providers.tsx`. `service/` never imports `@/features/secure-folders`. *(The interceptor extracts the target path from the query + the **JSON-stringified** body — D-P5.3.)*
- [x] Ancestor matching uses `lib/utils/paths.ts.isAncestor` (shared helper, unit-tested).

### 5.3 — Encrypted folders
- [x] Create encrypted (`Cloud/Directory` with `IsEncrypted` + `X-Folder-Passphrase` ≥ 8) — finishes the Phase‑3 stub. *(NewFolderDialog encrypt toggle + min-8.)*
- [x] Convert existing → encrypted (`/Encrypt`); decrypt (`/Decrypt`). *(Menu/sheet actions → `PassphraseDialog`.)*
- [x] Unlock (`/Unlock` → folder token) / lock (`/Lock` → invalidates tokens); **encrypted badge** in listings. *(Locked-row click → unlock + navigate in; lock drops the token on confirmed success.)*

### 5.4 — Hidden folders
- [x] Hide / unhide (`/Hide`, `/Unhide`). *(Menu/sheet actions → `PassphraseDialog`; both require the passphrase.)*
- [x] **Global `Shift Shift`** key handler → reveal dialog → `/Reveal` → hidden token; matches by passphrase; token
      folded into the `directories` query key. *(Double-tap detection in `useShortcutDispatcher`; reveal reuses `UnlockDialog mode="hidden"`; **keyed by the request path** — D-P5.5; + an accessible command-palette alternative.)*
- [x] Conceal (`/Conceal` → re-hides). *(Per-folder backend session-delete; re-hides via refetch — A4, D-P5.5.)*

## Endpoints used
`Cloud/Directory/Unlock`, `/Lock`, `/Encrypt`, `/Decrypt`, `/Hide`, `/Unhide`, `/Reveal`, `/Conceal` (+ create with
`IsEncrypted`). Contracts: [cloud-directory](../../05-api/modules/cloud-directory.md).

## Acceptance‑test checklist
*(Implemented + unit-verified; the live backend round-trip is pending creds — see the status note.)*
- [x] Create encrypted folder (passphrase ≥ 8); it shows the encrypted badge; contents require unlock.
- [x] Unlock mints a token; an **ancestor's** token unlocks children without re‑prompt. *(`resolveToken` ancestor lookup.)*
- [x] Token **TTL expiry → re‑prompt** — reactive (403 → unlock dialog) **and proactive** (`useSecureFolderExpiry` re-opens
      the unlock dialog / conceals the moment the TTL lapses in-place — D-P5.8); explicit **lock** clears it.
- [x] An unlock/reveal **survives a page refresh** in the same tab (token in `sessionStorage`); the passphrase is never stored. *(D-P5.7.)*
- [x] Hide removes a folder from listings; **`Shift Shift`** + correct passphrase reveals matching hidden folders.
- [x] Conceal re‑hides. *(Drives re-hide via refetch — A4.)*
- [x] **Sign‑out clears ALL tokens** (`clearAll()`); tab close clears them **natively via `sessionStorage`**; nothing is ever
      written to `localStorage`/cookie. *(ESLint bans localStorage/cookie; no `pagehide` handler — D-P5.7.)*
- [x] Convert‑to‑encrypted and decrypt round‑trip correctly.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| Bounded token persistence (D-P5.7) | `sessionStorage` only (tab-scoped, TTL-pruned, passphrase never stored, no localStorage/cookie); sign-out clears via `clearAll()`; tab close native to `sessionStorage`; audit for stray persistence. |
| Ancestor lookup correctness | Dedicated resolver with unit tests over nested paths. |
| 403 gating vs. re‑prompt loop | Distinguish "needs token" from "wrong passphrase"; cap re‑prompts; clear messaging. |

## Rollback / fallback
If ancestor reuse is unreliable, fall back to per‑folder unlock prompts (slightly more friction, still correct). If
`sessionStorage` persistence (D-P5.7) ever proves problematic, the token store can revert to in-memory (the only cost is
that a refresh re-prompts) without breaking security — the passphrase is never stored either way.

## Acceptance additions (audit HIGH/MEDIUM)

These items lock the audit findings into the phase exit gate. All checkboxes must be green before Phase 5 closes.

### A1 — Tab-close / refresh token scoping *(superseded by D-P5.7)*
The original A1 used a `pagehide` + `event.persisted` listener (`features/secure-folders/lifecycle/tab-close.ts`) to clear
tokens on a true tab close while preserving them across bfcache. **D-P5.7 removed that handler and file** — `pagehide`
fires on a normal refresh too, which would have defeated refresh-survival. Tab close and bfcache are now handled **natively
by `sessionStorage`** (the store persists there; the browser clears it on real tab close and preserves it across bfcache /
refresh), so the manual `event.persisted` branching is no longer needed.
- [x] Token scoping is `sessionStorage`-native: cleared on real tab close, preserved across refresh + bfcache (D-P5.7).
- [x] Sign-out still clears ALL tokens explicitly via `clearAll()` (empties the persisted entry). **Never `beforeunload`.**
- [~] Manual **DevTools → Back/Forward Cache** + refresh-survival verification — pending the live walkthrough.

### A2 — Cross-tab UX (no shared token state)
- [x] Tokens are tab-local — no `BroadcastChannel`, no `storage` event, no shared worker (zustand persisted to
      `sessionStorage`, which is itself tab-scoped — the tab-local guarantee holds; D-P5.7).
- [~] Scenario (Tab A unlocks → Tab B 403 → Tab B re-prompts) — behaviorally covered (Tab B's 403 → the in-place `FolderLocked`/unlock dialog); manual cross-tab check pending the live walkthrough.
- [~] Feature-spec state-matrix variant **"Locked (other tab unlocked)"** — the generic `FolderLocked` (403) state already renders the re-prompt; a dedicated spec variant entry not separately added.

### A3 — Unlock `onSuccess` sequencing
- [x] Order is fixed: **(1) `setToken`** → **(2) `invalidateScope(qc, ownerId)`** (covers the affected `directories` keys).
- [x] Guarded by a unit test asserting the token is in the store **before** invalidate fires (`use-unlock.test.tsx`; same for `useReveal`).

### A4 — Conceal atomicity
| Failure mode | Local token state | UX |
|---|---|---|
| Network failure (offline, timeout, abort) | **Preserved** — folder is still effectively unlocked locally | Toast: `"Conceal failed"` |
| 5xx from backend | **Cleared locally** | Ambiguous toast: backend state unknown, treat as locked |
| 2xx | Cleared locally | Success toast |

- [x] `useConceal` implements the matrix explicitly — **adapted for the shared-token model** (D-P5.5): conceal is a per-folder backend session-delete that re-hides **via refetch** rather than clearing a per-folder client token (the hidden token is reveal-root-scoped). Network-fail → no invalidate (stays revealed) + toast; 5xx → invalidate (server truth) + warn; 2xx → invalidate + success. No "always" shortcut.
- [x] Unit tests cover each row (`use-conceal.test.tsx`). *(silent-failure-hunter confirmed the branch + early-return.)*

### A5 — Encrypted folder socket events suppressed
- [~] **Backend contract** — NOT a frontend-verifiable item (D-P5.6). Per [lifecycle §15](../../02-architecture/secure-folder-lifecycle.md), the MVP simplification is that secure folders **don't emit live socket events at all** — changes surface on the next refetch (the frontend never subscribes specially under a locked path). The server-side `FILE_*` filter + socket-spy verification is a **backend/live-verify** task; it does not gate the frontend code.

### A6 — `registerSecureFolderTokenSource` default no-op
- [x] `service/token-sources.ts` ships a default getter returning `null`.
- [x] Without a registration, the secure-folder interceptor attaches **no** `X-Folder-Session`/`X-Hidden-Session` headers.
- [x] Unit-tested (`tests/secure-folders/interceptor.test.ts`): a `/Cloud/*` request with the no-op source → headers absent.

### A7 — Path marks vs tokens separation
- [x] ESLint guard on `secureFolders.store.ts` **hard-bans `localStorage`/`document.cookie`** (verified firing); `persist`
      + `sessionStorage` are permitted only on this file (D-P5.7 — they implement refresh-survival).
- [~] **No `pathMarksCache.store.ts` built (deviation — D-P5.6):** the backend `CloudDirectoryModel.{IsEncrypted,IsLocked,IsHidden,IsConcealed}` flags arrive fresh on every listing and already drive the badges (`EntryStatusChip`) + menu gating, so a persisted client marks-cache is unnecessary. A7's intent — **tokens never commingled with persisted marks** — holds **trivially**: the only secure store is the in-memory token store.
- [x] Listings carry the flags fresh; nothing stale blocks a real request.

### A8 — DevTools introspection risk acknowledged
- [x] Top-of-file comment in `secureFolders.store.ts` records the accepted DevTools-introspection risk (TTL-bounded, trusted machine, needs an active session).
- [~] ESLint-enforcement of the comment's presence — not added (a comment-presence lint rule is heavier than its value; the comment is in place).

## Exit criteria
Encrypted and hidden folders work end‑to‑end with a correct, **`sessionStorage`-scoped, TTL-pruned** token lifecycle
(passphrase never stored — D-P5.7). **Frontend: code-complete + unit-verified + reviewer-clean** (every code checkbox above
green). Remaining `[~]` items are **live-backend/manual verification** (bfcache + refresh-survival, cross-tab, the full
round-trip) pending creds, the **A5 backend** socket contract, and two acknowledged **deviations** (A7 no separate marks
store; A8 comment not lint-enforced) — none blocks the frontend. Then begin [Phase 6](./phase-6-advanced.md). ✅ **Phase 6
has since started** (notifications inbox — see [ROADMAP](../ROADMAP.md)).

## Verification (2026-06-14)
Built **stage-by-stage** (A token spine → B encrypted → C hidden), each green + reviewer-clean. Final: `bunx tsc --noEmit`,
`bun run lint` (incl. the store localStorage/cookie-ban firing), `bun run build`, `size-limit` (no new deps), the
secure-folder suite covers `isAncestor`/`resolveToken`, the interceptor path-extraction, unlock/reveal A3 order + token
keying, conceal A4, the mutation wrappers, the `⇧⇧` gesture, and the create-encrypt dialog. Reviewers across the stages:
data-layer / a11y-state / design-system clean; silent-failure-hunter clean after adding a `genericMessage` to unlock/reveal
(non-403 failures no longer a silent dead dialog). **Decisions D-P5.1–D-P5.6.**

## Verification (2026-06-15 — post-phase amendments)
Two follow-ups landed after the 2026-06-14 close: **D-P5.7** (token → `sessionStorage`, tab-scoped + expiry-pruned; the
`pagehide`/tab-close handler + `lifecycle/tab-close.ts` removed; `tests/secure-folders/persistence.test.ts` covers
rehydrate-live / prune-expired / write-through / clearAll-wipe / no-localStorage) and **D-P5.8 / commit 0761af6** (browse
auto-refresh — 60s `BROWSE_REFETCH_INTERVAL_MS` + `refetchOnWindowFocus` — plus `useSecureFolderExpiry`, which re-locks
encrypted folders / conceals hidden ones when a token TTL expires in-place). Gates green: `bunx tsc --noEmit`, `bun run
lint`, `bun run build`, `size-limit` ~804.51 KB / 820, full Vitest suite ~296 pass. **Decisions D-P5.7–D-P5.8.**
