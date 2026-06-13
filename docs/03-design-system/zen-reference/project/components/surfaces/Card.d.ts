/**
 * Solid content card (settings panels, auth forms, subscription).
 * @startingPoint section="Surfaces" subtitle="Solid content card" viewport="700x260"
 */
export interface CardProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
