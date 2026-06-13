# Components — Primitives (shadcn via MCP)

> The base UI layer. **Pull via the shadcn MCP, then wrap & theme** in `components/ui/*`. Don't hand‑copy source; don't
> fork gratuitously. Conventions: [CONVENTIONS §6](../../00-overview/CONVENTIONS.md#6-styling--motion).

## 1. Setup
- `shadcn init` (style **new‑york**, base color **neutral**) → `components.json` (Phase 0).
- Add primitives through the **shadcn MCP** (discovers components/blocks/registries).
- Each pulled primitive is wrapped in `components/ui/*` so we control the premium look + motion in one place.

## 2. Primitives to pull (MVP set)
| Primitive | Used by |
|---|---|
| `button`, `input`, `textarea`, `label`, `form` | forms everywhere (rhf + zod) |
| `dialog`, `alert-dialog`, `sheet`, `drawer` | modals, confirms, mobile sidebar, preview |
| `dropdown-menu`, `context-menu`, `popover`, `tooltip` | item menus, overflow actions |
| `command` | search / command palette |
| `tabs`, `accordion` | account/security sections |
| `badge`, `avatar`, `skeleton`, `separator`, `scroll-area` | lists, profile, loading |
| `progress`, `sonner` (toast) | upload/jobs, feedback |
| `select`, `checkbox`, `radio-group`, `switch` | filters, settings, 2FA toggles |
| `table` | file list view, sessions, members (Phase 8) |

## 3. Wrapping rules
- Wrappers apply **semantic tokens** ([color](../foundations/color.md)), **radius/elevation**
  ([elevation-borders](../foundations/elevation-borders.md)), and **motion variants**
  ([variants](../motion/variants.md)).
- Keep the shadcn API surface; add premium styling + motion, not new behavior, unless a [pattern](./patterns.md) needs it.
- All wrappers are keyboard‑accessible and focus‑visible by default (shadcn/Radix gives most of this; verify).

## 4. Do / don't
- ✅ `import { Button } from '@/components/ui/button'` (the wrapped version).
- ✅ Re‑pull/update via MCP when upgrading; re‑apply the wrapper.
- ❌ Don't paste raw shadcn source and diverge silently.
- ❌ Don't restyle a primitive inline per usage — change the wrapper or add a [pattern](./patterns.md).

## 5. Realized "Zen" treatment (the premium look)

The wrappers now carry the refined treatments from the
[Zen design bundle](../zen-reference/ABOUT.md). The machinery (multi‑stop gradients with
`color-mix(#fff/#000)`, multi‑layer inset rims, sheen/shake keyframes, the engraved upload well, tinted
tiles) lives as a disciplined `.zs-*` component‑CSS layer in `app/globals.css` (semantic tokens only, every
keyframe reduced‑motion‑neutralized, micro‑glass solid fallback under reduced‑transparency). The wrappers
reference those classes; feature code stays clean of raw values.

| Primitive | Realized treatment | New API |
|---|---|---|
| `Button` | gradient + inset‑rim `default`/`destructive`; micro‑glass `outline`/`secondary` (the third glass tier) | **`upload` variant** — the hero action: machined gradient, engraved icon well (`.zs-btn-upload__well`), ⌘U chip (`.zs-btn-upload__kbd`), hover sheen + lift. ONE per view. |
| `Badge` | gradient `default`/`destructive`, highlight‑inset `secondary`/`outline` | **`info`** tint variant (joins `success`/`warning`) |
| `Input` | inset + `e1` resting shadow (composes with the focus ring) | — |
| `Switch` / `Checkbox` | gradient‑when‑checked + rim (keep the ≥40px hit‑slop in callers, not the primitive) | — |
| `Avatar` | glass rim (`.zs-avatar-rim`) | — |
| `Card` | `surface-elevated` + inset highlight + `e1`, `radius-lg` (solid, never glass) | — |
| `Tabs` | segmented default unchanged | **`underline` variant** on `TabsList` (via context) — accent bar under the active tab |
| `Progress` | brand indicator + muted track | **`tone` prop** (`brand`/`warning`/`danger`) for usage near/exceeded |
| `DropdownMenu` | content already `glass-overlay` | **`DropdownMenuRichItem`** — machined icon‑tile + label/description + kbd chip rows |
| `Logo` (new) | gradient "S" lettermark tile + optional wordmark | `components/ui/logo.tsx`, `wordmark?` |

Rule unchanged: **one orange filled action per view** (`Button` `default`/`upload`). Secondary CTAs use
`outline`/`secondary`/`ghost`. Tinted type tiles + status chips are [patterns](./patterns.md), not primitives.
