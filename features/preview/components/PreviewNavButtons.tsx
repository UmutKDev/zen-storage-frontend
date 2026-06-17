"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";
import { t } from "@/lib/i18n";

/** Floating ‹ / › arrows over the body — only shown on the side that has a
 *  neighbor. The ←/→ keys (usePreviewNavigation) are the primary affordance. */
export function PreviewNavButtons({
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: {
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <>
      {hasPrev ? (
        <Button
          variant="secondary"
          size="icon"
          aria-label={t("preview.prev")}
          onClick={onPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full shadow-e2"
        >
          <ChevronLeft />
        </Button>
      ) : null}
      {hasNext ? (
        <Button
          variant="secondary"
          size="icon"
          aria-label={t("preview.next")}
          onClick={onNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full shadow-e2"
        >
          <ChevronRight />
        </Button>
      ) : null}
    </>
  );
}
