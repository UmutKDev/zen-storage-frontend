import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import {
  useSecureFolderExpiry,
  useSecureFolderUiStore,
  useSecureFoldersStore,
} from "@/features/secure-folders";

vi.mock("sonner", () => ({ toast: vi.fn() }));

const NOW_S = 1_700_000_000; // arbitrary epoch seconds

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW_S * 1000);
  vi.mocked(toast).mockClear();
  useSecureFoldersStore.getState().clearAll();
  useSecureFolderUiStore.getState().close();
});
afterEach(() => {
  vi.useRealTimers();
  useSecureFoldersStore.getState().clearAll();
  useSecureFolderUiStore.getState().close();
});

describe("useSecureFolderExpiry", () => {
  it("re-locks AND re-prompts when an ENCRYPTED token covering the path expires", () => {
    useSecureFoldersStore.getState().setToken("encrypted", "work", "T1", NOW_S + 100);
    renderHook(() => useSecureFolderExpiry("work/sub"));

    // Before TTL: nothing has changed.
    expect(useSecureFoldersStore.getState().tokens.encrypted.work).toBeDefined();
    expect(useSecureFolderUiStore.getState().action).toBeNull();

    act(() => vi.advanceTimersByTime(100_000));

    // Token dropped (→ listing 403s into the locked state) and the unlock prompt
    // re-opened for the CURRENT path (the same call FolderLocked's button makes).
    expect(useSecureFoldersStore.getState().tokens.encrypted.work).toBeUndefined();
    expect(useSecureFolderUiStore.getState().action).toEqual({
      kind: "unlock",
      path: "work/sub",
      mode: "folder",
    });
    // Encrypted re-lock is announced by the auto-opened dialog — no toast.
    expect(toast).not.toHaveBeenCalled();
  });

  it("re-hides a HIDDEN token with no prompt, but a polite announcement", () => {
    useSecureFoldersStore.getState().setToken("hidden", "vault", "H1", NOW_S + 100);
    renderHook(() => useSecureFolderExpiry("vault"));

    act(() => vi.advanceTimersByTime(100_000));

    expect(useSecureFoldersStore.getState().tokens.hidden.vault).toBeUndefined();
    expect(useSecureFolderUiStore.getState().action).toBeNull();
    // The silent content change is announced (Toaster live region) so it's perceivable.
    expect(toast).toHaveBeenCalledTimes(1);
  });

  it("does nothing for a path no token covers", () => {
    useSecureFoldersStore.getState().setToken("encrypted", "work", "T1", NOW_S + 100);
    renderHook(() => useSecureFolderExpiry("elsewhere"));

    act(() => vi.advanceTimersByTime(1_000_000));

    expect(useSecureFoldersStore.getState().tokens.encrypted.work).toBeDefined();
    expect(useSecureFolderUiStore.getState().action).toBeNull();
  });

  it("reschedules when a re-unlock extends the expiry (no premature re-lock)", () => {
    useSecureFoldersStore.getState().setToken("encrypted", "work", "T1", NOW_S + 100);
    renderHook(() => useSecureFolderExpiry("work"));

    act(() => vi.advanceTimersByTime(50_000)); // t=50s, not yet expired
    // Re-unlock mints a fresh token with a later TTL.
    act(() =>
      useSecureFoldersStore.getState().setToken("encrypted", "work", "T2", NOW_S + 300),
    );

    act(() => vi.advanceTimersByTime(60_000)); // t=110s — past the OLD TTL
    expect(useSecureFoldersStore.getState().tokens.encrypted.work?.token).toBe("T2");

    act(() => vi.advanceTimersByTime(200_000)); // t=310s — past the NEW TTL
    expect(useSecureFoldersStore.getState().tokens.encrypted.work).toBeUndefined();
  });

  it("cancels the timer on unmount (no re-lock after leaving the folder)", () => {
    useSecureFoldersStore.getState().setToken("encrypted", "work", "T1", NOW_S + 100);
    const { unmount } = renderHook(() => useSecureFolderExpiry("work"));

    unmount();
    act(() => vi.advanceTimersByTime(1_000_000));

    expect(useSecureFoldersStore.getState().tokens.encrypted.work).toBeDefined();
    expect(useSecureFolderUiStore.getState().action).toBeNull();
  });

  it("re-locks immediately when the covering token is already expired at mount", () => {
    useSecureFoldersStore.getState().setToken("encrypted", "work", "T1", NOW_S - 1);
    renderHook(() => useSecureFolderExpiry("work"));

    act(() => vi.advanceTimersByTime(0));

    expect(useSecureFoldersStore.getState().tokens.encrypted.work).toBeUndefined();
    expect(useSecureFolderUiStore.getState().action).toEqual({
      kind: "unlock",
      path: "work",
      mode: "folder",
    });
  });
});
