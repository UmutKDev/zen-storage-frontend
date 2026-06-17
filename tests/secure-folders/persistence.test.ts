import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The persist key (sessionStorage) — kept in sync with the store.
const KEY = "secure-folder-sessions";

const STORE = "@/features/secure-folders/stores/secureFolders.store";

// Each test re-imports the store fresh so its rehydration runs against whatever
// we seeded into sessionStorage for that case.
beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
});
afterEach(() => sessionStorage.clear());

function seed(tokens: unknown) {
  sessionStorage.setItem(KEY, JSON.stringify({ version: 0, state: { tokens } }));
}

describe("secure-folder token persistence (sessionStorage, expiry-pruned)", () => {
  it("rehydrates a live token across a refresh, drops an expired one", async () => {
    const now = Math.floor(Date.now() / 1000);
    seed({
      encrypted: { work: { token: "LIVE", expiresAt: now + 300 } },
      hidden: { vault: { token: "DEAD", expiresAt: now - 5 } },
    });

    const { useSecureFoldersStore } = await import(STORE);
    const { tokens } = useSecureFoldersStore.getState();

    expect(tokens.encrypted.work?.token).toBe("LIVE"); // survived the "refresh"
    expect(tokens.hidden.vault).toBeUndefined(); // expired → pruned on rehydrate
  });

  it("writes a freshly-minted token to sessionStorage (so a refresh can restore it)", async () => {
    const { useSecureFoldersStore } = await import(STORE);
    const now = Math.floor(Date.now() / 1000);

    useSecureFoldersStore.getState().setToken("hidden", "secret", "H", now + 300);

    const raw = sessionStorage.getItem(KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).state.tokens.hidden.secret.token).toBe("H");
  });

  it("clearAll wipes the persisted tokens too (sign-out)", async () => {
    const { useSecureFoldersStore, clearAllSecureFolderTokens } = await import(STORE);
    const now = Math.floor(Date.now() / 1000);

    useSecureFoldersStore.getState().setToken("encrypted", "w", "T", now + 300);
    clearAllSecureFolderTokens();

    const raw = sessionStorage.getItem(KEY);
    expect(JSON.parse(raw as string).state.tokens).toEqual({
      encrypted: {},
      hidden: {},
    });
  });

  it("never stores localStorage (sessionStorage-only policy)", async () => {
    const { useSecureFoldersStore } = await import(STORE);
    const now = Math.floor(Date.now() / 1000);
    useSecureFoldersStore.getState().setToken("hidden", "x", "T", now + 300);
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe("pruneExpired", () => {
  it("keeps tokens with a future expiry and drops at-or-before now", async () => {
    const { pruneExpired } = await import(STORE);
    const out = pruneExpired(
      {
        live: { token: "A", expiresAt: 1001 },
        expired: { token: "B", expiresAt: 999 },
        boundary: { token: "C", expiresAt: 1000 }, // == now → expired
      },
      1000,
    );
    expect(out).toEqual({ live: { token: "A", expiresAt: 1001 } });
  });
});
