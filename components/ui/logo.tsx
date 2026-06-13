import { cn } from "@/lib/utils/index";
import { t } from "@/lib/i18n";

/**
 * Brand mark — a gradient "S" lettermark tile (the product has no drawn logo).
 * `wordmark` shows the app name beside the tile (hidden when the sidebar
 * collapses to the icon rail). See `.zs-logo-tile` in globals.css.
 */
export function Logo({
  wordmark = true,
  className,
}: {
  wordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="zs-logo-tile size-8 text-base"
        role="img"
        aria-label={t("common.appName")}
      >
        S
      </span>
      {wordmark ? (
        <span className="font-semibold tracking-[-0.01em] whitespace-nowrap text-foreground">
          {t("common.appName")}
        </span>
      ) : null}
    </span>
  );
}
