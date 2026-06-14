import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { ApiError } from "@/lib/api";

const acquireLock = vi.fn();
const extendLock = vi.fn();
const releaseLock = vi.fn();

vi.mock("@/features/preview/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/preview/api")>();
  return { ...actual, acquireLock, extendLock, releaseLock };
});

const { useDocumentLock } = await import(
  "@/features/preview/hooks/useDocumentLock"
);

const lockMine = {
  Key: "k",
  LockStatus: "LOCKED_BY_ME",
  LockedBy: "u1",
  LockedByName: "Me",
  ExpiresAt: 0,
  TTL: 300,
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe("useDocumentLock", () => {
  it("acquires the lock (mine) and releases it on unmount", async () => {
    acquireLock.mockResolvedValue(lockMine);
    releaseLock.mockResolvedValue(undefined);

    const { result, unmount } = renderHook(() => useDocumentLock("k", true));

    await waitFor(() => expect(result.current.lockState).toBe("mine"));
    expect(result.current.canEdit).toBe(true);

    unmount();
    expect(releaseLock).toHaveBeenCalledWith("k");
  });

  it("treats 423 as locked-by-other (read-only)", async () => {
    acquireLock.mockRejectedValue(
      new ApiError({ code: "UNKNOWN", messages: ["locked"], httpStatus: 423 }),
    );

    const { result } = renderHook(() => useDocumentLock("k", true));

    await waitFor(() => expect(result.current.lockState).toBe("other"));
    expect(result.current.canEdit).toBe(false);
  });

  it("does nothing while disabled", () => {
    const { result } = renderHook(() => useDocumentLock("k", false));
    expect(result.current.lockState).toBe("unavailable");
    expect(acquireLock).not.toHaveBeenCalled();
  });
});
