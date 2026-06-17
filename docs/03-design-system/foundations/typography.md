# Foundations — Typography

> Type scale, families, and usage. Font vars already exist in `globals.css` (`--font-sans`, `--font-mono` via Geist).

## 1. Families
- **Sans** (`--font-sans`, Geist Sans): all UI and body text.
- **Mono** (`--font-mono`, Geist Mono): code editor (CodeMirror), file hashes/keys, technical metadata.

## 2. Scale (proposed, rem)

| Token | Size / line‑height | Use |
|---|---|---|
| `text-xs` | 0.75 / 1rem | badges, captions, table meta |
| `text-sm` | 0.875 / 1.25rem | secondary text, dense tables, form hints |
| `text-base` | 1 / 1.5rem | body, default |
| `text-lg` | 1.125 / 1.75rem | emphasized body, list item titles |
| `text-xl` | 1.25 / 1.75rem | section headers |
| `text-2xl` | 1.5 / 2rem | page titles |
| `text-3xl` | 1.875 / 2.25rem | landing section heads |
| `text-4xl`+ | 2.25rem+ | landing hero (public pages only) |

(Tailwind v4 default scale; this table fixes intended usage so screens are consistent.)

## 3. Weight & tracking
- Weights: `400` body, `500` medium (labels/buttons), `600` semibold (headers), `700` only for hero.
- Tracking: default; slightly tighter (`-0.01em`) on `2xl`+ headings for a premium feel.
- Numerals: tabular (`tabular-nums`) for sizes, usage %, version counts, dates in tables.

## 4. Hierarchy rules
- One `2xl` page title per screen; sections use `xl`; don't stack same‑size headings.
- Body is `base`; dense data surfaces (file tables) may drop to `sm` for density.
- Secondary/meta text uses `muted-foreground` ([color](./color.md)), not smaller weight alone.

## 5. Do / don't
- ✅ Pair size with the right color token and weight (e.g. `text-sm text-muted-foreground`).
- ✅ Use mono for keys/hashes/code only.
- ❌ No more than 3 type sizes visible in one dense component.
- ❌ Don't fake hierarchy with color alone — use the scale.

## 6. i18n note
Copy lengths vary by language (EN now, a 2nd later). Don't truncate aggressively; allow wrap and test long strings. See
[i18n](../../06-cross-cutting/i18n.md).
