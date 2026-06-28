"use client";

import { Loader2 } from "lucide-react";
import { cn, toneClass } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { PendingEntry } from "../lib/pending";

/**
 * A non-interactive "in progress" list row — an optimistic create or a durable
 * job landing in this folder. Mirrors {@link BrowseRow}'s columns (icon · name ·
 * size/percent · modified) so it aligns with real rows; a spinner in a tinted
 * tile + a bottom gradient progress rail mark it pending (determinate when the
 * percentage is known, otherwise an indeterminate sweep). No checkbox, link,
 * drag, or actions menu.
 */
export function PendingRow({ entry }: { entry: PendingEntry }) {
  const pct =
    typeof entry.percentage === "number"
      ? Math.min(100, Math.max(0, Math.round(entry.percentage)))
      : null;
  return (
    <div
      aria-busy
      aria-label={`${entry.label} — ${entry.detail ?? t("storage.pending.inProgress")}`}
      className="zs-file-row relative flex flex-col bg-accent/[0.04] pl-2 pr-1"
    >
      <div className="flex items-center gap-1">
        {/* checkbox column spacer (pending rows aren't selectable) */}
        <span aria-hidden className="size-4 shrink-0" />
        <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5">
          <span
            className={cn(
              "zs-tile-icon size-9 shrink-0",
              toneClass(entry.tone ?? "slate"),
            )}
          >
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
            {pct !== null ? `${pct}%` : ""}
          </span>
          <span className="hidden w-40 shrink-0 sm:block" />
        </div>
        {/* actions column spacer */}
        <span aria-hidden className="w-[40px] shrink-0" />
      </div>
      {/* Bottom-edge progress rail — sits where a row border would, gradient fill
          to the known percentage (or an indeterminate sweep while it's unknown). */}
      <span
        className="zs-rail absolute inset-x-0 bottom-0 rounded-none"
        aria-hidden
      >
        {pct !== null ? (
          <span className="zs-rail__fill" style={{ width: `${pct}%` }} />
        ) : (
          <span className="zs-rail__fill zs-rail__fill--wait" />
        )}
      </span>
    </div>
  );
}
