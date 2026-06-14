import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/stores";

const { revealFolder, invalidateScope } = vi.hoisted(() => ({
  revealFolder: vi.fn(),
  invalidateScope: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/features/secure-folders/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/secure-folders/api")>();
  return { ...actual, revealFolder };
});
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, invalidateScope };
});

const { useReveal } = await import("@/features/secure-folders/hooks/useReveal");
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

describe("useReveal", () => {
  it("keys the hidden token by the REQUEST path, not the returned HiddenFolderPath", async () => {
    // The backend validates X-Hidden-Session (sent on the parent listing)
    // against each hidden child; ancestor-resolution only attaches a token to
    // its keyed path + descendants — so the token MUST be keyed at the browse
    // folder ("work"), not the child it revealed ("work/secret").
    revealFolder.mockResolvedValue({
      Path: "work",
      HiddenFolderPath: "work/secret",
      SessionToken: "TKN",
      ExpiresAt: 9_999_999_999,
      TTL: 300,
    });

    const { result } = renderHook(() => useReveal(), { wrapper });
    let ok = false;
    await act(async () => {
      ok = await result.current.submit("work", "hunter2!");
    });

    expect(ok).toBe(true);
    const hidden = useSecureFoldersStore.getState().tokens.hidden;
    expect(hidden.work?.token).toBe("TKN"); // keyed by request path
    expect(hidden["work/secret"]).toBeUndefined(); // NOT the HiddenFolderPath
    expect(invalidateScope).toHaveBeenCalled();
  });
});
