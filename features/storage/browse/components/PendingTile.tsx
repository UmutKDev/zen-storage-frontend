"use client";

import type { CSSProperties } from "react";
import { Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";
import type { PendingEntry } from "../lib/pending";

/** Square tile (`--zs-ratio: 1`) with a neutral tint reusing the real
 *  `.zs-tile__icon` shape, so a pending tile sits flush in the justified grid. */
const PENDING_STYLE = {
  "--zs-ratio": 1,
  "--tile": "var(--muted-foreground)",
} as CSSProperties;

/**
 * A non-interactive "in progress" grid tile — mirrors a plain icon
 * {@link FileTile} inside the `.zs-tile` surface, with a spinner + muted tint.
 * No checkbox, link, drag, or actions menu.
 */
export function PendingTile({ entry }: { entry: PendingEntry }) {
  const pct =
    typeof entry.percentage === "number"
      ? ` · ${Math.round(entry.percentage)}%`
      : "";
  return (
    <div
      aria-busy
      aria-label={`${entry.label} — ${entry.detail ?? t("storage.pending.inProgress")}`}
      role="listitem"
      style={PENDING_STYLE}
      className="zs-tile zs-tile--plain"
    >
      <div className="zs-tile__inner">
        <span className="zs-tile__icon">
          <Loader2
            className="size-[22px] motion-safe:animate-spin"
            aria-hidden
          />
        </span>
        <span className="zs-tile__label">{entry.label}</span>
        <span className="zs-tile__meta">
          {(entry.detail ?? t("storage.pending.inProgress")) + pct}
        </span>
      </div>
    </div>
  );
}
