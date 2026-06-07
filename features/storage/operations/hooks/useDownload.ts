"use client";

import { useState } from "react";
import { getDownloadUrl } from "../api";

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
    } catch {
      // central toast (Instance)
    } finally {
      setIsPending(false);
    }
  };

  return { download, isPending };
}
