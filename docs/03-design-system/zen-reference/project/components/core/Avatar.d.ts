/**
 * User avatar with initials fallback.
 * @startingPoint section="Core" subtitle="Avatar w/ initials fallback" viewport="700x140"
 */
export interface AvatarProps {
  src?: string;
  alt?: string;
  /** Fallback initials, e.g. "UK". */
  initials?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}
export declare function Avatar(props: AvatarProps): JSX.Element;
