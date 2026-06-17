/**
 * Storage browser grid card (folder/file).
 * @startingPoint section="Storage" subtitle="File browser grid card" viewport="700x240"
 */
export interface FileCardProps {
  name: string;
  kind?: "dir" | "file";
  size?: number;
  /** Number of items inside (dirs only) — shown in the meta line. */
  childCount?: number;
  /** Encrypted — docks a lock chip on the icon tile (open lock when not locked). */
  encrypted?: boolean;
  /** Hidden — ghosted card with dashed borders + eye-off chip. Reveal behind a password gate (UnlockDialog). */
  hidden?: boolean;
  /** Locked cards render at 70% opacity and can't be selected; onOpen STILL fires so the app can prompt for a password. */
  locked?: boolean;
  selected?: boolean;
  selecting?: boolean;
  dropTarget?: boolean;
  onOpen?: () => void;
  onToggleSelect?: (checked: boolean) => void;
  onAction?: () => void;
  style?: React.CSSProperties;
}
export declare function FileCard(props: FileCardProps): JSX.Element;
