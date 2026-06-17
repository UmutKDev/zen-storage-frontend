import { describe, expect, it } from "vitest";
import {
  applyOwnedUnlocks,
  matchEntries,
  sortEntries,
  toEntries,
} from "@/features/storage/browse/lib/entries";
import { resolveToken } from "@/features/secure-folders";
import { folderPathOf } from "@/features/storage/browse/lib/href";

const dir = (name: string) =>
  ({
    Name: name,
    Prefix: `${name}/`,
    IsEncrypted: false,
    IsLocked: false,
    IsHidden: false,
    IsConcealed: false,
  }) as never;

const lockedDir = (name: string) =>
  ({
    Name: name,
    Prefix: `${name}/`,
    IsEncrypted: true,
    IsLocked: true,
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

describe("applyOwnedUnlocks", () => {
  it("clears IsLocked on an encrypted dir the client holds a session for", () => {
    const [out] = applyOwnedUnlocks([lockedDir("secret")], () => true);
    expect(out.IsLocked).toBe(false);
    expect(out.IsEncrypted).toBe(true); // still encrypted — only the lock clears
  });

  it("leaves a locked dir locked when there's no session", () => {
    const [out] = applyOwnedUnlocks([lockedDir("secret")], () => false);
    expect(out.IsLocked).toBe(true);
  });

  it("never touches a non-encrypted dir", () => {
    const input = [dir("plain")];
    expect(applyOwnedUnlocks(input, () => true)[0].IsLocked).toBe(false);
  });

  it("resolves the session ancestor-aware for a child listed from its parent", () => {
    // Unlock keyed the token at the child's own path "work/secret"; viewing the
    // parent "work" lists the child as locked. The override must still find the
    // token (via folderPathOf + resolveToken) and unlock the row.
    const encTokens = {
      "work/secret": { token: "T", expiresAt: 9_999_999_999 },
    };
    const dirs = applyOwnedUnlocks(
      [lockedDir("secret"), lockedDir("other")],
      (d) => resolveToken(encTokens, folderPathOf("work", d.Name)) !== null,
    );
    expect(dirs[0].IsLocked).toBe(false); // work/secret → has token → unlocked
    expect(dirs[1].IsLocked).toBe(true); // work/other → no token → stays locked
  });
});

describe("matchEntries", () => {
  const entries = toEntries(
    [dir("Reports"), dir("Photos")],
    [file("report.txt", 1), file("notes.md", 2), file("README", 3)],
  );

  it("matches folders and files by case-insensitive name substring", () => {
    expect(matchEntries(entries, "re").map((e) => e.name)).toEqual([
      "Reports",
      "report.txt",
      "README",
    ]);
  });

  it("is case-insensitive", () => {
    expect(matchEntries(entries, "REPORT").map((e) => e.name)).toEqual([
      "Reports",
      "report.txt",
    ]);
  });

  it("preserves the incoming order (filters an already-arranged list)", () => {
    const out = matchEntries(entries, "o"); // Reports, Photos, report.txt, notes.md
    expect(out.map((e) => e.name)).toEqual([
      "Reports",
      "Photos",
      "report.txt",
      "notes.md",
    ]);
  });

  it("returns every entry for an empty/whitespace query", () => {
    expect(matchEntries(entries, "   ")).toHaveLength(entries.length);
    expect(matchEntries(entries, "")).toHaveLength(entries.length);
  });

  it("returns an empty list when nothing matches", () => {
    expect(matchEntries(entries, "zzz")).toEqual([]);
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
