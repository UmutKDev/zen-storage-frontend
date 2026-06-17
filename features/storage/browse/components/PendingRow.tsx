"use client";

import type { CSSProperties } from "react";
import { Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";
import type { PendingEntry } from "../lib/pending";

/** A neutral (non-category) tint for the in-progress tile, reusing the real
 *  `.zs-tile-icon` shape so a pending row sits flush with its neighbours. */
const PENDING_TINT = { "--tile": "var(--muted-foreground)" } as CSSProperties;

/**
 * A non-interactive "in progress" list row — an optimistic create or a durable
 * job landing in this folder. Mirrors {@link BrowseRow}'s columns (icon · name ·
 * size · modified · actions) so it aligns with real rows; a spinner + muted tint
 * mark it pending. No checkbox, link, drag, or actions menu.
 */
export function PendingRow({ entry }: { entry: PendingEntry }) {
  const pct =
    typeof entry.percentage === "number"
      ? `${Math.round(entry.percentage)}%`
      : "";
  return (
    <div
      aria-busy
      aria-label={`${entry.label} — ${entry.detail ?? t("storage.pending.inProgress")}`}
      className="zs-file-row flex items-center gap-1 border-b border-border/50 bg-muted/20 pl-2 pr-1"
    >
      {/* checkbox column spacer (pending rows aren't selectable) */}
      <span aria-hidden className="size-4 shrink-0" />
      <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5">
        <span className="zs-tile-icon size-9 shrink-0" style={PENDING_TINT}>
          <Loader2
            className="size-[18px] motion-safe:animate-spin"
            aria-hidden
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="truncate text-sm font-medium tracking-[-0.01em] text-foreground">
            {entry.label}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {entry.detail ?? t("storage.pending.inProgress")}
          </span>
        </span>
        <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {pct}
        </span>
        <span className="hidden w-40 shrink-0 sm:block" />
      </div>
      {/* actions column spacer */}
      <span aria-hidden className="w-[40px] shrink-0" />
    </div>
  );
}
