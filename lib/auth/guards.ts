/** Pure auth predicates reusable on server and client. */
export function isAuthenticated(session: unknown): boolean {
  return session != null;
}
