/**
 * Brand lettermark tile + optional wordmark.
 * @startingPoint section="Core" subtitle="Brand lettermark" viewport="700x140"
 */
export interface LogoProps {
  /** Show the "Zen Storage" wordmark next to the tile. Default true. */
  wordmark?: boolean;
  /** Tile size in px. Default 32. */
  size?: number;
  className?: string;
}
export declare function Logo(props: LogoProps): JSX.Element;
