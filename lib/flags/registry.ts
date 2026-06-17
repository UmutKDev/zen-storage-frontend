import { flagDefaults, type FlagDefaults } from "@/config/flags.defaults";

/** Typed feature-flag registry. Defaults live in `config/flags.defaults.ts`. */
export type FlagKey = keyof FlagDefaults;

export function isEnabled(key: FlagKey): boolean {
  return flagDefaults[key];
}
