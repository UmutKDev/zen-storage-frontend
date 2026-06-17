/**
 * Pack aspect-ratio-sized tiles into justified rows for the smart grid. The CSS
 * (`.zs-smartgrid` flex-wrap + per-tile `flex-grow`) does the visual
 * justification; this only decides the **wrap points** — which tiles share a row
 * — so the grid can render one `.zs-smartgrid` per row and **virtualize** by row
 * (the >100-entry rule). It mirrors the browser's flex-wrap: a tile's natural
 * width at the target row height is `ratio * rowHeight`; a row fills until adding
 * the next tile's width (+ gap) would overflow the container.
 *
 * Pure + deterministic (no DOM) so it's unit-testable and cheap to memoize.
 */
export function justifyRows<T extends { ratio: number }>(
  items: readonly T[],
  opts: { containerWidth: number; rowHeight: number; gap: number },
): T[][] {
  const { containerWidth, rowHeight, gap } = opts;
  if (items.length === 0) return [];
  // Width unknown yet (pre-measure) → one row; the flex container still wraps
  // visually, we just can't virtualize until a real width arrives.
  if (containerWidth <= 0 || rowHeight <= 0) return [items.slice()];

  const rows: T[][] = [];
  let row: T[] = [];
  let used = 0; // accumulated tile widths + gaps in the current row
  for (const item of items) {
    const width = Math.max(1, item.ratio) * rowHeight;
    const withGap = (row.length ? gap : 0) + width;
    if (row.length > 0 && used + withGap > containerWidth) {
      rows.push(row);
      row = [item];
      used = width;
    } else {
      row.push(item);
      used += withGap;
    }
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

/**
 * The height a justified row settles at once its tiles flex-grow to fill the
 * container width: `(containerWidth - gaps) / Σ ratio`. A full row lands near the
 * target `rowHeight`; we use this to size the **last** row (which is left-aligned
 * and does NOT grow — see the `.zs-smartgrid__spacer`) to match the row above it,
 * so it doesn't sit at the smaller base height. Returns `fallback` when unknown.
 */
export function justifiedRowHeight(
  row: readonly { ratio: number }[],
  opts: { containerWidth: number; gap: number; fallback: number },
): number {
  const { containerWidth, gap, fallback } = opts;
  if (row.length === 0 || containerWidth <= 0) return fallback;
  const sum = row.reduce((acc, t) => acc + Math.max(0.0001, t.ratio), 0);
  const gaps = (row.length - 1) * gap;
  const h = (containerWidth - gaps) / sum;
  return Number.isFinite(h) && h > 0 ? h : fallback;
}
