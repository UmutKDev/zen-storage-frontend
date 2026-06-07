"use client";

import { EyeOff, Lock } from "lucide-react";
import { t } from "@/lib/i18n";
import { Badge } from "@/components/ui";
import type { FolderEntry } from "../lib/entries";

/** Read-only status badges for a directory (encrypted / hidden). Phase 5 adds
 *  the unlock/reveal flows; here they are indicators only. */
export function EntryBadges({ entry }: { entry: FolderEntry }) {
  if (entry.kind !== "dir") return null;
  const { IsEncrypted, IsHidden } = entry.dir;
  if (!IsEncrypted && !IsHidden) return null;
  return (
    <span className="flex shrink-0 items-center gap-1">
      {IsEncrypted ? (
        <Badge variant="secondary" className="gap-1">
          <Lock className="size-3" />
          {t("storage.badge.encrypted")}
        </Badge>
      ) : null}
      {IsHidden ? (
        <Badge variant="secondary" className="gap-1">
          <EyeOff className="size-3" />
          {t("storage.badge.hidden")}
        </Badge>
      ) : null}
    </span>
  );
}
