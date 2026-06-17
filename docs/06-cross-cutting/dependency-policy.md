# Cross‑cutting — Dependency Policy

> Bleeding‑edge stack (Next 16.2 / React 19 / Auth.js v5 beta / Tailwind v4) means supply‑chain risk is **structural**,
> not incidental. This doc locks the rules for adding, pinning, updating, and auditing dependencies.

## 1. Why supply‑chain matters here

We sit on the leading edge of the React/Next ecosystem: pre‑1.0 betas, fresh majors, and packages whose maintainer
counts you can count on one hand. The blast radius is large:

- **Generated client** (`service/generates/`) ships into every feature — any transitive break in `openapi-typescript`/
  fetch helpers leaks site‑wide.
- **Auth.js v5** is in beta; a bad release can break sign‑in for every user.
- **Secure‑folder tokens** live in memory — a malicious post‑install can exfiltrate them at runtime.
- **Tailwind v4 / shadcn** primitives are pulled at build time and at MCP install time — both are code paths.

Treat every `bun add` as a security review, not a convenience.

## 2. Version pinning tiers

Two tiers, no third option. Every direct dep belongs to exactly one.

| Tier | Range syntax | Applies to | Rationale |
|---|---|---|---|
| **Critical — exact** | `"1.2.3"` (no caret, no tilde) | `next`, `react`, `react-dom`, `next-auth` (Auth.js), `@auth/*`, `tailwindcss`, `@tanstack/react-query`, `zustand`, `socket.io-client`, `zod`, OpenAPI client generator | Breaking changes in a patch have happened. We upgrade deliberately, never drifting. |
| **Standard — caret + lock** | `"^1.2.3"` with `bun.lock` committed | everything else (UI utilities, dev tooling, types) | Caret in `package.json` for human readability; `bun.lock` is the actual source of truth and is **always committed**. |

Rules:

- `bun.lock` is **always** committed. Never `.gitignore` it.
- No `latest`, no `*`, no git URLs, no `file:` paths outside the repo.
- New dep added in PR description must state its tier and justify any Critical entry.

## 3. Renovate update cadence

Renovate is the only sanctioned updater. Manual `bun update` outside Renovate PRs is forbidden except for security
hotfixes.

| Group | Schedule | Auto‑merge | Notes |
|---|---|---|---|
| `devDependencies` patch | Weekly (Mon) | Yes, if CI green | Types, linters, formatters. |
| `devDependencies` minor | Weekly (Mon) | Manual review | One PR per package. |
| `dependencies` patch | Weekly (Mon) | Manual review | Read changelog. |
| `dependencies` minor | Bi‑weekly | Manual review | Read changelog + run smoke. |
| **Critical tier (any bump)** | On‑demand only | Never auto | Owner reads the changelog end‑to‑end + runs full E2E. |
| Security advisories (`bun audit` ≥ high) | Same day | Manual, expedited | Block merge of unrelated work if needed. |

Renovate config lives at `.github/renovate.json` (added in Phase 0). Group rules pin Critical packages to
`dependencyDashboardApproval: true`.

## 4. CI gates

Every PR runs the following in order. **First failure blocks merge.** No bypass labels.

```yaml
# .github/workflows/deps.yml (shape, not full file)
- bun install --frozen-lockfile        # lockfile drift = fail
- bunx tsc --noEmit                    # types must hold post-install
- bun run lint                         # boundaries + restricted imports
- bun audit --severity high            # high/critical CVEs = fail
- bunx license-checker-rseidelsohn \
    --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;CC0-1.0;0BSD;Unlicense"
- bunx @cyclonedx/cyclonedx-npm \
    --output-file sbom.json            # SBOM uploaded as artifact
```

### License allowlist (exhaustive — additions require Decisions entry)

`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`, `CC0-1.0`, `0BSD`, `Unlicense`.

Anything else (`GPL-*`, `AGPL-*`, `LGPL-*`, `MPL-*`, `SSPL`, custom, `UNLICENSED`) **fails the build**. Dual‑licensed
packages must have at least one allowed license.

### SBOM

CycloneDX JSON is produced on every main build and attached to releases. Retained for 90 days as a build artifact;
release tags retain indefinitely.

## 5. Postinstall script policy

Postinstall scripts are arbitrary code execution at install time. Default: **off.**

- `bun` runs lifecycle scripts only for packages in an explicit allowlist at `.bun/trustedDependencies` (or
  `package.json#trustedDependencies` once supported).
- The allowlist starts empty. Adding a package requires:
  1. Reading the script. Pasting it into the PR description.
  2. Confirming the script does only what its README claims (native bindings build, binary fetch).
  3. A second reviewer signs off.
- Common offenders to scrutinize: `sharp`, `esbuild`, `@swc/core`, `puppeteer`, `playwright`. All are legitimate but
  must still be allowlisted explicitly.
- CI runs install with scripts gated; if a transitive dep needs a script we didn't allow, the build fails loudly.

## 6. Rollback playbook

When a Critical‑tier dep breaks production, we revert fast. Pre‑agreed fallbacks remove the "what do we do" panic.

| Package | Failure mode | Rollback path |
|---|---|---|
| `next` | Build/runtime regression | Revert lockfile + `package.json` to previous exact pin; redeploy. Hold for `.1` patch. |
| `react` / `react-dom` | Hydration or render regression | Same as `next`; pin in lockstep with the Next version that shipped against it. |
| **`next-auth` (Auth.js v5)** | Sign‑in breaks, token shape changes, or beta abandoned | Documented fallback: replace with **custom cookie‑session** layer in `lib/auth/` — signed `iron-session`‑style cookie, server‑side session lookup against backend `/auth/session`, CSRF via double‑submit. The auth surface (`lib/auth/middleware`, `lib/auth/session()`) is already an internal seam; only its implementation swaps. Feature code does not change. |
| `tailwindcss` | Style/PostCSS regression | Pin previous; defer v4 minor adoption. Tokens live in CSS vars, not classnames, so revert is local. |
| `@tanstack/react-query` | Cache/SSR regression | Pin previous; query keys are stable and don't depend on internals. |
| `socket.io-client` | Reconnect/transport regression | Pin previous; sockets are advisory (see [data‑layer](../02-architecture/data-layer.md)), polling fallback always works. |
| Generated client deps (`openapi-typescript`, etc.) | Wrong types or factory shape | Pin previous generator; regenerate; commit. |

Mechanics for any rollback:

```bash
git revert <renovate-merge-sha>     # preferred — keeps history clean
# or, surgical:
# 1. edit package.json back to the prior exact version
# 2. bun install                    # rewrites bun.lock
# 3. commit both files in one commit
```

Post‑rollback: open a tracking issue, link the upstream regression, set Renovate to ignore the broken version range
until fixed.

## 7. Phase ownership

| Phase | Dependency work |
|---|---|
| **0 — Foundation** | Lockfile committed; Renovate config + `.github/workflows/deps.yml` added; license allowlist + SBOM wired; postinstall allowlist initialized empty; Critical tier list codified in this doc and enforced by a lint script. |
| **1 — Auth** | Auth.js v5 added at exact pin; rollback playbook smoke‑tested (custom cookie‑session stub compiles even if unused). |
| **2 — Shell/Account** | shadcn primitives pulled via MCP; each addition reviewed under design‑system rules — same supply‑chain checks apply. |
| **3 — Storage core** | Upload‑related deps (chunking, retry) reviewed; presigned S3 PUT remains the only non‑factory network call. |
| **4 — Preview/Share** | Document editor deps (TipTap/Yjs or chosen stack) reviewed; large surface — extra scrutiny on transitive licenses. |
| **6 — Advanced** | Socket.io client pinned; reconnection behavior validated against rollback plan. |
| **7 — Public polish** | First full SBOM published with release; a11y/perf tooling deps added under Standard tier. |
| **8 — Teams** | No new Critical deps expected; recheck audit before GA. |
| **9 — Organization** | Quarterly dependency review: prune unused, re‑evaluate Critical tier membership, refresh allowlists. |

## 8. Open items

- Decide between `license-checker-rseidelsohn` and `@cyclonedx/cdxgen` for license scanning if Bun support matures.
- Confirm Renovate Bun lockfile support is stable as of adoption date (fallback: `npm` group manager with `bun install`
  post‑update hook).
- Provenance / Sigstore attestation for our own published artifacts — track once we have any.
- Investigate `bun pm trust` as the canonical postinstall allowlist when it ships.
- Decide retention policy for SBOMs beyond 90 days (compliance vs. storage cost).

## 9. Cross‑references

- [CONVENTIONS](../00-overview/CONVENTIONS.md) — naming, git, PR rules.
- [DECISIONS](../07-decisions/DECISIONS.md) — record any allowlist or Critical‑tier change here.
- [data‑layer](../02-architecture/data-layer.md) — why the generated client and `Instance` are Critical.
- [secure‑folder‑lifecycle](../02-architecture/secure-folder-lifecycle.md) — what an exfiltration via postinstall would cost us.
- [observability](./observability.md) — surfacing post‑deploy regressions that a rollback should trigger on.
- [testing](./testing.md) — Critical‑tier bumps require the full E2E suite, not just unit.
- [phase‑0‑foundation](../01-roadmap/phases/phase-0-foundation.md) — where CI gates land.
