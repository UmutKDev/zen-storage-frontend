import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Fake socket (singleton) with a handler registry the test can fire ──────────
vi.mock("@/lib/socket", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers: Record<string, (...args: any[]) => void> = {};
  const socket = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on: (e: string, c: (...a: any[]) => void) => {
      handlers[e] = c;
    },
    off: (e: string) => {
      delete handlers[e];
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
    io: { opts: { reconnection: true } },
    __handlers: handlers,
  };
  return {
    getSocket: () => socket,
    getActiveSocket: () => socket,
    disconnectSocket: vi.fn(),
  };
});

vi.mock("@/lib/auth/client", () => ({
  useSession: () => ({ data: { sessionId: "s1" } }),
}));

vi.mock("@/features/auth", () => ({ handleAuthFailure: vi.fn() }));
vi.mock("@/features/jobs", () => ({ reconcileActiveJobs: vi.fn() }));

import { getSocket } from "@/lib/socket";
import { handleAuthFailure } from "@/features/auth";
import { reconcileActiveJobs } from "@/features/jobs";
import { NotificationProvider } from "@/features/notifications/components/NotificationProvider";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const socket = getSocket("s1") as any;
const fire = (event: string, ...args: unknown[]) => socket.__handlers[event]?.(...args);

function renderProvider() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <NotificationProvider>
        <div />
      </NotificationProvider>
    </QueryClientProvider>,
  );
}

describe("NotificationProvider lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socket.io.opts.reconnection = true;
  });
  afterEach(cleanup);

  it("connects on mount with a valid session", () => {
    renderProvider();
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it("pauses reconnection after a disconnect storm, then re-arms after 30s", () => {
    vi.useFakeTimers();
    try {
      renderProvider();
      fire("disconnect", "transport close");
      fire("disconnect", "transport close");
      fire("disconnect", "transport close");
      expect(socket.io.opts.reconnection).toBe(false);
      vi.advanceTimersByTime(30_000);
      expect(socket.io.opts.reconnection).toBe(true);
      expect(socket.connect).toHaveBeenCalledTimes(2); // mount + re-arm
    } finally {
      vi.useRealTimers();
    }
  });

  it("ignores an intentional client disconnect (no storm pause)", () => {
    renderProvider();
    fire("disconnect", "io client disconnect");
    fire("disconnect", "io client disconnect");
    fire("disconnect", "io client disconnect");
    expect(socket.io.opts.reconnection).toBe(true);
  });

  it("triggers deduped sign-out on an AUTH_INVALID connect_error", () => {
    renderProvider();
    fire("connect_error", { data: { code: "AUTH_INVALID" } });
    expect(handleAuthFailure).toHaveBeenCalledTimes(1);
    expect(socket.io.opts.reconnection).toBe(false);
    expect(socket.disconnect).toHaveBeenCalled();
  });

  it("reconciles only on a RE-connect, not the first connect", () => {
    renderProvider();
    fire("connect"); // first
    expect(reconcileActiveJobs).not.toHaveBeenCalled();
    fire("connect"); // reconnect
    expect(reconcileActiveJobs).toHaveBeenCalledTimes(1);
  });
});
