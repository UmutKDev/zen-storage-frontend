import type { CloudObjectModel } from "@/service/models";
import { viewerKindForName } from "@/lib/preview";
import { ImageViewer } from "./viewers/ImageViewer";
import { VideoViewer } from "./viewers/VideoViewer";
import { AudioViewer } from "./viewers/AudioViewer";
import { PdfViewer } from "./viewers/PdfViewer";
import { OfficeViewer } from "./viewers/OfficeViewer";
import { DocumentEditorLazy } from "./viewers/DocumentEditorLazy";
import { UnsupportedViewer } from "./viewers/UnsupportedViewer";

/**
 * Dispatch the previewed file to its inline viewer by extension. The switch is
 * left open for Stage B/C (`office`/`editor`) — they slot in here without
 * touching the modal shell. Viewers are native elements (no heavy deps), so the
 * whole feature stays on its own route chunk; no extra lazy-loading needed.
 */
export function PreviewBody({
  object,
  zoom,
  onZoomChange,
  onReload,
}: {
  object: CloudObjectModel;
  /** Image-only: the lightbox zoom level + setter (owned by the modal so it
   *  resets on prev/next nav). Ignored by every non-image viewer. */
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  /** Video-only: re-fetch a fresh signed URL (mid-watch expiry recovery). */
  onReload?: () => void;
}) {
  switch (viewerKindForName(object.Name)) {
    case "image":
      return <ImageViewer object={object} zoom={zoom} onZoomChange={onZoomChange} />;
    case "video":
      return <VideoViewer object={object} onReload={onReload} />;
    case "audio":
      return <AudioViewer object={object} />;
    case "pdf":
      return <PdfViewer object={object} />;
    case "office":
      return <OfficeViewer object={object} />;
    case "editor":
      return <DocumentEditorLazy object={object} />;
    default:
      return <UnsupportedViewer object={object} />;
  }
}
