"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui";
import { cn, fileMeta, toneClass } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useDownload } from "@/features/storage";
import type { CloudObjectModel } from "@/service/models";

/** No inline viewer for this type — show the file identity + a download CTA. */
export function UnsupportedViewer({ object }: { object: CloudObjectModel }) {
  const { download, isPending } = useDownload();
  const meta = fileMeta(object.Name, "file");
  const Icon = meta.icon;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className={cn("zs-tile-icon size-20 [&>svg]:size-9", toneClass(meta.tone))}>
        <Icon />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {t("preview.unsupported")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("preview.downloadToView")}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => download(object.Path.Key)}
      >
        <Download className="size-4" />
        {t("preview.download")}
      </Button>
    </div>
  );
}
