/**
 * Text input with optional label + hint/error.
 * @startingPoint section="Core" subtitle="Labeled text input" viewport="700x200"
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional field label rendered above. */
  label?: string;
  /** Muted helper text under the field. */
  hint?: string;
  /** Error message — replaces hint, sets aria-invalid. */
  error?: string;
  style?: React.CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;
