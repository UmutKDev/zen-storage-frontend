/**
 * Toast notification (success / error / info).
 */
export interface ToastProps {
  variant?: "success" | "error" | "info";
  title: string;
  description?: string;
  /** Renders a dismiss button when provided. */
  onClose?: () => void;
}
export declare function Toast(props: ToastProps): JSX.Element;
