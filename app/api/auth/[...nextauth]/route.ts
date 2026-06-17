import { handlers } from "@/lib/auth/nextauth";

// The ONE app/api route at MVP (Auth.js). Mounting it (+ re-adding
// SessionProvider) closes the P0 dev loop from the missing /api/auth/session.
export const { GET, POST } = handlers;
