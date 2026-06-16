# Cross‑cutting — Accessibility (a11y)

> Baseline **WCAG 2.1 AA** target, enforced as a definition‑of‑done item, not a final‑phase afterthought.
> Polished in [Phase 7](../01-roadmap/phases/phase-7-public-polish.md); obeyed from Phase 1.

## 1. Keyboard
- **Everything operable by keyboard**: nav, file list/grid (arrow keys + Enter/Space), menus, dialogs, upload tray,
  preview (←/→ nav, Esc close).
- Logical tab order; no keyboard traps (except intended modal focus traps).
- Visible **focus ring** on all interactive elements (`focus-visible`, `ring` token) — never `outline:none` without a
  replacement. See [elevation-borders §4](../03-design-system/foundations/elevation-borders.md).

## 2. Semantics & ARIA
- Native elements first (`button`, `a`, `input`); ARIA only to fill gaps.
- Dialogs/sheets: `role="dialog"`, labelled, **focus trapped**, focus returns to the trigger on close (shadcn/Radix gives
  most of this — verify).
- Lists/tables: proper roles; selection state exposed (`aria-selected`).
- Icons that act as buttons have accessible names; decorative icons are `aria-hidden`.

## 3. Live regions (async feedback)
- Toasts, upload progress, job progress, save/lock status → `aria-live` (polite for progress, assertive for errors).
- Loading/empty/error state changes announced. Ties to the [state matrix](../02-architecture/state-matrix.md).

## 4. Color & contrast
- Text/background meets **AA** (4.5:1 body, 3:1 large) in **both** themes.
- **Never rely on color alone** for state — pair with icon/text (e.g. locked/encrypted = color + icon + label). See
  [color](../03-design-system/foundations/color.md).

## 5. Motion
- All motion respects `prefers-reduced-motion` — required.
  See [reduced-motion](../03-design-system/motion/reduced-motion.md).

## 6. Forms
- Every field has a programmatic label; errors associated via `aria-describedby`; required/invalid states exposed.
- OTP/passphrase fields keyboard + paste friendly; secure fields don't autofill/persist.

## 7. Targets & responsiveness
- Min interactive target 40×40px (44 on touch). Works at mobile widths.

## 8. Glass & reduced transparency
- Glass surfaces ([glassmorphism](../03-design-system/foundations/glassmorphism.md)) must keep text/icon contrast at
  **AA** against the worst‑case background behind the blur — raise pane opacity rather than darken text.
- **Honor `prefers-reduced-transparency`** (and treat `prefers-contrast: more` the same): drop blur/translucency, fall
  back to a **solid `surface-elevated`**. Required, like reduced‑motion — bake it into the shared `glass-*` utility so no
  surface forgets it.
- Never put small/low‑weight text directly over an unblurred busy region; the ambient backdrop stays low‑contrast so
  glass stays legible. Color‑only state signaling rules (§4) apply on glass too.

## 9. Verification
- Automated check (axe‑style) clean on key routes (login, storage, preview, account).
- Toggle "reduce transparency" / "increase contrast" → glass falls back to solid surfaces with no loss of function.
- Manual keyboard pass on the critical flows; screen‑reader smoke test on auth + storage.
- Part of the [Phase 7 checklist](../01-roadmap/phases/phase-7-public-polish.md#73--accessibility-baseline--see-accessibility) and per‑feature definition‑of‑done.
