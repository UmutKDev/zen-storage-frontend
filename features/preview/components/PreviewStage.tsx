"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui";
import { t } from "@/lib/i18n";
import type { CloudObjectModel } from "@/service/models";
import type { ScanGate } from "../hooks/useScanStatus";
import { useDocumentDiff } from "../hooks/useDocumentDiff";
import { AvGate } from "./states/AvGate";
import { PreviewBody } from "./PreviewBody";
import { PreviewNavButtons } from "./PreviewNavButtons";
import { DiffView } from "./DiffView";

/** A document version's backend-computed diff vs current, shown as a full-stage
 *  overlay (the rail is too narrow for the unified diff). */
function StageDiffOverlay({
  docKey,
  versionId,
  onClose,
}: {
  docKey: string;
  versionId: string;
  onClose: () => void;
}) {
  const { diff, isPending, isError, refetch } = useDocumentDiff(
    docKey,
    versionId,
    true,
  );
  return (
    <div className="zs-preview-diff-overlay">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <span className="text-sm font-medium text-white">
          {t("preview.diff.title")}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("preview.close")}
          onClick={onClose}
          className="text-white/80 hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4" role="status" aria-busy={isPending}>
        {isError ? (
          <div className="flex items-center justify-between gap-2 px-1 py-2 text-xs text-white/70">
            <span>{t("preview.diff.error")}</span>
            <Button variant="outline" size="xs" onClick={refetch}>
              {t("common.retry")}
            </Button>
          </div>
        ) : isPending || !diff ? (
          <p className="px-1 py-2 text-xs text-white/70">{t("preview.diff.loading")}</p>
        ) : (
          <DiffView diff={diff} />
        )}
      </div>
    </div>
  );
}

/**
 * The preview body area: the AV-gated viewer + the floating prev/next arrows +
 * (for the editor) a full-stage diff overlay. The dark "stage" backdrop is owned
 * by the image/video viewers (the only media that benefits) — everything else
 * (audio, pdf, office, editor, unsupported, AV alerts) renders on the neutral
 * `bg-background` surface so their light-surface chrome stays legible.
 */
export function PreviewStage({
  object,
  gate,
  zoom,
  onZoomChange,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  diffFor,
  onCloseDiff,
}: {
  object: CloudObjectModel;
  gate: ScanGate;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  diffFor: { docKey: string; versionId: string } | null;
  onCloseDiff: () => void;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      <AvGate gate={gate}>
        {/* Keyed by the file so the viewer REMOUNTS per file — otherwise a heavy
            viewer (the PDF blob, the office iframe) keeps showing the previous
            file's content while the next one loads. The shell/toolbar/rail stay
            mounted (they're outside PreviewBody), so fullscreen/zoom/rail persist. */}
        <PreviewBody
          key={object.Path.Key}
          object={object}
          zoom={zoom}
          onZoomChange={onZoomChange}
        />
      </AvGate>
      <PreviewNavButtons
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={onPrev}
        onNext={onNext}
      />
      {diffFor ? (
        <StageDiffOverlay
          docKey={diffFor.docKey}
          versionId={diffFor.versionId}
          onClose={onCloseDiff}
        />
      ) : null}
    </div>
  );
}
