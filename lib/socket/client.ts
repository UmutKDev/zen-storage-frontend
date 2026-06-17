import { io, type Socket } from "socket.io-client";
import { env } from "@/config/env";
import type { ClientToServerEvents, ServerToClientEvents } from "./types";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

/** Origin of the `/notifications` namespace: explicit socket URL, else the API origin. */
function socketBase(): string {
  return (
    env.NEXT_PUBLIC_SOCKET_URL ?? env.NEXT_PUBLIC_API_URL.replace(/\/Api\/?$/, "")
  );
}

/**
 * Singleton socket for the `/notifications` namespace. Non-auto-connecting so the
 * `NotificationProvider` owns the lifecycle (connect on valid session, disconnect
 * on sign-out). Reconnect uses exponential backoff + jitter (realtime-socket §4.2).
 * Handshake auth is **PascalCase `SessionId`** to match the gateway.
 *
 * Returns the existing instance if one is live; call `disconnectSocket()` first to
 * rebuild with a fresh handshake (e.g. on a session/team change).
 */
export function getSocket(sessionId: string): AppSocket {
  if (socket) return socket;
  socket = io(`${socketBase()}/notifications`, {
    auth: { SessionId: sessionId },
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket"],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.5,
  });
  return socket;
}

/** The live socket, or null when none has been created (used by reconciliation). */
export function getActiveSocket(): AppSocket | null {
  return socket;
}

/**
 * Tear down the active socket and kill its reconnect loop. Called by the sign-out
 * teardown and the 401 handler; nulls the singleton so the next `getSocket()`
 * rebuilds with a fresh handshake.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.io.opts.reconnection = false;
    socket.disconnect();
    socket = null;
  }
}
