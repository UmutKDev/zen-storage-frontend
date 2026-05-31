/**
 * Curated re-exports of generated DTOs from `service/generates/`.
 *
 * This file is the SINGLE allowed `export *` pragma in the codebase
 * (besides generator output itself). It is allowlisted in eslint.config.mjs
 * via a per-file override + recorded in DECISIONS.md (D-F18).
 *
 * **Why `export *` here (intentional):** The OpenAPI generator emits 200+
 * DTOs into `service/generates/api.ts`. Hand-listing every one in named
 * re-exports would be 200+ lines of churn on every `bun run generate:service:test`.
 * Instead we expose the entire generated surface and rely on TypeScript
 * inference + tree-shaking at the feature call-site.
 *
 * **Discipline:** Feature code MUST import named symbols from `@/service/models`
 * (NOT from `@/service/generates/*` directly — the ESLint `no-restricted-imports`
 * rule enforces this). When a DTO is renamed in the spec, the rename ripples
 * through this file automatically.
 *
 * **Post-MVP migration path:** If/when `service/generates/api.ts` grows past
 * ~400 DTOs or a curation use-case appears (e.g., re-exporting a subset as
 * a stable public type contract for a third-party integration), promote this
 * file to explicit named re-exports. Tracked in DECISIONS.md D-F18.
 */

/* eslint-disable-next-line no-restricted-syntax -- D-F18: curated leaf re-export */
export * from "./generates";
