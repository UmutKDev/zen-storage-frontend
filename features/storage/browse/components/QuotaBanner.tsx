"use client";

import { useState } from "react";
import Link from "next/link";
import { OctagonAlert, TriangleAlert, X } from "lucide-react";
import { t } from "@/lib/i18n";
import { Alert, AlertDescription, AlertTitle, Button } from "@/components/ui";
import { useUiStore, type QuotaLevel } from "@/stores/ui.store";
import { useStorageUsage } from "../hooks/useStorageUsage";

const SEVERITY: Record<QuotaLevel, number> = { none: 0, warning: 1, exceeded: 2 };

/**
 * Storage-quota banner (§6.5b). Surfaces at the top of the app content when the
 * account nears (≥80%) or exceeds its limit — pushed live by the socket
 * `QUOTA_WARNING/EXCEEDED` events (via `useUiStore.quotaLevel`) and also derived
 * from the authoritative usage query so it's correct on first load. Dismissible;
 * re-appears when the level escalates (warning → exceeded).
 */
export function QuotaBanner() {
  const pushed = useUiStore((s) => s.quotaLevel);
  const { data } = useStorageUsage();
  const [dismissed, setDismissed] = useState<QuotaLevel>("none");

  const pct = data ? Math.round(data.UsagePercentage) : 0;
  const level: QuotaLevel =
    pushed === "exceeded" || data?.IsLimitExceeded || pct >= 100
      ? "exceeded"
      : pushed === "warning" || pct >= 80
        ? "warning"
        : "none";

  if (SEVERITY[level] <= SEVERITY[dismissed]) return null;

  const exceeded = level === "exceeded";
  const Icon = exceeded ? OctagonAlert : TriangleAlert;

  return (
    <Alert
      variant={exceeded ? "destructive" : "default"}
      className="mb-4 pr-12"
    >
      <Icon />
      <AlertTitle>
        {exceeded ? t("storage.quota.exceededTitle") : t("storage.quota.warningTitle")}
      </AlertTitle>
      <AlertDescription>
        <p>
          {exceeded
            ? t("storage.quota.exceededBody")
            : t("storage.quota.warningBody")}
        </p>
        <Button asChild variant="link" size="sm" className="h-auto px-0">
          <Link href="/account/subscription">{t("storage.quota.upgrade")}</Link>
        </Button>
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute right-2 top-2"
        aria-label={t("storage.quota.dismiss")}
        onClick={() => setDismissed(level)}
      >
        <X />
      </Button>
    </Alert>
  );
}
