"use client";

import { t } from "@/lib/i18n";
import { getShortcuts } from "@/lib/shortcuts";
import { useUiStore } from "@/stores";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";

/** Scope display order; only non-empty scopes render. */
const SCOPE_ORDER = ["global", "storage", "preview"] as const;

/** Render a combo string (the registry's `keys` grammar) as glyphs. */
function formatKeys(keys: string): string {
  return keys
    .split("+")
    .map((token) => {
      if (token === "mod") return "⌘";
      if (token === "shift") return "⇧";
      if (token === "alt") return "⌥";
      return token.length === 1 ? token.toUpperCase() : token;
    })
    .join("");
}

/**
 * The "?" keyboard-shortcuts help overlay. Reads the live `lib/shortcuts`
 * registry so it reflects what's actually bound in the current context (e.g.
 * the storage `/` and ⌘U bindings show only on the storage screen). Reduced
 * motion is honored by the shared Dialog primitive.
 */
export function ShortcutsHelp() {
  const open = useUiStore((s) => s.helpOpen);
  const setOpen = useUiStore((s) => s.setHelpOpen);

  // Snapshot the registry when the overlay opens (it doesn't change while open).
  const shortcuts = open ? getShortcuts() : [];
  const groups = SCOPE_ORDER.map((scope) => ({
    scope,
    items: shortcuts.filter((s) => s.scope === scope),
  })).filter((g) => g.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("shortcuts.helpTitle")}</DialogTitle>
          <DialogDescription>{t("shortcuts.helpDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {groups.map(({ scope, items }) => (
            <section key={scope} className="space-y-1.5">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t(`shortcuts.scopes.${scope}`)}
              </h3>
              <ul className="space-y-1">
                {items.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="text-foreground">{s.description}</span>
                    <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                      {formatKeys(s.keys)}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
