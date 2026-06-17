import { describe, expect, it } from "vitest";
import {
  defaultSelectedKeys,
  pruneGroups,
  selectedBytes,
  selectedCount,
} from "@/features/storage/duplicates/lib/resolve";
import type { CloudDuplicateGroupModel } from "@/service/models";

// Files are largest-first (the backend's order) so slice(1) = "all but the kept one".
function group(
  id: string,
  files: ReadonlyArray<[key: string, size: number]>,
): CloudDuplicateGroupModel {
  return {
    GroupId: id,
    MatchType: "exact",
    Similarity: 100,
    Files: files.map(([Key, Size]) => ({ Key, Name: Key, Size })),
    PotentialSavingsBytes: files.slice(1).reduce((s, [, size]) => s + size, 0),
  } as CloudDuplicateGroupModel;
}

describe("duplicate-scan resolve helpers", () => {
  const groups = [
    group("g1", [["a", 100], ["b", 100], ["c", 100]]),
    group("g2", [["d", 50], ["e", 50]]),
  ];

  it("defaults to selecting every file except the first (kept) in each group", () => {
    const sel = defaultSelectedKeys(groups);
    expect([...sel].sort()).toEqual(["b", "c", "e"]);
    expect(sel.has("a")).toBe(false);
    expect(sel.has("d")).toBe(false);
  });

  it("sums selected bytes and counts", () => {
    const sel = new Set(["b", "c", "e"]);
    expect(selectedBytes(groups, sel)).toBe(250);
    expect(selectedCount(groups, sel)).toBe(3);
  });

  it("prunes deleted files, drops singleton groups, and recomputes savings", () => {
    // Delete the default selection: g1 -> [a] (singleton, dropped); g2 -> [d] (dropped).
    const pruned = pruneGroups(groups, new Set(["b", "c", "e"]));
    expect(pruned).toHaveLength(0);
  });

  it("keeps a group that still has >=2 files and recomputes its savings", () => {
    // Delete only "c" from g1 -> [a,b] survives; savings = size of all but the first.
    const pruned = pruneGroups(groups, new Set(["c"]));
    const g1 = pruned.find((g) => g.GroupId === "g1");
    expect(g1).toBeDefined();
    expect(g1!.Files.map((f) => f.Key)).toEqual(["a", "b"]);
    expect(g1!.PotentialSavingsBytes).toBe(100); // just "b"
  });
});
