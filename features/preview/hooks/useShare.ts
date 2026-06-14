"use client";

import { useState } from "react";
import { toast } from "sonner";
import { isApiError } from "@/lib/api";
import { t } from "@/lib/i18n";
import { getShareUrl } from "../api";

/**
 * Share a file via a time-limited presigned URL. Prefers the Web Share API
 * (mobile/Safari); otherwise copies to the clipboard. Every success path
 * communicates the TTL (honesty rule — the link is time-limited, not a managed
 * permission). The Instance toasts generic errors; a passthrough 403 is
 * surfaced here (until then it would be silent).
 */
export function useShare() {
  const [isPending, setIsPending] = useState(false);

  const share = async (key: string, title?: string): Promise<void> => {
    setIsPending(true);
    try {
      const url = await getShareUrl(key);
      if (!url) return;

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          await navigator.share({ title: title ?? t("share.webShareTitle"), url });
          return;
        } catch (err) {
          // User dismissed the share sheet — not an error, and not a copy intent.
          if (err instanceof DOMException && err.name === "AbortError") return;
          // Any other Web Share failure → fall through to clipboard.
        }
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success(t("share.copied"), { description: t("share.ttlNote") });
      } else {
        toast.error(t("share.copyFailed"));
      }
    } catch (error) {
      // Generic errors already toasted centrally; surface a passthrough 403.
      if (isApiError(error) && error.code === "FORBIDDEN") {
        toast.error(t("share.forbidden"));
      }
    } finally {
      setIsPending(false);
    }
  };

  return { share, isPending };
}
