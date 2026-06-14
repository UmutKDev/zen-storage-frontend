"use client";

import { Download, FileText } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { t } from "@/lib/i18n";
import { useDownload } from "@/features/storage";
import type { CloudObjectModel } from "@/service/models";
import { useOfficeEmbed } from "../../hooks/useOfficeEmbed";

/** Centered "couldn't render — download" fallback (error / unsupported / too large). */
function OfficeFallback({ onDownload }: { onDownload: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <FileText className="size-10 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {t("preview.office.error")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("preview.downloadToView")}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onDownload}>
        <Download className="size-4" />
        {t("preview.download")}
      </Button>
    </div>
  );
}

/**
 * Office preview via the Microsoft Office Online viewer — a sandboxed `<iframe>`
 * to `view.officeapps.live.com` (CSP `frame-src` allows it, D-P4.3). Microsoft
 * fetches the presigned `src` server-side and renders docx/xlsx/pptx; the footer
 * **discloses** that the file is opened in Microsoft's viewer (third-party
 * egress) and always offers a direct download as the fallback.
 */
export function OfficeViewer({ object }: { object: CloudObjectModel }) {
  const { embedUrl, isPending, isError } = useOfficeEmbed(object.Path.Key);
  const { download } = useDownload();
  const onDownload = () => download(object.Path.Key);

  if (isError) return <OfficeFallback onDownload={onDownload} />;

  if (isPending || !embedUrl) {
    return (
      <div
        className="flex h-full w-full items-center justify-center p-6"
        aria-busy
        aria-label={t("preview.office.loading")}
      >
        <Skeleton className="h-full max-h-[60vh] w-full max-w-4xl rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <iframe
        src={embedUrl}
        title={object.Name}
        // The Office Online viewer POSTs a form to load its WOPI render frame
        // (needs `allow-forms`) and offers a download (`allow-downloads`).
        // Cross-origin to the app, so allow-scripts+allow-same-origin grant no
        // escape against us; top-navigation stays withheld.
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
        referrerPolicy="no-referrer"
        className="min-h-0 flex-1 border-0 bg-background"
      />
      <div className="flex items-center justify-center gap-1.5 border-t border-border/60 px-4 py-2 text-center text-xs text-muted-foreground">
        <span>{t("preview.office.externalNote")}</span>
        <Button
          variant="link"
          size="xs"
          className="h-auto px-0.5"
          onClick={onDownload}
        >
          {t("preview.office.downloadFallback")}
        </Button>
      </div>
    </div>
  );
}
