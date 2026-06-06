/**
 * Auth.js (v5) configuration surface. Real credential providers + the multi-step
 * login flow are wired in Phase 1; this is the typed seam so other modules can
 * reference shapes today.
 */
export const authConfig = {
  providers: [] as const,
  pages: { signIn: "/auth/sign-in" },
} as const;

export type AuthConfig = typeof authConfig;
