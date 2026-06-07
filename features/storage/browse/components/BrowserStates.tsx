"use client";

import { FolderOpen } from "lucide-react";
import { t } from "@/lib/i18n";
import { Button, Skeleton } from "@/components/ui";

export function BrowserSkeleton() {
  return (
    <div className="space-y-2" aria-busy>
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  );
}

export function EmptyFolder() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <FolderOpen className="size-10 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">
        {t("storage.empty.title")}
      </p>
      <p className="text-sm text-muted-foreground">
        {t("storage.empty.description")}
      </p>
    </div>
  );
}

export function BrowserError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-16 text-center"
      role="alert"
    >
      <p className="text-sm font-medium text-foreground">
        {t("storage.error.title")}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t("common.retry")}
      </Button>
    </div>
  );
}
