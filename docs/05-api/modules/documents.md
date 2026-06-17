# API — Documents

> `@Controller('Cloud/Documents')` → `/Api/Cloud/Documents/*`. File: `src/modules/document/document.controller.ts`.
> CASL `Document`. Back to [API index](../API-INVENTORY.md). Feature: [preview](../../04-features/preview.md) (editing).

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| POST | `` | `DocumentCreateRequestModel` (Path, Name, Content?, ConflictStrategy?) | `DocumentResponseModel` | text/code extensions |
| GET | `/Content` | `DocumentContentRequestModel` (Key, IncludeDraft?) | `DocumentContentResponseModel` (Content, ContentHash, LockStatus, LockedBy, LockExpiresAt, IsDraft…) | |
| PUT | `/Content` | `DocumentUpdateContentRequestModel` (Key, Content, ExpectedContentHash?) | `DocumentContentResponseModel` | **409** hash mismatch · **423** locked‑by‑other · **429** throttle |
| GET | `/Find` | `DocumentKeyRequestModel` | `DocumentResponseModel` | |
| POST | `/Lock` | `DocumentKeyRequestModel` | `DocumentLockResponseModel` (ExpiresAt, **TTL 5 min**) | acquire/extend; **423** if held |
| DELETE | `/Lock` | `DocumentKeyRequestModel` | `boolean` | release (owner only) |
| PUT | `/Lock/Heartbeat` | `DocumentKeyRequestModel` | `DocumentLockResponseModel` | keep‑alive (~every 3 min) |
| POST | `/Draft` | `DocumentDraftRequestModel` (Key, Content) | `DocumentDraftResponseModel` (SavedAt, NextAllowedSaveAt) | **1 save / 10s**; S3 backup every 5th |
| DELETE | `/Draft` | `DocumentKeyRequestModel` | `boolean` | discard draft |
| GET | `/Versions` | `DocumentKeyRequestModel` | `CloudVersionListResponseModel` | |
| GET | `/Versions/Diff` (route `/Diff`) | `DocumentDiffRequestModel` (Key, Source/TargetVersionId) | `DocumentDiffResponseModel` (Hunks, Stats) | unified diff |
| PUT | `/Versions/Restore` | `DocumentRestoreVersionRequestModel` | void | |
| DELETE | `/Versions` | `DocumentDeleteVersionRequestModel` | void | not current |

## Editing lifecycle (client)
```
open → GET /Content (+draft) → POST /Lock (TTL 5m)
   edit → POST /Draft (throttle 1/10s)  + PUT /Lock/Heartbeat (~3m)
   save → PUT /Content (ExpectedContentHash)
   close → DELETE /Lock
```
**Edge:** `423` (held by other) → read‑only banner; `409` (hash mismatch) → reconcile; `429` (draft throttle) →
debounce to the window; **unsaved‑changes guard** before close/navigate. See
[preview](../../04-features/preview.md#textcode-editing).
