"use client";

import { t } from "@/lib/i18n";
import { Button } from "@/components/ui";

/** Shared error+retry state for a data-backed section (announced via aria-live). */
export function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-start gap-3"
      role="alert"
      aria-live="assertive"
    >
      <p className="text-sm text-muted-foreground">
        {t("common.errorGeneric")}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t("common.retry")}
      </Button>
    </div>
  );
}
