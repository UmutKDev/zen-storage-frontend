import { describe, expect, it, vi, beforeEach } from "vitest";

// Record the teardown step order. All side-effecting deps are mocked.
const order: string[] = [];

vi.mock("@/lib/socket", () => ({
  disconnectSocket: () => {
    order.push("socket");
  },
}));
vi.mock("@/service/factories", () => ({
  authenticationApiFactory: {
    logout: async () => {
      order.push("logout");
      return { data: true };
    },
  },
}));
vi.mock("next-auth/react", () => ({
  signOut: async () => {
    order.push("signOut");
  },
}));
vi.mock("@/stores", () => ({
  useWorkspaceStore: { getState: () => ({ reset: () => order.push("workspace.reset") }) },
  useUiStore: { getState: () => ({ reset: () => order.push("ui.reset") }) },
}));
vi.mock("@/features/jobs", () => ({
  useJobsStore: { getState: () => ({ reset: () => order.push("jobs.reset") }) },
}));

const { signOutAndCleanup } = await import("@/features/auth");

describe("signOutAndCleanup teardown", () => {
  beforeEach(() => {
    order.length = 0;
    Object.defineProperty(window, "location", {
      value: { assign: () => order.push("redirect") },
      writable: true,
      configurable: true,
    });
  });

  it("runs the teardown in the documented order", async () => {
    const queryClient = {
      cancelQueries: async () => {
        order.push("cancelQueries");
      },
      clear: () => {
        order.push("clear");
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal QueryClient stub
    await signOutAndCleanup(queryClient as any);

    expect(order).toEqual([
      "logout",
      "socket",
      "cancelQueries",
      "clear",
      "workspace.reset",
      "ui.reset",
      "jobs.reset",
      "signOut",
      "redirect",
    ]);
  });
});
