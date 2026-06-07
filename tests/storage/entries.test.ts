import { describe, expect, it } from "vitest";
import { sortEntries, toEntries } from "@/features/storage/browse/lib/entries";

const dir = (name: string) =>
  ({
    Name: name,
    Prefix: `${name}/`,
    IsEncrypted: false,
    IsLocked: false,
    IsHidden: false,
    IsConcealed: false,
  }) as never;

const file = (name: string, size: number, modified = "2026-01-01") =>
  ({
    Name: name,
    Extension: name.split(".").pop() ?? "",
    MimeType: "application/octet-stream",
    Path: { Host: "", Key: `k/${name}`, Url: "" },
    Size: size,
    LastModified: modified,
    ETag: "e",
  }) as never;

describe("toEntries", () => {
  it("maps dirs then files with stable keys", () => {
    const entries = toEntries([dir("a")], [file("b.txt", 1)]);
    expect(entries.map((e) => e.kind)).toEqual(["dir", "file"]);
    expect(entries[0].key).toBe("a/");
    expect(entries[1].key).toBe("k/b.txt");
  });
});

describe("sortEntries", () => {
  it("always lists folders before files", () => {
    const entries = toEntries(
      [dir("zeta")],
      [file("alpha.txt", 10)],
    );
    const sorted = sortEntries(entries, "name", "asc");
    expect(sorted[0].kind).toBe("dir");
    expect(sorted[1].kind).toBe("file");
  });

  it("sorts files by name ascending and descending", () => {
    const entries = toEntries(
      [],
      [file("c.txt", 1), file("a.txt", 2), file("b.txt", 3)],
    );
    expect(sortEntries(entries, "name", "asc").map((e) => e.name)).toEqual([
      "a.txt",
      "b.txt",
      "c.txt",
    ]);
    expect(sortEntries(entries, "name", "desc").map((e) => e.name)).toEqual([
      "c.txt",
      "b.txt",
      "a.txt",
    ]);
  });

  it("sorts files by size", () => {
    const entries = toEntries(
      [],
      [file("a", 300), file("b", 100), file("c", 200)],
    );
    expect(sortEntries(entries, "size", "asc").map((e) => e.name)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("keeps folders name-sorted regardless of the file sort key", () => {
    const entries = toEntries([dir("zeta"), dir("alpha")], [file("x", 1)]);
    const sorted = sortEntries(entries, "size", "asc");
    expect(sorted.slice(0, 2).map((e) => e.name)).toEqual(["alpha", "zeta"]);
  });
});
