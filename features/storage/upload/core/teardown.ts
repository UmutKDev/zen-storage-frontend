import { uploadEngine } from "./engine";

/** Sign-out teardown: abort all in-flight uploads and clear the tray.
 *  (Persisted IndexedDB entries are owner-scoped and survive for the next
 *  session of the same owner.) Kept import-light so `signOutAndCleanup` can
 *  call it without pulling UI modules. */
export function teardownUploads(): void {
  uploadEngine.cancelAll();
}
