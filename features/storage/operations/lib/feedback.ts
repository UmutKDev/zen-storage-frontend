import { toast } from "sonner";
import { isApiError } from "@/lib/api";
import { t } from "@/lib/i18n";

/**
 * Surface errors the Instance deliberately does NOT toast (403 passes through
 * for feature handling — see envelope interceptor). Until the Phase 5
 * secure-folder unlock prompt takes over, a generic toast beats silence.
 * Conflict (409) callers handle separately via `extractConflictDetails`.
 */
export function surfacePassthroughError(error: unknown): void {
  if (isApiError(error) && error.code === "FORBIDDEN") {
    toast.error(t("common.errorGeneric"));
  }
}

/** Stable focus target for the browse surface — the bulk bar hands focus here
 *  before it unmounts (clear / post-action), so focus never drops to <body>. */
export const BROWSE_CONTENT_ID = "storage-browse-content";

export function focusBrowseContent(): void {
  // Next tick: let Radix finish its (now-pointless) focus restore to the
  // removed trigger before we take over.
  window.setTimeout(() => {
    document.getElementById(BROWSE_CONTENT_ID)?.focus();
  }, 0);
}
