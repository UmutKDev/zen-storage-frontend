import { t } from "@/lib/i18n";
import type { ApiError } from "./ApiError";

/**
 * The backend is inconsistent: some errors carry a human message
 * ("Authentication required"), others a raw code ("UR-001"). Map known codes to
 * friendly i18n copy; pass human messages through; fall back to generic for an
 * unknown code. Add codes here as they're discovered.
 */
const CODE_TO_KEY: Record<string, string> = {
  "UR-001": "auth.errors.invalidCredentials",
};

/** Matches backend error codes like `UR-001` / `AUTH-12`. */
const CODE_PATTERN = /^[A-Z]{2,}-\d+$/;

/** Best user-facing message for an ApiError. */
export function friendlyMessage(error: ApiError): string {
  const first = error.messages[0];
  if (!first) return t("common.errorGeneric");

  const mapped = CODE_TO_KEY[first];
  if (mapped) return t(mapped);

  // An unknown raw code shouldn't leak to users → generic.
  if (CODE_PATTERN.test(first)) return t("common.errorGeneric");

  return first;
}
