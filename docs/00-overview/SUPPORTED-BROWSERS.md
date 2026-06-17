# Supported Browsers

> The v2 frontend targets **modern evergreen browsers only**. This file is the locked source of truth for browser
> support, the platform features we assume present, mobile/touch rules, and what we explicitly will NOT do (polyfills,
> PWA). When a feature spec or component needs to know "is X safe to use?", answer it here, not in code comments.

## 1. Support tiers

### Tier 1 — fully supported (test target)

| Browser | Minimum version | Notes |
|---|---|---|
| Chrome (desktop) | last 2 stable | Primary dev/test target. |
| Safari (macOS) | last 2 stable | Primary dev/test target. |
| Firefox (desktop) | last 2 stable | |
| Edge (Chromium) | last 2 stable | Chromium codebase only. Legacy EdgeHTML is NOT supported. |
| Safari (iOS) | **iOS 17+** | Floor chosen for stable WebAuthn + `prefers-reduced-motion` + container queries. |
| Chrome (Android) | **Android Chrome 124+** | Matches the desktop Chrome floor and unlocks current File System Access APIs. |

"Last 2 stable" = current stable + previous stable, as published by the vendor at release time. We do not pin to a
build number; we re-verify each phase's acceptance tests against current stable.

### Not supported (we will block / degrade)

| Browser | Behavior |
|---|---|
| Internet Explorer (any version) | Show static unsupported‑browser notice; do not boot the app. |
| Legacy Microsoft Edge (EdgeHTML, pre‑Chromium) | Same as IE. |
| Opera Mini | Same as IE — proxy rendering breaks our motion, WebSocket, and crypto assumptions. |
| UC Browser, in‑app webviews older than the iOS 17 / Android 124 floor | Best‑effort only; no bug triage. |

The unsupported‑browser notice ships in Phase 7 (Public & Polish). Until then, the app may render but is not
guaranteed to work in those environments.

## 2. Required platform features

Every Tier‑1 browser has these. If a feature below is missing, we treat the browser as out of support — we do
**not** polyfill (see §5).

| Feature | Used by | Locked decision |
|---|---|---|
| **WebAuthn** (`navigator.credentials` + `PublicKeyCredential`) | Passkey login & account credential ([auth-integration](../02-architecture/auth-integration.md)) | Required. No password‑only fallback path is added for browsers missing WebAuthn — they still have password + TOTP. |
| **`<input webkitdirectory>`** | Folder upload in the upload feature | Required for folder upload only. File upload still works without it. |
| **HTML5 Drag‑and‑Drop** (file drop + `dnd-kit` move) | Upload drop zones + move via drag ([D5](../07-decisions/DECISIONS.md)) | Required on desktop pointer devices. Touch path uses the long‑press alternative (§4). |
| **BroadcastChannel** | Cross‑tab sync of auth/session state and secure‑folder lock state | Required. No `localStorage`‑event fallback. |
| **IndexedDB** | Offline‑friendly caches (TanStack Query persistence, draft document backups) | Required. We do not fall back to `localStorage` for these — size limits and sync semantics differ. |
| **WebSocket** | `socket.io` realtime channel ([realtime-socket](../02-architecture/realtime-socket.md)) | Required. We do not poll as a transport fallback (status‑polling exists for long‑job progress only — see D‑A3). |
| **`prefers-reduced-motion` media query** | Motion system gate ([reduced-motion](../03-design-system/motion/reduced-motion.md)) | Required. Motion variants swap to instant when matched. |
| **Container queries** | Responsive component layout | Required at the iOS 17 / Android 124 floor. |
| **Web Crypto (`crypto.subtle`, `crypto.randomUUID`)** | Idempotency keys ([D‑F11](../07-decisions/DECISIONS.md)), passkey ceremonies | Required. Secure context (HTTPS) only. |

## 3. Feature matrix (per‑browser sanity check)

All Tier‑1 browsers ship these. The matrix exists so reviewers can confirm a feature spec doesn't accidentally
assume something outside the green column.

| Capability | Chrome (last 2) | Safari 17+ | Firefox (last 2) | Edge (last 2) | iOS Safari 17+ | Android Chrome 124+ |
|---|---|---|---|---|---|---|
| WebAuthn | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `webkitdirectory` | ✅ | ✅ | ✅ | ✅ | ❌ (no folder upload on iOS) | ✅ |
| Native DnD (files) | ✅ | ✅ | ✅ | ✅ | ❌ (touch path — §4) | ❌ (touch path — §4) |
| BroadcastChannel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| WebSocket / `socket.io` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `prefers-reduced-motion` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Two intentional gaps:

- **iOS Safari, `webkitdirectory`** — iOS has never supported folder upload. We hide the "upload folder" affordance
  on iOS and surface "upload files" only. This is a UX branch, not a polyfill.
- **Touch devices, native DnD** — HTML5 file drop and pointer‑based `dnd-kit` move don't translate to touch. We
  ship a touch alternative instead of trying to emulate DnD (§4).

## 4. Mobile / touch rules

The app is responsive down to small phones; these rules are non‑negotiable on touch surfaces.

1. **No hover‑only affordances.** Anything reachable by hover on desktop must also be reachable by tap (row long‑press,
   overflow menu, or always‑visible icon button). Hover is a progressive enhancement, never the sole entry point.
2. **44×44 CSS px minimum tap target.** Matches Apple HIG and our spacing‑layout rule
   ([spacing-layout](../03-design-system/foundations/spacing-layout.md)). Row height stays ~44px in list views; icon
   buttons pad to 44×44 even when the glyph is smaller.
3. **Safe‑area aware.** Every full‑bleed surface (top bar, bottom sheet, bulk‑action bar, sticky footer) honors
   `env(safe-area-inset-*)`. No content hidden under the iOS home indicator or notch.
4. **Viewport meta is fixed.** The root layout ships:

   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
   ```

   No `user-scalable=no`, no `maximum-scale` — accessibility requires the user can zoom.
5. **Touch DnD alternative = long‑press → bottom sheet.** On coarse pointers (`(pointer: coarse)`) we do not attempt
   to drag rows. Long‑press on an item opens a bottom sheet with **Move…**, **Copy…**, **Download**, **Delete**,
   **Share** (and bulk equivalents when a selection exists). Drop targets are picked from a folder tree inside the
   sheet — never by dragging across the viewport. Same actions, different gesture.
6. **File upload on touch** — tap the upload button to open the native picker. Drop‑zone visuals stay desktop‑only.
7. **Modifier shortcuts gracefully degrade** — keyboard shortcuts ([keyboard-shortcuts](../06-cross-cutting/keyboard-shortcuts.md))
   are desktop‑first. Touch surfaces never depend on them; every shortcut has an equivalent menu/button entry.

## 5. Polyfill policy — **NONE**

We do not ship polyfills. Period.

- No `core-js`, no `whatwg-fetch`, no `web-streams-polyfill`, no DnD shims, no IndexedDB shims.
- If a Tier‑1 browser at its floor version is missing a feature we need, we **raise the floor** rather than polyfill.
- If a non‑Tier‑1 browser is missing a feature, that's why it's not Tier 1.

Rationale: polyfills inflate bundle size, mask real compatibility bugs, and we have nothing in the stack (Auth.js v5,
Next 16.2, React 19, Tailwind v4) that pretends to support pre‑evergreen browsers. The shadcn primitives we wrap also
assume modern CSS.

Exception: framework‑internal polyfills shipped by Next 16.2 itself (e.g. for its own runtime) are fine — we don't
fight the framework. We just don't add our own.

## 6. PWA — out of scope (D‑F17)

**D‑F17: PWA / offline / installability is out of MVP scope and stays out until a backend gap is resolved.**

- No service worker, no app manifest install prompt, no offline write queue, no background sync.
- `app/manifest.ts` exists for icons + theme color + name only — it is **not** a PWA install manifest.
- IndexedDB is used for in‑session caches (TanStack Query persistence, draft backups) — that's caching, not offline mode.
- Status: tracked post‑MVP in [pwa-offline](../06-cross-cutting/pwa-offline.md), [backend-gaps](../07-decisions/backend-gaps.md),
  and [MVP-DEFINITION](./MVP-DEFINITION.md). Aligns with **D‑S7** (PWA stays post‑MVP).

If a user installs the page from the browser "Add to Home Screen" menu anyway, the app must still work — we just
don't advertise install, ship a service worker, or claim offline capability.

## 7. Phase ownership

| Phase | Browser‑support work owned |
|---|---|
| **Phase 0 — Foundation** | Viewport meta in root layout; `prefers-reduced-motion` gate in motion system; container‑query baseline; `@/lib/utils` includes coarse‑pointer + safe‑area helpers; ESLint/TS targets set to the evergreen floor (no `es5` downleveling). |
| **Phase 1 — Auth** | WebAuthn passkey paths assume Tier 1; password + TOTP path also works (no WebAuthn requirement). |
| **Phase 2 — Shell + Account** | Safe‑area on top bar, sidebar, command bar; bottom sheet primitive added for touch action menus. |
| **Phase 3 — Storage Core** | `webkitdirectory` upload (desktop only); coarse‑pointer branch hides folder upload on iOS; touch DnD alternative (long‑press → bottom sheet) for move/copy/bulk actions; `BroadcastChannel` for cross‑tab selection/auth sync. |
| **Phase 4 — Preview + Share** | Native share API on touch (Web Share), copy‑link fallback on desktop. |
| **Phase 5 — Secure Folders** | `BroadcastChannel` for cross‑tab lock state; no persistence (rule §5 of CLAUDE.md). |
| **Phase 7 — Public & Polish** | Unsupported‑browser notice on `(public)` and `(auth)` routes; final cross‑browser pass on Tier 1; `app/manifest.ts` (non‑PWA) wired. |
| **Phase 8 — Teams (post‑MVP)** | No new browser‑support work expected. |
| **Phase 9 — Organization (post‑MVP)** | Re‑evaluate folder upload behavior if a backend ingestion path changes the UX. |
| **Post‑MVP (un‑phased)** | PWA / service worker / offline write queue — only after the backend gap is resolved (D‑F17). |

## 8. Open items

- **O‑B1** — Final wording + visual for the unsupported‑browser notice (Phase 7 task). Need design pass + EN copy.
- **O‑B2** — Decide whether the notice ships as a static HTML file served before Next bootstraps, or as a client guard
  inside `app/(public)/layout.tsx`. Static is more robust for IE/EdgeHTML; client guard is simpler. Default plan:
  client guard; revisit if real IE traffic appears.
- **O‑B3** — Confirm iOS Safari 17 floor against analytics once we have any. If we see meaningful iOS 16 traffic at
  launch, the floor may have to drop one minor — but only after a feature audit (container queries are the risky one).
- **O‑B4** — Touch DnD alternative copy + bottom‑sheet animation variants — owned by Phase 3 design pass.
- **O‑B5** — Revisit polyfill policy if/when we add a third‑party embed that demands one. Default stays NONE.

## 9. Cross‑references

- [PROJECT-OVERVIEW](./PROJECT-OVERVIEW.md) — scope this floor serves.
- [MVP-DEFINITION](./MVP-DEFINITION.md) — PWA / offline cut line.
- [CONVENTIONS](./CONVENTIONS.md) — token usage, no raw hex, motion rules referenced above.
- [DESIGN-SYSTEM](../03-design-system/DESIGN-SYSTEM.md) — premium look + motion system.
- [spacing-layout](../03-design-system/foundations/spacing-layout.md) — 44px tap target rule lives here too.
- [reduced-motion](../03-design-system/motion/reduced-motion.md) — `prefers-reduced-motion` requirement.
- [accessibility](../06-cross-cutting/accessibility.md) — keyboard/focus/aria‑live baselines.
- [keyboard-shortcuts](../06-cross-cutting/keyboard-shortcuts.md) — desktop‑first shortcut rules.
- [pwa-offline](../06-cross-cutting/pwa-offline.md) — post‑MVP PWA plan.
- [auth-integration](../02-architecture/auth-integration.md) — WebAuthn / passkey flow.
- [realtime-socket](../02-architecture/realtime-socket.md) — WebSocket usage.
- [secure-folder-lifecycle](../02-architecture/secure-folder-lifecycle.md) — no persistence rule.
- [backend-gaps](../07-decisions/backend-gaps.md) — PWA backend dependency.
- [DECISIONS](../07-decisions/DECISIONS.md) — D‑S7 (PWA post‑MVP), D‑F17 declared here, D5 (DnD), D‑F11 (Web Crypto / idempotency).
