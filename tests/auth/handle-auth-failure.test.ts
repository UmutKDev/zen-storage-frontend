import { describe, expect, it, vi } from "vitest";

// Mock the teardown so we only assert the dedupe behavior.
vi.mock("@/features/auth/lib/signOutAndCleanup", () => ({
  signOutAndCleanup: vi.fn().mockResolvedValue(undefined),
}));

import { handleAuthFailure } from "@/features/auth/lib/handleAuthFailure";
import { signOutAndCleanup } from "@/features/auth/lib/signOutAndCleanup";

describe("handleAuthFailure", () => {
  it("dedupes a parallel REST + socket failure into ONE sign-out", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- stub QueryClient
    const qc = {} as any;
    handleAuthFailure(qc); // REST 401
    handleAuthFailure(qc); // socket AUTH_INVALID, same tick
    expect(signOutAndCleanup).toHaveBeenCalledTimes(1);
  });
});
