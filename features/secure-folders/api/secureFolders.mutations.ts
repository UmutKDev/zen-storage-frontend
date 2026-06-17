import { cloudDirectoryApiFactory } from "@/service/factories";
import type {
  DirectoryRevealResponseModel,
  DirectoryUnlockResponseModel,
} from "@/service/models";

// The passphrase rides the dedicated `X-Folder-Passphrase` header (factory param)
// and is NEVER stored. Passphrase-verifying calls suppress the central toast so
// the dialog renders the inline "wrong passphrase" error (a 403 passthrough).
const SUPPRESS = { suppressErrorToast: true } as const;

/**
 * Mint an encrypted-folder session token (`Directory/Unlock`). `res.data` is the
 * bare `DirectoryUnlockResponseModel` (post-envelope) with `SessionToken` +
 * `ExpiresAt` (epoch **seconds**) + the ancestor `EncryptedFolderPath`. A wrong
 * passphrase throws `FORBIDDEN` (suppressed → the dialog owns it).
 */
export async function unlockFolder(
  path: string,
  passphrase: string,
): Promise<DirectoryUnlockResponseModel> {
  const res = await cloudDirectoryApiFactory.directoryUnlock(
    { xFolderPassphrase: passphrase, directoryUnlockRequestModel: { Path: path } },
    SUPPRESS,
  );
  return res.data as unknown as DirectoryUnlockResponseModel;
}

/** Invalidate the encrypted-folder session server-side (`Directory/Lock`; no passphrase). */
export async function lockFolder(path: string): Promise<void> {
  await cloudDirectoryApiFactory.directoryLock({
    directoryLockRequestModel: { Path: path },
  });
}

/** Convert a plain folder to encrypted (`Directory/Encrypt`; the passphrase sets the cipher). */
export async function encryptFolder(path: string, passphrase: string): Promise<void> {
  await cloudDirectoryApiFactory.directoryConvertToEncrypted(
    {
      xFolderPassphrase: passphrase,
      directoryConvertToEncryptedRequestModel: { Path: path },
    },
    SUPPRESS,
  );
}

/** Remove encryption from a folder (`Directory/Decrypt`; passphrase required). */
export async function decryptFolder(path: string, passphrase: string): Promise<void> {
  await cloudDirectoryApiFactory.directoryDecrypt(
    { xFolderPassphrase: passphrase, directoryDecryptRequestModel: { Path: path } },
    SUPPRESS,
  );
}

/* ── Hidden folders ───────────────────────────────────────────────────────── */

/**
 * Mint a hidden-folder session (`Directory/Reveal`). From a container `Path` the
 * backend reveals matching hidden descendants and returns one `SessionToken`
 * (+ `ExpiresAt` epoch **seconds**, `HiddenFolderPath`). `res.data` is the bare
 * model. Wrong passphrase → `FORBIDDEN` (suppressed → the dialog owns it).
 */
export async function revealFolder(
  path: string,
  passphrase: string,
): Promise<DirectoryRevealResponseModel> {
  const res = await cloudDirectoryApiFactory.directoryReveal(
    {
      xFolderPassphrase: passphrase,
      // The app uses "" for the root folder; the backend wants "/" — reveal is
      // the only secure op that can target root (you can't hide/encrypt root).
      directoryRevealRequestModel: { Path: path === "" ? "/" : path },
    },
    SUPPRESS,
  );
  return res.data as unknown as DirectoryRevealResponseModel;
}

/** Mark a folder hidden (`Directory/Hide`; the passphrase is set-on-hide). */
export async function hideFolder(path: string, passphrase: string): Promise<void> {
  await cloudDirectoryApiFactory.directoryHide(
    { xFolderPassphrase: passphrase, directoryHideRequestModel: { Path: path } },
    SUPPRESS,
  );
}

/** Remove the hidden mark from a folder (`Directory/Unhide`; passphrase must match). */
export async function unhideFolder(path: string, passphrase: string): Promise<void> {
  await cloudDirectoryApiFactory.directoryUnhide(
    { xFolderPassphrase: passphrase, directoryUnhideRequestModel: { Path: path } },
    SUPPRESS,
  );
}

/** Re-conceal a revealed hidden folder (`Directory/Conceal`; drops the server
 *  session, no passphrase). `useConceal` owns the A4 success/failure toasts. */
export async function concealFolder(path: string): Promise<void> {
  await cloudDirectoryApiFactory.directoryConceal(
    { directoryConcealRequestModel: { Path: path } },
    SUPPRESS,
  );
}
