"use client";

import { EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { FolderEntry } from "../lib/entries";

/**
 * Protected-state metadata for a directory. Status rides on the icon tile as a
 * corner chip (never a name-line badge); the kind line gains a plain word.
 * Phase 5 adds the unlock/reveal flows — here these are indicators only.
 */
export function entryStatus(
  entry: FolderEntry,
): { chip: "lock" | "eye-off"; word: string; label: string } | null {
  if (entry.kind !== "dir") return null;
  if (entry.dir.IsEncrypted) {
    return {
      chip: "lock",
      word: t("storage.status.encrypted"),
      label: t("storage.status.encryptedLabel"),
    };
  }
  if (entry.dir.IsHidden) {
    return {
      chip: "eye-off",
      word: t("storage.status.hidden"),
      label: t("storage.status.hiddenLabel"),
    };
  }
  return null;
}

/** Hidden directories render ghosted (dashed tile + dimmed) until revealed. */
export function entryIsHidden(entry: FolderEntry): boolean {
  return entry.kind === "dir" && entry.dir.IsHidden;
}

/** Corner status chip docked on the icon tile (must render inside `.zs-tile-icon`). */
export function EntryStatusChip({ entry }: { entry: FolderEntry }) {
  const status = entryStatus(entry);
  if (!status) return null;
  const Icon = status.chip === "lock" ? Lock : EyeOff;
  return (
    <span
      className={cn(
        "zs-status-chip",
        status.chip === "lock" && "zs-status-chip--lock",
      )}
      role="img"
      aria-label={status.label}
    >
      <Icon />
    </span>
  );
}
