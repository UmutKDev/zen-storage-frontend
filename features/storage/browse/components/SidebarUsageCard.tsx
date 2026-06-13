"use client";

import { t } from "@/lib/i18n";
import { cn, formatBytes } from "@/lib/utils";
import { Skeleton } from "@/components/ui";
import { useShellStore } from "@/features/shell";
import { useStorageUsage } from "../hooks/useStorageUsage";

/**
 * Storage-usage summary, pinned to the bottom of the app sidebar. The design
 * shows usage HERE ONLY — it is deliberately never duplicated in the browse
 * content area. Collapses to a compact percentage when the sidebar is an icon
 * rail. Injected into the shell via `AppShell`'s `sidebarFooter` slot so the
 * shell stays ignorant of the storage feature.
 */
export function SidebarUsageCard() {
  const collapsed = useShellStore((s) => s.sidebarCollapsed);
  const { data, isPending } = useStorageUsage();

  if (isPending) {
    return (
      <Skeleton className={cn("w-full shrink-0", collapsed ? "h-12" : "h-[78px]")} />
    );
  }
  if (!data) return null;

  const pct = Math.min(100, Math.max(0, Math.round(data.UsagePercentage)));
  const exceeded = data.IsLimitExceeded || pct >= 100;
  const near = pct >= 80;
  const fillTone = exceeded
    ? "zs-usage-fill--danger"
    : near
      ? "zs-usage-fill--warning"
      : "";

  const amount = `${formatBytes(data.UsedStorageInBytes)} ${t("storage.usage.of")} ${formatBytes(data.MaxStorageInBytes)}`;

  const bar = (
    <div
      className="zs-usage-track"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t("storage.usage.label")}
    >
      <div className={cn("zs-usage-fill", fillTone)} style={{ width: `${pct}%` }} />
    </div>
  );

  if (collapsed) {
    return (
      <div className="zs-usage-card" data-collapsed="true" title={amount}>
        <div className="text-center text-[10px] font-semibold text-muted-foreground tabular-nums">
          {pct}%
        </div>
        {bar}
      </div>
    );
  }

  return (
    <div className="zs-usage-card">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="min-w-0">
          <span className="block font-semibold text-foreground">
            {t("storage.usage.label")}
          </span>
          <span className="block text-muted-foreground">
            {exceeded
              ? t("storage.usage.exceeded")
              : near
                ? t("storage.usage.nearLimit")
                : `${pct}% ${t("storage.usage.usedSuffix")}`}
          </span>
        </span>
        <span className="whitespace-nowrap text-muted-foreground tabular-nums">
          {amount}
        </span>
      </div>
      {bar}
    </div>
  );
}
