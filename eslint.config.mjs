import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "service/generates/**",
    "**/*.css",
  ]),

  {
    plugins: { boundaries, import: importPlugin },
    settings: {
      // NOTE: boundaries resolves a file to the LATER-matching element. The
      // global utility patterns (components/**, lib/**, hooks/**, …) also match
      // a feature's INTERNAL folders (features/auth/components, …). So `feature`
      // is listed LAST — it wins for everything under features/, making the
      // whole flat feature ONE element (intra-feature imports are free; cross-
      // feature still goes via the index barrel). Nested sub-features
      // (features/storage/{browse,upload}) get a narrow `subfeature` element in P3.
      "boundaries/elements": [
        { type: "app", pattern: "app/**" },
        { type: "proxy", pattern: "(proxy|instrumentation).ts" },
        { type: "components", pattern: "components/**" },
        { type: "lib", pattern: "lib/**" },
        { type: "service", pattern: "service/**" },
        { type: "stores", pattern: "stores/**" },
        { type: "hooks", pattern: "hooks/**" },
        { type: "config", pattern: "config/**" },
        { type: "types", pattern: "types/**" },
        { type: "tests", pattern: "tests/**" },
        { type: "feature", pattern: "features/*", mode: "folder", capture: ["name"] },
      ],
      "boundaries/include": [
        "app/**",
        "proxy.ts",
        "instrumentation.ts",
        "features/**",
        "components/**",
        "lib/**",
        "service/**",
        "stores/**",
        "hooks/**",
        "config/**",
        "types/**",
        "tests/**",
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "app", allow: ["feature", "components", "lib", "service", "stores", "hooks", "config", "types"] },
            { from: "proxy", allow: ["lib", "config", "types"] },
            { from: "feature", allow: ["feature", "components", "lib", "service", "stores", "hooks", "config", "types"] },
            { from: "components", allow: ["components", "lib", "hooks", "config", "types"] },
            { from: "lib", allow: ["lib", "service", "config", "types"] },
            // service composes the data layer from lib/api primitives + lib/i18n
            // (data-layer §2.7: the Instance composer consumes lib/*). It still
            // may NOT import features (leaf rule, enforced here by omission).
            { from: "service", allow: ["service", "lib", "config", "types"] },
            { from: "stores", allow: ["lib", "service", "config", "types"] },
            { from: "hooks", allow: ["lib", "service", "stores", "config", "types"] },
            { from: "tests", allow: ["app", "feature", "components", "lib", "service", "stores", "hooks", "config", "types"] },
          ],
        },
      ],
      // Only features are barrel-locked (entered via index.(ts|tsx)) — cross-
      // feature imports must use the barrel; intra-feature imports are free
      // (same element). Every other element type allows any entry file by path
      // (e.g. `@/lib/auth/server`). Deep cross-feature imports are also blocked
      // by no-restricted-imports below.
      "boundaries/entry-point": [
        "error",
        {
          default: "allow",
          rules: [{ target: "feature", allow: "index.(ts|tsx)" }],
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "axios", message: "Use @/service/factories on the shared Instance." }],
          patterns: [
            { group: ["axios/*"] },
            { group: ["@/service/generates/*"], message: "Import via @/service/models." },
            { group: ["@/features/*/!(index)", "@/features/*/*/!(index)"], message: "Feature barrel only." },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        { selector: "CallExpression[callee.name='fetch']", message: "Use @/service/factories. Exception: features/storage/upload/api/presigned-put.ts." },
        { selector: "ExportAllDeclaration", message: "Named re-exports only." },
        { selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]", message: "No raw hex. Use semantic tokens." },
        // Privacy §9: direct localStorage writes are a PII surface. Use a reviewed
        // store (zustand persist) or add an eslint override if truly needed.
        { selector: "MemberExpression[object.name='localStorage'][property.name='setItem']", message: "No direct localStorage.setItem (PII surface). Use a reviewed store." },
      ],
    },
  },

  // boundaries matches element patterns with micromatch `{ contains: true }`, so
  // the global utility patterns (components/**, lib/**, hooks/**, …) also match a
  // feature's INTERNAL folders (features/auth/components, …) and misclassify them.
  // There's no pattern-only anchor under `contains`, so element-types is turned
  // OFF for files UNDER features/** (intra-feature layering was permissive anyway).
  // The critical guarantees remain: cross-feature hard-barrel (entry-point on
  // `feature` + the `@/features/*/!(index)` import ban), no raw HTTP, no
  // `@/service/generates`, and the leaf/one-way rules (whose FROM files are
  // top-level, still checked). (D-P1.1)
  { files: ["features/**"], rules: { "boundaries/element-types": "off" } },

  // service/ is the ONE sanctioned axios user (the Instance + interceptors).
  // The feature-side "no raw HTTP" ban still applies everywhere else.
  { files: ["service/**"], rules: { "no-restricted-imports": "off" } },

  // The single allow-listed S3 PUT fetch (lands in P3); keep the export-* ban.
  { files: ["features/storage/upload/api/presigned-put.ts"], rules: { "no-restricted-syntax": ["error", { selector: "ExportAllDeclaration" }] } },

  // Token sources (motion arrays, ui primitives) may use raw values; the raw-hex
  // ban is lifted here (globals.css itself is not linted by ESLint).
  { files: ["lib/motion/**", "components/ui/**"], rules: { "no-restricted-syntax": ["error", { selector: "ExportAllDeclaration" }] } },

  { files: ["service/generates/**"], rules: { "boundaries/element-types": "off", "boundaries/entry-point": "off" } },

  // service/models.ts is the SOLE allow-listed `export *` (D-F18); generates/ is generator output.
  { files: ["service/models.ts", "service/generates/**"], rules: { "no-restricted-syntax": "off" } },

  // No hand-rolled DTOs in feature data/types.
  {
    files: ["features/**/api/**", "features/**/types.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "TSInterfaceDeclaration[id.name=/.*(Dto|Request|Response)$/]", message: "DTOs are generated." },
        { selector: "TSTypeAliasDeclaration[id.name=/.*(Dto|Request|Response)$/]", message: "DTOs are generated." },
      ],
    },
  },

  // Secure-folder tokens are NEVER persisted (rule exists now; file lands in P5).
  {
    files: ["features/secure-folders/stores/secureFolders.store.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: [{ name: "zustand/middleware", importNames: ["persist"], message: "In-memory only." }] }],
      "no-restricted-syntax": [
        "error",
        { selector: "MemberExpression[object.name='localStorage']" },
        { selector: "MemberExpression[object.name='sessionStorage']" },
        { selector: "MemberExpression[object.property.name='cookie']" },
      ],
    },
  },
]);
