import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { useWorkspaceStore } from "@/stores";

// Hoisted so the (hoisted) vi.mock factories can reference them — the static
// `@/lib/api` import below evaluates that mock eagerly.
const { unlockFolder, invalidateScope } = vi.hoisted(() => ({
  unlockFolder: vi.fn(),
  invalidateScope: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/features/secure-folders/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/secure-folders/api")>();
  return { ...actual, unlockFolder };
});
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, invalidateScope };
});

const { useUnlock } = await import("@/features/secure-folders/hooks/useUnlock");
const { useSecureFoldersStore } = await import(
  "@/features/secure-folders/stores/secureFolders.store"
);

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  useWorkspaceStore.getState().setOwner("u1");
  useSecureFoldersStore.getState().clearAll();
});
afterEach(() => {
  useWorkspaceStore.getState().reset();
  useSecureFoldersStore.getState().clearAll();
});

describe("useUnlock", () => {
  it("stores the token BEFORE invalidating (A3 — else a refetch loops)", async () => {
    unlockFolder.mockResolvedValue({
      Path: "work",
      EncryptedFolderPath: "work",
      SessionToken: "TKN",
      ExpiresAt: 9_999_999_999,
      TTL: 300,
    });
    // Capture whether the token is already in the store when invalidate fires.
    let tokenAtInvalidate: string | undefined;
    invalidateScope.mockImplementation(() => {
      tokenAtInvalidate =
        useSecureFoldersStore.getState().tokens.encrypted.work?.token;
      return Promise.resolve();
    });

    const { result } = renderHook(() => useUnlock(), { wrapper });
    let ok = false;
    await act(async () => {
      ok = await result.current.submit("work", "hunter2!");
    });

    expect(ok).toBe(true);
    expect(useSecureFoldersStore.getState().tokens.encrypted.work.token).toBe("TKN");
    expect(invalidateScope).toHaveBeenCalled();
    expect(tokenAtInvalidate).toBe("TKN"); // setToken ran first
  });

  it("surfaces a wrong passphrase (403) as an inline error, not a token", async () => {
    unlockFolder.mockRejectedValue(
      new ApiError({ code: "FORBIDDEN", messages: ["nope"], httpStatus: 403 }),
    );
    const { result } = renderHook(() => useUnlock(), { wrapper });
    let ok = true;
    await act(async () => {
      ok = await result.current.submit("work", "wrong");
    });

    expect(ok).toBe(false);
    await waitFor(() =>
      expect(result.current.error).toBe("Incorrect password"),
    );
    expect(useSecureFoldersStore.getState().tokens.encrypted.work).toBeUndefined();
    expect(invalidateScope).not.toHaveBeenCalled();
  });
});
