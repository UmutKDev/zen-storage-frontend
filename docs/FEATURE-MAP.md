# FEATURE-MAP.md

> Every user-facing feature → screen(s)/component(s) → API endpoint(s) → states/edge cases.
> Endpoints are detailed in [API-INVENTORY.md](./API-INVENTORY.md); architecture in [ARCHITECTURE.md](./ARCHITECTURE.md).
> States reference the [§14 state matrix](./ARCHITECTURE.md#14-state-matrix). Phase tags map to [ROADMAP.md](./ROADMAP.md).

Legend: 🟢 MVP · 🟡 MVP-light/"coming soon" · ⚪ post-MVP (Teams/Advanced).

---

## Public (Phase 7) 🟢/🟡
| Feature | Screen / component | Endpoints | States / edge cases |
|---|---|---|---|
| Landing | `(public)/page` hero, sections | — | static; motion entrances; reduced-motion |
| Features | `(public)/features` | — | static |
| Pricing 🟡 | `(public)/pricing` plan cards | `Subscription/My` (show current), plan list (admin `Subscription/List` if exposed; else static) | **"coming soon"** — no checkout; highlight current plan; loading/empty if no plans |

## Auth (Phase 1) 🟢
| Feature | Screen / component | Endpoints | States / edge cases |
|---|---|---|---|
| Login (multi-step) | `(auth)/login` — email step → method step → password/2FA/passkey | `Authentication/Login/Check` → `/Login` → `/Verify2FA`; `Passkey/Login/Begin`→`/Finish` | unknown email; wrong password; `RequiresTwoFactor`; invalid TOTP; passkey cancel/unsupported; rate-limit (10/60s) |
| Register | `(auth)/register` + rhf/zod | `Authentication/Register` | email taken; weak password; success → session |
| Reset password | `(auth)/reset` | `Authentication/ResetPassword` | unknown email (neutral msg); sent confirmation |
| Logout | shell menu | `Authentication/Logout` | clears session + secure-folder tokens + team ctx |

## Account & Security (Phase 2) 🟢
| Feature | Screen / component | Endpoints | States / edge cases |
|---|---|---|---|
| Profile | `account/profile` form + avatar | `Account/Profile`, `Account/Edit`, `Account/Upload/Image` | optimistic edit; avatar upload error; validation |
| Change password | `account/security` | `Account/ChangePassword` | wrong current; mismatch; success toast |
| 2FA (TOTP) | `account/security` 2FA card + `qrcode.react` | `Account/Security/TwoFactor/TOTP/Setup`→`Verify`→`Disable`, `/Status`, `/BackupCodes/Regenerate` | enable flow; show/download backup codes once; disable confirm |
| Passkeys | `account/security` passkey list | `Account/Security/Passkey/Register/Begin`→`Finish`, `GET /Passkey`, `DELETE /Passkey/:id` | browser unsupported; duplicate; delete confirm |
| Sessions / history | `account/security` sessions table | `Account/Security/Sessions`, `DELETE /Sessions/:id`, `/LogoutAll`, `/LogoutOthers` | current vs others; revoke confirm |
| API keys ⚪ | `account/api-keys` | `Account/Security/ApiKeys*` (create/list/update/delete/rotate) | secret shown once; rotate; scope display |
| Subscription view 🟡 | `account/subscription` | `Subscription/My` | none/active; usage tie-in; no checkout in MVP |

## Storage shell & browse (Phase 3) 🟢
| Feature | Screen / component | Endpoints | States / edge cases |
|---|---|---|---|
| App shell/nav | `(app)/layout` sidebar/topbar | `Account/Profile`, `Notification/UnreadCount` | responsive; theme toggle; (no team switch in MVP) |
| Usage bar (always visible) | `UsageBar` | `Cloud/User/StorageUsage` | %, near-limit color; warning/exceeded |
| Browse list/grid | `features/storage` `StorageBrowser` (list + smart grid views) | `Cloud/List`,`/List/Directories`,`/List/Objects`,`/List/Breadcrumb` | loading skeleton; empty folder; error; **virtualized** large folders |
| Breadcrumb nav + deep-link | `Breadcrumb`, `storage/[[...path]]` | `Cloud/List/Breadcrumb` | root; deep path via URL |
| Filter + sort | `FilterSortBar` | client over list (+ `Cloud/Search` for server filter) | by type/size/date/name; persists per session |
| Search (global/current) | `SearchBox` + scope toggle | `Cloud/Search` (Path + Extension) | **default current folder**; global; no-results state |
| Create folder (+ encrypt) | `CreateFolderDialog` (encrypt option → passphrase) | `Cloud/Directory` (`IsEncrypted`) | name conflict (§conflict); weak passphrase (<8); encrypted badge in list |
| Create file | `CreateDocumentDialog` | `Cloud/Documents` | extension allow-list; conflict |
| Upload files/folder | `UploadTray`, file-drop zone (dnd-kit) | `Cloud/Upload/CreateMultipartUpload`→`GetMultipartPartUrls`→`UploadPart`/S3→`CompleteMultipartUpload`/`Abort` | progress; pause/cancel/retry; concurrency; **max-size/quota block** + upgrade hint; conflict; folder recurse |
| Rename | inline / `RenameDialog` | `Cloud/Update` (file), `Cloud/Directory/Rename` (dir) | conflict; locked/encrypted dir needs session |
| Move (dnd + dialog) | `MoveDialog`, draggable items | `Cloud/Move` (`Idempotency-Key`) | drop on folder; conflict; optimistic + rollback |
| Delete (single/bulk) | `DeleteConfirm` | `Cloud/Delete` (`Idempotency-Key`), `DELETE /Cloud/Directory` | confirm; optimistic; **no trash** (design leaves room) |
| Multi-select + bulk | `useItemSelection`, bulk action bar | bulk Delete/Move/Download (loop endpoints) | select-all; mixed types; apply-to-all conflict |
| Download | item menu / preview | `Cloud/PresignedUrl` or `Cloud/Download` (throttled) | image scaled-vs-original (§preview); large file |

## Preview & Share (Phase 4) 🟢
| Feature | Screen / component | Endpoints | States / edge cases |
|---|---|---|---|
| Preview modal | `features/preview/FilePreviewModal` + toolbar | `Cloud/Find`, `Cloud/PresignedUrl` | image/video/text/PDF; fullscreen; close; AV pending/infected gate |
| Arrow-key navigation | preview keyboard handler | (list in memory) | ←/→ across previewable items only |
| Image scaling | `imageCdn.ts` `getImageCdnUrl` | CDN `?w=&h=` from `Metadata.Width/Height` | thumb/preview/fullscreen targets; SVG/ICO unscaled; **download: scaled vs original** (only if metadata) |
| Video / PDF preview | `LazyPreview` variants | presigned URL | unsupported codec; large PDF lazy |
| Text/code edit | `features/document-editor` CodeMirror | `Cloud/Documents/Content`(GET/PUT), `/Lock`(+`/Lock/Heartbeat`), `/Draft`, `/Find` | acquire lock (423 locked-by-other → read-only); draft auto-save (10s throttle); 409 hash mismatch; unsaved-changes guard; release on close |
| Version history + restore | `VersionHistoryPanel` (bottom of preview) | `Cloud/Versions`, `/Versions/Restore`, `DELETE /Versions`; docs `/Documents/Versions(/Diff/Restore)` | empty history; restore confirm; diff view (docs) |
| **Share (MVP)** | toolbar Share button | `Cloud/PresignedUrl` → Web Share API / copy link | presigned TTL note; no permissions/expiry config (future); copy success toast |

## Secure folders (Phase 5) 🟢
| Feature | Screen / component | Endpoints | States / edge cases |
|---|---|---|---|
| Encrypted folder create/convert | create dialog / item menu | `Cloud/Directory` (`IsEncrypted`), `/Encrypt`, `/Decrypt` | passphrase ≥8; convert existing; encrypted badge |
| Unlock / lock | `UnlockDialog` (passphrase) | `Cloud/Directory/Unlock`→token, `/Lock` | wrong passphrase; **TTL expiry → transparent re-prompt**; ancestor token reuse; explicit lock |
| Hidden folder hide/unhide | item menu | `Cloud/Directory/Hide`, `/Unhide` | passphrase; vanishes from listing |
| Reveal hidden (`Shift Shift`) | global key handler → `RevealDialog` | `Cloud/Directory/Reveal`→hidden token, `/Conceal` | matches by passphrase; token in query key; conceal/lock |
| Token lifecycle | `stores/secureFolders` + Instance | (headers `X-Folder-Session`/`X-Hidden-Session`) | in-memory only; **clear all on logout/tab close**; never persisted |

## Advanced (Phase 6) 🟢
| Feature | Screen / component | Endpoints | States / edge cases |
|---|---|---|---|
| Duplicate scan | `DuplicateScanPanel` + job indicator | `Cloud/Scan/Duplicate/Start`/`Status`/`Result`/`Cancel` | progress (socket-first + poll); groups (exact vs perceptual + similarity); savings; cancel; resolve via delete |
| Archive create (zip) | bulk action → job | `Cloud/Archive/Create/Start`/`Cancel` | job progress toast/tray; output appears in folder; cancel |
| Archive extract | item menu → job | `Cloud/Archive/Extract/Start`/`Cancel`, `/Preview` | preview entries; selective extract; conflict on output; cancel |
| AV scan status | badge on items / preview gate | `Cloud/Scan/Status` | pending (gated/warn); infected (block/warn download); clean |
| Notifications toasts | `NotificationProvider` (sonner) | socket `/notifications` | typed mapping; progress silent; error/warn/success |
| Notification inbox | `NotificationInbox` panel | `Notification/History`, `/UnreadCount`, `/:Id/Read`, `/ReadAll` | unread badge; mark read/all; pagination; empty |
| Quota warnings | banner/toast | socket `QUOTA_WARNING/EXCEEDED` (80/90/100) | warning vs exceeded; upgrade hint |

## Cross-cutting 🟢
| Feature | Where | Notes |
|---|---|---|
| Light/dark theme | shell toggle, `lib/motion`+tokens | system preference default |
| i18n | `lib/i18n` dictionaries | **EN only at MVP**, all copy via keys, structure for 2nd lang |
| Motion system | `lib/motion` | shared variants/tokens, `prefers-reduced-motion` |
| Conflict resolution | `ConflictDialog` + hook | reusable; **prompt + apply-to-all**; `FAIL/REPLACE/SKIP/KEEP_BOTH` |
| Error/envelope layer | `Instance` | unwrap + typed error + toast + `401→re-auth` |

## Teams — LAST (Phase 8) ⚪
| Feature | Screen / component | Endpoints | States |
|---|---|---|---|
| Workspace switch (Personal ↔ Team) | `workspace.store` + switcher | (sets `X-Team-Id`) | personal default; everything personal-has, team-has |
| Team CRUD | `teams/*` | `Team` (POST/GET/:Id/PUT/DELETE) | owner-only delete |
| Members | members table | `Team/Members*` (role/remove/leave/transfer) | role gating (OWNER/ADMIN/MEMBER/VIEWER) |
| Invitations | invitations panel | `Team/Invitations*` (create/list/accept/decline/pending) | pending badge; expiry |
| Team storage/quota | reuse storage surfaces under team ctx | all `Cloud/*` with `X-Team-Id` | **permission-denied** state for VIEWER |

---

### Coverage note
All INIT.md §3 features are represented above. The old frontend's full feature list (auth+2FA+passkey, list/grid,
preview/edit/versions, upload pipeline, secure folders, duplicate scan, archive, notifications, conflict resolution,
theme, teams) is reproduced; **Share is presigned-URL-based** (no backend share API), **Trash is intentionally absent**
(design leaves room), and **Teams is scaffolded but inert until Phase 8**.
