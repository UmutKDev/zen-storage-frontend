/**
 * Signature frosted-glass surface (chrome & overlays only).
 * @startingPoint section="Surfaces" subtitle="Glass chrome / overlay tiers" viewport="700x260"
 */
export interface GlassPanelProps {
  /** "chrome" = bars/sidebar (12px blur) · "overlay" = modals/popovers (16px blur). Default "chrome". */
  tier?: "chrome" | "overlay";
  /** Element tag to render. Default "div". */
  as?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function GlassPanel(props: GlassPanelProps): JSX.Element;
