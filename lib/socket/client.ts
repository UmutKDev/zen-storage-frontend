import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketHandshake,
} from "./types";

/**
 * Socket.io client factory. Returns a non-auto-connecting socket so the
 * consumer (Phase 6 notifications/jobs) controls the lifecycle.
 */
export function createSocket(
  url: string,
  handshake: SocketHandshake,
): Socket<ServerToClientEvents, ClientToServerEvents> {
  const socket = io(url, {
    autoConnect: false,
    transports: ["websocket"],
    auth: { ...handshake },
  });
  activeSocket = socket;
  return socket;
}

let activeSocket: Socket | null = null;

/** Tear down the active socket (sign-out teardown). No-op until P6 connects one. */
export function disconnectSocket(): void {
  activeSocket?.disconnect();
  activeSocket = null;
}
