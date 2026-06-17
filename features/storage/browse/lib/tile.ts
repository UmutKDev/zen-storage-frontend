import { isThumbnailable, isVideo } from "@/lib/utils";
import { getImageCdnUrl, parseDimension } from "@/lib/preview";
import type { FolderEntry } from "./entries";

/** Aspect-ratio clamp so a panorama / sliver doesn't make a one-tile row look
 *  broken (very wide → short row; very tall → narrow column). */
const MIN_RATIO = 0.5;
const MAX_RATIO = 2.5;
/** Fallback ratio for an image with no stored dimensions (object-fit crops). */
const DEFAULT_IMAGE_RATIO = 4 / 3;
/** Videos carry no stored dimensions — assume landscape 16:9 (object-fit crops). */
const DEFAULT_VIDEO_RATIO = 16 / 9;

export interface TileMedia {
  /** Thumbnail URL — a CDN-scaled image, or the raw signed URL of a video. */
  url?: string;
  /** width / height — drives the justified row width (1 for icon tiles). */
  ratio: number;
}

/** Clamp a w/h ratio so a panorama / sliver doesn't break the justified row. */
const clampRatio = (w: number, h: number): number =>
  Math.min(MAX_RATIO, Math.max(MIN_RATIO, w / h));

/** Intrinsic video frame sizes discovered client-side, keyed by object key. */
export type VideoDims = Record<string, { w: number; h: number }>;

/**
 * Resolve a smart-grid tile's thumbnail + aspect ratio. Images get a CDN-scaled
 * thumbnail from `Metadata.Width/Height`; videos get their raw signed `Path.Url`
 * (the image CDN can't transcode video — {@link FileTile} paints the first frame
 * via a `<video>` poster). A video's ratio uses its real frame size once measured
 * (`videoDims`, captured on `loadedmetadata`), falling back to 16:9 until then.
 * Docs / folders / other files return `ratio: 1` for a square tinted icon tile.
 * `object-fit: cover` crops to the tile.
 */
export function resolveTileMedia(
  entry: FolderEntry,
  rowHeight: number,
  videoDims?: VideoDims,
): TileMedia {
  if (entry.kind !== "file") return { ratio: 1 };
  const { name, file } = entry;
  if (!isThumbnailable(name)) return { ratio: 1 };

  // Videos: the raw signed URL — FileTile renders a first-frame <video> poster.
  if (isVideo(name)) {
    const d = videoDims?.[entry.key];
    const ratio = d ? clampRatio(d.w, d.h) : DEFAULT_VIDEO_RATIO;
    return { url: file.Path.Url, ratio };
  }

  const w = parseDimension(file.Metadata?.Width);
  const h = parseDimension(file.Metadata?.Height);
  const ratio = w && h ? clampRatio(w, h) : DEFAULT_IMAGE_RATIO;
  const height = Math.min(480, Math.round(rowHeight * 2));
  const url = getImageCdnUrl(file.Path.Url, { name, height });
  return { url, ratio };
}
