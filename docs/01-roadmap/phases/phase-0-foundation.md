# Phase 0 — Foundation + Design System

> **Status:** ⏳ not started · **Depends on:** nothing (this is the base) · **Blocks:** every other phase.
> **Back to:** [ROADMAP](../ROADMAP.md) · **Architecture:** [ARCHITECTURE](../../02-architecture/ARCHITECTURE.md) ·
> **Design:** [DESIGN-SYSTEM](../../03-design-system/DESIGN-SYSTEM.md)

## ⚠ Before any code
**Read `node_modules/next/dist/docs/01-app/`.** `AGENTS.md` warns this Next version (16.2) has breaking changes vs.
training data. Do this first, every Phase‑0 session.

## Objective
Stand up a **runnable, team‑ready skeleton** with the design/motion system, the data layer, theming, i18n, routing, and
all providers — and **no feature screens**. When Phase 0 is done, a developer can add a screen and it automatically gets
auth headers, envelope unwrap, typed errors/toasts, theming, motion, and i18n for free.

## Scope
**In:** dependencies; conventions; design tokens + motion system; light/dark theming; i18n scaffold (EN); generated‑client
wiring + axios `Instance`; envelope/typed‑error/toast layer; socket.io client lifecycle; routing skeleton with folder
deep‑linking; providers (Query / Session / Notification / Theme).
**Out:** any feature screen; any team UI; real auth screens (Phase 1); any storage logic.

## Task breakdown

### 0.1 — Dependencies & tooling
- [ ] Install runtime deps: `@tanstack/react-query`, `@tanstack/react-virtual`, `zustand`, `axios`, `next-auth@5`,
      `socket.io-client`, `framer-motion`, `@dnd-kit/core` (+ sortable/modifiers), `react-hook-form`, `zod`,
      `@hookform/resolvers`, `sonner`, `qrcode.react`, `@simplewebauthn/browser`, `lucide-react`,
      CodeMirror (`@codemirror/*` or `@uiw/react-codemirror`), `next-themes`.
- [ ] Confirm dev deps already present: `@openapitools/openapi-generator-cli`, `shadcn@4`, `tailwindcss@4`, `eslint`.
- [ ] Verify `tsconfig` path alias `@/*` works; add any needed aliases (keep `@/*` as the single root alias).
- [ ] Lint/format config: ESLint (next config) + a hardcoded‑string rule scaffold (see i18n).

### 0.2 — Generated client workflow
- [ ] Confirm `openapitools.json` and `npm run generate:service:test` (spec at `http://localhost:8080/swagger-json`).
- [ ] Document the regen workflow in [`data-layer`](../../02-architecture/data-layer.md): when to regenerate, that
      output is **committed** and **never hand‑edited**.
- [ ] Sanity‑check `service/generates` matches the current API; list the wired factories
      (currently 11 in `service/factories.ts`); add **Subscription** + **Notification** factories if the spec exposes
      them.

### 0.3 — The axios `Instance` (the heart of the data layer)
- [ ] Create the shared `Instance` that `service/factories.ts` imports. **Decide the path** (`service/Instance.ts` to
      match the existing import, vs `lib/api/Instance.ts` per the architecture proposal — reconcile, see open Q).
- [ ] Base URL/env (`NEXT_PUBLIC_API_URL` + `/Api`); timeouts.
- [ ] Request interceptors: inject `X-Session-Id` (from Auth.js session client‑side / server token in RSC),
      `X-Team-Id` (from `workspace.store`, null in Personal), secure‑folder headers
      (`X-Folder-Session`/`X-Hidden-Session`, ancestor‑aware — store is built in Phase 5 but the hook point exists now),
      and `Idempotency-Key` for Move/Delete/CompleteMultipartUpload.
- [ ] Response interceptor: **unwrap `Result`**; surface `Options.Count`; map `Status`/HTTP → typed
      `ApiError { code, messages, httpStatus, raw }`; drive **sonner** toasts; **`401 → re-auth/sign-out`**; pass
      `403`/`409` through to feature handlers.
- [ ] Cancellation + retry: thread `AbortSignal` from TanStack Query; bounded retry/backoff for idempotent GETs only.
- [ ] Rebuild `service/factories.ts` on this `Instance` (it already references it).

### 0.4 — TanStack Query provider + keys
- [ ] `QueryClientProvider` with sane defaults (staleTime, retry off for mutations, error boundary integration).
- [ ] Establish **team‑prefixed query‑key conventions** (see [state-management](../../02-architecture/state-management.md)).
- [ ] Wire the `Instance`'s `AbortSignal` + error mapping into query/mutation defaults.

### 0.5 — Design system + motion (premium shadcn + framer‑motion)
- [ ] `shadcn init` (new‑york, neutral) → `components.json`; pull base primitives **via the shadcn MCP** (button, input,
      dialog, dropdown, tooltip, sheet, toast/sonner, skeleton, etc.).
- [ ] Tailwind v4 **semantic token palette** in `globals.css` (`@theme inline`) — extend beyond
      `--background/--foreground` to surfaces, borders, accent, and state colors (success/warning/danger/info).
      See [foundations/color](../../03-design-system/foundations/color.md).
- [ ] **Glass tokens + `glass-chrome`/`glass-overlay` utilities** in `globals.css` (signature look) with the
      **`prefers-reduced-transparency` solid fallback** baked in. Chrome/overlays only; content stays solid.
      See [foundations/glassmorphism](../../03-design-system/foundations/glassmorphism.md).
- [ ] `lib/motion/` — duration/easing/distance **tokens**, shared **variants** (page, modal, list stagger, hover/press,
      toast), and a `useReducedMotion` gate. See [motion](../../03-design-system/motion/tokens.md).
- [ ] Premium wrappers in `components/ui/*` over the shadcn primitives.

### 0.6 — Theming & i18n
- [ ] Light/dark theme provider (system preference; `next-themes`‑style); tokens drive both. See
      [theming](../../03-design-system/theming.md).
- [ ] `lib/i18n/` dictionaries + `t()`; EN dictionary; structure for a 2nd language; lint rule against hardcoded copy.
      See [i18n](../../06-cross-cutting/i18n.md).

### 0.7 — Realtime socket lifecycle
- [ ] `NotificationProvider` + socket client to namespace `/notifications`; handshake auth `{ SessionId }`;
      connect on authenticated session, disconnect/reconnect on auth or team change, teardown on sign‑out; backoff cap
      ~30s. See [realtime-socket](../../02-architecture/realtime-socket.md). (Fan‑out to toasts/inbox/jobs is wired in
      later phases; the lifecycle exists now.)

### 0.8 — Routing skeleton & providers
- [ ] Route groups `(public)` / `(auth)` / `(app)` with per‑group layouts.
- [ ] `app/(app)/storage/[[...path]]/` catch‑all skeleton (folder deep‑linking placeholder).
      See [routing-deep-linking](../../02-architecture/routing-deep-linking.md).
- [ ] Route‑level `loading.tsx` / `error.tsx` boundaries per segment.
- [ ] Compose providers (Theme → Query → Session → Notification) in the app shell.
- [ ] `.env` (`NEXT_PUBLIC_API_URL`) + env validation.

## Endpoints used
None called for features. **Smoke‑test only:** one `Account/Profile` GET through the `Instance` to prove the full path
(headers → unwrap → typed data). See [API: account](../../05-api/modules/account.md).

## Acceptance‑test checklist
- [ ] `next dev` boots with no runtime errors; `next build` succeeds.
- [ ] Theme toggle works and respects system preference; `prefers-reduced-motion` swaps motion variants to instant.
- [ ] A factory call (`Account/Profile`) returns **unwrapped, typed** data through the `Instance`; a forced error
      produces a typed `ApiError` + a toast; a simulated `401` triggers re‑auth/sign‑out.
- [ ] The socket connects with a session and reconnects after a drop.
- [ ] `npm run generate:service:test` regenerates the client cleanly; the diff is committed.
- [ ] An example i18n key renders via `t()`; the hardcoded‑string lint rule flags a planted violation.
- [ ] Route groups resolve; `storage/[[...path]]` renders the skeleton for `/storage` and `/storage/a/b`.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| **Auth.js v5 ↔ Next 16.2 / React 19** incompatibility | Time‑boxed spike early; if blocked, thin custom cookie‑session adapter (record in DECISIONS). |
| **Tailwind v4 + shadcn MCP intake** friction | Validate one primitive end‑to‑end before pulling the set. |
| **Next 16 breaking changes** | Read bundled docs first; heed deprecations. |
| **Spec unreachable** at generate time | Keep committed client; document local API bring‑up. |

## Rollback / fallback
- Auth library: fall back to a **custom cookie‑session adapter** if Auth.js v5 is blocked (Phase 1 consumes whichever
  ships).
- Motion: ship tokens + a minimal variant set; expand variants later — never block Phase 0 on full motion polish.

## Exit criteria
A team‑ready skeleton that boots, themes, animates (reduced‑motion aware), speaks to the API through one typed `Instance`
with consistent errors/toasts, connects a socket, and resolves the route groups — with **zero feature code**. On meeting
this, mark Phase 0 ✅ in [STATUS](../STATUS.md) and add a Changelog line, then begin
[Phase 1](./phase-1-auth.md).
