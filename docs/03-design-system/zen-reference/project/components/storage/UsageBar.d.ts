/**
 * Storage quota bar with warning/danger thresholds.
 * @startingPoint section="Storage" subtitle="Quota bar w/ thresholds" viewport="700x180"
 */
export interface UsageBarProps {
  /** Used bytes. */
  used: number;
  /** Quota bytes. */
  max: number;
  /** Default "Storage". */
  label?: string;
}
export declare function UsageBar(props: UsageBarProps): JSX.Element;
