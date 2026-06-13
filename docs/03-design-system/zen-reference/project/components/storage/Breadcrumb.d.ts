/**
 * Folder breadcrumb derived from the path.
 */
export interface BreadcrumbProps {
  /** Folder names from root, e.g. ["Projects", "Q2"]. */
  segments?: string[];
  /** Called with the crumb depth: 0 = root, 1 = first segment… */
  onNavigate?: (depth: number) => void;
  /** Default "My storage". */
  rootLabel?: string;
}
export declare function Breadcrumb(props: BreadcrumbProps): JSX.Element;
