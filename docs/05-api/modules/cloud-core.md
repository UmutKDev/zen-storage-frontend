# API — Cloud (core)

> `@Controller('Cloud')` → `/Api/Cloud/*`. File: `src/modules/cloud/cloud.controller.ts`. Session auth · CASL `Cloud`.
> Optional `x-team-id`, `x-folder-session`, `x-hidden-session`. Back to [API index](../API-INVENTORY.md).

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/List` | `CloudListRequestModel` (Path, Delimiter, Skip, Take, Search…) | `CloudListResponseModel` | combined dirs+objects |
| GET | `/List/Breadcrumb` | `CloudListBreadcrumbRequestModel` | `CloudBreadCrumbModel[]` | Path → crumbs |
| GET | `/List/Directories` | `CloudListDirectoriesRequestModel` | `CloudDirectoryModel[]` | honors `x-hidden-session` |
| GET | `/List/Objects` | `CloudListObjectsRequestModel` | `CloudObjectModel[]` | files only |
| GET | `/Search` | `CloudSearchRequestModel` (Path, Extension, Search, pagination) | `CloudSearchResponseModel` | **path + extension** ⇒ global vs current |
| GET | `/User/StorageUsage` | — | `CloudUserStorageUsageResponseModel` | used/limit bytes, % (usage bar) |
| GET | `/Find` | `CloudKeyRequestModel` (Key) | `CloudObjectModel` | single object metadata |
| GET | `/PresignedUrl` | `CloudPreSignedUrlRequestModel` (Key) | `string` | **basis of MVP "Share"** + direct download |
| PUT | `/Move` | `CloudMoveRequestModel` | `boolean` | `idempotency-key`; conflict strategy |
| DELETE | `/Delete` | `CloudDeleteRequestModel` | `boolean` | `idempotency-key` |
| PUT | `/Update` | `CloudUpdateRequestModel` | `CloudObjectModel` | rename/metadata |
| GET | `/Download` | `CloudKeyRequestModel` | binary stream | subscription‑throttled (`ThrottleTransform`); **bypasses envelope** |
| GET | `/Versions` | `CloudKeyRequestModel` | `CloudVersionListResponseModel` | S3 versions |
| PUT | `/Versions/Restore` | `CloudRestoreVersionRequestModel` | void | restore old version |
| DELETE | `/Versions` | `CloudDeleteVersionRequestModel` | void | delete a version |
| POST | `/Scan/Duplicate/Start` | `CloudDuplicateScanStartRequestModel` (Path, Recursive, SimilarityThreshold) | `…StartResponseModel` (ScanId) | SHA‑256 + dHash |
| GET | `/Scan/Duplicate/Status` | `CloudDuplicateScanIdRequestModel` | `…StatusResponseModel` | phase/percentage |
| GET | `/Scan/Duplicate/Result` | `CloudDuplicateScanIdRequestModel` | `…ResultResponseModel` | groups + similarity + savings |
| POST | `/Scan/Duplicate/Cancel` | `CloudDuplicateScanIdRequestModel` | `…CancelResponseModel` | |

> Route decorators re‑confirmed in `cloud.controller.ts` (List@89, Breadcrumb@120, Directories@133, Objects@164,
> Search@186, StorageUsage@216, Find@243, PresignedUrl@254, Move@278, Delete@298, Update@313,
> Download@330, Versions@404, Versions/Restore@419, Versions DELETE@433, Duplicate Start@450/Status@464/Result@477/Cancel@489).

## Key model — `CloudObjectModel` (`cloud.model.ts`)
`Name, Extension, MimeType, Path:CloudPathModel, Metadata:Record, LastModified, ETag, Size`.
- Image `Metadata.Width/Height` set by `cloud.metadata.service.ts` (sharp).
- `CloudPathModel.Url` resolved to the CDN via `CDNPathResolver`. **CDN = `cdn.storage.umutk.me`.** Every object is served
  from there; the storage backend is **rustfs**, so the returned URL is already **HMAC‑signed** (don't strip/rebuild it —
  use the URL as given).
- **`?w=&h=` resizing IS supported ✅ (verified, [Q5](../../07-decisions/open-questions.md)):** the CDN reverse‑proxies
  images through **[wsrv.nl](https://wsrv.nl)**, which honors `?w` / `?h` (and other wsrv params). So image scaling +
  scaled‑vs‑original download are real, not assumed. `imageCdn.ts` builds these URLs; treat the HMAC‑signed base URL as
  opaque and append the resize query.

## Usage notes
- **Share (MVP)** = `GET /PresignedUrl` (time‑limited); no dedicated share controller exists
  ([Q1](../../07-decisions/open-questions.md)).
- **Download** streams binary and **bypasses the envelope** — don't run it through the unwrap path
  ([data-layer §5](../../02-architecture/data-layer.md)).
- Move/Delete require **`Idempotency-Key`** (the [Instance](../../02-architecture/data-layer.md) attaches it).
