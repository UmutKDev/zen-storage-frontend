import type { DefaultSession } from "next-auth";

/**
 * Session/JWT shape stubs. The real shape (sessionId from the backend session
 * flow, role, etc.) is filled in Phase 1.
 */
declare module "next-auth" {
  interface Session {
    sessionId?: string;
    user: DefaultSession["user"] & { id?: string };
  }
}

export {};
