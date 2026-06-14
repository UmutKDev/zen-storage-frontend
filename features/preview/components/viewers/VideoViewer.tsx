import type { CloudObjectModel } from "@/service/models";
import { t } from "@/lib/i18n";

/** Video preview — native `<video>` against the signed CDN URL. The browser
 *  surfaces an unsupported codec via the fallback child. */
export function VideoViewer({ object }: { object: CloudObjectModel }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <video
        src={object.Path.Url}
        controls
        preload="metadata"
        className="max-h-full max-w-full rounded-md"
      >
        {t("preview.video.codecUnsupported")}
      </video>
    </div>
  );
}
