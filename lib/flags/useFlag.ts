"use client";

import { isEnabled, type FlagKey } from "./registry";

export function useFlag(key: FlagKey): boolean {
  return isEnabled(key);
}
