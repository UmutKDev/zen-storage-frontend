import { Alert, AlertDescription } from "@/components/ui";
import { t } from "@/lib/i18n";
import { friendlyMessage, type ApiError } from "@/lib/api";

/** Inline auth error / rate-limit countdown. Announced via aria-live. */
export function AuthError({
  error,
  retrySeconds = 0,
}: {
  error: ApiError | null;
  retrySeconds?: number;
}) {
  if (!error) return null;
  const message =
    retrySeconds > 0
      ? `${t("auth.errors.rateLimitedPrefix")} ${retrySeconds}s`
      : friendlyMessage(error);

  return (
    <Alert
      variant="destructive"
      role="alert"
      aria-live="assertive"
      className="mb-4"
    >
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
