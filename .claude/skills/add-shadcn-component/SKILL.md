---
name: add-shadcn-component
description: Add a shadcn/ui primitive to the nextjs-storage v2 frontend via the shadcn MCP and wrap it for the premium look (semantic tokens, motion, reduced-motion, focus). Use when adding/needing a shadcn component (button, dialog, dropdown-menu, command, table, etc.) or building a UI primitive.
---

# Add shadcn Component Skill

Adds a shadcn primitive the **right** way for this project: pulled via the **shadcn MCP** (configured in `.mcp.json`),
then wrapped so the premium look + motion live in one place.

## Read first
- `docs/03-design-system/components/primitives.md` — intake rules + the MVP primitive set
- `docs/03-design-system/foundations/color.md` + `…/elevation-borders.md` — tokens, radius, focus ring
- `docs/03-design-system/motion/variants.md` + `…/reduced-motion.md` — motion + reduced‑motion
- `docs/03-design-system/components/patterns.md` — when a wrapper should become a named pattern

## Steps
1. **Pre-flight:** if `components.json` doesn't exist, this is a Phase‑0 step — run `shadcn init` (style **new‑york**,
   base **neutral**) first.
2. **Pull via the shadcn MCP** — discover and add the primitive. **Do not hand‑paste shadcn source.**
3. **Wrap** it in `components/ui/<name>.tsx`:
   - semantic tokens only (no raw hex / arbitrary colors),
   - radius + elevation from the foundations (border + subtle shadow; surface‑elevated for overlays),
   - motion via `lib/motion` variants with the `useReducedMotion` gate,
   - visible `focus-visible` ring; keep keyboard/ARIA behavior (Radix gives most — verify).
4. **Keep the API surface** — add styling + motion, not new behavior. New behavior → a named **pattern**.

## Post
```
1. bunx tsc --noEmit  &&  bun run lint
2. Review: design-system-reviewer on the wrapper.
3. If the primitive is new to the project, add it to docs/03-design-system/components/primitives.md.
```

## Do / don't
- ✅ Import the **wrapped** version everywhere (`@/components/ui/<name>`), not raw shadcn.
- ✅ Re‑pull via MCP on upgrade, then re‑apply the wrapper.
- ❌ Don't fork/diverge from shadcn source silently.
- ❌ Don't restyle a primitive inline per usage — change the wrapper or add a pattern.
