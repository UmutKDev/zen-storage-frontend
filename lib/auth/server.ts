import "server-only";
import { auth } from "./nextauth";

export interface ServerSession {
  sessionId: string;
  userId: string;
}

/** RSC/route-handler session reader. Returns null when unauthenticated. */
export async function getSession(): Promise<ServerSession | null> {
  const session = await auth();
  if (!session?.sessionId) return null;
  return { sessionId: session.sessionId, userId: session.user?.id ?? "" };
}
