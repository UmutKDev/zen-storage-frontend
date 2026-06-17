/**
 * Toggle switch.
 * @startingPoint section="Core" subtitle="On/off toggle" viewport="700x140"
 */
export interface SwitchProps {
  /** Controlled state. Omit for uncontrolled. */
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}
export declare function Switch(props: SwitchProps): JSX.Element;
