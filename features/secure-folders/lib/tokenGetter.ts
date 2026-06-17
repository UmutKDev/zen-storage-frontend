import {
  resolveToken,
  useSecureFoldersStore,
} from "../stores/secureFolders.store";

/**
 * The real secure-folder token source registered into the `Instance` seam
 * (`registerSecureFolderTokenSource`) from `app/providers.tsx`. Given the
 * request's target folder path (the interceptor extracts it), return the
 * nearest valid ancestor token for each namespace, or `null` when neither
 * applies. Read straight off the vanilla store — no React, runs inside the
 * request interceptor.
 */
export function secureFolderTokenGetter(
  path: string,
): { folder?: string; hidden?: string } | null {
  const now = Date.now() / 1000;
  const { tokens } = useSecureFoldersStore.getState();
  const folder = resolveToken(tokens.encrypted, path, now);
  const hidden = resolveToken(tokens.hidden, path, now);
  if (!folder && !hidden) return null;
  return {
    ...(folder ? { folder } : {}),
    ...(hidden ? { hidden } : {}),
  };
}
