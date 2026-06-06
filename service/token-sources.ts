/**
 * Inverted-dependency seam. `service/` is a leaf and must never import
 * `@/features/*` or `@/stores/*`. Instead, the interceptors read the three
 * runtime values (and the sign-out behavior) they need through the getters
 * below, and `app/providers.tsx` registers the real sources at app boot.
 *
 * Until a source is registered every getter is a safe no-op, so the data layer
 * works (headers simply absent) even before any feature mounts.
 */

export type SessionTokenGetter = () => string | null;
export type TeamIdGetter = () => string | null;
export type SecureFolderTokenGetter = (
  path: string,
) => { folder?: string; hidden?: string } | null;
export type SignOutHandler = () => void | Promise<void>;

let sessionGetter: SessionTokenGetter = () => null;
let teamGetter: TeamIdGetter = () => null;
let secureFolderGetter: SecureFolderTokenGetter = () => null;
let signOutHandler: SignOutHandler = () => {};

export function registerSessionSource(getter: SessionTokenGetter): void {
  sessionGetter = getter;
}
export function registerTeamSource(getter: TeamIdGetter): void {
  teamGetter = getter;
}
export function registerSecureFolderTokenSource(
  getter: SecureFolderTokenGetter,
): void {
  secureFolderGetter = getter;
}
export function registerSignOut(handler: SignOutHandler): void {
  signOutHandler = handler;
}

export function getSessionToken(): string | null {
  return sessionGetter();
}
export function getTeamId(): string | null {
  return teamGetter();
}
export function getSecureFolderToken(
  path: string,
): { folder?: string; hidden?: string } | null {
  return secureFolderGetter(path);
}
export function getSignOut(): SignOutHandler {
  return signOutHandler;
}
