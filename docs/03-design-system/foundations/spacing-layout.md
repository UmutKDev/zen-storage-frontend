# Foundations — Spacing & Layout

> A consistent rhythm. Everything sits on a **4px base** scale; layouts use a small set of container widths and gaps.

## 1. Spacing scale (4px base — Tailwind default)
`0.5=2px · 1=4px · 2=8px · 3=12px · 4=16px · 6=24px · 8=32px · 12=48px · 16=64px`.

Intent:
- **Inside controls:** `2`–`3` (8–12px) padding.
- **Between related items:** `2`–`4`.
- **Between sections:** `8`–`12`.
- **Page gutters:** `4` (mobile) → `6`/`8` (desktop).

## 2. Containers
| Token | Width | Use |
|---|---|---|
| `container-sm` | 640px | auth screens, dialogs |
| `container-md` | 768px | account forms |
| `container-lg` | 1024px | content pages |
| `container-xl` | 1280px | storage browser max width |
| full | 100% | shell, landing sections |

## 3. App shell layout
```
┌────────────────────────────────────────────┐
│ topbar (search · usage · bell · profile)    │  h-14
├──────────┬─────────────────────────────────┤
│ sidebar  │  content (storage / account)     │
│  w-60    │  scrolls; max container-xl        │
│ (drawer  │                                   │
│  on sm)  │                                   │
└──────────┴─────────────────────────────────┘
```
- Sidebar collapses to a drawer below `md`.
- Usage bar is always visible (topbar or sidebar foot).
- Reserve the **workspace‑switch slot** in the sidebar header (inert pre‑Phase 8).

## 4. Storage grid & list
- **Smart grid:** responsive auto‑fill cards, min ~160px, gap `4`; thumbnail + name + meta.
- **List:** dense rows (`sm` text), columns name/size/modified/actions; row height ~44px (touch‑friendly).
- Both **virtualized** for large folders ([state-management](../../02-architecture/state-management.md)).

## 5. Density & touch
- Min interactive target **40×40px** (44px on touch).
- Dense tables may reduce text to `sm` but never the hit target.

## 6. Do / don't
- ✅ Use scale steps (`gap-4`), not arbitrary px.
- ✅ Consistent gutters per breakpoint.
- ❌ No `gap-[13px]`‑style arbitrary values.
- ❌ Don't cram actions below the 40px target.
