# API Inventory — index

> Endpoint catalog for the **NestJS API** (`nestjs-storage`) — the **contract source of truth** for v2. Verified against
> real controllers (paths cited per module). Items not provable from code are **`UNVERIFIED`** and listed in
> [open-questions](../07-decisions/open-questions.md).
>
> **Last verified:** 2026-05-30 (controllers re‑confirmed present + route decorators match). **Stack:** NestJS 11,
> PostgreSQL/TypeORM + MongoDB (audit/notifications) + Redis (BullMQ/cache), S3 + CloudFront, ClamAV.

## Module docs
| Module | File | Base path |
|---|---|---|
| Authentication | [modules/authentication.md](./modules/authentication.md) | `/Api/Authentication/*` |
| Account & Security | [modules/account.md](./modules/account.md) | `/Api/Account/*`, `/Api/Account/Security/*` |
| Cloud (core) | [modules/cloud-core.md](./modules/cloud-core.md) | `/Api/Cloud/*` |
| Cloud Directory (secure) | [modules/cloud-directory.md](./modules/cloud-directory.md) | `/Api/Cloud/Directory/*` |
| Cloud Upload (multipart) | [modules/cloud-upload.md](./modules/cloud-upload.md) | `/Api/Cloud/Upload/*` |
| Cloud Archive (zip/extract) | [modules/cloud-archive.md](./modules/cloud-archive.md) | `/Api/Cloud/Archive/*` |
| Documents | [modules/documents.md](./modules/documents.md) | `/Api/Cloud/Documents/*` |
| Subscription | [modules/subscription.md](./modules/subscription.md) | `/Api/Subscription/*` |
| Notifications | [modules/notifications.md](./modules/notifications.md) | `/Api/v1/Notification/*` + socket |
| Teams | [modules/teams.md](./modules/teams.md) | `/Api/Team*` |
| Developer API + misc | [modules/api-module.md](./modules/api-module.md) | `/Api/v1/*` (API‑key) · health/user/definition/core |

## 0. Global conventions (apply to every module)

| Concern | Reality | Source |
|---|---|---|
| **Global prefix** | All routes under **`/Api`** | `src/main.ts:68` (`setGlobalPrefix('/Api')`) |
| **Versioning** | **URI** versioning. Default → `/Api/<Ctrl>/…`; versioned → `/Api/v1/<Ctrl>/…` | `src/main.ts:46` (`VersioningType.URI`) |
| **Response envelope** | Non‑stream wrapped `{ Result, Status:{ Messages, Code, Timestamp, Path } }`. Arrays → `Result.{ Items, Options:{ Skip, Take, Count, Search } }` | `src/common/interceptors/transform.interceptor.ts` |
| **Streaming** | Downloads bypass the envelope (`@Res({ passthrough:false })`) and stream binary | `cloud.controller.ts` (Download) |
| **Auth chain** | `CombinedAuthGuard` → `TeamContextGuard` → `PoliciesGuard` (all `APP_GUARD`) | `authentication.module.ts` |
| **Session auth** | Session id via **cookie** `SESSION_COOKIE_NAME`, header **`x-session-id`**, or `Authorization: Bearer`. 7‑day TTL | `authentication/*` |
| **API‑key auth** | Header **`x-api-key`** + **`x-api-secret`** (only `/Api/v1/*` API module) | `api/guards/*` |
| **Team context** | Header **`x-team-id`** → validates membership, sets `user.TeamId`/`user.TeamRole` | `team/guards/team-context.guard.ts` |
| **Secure‑folder headers** | **`x-folder-passphrase`** (min 8, unlock/reveal) → mints token; **`x-folder-session`**/**`x-hidden-session`** replay it | `cloud.directory.controller.ts` |
| **Idempotency** | **`idempotency-key`** on Move/Delete/CompleteMultipartUpload; API module uses `@Idempotent()` + Redis (24h) | `cloud.*`, `api/interceptors/*` |
| **Naming** | **PascalCase** everywhere (`Id`, `Email`, `CreatedAt`, `Key`, `Path`) | repo‑wide |
| **Storage owner** | `GetStorageOwnerId(user)` → `user.Id` (personal) or `team/{TeamId}` (team); S3 key prefix | `cloud/cloud.context.ts` |
| **CASL** | Actions `Manage/Create/Read/Update/Delete/Upload/Download/Extract/Archive/Execute`; subjects `Cloud*`,`Document`,`Account`,`Team*`,… | `authentication/casl/casl-ability.factory.ts` |

> The frontend never touches these directly — the [`Instance`](../02-architecture/data-layer.md) handles envelope,
> headers, idempotency, and error mapping. This catalog tells you the contract; the Instance applies it.

## Feature → endpoint cross‑map (MVP)

| Feature | Primary endpoints | Module |
|---|---|---|
| Login (multi‑step) | `Authentication/Login/Check`→`/Login`→`/Verify2FA`; `Passkey/Login/Begin`→`/Finish` | [authentication](./modules/authentication.md) |
| Register / Reset | `Authentication/Register`, `/ResetPassword` | [authentication](./modules/authentication.md) |
| Account profile/security | `Account/Profile`,`/Edit`,`/ChangePassword`,`/Upload/Image`; `Account/Security/*` | [account](./modules/account.md) |
| Browse | `Cloud/List`,`/List/Directories`,`/List/Objects`,`/List/Breadcrumb` | [cloud-core](./modules/cloud-core.md) |
| Usage bar | `Cloud/User/StorageUsage` | [cloud-core](./modules/cloud-core.md) |
| Search | `Cloud/Search` (Path + Extension) | [cloud-core](./modules/cloud-core.md) |
| Upload | `Cloud/Upload/CreateMultipartUpload`→`GetMultipartPartUrls`→(`UploadPart`)→`CompleteMultipartUpload`/`Abort` | [cloud-upload](./modules/cloud-upload.md) |
| Create folder/file | `Cloud/Directory` (`IsEncrypted`), `Cloud/Documents` | [cloud-directory](./modules/cloud-directory.md), [documents](./modules/documents.md) |
| Rename/Move/Delete | `Cloud/Update`,`Cloud/Move`,`Cloud/Delete` (+ `Directory/Rename`, `DELETE /Directory`) | [cloud-core](./modules/cloud-core.md), [cloud-directory](./modules/cloud-directory.md) |
| Preview/download | `Cloud/Find`,`/PresignedUrl`,`/Download` | [cloud-core](./modules/cloud-core.md) |
| **Share (MVP)** | `Cloud/PresignedUrl` (copy / Web Share) — no dedicated share API | [cloud-core](./modules/cloud-core.md) |
| Versions | `Cloud/Versions`,`/Versions/Restore`,`DELETE /Versions` | [cloud-core](./modules/cloud-core.md) |
| Text editing | `Cloud/Documents/Content`,`/Lock`(+Heartbeat),`/Draft`,`/Versions/Diff`,`/Restore` | [documents](./modules/documents.md) |
| Secure folders | `Cloud/Directory/Unlock`/`Lock`/`Encrypt`/`Decrypt`/`Hide`/`Unhide`/`Reveal`/`Conceal` | [cloud-directory](./modules/cloud-directory.md) |
| Duplicate scan | `Cloud/Scan/Duplicate/Start`/`Status`/`Result`/`Cancel` | [cloud-core](./modules/cloud-core.md) |
| Archive | `Cloud/Archive/Create/*`,`/Extract/*`,`/Preview` | [cloud-archive](./modules/cloud-archive.md) |
| AV status | `Cloud/Scan/Status` | [cloud-core](./modules/cloud-core.md) |
| Notifications | `Api/v1/Notification/*` + `/notifications` socket | [notifications](./modules/notifications.md) |
| Subscription/Pricing | `Subscription/My` (+ admin CRUD) | [subscription](./modules/subscription.md) |
| Teams (last) | `Team/*`, `Team/Members/*`, `Team/Invitations/*` (`x-team-id`) | [teams](./modules/teams.md) |
