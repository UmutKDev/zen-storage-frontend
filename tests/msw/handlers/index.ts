import type { RequestHandler } from "msw";

/** Default (always-on) handlers. Tests add per-case handlers via `server.use`. */
export const handlers: RequestHandler[] = [];
