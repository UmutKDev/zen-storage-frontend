/**
 * Segmented tabs / view toggle.
 */
export interface TabsProps {
  tabs: Array<{ value: string; label?: string; icon?: React.ReactNode }>;
  /** Controlled value. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** "segmented" (default): muted track + pill. "underline": text labels over a hairline, accent bar under the active tab. */
  variant?: "segmented" | "underline";
  "aria-label"?: string;
}
export declare function Tabs(props: TabsProps): JSX.Element;
