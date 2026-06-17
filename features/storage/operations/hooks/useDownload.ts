"use client";

import { useState } from "react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { getDownloadUrl } from "../api";
import { surfacePassthroughError } from "../lib/feedback";

const BULK_DOWNLOAD_STAGGER_MS = 350;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Navigate a hidden anchor to the presigned URL. Unlike `window.open` this
 *  survives the lost user-gesture context after an await (no popup blocker);
 *  the S3 content-disposition header keeps it a download, not a navigation. */
function clickThrough(url: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Fetch a presigned URL and open it (S3 content-disposition triggers the save). */
export function useDownload() {
  const [isPending, setIsPending] = useState(false);

  const download = async (key: string) => {
    setIsPending(true);
    try {
      const url = await getDownloadUrl(key);
      if (typeof window !== "undefined" && url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      // generic errors toast centrally; 403 passes through → surface it
      surfacePassthroughError(error);
    } finally {
      setIsPending(false);
    }
  };

  /** Sequential bulk download (files only — callers filter out dirs). A failed
   *  presign skips that file (central toast) and continues with the rest. */
  const downloadMany = async (keys: ReadonlyArray<string>) => {
    if (typeof window === "undefined" || keys.length === 0) return;
    setIsPending(true);
    if (keys.length > 1) toast.info(t("storage.ops.download.preparing"));
    try {
      for (const key of keys) {
        let url: string | undefined;
        try {
          url = await getDownloadUrl(key);
        } catch (error) {
          // generic errors toast centrally; 403 surfaced; skip this file
          surfacePassthroughError(error);
          continue;
        }
        if (!url) continue;
        clickThrough(url);
        await sleep(BULK_DOWNLOAD_STAGGER_MS);
      }
    } finally {
      setIsPending(false);
    }
  };

  return { download, downloadMany, isPending };
}
