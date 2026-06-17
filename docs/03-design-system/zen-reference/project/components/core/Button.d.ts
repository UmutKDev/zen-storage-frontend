/**
 * Primary action button — one orange primary per view; ghosts for row actions.
 * @startingPoint section="Core" subtitle="Button variants & sizes" viewport="700x280"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant. Default "primary". "upload" = premium hero action (engraved icon well via .zs-btn__well, kbd chip via .zs-btn__kbd). */
  variant?: "primary" | "upload" | "secondary" | "outline" | "ghost" | "ghost-destructive" | "destructive" | "link";
  /** Size. "icon*" sizes are square. Default "default" (36px tall). */
  size?: "xs" | "sm" | "default" | "lg" | "icon" | "icon-sm" | "icon-xs";
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
