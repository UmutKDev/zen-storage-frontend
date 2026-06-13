/**
 * Lucide icon rendered from the Lucide UMD global (CDN).
 * @startingPoint section="Core" subtitle="Lucide icon by kebab-case name" viewport="700x160"
 */
export interface IconProps {
  /** Kebab-case lucide name, e.g. "folder", "eye-off", "trash-2" */
  name: string;
  /** Pixel size (width = height). Default 16. */
  size?: number;
  /** Stroke width. Default 2. */
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
