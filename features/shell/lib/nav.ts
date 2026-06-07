import type { ComponentType } from "react";
import { HardDrive, KeyRound, User } from "lucide-react";
import type { FlagKey } from "@/lib/flags";

export interface NavItem {
  /** i18n key under `account.shell.nav`. */
  key: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** When set, the item only renders if the flag is enabled. */
  flag?: FlagKey;
}

/**
 * Primary sidebar navigation. Storage is the placeholder destination (Phase 3
 * fills it in); Account hosts the Phase 2 screens. API keys are flagged off.
 */
export const navItems: ReadonlyArray<NavItem> = [
  { key: "storage", href: "/storage", icon: HardDrive },
  { key: "account", href: "/account/profile", icon: User },
  { key: "apiKeys", href: "/account/api-keys", icon: KeyRound, flag: "apiKeys" },
];
