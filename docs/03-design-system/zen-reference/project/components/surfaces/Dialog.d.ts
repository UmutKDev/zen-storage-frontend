/**
 * Modal dialog (glass-overlay tier, Esc/backdrop closes).
 */
export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  /** Action row, right-aligned. */
  footer?: React.ReactNode;
  /** Default 480. */
  maxWidth?: number;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
