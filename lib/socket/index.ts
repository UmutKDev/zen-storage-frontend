export {
  getSocket,
  getActiveSocket,
  disconnectSocket,
  type AppSocket,
} from "./client";
export type {
  SocketHandshake,
  NotificationEnvelope,
  ArchiveJobEventData,
  DuplicateScanEventData,
  QuotaEventData,
  ServerToClientEvents,
  ClientToServerEvents,
} from "./types";
