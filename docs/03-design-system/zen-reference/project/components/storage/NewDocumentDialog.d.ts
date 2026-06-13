/**
 * Create-document surface behind "New → Document".
 */
export interface DocumentFormat {
  /** Extension without the dot, e.g. "md". */
  ext: string;
  /** Human label, e.g. "Markdown". */
  label: string;
}
export interface NewDocumentDialogProps {
  open: boolean;
  onClose?: () => void;
  /** Current breadcrumb leaf — never a full path. */
  destination?: string;
  /** name is WITHOUT extension; final filename = `${name}.${format}`. */
  onCreate?: (result: { name: string; format: string }) => void;
  /** Default: txt, md, html, csv, json. */
  formats?: DocumentFormat[];
  /** Seed values for static demos/cards. */
  initialName?: string;
  initialFormat?: string;
}
export declare function NewDocumentDialog(props: NewDocumentDialogProps): JSX.Element | null;
