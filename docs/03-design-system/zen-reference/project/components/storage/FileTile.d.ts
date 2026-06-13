/**
 * Smart-grid tile (photo/video thumbnail at natural aspect ratio, or square
 * icon tile for folders and other files). Use inside SmartGrid.
 * @startingPoint section="Storage" subtitle="Smart-grid media tile" viewport="700x220"
 */
export interface FileTileProps {
  name: string;
  kind?: "dir" | "file";
  /** Thumbnail URL — switches the tile to full-bleed media rendering. */
  thumb?: string;
  /** Aspect ratio (width / height) of the thumbnail. Default 4/3; non-media tiles are always 1. */
  ratio?: number;
  size?: number;
  /** Number of items inside (dirs only) — shown in the meta line. */
  childCount?: number;
  /** Formatted duration ("2:08") — shown on video tiles. */
  duration?: string;
  /** Encrypted — docks a lock chip on the icon tile (open lock when not locked). */
  encrypted?: boolean;
  /** Hidden — ghosted tile with dashed borders + eye-off chip. Reveal behind a password gate (UnlockDialog). */
  hidden?: boolean;
  /** Locked tiles render at 70% opacity and can't be selected; onOpen STILL fires so the app can prompt for a password. */
  locked?: boolean;
  selected?: boolean;
  selecting?: boolean;
  onOpen?: () => void;
  onToggleSelect?: (checked: boolean) => void;
  onAction?: () => void;
  style?: React.CSSProperties;
}
export declare function FileTile(props: FileTileProps): JSX.Element;
