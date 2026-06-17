import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./config";
import { accountApiFactory } from "@/service/factories";

/**
 * Full Auth.js instance (node-only). The screens walk the multi-step backend
 * flow via the generated factories to obtain a final `sessionId`, then call
 * `signIn("credentials", { sessionId, expiresAt })`. `authorize` re-validates
 * that session id against `Account/Profile` (explicit `X-Session-Id`) before
 * minting the JWT — so an arbitrary client-supplied id can't forge a session.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      credentials: { sessionId: {}, expiresAt: {} },
      authorize: async (credentials) => {
        const sessionId =
          typeof credentials?.sessionId === "string"
            ? credentials.sessionId
            : null;
        if (!sessionId) return null;

        try {
          const res = await accountApiFactory.profile({
            headers: { "X-Session-Id": sessionId },
          });
          const profile = res.data as unknown as {
            Id: string;
            Email: string;
            FullName?: string;
            Image?: string;
          };
          return {
            id: profile.Id,
            email: profile.Email,
            name: profile.FullName,
            image: profile.Image,
            sessionId,
            expiresAt:
              typeof credentials?.expiresAt === "string"
                ? credentials.expiresAt
                : undefined,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
});
