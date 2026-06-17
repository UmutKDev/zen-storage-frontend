/**
 * Pill badge for states & markers (Encrypted, Hidden, Scan pending…).
 * @startingPoint section="Core" subtitle="State & marker pills" viewport="700x160"
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Default "secondary" (the neutral folder-badge look). */
  variant?: "default" | "secondary" | "destructive" | "success" | "warning" | "info" | "outline";
  children?: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
