"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui";
import { t } from "@/lib/i18n";
import { useDownload } from "@/features/storage";
import type { CloudObjectModel } from "@/service/models";
import { downloadBlob } from "../../api";
import { PreviewLoading } from "../states/PreviewLoading";

/** Above this, don't buffer the whole PDF into memory — offer open/download. */
const MAX_INLINE_BYTES = 50 * 1024 * 1024;

function PdfFallback({
  object,
  onDownload,
}: {
  object: CloudObjectModel;
  onDownload: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <FileText className="size-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {t("preview.downloadToView")}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            window.open(object.Path.Url, "_blank", "noopener,noreferrer")
          }
        >
          <ExternalLink className="size-4" />
          {t("preview.openInNewTab")}
        </Button>
        <Button variant="outline" size="sm" onClick={onDownload}>
          <Download className="size-4" />
          {t("preview.download")}
        </Button>
      </div>
    </div>
  );
}

/**
 * PDF preview via a **same-origin `blob:` URL**: we pull the bytes through the
 * factory (`Cloud/Download`, `responseType: blob`) and render them as a local
 * blob. This sidesteps every cross-origin-iframe policy — browser-side blocks
 * (Edge/SmartScreen), COEP, and `X-Frame-Options` — that made a direct
 * `<iframe src={cdnUrl}>` unreliable across browsers, and it stays factory-only
 * (no raw `fetch`). The blob is forced to `application/pdf`, so it can only ever
 * be the browser's PDF viewer (never scriptable HTML). Files over the size cap,
 * or a failed load, fall back to open-in-new-tab / download.
 */
export function PdfViewer({ object }: { object: CloudObjectModel }) {
  const tooLarge = object.Size > MAX_INLINE_BYTES;
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const { download } = useDownload();

  useEffect(() => {
    if (tooLarge) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    let active = true;

    downloadBlob(object.Path.Key, controller.signal)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(
          new Blob([blob], { type: "application/pdf" }),
        );
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        // Cancellation only happens on unmount (active=false → ignored); a real
        // failure → the open/download fallback.
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [object.Path.Key, tooLarge]);

  if (tooLarge || failed) {
    return (
      <PdfFallback object={object} onDownload={() => download(object.Path.Key)} />
    );
  }
  if (!blobUrl) return <PreviewLoading />;

  return (
    <iframe
      src={blobUrl}
      title={object.Name}
      className="h-full w-full border-0 bg-background"
    />
  );
}
