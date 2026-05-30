---
description: Add a shadcn primitive via the shadcn MCP and wrap it for the premium look
argument-hint: <component name e.g. dialog, dropdown-menu>
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(bunx tsc --noEmit), Bash(bun run lint)
---

Add the shadcn component `$ARGUMENTS` **via the shadcn MCP** (already configured in `.mcp.json`), then wrap it.

## Rules (read `docs/03-design-system/components/primitives.md` first)
1. **Use the shadcn MCP** to discover/add the primitive — do **not** hand‑paste component source.
2. Wrap it in `components/ui/` so we control the premium look in one place:
   - semantic tokens only (`docs/03-design-system/foundations/color.md`) — no raw hex,
   - radius/elevation from `foundations/elevation-borders.md`,
   - motion via `lib/motion` variants with reduced‑motion (`docs/03-design-system/motion/`),
   - visible `focus-visible` ring.
3. Keep the shadcn API surface; add styling + motion, not new behavior (new behavior → a named **pattern** in
   `components/components/patterns.md`).

## Pre-flight
- If `$ARGUMENTS` is empty, ask which primitive (cross‑check the MVP set in `primitives.md`).
- If `components.json` doesn't exist yet, this is a Phase‑0 step — run `shadcn init` (new‑york, neutral) first.

## Post
1. `bunx tsc --noEmit` + `bun run lint`.
2. Run **`design-system-reviewer`** on the wrapper.
3. Note the new primitive in `docs/03-design-system/components/primitives.md` if it's not already listed.
