"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  HardDrive,
  Search,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { useFlag } from "@/lib/flags";
import { useCommands, type Command, type CommandGroup } from "@/lib/command-palette";
import { useUiStore } from "@/stores";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup as CommandGroupUi,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui";

interface StaticItem {
  id: string;
  label: string;
  icon: LucideIcon;
  keywords?: string[];
  run: () => void;
}

const GROUP_ORDER: CommandGroup[] = ["actions", "selection", "search"];

/** Case-insensitive match over a label + keywords (cmdk's own filtering is off
 *  so query commands can stay visible while typing). */
function matches(query: string, label: string, keywords?: string[]): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    label.toLowerCase().includes(q) ||
    (keywords ?? []).some((k) => k.toLowerCase().includes(q))
  );
}

/**
 * The global ⌘K command palette (glass `CommandDialog`). Navigation items are
 * shell-owned and static; feature commands arrive through the
 * `lib/command-palette` registry (the storage browser contributes upload / new /
 * delete-selected / move-selected / search). Query commands ("Search
 * everywhere") appear while the input is non-empty and receive the typed text.
 */
export function CommandPalette() {
  const enabled = useFlag("commandPalette");
  const open = useUiStore((s) => s.commandPaletteOpen);
  const openPalette = useUiStore((s) => s.openCommandPalette);
  const closePalette = useUiStore((s) => s.closeCommandPalette);
  const router = useRouter();
  const commands = useCommands();
  const [query, setQuery] = useState("");

  if (!enabled) return null;

  const onOpenChange = (next: boolean) => {
    if (next) openPalette();
    else {
      closePalette();
      setQuery("");
    }
  };

  const exec = (run: () => void) => {
    closePalette();
    setQuery("");
    run();
  };

  const navItems: StaticItem[] = [
    {
      id: "nav:storage",
      label: t("command.nav.storage"),
      icon: HardDrive,
      keywords: ["files", "drive", "folders"],
      run: () => router.push("/storage"),
    },
    {
      id: "nav:account",
      label: t("command.nav.account"),
      icon: User,
      keywords: ["profile"],
      run: () => router.push("/account/profile"),
    },
    {
      id: "nav:security",
      label: t("command.nav.security"),
      icon: ShieldCheck,
      keywords: ["password", "2fa", "passkey", "sessions"],
      run: () => router.push("/account/security"),
    },
    {
      id: "nav:subscription",
      label: t("command.nav.subscription"),
      icon: CreditCard,
      keywords: ["plan", "billing"],
      run: () => router.push("/account/subscription"),
    },
  ];

  const visibleNav = navItems.filter((i) => matches(query, i.label, i.keywords));
  const queryCommands = commands.filter((c) => c.runWithQuery);
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: commands.filter(
      (c) =>
        c.group === group &&
        !c.runWithQuery &&
        matches(query, c.label, c.keywords),
    ),
  })).filter((g) => g.items.length > 0);

  const showQueryCommands = query.trim().length > 0 && queryCommands.length > 0;
  const hasAnything =
    visibleNav.length > 0 || grouped.length > 0 || showQueryCommands;

  const renderItem = (
    key: string,
    icon: LucideIcon | undefined,
    label: string,
    onSelect: () => void,
    hint?: string,
  ) => {
    const Icon = icon;
    return (
      <CommandItem key={key} value={key} onSelect={onSelect}>
        {Icon ? <Icon /> : null}
        <span>{label}</span>
        {hint ? <CommandShortcut>{hint}</CommandShortcut> : null}
      </CommandItem>
    );
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("common.appName")}
      description={t("command.placeholder")}
      shouldFilter={false}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t("command.placeholder")}
      />
      <CommandList>
        {!hasAnything ? <CommandEmpty>{t("command.empty")}</CommandEmpty> : null}

        {visibleNav.length > 0 ? (
          <CommandGroupUi heading={t("command.groups.navigation")}>
            {visibleNav.map((i) =>
              renderItem(i.id, i.icon, i.label, () => exec(i.run)),
            )}
          </CommandGroupUi>
        ) : null}

        {grouped.map(({ group, items }) => (
          <CommandGroupUi key={group} heading={t(`command.groups.${group}`)}>
            {items.map((c: Command) =>
              renderItem(
                c.id,
                c.icon,
                c.label,
                () => c.run && exec(c.run),
                c.shortcutHint,
              ),
            )}
          </CommandGroupUi>
        ))}

        {showQueryCommands ? (
          <CommandGroupUi heading={t("command.groups.search")}>
            {queryCommands.map((c) => (
              <CommandItem
                key={c.id}
                value={c.id}
                onSelect={() => c.runWithQuery && exec(() => c.runWithQuery!(query))}
              >
                {c.icon ? <c.icon /> : <Search />}
                <span>
                  {c.label}{" "}
                  <span className="text-muted-foreground">
                    {t("command.for")} “{query.trim()}”
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroupUi>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
