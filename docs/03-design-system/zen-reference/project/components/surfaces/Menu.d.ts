/**
 * Anchored dropdown menu (overlay tier). Render inside a `position: relative`
 * wrapper that also contains the trigger button.
 */
export interface MenuItem {
  /** Lucide icon name (kebab-case), or a custom node. */
  icon?: string | JSX.Element;
  label: string;
  description?: string;
  /** Keyboard shortcut chip, e.g. "⌘U". */
  kbd?: string;
  disabled?: boolean;
  /** Destructive item — red text/icon. */
  danger?: boolean;
  onSelect?: () => void;
}
export interface MenuProps {
  open: boolean;
  /** Fired on Escape, outside pointer-down, or after an item is selected. */
  onClose?: () => void;
  items?: (MenuItem | "separator")[];
  /** Horizontal anchoring relative to the wrapper. Default "start". */
  align?: "start" | "end";
  width?: number | string;
}
export declare function Menu(props: MenuProps): JSX.Element | null;
