/**
 * Non-secret, build-time constants. No environment lookups here — those live in
 * `config/env.ts`. Keep this file free of anything that must vary per deploy.
 */

export const APP_NAME = "Storage";

/** Path prefix every backend route lives under (the axios `Instance` baseURL). */
export const API_PREFIX = "/Api";

/** Default axios timeout (ms) for the shared `Instance`. */
export const REQUEST_TIMEOUT_MS = 30_000;

/** Backend request headers the interceptors inject. */
export const HEADERS = {
  sessionId: "X-Session-Id",
  teamId: "X-Team-Id",
  folderSession: "X-Folder-Session",
  hiddenSession: "X-Hidden-Session",
  idempotencyKey: "Idempotency-Key",
} as const;
