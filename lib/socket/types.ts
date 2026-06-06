/** Socket handshake + event typings. Real event fan-out lands in Phase 6. */
export interface SocketHandshake {
  sessionId: string | null;
  teamId: string | null;
}

export type ServerToClientEvents = Record<string, (...args: unknown[]) => void>;
export type ClientToServerEvents = Record<string, (...args: unknown[]) => void>;
