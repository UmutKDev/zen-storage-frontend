# API — Cloud Archive (zip / extract)

> `@Controller('Cloud/Archive')` → `/Api/Cloud/Archive/*`. File: `src/modules/cloud/cloud.archive.controller.ts`.
> CASL `CloudArchive`/`Archive`/`Extract` · async **BullMQ jobs**, progress via socket. Back to
> [API index](../API-INVENTORY.md). Feature: [advanced](../../04-features/advanced.md).

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/Create/Start` | `…CreateStartRequestModel` (Keys[], Format?, OutputName?) | `{ JobId, Format, OutputKey }` |
| POST | `/Create/Cancel` | `…CreateCancelRequestModel` (JobId) | `{ Cancelled }` |
| POST | `/Extract/Start` | `…ExtractStartRequestModel` (Key, SelectedEntries?[]) | `{ JobId, Format }` |
| POST | `/Extract/Cancel` | `…ExtractCancelRequestModel` (JobId) | `{ Cancelled }` |
| GET | `/Preview` | `…PreviewRequestModel` (Key) | `{ Key, Format, TotalEntries, Entries:[{Path,Type,Size,…}] }` |

- **Socket events:** `ARCHIVE_CREATE_PROGRESS/COMPLETE/FAILED`, `ARCHIVE_EXTRACT_PROGRESS/COMPLETE/FAILED`.
- **Formats:** ZIP / TAR / TAR_GZ / RAR.

## Client transport
**Socket‑first + polling fallback** ([realtime-socket](../../02-architecture/realtime-socket.md)): subscribe to job
progress by `JobId`; a low‑frequency status reconciliation covers missed events. On `COMPLETE`, invalidate the affected
folder list (create output appears; extract writes entries). Output conflicts route through the
[conflict pattern](../../02-architecture/conflict-resolution.md).
