import { describe, expect, it } from "vitest";
import { resolveToken } from "@/features/secure-folders";
import { isSameFolderKey, storageKeys } from "@/features/storage/browse/api";

const NOW = 1_000_000;
const entries = {
  work: { token: "TK", expiresAt: NOW - 1 }, // expired
};

describe("resolveToken for the query-key fold (expiry-agnostic)", () => {
  it("ignores expiry when no clock is passed (key reacts to set/clear only)", () => {
    expect(resolveToken(entries, "work/child")).toBe("TK");
  });
  it("still honors expiry when the clock IS passed (the interceptor path)", () => {
    expect(resolveToken(entries, "work/child", NOW)).toBeNull();
  });
});

describe("storageKeys token fold", () => {
  it("appends the secure token only when present", () => {
    const withTok = storageKeys.directories("u1", "work", "TK") as unknown[];
    const without = storageKeys.directories("u1", "work") as unknown[];
    expect(withTok.at(-1)).toBe("TK");
    expect(without).toEqual(["u1", "storage", "directories", "work"]);
    // The token-less key is a prefix of the token-bearing one (so a token-less
    // invalidate still matches the token-bearing query).
    expect(withTok.slice(0, without.length)).toEqual(without);
  });
});

describe("isSameFolderKey (listing placeholderData → no skeleton flash on reveal)", () => {
  const base = storageKeys.directories("u1", "work");

  it("keeps the listing when only the secure token changed (reveal/unlock)", () => {
    // The folder gains a hidden/encrypted token → token-bearing prev key; the
    // token-less base is a prefix → keep the current rows (smooth, no flash).
    const prev = storageKeys.directories("u1", "work", "TK");
    expect(isSameFolderKey(base, prev)).toBe(true);
  });

  it("keeps the listing when the token was cleared (lock/conceal)", () => {
    // prev was token-bearing, now base is token-less for the same folder.
    const prevTokenLess = storageKeys.directories("u1", "work");
    expect(isSameFolderKey(base, prevTokenLess)).toBe(true);
  });

  it("drops to the skeleton on a real folder navigation (path changed)", () => {
    const prev = storageKeys.directories("u1", "other");
    expect(isSameFolderKey(base, prev)).toBe(false);
  });

  it("drops to the skeleton on a workspace switch (owner changed)", () => {
    const prev = storageKeys.directories("u2", "work");
    expect(isSameFolderKey(base, prev)).toBe(false);
  });

  it("does not cross directories↔objects, and treats a first load (no prev) as a skeleton", () => {
    expect(isSameFolderKey(base, storageKeys.objects("u1", "work"))).toBe(false);
    expect(isSameFolderKey(base, undefined)).toBe(false);
  });
});
