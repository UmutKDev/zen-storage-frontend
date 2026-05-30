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
