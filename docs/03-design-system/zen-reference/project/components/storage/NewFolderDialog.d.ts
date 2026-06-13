/**
 * Create-directory surface behind "New → Directory".
 */
export interface NewFolderDialogProps {
  open: boolean;
  onClose?: () => void;
  /** Current breadcrumb leaf ("Home"/"My storage" at root) — never a full path. */
  destination?: string;
  /** Fires with the validated form. The parent creates the folder and closes. */
  onCreate?: (result: { name: string; encrypted: boolean; password?: string; hidden: boolean }) => void;
  /** Seed values for static demos/cards. */
  initialName?: string;
  initialEncrypted?: boolean;
  initialHidden?: boolean;
}
export declare function NewFolderDialog(props: NewFolderDialogProps): JSX.Element | null;
