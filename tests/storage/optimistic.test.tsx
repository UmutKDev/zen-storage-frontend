import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useConflictMutation } from "@/features/storage/operations/hooks/useConflictMutation";
import { usePendingOpsStore } from "@/features/storage/operations";

afterEach(() => {
  usePendingOpsStore.setState({ ops: {}, busyKeys: {} });
});

describe("useConflictMutation optimistic lifecycle", () => {
  it("begins on mutate and cleans up only AFTER onSuccess resolves", async () => {
    const order: string[] = [];
    const cleanup = vi.fn(() => order.push("cleanup"));
    const begin = vi.fn(() => cleanup);
    const run = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn(async () => {
      order.push("success");
    });

    const { result } = renderHook(() =>
      useConflictMutation<{ name: string }>({ run, onSuccess, optimistic: begin }),
    );

    act(() => result.current.mutate({ name: "x" }));
    expect(begin).toHaveBeenCalledWith({ name: "x" });

    await waitFor(() => expect(cleanup).toHaveBeenCalled());
    // Placeholder drops AFTER the success handler (which awaits the refetch) —
    // so the real row is already on screen: no flash.
    expect(order).toEqual(["success", "cleanup"]);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("cleans up on a terminal (non-conflict) error", async () => {
    const cleanup = vi.fn();
    const run = vi.fn().mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() =>
      useConflictMutation<{ name: string }>({ run, optimistic: () => cleanup }),
    );

    act(() => result.current.mutate({ name: "x" }));
    await waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1));
  });
});

describe("pendingOps busy keys", () => {
  it("sets and clears busy keys for in-place move/rename feedback", () => {
    usePendingOpsStore.getState().setBusy(["a", "b"]);
    expect(usePendingOpsStore.getState().busyKeys).toEqual({ a: true, b: true });

    usePendingOpsStore.getState().clearBusy(["a"]);
    expect(usePendingOpsStore.getState().busyKeys).toEqual({ b: true });
  });
});
