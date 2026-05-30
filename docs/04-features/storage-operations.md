# Feature — Storage: Operations (Phase 3) 🟢

> Create, rename, move, delete, multi‑select + bulk, download. API: [cloud-core](../05-api/modules/cloud-core.md),
> [cloud-directory](../05-api/modules/cloud-directory.md), [documents](../05-api/modules/documents.md).

## Create
| Action | Component | Endpoint | States / edge |
|---|---|---|---|
| Create folder | `CreateFolderDialog` (incl. **Encrypt** option → passphrase, Phase 5) | `Cloud/Directory` (`IsEncrypted`?) | name conflict; weak passphrase (<8); encrypted badge |
| Create file | `CreateDocumentDialog` | `Cloud/Documents` | extension allow‑list; conflict |

## Rename
- Inline edit or `RenameDialog`. **Endpoints:** `Cloud/Update` (file), `Cloud/Directory/Rename` (dir).
- Edge: conflict (dialog); locked/encrypted dir needs a session token.

## Move
- **Two ways:** drag item → folder (dnd‑kit), or `MoveDialog` (folder picker).
- **Endpoint:** `Cloud/Move` (`Idempotency-Key`). Optimistic + rollback; conflict via dialog.
- Drag‑move is visually distinct from file‑drop‑upload ([upload-pipeline](../02-architecture/upload-pipeline.md)).

## Delete
- `DeleteConfirm` (`alert-dialog`). **Endpoints:** `Cloud/Delete` (`Idempotency-Key`), `DELETE /Cloud/Directory`.
- Optimistic; **no trash** in MVP — copy makes deletion's finality clear (design leaves room for a future trash, D4).

## Multi‑select + bulk
- `useItemSelection` (click, Shift‑range, Ctrl/Cmd‑toggle, select‑all); `BulkActionBar` (count, clear).
- **Bulk delete / move / download** (loop endpoints); **apply‑to‑all** conflict handling.
- Mixed types handled; selection survives view toggle within a folder.

## Download
- Item menu / preview toolbar → `Cloud/PresignedUrl` (or `Cloud/Download`, subscription‑throttled).
- Images with metadata offer **scaled vs original** ([preview](./preview.md)).

## States (matrix)
optimistic + rollback on every mutation; conflict (409) dialog; 403 (secure folder) → unlock prompt; AV‑infected may
gate download; quota irrelevant to delete but relevant to move‑into‑encrypted. See
[state-matrix](../02-architecture/state-matrix.md).

## a11y
- All actions reachable via row/card menu (keyboard); confirmations trap focus; bulk bar announces selection count.
