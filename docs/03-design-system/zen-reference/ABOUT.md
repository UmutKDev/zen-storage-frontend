# Zen Storage design-system reference (vendored)

This folder is a **read-only reference copy** of the *Zen Storage Design System (Opus)* bundle that the
product owner exported from [Claude Design](https://claude.ai/design). The bundle is itself **derived from
this repo at `v2`** — so it is not a new palette, it is the **refined, premium realization** of the look our
own [`docs/03-design-system`](../) always specified ("premium, not decorated").

**It is reference material, not shipped code.** Nothing here is imported, built, or bundled by the app. The
treatments are realized in the repo idiom (Tailwind v4 `@theme` + shadcn wrappers in `components/ui/*` + a
disciplined `.zs-*` component-CSS layer in `app/globals.css`) — the bundle's `zs-*` vanilla classes and
`.jsx` prototypes are the *spec*, not the implementation.

## What to read

| Path | What |
|---|---|
| [`README.md`](./README.md) | The bundle's own "coding agents read this first" brief. |
| [`project/readme.md`](./project/readme.md) | Product context, content fundamentals, **visual foundations**, iconography, hard rules. |
| [`project/SKILL.md`](./project/SKILL.md) | Agent-skill entry point. |
| [`project/tokens/`](./project/tokens/) | The canonical token values (already mirrored in `app/globals.css`). |
| [`project/components/{core,surfaces,storage}/*.css`](./project/components/) | The premium treatments — the source of truth for gradients, tiles, sectioned dialogs, rails, chips. |
| [`project/components/**/*.prompt.md`](./project/components/) | Per-component intent + usage. |
| [`project/ui_kits/zen-storage-app/`](./project/ui_kits/zen-storage-app/) | Interactive recreation of the app — reference screen composition. |
| [`chats/`](./chats/) | The design conversation transcripts (where the intent lives). |

## Excluded from the vendor copy

Binaries the app doesn't need: `assets/` (Geist fonts ship via `next/font`; demo thumbs/icons),
`screenshots/`, `scraps/`, `uploads/`, `_ds_bundle.js`. Also dropped the bundle's `reference/` subtree — it
was a snapshot of *this repo's* own `docs/` + `src/`, which would only go stale here.

## Where the realized system is documented

See the foundations + component contracts under [`docs/03-design-system/`](../) (updated to encode the
realized treatments), and `app/globals.css` for the token + `.zs-*` source.
