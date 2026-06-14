import type { CloudObjectModel } from "@/service/models";
import { getImageCdnUrl, parseDimension } from "@/lib/preview";

/** Largest edge we request from the CDN resizer (full-res is wasteful on screen). */
const PREVIEW_MAX_EDGE = 1600;

/**
 * Image preview — renders the signed CDN URL, CDN-scaled when the object carries
 * `Metadata.Width/Height` (SVG/ICO pass through unscaled). The resize params are
 * appended to the opaque signed URL by `getImageCdnUrl`.
 */
export function ImageViewer({ object }: { object: CloudObjectModel }) {
  const width = parseDimension(object.Metadata?.Width);
  const requestWidth =
    width && width > PREVIEW_MAX_EDGE ? PREVIEW_MAX_EDGE : width;
  const src = getImageCdnUrl(object.Path.Url, {
    name: object.Name,
    width: requestWidth,
  });

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={object.Name}
        className="max-h-full max-w-full rounded-md object-contain"
        draggable={false}
      />
    </div>
  );
}
