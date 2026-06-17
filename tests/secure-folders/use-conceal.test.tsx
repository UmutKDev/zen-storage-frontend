import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { useWorkspaceStore } from "@/stores";

const { concealFolder, invalidateScope, toastError, toastSuccess } = vi.hoisted(
  () => ({
    concealFolder: vi.fn(),
    invalidateScope: vi.fn(() => Promise.resolve()),
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
  }),
);

vi.mock("@/features/secure-folders/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/secure-folders/api")>();
  return { ...actual, concealFolder };
});
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, invalidateScope };
});
vi.mock("sonner", () => ({
  toast: { error: toastError, success: toastSuccess },
}));

const { useConceal } = await import(
  "@/features/secure-folders/hooks/useConceal"
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
});
afterEach(() => useWorkspaceStore.getState().reset());

describe("useConceal — A4 atomicity", () => {
  it("2xx → invalidate (folder re-hides) + success toast", async () => {
    concealFolder.mockResolvedValue(undefined);
    const { result } = renderHook(() => useConceal(), { wrapper });
    act(() => result.current.submit("work/secret"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(invalidateScope).toHaveBeenCalled();
  });

  it("NETWORK failure → keep the folder revealed (NO invalidate) + retry toast", async () => {
    concealFolder.mockRejectedValue(
      new ApiError({ code: "NETWORK", messages: ["offline"] }),
    );
    const { result } = renderHook(() => useConceal(), { wrapper });
    act(() => result.current.submit("work/secret"));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(invalidateScope).not.toHaveBeenCalled();
  });

  it("5xx → invalidate (show server truth) + warning toast", async () => {
    concealFolder.mockRejectedValue(
      new ApiError({ code: "SERVER_ERROR", messages: ["boom"], httpStatus: 500 }),
    );
    const { result } = renderHook(() => useConceal(), { wrapper });
    act(() => result.current.submit("work/secret"));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(invalidateScope).toHaveBeenCalled();
  });
});
