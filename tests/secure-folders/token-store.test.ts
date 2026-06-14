import { afterEach, describe, expect, it } from "vitest";
import { resolveToken, useSecureFoldersStore } from "@/features/secure-folders";
import { resolveTokenEntry } from "@/features/secure-folders/stores/secureFolders.store";

const NOW = 1_000_000; // arbitrary epoch seconds

afterEach(() => useSecureFoldersStore.getState().clearAll());

describe("secureFolders store", () => {
  it("sets, clears one, and clears all — per namespace", () => {
    const s = useSecureFoldersStore.getState();
    s.setToken("encrypted", "work", "T1", NOW + 100);
    s.setToken("hidden", "vault", "H1", NOW + 100);

    expect(useSecureFoldersStore.getState().tokens.encrypted.work.token).toBe("T1");
    expect(useSecureFoldersStore.getState().tokens.hidden.vault.token).toBe("H1");

    useSecureFoldersStore.getState().clearToken("encrypted", "work");
    expect(useSecureFoldersStore.getState().tokens.encrypted.work).toBeUndefined();
    expect(useSecureFoldersStore.getState().tokens.hidden.vault.token).toBe("H1");

    useSecureFoldersStore.getState().clearAll();
    expect(useSecureFoldersStore.getState().tokens.encrypted).toEqual({});
    expect(useSecureFoldersStore.getState().tokens.hidden).toEqual({});
  });
});

describe("resolveToken (ancestor-aware)", () => {
  const entries = {
    work: { token: "ROOT", expiresAt: NOW + 100 },
    "work/sub": { token: "NEAR", expiresAt: NOW + 100 },
    expired: { token: "OLD", expiresAt: NOW - 1 },
  };

  it("returns the nearest valid ancestor", () => {
    expect(resolveToken(entries, "work/sub/deep", NOW)).toBe("NEAR");
    expect(resolveToken(entries, "work/other", NOW)).toBe("ROOT");
  });

  it("matches an equal path", () => {
    expect(resolveToken(entries, "work", NOW)).toBe("ROOT");
  });

  it("ignores expired entries (→ null forces a re-prompt)", () => {
    expect(resolveToken(entries, "expired/child", NOW)).toBeNull();
  });

  it("returns null for an unrelated path", () => {
    expect(resolveToken(entries, "elsewhere", NOW)).toBeNull();
  });
});

describe("resolveTokenEntry (key + expiry, for the TTL re-lock timer)", () => {
  const entries = {
    work: { token: "ROOT", expiresAt: NOW + 100 },
    "work/sub": { token: "NEAR", expiresAt: NOW + 200 },
    expired: { token: "OLD", expiresAt: NOW - 1 },
  };

  it("returns the nearest ancestor's filing key + token + expiry", () => {
    expect(resolveTokenEntry(entries, "work/sub/deep", NOW)).toEqual({
      key: "work/sub",
      token: "NEAR",
      expiresAt: NOW + 200,
    });
    expect(resolveTokenEntry(entries, "work/other", NOW)).toEqual({
      key: "work",
      token: "ROOT",
      expiresAt: NOW + 100,
    });
  });

  it("omitting `now` keeps an expired entry (the timer reads the clock itself)", () => {
    expect(resolveTokenEntry(entries, "expired/child")).toEqual({
      key: "expired",
      token: "OLD",
      expiresAt: NOW - 1,
    });
    // ...but passing `now` skips it (the header getter's behaviour).
    expect(resolveTokenEntry(entries, "expired/child", NOW)).toBeNull();
  });

  it("returns null for an unrelated path", () => {
    expect(resolveTokenEntry(entries, "elsewhere", NOW)).toBeNull();
  });
});
