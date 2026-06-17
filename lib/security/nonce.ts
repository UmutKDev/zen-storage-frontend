import "server-only";
import { headers } from "next/headers";

/**
 * Read the per-request CSP nonce (set by the proxy as `x-nonce`) from a Server
 * Component, for any manual inline `<script nonce>`. Server-only; imported by
 * path (not the lib/security barrel) so it never leaks into client/proxy graphs.
 */
export async function getNonce(): Promise<string | null> {
  return (await headers()).get("x-nonce");
}
