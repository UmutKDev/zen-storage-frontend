/**
 * Archive surface — compress one entry or a multi-selection into a single
 * archive (.zip / .tar / .tar.gz) in the current folder.
 */
export interface ArchiveFormat {
  /** Extension without the leading dot, e.g. "tar.gz". */
  ext: string;
  /** Human label, e.g. "Gzip compressed". */
  label: string;
}
export interface ArchiveDialogProps {
  open: boolean;
  onClose?: () => void;
  /** Current breadcrumb leaf — never a full path. */
  destination?: string;
  /** Names of the entries being archived (1 = single-entry, n = bulk). */
  items?: string[];
  /** name is WITHOUT extension; final filename = `${name}.${format}`. */
  onArchive?: (result: { name: string; format: string }) => void;
  /** Default: zip, tar, tar.gz. */
  formats?: ArchiveFormat[];
  /** Seed name; otherwise derived from the single item / destination. */
  initialName?: string;
  initialFormat?: string;
}
export declare function ArchiveDialog(props: ArchiveDialogProps): JSX.Element | null;
