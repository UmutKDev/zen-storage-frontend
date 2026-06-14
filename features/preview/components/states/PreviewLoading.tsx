import { Skeleton } from "@/components/ui";
import { t } from "@/lib/i18n";

/** Loading state while `Cloud/Find` resolves the previewed file. */
export function PreviewLoading() {
  return (
    <div
      className="flex h-full w-full items-center justify-center p-6"
      aria-busy
      aria-label={t("preview.loading")}
    >
      <Skeleton className="h-full max-h-[60vh] w-full max-w-3xl rounded-lg" />
    </div>
  );
}
