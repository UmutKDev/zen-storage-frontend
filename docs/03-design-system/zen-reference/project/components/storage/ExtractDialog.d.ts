/**
 * Extract confirmation surface — always shown before extraction is queued.
 * Single mode adds an optional contents preview + per-entry selection;
 * bulk mode (2+ archives) is an ordered confirm list only.
 */
export interface ExtractArchiveItem {
  name: string;
  /** Archive size in bytes (shown in the bulk order list). */
  size?: number;
}
export interface ExtractContentEntry {
  name: string;
  /** "dir" | "file". Default "file". */
  kind?: "dir" | "file";
  /** File size in bytes (files only). */
  size?: number;
}
export interface ExtractDialogProps {
  open: boolean;
  onClose?: () => void;
  /** Current breadcrumb leaf — never a full path. */
  destination?: string;
  /** Archives to extract, in queue order. 1 = single mode, 2+ = bulk mode. */
  items: ExtractArchiveItem[];
  /** SINGLE MODE ONLY: the archive's top-level contents for the optional
   * preview/selection. Omit when unknown — the dialog shows a note instead. */
  contents?: ExtractContentEntry[];
  /** selection = chosen top-level entry names, ONLY when the user previewed
   * and deselected something; undefined = extract everything. */
  onExtract?: (result: { selection?: string[] }) => void;
  /** Open the contents disclosure immediately (static demos/cards). */
  initialPreviewOpen?: boolean;
}
export declare function ExtractDialog(props: ExtractDialogProps): JSX.Element | null;
