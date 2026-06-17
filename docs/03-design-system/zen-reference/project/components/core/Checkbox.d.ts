/**
 * Checkbox (16px box, 40px hit target via pseudo-element).
 * @startingPoint section="Core" subtitle="Selection checkbox" viewport="700x140"
 */
export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
