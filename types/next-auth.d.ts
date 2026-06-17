import type { DefaultSession } from "next-auth";

/**
 * Session/JWT shape for the session-id model (auth-integration §1). The client
 * never sees a refresh token; we carry the backend `sessionId` + `expiresAt`.
 */
declare module "next-auth" {
  interface Session {
    sessionId?: string;
    expiresAt?: string;
    user: DefaultSession["user"] & { id?: string };
  }
  interface User {
    sessionId?: string;
    expiresAt?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sessionId?: string;
    expiresAt?: string;
    id?: string;
  }
}

export {};
