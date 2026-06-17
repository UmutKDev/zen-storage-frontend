import { isThumbnailable, isVideo } from "@/lib/utils";
import { getImageCdnUrl, parseDimension } from "@/lib/preview";
import type { FolderEntry } from "./entries";

/** Aspect-ratio clamp so a panorama / sliver doesn't make a one-tile row look
 *  broken (very wide → short row; very tall → narrow column). */
const MIN_RATIO = 0.5;
const MAX_RATIO = 2.5;
/** Fallback ratio for an image with no stored dimensions (object-fit crops). */
const DEFAULT_IMAGE_RATIO = 4 / 3;

export interface TileMedia {
  /** CDN-scaled thumbnail URL — present only for images. */
  url?: string;
  /** width / height — drives the justified row width (1 for icon tiles). */
  ratio: number;
}

/**
 * Resolve a smart-grid tile's thumbnail + aspect ratio. **Images only** (v1):
 * videos / docs / folders / non-image files render as square (`ratio: 1`) tinted
 * icon tiles. The ratio comes from the listing's `Metadata.Width/Height`; the
 * thumbnail is the signed CDN `Path.Url` scaled to ~2× the row height (retina,
 * capped) — `object-fit: cover` crops it to the tile.
 */
export function resolveTileMedia(entry: FolderEntry, rowHeight: number): TileMedia {
  if (entry.kind !== "file") return { ratio: 1 };
  const { name, file } = entry;
  if (!isThumbnailable(name) || isVideo(name)) return { ratio: 1 };

  const w = parseDimension(file.Metadata?.Width);
  const h = parseDimension(file.Metadata?.Height);
  const ratio =
    w && h
      ? Math.min(MAX_RATIO, Math.max(MIN_RATIO, w / h))
      : DEFAULT_IMAGE_RATIO;
  const height = Math.min(480, Math.round(rowHeight * 2));
  const url = getImageCdnUrl(file.Path.Url, { name, height });
  return { url, ratio };
}
