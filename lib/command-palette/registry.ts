import type { LucideIcon } from "lucide-react";

/**
 * Cross-feature command registry for the ⌘K palette. Mirrors the
 * `lib/shortcuts` registry idiom (inverted deps): feature surfaces *contribute*
 * commands while mounted; the palette (in `features/shell`) *reads* them. Neither
 * feature imports the other — they meet here. A presence model handles
 * availability: a command is registered exactly while it applies (e.g. the
 * storage browser registers "Delete selected" only while a selection exists).
 */
export type CommandGroup = "navigation" | "actions" | "selection" | "search";

export interface Command {
  id: string;
  group: CommandGroup;
  /** Pre-resolved (i18n) label shown in the palette. */
  label: string;
  /** Extra fuzzy-match terms beyond the label. */
  keywords?: string[];
  icon?: LucideIcon;
  /** Right-aligned hint, e.g. "⌘U". */
  shortcutHint?: string;
  /** Run the command. Required unless `runWithQuery` is set. */
  run?: () => void;
  /** A query command — the palette feeds its current input (e.g. "Search for X").
   *  Shown only while the palette input is non-empty. */
  runWithQuery?: (query: string) => void;
}

const registry = new Map<string, Command>();
const listeners = new Set<() => void>();
// Stable snapshot for useSyncExternalStore — rebuilt only on mutation so the
// reference is referentially stable between changes (no render loop).
let snapshot: Command[] = [];

function emit() {
  snapshot = [...registry.values()];
  for (const listener of listeners) listener();
}

/** Register a command; returns a disposer that removes exactly this instance. */
export function registerCommand(command: Command): () => void {
  registry.set(command.id, command);
  emit();
  return () => {
    if (registry.get(command.id) === command) {
      registry.delete(command.id);
      emit();
    }
  };
}

export function getCommands(): Command[] {
  return snapshot;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
