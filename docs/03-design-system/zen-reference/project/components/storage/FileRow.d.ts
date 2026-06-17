/**
 * Storage browser list row (folder/file).
 * @startingPoint section="Storage" subtitle="File browser list row" viewport="700x220"
 */
export interface FileRowProps {
  name: string;
  /** "dir" | "file". Default "file". */
  kind?: "dir" | "file";
  /** File size in bytes (files only). */
  size?: number;
  /** Last-modified date (files only). */
  modified?: string | Date;
  /** Number of items inside (dirs only) — shown in the kind line. */
  childCount?: number;
  /** Encrypted — docks a lock chip on the icon tile (open lock when not locked). */
  encrypted?: boolean;
  /** Hidden — ghosted row with dashed icon tile + eye-off chip. Reveal behind a password gate (UnlockDialog). */
  hidden?: boolean;
  /** Locked rows render at 70% opacity and can't be selected; onOpen STILL fires so the app can prompt for a password. */
  locked?: boolean;
  selected?: boolean;
  /** True while ANY selection exists — keeps checkboxes visible. */
  selecting?: boolean;
  /** Drag-move drop highlight (2px ring). */
  dropTarget?: boolean;
  /** Inline operation readout (extract queue): swaps the kind line for a label + thin brand progress rail. */
  task?: RowTask;
  onOpen?: () => void;
  onToggleSelect?: (checked: boolean) => void;
  /** Shows the trailing ⋮ actions button. */
  onAction?: () => void;
  /** Shows a download button on hover (files only). */
  onDownload?: () => void;
}
export declare function FileRow(props: FileRowProps): JSX.Element;
export interface RowTask {
  /** e.g. "Extracting…" or "Queued — extracts next". */
  label: string;
  /** 0–100 → determinate rail + percent. Omit for the queued (waiting) state. */
  progress?: number;
}
