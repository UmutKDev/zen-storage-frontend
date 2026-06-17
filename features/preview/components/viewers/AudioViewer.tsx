import { Music } from "lucide-react";
import type { CloudObjectModel } from "@/service/models";
import { t } from "@/lib/i18n";

/** Audio preview — native `<audio>` player against the signed CDN URL. */
export function AudioViewer({ object }: { object: CloudObjectModel }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6">
      <div className="zs-tile-icon zs-tone-violet size-20 [&>svg]:size-9">
        <Music />
      </div>
      <p className="max-w-md truncate text-sm font-medium text-foreground">
        {object.Name}
      </p>
      <audio src={object.Path.Url} controls preload="metadata" className="w-full max-w-md">
        {t("preview.audio.codecUnsupported")}
      </audio>
    </div>
  );
}
