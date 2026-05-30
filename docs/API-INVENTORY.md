# API-INVENTORY.md

> Endpoint catalog for the **NestJS API** (`nestjs-storage`), the **contract source of truth** for v2.
> Verified against real controllers; each section cites file paths. Items not provable from code are marked
> **`UNVERIFIED`** and listed in [DECISIONS.md](./DECISIONS.md).
>
> **Last verified:** 2026-05-30 · **API:** NestJS 11, PostgreSQL/TypeORM + MongoDB (audit/notifications) + Redis (BullMQ/cache), S3 + CloudFront, ClamAV.

---

## 0. Global conventions

| Concern | Reality | Source |
|---|---|---|
| **Global prefix** | All routes under **`/Api`** | `src/main.ts:68` (`setGlobalPrefix('/Api')`) |
| **Versioning** | **URI** versioning. Default controllers → `/Api/<Ctrl>/…`; versioned → `/Api/v1/<Ctrl>/…` | `src/main.ts:46` (`VersioningType.URI`) |
| **Response envelope** | Non-stream responses wrapped `{ Result, Status:{ Messages, Code, Timestamp, Path } }`. Arrays → `Result.{ Items, Options:{ Skip, Take, Count, Search } }` | `src/common/interceptors/transform.interceptor.ts` |
| **Streaming** | Downloads bypass the envelope (`@Res({ passthrough:false })`) and stream binary | `cloud.controller.ts` (Download) |
| **Auth chain** | `CombinedAuthGuard` → `TeamContextGuard` → `PoliciesGuard` (all `APP_GUARD`) | `authentication.module.ts` |
| **Session auth** | Session id via **cookie** `SESSION_COOKIE_NAME`, header **`x-session-id`**, or `Authorization: Bearer`. 7-day TTL | `authentication/*` |
| **API-key auth** | Header **`x-api-key`** + **`x-api-secret`** (only the `/Api/v1/*` API module) | `api/guards/*` |
| **Team context** | Header **`x-team-id`** → validates membership, sets `user.TeamId`/`user.TeamRole` | `team/guards/team-context.guard.ts` |
| **Secure-folder headers** | **`x-folder-passphrase`** (min 8, unlock/reveal ops) → mints token; **`x-folder-session`** / **`x-hidden-session`** replay the token | `cloud.directory.controller.ts` |
| **Idempotency** | **`idempotency-key`** header on Move/Delete/CompleteMultipartUpload; API module uses `@Idempotent()` + Redis (24h) | `cloud.*`, `api/interceptors/api-idempotency.interceptor.ts` |
| **Naming** | **PascalCase** everywhere (`Id`, `Email`, `CreatedAt`, `Key`, `Path`) | repo-wide |
| **Storage owner** | `GetStorageOwnerId(user)` → `user.Id` (personal) or `team/{TeamId}` (team); S3 key prefix | `src/modules/cloud/cloud.context.ts` |
| **CASL** | Actions `Manage/Create/Read/Update/Delete/Upload/Download/Extract/Archive/Execute`; subjects per `Cloud*`, `Document`, `Account`, `Team*`, etc. | `authentication/casl/casl-ability.factory.ts` |

---

## 1. Authentication — `@Controller('Authentication')` → `/Api/Authentication/*`
File: `src/modules/authentication/authentication.controller.ts` · throttle 10/60s · most endpoints `@Public`.

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| POST | `/Login/Check` | `LoginCheckRequestModel` | `LoginCheckResponseModel` | Step 1: which auth methods + 2FA status for an email |
| POST | `/Login` | `LoginRequestModel` | `AuthenticationResponseModel` | Step 2: password; sets session cookie; may return `RequiresTwoFactor` |
| POST | `/Verify2FA` | `TwoFactorVerifyRequestModel` | `AuthenticationResponseModel` | Step 3: TOTP; call with `x-session-id` from step 2 |
| POST | `/Passkey/Login/Begin` | `PasskeyLoginBeginRequestModel` | `PasskeyLoginBeginResponseModel` | WebAuthn challenge |
| POST | `/Passkey/Login/Finish` | `PasskeyLoginFinishRequestModel` | `AuthenticationResponseModel` | **Bypasses 2FA** |
| POST | `/Register` | `RegisterRequestModel` | `AuthenticationResponseModel` | Creates user + session |
| POST | `/ResetPassword` | `ResetPasswordRequestModel` | `boolean` | Email-based |
| POST | `/Logout` | — | `boolean` | Revokes session, clears cookie |

## 2. Account — `@Controller('Account')` → `/Api/Account/*`
File: `src/modules/account/account.controller.ts`

| Method | Path | Request | Response | CASL |
|---|---|---|---|---|
| GET | `/Profile` | — | `AccountProfileResponseModel` | Read Account |
| PUT | `/Edit` | `AccountPutBodyRequestModel` | `boolean` | Update Account |
| PUT | `/ChangePassword` | `AccountChangePasswordRequestModel` | `boolean` | Update Account |
| POST | `/Upload/Image` | multipart (avatar) | `boolean`/url `UNVERIFIED` | Update Account |

## 3. Account Security — `@Controller('Account/Security')` → `/Api/Account/Security/*`
File: `src/modules/account/security/security.controller.ts` · session auth.

| Group | Method | Path | Purpose |
|---|---|---|---|
| Sessions | GET | `/Sessions` | List active sessions (Account History) |
| | DELETE | `/Sessions/:sessionId` | Revoke one session |
| | POST | `/Sessions/LogoutAll` | Revoke all sessions |
| | POST | `/Sessions/LogoutOthers` | Revoke all except current |
| Passkey | POST | `/Passkey/Register/Begin` | WebAuthn registration challenge |
| | POST | `/Passkey/Register/Finish` | Complete passkey registration |
| | GET | `/Passkey` | List passkeys |
| | DELETE | `/Passkey/:passkeyId` | Delete a passkey |
| 2FA (TOTP) | POST | `/TwoFactor/TOTP/Setup` | Begin TOTP setup (QR/secret) |
| | POST | `/TwoFactor/TOTP/Verify` | Confirm + enable; returns backup codes |
| | POST | `/TwoFactor/TOTP/Disable` | Disable 2FA |
| | GET | `/TwoFactor/Status` | Is 2FA enabled |
| | POST | `/TwoFactor/BackupCodes/Regenerate` | New backup codes |
| API Keys | POST `/ApiKeys` · GET `/ApiKeys` · POST `/ApiKeys/:id` · DELETE `/ApiKeys/:id` · POST `/ApiKeys/:id/Rotate` | | Manage API keys/secrets (developer surface) |

## 4. Cloud (core) — `@Controller('Cloud')` → `/Api/Cloud/*`
File: `src/modules/cloud/cloud.controller.ts` · session auth · CASL `Cloud`. Optional `x-team-id`, `x-folder-session`, `x-hidden-session`.

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/List` | `CloudListRequestModel` (extends `PaginationRequestModel`: Path, Delimiter, Skip, Take, Search…) | `CloudListResponseModel` | Combined dirs+objects |
| GET | `/List/Breadcrumb` | `CloudListBreadcrumbRequestModel` | `CloudBreadCrumbModel[]` | Path → crumbs |
| GET | `/List/Directories` | `CloudListDirectoriesRequestModel` | `CloudDirectoryModel[]` | Honors `x-hidden-session` |
| GET | `/List/Objects` | `CloudListObjectsRequestModel` | `CloudObjectModel[]` | Files only |
| GET | `/Search` | `CloudSearchRequestModel` (Path, Extension, Search, pagination) | `CloudSearchResponseModel` | **path + extension filters** ⇒ global vs current-folder |
| GET | `/User/StorageUsage` | — | `CloudUserStorageUsageResponseModel` | Used/limit bytes, % (usage bar) |
| GET | `/Scan/Status` | `CloudKeyRequestModel` | `CloudScanStatusResponseModel \| null` | **AV** status (pending/clean/infected) |
| GET | `/Find` | `CloudKeyRequestModel` (Key) | `CloudObjectModel` | Single object metadata |
| GET | `/PresignedUrl` | `CloudPreSignedUrlRequestModel` (Key) | `string` (presigned URL) | **Basis of MVP "Share"** + direct download |
| PUT | `/Move` | `CloudMoveRequestModel` | `boolean` | `idempotency-key`; conflict strategy |
| DELETE | `/Delete` | `CloudDeleteRequestModel` | `boolean` | `idempotency-key` |
| PUT | `/Update` | `CloudUpdateRequestModel` | `CloudObjectModel` | Rename/metadata |
| GET | `/Download` | `CloudKeyRequestModel` | binary stream | Subscription-throttled (`ThrottleTransform`) |
| GET | `/Versions` | `CloudKeyRequestModel` | `CloudVersionListResponseModel` | S3 versions |
| PUT | `/Versions/Restore` | `CloudRestoreVersionRequestModel` | void | Restore old version |
| DELETE | `/Versions` | `CloudDeleteVersionRequestModel` | void | Delete a version |
| POST | `/Scan/Duplicate/Start` | `CloudDuplicateScanStartRequestModel` (Path, Recursive, SimilarityThreshold) | `…StartResponseModel` (ScanId) | SHA-256 + dHash |
| GET | `/Scan/Duplicate/Status` | `CloudDuplicateScanIdRequestModel` | `…StatusResponseModel` | Phase/percentage |
| GET | `/Scan/Duplicate/Result` | `CloudDuplicateScanIdRequestModel` | `…ResultResponseModel` | Groups + similarity + savings |
| POST | `/Scan/Duplicate/Cancel` | `CloudDuplicateScanIdRequestModel` | `…CancelResponseModel` | |

**`CloudObjectModel`** (`cloud.model.ts`): `Name, Extension, MimeType, Path:CloudPathModel, Metadata:Record, LastModified, ETag, Size`. Image `Metadata.Width/Height` set by `cloud.metadata.service.ts` (sharp). `CloudPathModel.Url` resolved to CDN via `CDNPathResolver`; **`?w=&h=` resizing is a CDN feature, not an API param** (`UNVERIFIED` that CloudFront honors it — infra check).

## 5. Cloud Directory (encrypted + hidden) — `@Controller('Cloud/Directory')` → `/Api/Cloud/Directory/*`
File: `src/modules/cloud/cloud.directory.controller.ts` · CASL `CloudDirectory`/`Execute`.

| Method | Path | Request | Response | Headers |
|---|---|---|---|---|
| POST | `` (`/Cloud/Directory`) | `DirectoryCreateRequestModel` (Path, IsEncrypted?, ConflictStrategy?) | `DirectoryResponseModel` | `x-folder-passphrase`? (if encrypted), `x-folder-session`?, `x-team-id`? |
| PUT | `/Rename` | `DirectoryRenameRequestModel` (Path, Name, ConflictStrategy?) | `DirectoryResponseModel` | passphrase/session |
| DELETE | `` | `DirectoryDeleteRequestModel` (Path) | `boolean` | passphrase/session |
| POST | `/Unlock` | `DirectoryUnlockRequestModel` (Path) | `DirectoryUnlockResponseModel` (`SessionToken, ExpiresAt, TTL, EncryptedFolderPath`) | **`x-folder-passphrase` required** |
| POST | `/Lock` | `DirectoryLockRequestModel` (Path) | `boolean` | Invalidates folder sessions |
| POST | `/Encrypt` | `DirectoryConvertToEncryptedRequestModel` (Path) | `DirectoryResponseModel` | **passphrase required** |
| POST | `/Decrypt` | `DirectoryDecryptRequestModel` (Path) | `DirectoryResponseModel` | **passphrase required** |
| POST | `/Hide` | `DirectoryHideRequestModel` (Path) | `DirectoryResponseModel` | **passphrase required** |
| POST | `/Unhide` | `DirectoryUnhideRequestModel` (Path) | `DirectoryResponseModel` | **passphrase required** |
| POST | `/Reveal` | `DirectoryRevealRequestModel` (Path) | `DirectoryRevealResponseModel` (`SessionToken, ExpiresAt, TTL, HiddenFolderPath`) | **passphrase required** → `x-hidden-session` token |
| POST | `/Conceal` | `DirectoryConcealRequestModel` (Path) | `boolean` | Invalidates hidden sessions |

**Token flow:** Unlock → `x-folder-session`; Reveal → `x-hidden-session`. Both are base64, folder-scoped, TTL-bound, **ancestor-applicable** (a parent's token unlocks children). Tokens are never persisted server-side beyond their TTL.

## 6. Cloud Upload (multipart) — `@Controller('Cloud/Upload')` → `/Api/Cloud/Upload/*`
File: `src/modules/cloud/cloud.upload.controller.ts` · CASL `CloudUpload`/`Upload` · throttled.

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| POST | `/CreateMultipartUpload` | `CloudCreateMultipartUploadRequestModel` (Key, ContentType?, Metadata?, TotalSize, ConflictStrategy?) | `…ResponseModel` (UploadId, Key) | **Pre-checks** `TotalSize>MaxUploadSizeBytes` → 400; `Used+TotalSize>StorageLimit` → 400 |
| POST | `/GetMultipartPartUrl` | `…PartUrlRequestModel` (Key, UploadId, PartNumber) | `{ Url, Expires }` | presigned |
| POST | `/GetMultipartPartUrls` | `…BatchRequestModel` (Key, UploadId, TotalParts?/PartNumbers?) | `{ Parts:[{PartNumber,Url,Expires}] }` | batch presign |
| POST | `/UploadPart` | multipart (Key, UploadId, PartNumber, File, ContentMd5?) | `{ ETag }` | proxy path; max 10 MB/part |
| POST | `/CompleteMultipartUpload` | `…CompleteRequestModel` (Key, UploadId, Parts:[{PartNumber,ETag}]) | `{ Location, Key, Bucket, ETag, Metadata }` | **`idempotency-key`** |
| DELETE | `/AbortMultipartUpload` | `…AbortRequestModel` (Key, UploadId) | void | cancel/cleanup |

Optional `x-folder-session` for uploads into encrypted folders.

## 7. Cloud Archive (zip/extract) — `@Controller('Cloud/Archive')` → `/Api/Cloud/Archive/*`
File: `src/modules/cloud/cloud.archive.controller.ts` · CASL `CloudArchive`/`Archive`/`Extract` · async **jobs**, progress via socket.

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/Create/Start` | `…CreateStartRequestModel` (Keys[], Format?, OutputName?) | `{ JobId, Format, OutputKey }` |
| POST | `/Create/Cancel` | `…CreateCancelRequestModel` (JobId) | `{ Cancelled }` |
| POST | `/Extract/Start` | `…ExtractStartRequestModel` (Key, SelectedEntries?[]) | `{ JobId, Format }` |
| POST | `/Extract/Cancel` | `…ExtractCancelRequestModel` (JobId) | `{ Cancelled }` |
| GET | `/Preview` | `…PreviewRequestModel` (Key) | `{ Key, Format, TotalEntries, Entries:[{Path,Type,Size,…}] }` |

Socket events: `ARCHIVE_CREATE_PROGRESS/COMPLETE/FAILED`, `ARCHIVE_EXTRACT_PROGRESS/COMPLETE/FAILED`. Formats: ZIP/TAR/TAR_GZ/RAR.

## 8. Documents — `@Controller('Cloud/Documents')` → `/Api/Cloud/Documents/*`
File: `src/modules/document/document.controller.ts` · CASL `Document`.

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| POST | `` | `DocumentCreateRequestModel` (Path, Name, Content?, ConflictStrategy?) | `DocumentResponseModel` | text/code extensions |
| GET | `/Content` | `DocumentContentRequestModel` (Key, IncludeDraft?) | `DocumentContentResponseModel` (Content, ContentHash, LockStatus, LockedBy, LockExpiresAt, IsDraft…) | |
| PUT | `/Content` | `DocumentUpdateContentRequestModel` (Key, Content, ExpectedContentHash?) | `DocumentContentResponseModel` | 409 hash mismatch · 423 locked-by-other · 429 throttle |
| GET | `/Find` | `DocumentKeyRequestModel` | `DocumentResponseModel` | |
| POST | `/Lock` | `DocumentKeyRequestModel` | `DocumentLockResponseModel` (ExpiresAt, TTL **5 min**) | acquire/extend; 423 if held |
| DELETE | `/Lock` | `DocumentKeyRequestModel` | `boolean` | release (owner only) |
| PUT | `/Lock/Heartbeat` | `DocumentKeyRequestModel` | `DocumentLockResponseModel` | keep-alive (~every 3 min) |
| POST | `/Draft` | `DocumentDraftRequestModel` (Key, Content) | `DocumentDraftResponseModel` (SavedAt, NextAllowedSaveAt) | **1 save/10s**; S3 backup every 5th |
| DELETE | `/Draft` | `DocumentKeyRequestModel` | `boolean` | discard draft |
| GET | `/Versions` | `DocumentKeyRequestModel` | `CloudVersionListResponseModel` | |
| GET | `/Versions/Diff` (route `/Diff`) | `DocumentDiffRequestModel` (Key, Source/TargetVersionId) | `DocumentDiffResponseModel` (Hunks, Stats) | unified diff |
| PUT | `/Versions/Restore` | `DocumentRestoreVersionRequestModel` | void | |
| DELETE | `/Versions` | `DocumentDeleteVersionRequestModel` | void | not current |

## 9. Subscription — `@Controller('Subscription')` → `/Api/Subscription/*`
Files: `subscription.user.controller.ts` (user), `subscription.controller.ts` (admin).

| Method | Path | Request | Response | Audience |
|---|---|---|---|---|
| GET | `/My` | — | `UserSubscriptionResponseModel \| null` | **user** (Pricing/plan view) |
| POST | `/My/Subscribe` | `SubscribeRequestModel` (SubscriptionId, IsTrial) | `boolean` | user (post-MVP / "coming soon") |
| DELETE | `/My/Unsubscribe` | — | `boolean` | user |
| GET | `/List` · `/Find/:id` · POST `/Create` · PUT `/Edit/:id` · DELETE `/Delete/:id` · POST `/Assign` · DELETE `/Unsubscribe/:id` | | | **admin** (Manage Subscription) |

**Plan entity** (`subscription.entity.ts`): `Id, Name, Slug, Description?, Price(cents), Currency, BillingCycle, StorageLimitBytes(bigint; 0=unlimited), MaxUploadSizeBytes?, MaxObjectCount?, Features(JSON e.g. {downloadSpeedBytesPerSec}), Status`. Download speed by `Features.downloadSpeedBytesPerSec` → slug default (free 50KB/s, pro 500KB/s, enterprise 5MB/s) → 50KB/s fallback (`cloud.usage.service.ts`).

## 10. Notifications — REST `@Controller({path:'Notification',version:'1'})` → `/Api/v1/Notification/*` + socket gateway
Files: `notification.controller.ts`, `notification.gateway.ts`.

| Transport | Endpoint/Event | Detail |
|---|---|---|
| REST | GET `/Api/v1/Notification/History` | paginated inbox (`PaginationRequestModel`) |
| REST | GET `/Api/v1/Notification/UnreadCount` | `{ Count }` |
| REST | PATCH `/Api/v1/Notification/:Id/Read` · PATCH `/ReadAll` | mark read |
| Socket | **namespace `/notifications`** | handshake auth `handshake.auth.SessionId` (+cookie/`x-session-id`/Bearer/query); room `user:{userId}` |
| Socket | event `notification` | payload typed by `NotificationType` enum |
| Socket | `ping`/`pong` | heartbeat |

`NotificationType` covers: UPLOAD_*, FILE_*, ARCHIVE_*, DUPLICATE_SCAN_*, **QUOTA_WARNING/QUOTA_EXCEEDED (80/90/100%)**, TEAM_*, SUBSCRIPTION_*, DOCUMENT_*, WEBHOOK_*, API_*.

## 11. Teams (LAST phase) — `/Api/Team`, `/Api/Team/Members`, `/Api/Team/Invitations`
Files: `team.controller.ts`, `team-member.controller.ts`, `team-invitation.controller.ts` · most require `x-team-id`.

| Area | Endpoints |
|---|---|
| Team | POST `/Team` · GET `/Team` · GET `/Team/:Id` · PUT `/Team/:Id` · DELETE `/Team/:Id` |
| Members | GET `/Team/Members` · PUT `/Team/Members/:MemberId/Role` · DELETE `/Team/Members/:MemberId` · POST `/Team/Members/Leave` · POST `/Team/Members/TransferOwnership` |
| Invitations | POST `/Team/Invitations` · GET `/Team/Invitations` · DELETE `/Team/Invitations/:Id` · POST `/Team/Invitations/Accept` · POST `/Team/Invitations/Decline` · GET `/Team/Invitations/Pending` |

Team roles: OWNER/ADMIN/MEMBER/VIEWER (CASL `Team*` subjects).

## 12. API module (developer API, `/Api/v1/*`, API-key auth) — post-MVP reference
Files: `src/modules/api/controllers/*`. Guards: `ApiAuthGuard`, `ApiScopeGuard` (READ/WRITE/DELETE/ADMIN), `ApiQuotaGuard`, `ApiRateLimitGuard`.

Storage (List/Find/Search/Move/Delete), Upload (CreateMultipart/GetPartUrl(s)/Complete/Abort), Download, Directory (create/delete), Webhooks (CRUD/Test/Deliveries — 5-stage retry; HMAC for some tiers `UNVERIFIED`), Usage/Current. Not needed for the user-facing MVP; relevant to the Account ▸ API Keys surface and a future developer page.

## 13. Other
- **User** `/Api/User/*` (admin CRUD) — platform-admin only; not MVP.
- **Definition** `/Api/Definition/*` — lookup groups; Find endpoints are stubs (`UNVERIFIED`/incomplete).
- **Health** `/Api/Health` — `@Public` health check.
- **Core** `@Controller()` → `/Api` — root/info endpoint.

---

## 14. Feature → endpoint cross-map (MVP-relevant)

| Feature | Primary endpoints |
|---|---|
| Login (multi-step) | `Authentication/Login/Check` → `/Login` → `/Verify2FA`; `Passkey/Login/Begin`→`/Finish` |
| Register / Reset | `Authentication/Register`, `/ResetPassword` |
| Account profile/security | `Account/Profile`,`/Edit`,`/ChangePassword`,`/Upload/Image`; `Account/Security/*` (Sessions, Passkey, TwoFactor, ApiKeys) |
| Browse (list/grid/breadcrumb) | `Cloud/List`,`/List/Directories`,`/List/Objects`,`/List/Breadcrumb` |
| Usage bar | `Cloud/User/StorageUsage` |
| Search (global/current) | `Cloud/Search` (Path + Extension filters) |
| Upload pipeline | `Cloud/Upload/CreateMultipartUpload`→`GetMultipartPartUrls`→(`UploadPart`)→`CompleteMultipartUpload`/`Abort` |
| Create folder (+ encrypt) | `Cloud/Directory` (`IsEncrypted`) |
| Create file | `Cloud/Documents` |
| Rename/Move/Delete | `Cloud/Update`, `Cloud/Move`, `Cloud/Delete` (+ `Cloud/Directory/Rename`,`DELETE /Cloud/Directory`) |
| Preview / download | `Cloud/Find`, `Cloud/PresignedUrl`, `Cloud/Download` |
| **Share (MVP)** | `Cloud/PresignedUrl` (copy / Web Share) — no dedicated share API |
| Versions | `Cloud/Versions`,`/Versions/Restore`,`DELETE /Versions` |
| Text editing | `Cloud/Documents/Content`(GET/PUT), `/Lock`(+Heartbeat), `/Draft`, `/Versions/Diff`,`/Restore` |
| Secure folders | `Cloud/Directory/Unlock`/`Lock`/`Encrypt`/`Decrypt`/`Hide`/`Unhide`/`Reveal`/`Conceal` |
| Duplicate scan | `Cloud/Scan/Duplicate/Start`/`Status`/`Result`/`Cancel` |
| Archive zip/extract | `Cloud/Archive/Create/*`,`/Extract/*`,`/Preview` |
| AV status | `Cloud/Scan/Status` |
| Notifications | `Api/v1/Notification/*` + `/notifications` socket |
| Subscription/Pricing | `Subscription/My` (+ admin CRUD for plan list) |
| Teams (last) | `Team/*`, `Team/Members/*`, `Team/Invitations/*` (`x-team-id`) |
