/**
 * Floating bulk-selection action bar.
 */
export interface BulkActionBarProps {
  /** Selected count; renders nothing at 0. */
  count: number;
  /** Hides "Select all" when true. */
  allSelected?: boolean;
  /** False when the selection holds no files (download disables, stays focusable). */
  canDownload?: boolean;
  onSelectAll?: () => void;
  onMove?: () => void;
  /** Renders the Archive action (→ ArchiveDialog) only when provided. */
  onArchive?: () => void;
  /** Renders the Extract action (→ ExtractDialog) only when provided — pass it when the selection holds archives. */
  onExtract?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onClear?: () => void;
}
export declare function BulkActionBar(props: BulkActionBarProps): JSX.Element | null;
