# Feature — Secure Folders (Phase 5) 🟢

> Encrypted + hidden folders. Architecture (the important part):
> [secure-folder-lifecycle](../02-architecture/secure-folder-lifecycle.md) · API: [cloud-directory](../05-api/modules/cloud-directory.md).

## Encrypted folders
| Action | Component | Endpoint | States / edge |
|---|---|---|---|
| Create encrypted | `CreateFolderDialog` (Encrypt toggle → passphrase) | `Cloud/Directory` (`IsEncrypted` + `X-Folder-Passphrase` ≥8) | weak passphrase; encrypted **badge** |
| Convert existing → encrypted | item menu | `Cloud/Directory/Encrypt` (passphrase) | confirm |
| Decrypt | item menu | `Cloud/Directory/Decrypt` (passphrase) | confirm |
| Unlock | `PassphraseDialog` | `Cloud/Directory/Unlock` → folder token | wrong passphrase vs needs‑token; **TTL → transparent re‑prompt**; **ancestor token reuse** |
| Lock | item menu | `Cloud/Directory/Lock` | drops token immediately |

**Browse a locked folder:** listing returns `403`/locked → show **locked state** → `PassphraseDialog` → unlock →
contents (token folded into the directories query key).

## Hidden folders
| Action | Component | Endpoint | States / edge |
|---|---|---|---|
| Hide / unhide | item menu | `Cloud/Directory/Hide` / `/Unhide` (passphrase) | folder vanishes from listings |
| **Reveal (`Shift Shift`)** | global key handler → `RevealDialog` | `Cloud/Directory/Reveal` → hidden token | matches by passphrase; token in query key |
| Conceal | item menu | `Cloud/Directory/Conceal` | re‑hides; invalidates hidden token |

## Token lifecycle (UX‑visible parts)
- Tokens are **in‑memory only, never persisted**; **ancestor‑aware** (unlock a parent → children open);
  **TTL expiry → transparent re‑prompt**; **explicit lock/conceal clears**; **logout + tab close clear ALL**.
- The [Instance](../02-architecture/data-layer.md) injects `X-Folder-Session`/`X-Hidden-Session` based on the request
  path. Full rules: [secure-folder-lifecycle](../02-architecture/secure-folder-lifecycle.md).

## States (matrix)
locked (encrypted, no session) · reveal‑required (hidden, no session) · wrong‑passphrase (error) · expired (re‑prompt) ·
normal (unlocked/revealed). See [state-matrix](../02-architecture/state-matrix.md).

## a11y / safety
- `Shift Shift` has an accessible alternative entry (menu action) for users who can't double‑tap Shift.
- Passphrase fields never autofill/persist; dialogs explain the min‑8 rule and the difference between "wrong passphrase"
  and "needs unlocking".
