import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { useWorkspaceStore } from "@/stores";

const saveDraft = vi.fn();
const updateDocument = vi.fn();
const discardDraft = vi.fn();

vi.mock("@/features/preview/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/preview/api")>();
  return { ...actual, saveDraft, updateDocument, discardDraft };
});

const { useDocumentEditing } = await import(
  "@/features/preview/hooks/useDocumentEditing"
);

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(0);
  useWorkspaceStore.getState().setOwner("u1");
});
afterEach(() => {
  vi.useRealTimers();
  useWorkspaceStore.getState().reset();
});

describe("useDocumentEditing", () => {
  it("throttles drafts to one per 10s and flushes the latest content", async () => {
    saveDraft.mockResolvedValue({ Key: "k", SavedAt: "t", SizeInBytes: 1 });
    const { result } = renderHook(() => useDocumentEditing("k", "h0"), { wrapper });

    act(() => {
      result.current.queueDraft("a");
      result.current.queueDraft("ab");
    });
    expect(saveDraft).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(saveDraft).toHaveBeenCalledTimes(1);
    expect(saveDraft).toHaveBeenCalledWith("k", "ab");
  });

  it("commit sends the ExpectedContentHash and resolves true", async () => {
    updateDocument.mockResolvedValue({
      ContentHash: "h1",
      LastModified: "t1",
      Content: "x",
      Key: "k",
      IsDraft: false,
      LockStatus: "LOCKED_BY_ME",
    });
    discardDraft.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDocumentEditing("k", "h0"), { wrapper });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.commit("hello");
    });

    expect(ok).toBe(true);
    expect(updateDocument).toHaveBeenCalledWith({
      Key: "k",
      Content: "hello",
      ExpectedContentHash: "h0",
    });
  });

  it("commit 409 → conflict flag + keeps the text as a draft", async () => {
    updateDocument.mockRejectedValue(
      new ApiError({ code: "CONFLICT", messages: ["conflict"], httpStatus: 409 }),
    );
    saveDraft.mockResolvedValue({ Key: "k", SavedAt: "t", SizeInBytes: 1 });
    const { result } = renderHook(() => useDocumentEditing("k", "h0"), { wrapper });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.commit("hello");
    });

    expect(ok).toBe(false);
    expect(result.current.conflict).toBe(true);
    expect(saveDraft).toHaveBeenCalledWith("k", "hello");
  });
});
