// Isomorphic-safe surface only. The server-only (`server.ts`, `proxy.ts`) and
// client-only (`client.ts`) modules are imported directly by path so this
// barrel never mixes runtimes.
export { authConfig } from "./config";
export { isAuthenticated } from "./guards";
