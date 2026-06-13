/**
 * Password gate dialog — encrypted folders (opened on click) and hidden
 * items (revealed via the double-Shift ⇧⇧ gesture). Wrong passwords shake
 * the panel and show an inline error; the parent owns the secret.
 * @startingPoint section="Storage" subtitle="Password gate — encrypted folder / hidden items · shake on wrong password" viewport="560x380"
 */
export interface UnlockDialogProps {
  open: boolean;
  onClose?: () => void;
  /** "folder" = unlock an encrypted folder; "hidden" = reveal hidden items. Default "folder". */
  variant?: "folder" | "hidden";
  /** Folder name (folder variant) — shown in the title. */
  name?: string;
  /** Return true to accept the password. */
  verify?: (password: string) => boolean;
  /** Fires after a correct password — close the dialog and proceed here. */
  onUnlock?: () => void;
  /** Muted helper line under the input (e.g. a demo password note). */
  hint?: string;
}
export declare function UnlockDialog(props: UnlockDialogProps): JSX.Element | null;
