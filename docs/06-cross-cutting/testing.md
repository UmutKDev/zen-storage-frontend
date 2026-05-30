# Cross‑cutting — Testing Strategy

> Pragmatic coverage: test the **risky, reused, and contract‑critical** parts well; don't chase 100%. Per‑phase tests are
> part of each phase's definition of done.

## 1. Layers
| Layer | Tool (proposed) | What it covers |
|---|---|---|
| **Unit** | Vitest/Jest | the `Instance` (headers, envelope unwrap, error mapping, 401/403/409), Zustand stores (uploads, secureFolders, selection, workspace), pure utils (ancestor lookup, conflict resolution, imageCdn) |
| **Component** | Testing Library | key patterns: ConflictDialog, PassphraseDialog, UploadTray, StateBoundary, FileRow/Card, PreviewModal |
| **E2E** | Playwright (proposed) | happy paths: login (+2FA), upload→appear, create/rename/move/delete, preview+edit, unlock encrypted, reveal hidden |

## 2. Highest‑value targets (test these first)
- **`Instance`**: envelope unwrap, `ApiError` mapping, `401→signOut`, `403/409` passthrough, idempotency header,
  team/folder header injection. (Everything depends on it.)
- **Secure‑folder lifecycle**: ancestor token lookup, TTL expiry → re‑prompt, **never‑persist** guarantee, clear on
  logout/tab‑close. (Security‑critical — [secure-folder-lifecycle](../02-architecture/secure-folder-lifecycle.md).)
- **Upload pipeline**: multipart sequencing, abort/retry, idempotency, quota pre‑flight. (Data‑integrity‑critical.)
- **Conflict resolution**: each strategy + apply‑to‑all batch memory.
- **Optimistic mutations**: rollback correctness for delete/move/rename.

## 3. Per‑phase expectations
| Phase | Must‑have tests |
|---|---|
| 0 | Instance unit tests; theme/reduced‑motion smoke; a factory round‑trip |
| 1 | auth flow (password/2FA/passkey) component + e2e happy path |
| 2 | security flows (2FA enable/disable, session revoke) component |
| 3 | upload pipeline unit + e2e; conflict; optimistic rollback |
| 4 | document lock/draft/version logic; preview type switch |
| 5 | secure‑folder lifecycle unit tests (ancestor, TTL, clear) |
| 6 | job store reconciliation (socket‑drop → poll completes) |
| 7 | a11y automated check; perf budget check |
| 8 | team switch cache segmentation; permission gating |

## 4. Conventions
- Mock at the **factory** boundary (or MSW for network) so tests exercise the Instance where relevant.
- Prefer behavior assertions over snapshots; snapshot only stable, intentional UI.
- Each bug fix adds a regression test.

## 5. CI
- Lint + type‑check (`tsc --noEmit`) + unit/component on PR; e2e on a nightly or pre‑merge lane. (Set up in Phase 0/CI.)
