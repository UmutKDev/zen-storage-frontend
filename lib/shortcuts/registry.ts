/**
 * Central, scoped keyboard-shortcut registry. The "?" help overlay reads from
 * here. Bindings register at mount and unregister on unmount.
 */
export interface Shortcut {
  id: string;
  /** Key combo, e.g. "mod+k", "shift+shift". */
  keys: string;
  /** Scope label (e.g. "global", "storage") for the help overlay grouping. */
  scope: string;
  description: string;
  run: () => void;
}

const registry = new Map<string, Shortcut>();

export function registerShortcut(shortcut: Shortcut): () => void {
  registry.set(shortcut.id, shortcut);
  return () => {
    registry.delete(shortcut.id);
  };
}

export function getShortcuts(scope?: string): Shortcut[] {
  const all = [...registry.values()];
  return scope ? all.filter((s) => s.scope === scope) : all;
}
