@AGENTS.md

# CLAUDE.md

Guidance for Claude Code when working in this repository (`nextjs-storage`). **This file owns the rules and the map;
the deep plan lives in [`docs/`](./docs/README.md).** When something here points at a doc, read the doc — don't
re-derive it.

## What this is

The **v2 frontend** for a cloud‑storage SaaS (Google Drive / Yandex Disk style) — a from‑scratch rebuild on **Next 16.2 /
React 19**. The NestJS backend (`nestjs-storage`) already exists and is the **contract source of truth**; the old
frontend lives on the `main` branch and is reference‑only. **We build on the `v2` branch.**

⚠ **This is NOT the Next.js you know** (see `AGENTS.md`). Before writing any code, read the relevant guide in
`node_modules/next/dist/docs/01-app/`. Heed deprecations.

> **Current round:** planning is complete; the docs are written. We implement **phase by phase** on the user's go
> ("implement Phase N"). Do not start a phase's code without it.

## Where the plan & conventions live (read, don't re-derive)

| Need | File |
|---|---|
| Navigation hub for everything | [`docs/README.md`](./docs/README.md) |
| Project overview + MVP definition | [`docs/00-overview/PROJECT-OVERVIEW.md`](./docs/00-overview/PROJECT-OVERVIEW.md) |
| **Conventions** (naming, query keys, data access, i18n, a11y, git) | [`docs/00-overview/CONVENTIONS.md`](./docs/00-overview/CONVENTIONS.md) |
| Vocabulary | [`docs/00-overview/GLOSSARY.md`](./docs/00-overview/GLOSSARY.md) |
| The phased plan + per‑phase checklists | [`docs/01-roadmap/ROADMAP.md`](./docs/01-roadmap/ROADMAP.md) → `phases/` |
| Architecture (data layer, state, routing, sockets, …) | [`docs/02-architecture/ARCHITECTURE.md`](./docs/02-architecture/ARCHITECTURE.md) |
| Design system (tokens, motion, components, theming) | [`docs/03-design-system/DESIGN-SYSTEM.md`](./docs/03-design-system/DESIGN-SYSTEM.md) |
| Feature/screen specs | [`docs/04-features/FEATURE-MAP.md`](./docs/04-features/FEATURE-MAP.md) |
| API endpoint contracts | [`docs/05-api/API-INVENTORY.md`](./docs/05-api/API-INVENTORY.md) |
| Decisions + open questions | [`docs/07-decisions/DECISIONS.md`](./docs/07-decisions/DECISIONS.md) |
| Security headers (CSP, HSTS, Permissions-Policy) | [`docs/06-cross-cutting/security-headers.md`](./docs/06-cross-cutting/security-headers.md) |
| Privacy compliance (KVKK + GDPR) | [`docs/06-cross-cutting/privacy-compliance.md`](./docs/06-cross-cutting/privacy-compliance.md) |
| Performance budgets + virtualization | [`docs/06-cross-cutting/performance.md`](./docs/06-cross-cutting/performance.md) |
| Supported browsers + mobile UX | [`docs/00-overview/SUPPORTED-BROWSERS.md`](./docs/00-overview/SUPPORTED-BROWSERS.md) |
| Dependency supply-chain policy | [`docs/06-cross-cutting/dependency-policy.md`](./docs/06-cross-cutting/dependency-policy.md) |

If this file and a doc ever conflict on a convention, [`CONVENTIONS.md`](./docs/00-overview/CONVENTIONS.md) wins; on an
API fact, [`05-api`](./docs/05-api/API-INVENTORY.md) wins.

## Critical rules (red‑flag list — push back immediately)

1. **No raw `fetch`/`axios`.** Every backend call goes through a generated **factory** (`service/factories.ts`) on the
   shared **`Instance`** (`service/Instance.ts`). The only sanctioned non‑factory network calls are **presigned S3 PUTs**
   during upload. → [`data-layer`](./docs/02-architecture/data-layer.md).
2. **No hand‑rolled DTOs.** Every request/response type is a generated **model** from `service/generates` (build output,
   **never hand‑edit**). If a type is wrong, fix the spec/generation.
3. **PascalCase for API model properties** (`Id`, `Email`, `Path`, `Key`, `CreatedAt`) — project‑wide, deliberate.
   Local‑only UI state uses idiomatic TS.
4. **`ownerId`, never `userId`** for the storage‑owner value (`user.Id` *or* `team/{TeamId}`). It shows up as the
   query‑key **scope** and `X-Team-Id` handling. Treating it as a user UUID breaks team storage.
5. **Secure‑folder tokens are NEVER persisted** (no localStorage/sessionStorage/cookie). In‑memory only,
   ancestor‑aware, cleared on logout + tab close. The token reaches the `Instance` via the **inverted‑deps seam**
   (`service/token-sources.ts` — `registerSecureFolderTokenSource`); `service/` never imports `@/features/`.
   → [`secure-folder-lifecycle`](./docs/02-architecture/secure-folder-lifecycle.md).
6. **No hardcoded user‑facing copy.** All strings via i18n keys (EN at MVP). → [`i18n`](./docs/06-cross-cutting/i18n.md).
7. **No raw hex / arbitrary colors** in components. Use semantic Tailwind tokens. **Every** animation respects
   `prefers-reduced-motion`. Pull shadcn primitives via the **shadcn MCP**, then wrap. → [`design-system`](./docs/03-design-system/DESIGN-SYSTEM.md).
   **Build every new surface against the realized "Zen" treatment** — reuse the wrapped primitives in
   `components/ui/*` (gradient/`upload` Button, `DropdownMenuRichItem` icon‑tile rows, `Badge` `info`, `Tabs`
   `underline`, `Logo`, …) + the `.zs-*` layer in `app/globals.css`; never reintroduce flat shadcn. The Zen bundle
   is a **vendored snapshot** at [`zen-reference`](./docs/03-design-system/zen-reference/ABOUT.md) (primitives §5 +
   patterns §4 document the realized look). When the user updates the design in claude.ai/design they paste a fresh
   `api.anthropic.com/v1/design/h/<hash>` export URL → **download (gzip) → extract → diff `project/` against
   `zen-reference/` → implement → re‑sync the changed vendored files**. Export URLs are ephemeral (old hash → 404);
   always use the newest one given.
8. **Don't build team UI before Phase 8** — but keep everything team‑ready (header + key scope). → [`team-readiness`](./docs/02-architecture/team-readiness.md).
9. **The envelope/error layer is the `Instance`**, not per call. It unwraps `Result`, maps typed `ApiError`, toasts,
   `401→re-auth`; `403`/`409` pass through to feature handlers.
10. **ESLint boundaries are enforced from P0 in FULL ERROR mode** (eslint-plugin-boundaries + entry-point +
    no-restricted-imports + no-restricted-syntax). The architecture is lint-policed, not goodwill-policed.
11. **Next 16.2 rename: `middleware.ts` is now `proxy.ts`.** The exported function is `proxy`, not `middleware`. Edge runtime is NOT supported in proxy — it runs Node-only. → [`auth-integration`](./docs/02-architecture/auth-integration.md).
12. **Strict CSP + nonce from day one.** Every response carries a per-request CSP nonce; inline `<script>`/`<style>` must consume it. `frame-ancestors 'none'`, `script-src 'self' 'nonce-…' 'strict-dynamic'`, no `unsafe-inline`, no `unsafe-eval`. Preview iframes (Phase 4) are `sandbox`ed with the minimum capability set. → [`security-headers`](./docs/06-cross-cutting/security-headers.md).
13. **KVKK/GDPR-ready PII handling.** Cookie consent banner (essential always on, analytics opt-in only); `/privacy`, `/terms`, `/cookies` pages shipped in Phase 1; Sentry PII scrubber wired in Phase 0; Data Export + Delete Account UI delivered by Phase 7. → [`privacy-compliance`](./docs/06-cross-cutting/privacy-compliance.md).
14. **Performance budgets enforced in CI.** Initial bundle ≤ 200 KB gzip; any file list > 100 entries must virtualize; LCP < 2.5s on the app shell. `size-limit` + Lighthouse CI gate every PR — budget regressions fail the build. → [`performance`](./docs/06-cross-cutting/performance.md).
15. **Supported browsers locked.** Chrome / Safari / Firefox / Edge last 2 majors, iOS Safari 17+, Chrome Android. NO IE, NO legacy Edge, NO polyfills for unsupported engines. Touch DnD has an explicit alternative (long-press → bottom sheet). PWA is out of scope for MVP. → [`SUPPORTED-BROWSERS`](./docs/00-overview/SUPPORTED-BROWSERS.md).
16. **Dependency supply-chain disciplined.** Renovate runs weekly with grouped PRs; `bun audit --severity high` fails CI; license allowlist is `MIT` / `Apache-2.0` / `BSD-*` / `ISC` only; an SBOM artifact is produced per build. Auth.js v5 + Next 16.2 beta status is acknowledged with a custom-cookie-session fallback path documented. → [`dependency-policy`](./docs/06-cross-cutting/dependency-policy.md).

## Folder structure (target — built across phases)

```
app/(public|auth|app)/        route groups; app/(app)/storage/[[...path]]  folder deep-linking
proxy.ts                      ~5-line shim → lib/auth/proxy
instrumentation.ts            ~5-line shim → lib/observability/instrumentation
lib/{api,auth,i18n,motion,utils}
service/{Instance.ts, factories.ts, token-sources.ts, interceptors/, generates/}
                              token-sources.ts = inverted-deps seam; generates/ = build output, never hand-edit
features/{shell,storage,preview,document-editor,notifications,account,auth,teams}
                              shell/ owns AppShell/Sidebar/Topbar/WorkspaceSwitcher (replaces components/layout/)
components/ui/                shadcn primitives (via MCP) + premium wrappers
stores/                       GLOBAL zustand only: workspace, ui (uploads/selection/viewPrefs/secureFolders are feature-local)
hooks/
```
Full version + rationale: [`docs/02-architecture/ARCHITECTURE.md`](./docs/02-architecture/ARCHITECTURE.md#folder-structure).
Path alias: `@/*` (tsconfig).

## Commands (package manager: **bun** — `bun.lock` present)

```bash
bun install
bun run dev                 # next dev
bun run build               # next build
bun run start               # next start
bun run lint                # eslint
bun run generate:service:test   # regenerate the OpenAPI client into service/generates (spec at :8080/swagger-json)
bunx tsc --noEmit           # type-check (no script alias)
```
- The generated client is **committed**; regenerate when the API changes; never hand‑edit it.
- Test scripts don't exist yet — they're added in Phase 0 (see [`testing`](./docs/06-cross-cutting/testing.md)).

## Subagents & commands (this repo's Claude setup)

**Subagents** (`.claude/agents/`) — invoked proactively:
- **`frontend-architect`** — feature/refactor/endpoint‑integration design, grounded in the docs + real code.
- **`data-layer-reviewer`** — narrow audit: factories+Instance only, no raw fetch/axios, no hand‑rolled DTOs,
  PascalCase, idempotency, envelope/401‑403‑409 handling.
- **`design-system-reviewer`** — token usage (no raw hex), motion variants + reduced‑motion, shadcn‑via‑MCP, focus/a11y.
- **`a11y-state-reviewer`** — keyboard/focus/`aria-live`, state‑matrix coverage, TanStack vs Zustand split.

**Slash commands** (`.claude/commands/`): `/implement-phase`, `/scaffold-feature`, `/add-shadcn`, `/regenerate-client`,
`/check-conventions`. **Skills** (`.claude/skills/`): `scaffold-feature`, `add-shadcn-component`.

**Hand‑offs:** design questions → `frontend-architect`; before committing a feature → run `data-layer-reviewer` +
`design-system-reviewer` (+ `a11y-state-reviewer` for UI‑heavy work).

## Phase workflow (how we implement)

1. Read `node_modules/next/dist/docs/01-app/` (first, for Phase 0 / when touching Next internals).
2. Open the phase file in [`docs/01-roadmap/phases/`](./docs/01-roadmap/phases/) — it is the checklist of record.
3. Follow each task's linked feature spec + architecture concern + design doc + endpoints. Don't re-derive conventions.
4. Close the phase only when its **acceptance‑test checklist** passes; update
   [`STATUS.md`](./docs/01-roadmap/STATUS.md) + the ROADMAP changelog.

## Do NOT
- Run anything that hits a real backend/DB destructively, or `git push --force` / push to `main`.
- Hand‑edit `service/generates/*`.
- Add team‑switch UI before Phase 8.
- Persist secure‑folder tokens anywhere.
- Introduce a second state system or a parallel HTTP client.
