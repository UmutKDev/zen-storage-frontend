"use client";

import { t } from "@/lib/i18n";
import { cn, formatBytes } from "@/lib/utils";
import { Skeleton } from "@/components/ui";
import { useStorageUsage } from "../hooks/useStorageUsage";

export function UsageBar() {
  const { data, isPending } = useStorageUsage();

  if (isPending) return <Skeleton className="h-9 w-full shrink-0" />;
  if (!data) return null;

  const pct = Math.min(100, Math.max(0, Math.round(data.UsagePercentage)));
  const exceeded = data.IsLimitExceeded || pct >= 100;
  const near = pct >= 80;
  const barColor = exceeded ? "bg-danger" : near ? "bg-warning" : "bg-brand";

  return (
    <div className="shrink-0 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">
          {t("storage.usage.label")}
        </span>
        <span className="text-muted-foreground">
          {formatBytes(data.UsedStorageInBytes)} {t("storage.usage.of")}{" "}
          {formatBytes(data.MaxStorageInBytes)}
          {exceeded
            ? ` · ${t("storage.usage.exceeded")}`
            : near
              ? ` · ${t("storage.usage.nearLimit")}`
              : ""}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("storage.usage.label")}
      >
        <div
          className={cn("h-full rounded-full transition-[width]", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
