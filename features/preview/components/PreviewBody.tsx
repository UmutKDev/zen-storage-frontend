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
export function PreviewBody({ object }: { object: CloudObjectModel }) {
  switch (viewerKindForName(object.Name)) {
    case "image":
      return <ImageViewer object={object} />;
    case "video":
      return <VideoViewer object={object} />;
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
