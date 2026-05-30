# API — Cloud Directory (encrypted + hidden)

> `@Controller('Cloud/Directory')` → `/Api/Cloud/Directory/*`. File: `src/modules/cloud/cloud.directory.controller.ts`.
> CASL `CloudDirectory`/`Execute`. Back to [API index](../API-INVENTORY.md). Feature:
> [secure-folders](../../04-features/secure-folders.md) · Lifecycle:
> [secure-folder-lifecycle](../../02-architecture/secure-folder-lifecycle.md).

| Method | Path | Request | Response | Headers |
|---|---|---|---|---|
| POST | `` (`/Cloud/Directory`) | `DirectoryCreateRequestModel` (Path, IsEncrypted?, ConflictStrategy?) | `DirectoryResponseModel` | `x-folder-passphrase`? (if encrypted), `x-folder-session`?, `x-team-id`? |
| PUT | `/Rename` | `DirectoryRenameRequestModel` (Path, Name, ConflictStrategy?) | `DirectoryResponseModel` | passphrase/session |
| DELETE | `` | `DirectoryDeleteRequestModel` (Path) | `boolean` | passphrase/session |
| POST | `/Unlock` | `DirectoryUnlockRequestModel` (Path) | `DirectoryUnlockResponseModel` (`SessionToken, ExpiresAt, TTL, EncryptedFolderPath`) | **`x-folder-passphrase` required** |
| POST | `/Lock` | `DirectoryLockRequestModel` (Path) | `boolean` | invalidates folder sessions |
| POST | `/Encrypt` | `DirectoryConvertToEncryptedRequestModel` (Path) | `DirectoryResponseModel` | **passphrase required** |
| POST | `/Decrypt` | `DirectoryDecryptRequestModel` (Path) | `DirectoryResponseModel` | **passphrase required** |
| POST | `/Hide` | `DirectoryHideRequestModel` (Path) | `DirectoryResponseModel` | **passphrase required** |
| POST | `/Unhide` | `DirectoryUnhideRequestModel` (Path) | `DirectoryResponseModel` | **passphrase required** |
| POST | `/Reveal` | `DirectoryRevealRequestModel` (Path) | `DirectoryRevealResponseModel` (`SessionToken, ExpiresAt, TTL, HiddenFolderPath`) | **passphrase required** → `x-hidden-session` token |
| POST | `/Conceal` | `DirectoryConcealRequestModel` (Path) | `boolean` | invalidates hidden sessions |

## Token flow
- **Unlock** → `x-folder-session`; **Reveal** → `x-hidden-session`.
- Both tokens are **base64, folder‑scoped, TTL‑bound, ancestor‑applicable** (a parent's token unlocks children).
- Tokens are **not persisted server‑side beyond their TTL**; the client **never persists them at all**
  ([secure-folder-lifecycle](../../02-architecture/secure-folder-lifecycle.md)).

## Client rules
- The [Instance](../../02-architecture/data-layer.md) injects the right header per request path (ancestor‑aware).
- `403`/locked → transparent re‑prompt (`PassphraseDialog`); explicit `Lock`/`Conceal` clears the client token.
- Create‑encrypted finishes the Phase‑3 stub in Phase 5; passphrase min length **8**.
