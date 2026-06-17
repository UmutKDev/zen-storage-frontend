# Cross‑cutting — Keyboard Shortcuts & Command Palette

> A power‑user layer and a premium signal. ✅ **Frontend‑only** (no backend). Foundation in
> [Phase 0](../01-roadmap/phases/phase-0-foundation.md); command palette in
> [Phase 3](../01-roadmap/phases/phase-3-storage-core.md). Pattern: `CommandSearch`/command palette in
> [patterns](../03-design-system/components/patterns.md).

## 1. The shortcut system (foundation)
- A single registry maps keys → actions, with **scopes** (global vs surface‑specific) so a shortcut only fires where it
  makes sense. One central handler, not scattered `keydown` listeners.
- Every shortcut has an **accessible alternative** (menu/button) — keyboard shortcuts are an accelerator, never the only
  path ([accessibility](./accessibility.md)).
- Shortcuts are **discoverable**: a "?" overlay lists them by scope; menu items show their shortcut hint.
- Respects text inputs/editors (don't hijack keys while typing in CodeMirror or a form).

## 2. Command palette (Cmd/Ctrl‑K)
Built on the shadcn `command` primitive (glass `glass-overlay`), deep‑linkable‑friendly. It unifies:
- **Navigation:** jump to folders, account, security, subscription.
- **Actions:** upload, create folder/file, new, search‑in‑folder/global toggle.
- **Search:** fuzzy over the current folder (+ a "search everywhere" affordance → `Cloud/Search`).
- **Recent/quick** entries when available ([quick-access](../04-features/quick-access.md)).

## 3. Baseline shortcut set (MVP)
| Scope | Keys | Action |
|---|---|---|
| Global | `Cmd/Ctrl‑K` | open command palette |
| Global | `/` | focus search (current folder) |
| Global | `?` | shortcuts help overlay |
| Global | `Shift Shift` | reveal hidden folders ([secure-folders](../04-features/secure-folders.md)) |
| Storage | `↑/↓/←/→` | move focus across items |
| Storage | `Enter` | open (folder navigate / file preview) |
| Storage | `Space` | toggle selection |
| Storage | `Cmd/Ctrl‑A` | select all (in‑folder) |
| Storage | `Delete` | delete selection (with confirm) |
| Preview | `←/→` | prev/next previewable item |
| Preview | `Esc` | close |
| Global | `Cmd/Ctrl‑\` or `[` | toggle sidebar |

(Exact bindings finalized in Phase 3; keep them conventional and non‑conflicting with the browser/OS.)

## 4. Rules
- No conflicts with browser/OS shortcuts; don't override `Cmd/Ctrl‑C/V/Z` etc. in normal contexts.
- Disabled inside text editing except editor‑native ones.
- Behind a **feature flag** so the palette/shortcuts can be staged ([feature-flags](./feature-flags.md)).
- Reduced‑motion aware (palette uses the `modal`/`popover` variants).

## 5. Acceptance
- Palette opens/closes via keyboard; every action reachable; help overlay lists all shortcuts; no hijack while typing;
  all shortcuts have a non‑keyboard alternative.
