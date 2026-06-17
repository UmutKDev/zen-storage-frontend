import type { NextAuthConfig } from "next-auth";

/**
 * Base Auth.js config — **edge/proxy-safe**: no providers, no node-only imports
 * (the credentials provider + backend factory live in `nextauth.ts`). The proxy
 * builds a lightweight `NextAuth(authConfig).auth` from this just to READ the
 * session JWT; the route handler + server use the full instance.
 *
 * JWT strategy + session-id model: `authorize` (in `nextauth.ts`) puts the
 * backend `sessionId`/`expiresAt`/user onto the token; callbacks expose them.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sessionId = user.sessionId;
        token.expiresAt = user.expiresAt;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      // JWT fields are loosely typed (unknown) in v5; we set them in `jwt` above.
      session.sessionId = token.sessionId as string | undefined;
      session.expiresAt = token.expiresAt as string | undefined;
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
