/**
 * Justified "smart grid" container for grid view: rows fill the container
 * width at a uniform height while every tile keeps its natural aspect ratio
 * (Yandex-Disk-style media browsing). Fill with FileTile children.
 * @startingPoint section="Storage" subtitle="Justified thumbnail grid" viewport="700x440"
 */
export interface SmartGridProps {
  /** Base row height in px before justification (default 168). */
  rowHeight?: number;
  /** Gap between tiles (default var(--space-2)). */
  gap?: number | string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function SmartGrid(props: SmartGridProps): JSX.Element;
