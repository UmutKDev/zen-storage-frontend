import "server-only";

export interface ServerSession {
  sessionId: string;
  userId: string;
}

/**
 * RSC/route-handler session reader. Returns `null` until Phase 1 wires Auth.js;
 * `import 'server-only'` guarantees this never leaks into a client bundle.
 */
export async function getSession(): Promise<ServerSession | null> {
  return null;
}
