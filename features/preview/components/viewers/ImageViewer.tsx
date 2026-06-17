import { useState } from "react";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import type { CloudObjectModel } from "@/service/models";
import { getImageCdnUrl, parseDimension } from "@/lib/preview";
import { t } from "@/lib/i18n";

/** Largest edge we request from the CDN resizer (full-res is wasteful on screen). */
const PREVIEW_MAX_EDGE = 1600;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

/**
 * Image preview on the dark lightbox stage — renders the signed CDN URL (CDN-
 * scaled when the object carries `Metadata.Width`). When `onZoomChange` is given
 * a floating micro-glass zoom pill (out / % / in / fit) drives a `scale()`
 * transform; the modal owns the `zoom` value so it resets on prev/next nav.
 */
export function ImageViewer({
  object,
  zoom = 1,
  onZoomChange,
}: {
  object: CloudObjectModel;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}) {
  const width = parseDimension(object.Metadata?.Width);
  const requestWidth =
    width && width > PREVIEW_MAX_EDGE ? PREVIEW_MAX_EDGE : width;
  const src = getImageCdnUrl(object.Path.Url, {
    name: object.Name,
    width: requestWidth,
  });
  const interactive = Boolean(onZoomChange);
  // Track which src has finished downloading → spinner + fade-in while the
  // bytes load (the object query resolves fast; the image itself can lag).
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === src;

  return (
    <div className="zs-preview-stage relative flex h-full w-full items-center justify-center overflow-hidden p-4">
      {!loaded ? (
        <span
          className="absolute inset-0 flex items-center justify-center text-white/70"
          role="status"
          aria-label={t("preview.loading")}
        >
          <Loader2 className="size-7 animate-spin" />
        </span>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={object.Name}
        draggable={false}
        onLoad={() => setLoadedSrc(src)}
        onError={() => setLoadedSrc(src)}
        className="zs-preview-zoomable rounded-sm object-contain shadow-e3"
        style={{
          maxWidth: "calc(100% - 64px)",
          maxHeight: interactive ? "calc(100% - 88px)" : "calc(100% - 32px)",
          transform: `scale(${zoom})`,
          opacity: loaded ? 1 : 0,
        }}
      />
      {onZoomChange ? (
        <div className="zs-preview-zoom-pill absolute bottom-4 left-1/2 -translate-x-1/2">
          <button
            type="button"
            aria-label={t("preview.zoom.out")}
            disabled={zoom <= ZOOM_MIN}
            onClick={() => onZoomChange(Math.max(ZOOM_MIN, +(zoom - ZOOM_STEP).toFixed(2)))}
            className="inline-flex size-7 items-center justify-center rounded-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40"
          >
            <ZoomOut className="size-[15px]" />
          </button>
          <span className="min-w-[42px] text-center font-mono text-[11px] tabular-nums text-white/85">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label={t("preview.zoom.in")}
            disabled={zoom >= ZOOM_MAX}
            onClick={() => onZoomChange(Math.min(ZOOM_MAX, +(zoom + ZOOM_STEP).toFixed(2)))}
            className="inline-flex size-7 items-center justify-center rounded-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40"
          >
            <ZoomIn className="size-[15px]" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
