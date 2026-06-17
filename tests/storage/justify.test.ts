import { describe, expect, it } from "vitest";
import { justifyRows } from "@/features/storage/browse/lib/justify";

const sq = (n: number) => Array.from({ length: n }, () => ({ ratio: 1 }));

describe("justifyRows — smart-grid wrap points", () => {
  it("returns no rows for an empty list", () => {
    expect(justifyRows([], { containerWidth: 1000, rowHeight: 168, gap: 8 })).toEqual([]);
  });

  it("keeps everything in one row until the width unknown (pre-measure)", () => {
    const items = sq(5);
    expect(justifyRows(items, { containerWidth: 0, rowHeight: 168, gap: 8 })).toEqual([items]);
  });

  it("packs square tiles to fill the container width", () => {
    // tile basis = 1 * 100 = 100; gap 10 → 5 per 540px row (5*100 + 4*10 = 540).
    const rows = justifyRows(sq(12), { containerWidth: 540, rowHeight: 100, gap: 10 });
    expect(rows.map((r) => r.length)).toEqual([5, 5, 2]);
  });

  it("wider tiles fit fewer per row", () => {
    // ratio 2 → basis 200; container 640, gap 0 → 3 per row (3*200=600, 4th=800>640).
    const wide = Array.from({ length: 7 }, () => ({ ratio: 2 }));
    const rows = justifyRows(wide, { containerWidth: 640, rowHeight: 100, gap: 0 });
    expect(rows.map((r) => r.length)).toEqual([3, 3, 1]);
  });

  it("a single tile wider than the container still gets its own row (no infinite loop)", () => {
    const rows = justifyRows([{ ratio: 5 }, { ratio: 1 }], {
      containerWidth: 200,
      rowHeight: 100,
      gap: 8,
    });
    // basis 500 > 200 → own row; the next square starts a fresh row.
    expect(rows.map((r) => r.length)).toEqual([1, 1]);
  });

  it("preserves order across rows", () => {
    const items = [{ ratio: 1, id: "a" }, { ratio: 1, id: "b" }, { ratio: 1, id: "c" }];
    const rows = justifyRows(items, { containerWidth: 210, rowHeight: 100, gap: 0 });
    expect(rows.flat().map((i) => i.id)).toEqual(["a", "b", "c"]);
  });
});
