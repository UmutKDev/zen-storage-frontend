import { Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";

/** Loading state while `Cloud/Find` resolves the previewed file. A centered
 *  spinner (not a pale skeleton block, which reads as a blank white screen on
 *  the light modal shell). */
export function PreviewLoading() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-muted-foreground"
      role="status"
      aria-busy
      aria-label={t("preview.loading")}
    >
      <Loader2 className="size-7 animate-spin" />
      <span className="text-sm">{t("preview.loading")}</span>
    </div>
  );
}
