"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/client";
import { disconnectSocket, getSocket, type NotificationEnvelope } from "@/lib/socket";
import { invalidateKey, scopedKey } from "@/lib/api";
import { handleAuthFailure } from "@/features/auth";
import { reconcileActiveJobs } from "@/features/jobs";
import { useWorkspaceStore } from "@/stores";
import { notificationKeys } from "../api";
import { routeNotification } from "../lib/notificationFanout";

// Reconnect-storm guard (realtime-socket §4.2): N disconnects within W → pause.
const STORM_WINDOW_MS = 10_000;
const STORM_THRESHOLD = 3;
const STORM_PAUSE_MS = 30_000;
// Polling fallback (§4.5): F connect failures within W → poll until recovery.
const FAIL_WINDOW_MS = 60_000;
const FAIL_THRESHOLD = 5;
const POLL_INTERVAL_MS = 30_000;

function authInvalid(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "data" in err &&
    (err as { data?: { code?: string } }).data?.code === "AUTH_INVALID"
  );
}

/**
 * Owns the `/notifications` socket lifecycle and fans every event out (toasts,
 * inbox, job store, quota). Mounted in `app/providers.tsx` after the session +
 * query contexts; connects only on a valid session. Implements the locked
 * realtime contract (DECISIONS D-P6.2): PascalCase handshake, exp-backoff with
 * a storm-pause, 401→deduped sign-out, invalidation-based reconnect
 * reconciliation (the backend sends no `last_event_id` frame), and a polling
 * fallback that reuses the existing History query (there is no `/Recent`).
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data } = useSession();
  const sessionId = data?.sessionId ?? null;
  const qc = useQueryClient();

  const disconnectsRef = useRef<number[]>([]);
  const failuresRef = useRef<number[]>([]);
  const hasConnectedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stormTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const socket = getSocket(sessionId);

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const reconcile = () => {
      void invalidateKey(qc, notificationKeys.list());
      void invalidateKey(qc, notificationKeys.unreadCount());
      const ownerId = useWorkspaceStore.getState().ownerId;
      if (ownerId) void invalidateKey(qc, scopedKey(ownerId, "storage"));
      void reconcileActiveJobs(qc);
    };

    const startPolling = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(reconcile, POLL_INTERVAL_MS);
    };

    const onNotification = (payload: NotificationEnvelope) =>
      routeNotification(payload, qc);

    const onConnect = () => {
      failuresRef.current = [];
      stopPolling();
      // Every RE-connect reconciles missed events (no last_event_id frame).
      if (hasConnectedRef.current) reconcile();
      hasConnectedRef.current = true;
    };

    const onConnectError = (err: unknown) => {
      if (authInvalid(err)) {
        socket.io.opts.reconnection = false;
        socket.disconnect();
        handleAuthFailure(qc);
        return;
      }
      const now = Date.now();
      failuresRef.current = [
        ...failuresRef.current.filter((t) => now - t < FAIL_WINDOW_MS),
        now,
      ];
      if (failuresRef.current.length >= FAIL_THRESHOLD) startPolling();
    };

    const onDisconnect = (reason: string) => {
      if (reason === "io client disconnect") return; // intentional teardown
      const now = Date.now();
      disconnectsRef.current = [
        ...disconnectsRef.current.filter((t) => now - t < STORM_WINDOW_MS),
        now,
      ];
      if (disconnectsRef.current.length >= STORM_THRESHOLD && !stormTimerRef.current) {
        socket.io.opts.reconnection = false;
        stormTimerRef.current = setTimeout(() => {
          stormTimerRef.current = null;
          disconnectsRef.current = [];
          socket.io.opts.reconnection = true;
          socket.connect();
        }, STORM_PAUSE_MS);
      }
    };

    socket.on("notification", onNotification);
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.connect();

    return () => {
      socket.off("notification", onNotification);
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      stopPolling();
      if (stormTimerRef.current) {
        clearTimeout(stormTimerRef.current);
        stormTimerRef.current = null;
      }
      hasConnectedRef.current = false;
      disconnectsRef.current = [];
      failuresRef.current = [];
      disconnectSocket();
    };
  }, [sessionId, qc]);

  return <>{children}</>;
}
