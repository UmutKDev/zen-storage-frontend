"use client";

/**
 * Client auth surface. Re-exports the Auth.js React helpers so feature/client
 * code (and `app/providers.tsx`) consume them through `@/lib/auth/client`
 * rather than reaching into `next-auth/react` directly.
 */
export {
  SessionProvider,
  useSession,
  signIn,
  signOut,
} from "next-auth/react";
