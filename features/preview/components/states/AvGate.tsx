"use client";

import type { ReactNode } from "react";
import { ShieldAlert, ShieldQuestion } from "lucide-react";
import { t } from "@/lib/i18n";
import type { ScanGate } from "../../hooks/useScanStatus";

/**
 * Antivirus gate around the preview body (shared concern with Phase 6):
 * - `infected` → block the body entirely (the media URL is never constructed).
 * - `pending`  → warn banner above the body, but still render it.
 * - `clean`/`unknown` → render as-is.
 * Download/share gating is handled in the toolbar (it reads the same gate).
 */
export function AvGate({
  gate,
  children,
}: {
  gate: ScanGate;
  children: ReactNode;
}) {
  if (gate === "infected") {
    return (
      <div
        role="alert"
        className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <ShieldAlert className="size-10 text-destructive" />
        <p className="text-sm font-medium text-foreground">
          {t("preview.av.infectedTitle")}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("preview.av.infectedBody")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {gate === "pending" ? (
        // role=status (polite live region) so a screen reader is told the scan
        // is still running when the banner appears asynchronously.
        <div
          role="status"
          className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs text-foreground"
        >
          <ShieldQuestion className="size-4 shrink-0 text-warning" />
          <span>{t("preview.av.pendingBody")}</span>
        </div>
      ) : null}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
