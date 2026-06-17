import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import { t } from "@/lib/i18n";

/** The file couldn't be resolved (a typed error; 403 passes through the envelope). */
export function PreviewError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <AlertTriangle className="size-10 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{t("preview.error")}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t("common.retry")}
      </Button>
    </div>
  );
}
