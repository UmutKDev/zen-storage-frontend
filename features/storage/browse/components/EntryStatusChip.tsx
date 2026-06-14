"use client";

import { EyeOff, Lock, LockOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { FolderEntry } from "../lib/entries";

/**
 * Protected-state metadata for a directory. Status rides on the icon tile as a
 * corner chip (never a name-line badge); the kind line gains a plain word.
 * An encrypted folder shows a **locked** (amber, closed padlock) vs **unlocked**
 * (green, open padlock) chip off its `IsLocked` flag — which `applyOwnedUnlocks`
 * keeps truthful even for a folder unlocked elsewhere this session.
 */
export function entryStatus(
  entry: FolderEntry,
): { chip: "lock" | "unlock" | "eye-off"; word: string; label: string } | null {
  if (entry.kind !== "dir") return null;
  if (entry.dir.IsEncrypted) {
    return entry.dir.IsLocked
      ? {
          chip: "lock",
          word: t("storage.status.encrypted"),
          label: t("storage.status.encryptedLabel"),
        }
      : {
          chip: "unlock",
          word: t("storage.status.unlocked"),
          label: t("storage.status.unlockedLabel"),
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
  const Icon =
    status.chip === "eye-off" ? EyeOff : status.chip === "unlock" ? LockOpen : Lock;
  return (
    <span
      className={cn(
        "zs-status-chip",
        status.chip === "lock" && "zs-status-chip--lock",
        status.chip === "unlock" && "zs-status-chip--unlock",
      )}
      role="img"
      aria-label={status.label}
    >
      <Icon />
    </span>
  );
}
